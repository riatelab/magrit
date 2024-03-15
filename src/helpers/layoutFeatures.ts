// Import from third-party libraries
import { v4 as uuidv4 } from 'uuid';

// Helpers
import { getTargetSvg } from './svg';
import { Mabs, Msqrt } from './math';

import { type LayoutFeature, type Legend, LayoutFeatureType } from '../global.d';

export const isLayoutFeature = (obj: LayoutFeature | Legend): boolean => Object
  .values(LayoutFeatureType)
  .includes((obj as LayoutFeature).type);

const makeTemporaryPoint = (x: number, y: number) => {
  const widthPoint = 5;
  const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  elem.classList.add('temporary-point');
  elem.setAttribute('x', `${x - widthPoint / 2}`);
  elem.setAttribute('y', `${y - widthPoint / 2}`);
  elem.setAttribute('width', `${widthPoint}`);
  elem.setAttribute('height', `${widthPoint}`);
  elem.setAttribute('fill', 'red');
  return elem;
};

export const generateIdLayoutFeature = () => `LayoutFeature-${uuidv4()}`;

export const addTemporaryPoint = (x: number, y: number) => {
  const svgElement = getTargetSvg();
  svgElement.appendChild(makeTemporaryPoint(x, y));
};

export const removeTemporaryLines = () => {
  const svgElement = getTargetSvg();
  svgElement.querySelectorAll('.temporary-line').forEach((elem) => elem.remove());
};

export const drawTemporaryLine = (points: [number, number][]) => {
  const svgElement = getTargetSvg();
  const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  lineElement.classList.add('temporary-line');
  lineElement.classList.add('confirmed');
  lineElement.setAttribute('points', points.map((p) => `${p[0]},${p[1]}`).join(' '));
  lineElement.setAttribute('stroke', 'black');
  lineElement.setAttribute('stroke-width', '2');
  lineElement.setAttribute('fill', 'none');
  svgElement.appendChild(lineElement);
};

export const drawSuggestionLine = (
  points: [[number, number], [number, number]],
) => {
  const svgElement = getTargetSvg();
  svgElement.querySelectorAll('.suggested').forEach((elem) => elem.remove());
  const lineElement = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  lineElement.classList.add('temporary-line');
  lineElement.classList.add('suggested');
  lineElement.setAttribute('points', points.map((p) => `${p[0]},${p[1]}`).join(' '));
  lineElement.setAttribute('stroke', 'black');
  lineElement.setAttribute('stroke-width', '2');
  lineElement.setAttribute('stroke-dasharray', '5, 5');
  lineElement.setAttribute('fill', 'none');
  svgElement.appendChild(lineElement);
};

export const getSvgCoordinates = (svgElement: SVGSVGElement, ev: MouseEvent) => {
  // Get click coordinates in screen space
  const pt = svgElement.createSVGPoint();
  pt.x = ev.clientX;
  pt.y = ev.clientY;

  // Transform the screen coordinates into the svg coordinates
  return pt.matrixTransform(svgElement.getScreenCTM()!.inverse());
};

export const snapToNearestAngle = (
  lastPt: [number, number],
  cursorPt: { x: number, y: number },
  snapAngle: number,
) => {
  // We want to calculate the angle between the last point and the cursor
  // and snap the cursor to the nearest {snapAngle}° angle
  const dx = cursorPt.x - lastPt[0];
  const dy = cursorPt.y - lastPt[1];
  const angle = Math.atan2(dy, dx);
  const angleInDegrees = angle * (180 / Math.PI);
  const angleInDegreesNormalized = (angleInDegrees + 360) % 360;
  const angleInDegreesNormalizedMod15 = angleInDegreesNormalized % snapAngle;
  const angleInDegreesNormalizedMod15Rounded = Math.round(
    angleInDegreesNormalizedMod15 / snapAngle,
  ) * snapAngle;
  const angleInDegreesNormalizedRounded = angleInDegreesNormalized
    - angleInDegreesNormalizedMod15 + angleInDegreesNormalizedMod15Rounded;
  const angleInRadiansRounded = angleInDegreesNormalizedRounded * (Math.PI / 180);
  const distance = Msqrt(Mabs(dx) ** 2 + Mabs(dy) ** 2);
  return {
    x: lastPt[0] + distance * Math.cos(angleInRadiansRounded),
    y: lastPt[1] + distance * Math.sin(angleInRadiansRounded),
  };
};
