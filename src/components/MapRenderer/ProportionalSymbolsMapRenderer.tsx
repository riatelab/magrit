// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
  onMount,
} from 'solid-js';

// GeoJSON Types
import type { Point } from 'geojson';

// Helpers
import { bindDragBehavior, mergeFilterIds } from './common.tsx';
import { getClassifier } from '../../helpers/classification';
import { isFiniteNumber } from '../../helpers/common';
import { PropSizer } from '../../helpers/geo';

// Directives
import bindData from '../../directives/bind-data';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Types / Interfaces / Enums
import {
  ClassificationMethod,
  type LayerDescriptionProportionalSymbols,
  ProportionalSymbolsSymbolType,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

const prepareParameters = (
  layerDescription: LayerDescriptionProportionalSymbols,
) => {
  // eslint-disable-next-line no-nested-ternary
  const getColor = layerDescription.rendererParameters.colorMode === 'singleColor'
    ? createMemo(() => () => layerDescription.rendererParameters.color)
    // eslint-disable-next-line no-nested-ternary
    : layerDescription.rendererParameters.colorMode === 'positiveNegative'
      ? createMemo(() => (properties: Record<string, any>) => {
        const value = +properties[layerDescription.rendererParameters.variable];
        return value >= 0
          ? layerDescription.rendererParameters.color[0]
          : layerDescription.rendererParameters.color[1];
      })
      : layerDescription.rendererParameters.colorMode === 'ratioVariable'
        ? createMemo(() => {
          const Cls = getClassifier(ClassificationMethod.manual);
          const classifier = new Cls(
            null,
            null,
            applicationSettingsStore.intervalClosure,
            layerDescription.rendererParameters.color.breaks,
          );

          return (properties: Record<string, any>) => {
            const value = properties[layerDescription.rendererParameters.color.variable];
            return isFiniteNumber(value)
              ? layerDescription.rendererParameters.color
                .palette.colors[classifier.getClass(+value)]
              : layerDescription.rendererParameters.color
                .noDataColor;
          };
        })
        : createMemo(
          () => {
            const noDataEntry = layerDescription.rendererParameters.color.mapping
              .find((m) => m.value === null || m.value === undefined || m.value === '');
            const map = new Map<string | number | null | undefined, string>(
              layerDescription.rendererParameters.color.mapping
                .map(({ value, color }) => [value, color]),
            );
            if (noDataEntry) {
              map.set('', noDataEntry.color);
              map.set(null, noDataEntry.color);
              map.set(undefined, noDataEntry.color);
            }
            return (properties: Record<string, any>) => map.get(
              properties[layerDescription.rendererParameters.color.variable],
            );
          },
        );

  const noShow = createMemo(() => {
    if (layerDescription.rendererParameters.colorMode === 'categoricalVariable') {
      return new Set(layerDescription.rendererParameters.color.mapping
        .filter((m) => !m.show)
        .map((m) => m.value));
    }
    return new Set();
  });

  return {
    getColor,
    noShow,
  };
};

export function proportionalSymbolsPunctualRenderer(
  layerDescription: LayerDescriptionProportionalSymbols,
): JSX.Element {
  let refElement: SVGGElement;
  // Will scale the symbols according to the value of the variable
  const propSize = createMemo(() => new PropSizer(
    layerDescription.rendererParameters.referenceValue,
    layerDescription.rendererParameters.referenceRadius,
    layerDescription.rendererParameters.symbolType,
  ));

  onMount(() => {
    refElement!.querySelectorAll('circle, rect')
      .forEach((symbolElement, i) => {
        bindDragBehavior(symbolElement as SVGGElement, layerDescription, i);
      });
  });

  const { getColor, noShow } = prepareParameters(layerDescription);

  return <g
    ref={refElement!}
    id={layerDescription.id}
    classList={{
      layer: true,
      proportionalSymbols: true,
      movable: layerDescription.rendererParameters.movable,
    }}
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
  >
    <For each={
      layerDescription.rendererParameters.colorMode !== 'categoricalVariable'
        ? layerDescription.data.features
        : layerDescription.data.features
          .filter((f) => !noShow().has(
            f.properties![layerDescription.rendererParameters.color.variable],
          ))
    }>
      {
        (feature) => {
          const projectedCoords = createMemo(
            () => globalStore.projection((feature.geometry as Point).coordinates),
          );
          if (
            layerDescription.rendererParameters.symbolType
            === ProportionalSymbolsSymbolType.circle
          ) {
            return <circle
              r={propSize().scale(
                feature.properties![layerDescription.rendererParameters.variable],
              )}
              cx={projectedCoords()[0]}
              cy={projectedCoords()[1]}
              fill={getColor()(feature.properties!)}
              // @ts-expect-error because use:bind-data isn't a property of this element
              use:bindData={feature}
            ></circle>;
          }
          if (
            layerDescription.rendererParameters.symbolType
            === ProportionalSymbolsSymbolType.square
          ) {
            const symbolSize = createMemo(() => propSize().scale(
              feature.properties![layerDescription.rendererParameters.variable],
            ));
            return <rect
              width={symbolSize()}
              height={symbolSize()}
              x={projectedCoords()[0] - symbolSize() / 2}
              y={projectedCoords()[1] - symbolSize() / 2}
              fill={getColor()(feature.properties!)}
              // @ts-expect-error because use:bind-data isn't a property of this element
              use:bindData={feature}
            ></rect>;
          }
          return null;
        }
      }
    </For>
  </g>;
}

export function proportionalSymbolsLinearRenderer(
  layerDescription: LayerDescriptionProportionalSymbols,
): JSX.Element {
  let refElement: SVGGElement;
  // Will scale the symbols according to the value of the variable
  const propSize = createMemo(() => new PropSizer(
    layerDescription.rendererParameters.referenceValue,
    layerDescription.rendererParameters.referenceRadius,
    layerDescription.rendererParameters.symbolType,
  ));

  const { getColor, noShow } = prepareParameters(layerDescription);

  return <g
    ref={refElement!}
    id={layerDescription.id}
    class="layer proportionalSymbols"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill="none"
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
  >
    <For each={
      layerDescription.rendererParameters.colorMode !== 'categoricalVariable'
        ? layerDescription.data.features
        : layerDescription.data.features
          .filter((f) => !noShow().has(
            f.properties![layerDescription.rendererParameters.color.variable],
          ))
    }>
      {
        (feature) => <path
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          stroke={getColor()(feature.properties!)}
          stroke-width={propSize().scale(
            feature.properties![layerDescription.rendererParameters.variable],
          )}
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}
