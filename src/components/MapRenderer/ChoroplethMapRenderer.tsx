// Imports from solid-js
import { For, JSX, Show } from 'solid-js';

// Helpers
import { getClassifier } from '../../helpers/classification';
import { isNumber } from '../../helpers/common';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Types / Interfaces / Enums
import {
  ClassificationMethod,
  ClassificationParameters,
  LayerDescription,
  RenderVisibility,
} from '../../global.d';

export function choroplethPolygonRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  const rendererParameters = layerDescription.rendererParameters as ClassificationParameters;
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(null, null, rendererParameters.breaks);
  const colors = rendererParameters.palette.colors.slice() as string[];
  const fieldName = rendererParameters.variable as string;
  const noDataColor = rendererParameters.nodataColor as string;

  console.log('rendererParameters', rendererParameters);
  if (rendererParameters.reversePalette) {
    colors.reverse();
  }

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
    >
      <For each={layerDescription.data.features}>
        {
          (feature) => {
            const el: JSX.Element = <path
              fill={
                isNumber(feature.properties[fieldName])
                  ? colors[classifier.getClass(feature.properties[fieldName])]
                  : noDataColor
              }
              d={globalStore.pathGenerator(feature)}
              vector-effect="non-scaling-stroke"
            />;
            // el.__data__ = unproxify(feature); // eslint-disable-line no-underscore-dangle
            el.__data__ = feature; // eslint-disable-line no-underscore-dangle
            return el;
          }
        }
      </For>
    </g>
  </Show>;
}

export function choroplethPointRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  const rendererParameters = layerDescription.rendererParameters as ClassificationParameters;
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(null, null, rendererParameters.breaks);
  const colors = rendererParameters.palette.colors.slice() as string[];
  const fieldName = rendererParameters.variable as string;
  const noDataColor = rendererParameters.nodataColor as string;

  if (rendererParameters.reversePalette) {
    colors.reverse();
  }

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
          (feature) => {
            const el: JSX.Element = <path
              fill={
                isNumber(feature.properties[fieldName])
                  ? colors[classifier.getClass(feature.properties[fieldName])]
                  : noDataColor
              }
              d={globalStore.pathGenerator.pointRadius(layerDescription.pointRadius)(feature)}
              vector-effect="non-scaling-stroke"
            />;
            // el.__data__ = unproxify(feature); // eslint-disable-line no-underscore-dangle
            el.__data__ = feature; // eslint-disable-line no-underscore-dangle
            return el;
          }
        }
      </For>
    </g>
  </Show>;
}

export function choroplethLineRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  const rendererParameters = layerDescription.rendererParameters as ClassificationParameters;
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(null, null, rendererParameters.breaks);
  const colors = rendererParameters.palette.colors.slice() as string[];
  const fieldName = rendererParameters.variable as string;
  const noDataColor = rendererParameters.nodataColor as string;

  if (rendererParameters.reversePalette) {
    colors.reverse();
  }

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
          (feature) => {
            const el: JSX.Element = <path
              stroke={
                isNumber(feature.properties[fieldName])
                  ? colors[classifier.getClass(feature.properties[fieldName])]
                  : noDataColor
              }
              d={globalStore.pathGenerator(feature)}
              vector-effect="non-scaling-stroke"
            />;
            // el.__data__ = unproxify(feature); // eslint-disable-line no-underscore-dangle
            el.__data__ = feature; // eslint-disable-line no-underscore-dangle
            return el;
          }
        }
      </For>
    </g>
  </Show>;
}
