export const createDropShadow = function createDropShadow(layerId: string) {
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', `filter-drop-shadow-${layerId}`);
  // filter.setAttribute("x", 0);
  // filter.setAttribute("y", 0);
  filter.setAttribute('width', '200%');
  filter.setAttribute('height', '200%');

  const offset = document.createElementNS('http://www.w3.org/2000/svg', 'feOffset');
  offset.setAttributeNS(null, 'result', 'offOut');
  offset.setAttributeNS(null, 'in', 'SourceAlpha');
  offset.setAttributeNS(null, 'dx', '5');
  offset.setAttributeNS(null, 'dy', '5');

  const gaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
  gaussianBlur.setAttributeNS(null, 'result', 'blurOut');
  gaussianBlur.setAttributeNS(null, 'in', 'offOut');
  gaussianBlur.setAttributeNS(null, 'stdDeviation', '10');

  const blend = document.createElementNS('http://www.w3.org/2000/svg', 'feBlend');
  blend.setAttributeNS(null, 'in', 'SourceGraphic');
  blend.setAttributeNS(null, 'in2', 'blurOut');
  blend.setAttributeNS(null, 'mode', 'normal');

  filter.appendChild(offset);
  filter.appendChild(gaussianBlur);
  filter.appendChild(blend);

  return filter;
};

export const noop2 = () => {};
