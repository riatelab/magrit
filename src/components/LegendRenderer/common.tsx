import { JSX } from 'solid-js';

export function makeLegendTitle(props): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-title">
    <text>
      <tspan
        x="10"
        y="10"
        font-size={props.fontSize}
        font-weight={props.fontWeight}
        font-style={props.fontStyle}
      >
        { props.text }
      </tspan>
    </text>
  </g>;
}

export function makeLegendSubtitle(props): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-subtitle">
    <text>
      <tspan
        x="10"
        y={props.fontSize + 10}
        font-size={props.fontSize}
        font-weight={props.fontWeight}
        font-style={props.fontStyle}
      >
        { props.text }
      </tspan>
    </text>
  </g>;
}

export function makeLegendNote(props): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-note">
    <text>
      <tspan
        x="0"
        y="0"
        font-size={props.fontSize}
        font-weight={props.fontWeight}
        font-style={props.fontStyle}
      >
        { props.text }
      </tspan>
    </text>
  </g>;
}

export const distanceBoxContent = 10;

export function computeRectangleBox(refElement: SVGElement): JSX.Element {
  const bbox = refElement.getBBox();
  const rectangleBoxLegend = refElement.querySelector('.legend-box');
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
  refElement.addEventListener('mouseenter', () => {
    const rectangleBoxLegend = refElement.querySelector('.legend-box');
    rectangleBoxLegend.setAttribute('style', 'fill: green; fill-opacity: 0.1');
  });
  refElement.addEventListener('mouseleave', () => {
    const rectangleBoxLegend = refElement.querySelector('.legend-box');
    rectangleBoxLegend.setAttribute('style', 'fill: none');
  });
}

export function bindDragBehavior(refElement: SVGElement): void {
  // Allow the user to move the refElement group
  // by dragging it on the screen.
  // To do we will change the transform attribute of the refElement group.
  // We will also change the cursor to indicate that the group is draggable.
  let isDragging = false;
  let x = 0;
  let y = 0;
  refElement.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    isDragging = true;
    x = e.clientX;
    y = e.clientY;
    refElement.style.cursor = 'grabbing'; // eslint-disable-line no-param-reassign
  });
  refElement.addEventListener('mousemove', (e) => {
    e.stopPropagation();
    if (isDragging) {
      const dx = e.clientX - x;
      const dy = e.clientY - y;
      const transform = refElement.getAttribute('transform');
      const translate = transform
        .replace(/translate\((.*),(.*)\)/, (match, p1, p2) => `translate(${Number(p1) + dx},${Number(p2) + dy})`);
      refElement.setAttribute('transform', translate);
      x = e.clientX;
      y = e.clientY;
    }
  });
  refElement.addEventListener('mouseup', (e) => {
    e.stopPropagation();
    isDragging = false;
    refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
  });
}
