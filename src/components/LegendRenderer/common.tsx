import { JSX } from 'solid-js';
import { setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { LayerDescription, LegendTextElement } from '../../global';

export function makeLegendTitle(
  props: LegendTextElement,
  position: [number, number],
): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-title">
    <text style={{ 'user-select': 'none' }}>
      <tspan
        x={position[0]}
        y={position[1]}
        font-size={props.fontSize}
        font-weight={props.fontWeight}
        font-style={props.fontStyle}
        pointer-events={'none'}
      >
        { props.text }
      </tspan>
    </text>
  </g>;
}

export function makeLegendSubtitle(
  props: LegendTextElement,
  position: [number, number],
): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-subtitle">
    <text style={{ 'user-select': 'none' }}>
      <tspan
        x={position[0]}
        y={position[1]}
        font-size={props.fontSize}
        font-weight={props.fontWeight}
        font-style={props.fontStyle}
        pointer-events={'none'}
      >
        { props.text }
      </tspan>
    </text>
  </g>;
}

export function makeLegendNote(
  props: LegendTextElement,
  position: [number, number],
): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-note">
    <text style={{ 'user-select': 'none' }}>
      <tspan
        x={position[0]}
        y={position[1]}
        font-size={props.fontSize}
        font-weight={props.fontWeight}
        font-style={props.fontStyle}
        pointer-events={'none'}
      >
        { props.text }
      </tspan>
    </text>
  </g>;
}

export const distanceBoxContent = 10;

export function computeRectangleBox(refElement: SVGElement) {
  const bbox = refElement.getBBox();
  const rectangleBoxLegend = refElement.querySelector('.legend-box') as SVGElement;
  rectangleBoxLegend.setAttribute('width', `${bbox.width + distanceBoxContent * 2}px`);
  rectangleBoxLegend.setAttribute('height', `${bbox.height + distanceBoxContent * 2}px`);
  rectangleBoxLegend.setAttribute('x', `${bbox.x - distanceBoxContent}px`);
  rectangleBoxLegend.setAttribute('y', `${bbox.y - distanceBoxContent}px`);
}

export function makeRectangleBox(width = 0, height = 0): JSX.Element {
  return <rect
    class={'legend-box'}
    style={{ fill: 'green', 'fill-opacity': '0' }}
    x={0}
    y={0}
    width={width}
    height={height}
  />;
}

export function bindMouseEnterLeave(refElement: SVGElement): void {
  // Color the .legend-box element when the mouse is over the refElement group
  refElement.addEventListener('mouseover', () => {
    const rectangleBoxLegend = refElement.querySelector('.legend-box') as SVGRectElement;
    rectangleBoxLegend.setAttribute('style', 'fill: green; fill-opacity: 0.1');
  });
  refElement.addEventListener('mouseleave', () => {
    const rectangleBoxLegend = refElement.querySelector('.legend-box') as SVGRectElement;
    rectangleBoxLegend.setAttribute('style', 'fill-opacity: 0');
  });
}

export function bindDragBehavior(refElement: SVGElement, layer: LayerDescription): void {
  // Allow the user to move the refElement group
  // by dragging it on the screen.
  // To do we will change the transform attribute of the refElement group.
  // We will also change the cursor to indicate that the group is draggable.
  let x = 0;
  let y = 0;
  // let isDragging = false;
  let outerSvg;
  let elem;

  const moveElement = (e) => {
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    setLayersDescriptionStore(
      'layers',
      (l) => l.id === layer.id,
      'legend',
      {
        position: [
          layer.legend.position[0] + dx,
          layer.legend.position[1] + dy,
        ],
      },
    );

    x = e.clientX;
    y = e.clientY;
  };

  const deselectElement = () => {
    refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
    outerSvg.style.cursor = null; // eslint-disable-line no-param-reassign
    outerSvg.removeEventListener('mousemove', moveElement);
    outerSvg.removeEventListener('mouseup', deselectElement);
  };

  refElement.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    // isDragging = true;
    x = e.clientX;
    y = e.clientY;

    elem = refElement;
    // Find the parent SVG element and listen to mousemove and mouseup events on it
    // instead of the refElement group, because the mouse can move faster than
    // the mousemove event is triggered, and we want to be able to move the
    // refElement group even if the mouse is not over it.
    while (true) {
      if (elem.tagName.toLowerCase() === 'svg') {
        outerSvg = elem;
        break;
      } else {
        elem = elem.parentElement;
      }
    }
    // Listen on events on the parent SVG element
    outerSvg.addEventListener('mousemove', moveElement);
    outerSvg.addEventListener('mouseup', deselectElement);
    // Cursor style
    outerSvg.style.cursor = 'grabbing'; // eslint-disable-line no-param-reassign
    // Maybe we should disable pointer events on the refElement group ?
    // For now we will keep them enabled (so that we can keep
    // the green color of the legend box when the mouse is over it when dragging)
    // In case we remove pointer events here, we should
    // put them back when the mouse is released (in deselectElement)
  });

  // refElement.addEventListener('mousemove', (e) => {
  //   e.stopPropagation();
  //   if (isDragging) {
  //     const dx = e.clientX - x;
  //     const dy = e.clientY - y;
  //
  //     // Store the new position of the legend,
  //     // it will update the transform attribute of the refElement group.
  //     setLayersDescriptionStore(
  //       'layers',
  //       (l) => l.id === layer.id,
  //       'legend',
  //       {
  //         position: [
  //           layer.legend.position[0] + dx,
  //           layer.legend.position[1] + dy,
  //         ],
  //       },
  //     );
  //     x = e.clientX;
  //     y = e.clientY;
  //   }
  // });
  //
  // refElement.addEventListener('mouseup', (e) => {
  //   console.log('mouseup triggered');
  //   e.stopPropagation();
  //   isDragging = false;
  //   refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
  // });
}

// Determine the size of an SVG text element before displaying it
export function getTextSize(
  text: string,
  fontSize: string,
  fontFamily: string,
): { width: number, height: number } {
  // Create an element to measure the text
  const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  elem.style.visibility = 'hidden';
  elem.setAttribute('font-size', fontSize);
  elem.setAttribute('font-family', fontFamily);
  elem.innerHTML = text;
  // Add the element to the DOM (but it is invisible)
  (document.querySelector('svg.map-zone__map') as SVGElement).appendChild(elem);
  // Compute the size of the text
  const bb = elem.getBBox();
  // Remove the element from the DOM
  elem.remove();
  return { width: bb.width, height: bb.height };
}
