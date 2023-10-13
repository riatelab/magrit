// Import from solid-js
import { type JSX, onMount } from 'solid-js';

// Helpers
import { bindDragBehavior, triggerContextMenuLayoutFeature } from './common.tsx';
import { useI18nContext } from '../../i18n/i18n-solid';

// Types / Interfaces / Enums
import type { FreeDrawing } from '../../global.d';

export default function FreeDrawingRenderer(props: FreeDrawing): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindDragBehavior(refElement, props);
  });

  return <g
    ref={refElement}
    class="layout-feature free-drawing"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, LL);
    }}
  >
    <path
      stroke={props.strokeColor}
      stroke-opacity={props.strokeOpacity}
      stroke-width={props.strokeWidth}
      fill="none"
      d={props.path}
      transform={`translate(${props.position[0]}, ${props.position[1]})`}
    ></path>
  </g>;
}
