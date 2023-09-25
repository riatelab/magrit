import { For, JSX } from 'solid-js';
import { globalStore } from '../../store/GlobalStore';
import { ClassificationMethod, LayerDescription } from '../../global.d';
import { getClassifier } from '../../helpers/classification';
import { isNumber } from '../../helpers/common';

export function choroplethPolygonRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(null, null, layerDescription.classification?.breaks);
  const colors = layerDescription.classification?.palette.colors as string[];
  const fieldName = layerDescription.classification?.variable as string;
  const noDataColor = layerDescription.classification?.nodataColor as string;

  console.log(layerDescription.classification?.breaks, colors, fieldName, noDataColor);

  return <g
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
  </g>;
}

export function choroplethPointRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(null, null, layerDescription.classification?.breaks);
  const colors = layerDescription.classification?.palette.colors as string[];
  const fieldName = layerDescription.classification?.variable as string;
  const noDataColor = layerDescription.classification?.nodataColor as string;

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
  const Cls = getClassifier(ClassificationMethod.manual);
  const classifier = new Cls(null, null, layerDescription.classification?.breaks);
  const colors = layerDescription.classification?.palette.colors as string[];
  const fieldName = layerDescription.classification?.variable as string;
  const noDataColor = layerDescription.classification?.nodataColor as string;

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
