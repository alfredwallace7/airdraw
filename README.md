# ✨ AirDraw - Draw with Your Hands in Mid-Air! 🙌

**Experience the future of digital art.** AirDraw lets you create stunning artwork using nothing but your hands and a webcam. No stylus, no mouse, no keyboard - just pure hand gestures in the air!

![AirDraw Demo](https://img.shields.io/badge/Status-Live-brightgreen) ![Hands](https://img.shields.io/badge/Hands-2-blue) ![AI](https://img.shields.io/badge/Powered%20by-MediaPipe-orange)

---

## 🎯 Features

### ✌️ **Dual-Hand Drawing**
- **Draw with BOTH hands simultaneously!** Each hand gets its own cursor and can draw independently
- Perfect for symmetrical art, collaborative drawing, or just showing off
- Hand 1: Blue cursor → Pink when drawing
- Hand 2: Lime cursor → Orange when drawing

### 🎨 **Rich Drawing Tools**
- **Pencil Tool** - Multiple brush sizes (2px - 64px) with pressure simulation
- **Eraser Tool** - Real-time erasing with instant visual feedback
- **10 Vibrant Colors** - From red to purple, including a crisp white
- **Camera Opacity Control** - Blend your video feed from 0% to 100%

### 🚀 **Performance Optimized**
- **60 FPS tracking** with MediaPipe Lite model
- **Dynamic smoothing** - Faster movements = more responsive cursor
- **Gesture stabilization** - No more jittery lines from shaky hands
- **Split canvas architecture** - Static paths cached for blazing speed
- **Real-time eraser feedback** - See what you're erasing as you erase it

### 🖐️ **Intuitive Gestures**
- **Open hand** - Move cursor (hover mode)
- **Index finger only** (others folded) - Draw/erase
- **Hover over toolbar buttons** - Point and "draw" to click them!

### 🎭 **Smart UI**
- Auto-hiding help panel when you hover over it
- Animated toolbar with smooth transitions
- Real-time hand count display
- Gesture-based UI interactions

---

## 🎬 How It Works

1. **Enable your camera** - Grant webcam permission
2. **Hold up your hand(s)** - MediaPipe tracks up to 2 hands
3. **Point with index finger** - Fold other fingers to draw
4. **Open your hand** - Stop drawing and move the cursor
5. **Use both hands** - Draw two things at once! 🤯

---

## 🛠️ Tech Stack

- **React + TypeScript** - Type-safe component architecture
- **Vite** - Lightning-fast development and builds
- **MediaPipe Hands** - Google's ML-powered hand tracking
- **Perfect Freehand** - Smooth, natural-looking strokes
- **TailwindCSS** - Beautiful, responsive UI
- **Lucide Icons** - Crisp, modern icons

---

## 🎨 Use Cases

- **Digital Art** - Create unique hand-drawn artwork
- **Presentations** - Annotate slides hands-free
- **Teaching** - Draw diagrams while explaining
- **Fun** - Just enjoy the magic of air drawing!
- **Accessibility** - Alternative input method for traditional tools

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/gemini-air-draw.git
cd gemini-air-draw

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

---

## 🎯 Tips for Best Results

- 🔆 **Good lighting** - Helps hand detection accuracy
- 📏 **Arm's length away** - Optimal distance from camera
- 🖐️ **Clear background** - Reduces false detections
- 💪 **Steady hands** - Let the stabilization help you
- ✌️ **Practice gestures** - The "pointing" gesture becomes natural quickly

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Share your artwork created with AirDraw!

---

## 📝 License

MIT License - feel free to use this project however you'd like!

---

## 🌟 Acknowledgments

- **MediaPipe** by Google - Incredible hand tracking technology
- **Perfect Freehand** by Steve Ruiz - Beautiful stroke rendering
- Built with ❤️ and lots of hand waving

---

**Ready to draw in mid-air? Let's go! 🚀✨**
