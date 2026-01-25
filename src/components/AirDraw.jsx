import React, { useMemo } from 'react';
// ... rest of imports

const AirDraw = ({ data }) => {
  // Memoize transformed points to avoid reallocations on every render
  const points = useMemo(() => {
    return data.map(p => ({ x: p.x, y: p.y }));
  }, [data]);

  // Render using points
  return (
    <svg>
      {points.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="2" />
      ))}
    </svg>
  );
};
export default React.memo(AirDraw);
