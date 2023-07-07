import { JSX } from 'solid-js';
import { LegendTextElement } from '../../global';

export function makeLegendTitle(props: LegendTextElement): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-title">
    <text style={{ 'user-select': 'none' }}>
      <tspan
        x="10"
        y="10"
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

export function makeLegendSubtitle(props: LegendTextElement): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-subtitle">
    <text style={{ 'user-select': 'none' }}>
      <tspan
        x="10"
        y={props.fontSize + 10}
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

export function makeLegendNote(props: LegendTextElement): JSX.Element {
  if (!props) return <></>;
  return <g class="legend-note">
    <text style={{ 'user-select': 'none' }}>
      <tspan
        x="0"
        y="0"
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
  refElement.addEventListener('mouseenter', () => {
    const rectangleBoxLegend = refElement.querySelector('.legend-box') as SVGRectElement;
    rectangleBoxLegend.setAttribute('style', 'fill: green; fill-opacity: 0.1');
  });
  refElement.addEventListener('mouseleave', () => {
    const rectangleBoxLegend = refElement.querySelector('.legend-box') as SVGRectElement;
    rectangleBoxLegend.setAttribute('style', 'fill-opacity: 0');
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
      // transform is not null because we create every legend group with a transform attribute
      const transform = refElement.getAttribute('transform') as string;
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
