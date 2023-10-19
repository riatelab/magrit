// Import from solid-js
import {
  type JSX,
  createMemo,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from 'solid-js';

// Helpers
import { bindDragBehavior, makeLayoutFeaturesSettingsModal, triggerContextMenuLayoutFeature } from './common.tsx';
import { useI18nContext } from '../../i18n/i18n-solid';

// Types / Interfaces / Enums
import { type ScaleBar, ScaleBarStyle } from '../../global.d';

function SimpleLineScaleBar(props: ScaleBar): JSX.Element {
  return <>
    <g stroke="black" stroke-width={1}>
      <line
        x1={props.position[0]}
        y1={props.position[1]}
        x2={props.position[0] + props.width}
        y2={props.position[1]}
      ></line>
    </g>
    <g>
      <Show when={props.label}>
        <text
          x={props.position[0] + props.width / 2}
          y={props.position[1] + 20}
          text-anchor="middle"
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
        x1={props.position[0]}
        y1={props.position[1]}
        x2={props.position[0] + props.width}
        y2={props.position[1]}
      ></line>
      <line
        x1={props.position[0]}
        y1={props.position[1]}
        x2={props.position[0]}
        y2={props.position[1] + props.height * direction()}
      ></line>
      <line
        x1={props.position[0] + props.width}
        y1={props.position[1]}
        x2={props.position[0] + props.width}
        y2={props.position[1] + props.height * direction()}
      ></line>
    </g>
    <g>
      <Show when={props.label}>
        <text
          x={props.position[0] + props.width / 2}
          y={props.position[1] - 20}
          text-anchor="middle"
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
              x={props.position[0] + (tickValue * props.width) / maxValue()}
              y={props.position[1]}
              width={props.tickValues[i() + 1] - tickValue}
              height={props.height}
              fill={i() % 2 === 0 ? 'black' : 'white'}
              stroke="black"
              stroke-width={1}
            ></rect>
          </Show>
          <text
            x={props.position[0] + (tickValue * props.width) / maxValue()}
            y={props.position[1] + props.height + 20}
            text-anchor="middle"
            style={{ 'user-select': 'none' }}
          >{tickValue}</text>
        </g>
      }
    </For>
    <g>
      <Show when={props.label}>
        <text
          x={props.position[0] + props.width / 2}
          y={props.position[1] - 20}
          text-anchor="middle"
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
    bindDragBehavior(refElement, props);
  });

  return <g
    ref={refElement}
    class="layout-feature scale-bar"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, LL);
    }}
    onDblClick={() => { makeLayoutFeaturesSettingsModal(props.id, LL); }}
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
  </g>;
}
