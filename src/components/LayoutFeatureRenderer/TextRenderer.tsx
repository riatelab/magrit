// Import from solid-js
import {
  createEffect,
  For,
  type JSX,
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

export default function TextRenderer(props: Text): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindElementsLayoutFeature(refElement, props);
  });

  createEffect(() => {
    computeRectangleBox(
      refElement,
      props.fontSize,
      props.text,
    );
  });

  return <g
    ref={refElement!}
    class="layout-feature text"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, LL);
    }}
    onDblClick={() => { makeLayoutFeaturesSettingsModal(props.id, LL); }}
  >
    <RectangleBox backgroundRect={props.backgroundRect} position={props.position} />
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
      transform={props.rotation !== 0 ? `rotate(${props.rotation} ${props.position[0]} ${props.position[1]})` : undefined}
    >
      <For each={props.text!.split('\n')}>
        {(line, i) => <tspan
            x={props.position[0]}
            y={props.position[1] + i() * 1.1 * props.fontSize}
            dy="1.2em"
            alignment-baseline={'ideographic'}
          >{line}</tspan>
        }
      </For>
    </text>
  </g>;
}
