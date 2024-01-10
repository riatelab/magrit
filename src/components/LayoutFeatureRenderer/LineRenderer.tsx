// Import from solid-js
import { type JSX, onMount } from 'solid-js';

// Helpers
import {
  bindDragBehavior, bindElementsLayoutFeature,
  makeLayoutFeaturesSettingsModal, RectangleBox,
  triggerContextMenuLayoutFeature,
} from './common.tsx';
import { useI18nContext } from '../../i18n/i18n-solid';

// Types / Interfaces / Enums
import type { Line } from '../../global';

export default function LineRenderer(props: Line): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindElementsLayoutFeature(refElement, props);
  });

  return <g
    ref={refElement!}
    class="layout-feature line"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, LL);
    }}
    onDblClick={() => { makeLayoutFeaturesSettingsModal(props.id, LL); }}
    transform={`translate(${props.position[0]}, ${props.position[1]})`}
  >
    <RectangleBox backgroundRect={props.backgroundRect} />
    <path
      stroke={props.strokeColor}
      stroke-opacity={props.strokeOpacity}
      stroke-width={props.strokeWidth}
      fill="none"
      marker-end={props.arrow ? 'url(#arrow-head)' : undefined}
      d={`M ${props.points.map((p) => `${p[0]},${p[1]}`).join(' L ')}`}
    ></path>
  </g>;
}
