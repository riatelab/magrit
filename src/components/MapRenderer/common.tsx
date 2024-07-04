// Stores
import { setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { globalStore } from '../../store/GlobalStore';

// Types etc.
import type { LabelsParameters, LayerDescription, ProportionalSymbolsParameters } from '../../global';

export function bindDragBehavior(
  element: SVGElement,
  layer: LayerDescription,
  ix: number,
): void {
  // Find the parent SVG element and listen to mousemove and mouseup events on it
  // instead of the 'element' group, because the mouse can move faster than
  // the mousemove event is triggered, and we want to be able to move the
  // element group even if the mouse is not over it.
  let outerSvg: SVGSVGElement;
  let elem: Element = element.parentElement as Element;
  while (true) {
    if (elem.tagName.toLowerCase() === 'svg') {
      outerSvg = elem as SVGSVGElement;
      break;
    } else {
      elem = elem.parentElement as Element;
    }
  }

  const redDot = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  redDot.setAttribute('width', '5');
  redDot.setAttribute('height', '5');
  redDot.style.fill = 'red';
  redDot.style.stroke = 'black';

  // Variables used to compute the new position of the element and the transform attribute
  let x = 0;
  let y = 0;
  let positionX;
  let positionY;
  let cdx;
  let cdy;

  const moveElement = (e: MouseEvent) => {
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    // Update the cumulative displacement of the element
    cdx += dx;
    cdy += dy;

    // Update the position of the element
    positionX += dx;
    positionY += dy;

    // Update the position of the mouse
    x = e.clientX;
    y = e.clientY;

    // Update the transform attribute of the element
    element.setAttribute('transform', `translate(${cdx}, ${cdy})`);
  };

  const deselectElement = () => {
    // Compute the new (geo) coordinates of the element
    const newCoordinates = globalStore.projection.invert([positionX, positionY]);

    // Update the coordinates of the element in the layersDescriptionStore
    setLayersDescriptionStore(
      'layers',
      (l: LayerDescription) => l.id === layer.id,
      'data',
      'features',
      ix,
      'geometry',
      'coordinates',
      newCoordinates,
    );

    // Reset the transform attribute of the element (since we have updated the coordinates)
    element.removeAttribute('transform');

    // Reset the cursor style
    element.style.cursor = null; // eslint-disable-line no-param-reassign
    outerSvg.style.cursor = 'default'; // eslint-disable-line no-param-reassign

    // Remove all the event listeners on the parent SVG element
    outerSvg.removeEventListener('mousemove', moveElement);
    outerSvg.removeEventListener('mouseup', deselectElement);

    // Remove the red dot that was displayed at the original position of the element
    outerSvg.removeChild(redDot);
  };

  element.addEventListener('mousedown', (e) => {
    // If the layer is not movable, we return immediately
    if (
      !(layer.rendererParameters as ProportionalSymbolsParameters | LabelsParameters).movable
    ) return;

    // Dragging only occurs when the user
    // clicks with the main mouse button (usually the left one).
    // If the mousedown is triggered by another button, we return immediately.
    if (e.button > 1) return;
    e.stopPropagation();

    // Initialize the position of the mouse
    // and the cumulative displacement of the element
    x = e.clientX;
    y = e.clientY;
    cdx = 0;
    cdy = 0;

    // Get the initial position of the element in pixel coordinates
    [positionX, positionY] = globalStore.projection(layer.data.features[ix].geometry.coordinates);

    // Listen on events on the parent SVG element
    outerSvg.addEventListener('mousemove', moveElement);
    outerSvg.addEventListener('mouseup', deselectElement);

    // Cursor style
    // First change the cursor of the element to grabbing
    element.style.cursor = 'grabbing'; // eslint-disable-line no-param-reassign
    // Then change the cursor of the parent SVG element to grabbing
    // (so that the cursor stays in grabbing state even if the mouse is not over the element)
    outerSvg.style.cursor = 'grabbing'; // eslint-disable-line no-param-reassign

    // Display a red dot at the original position of the element
    const [xOriginal, yOriginal] = globalStore.projection(
      layer.data.features[ix].geometry.originalCoordinates,
    );
    redDot.setAttribute('x', `${xOriginal - (5 / 2)}`);
    redDot.setAttribute('y', `${yOriginal - (5 / 2)}`);
    outerSvg.appendChild(redDot);
  });
}

export function mergeFilterIds(layerDescription: LayerDescription): string | undefined {
  const ids = [];
  if (layerDescription.dropShadow) {
    ids.push(`url(#filter-drop-shadow-${layerDescription.id})`);
  }
  return ids.length > 0 ? ids.join(' ') : undefined;
}
