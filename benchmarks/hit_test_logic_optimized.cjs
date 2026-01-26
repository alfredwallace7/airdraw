
const isDrawingHandsRef = { current: [false, false] };
const currentPathsRef = { current: [null, null] };
const clickCooldown = { current: false };
let elementFromPointCalls = 0;

// Mock document
const document = {
  elementFromPoint: () => {
    elementFromPointCalls++;
    return null;
  }
};

function onResultsLike() {
  // NEW LOGIC: Capture previous
  const wasDrawingHand0 = isDrawingHandsRef.current[0];

  // Simulate processing (update state)
  isDrawingHandsRef.current[0] = true;

  const isDrawingHand0 = isDrawingHandsRef.current[0];

  // NEW LOGIC from App.tsx
  if (isDrawingHand0 && !wasDrawingHand0 && !clickCooldown.current) {
    document.elementFromPoint(0, 0);
  }
}

console.log("Simulating 20 frames of drawing stroke...");
// Run 20 frames of "drawing"
for (let i = 0; i < 20; i++) {
  onResultsLike();
}

console.log("Total elementFromPoint calls:", elementFromPointCalls);
if (elementFromPointCalls === 1) {
    console.log("Success: Calls reduced to single rising edge event.");
} else {
    console.log("Failure: Calls count is " + elementFromPointCalls);
}
