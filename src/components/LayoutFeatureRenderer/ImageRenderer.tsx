// Import from solid-js
import {
  createEffect,
  type JSX,
  on,
  onMount,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  bindElementsLayoutFeature,
  computeRectangleBox,
  makeLayoutFeaturesSettingsModal,
  RectangleBox,
  triggerContextMenuLayoutFeature,
} from './common.tsx';
import { setSvgProperties } from '../../helpers/sanitize-svg';

// Types / Interfaces / Enums
import type { Image } from '../../global';

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
    id={props.id.replace('LayoutFeature', 'LayoutFeature-Image')}
    class="layout-feature image"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, true, false, LL);
    }}
    onDblClick={() => {
      makeLayoutFeaturesSettingsModal(props.id, LL);
    }}
    transform={`translate(${props.position[0]}, ${props.position[1]})`}
  >
    <g
      transform={props.rotation !== 0 ? `rotate(${props.rotation} ${props.size / 2} ${props.size / 2})` : undefined}
    >
      <image
        width={props.size}
        height={props.size}
        href={
          props.imageType === 'SVG'
            ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(setSvgProperties(props))))}`
            : props.content
        }
      />
    </g>
    <RectangleBox backgroundRect={props.backgroundRect}/>
  </g>;
}
