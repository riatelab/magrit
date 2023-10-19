// Imports from solid-js
import {
  createMemo,
  For,
  JSX,
  Show,
} from 'solid-js';

// Helpers
import { getClassifier } from '../../helpers/classification';
import { isNumber, unproxify } from '../../helpers/common';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import {
  ClassificationMethod,
  ClassificationParameters,
  LayerDescription,
  RenderVisibility,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export function choroplethPolygonRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as ClassificationParameters,
  );

  const classifier = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(null, null, rendererParameters().breaks);
  });

  const colors = createMemo(() => {
    let values = rendererParameters().palette.colors.slice() as string[];
    if (rendererParameters().reversePalette) {
      values = values.reverse();
    }
    return values;
  });

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
      <g
      id={layerDescription.name}
      class="layer choropleth"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      // fill={layerDescription.fillColor}
      fill-opacity={layerDescription.fillOpacity}
      stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      clip-path="url(#clip-sphere)"
      filter={layerDescription.dropShadow ? `url(#filter-drop-shadow-${layerDescription.id})` : undefined}
      shape-rendering={layerDescription.shapeRendering}
      >
      <For each={layerDescription.data.features}>
        {
          (feature) => <path
            fill={
              isNumber(feature.properties[rendererParameters().variable])
                ? colors()[classifier().getClass(feature.properties[rendererParameters().variable])]
                : rendererParameters().nodataColor
            }
            d={globalStore.pathGenerator(feature)}
            vector-effect="non-scaling-stroke"
            use:bindData={unproxify(feature)}
          />
        }
      </For>
    </g>
  </Show>;
}

export function choroplethPointRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as ClassificationParameters,
  );

  const classifier = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(null, null, rendererParameters().breaks);
  });

  const colors = createMemo(() => {
    let values = rendererParameters().palette.colors.slice() as string[];
    if (rendererParameters().reversePalette) {
      values = values.reverse();
    }
    return values;
  });

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      id={layerDescription.name}
      class="layer choropleth"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      // fill={layerDescription.fillColor}
      fill-opacity={layerDescription.fillOpacity}
      stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      // clip-path="url(#clip-sphere)"
      filter={layerDescription.dropShadow ? `url(#filter-drop-shadow-${layerDescription.id})` : undefined}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => <path
            fill={
              isNumber(feature.properties[rendererParameters().variable])
                ? colors()[classifier().getClass(feature.properties[rendererParameters().variable])]
                : rendererParameters().nodataColor
            }
            d={globalStore.pathGenerator.pointRadius(layerDescription.pointRadius)(feature)}
            vector-effect="non-scaling-stroke"
            use:bindData={unproxify(feature)}
          />
        }
      </For>
    </g>
  </Show>;
}

export function choroplethLineRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as ClassificationParameters,
  );

  const classifier = createMemo(() => {
    const Cls = getClassifier(ClassificationMethod.manual);
    return new Cls(null, null, rendererParameters().breaks);
  });

  const colors = createMemo(() => {
    let values = rendererParameters().palette.colors.slice() as string[];
    if (rendererParameters().reversePalette) {
      values = values.reverse();
    }
    return values;
  });

  return <Show when={
    applicationSettingsStore.renderVisibility === RenderVisibility.RenderAsHidden
    || layerDescription.visible
  }>
    <g
      id={layerDescription.name}
      class="layer choropleth"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill="none"
      // stroke={layerDescription.strokeColor}
      stroke-width={layerDescription.strokeWidth}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      clip-path="url(#clip-sphere)"
      filter={layerDescription.dropShadow ? `url(#filter-drop-shadow-${layerDescription.id})` : undefined}
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => <path
            stroke={
              isNumber(feature.properties[rendererParameters().variable])
                ? colors()[classifier().getClass(feature.properties[rendererParameters().variable])]
                : rendererParameters().nodataColor
            }
            d={globalStore.pathGenerator(feature)}
            vector-effect="non-scaling-stroke"
            use:bindData={unproxify(feature)}
          />
        }
      </For>
    </g>
  </Show>;
}
