// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
} from 'solid-js';

// Helpers
import { getClassifier } from '../../helpers/classification';
import { isNonNull } from '../../helpers/common';
import { getSymbolPath } from '../../helpers/svg';
import { mergeFilterIds } from './common.tsx';
import d3 from '../../helpers/d3-custom';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';
import { mapStore } from '../../store/MapStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import {
  ClassificationMethod,
  type BivariateChoroplethParameters,
  type LayerDescriptionBivariateChoropleth,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

function bivariateClass(
  v1: any,
  v2: any,
  c1: { getClass: (_: number) => number },
  c2: { getClass: (_: number) => number },
): number {
  return 3 * c1.getClass(v1) + c2.getClass(v2);
}

export function bivariateChoroplethPolygonRenderer(
  layerDescription: LayerDescriptionBivariateChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as BivariateChoroplethParameters,
  );

  const classifierVar1 = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      rendererParameters().variable1.breaks,
    );
  });

  const classifierVar2 = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      rendererParameters().variable2.breaks,
    );
  });

  return <g
    id={layerDescription.id}
    class="layer bivariate-choropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
    filter={mergeFilterIds(layerDescription)}
    shape-rendering={
      (layerDescription.strokeWidth === 0 || layerDescription.strokeOpacity === 0)
        ? 'crispEdges'
        : layerDescription.shapeRendering
    }
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
  >
    <For each={d3.geoStitch(layerDescription.data).features}>
      {
        (feature) => <path
          fill={
            isNonNull(feature.properties![rendererParameters().variable1.variable])
            && isNonNull(feature.properties![rendererParameters().variable2.variable])
              ? rendererParameters().palette.colors[
                bivariateClass(
                  feature.properties![rendererParameters().variable1.variable],
                  feature.properties![rendererParameters().variable2.variable],
                  classifierVar1(),
                  classifierVar2(),
                )
              ]
              : rendererParameters().noDataColor
          }
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}

export function bivariateChoroplethLineRenderer(
  layerDescription: LayerDescriptionBivariateChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as BivariateChoroplethParameters,
  );

  const classifierVar1 = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      rendererParameters().variable1.breaks,
    );
  });

  const classifierVar2 = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      rendererParameters().variable2.breaks,
    );
  });

  return <g
    id={layerDescription.id}
    class="layer bivariate-choropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill="none"
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => <path
          stroke={
            isNonNull(feature.properties![rendererParameters().variable1.variable])
            && isNonNull(feature.properties![rendererParameters().variable2.variable])
              ? rendererParameters().palette.colors[
                bivariateClass(
                  feature.properties![rendererParameters().variable1.variable],
                  feature.properties![rendererParameters().variable2.variable],
                  classifierVar1(),
                  classifierVar2(),
                )
              ]
              : rendererParameters().noDataColor
          }
          d={globalStore.pathGenerator(feature)}
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}

export function bivariateChoroplethPointRenderer(
  layerDescription: LayerDescriptionBivariateChoropleth,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as BivariateChoroplethParameters,
  );

  const classifierVar1 = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      rendererParameters().variable1.breaks,
    );
  });

  const classifierVar2 = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(
      null,
      null,
      applicationSettingsStore.intervalClosure,
      rendererParameters().variable2.breaks,
    );
  });

  return <g
    id={layerDescription.id}
    class="layer bivariate-choropleth"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    // clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
    mgt:symbol-size={layerDescription.symbolSize}
    mgt:symbol-type={layerDescription.symbolType}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => <path
          fill={
            isNonNull(feature.properties![rendererParameters().variable1.variable])
            && isNonNull(feature.properties![rendererParameters().variable2.variable])
              ? rendererParameters().palette.colors[
                bivariateClass(
                  feature.properties![rendererParameters().variable1.variable],
                  feature.properties![rendererParameters().variable2.variable],
                  classifierVar1(),
                  classifierVar2(),
                )
              ]
              : rendererParameters().noDataColor
          }
          d={
            getSymbolPath(
              layerDescription.symbolType!,
              globalStore.projection(feature.geometry.coordinates),
              layerDescription.symbolSize!,
            )
          }
          vector-effect="non-scaling-stroke"
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}
