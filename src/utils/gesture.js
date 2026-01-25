// Old implementation used array.find
// const findGesture = name => gestures.find(g => g.name === name);

const gestureMap = new Map();
gestures.forEach(g => gestureMap.set(g.name, g));
export const findGesture = name => gestureMap.get(name);