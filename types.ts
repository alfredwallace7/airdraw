export interface Point {
  x: number;
  y: number;
}

export interface DrawPath {
  points: Point[];
  color: string;
  width: number;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface ToolResponse {
  x: number;
  y: number;
  isDrawing: boolean;
}

export interface CameraQuality {
  id: string;
  label: string;
  width: number;
  height: number;
}
