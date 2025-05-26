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
import { convertToUnit } from '../../helpers/distances';
import { sphericalLawOfCosine } from '../../helpers/geo';
import { Mceil, Mround } from '../../helpers/math';

// Types / Interfaces / Enums
import {
  DistanceUnit,
  type LayoutFeature,
  type Legend, LegendTextElement,
  type ScaleBar,
  ScaleBarStyle,
} from '../../global.d';

// We only use it internally, this is the start of the coordinate system
// for this layout feature
const initialPosition = 0;

const formatDistance = (
  distance: number,
  displayUnit: DistanceUnit,
  label: LegendTextElement,
): string => {
  // We store the distance in meters in the store,
  // but we want to be able to display it in meters, kilometers, miles, feet and yards.
  const l = label.text ? ` ${label.text}` : '';
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
    <g stroke={props.label.fontColor} stroke-width={1}>
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
        y={props.labelPosition === 'top' ? initialPosition + 10 : initialPosition + 30}
        text-anchor="middle"
        dominant-baseline={props.labelPosition === 'top' ? 'auto' : 'hanging'}
        style={{ 'user-select': 'none' }}
        fill={props.label.fontColor}
        font-family={props.label.fontFamily}
        font-size={props.label.fontSize}
        font-style={props.label.fontStyle}
        font-weight={props.label.fontWeight}
      >{formatDistance(props.distance, props.unit, props.label)}</text>
    </g>
  </>;
}

function LineWithTicks(props: ScaleBar & { direction: 'top' | 'bottom' }): JSX.Element {
  const direction = createMemo(() => (props.direction === 'top' ? -1 : 1));
  return <>
    <g stroke={props.label.fontColor} stroke-width={1}>
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
        y={props.labelPosition === 'top' ? initialPosition + 10 : initialPosition + 30}
        text-anchor="middle"
        dominant-baseline={props.labelPosition === 'top' ? 'auto' : 'hanging'}
        style={{ 'user-select': 'none' }}
        fill={props.label.fontColor}
        font-family={props.label.fontFamily}
        font-size={props.label.fontSize}
        font-style={props.label.fontStyle}
        font-weight={props.label.fontWeight}
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
          y={props.labelPosition === 'top' ? initialPosition : initialPosition + 40}
          text-anchor="middle"
          dominant-baseline={props.labelPosition === 'top' ? 'text-bottom' : 'text-top'}
          style={{ 'user-select': 'none' }}
        >{props.label}</text>
      </Show>
    </g>
  </>;
}

const computeDistance = ({
  measureLocation, position, width,
}: {
  measureLocation: 'underScaleBar' | 'centerMap',
  position: [number, number],
  width: number,
}): number => {
  let distance;
  if (measureLocation === 'underScaleBar') {
    const left = globalStore.projection
      .invert(position);
    const right = globalStore.projection
      .invert([position[0] + width, position[1]]);
    // Compute the distance between the two points
    distance = sphericalLawOfCosine(left, right);
  } else { // measureLocation === 'centerMap'
    const { width: widthMap, height: heightMap } = mapStore.mapDimensions;
    const center = [widthMap / 2, heightMap / 2];
    const left = globalStore.projection
      .invert([center[0] - width / 2, center[1]]);
    const right = globalStore.projection
      .invert([center[0] + width / 2, center[1]]);
    // Compute the distance between the two points
    distance = sphericalLawOfCosine(left, right);
  }
  return distance;
};

export default function ScaleBarRenderer(props: ScaleBar): JSX.Element {
  const { LL } = useI18nContext();
  let refElement: SVGGElement;

  onMount(() => {
    bindElementsLayoutFeature(refElement!, props);
  });

  createEffect(
    on( // We need to recompute rectangle box when the following properties change
      () => [
        props.width, props.height, props.style, props.label,
        props.rotation, props.tickValues, props.labelPosition,
      ],
      () => {
        computeRectangleBox(refElement!);
      },
    ),
  );

  const handleNanDistance = () => {
    // Set some default width
    setLayersDescriptionStore(
      'layoutFeaturesAndLegends',
      (f: LayoutFeature | Legend) => f.id === props.id,
      'width',
      100,
    );
    // We need to compute the distance for the given width.
    // Geo coordinates of pt1 and pt2, given the value of
    // the measureLocation property:
    const distance = computeDistance(props);
    setLayersDescriptionStore(
      'layoutFeaturesAndLegends',
      (f: LayoutFeature | Legend) => f.id === props.id,
      'distance',
      distance,
    );
  };

  if (
    Number.isNaN(props.distance)
    || props.distance === 0
    || Number.isNaN(props.width)
    || props.width === 0
  ) {
    handleNanDistance();
  }

  createEffect(
    on(
      () => [
        props.position,
        props.width,
        props.behavior,
        props.measureLocation,
        mapStore.scale,
        mapStore.translate,
        globalStore.projection,
      ],
      () => {
        if (props.behavior === 'geographicSize') {
          return;
        }
        setTimeout(() => {
          // The scale bar is always the same size (in pixels) no matter the zoom level
          // but we need to recompute the displayed distance
          // We need to compute the distance for the given width.
          // Geo coordinates of pt1 and pt2, given the value of
          // the measureLocation property:
          const distance = computeDistance(props);
          const tickValues = getTickValues(convertToUnit(distance, props.unit));
          setLayersDescriptionStore(
            'layoutFeaturesAndLegends',
            (f: LayoutFeature | Legend) => f.id === props.id,
            {
              distance,
              tickValues,
            },
          );
        }, 10);
      },
    ),
  );

  createEffect(
    on(
      () => [
        props.position,
        props.distance,
        props.behavior,
        mapStore.scale,
        mapStore.translate,
        globalStore.projection,
      ],
      () => {
        if (props.behavior === 'absoluteSize') {
          return;
        }
        setTimeout(() => {
          // The scale bar always represents the same distance on the map, no matter the zoom level
          // but we need to recompute it's pixel size.
          if (
            Number.isNaN(props.distance) || props.distance <= 0
            || Number.isNaN(props.width) || props.width <= 0
          ) {
            // As our calculation of the new distance is based
            // on the ratio between the current distance and the target distance,
            // we need to set a default distance if the current distance is 0/NaN.
            handleNanDistance();
          }
          const currentDistance = computeDistance(props);
          // Compute the ratio between the target distance and the current distance
          const ratio = props.distance / currentDistance;
          // Compute the new width
          const newWidth = props.width * ratio;
          setLayersDescriptionStore(
            'layoutFeaturesAndLegends',
            (f: LayoutFeature | Legend) => f.id === props.id,
            'width',
            newWidth,
          );
        }, 10);
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
