// Import from solid-js
import {
  type JSX,
  createMemo,
  For,
  Match,
  onMount,
  Show,
  Switch, createEffect,
} from 'solid-js';

// Helpers
import {
  bindDragBehavior,
  bindElementsLayoutFeature, computeRectangleBox,
  makeLayoutFeaturesSettingsModal,
  RectangleBox,
  triggerContextMenuLayoutFeature,
} from './common.tsx';
import { useI18nContext } from '../../i18n/i18n-solid';

// Types / Interfaces / Enums
import { type ScaleBar, ScaleBarStyle } from '../../global.d';

// We only use it internally, this is the start of the coordinate system
// for this layout feature
const initialPosition = 0;

function SimpleLineScaleBar(props: ScaleBar): JSX.Element {
  return <>
    <g stroke="black" stroke-width={1}>
      <line
        x1={initialPosition}
        y1={initialPosition + 20}
        x2={initialPosition + props.width}
        y2={initialPosition + 20}
      ></line>
    </g>
    <g>
      <Show when={props.label}>
        <text
          x={initialPosition + props.width / 2}
          y={initialPosition}
          text-anchor="middle"
          dominant-baseline="hanging"
          style={{ 'user-select': 'none' }}
        >{props.label}</text>
      </Show>
    </g>
  </>;
}

function LineWithTicks(props: ScaleBar & { direction: 'top' | 'bottom' }): JSX.Element {
  const direction = createMemo(() => (props.direction === 'top' ? -1 : 1));
  return <>
    <g stroke="black" stroke-width={1}>
      <line
        x1={initialPosition}
        y1={initialPosition + 20}
        x2={initialPosition + props.width}
        y2={initialPosition + 20}
      ></line>
      <line
        x1={initialPosition}
        y1={initialPosition + 20}
        x2={initialPosition}
        y2={initialPosition + props.height * direction() + 20}
      ></line>
      <line
        x1={initialPosition + props.width}
        y1={initialPosition + 20}
        x2={initialPosition + props.width}
        y2={initialPosition + props.height * direction() + 20}
      ></line>
    </g>
    <g>
      <Show when={props.label}>
        <text
          x={initialPosition + props.width / 2}
          y={initialPosition}
          text-anchor="middle"
          dominant-baseline="hanging"
          style={{ 'user-select': 'none' }}
        >{props.label}</text>
      </Show>
    </g>
  </>;
}

function BlackAndWhiteBar(props: ScaleBar): JSX.Element {
  const maxValue = createMemo(() => props.tickValues[props.tickValues.length - 1]);
  return <>
    <For each={props.tickValues}>
      {
        (tickValue, i) => <g>
          <Show when={i() !== props.tickValues.length - 1}>
            <rect
              x={initialPosition + (tickValue * props.width) / maxValue()}
              y={initialPosition + 20}
              width={props.tickValues[i() + 1] - tickValue}
              height={props.height}
              fill={i() % 2 === 0 ? 'black' : 'white'}
              stroke="black"
              stroke-width={1}
            ></rect>
          </Show>
          <text
            x={initialPosition + (tickValue * props.width) / maxValue()}
            y={initialPosition + props.height + 40}
            text-anchor="middle"
            style={{ 'user-select': 'none' }}
          >{tickValue}</text>
        </g>
      }
    </For>
    <g>
      <Show when={props.label}>
        <text
          x={initialPosition + props.width / 2}
          y={initialPosition}
          text-anchor="middle"
          dominant-baseline="hanging"
          style={{ 'user-select': 'none' }}
        >{props.label}</text>
      </Show>
    </g>
  </>;
}

export default function ScaleBarRenderer(props: ScaleBar): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindElementsLayoutFeature(refElement, props);
  });

  createEffect(() => {
    computeRectangleBox(
      refElement,
      // We need to recompute rectangle box when the following properties change
      props.width,
      props.height,
      props.style,
      props.label,
      props.rotation,
      props.tickValues,
    );
  });

  return <g
    ref={refElement!}
    class="layout-feature scale-bar"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, LL);
    }}
    onDblClick={() => { makeLayoutFeaturesSettingsModal(props.id, LL); }}
    transform={`translate(${props.position[0]}, ${props.position[1]})`}
  >
    <Switch>
      <Match when={props.style === ScaleBarStyle.simpleLine}>
        <SimpleLineScaleBar {...props} />
      </Match>
      <Match when={props.style === ScaleBarStyle.lineWithTicksOnBottom}>
        <LineWithTicks {...props} direction="bottom" />
      </Match>
      <Match when={props.style === ScaleBarStyle.lineWithTicksOnTop}>
        <LineWithTicks {...props} direction="top" />
      </Match>
      <Match when={props.style === ScaleBarStyle.blackAndWhiteBar}>
        <BlackAndWhiteBar {...props} />
      </Match>
    </Switch>
    <RectangleBox
      backgroundRect={props.backgroundRect}
    />
  </g>;
}
