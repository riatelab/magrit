// Import from solid-js
import {
  type JSX,
  createMemo,
  For,
  Match,
  onMount,
  Show,
  Switch,
  createEffect,
  on,
} from 'solid-js';

// Stores
import { mapStore } from '../../store/MapStore';
import { globalStore } from '../../store/GlobalStore';
import { setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  bindElementsLayoutFeature, computeRectangleBox,
  makeLayoutFeaturesSettingsModal,
  RectangleBox,
  triggerContextMenuLayoutFeature,
} from './common.tsx';
import { sphericalLawOfCosine } from '../../helpers/geo';
import { Mceil, Mround } from '../../helpers/math';

// Types / Interfaces / Enums
import {
  DistanceUnit,
  type LayoutFeature,
  type ScaleBar,
  ScaleBarStyle,
} from '../../global.d';

// We only use it internally, this is the start of the coordinate system
// for this layout feature
const initialPosition = 0;

const convertToUnit = (distance: number, unit: DistanceUnit): number => {
  if (unit === DistanceUnit.km) {
    return distance / 1000;
  }
  if (unit === DistanceUnit.mi) {
    return distance / 1609.344;
  }
  if (unit === DistanceUnit.ft) {
    return distance / 0.3048;
  }
  if (unit === DistanceUnit.yd) {
    return distance / 0.9144;
  }
  if (unit === DistanceUnit.nmi) {
    return distance / 1852;
  }
  return distance;
};

const formatDistance = (distance: number, displayUnit: DistanceUnit, label?: string): string => {
  // We store the distance in meters in the store
  // but we want to be able to display it in meters, kilometers, miles, feet and yards.
  const l = label ? ` ${label}` : '';
  return `${Mround(convertToUnit(distance, displayUnit))} ${l}`;
};

const getTickValues = (distance: number) => {
  const progression = [0];
  if (distance <= 200) {
    progression.push(Mceil(distance / 3), Mceil(distance / 2), Mceil(distance));
  } else if (distance <= 500) {
    progression.push(50, 100, Mceil(distance / 2), distance);
  } else {
    progression.push(50, 100, 250, 500, distance);
  }

  return progression;
};

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
      <text
        x={initialPosition + props.width / 2}
        y={initialPosition}
        text-anchor="middle"
        dominant-baseline="hanging"
        style={{ 'user-select': 'none' }}
      >{formatDistance(props.distance, props.unit, props.label)}</text>
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
      <text
        x={initialPosition + props.width / 2}
        y={initialPosition}
        text-anchor="middle"
        dominant-baseline="hanging"
        style={{ 'user-select': 'none' }}
      >{formatDistance(props.distance, props.unit, props.label)}</text>
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

  createEffect(
    on( // We need to recompute rectangle box when the following properties change
      () => [props.width, props.height, props.style, props.label, props.rotation, props.tickValues],
      () => {
        computeRectangleBox(refElement);
      },
    ),
  );

  if (Number.isNaN(props.distance)) {
    // We need to compute the distance for the given width.
    // Geo coordinates of pt1 and pt2:
    const left = globalStore.projection
      .invert(props.position);
    const right = globalStore.projection
      .invert([props.position[0] + props.width, props.position[1]]);
    // Compute the distance between the two points
    const dist = sphericalLawOfCosine(left, right);
    console.log(dist);
    setLayersDescriptionStore(
      'layoutFeatures',
      (f: LayoutFeature) => f.id === props.id,
      'distance',
      dist / 1000,
    );
  }

  createEffect(
    on(
      () => [
        props.position,
        props.width,
        // props.style,
        props.behavior,
        mapStore.scale,
        mapStore.translate,
        globalStore.projection,
      ],
      () => {
        if (props.behavior === 'absoluteSize') {
          // The scale bar is always the same size (in pixels) no matter the zoom level
          // but we need to recompute the displayed distance
          // We need to compute the distance for the given width.
          // Geo coordinates of pt1 and pt2:
          const left = globalStore.projection
            .invert(props.position);
          const right = globalStore.projection
            .invert([props.position[0] + props.width, props.position[1]]);
          // Compute the distance between the two points
          const distance = sphericalLawOfCosine(left, right);
          const tickValues = getTickValues(convertToUnit(distance, props.unit));
          setLayersDescriptionStore(
            'layoutFeatures',
            (f: LayoutFeature) => f.id === props.id,
            {
              distance,
              tickValues,
            },
          );
        } else { // 'geographicSize'
          // The scale bar always represents the same distance on the map, no matter the zoom level
          // but we need to recompute it's pixel size

        }
      },
    ),
  );

  return <g
    ref={refElement!}
    class="layout-feature scale-bar"
    onContextMenu={(e) => {
      e.preventDefault();
      e.stopPropagation();
      triggerContextMenuLayoutFeature(e, props.id, false, false, LL);
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
