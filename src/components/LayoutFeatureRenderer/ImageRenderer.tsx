// Import from solid-js
import {
  createEffect,
  type JSX,
  on,
  onMount,
} from 'solid-js';

// Stores
import { globalStore } from '../../store/GlobalStore';
import { setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { mapStore } from '../../store/MapStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  bindElementsLayoutFeature,
  computeRectangleBox,
  makeLayoutFeaturesSettingsModal,
  RectangleBox,
  triggerContextMenuLayoutFeature,
} from './common.tsx';

// Types / Interfaces / Enums
import type { LayoutFeature, Image } from '../../global';

export default function ImageRenderer(props: Image): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindElementsLayoutFeature(refElement, props);
  });

  // We need to recompute the rectangle box when following properties change
  createEffect(
    on(
      () => [props.size, props.rotation],
      () => {
        computeRectangleBox(refElement);
      },
    ),
  );

  return <g
    ref={refElement!}
    class="layout-feature image"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, true, false, LL);
    }}
    onDblClick={() => { makeLayoutFeaturesSettingsModal(props.id, LL); }}
  transform={`translate(${props.position[0]}, ${props.position[1]})`}
  >
    <g
      transform={`rotate(${props.rotation} ${props.size / 2} ${props.size / 2})`}
      fill={props.fillColor}
      fill-opacity={props.fillOpacity}
      stroke={props.strokeColor}
      stroke-opacity={props.strokeOpacity}
      stroke-width={props.strokeWidth}
    >
      {
        props.imageType === 'SVG'
          // eslint-disable-next-line solid/no-innerhtml
          ? <svg width={props.size} height={props.size} innerHTML={props.content} />
          : <image href={props.content} width={props.size} height={props.size} />
      }
    </g>
    <RectangleBox backgroundRect={props.backgroundRect} />
  </g>;
}
