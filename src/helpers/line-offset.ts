/*
Utils for offsetting a line, in order to render
A => B links and B => A links in slightly different positions
*/

const reflexAngle = (angle: number) => {
  if (angle > Math.PI) return angle - 2 * Math.PI;
  if (angle < -Math.PI) return angle + 2 * Math.PI;
  return angle;
};

const findVt = (
  u1: [number, number],
  u2: [number, number],
  v1: [number, number],
  v2: [number, number],
): number => {
  const dx = v1[0] - u1[0];
  const dy = v1[1] - u1[1];
  const ux = u2[0] - u1[0];
  const uy = u2[1] - u1[1];
  const vx = v2[0] - v1[0];
  const vy = v2[1] - v1[1];
  const up = ux * dy - dx * uy;
  const dn = vx * uy - ux * vy;
  return up / dn;
};

const findUt = (
  u1: [number, number],
  u2: [number, number],
  v1: [number, number],
  v2: [number, number],
  vt: number,
): number => {
  const dx = v1[0] - u1[0];
  const dy = v1[1] - u1[1];
  const ux = u2[0] - u1[0];
  const uy = u2[1] - u1[1];
  const vx = v2[0] - v1[0];
  const vy = v2[1] - v1[1];

  // the first line is not vertical
  if (ux < -1e-6 || ux > 1e-6) {
    return (vt * vx + dx) / ux;
  }
  // the first line is not horizontal
  if (uy < -1e-6 || uy > 1e-6) {
    return (vt * vy + dy) / uy;
  }

  return (vt * vx + dx) / ux;
};
