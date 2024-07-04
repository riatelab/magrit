import d3 from './d3-custom';

export function applyTransformTransition(
  element: SVGElement,
  targetTransform: string,
  duration: number,
) {
  // Cancel any ongoing transitions
  d3.interrupt(element, 'attr.transform');

  // Define the transition
  const t = d3.transition()
    .duration(duration)
    .ease(d3.easeSinOut);

  // Get the initial transform value (assuming it could be anything)
  const initialTransform = element.getAttribute('transform') || '';

  // Define the tween function for interpolating the transform
  t.tween('attr.transform', () => {
    const interpolate = d3.interpolateString(initialTransform, targetTransform);
    return (tt: number) => {
      element.setAttribute('transform', interpolate(tt));
    };
  });
}

export function noop() {
  return undefined;
}
