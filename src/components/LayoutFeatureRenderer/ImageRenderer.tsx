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

// Types / Interfaces / Enums
import type { Image } from '../../global';

const createCustomViewBox = (content: string): string | undefined => {
  const width = content.match(/width="(\d+(\.\d+)?)"/)?.[1];
  const height = content.match(/height="(\d+(\.\d+)?)"/)?.[1];
  return (width && height) ? `0 0 ${width} ${height}` : undefined;
};

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
      transform={props.rotation !== 0 ? `rotate(${props.rotation} ${props.size / 2} ${props.size / 2})` : undefined}
      fill={props.fillColor}
      fill-opacity={props.fillOpacity}
      stroke={props.strokeColor}
      stroke-opacity={props.strokeOpacity}
      stroke-width={props.strokeWidth}
    >
      {
        props.imageType === 'SVG'
          ? <svg
            // eslint-disable-next-line solid/no-innerhtml
              innerHTML={props.content}
              viewBox={createCustomViewBox(props.content)}
              width={props.size}
              height={props.size}
            />
          : <image width={props.size} height={props.size} href={props.content} />
      }
    </g>
    <RectangleBox backgroundRect={props.backgroundRect} />
  </g>;
}
