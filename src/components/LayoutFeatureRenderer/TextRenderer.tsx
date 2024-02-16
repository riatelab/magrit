// Import from solid-js
import {
  createEffect,
  For,
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
import type { Text } from '../../global';

// We only use it internally, this is the start of the coordinate system
// for this layout feature
export const initialPosition = 0;

export default function TextRenderer(props: Text): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindElementsLayoutFeature(refElement, props);
  });

  createEffect(
    on( // We need to recompute the rectangle box when following properties change
      () => [props.fontSize, props.text, props.rotation, props.textAnchor],
      () => {
        computeRectangleBox(refElement);
      },
    ),
  );

  return <g
    ref={refElement!}
    class="layout-feature text"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, true, false, LL);
    }}
    onDblClick={() => { makeLayoutFeaturesSettingsModal(props.id, LL); }}
    transform={`translate(${props.position[0]}, ${props.position[1]})`}
  >
    <text
      style={{ 'user-select': 'none' }}
      font-size={props.fontSize}
      font-family={props.fontFamily}
      fill={props.fontColor}
      opacity={props.fontOpacity}
      font-style={props.fontStyle}
      font-weight={props.fontWeight}
      text-anchor={props.textAnchor}
      pointer-events={'none'}
      transform={props.rotation !== 0 ? `rotate(${props.rotation})` : undefined}
      dominant-baseline={'hanging'}
    >
      <For each={props.text!.split('\n')}>
        {(line, i) => <tspan
            x={initialPosition}
            y={initialPosition + i() * 1.1 * props.fontSize}
            // dy={i() > 0 ? `${1.1 * props.fontSize}px` : undefined}
          >{line}</tspan>
        }
      </For>
    </text>
    <RectangleBox
      backgroundRect={props.backgroundRect}
    />
  </g>;
}
