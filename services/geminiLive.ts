import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';
import { decode, decodeAudioData } from '../utils/encoding';

// Define the tool for tracking
const updatePointerTool: FunctionDeclaration = {
  name: 'updatePointer',
  parameters: {
    type: Type.OBJECT,
    description: 'Updates the cursor position and drawing state based on hand tracking.',
    properties: {
      x: {
        type: Type.NUMBER,
        description: 'X coordinate (0-100) of the index finger tip.',
      },
      y: {
        type: Type.NUMBER,
        description: 'Y coordinate (0-100) of the index finger tip.',
      },
      isDrawing: {
        type: Type.BOOLEAN,
        description: 'True if index finger and thumb are pinched together, False otherwise.',
      },
    },
    required: ['x', 'y', 'isDrawing'],
  },
};

interface GeminiLiveProps {
  onPointerUpdate: (x: number, y: number, isDrawing: boolean) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: string) => void;
}

export class GeminiLiveService {
  private client: GoogleGenAI;
  private session: any = null; // Session type isn't fully exported in simple form, using any for internal handling
  private onPointerUpdate: (x: number, y: number, isDrawing: boolean) => void;
  private onConnect: () => void;
  private onDisconnect: () => void;
  private onError: (error: string) => void;
  private audioContext: AudioContext | null = null;

  constructor({ onPointerUpdate, onConnect, onDisconnect, onError }: GeminiLiveProps) {
    this.client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.onPointerUpdate = onPointerUpdate;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onError = onError;
  }

  async connect() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      this.session = await this.client.live.connect({
        model: MODEL_NAME,
        callbacks: {
          onopen: async () => {
            console.log('Gemini Live Connection Opened');
            this.onConnect();
          },
          onmessage: async (message: LiveServerMessage) => {
            this.handleMessage(message);
          },
          onclose: () => {
            console.log('Gemini Live Connection Closed');
            this.onDisconnect();
            this.cleanup();
          },
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live Error', e);
            this.onError('Connection error occurred.');
            this.cleanup();
          },
        },
        config: {
          responseModalities: [Modality.TEXT], // We mostly want tool calls, but audio is the required modality for live
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: [updatePointerTool] }],
        },
      });

      // Send a text prompt to kickstart the model
      await this.session.sendRealtimeInput({
        content: [{ text: "Start tracking immediately." }]
      });

    } catch (error: any) {
      console.error("Connection failed", error);
      this.onError(error.message || "Failed to connect to Gemini");
      this.cleanup();
    }
  }

  private async handleMessage(message: LiveServerMessage) {
    // 1. Handle Tool Calls (The core of our app)
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === 'updatePointer') {
          const { x, y, isDrawing } = fc.args as any;
          this.onPointerUpdate(x, y, !!isDrawing);

          // Send response back to acknowledge (required by protocol)
          // We assume success immediately to keep latency low
          this.session.sendToolResponse({
            functionResponses: {
              id: fc.id,
              name: fc.name,
              response: { result: "ok" },
            },
          });
        }
      }
    }

    // 2. Handle Audio (If the model speaks "I can't see your hand", etc.)
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.audioContext) {
      try {
        const audioBuffer = await decodeAudioData(
          decode(base64Audio),
          this.audioContext,
          24000,
          1
        );
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        source.start();
      } catch (e) {
        // Ignore audio decoding errors for smoother UX if audio is glitchy
      }
    }
  }

  async sendVideoFrame(base64Data: string) {
    if (this.session) {
      try {
        await this.session.sendRealtimeInput({
          media: {
            mimeType: 'image/jpeg',
            data: base64Data,
          },
        });
      } catch (e) {
        console.error("Error sending frame:", e);
      }
    } else {
      console.warn("Session is null, cannot send frame");
    }
  }

  async disconnect() {
    // There is no explicit .close() on the session object in some versions, 
    // but usually closing the socket is handled by the library or by the browser unload.
    // We will just nullify references and close audio context.
    this.cleanup();
  }

  private cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.session = null;
  }
}