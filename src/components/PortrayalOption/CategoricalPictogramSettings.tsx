// Import from solid-js
import {
  createEffect,
  createSignal, For,
  type JSX, on,
  Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// GeoJSON types
import type { FeatureCollection, Position } from 'geojson';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName } from '../../helpers/common';
import { makeCategoriesMap, makePictoCategoriesMapping } from '../../helpers/categorical';
import { coordsPointOnFeature } from '../../helpers/geo';
import { generateIdLayer } from '../../helpers/layers';
import { generateIdLegend } from '../../helpers/legends';
import { VariableType } from '../../helpers/typeDetection';
import { PortrayalSettingsProps } from './common';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';
import CollapsibleSection from '../CollapsibleSection.tsx';
import { CategoriesSummary } from './CategoricalChoroplethComponents.tsx';
import { CategoriesCustomisation, CategoriesPlot } from './CategoricalPictogramComponents.tsx';
import MessageBlock from '../MessageBlock.tsx';

// Types / Interfaces / Enums
import {
  type CategoricalPictogramLegend,
  type CategoricalPictogramMapping,
  type CategoricalPictogramParameters,
  type LayerDescriptionCategoricalPictogram,
  type LegendTextElement,
  LegendType, RepresentationType,
} from '../../global.d';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newName: string,
  mapping: CategoricalPictogramMapping[],
): void {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  // Generate ID for the new layer
  const newId = generateIdLayer();

  // Copy dataset
  const newData = JSON.parse(
    JSON.stringify(
      referenceLayerDescription.data,
    ),
  ) as FeatureCollection;

  if (referenceLayerDescription.type !== 'point') {
    newData.features.forEach((feature) => {
      // eslint-disable-next-line no-param-reassign
      feature.geometry = {
        type: 'Point',
        coordinates: coordsPointOnFeature(feature.geometry as never) as Position,
      };
    });
  }

  const newLayerDescription = {
    id: newId,
    name: newName,
    data: newData,
    type: 'point',
    fields: referenceLayerDescription.fields,
    representationType: 'categoricalPictogram' as RepresentationType,
    visible: true,
    dropShadow: null,
    shapeRendering: 'auto',
    rendererParameters: {
      variable: targetVariable,
      mapping,
    } as CategoricalPictogramParameters,
  } as LayerDescriptionCategoricalPictogram;

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(120, 340);

  const legend = {
    // Legend common part
    id: generateIdLegend(),
    layerId: newId,
    title: {
      text: targetVariable,
      ...applicationSettingsStore.defaultLegendSettings.title,
    } as LegendTextElement,
    subtitle: {
      ...applicationSettingsStore.defaultLegendSettings.subtitle,
    } as LegendTextElement,
    note: {
      ...applicationSettingsStore.defaultLegendSettings.note,
    } as LegendTextElement,
    position: legendPosition,
    visible: true,
    roundDecimals: 0,
    backgroundRect: {
      visible: false,
    },
    // Part specific to categorical pictogram legends
    type: LegendType.categoricalPictogram,
    spacing: 10,
    labels: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
    },
  } as CategoricalPictogramLegend;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
        draft.layoutFeaturesAndLegends.push(legend);
      },
    ),
  );
}

export default function CategoricalPictogramSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!; // eslint-disable-line solid/reactivity

  // The number of features in the layer
  const nbFt = layerDescription.data.features.length;

  // The fields of the layer that are of type 'categorical'
  // (i.e. the fields that can be used for the categorical pictogram map).
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === VariableType.categorical);

  // Signals for the current component:
  // the target variable, the target layer name and the classification parameters
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields[0].name);

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.CategoricalPictogramOptions.NewLayerName({
      variable: targetVariable(),
      layerName: layerDescription.name,
    }) as string,
  );

  const [
    categoriesMapping,
    setCategoriesMapping,
  ] = createSignal<CategoricalPictogramMapping[]>(
    makePictoCategoriesMapping(
      makeCategoriesMap(
        layerDescription.data.features,
        targetVariable(), // eslint-disable-line solid/reactivity
      ),
    ),
  );

  createEffect(
    on(
      () => targetVariable(),
      () => {
        setNewLayerName(
          LL().FunctionalitiesSection.CategoricalPictogramOptions.NewLayerName({
            variable: targetVariable(),
            layerName: layerDescription.name,
          }) as string,
        );
      },
    ),
  );

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((l) => l.name),
    );

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Create the new layer
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        targetVariable(),
        layerName,
        categoriesMapping(),
      );

      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    });
  };

  return <div class="portrayal-section__portrayal-options-pictogram">
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.CommonOptions.Variable() }
      value={targetVariable()}
      onChange={(value) => {
        setTargetVariable(value);
        setCategoriesMapping(
          makePictoCategoriesMapping(
            makeCategoriesMap(layerDescription.data.features, value),
          ),
        );
      }}
    >
      <For each={targetFields}>
        { (variable) => <option value={variable.name}>{variable.name}</option> }
      </For>
    </InputFieldSelect>
    <CategoriesSummary mapping={categoriesMapping()} />
    <Show when={categoriesMapping()!.length === 1 || categoriesMapping()!.length === nbFt}>
      <MessageBlock type={'warning'}>
        <p>{
          LL().FunctionalitiesSection.CategoricalChoroplethOptions.WarningNotCategoricalMessage()
        }</p>
      </MessageBlock>
    </Show>
    <CollapsibleSection
      title={LL().FunctionalitiesSection.CategoricalChoroplethOptions.ShowChart()}
    >
      <CategoriesPlot mapping={categoriesMapping()} />
    </CollapsibleSection>
    <CollapsibleSection
      title={LL().FunctionalitiesSection.CategoricalPictogramOptions.Customize()}
    >
      <CategoriesCustomisation
        mapping={categoriesMapping}
        setMapping={setCategoriesMapping}
        detailed={true}
      />
    </CollapsibleSection>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().FunctionalitiesSection.CreateLayer() } onClick={makePortrayal} />
  </div>;
}
