// Import from solid-js
import {
  createEffect,
  type JSX,
  on,
  onMount,
} from 'solid-js';

// Helpers
import {
  bindElementsLayoutFeature,
  computeRectangleBox,
  makeLayoutFeaturesSettingsModal,
  RectangleBox,
  triggerContextMenuLayoutFeature,
} from './common.tsx';
import { useI18nContext } from '../../i18n/i18n-solid';

// Types / Interfaces / Enums
import type { Rectangle } from '../../global';

export default function RectangleRenderer(props: Rectangle): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindElementsLayoutFeature(refElement, props);
  });

  createEffect(
    on(
      () => [props.width, props.height, props.rotation, props.cornerRadius],
      () => {
        computeRectangleBox(refElement);
      },
    ),
  );

  return <g
    ref={refElement!}
    id={props.id.replace('LayoutFeature', 'LayoutFeature-Rectangle')}
    class="layout-feature rectangle"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, true, true, LL);
    }}
    onDblClick={() => { makeLayoutFeaturesSettingsModal(props.id, LL); }}
    transform={`translate(${props.position[0]}, ${props.position[1]})`}
  >
    <rect
      x={0}
      y={0}
      width={props.width}
      height={props.height}
      fill={props.fillColor}
      fill-opacity={props.fillOpacity}
      stroke={props.strokeColor}
      stroke-width={props.strokeWidth}
      stroke-opacity={props.strokeOpacity}
      rx={props.cornerRadius}
      ry={props.cornerRadius}
      transform={props.rotation ? `rotate(${props.rotation} ${props.width / 2} ${props.height / 2})` : undefined}
    ></rect>
    <RectangleBox backgroundRect={{ visible: false }} />
  </g>;
}
