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
import type { BackgroundRect, FreeDrawing } from '../../global.d';

export default function FreeDrawingRenderer(props: FreeDrawing): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindElementsLayoutFeature(refElement!, props);
  });

  createEffect(
    on(
      () => props.strokeWidth,
      () => {
        computeRectangleBox(refElement!);
      },
    ),
  );

  return <g
    ref={refElement!}
    id={props.id.replace('LayoutFeature', 'LayoutFeature-FreeDrawing')}
    class="layout-feature free-drawing"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, true, false, LL);
    }}
    onDblClick={() => { makeLayoutFeaturesSettingsModal(props.id, LL); }}
    transform={`translate(${props.position[0]}, ${props.position[1]})`}
  >
    <path
      stroke={props.strokeColor}
      stroke-opacity={props.strokeOpacity}
      stroke-width={props.strokeWidth}
      fill="none"
      d={props.path}
    ></path>
    <RectangleBox backgroundRect={{ visible: false } as BackgroundRect} />
  </g>;
}
