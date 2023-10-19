// Import from solid-js
import { type JSX, onMount } from 'solid-js';

// Helpers
import { bindDragBehavior, makeLayoutFeaturesSettingsModal, triggerContextMenuLayoutFeature } from './common.tsx';
import { useI18nContext } from '../../i18n/i18n-solid';

// Types / Interfaces / Enums
import type { Ellipse } from '../../global.d';

export default function EllipseRenderer(props: Ellipse): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindDragBehavior(refElement, props);
  });

  return <g
    ref={refElement}
    class="layout-feature ellipse"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, LL);
    }}
    onDblClick={() => { makeLayoutFeaturesSettingsModal(props.id, LL); }}
  >
    <ellipse
      cx={props.position[0]}
      cy={props.position[1]}
      rx={props.rx}
      ry={props.ry}
      fill={props.fillColor}
      fill-opacity={props.fillOpacity}
      stroke={props.strokeColor}
      stroke-width={props.strokeWidth}
      stroke-opacity={props.strokeOpacity}
      transform={props.rotation ? `rotate(${props.rotation} ${props.position[0]} ${props.position[1]})` : undefined}
    ></ellipse>
  </g>;
}
