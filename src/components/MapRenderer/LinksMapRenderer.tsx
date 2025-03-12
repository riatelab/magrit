// Imports from solid-js
import {
  createMemo,
  For,
  type JSX,
} from 'solid-js';

// Helpers
import { mergeFilterIds } from './common.tsx';
import { getClassifier } from '../../helpers/classification';
import { PropSizer } from '../../helpers/geo';
import applyFilters from '../../helpers/filtering';
import { linkPath } from '../../helpers/svg';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';
import { mapStore } from '../../store/MapStore';

// Directives
import bindData from '../../directives/bind-data';

// Types / Interfaces / Enums
import {
  ClassificationMethod,
  type LayerDescriptionLinks,
  LinkCurvature,
  type LinksParameters,
  ProportionalSymbolsSymbolType,
} from '../../global.d';

// For now we keep an array of directives
// because otherwise the import is not detected by the compiler...
const directives = [ // eslint-disable-line @typescript-eslint/no-unused-vars
  bindData,
];

export default function linksRenderer(
  layerDescription: LayerDescriptionLinks,
): JSX.Element {
  const rendererParameters = createMemo(
    () => layerDescription.rendererParameters as LinksParameters,
  );

  const filteredFeatures = createMemo(() => applyFilters(
    layerDescription.data.features,
    layerDescription.rendererParameters.filters,
  ));

  if (rendererParameters().proportional) {
    const propSize = createMemo(() => new PropSizer(
      rendererParameters().proportional!.referenceValue,
      rendererParameters().proportional!.referenceRadius,
      'line' as ProportionalSymbolsSymbolType,
    ));

    return <g
      id={layerDescription.id}
      class="layer links"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill="none"
      stroke={layerDescription.strokeColor}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
      filter={mergeFilterIds(layerDescription)}
      mgt:geometry-type={layerDescription.type}
      mgt:portrayal-type={layerDescription.representationType}
      mgt:link-curvature={rendererParameters().curvature}
    >
      <For each={filteredFeatures()}>
        {
          (feature) => <path
            d={
              linkPath(
                feature,
                globalStore.pathGenerator,
                globalStore.projection,
                rendererParameters().curvature,
              )
            }
            vector-effect="non-scaling-stroke"
            stroke-width={
              propSize().scale(+feature.properties.Intensity) + 0.35
            }
            marker-start={
              (
                rendererParameters().type !== 'Exchange'
                && (rendererParameters().head === 'Arrow'
                  || rendererParameters().head === 'ArrowOnSymbol')
              )
                ? `url(#arrow-head-${layerDescription.strokeColor!.replace('#', '')})`
                : undefined
            }
            marker-end={
              (rendererParameters().head === 'Arrow' || rendererParameters().head === 'ArrowOnSymbol')
                ? `url(#arrow-head-${layerDescription.strokeColor!.replace('#', '')})`
                : undefined
            }
            // @ts-expect-error because use:bind-data isn't a property of this element
            use:bindData={feature}
          />
        }
      </For>
    </g>;
  }

  if (rendererParameters().classification) {
    const classifier = createMemo(() => {
      const Cls = getClassifier(ClassificationMethod.manual);
      return new Cls(
        null,
        null,
        applicationSettingsStore.intervalClosure,
        rendererParameters().classification!.breaks,
      );
    });

    return <g
      id={layerDescription.id}
      class="layer links"
      visibility={layerDescription.visible ? undefined : 'hidden'}
      fill="none"
      stroke={layerDescription.strokeColor}
      stroke-opacity={layerDescription.strokeOpacity}
      stroke-linecap="round"
      stroke-linejoin="round"
      clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
      filter={mergeFilterIds(layerDescription)}
      mgt:geometry-type={layerDescription.type}
      mgt:portrayal-type={layerDescription.representationType}
      mgt:link-curvature={rendererParameters().curvature}
    >
      <For each={filteredFeatures()}>
        {
          (feature) => <path
            d={
              linkPath(
                feature,
                globalStore.pathGenerator,
                globalStore.projection,
                rendererParameters().curvature,
              )
            }
            vector-effect="non-scaling-stroke"
            stroke-width={
              rendererParameters().classification.sizes[
                classifier().getClass(+feature.properties.Intensity)
              ]
            }
            marker-start={
              (
                rendererParameters().type !== 'Exchange'
                && (rendererParameters().head === 'Arrow'
                  || rendererParameters().head === 'ArrowOnSymbol')
              )
                ? `url(#arrow-head-${layerDescription.strokeColor!.replace('#', '')})`
                : undefined
            }
            marker-end={
              (rendererParameters().head === 'Arrow' || rendererParameters().head === 'ArrowOnSymbol')
                ? `url(#arrow-head-${layerDescription.strokeColor!.replace('#', '')})`
                : undefined
            }
            // @ts-expect-error because use:bind-data isn't a property of this element
            use:bindData={feature}
          />
        }
      </For>
    </g>;
  }

  return <g
    id={layerDescription.id}
    class="layer links"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill="none"
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    clip-path={mapStore.projection.type === 'd3' ? 'url(#clip-sphere)' : undefined}
    filter={mergeFilterIds(layerDescription)}
    mgt:geometry-type={layerDescription.type}
    mgt:portrayal-type={layerDescription.representationType}
    mgt:link-curvature={rendererParameters().curvature}
  >
    <For each={filteredFeatures()}>
      {
        (feature) => <path
          d={
            linkPath(
              feature,
              globalStore.pathGenerator,
              globalStore.projection,
              rendererParameters().curvature,
            )
          }
          vector-effect="non-scaling-stroke"
          stroke-width={layerDescription.strokeWidth}
          marker-start={
            (
              rendererParameters().type !== 'Exchange'
              && (rendererParameters().head === 'Arrow'
              || rendererParameters().head === 'ArrowOnSymbol')
            )
              ? `url(#arrow-head-${layerDescription.strokeColor!.replace('#', '')})`
              : undefined
          }
          marker-end={
            (rendererParameters().head === 'Arrow' || rendererParameters().head === 'ArrowOnSymbol')
              ? `url(#arrow-head-${layerDescription.strokeColor!.replace('#', '')})`
              : undefined
          }
          // @ts-expect-error because use:bind-data isn't a property of this element
          use:bindData={feature}
        />
      }
    </For>
  </g>;
}
