import { For, JSX, Show } from 'solid-js';
import { globalStore } from '../../store/GlobalStore';
import { ClassificationMethod, ClassificationParameters, LayerDescription } from '../../global.d';
import { getClassifier } from '../../helpers/classification';
import { isNumber } from '../../helpers/common';

export function choroplethPolygonRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  const rendererParameters = layerDescription.rendererParameters as ClassificationParameters;
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(null, null, rendererParameters.breaks);
  const colors = rendererParameters.palette.colors as string[];
  const fieldName = rendererParameters.variable as string;
  const noDataColor = rendererParameters.nodataColor as string;

  console.log(rendererParameters.breaks, colors, fieldName, noDataColor);

  return <Show when={layerDescription.visible}>
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
  const colors = rendererParameters.palette.colors as string[];
  const fieldName = rendererParameters.variable as string;
  const noDataColor = rendererParameters.nodataColor as string;

  return <g
    id={layerDescription.name}
    class="layer default"
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
  </g>;
}

export function choroplethLineRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  const rendererParameters = layerDescription.rendererParameters as ClassificationParameters;
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(null, null, rendererParameters.breaks);
  const colors = rendererParameters.palette.colors as string[];
  const fieldName = rendererParameters.variable as string;
  const noDataColor = rendererParameters.nodataColor as string;

  return <g
    id={layerDescription.name}
    class="layer default"
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
  </g>;
}
