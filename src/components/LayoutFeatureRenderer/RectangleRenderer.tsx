// Import from solid-js
import { type JSX, onMount } from 'solid-js';

// Helpers
import { bindDragBehavior, triggerContextMenuLayoutFeature } from './common.tsx';
import { useI18nContext } from '../../i18n/i18n-solid';

// Types / Interfaces / Enums
import type { Rectangle } from '../../global.d';

export default function RectangleRenderer(props: Rectangle): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindDragBehavior(refElement, props);
  });

  return <g
    ref={refElement}
    class="layout-feature rectangle"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, LL);
    }}
  >
    <rect
      x={props.position[0]}
      y={props.position[1]}
      width={props.width}
      height={props.height}
      fill={props.fillColor}
      fill-opacity={props.fillOpacity}
      stroke={props.strokeColor}
      stroke-width={props.strokeWidth}
      stroke-opacity={props.strokeOpacity}
      rx={props.cornerRadius}
      ry={props.cornerRadius}
      // transform-box="fill-box"
      // transform-origin="center"
      transform={props.rotation ? `rotate(${props.rotation} ${props.position[0] + props.width / 2} ${props.position[1] + props.height / 2})` : undefined}
    ></rect>
  </g>;
}
