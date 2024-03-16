// Import from solid-js
import {
  createMemo,
  createSignal,
  For,
  type JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName } from '../../helpers/common';
import { makeCategoriesMap, makeCategoriesMapping } from '../../helpers/categorical-choropleth';
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
import { setPortrayalSelectionStore } from '../../store/PortrayalSelectionStore';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';
import CollapsibleSection from '../CollapsibleSection.tsx';
import {
  CategoriesSummary,
  CategoriesPlot,
  CategoriesCustomisation,
} from './CategoricalChoroplethComponents.tsx';

// Types / Interfaces / Enums
import {
  CategoricalChoroplethBarchartLegend,
  type CategoricalChoroplethLegend,
  type CategoricalChoroplethMapping,
  type CategoricalChoroplethParameters,
  type LayerDescriptionCategoricalChoropleth,
  type LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
} from '../../global.d';

const defaultNoDataColor = '#ffffff';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newName: string,
  categoriesMapping: CategoricalChoroplethMapping[],
  displayChartOnMap: boolean,
): void {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  // Generate ID for the new layer
  const newId = generateIdLayer();

  const newLayerDescription = {
    id: newId,
    name: newName,
    data: referenceLayerDescription.data,
    type: referenceLayerDescription.type,
    fields: referenceLayerDescription.fields,
    renderer: 'categoricalChoropleth' as RepresentationType,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 0.4,
    strokeOpacity: 1,
    fillOpacity: 1,
    dropShadow: false,
    blurFilter: false,
    shapeRendering: referenceLayerDescription.shapeRendering,
    rendererParameters: {
      variable: targetVariable,
      noDataColor: defaultNoDataColor,
      mapping: categoriesMapping,
    } as CategoricalChoroplethParameters,
  } as LayerDescriptionCategoricalChoropleth;

  if (newLayerDescription.type === 'point') {
    // We also need to transfert the pointRadius parameter
    newLayerDescription.pointRadius = referenceLayerDescription.pointRadius || 5;
  }

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(120, 340);

  const legend = {
    // Part common to all legends
    id: generateIdLegend(),
    layerId: newId,
    title: {
      text: targetVariable,
      ...applicationSettingsStore.defaultLegendSettings.title,
    } as LegendTextElement,
    subtitle: {
      text: undefined,
      ...applicationSettingsStore.defaultLegendSettings.subtitle,
    },
    note: {
      text: undefined,
      ...applicationSettingsStore.defaultLegendSettings.note,
    },
    position: legendPosition,
    visible: true,
    roundDecimals: null,
    backgroundRect: {
      visible: false,
    },
    // Part specific to choropleth
    type: LegendType.categoricalChoropleth,
    orientation: Orientation.vertical,
    boxWidth: 45,
    boxHeight: 30,
    boxSpacing: 5,
    boxSpacingNoData: 5,
    boxCornerRadius: 0,
    labels: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
    } as LegendTextElement,
    noDataLabel: 'No data',
    stroke: false,
    tick: false,
  } as CategoricalChoroplethLegend;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
        draft.layoutFeaturesAndLegends.push(legend);
      },
    ),
  );

  if (displayChartOnMap) {
    // Add the chart to the layout
    setLayersDescriptionStore(
      produce(
        (draft: LayersDescriptionStoreType) => {
          draft.layoutFeaturesAndLegends.push({
            id: generateIdLegend(),
            layerId: newId,
            type: LegendType.categoricalChoroplethBarchart,
            position: [legendPosition[0] + 200, legendPosition[1]],
            width: 300,
            height: 250,
            orientation: 'horizontal',
            fontColor: '#000000',
            visible: true,
            title: {
              text: targetVariable,
              ...applicationSettingsStore.defaultLegendSettings.title,
            } as LegendTextElement,
            subtitle: {
              text: undefined,
              ...applicationSettingsStore.defaultLegendSettings.subtitle,
            },
            note: {
              text: undefined,
              ...applicationSettingsStore.defaultLegendSettings.note,
            },
            backgroundRect: {
              visible: false,
            },
          } as CategoricalChoroplethBarchartLegend);
        },
      ),
    );
  }
}

export default function CategoricalChoroplethSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth).
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === VariableType.categorical);

  // Signals for the current component:
  // the target variable, the target layer name and the classification parameters
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields![0].name);
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(`Categorical_${layerDescription.name}`);
  const [
    categoriesMapping,
    setCategoriesMapping,
  ] = createSignal<CategoricalChoroplethMapping[]>(
    makeCategoriesMapping(makeCategoriesMap(layerDescription.data.features, targetVariable())),
  );
  const [
    displayChartOnMap,
    setDisplayChartOnMap,
  ] = createSignal<boolean>(false);
  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setPortrayalSelectionStore({ show: false, layerId: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        targetVariable(),
        layerName,
        categoriesMapping(),
        displayChartOnMap(),
      );
      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-choropleth">
    <InputFieldSelect
      label={ LL().PortrayalSection.CommonOptions.Variable() }
      onChange={(value) => {
        setTargetVariable(value);
        setCategoriesMapping(
          makeCategoriesMapping(
            makeCategoriesMap(layerDescription.data.features, value),
          ),
        );
      }}
      value={ targetVariable() }
    >
      <For each={targetFields}>
        { (variable) => <option value={variable.name}>{variable.name}</option> }
      </For>
    </InputFieldSelect>
    <CategoriesSummary mapping={categoriesMapping()} />
    <CollapsibleSection title={LL().PortrayalSection.CategoricalChoroplethOptions.ShowChart()}>
      <CategoriesPlot mapping={categoriesMapping()} />
    </CollapsibleSection>
    <CollapsibleSection title={LL().PortrayalSection.CategoricalChoroplethOptions.Customize()}>
      <CategoriesCustomisation
        mapping={categoriesMapping}
        setMapping={setCategoriesMapping}
        detailed={true}
      />
    </CollapsibleSection>
    <InputFieldCheckbox
      label={LL().PortrayalSection.CategoricalChoroplethOptions.DisplayChartOnMap()}
      checked={displayChartOnMap()}
      onChange={(v) => { setDisplayChartOnMap(v); }}
    />
    <InputResultName
      onKeyUp={(value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().PortrayalSection.CreateLayer() } onClick={makePortrayal} />
  </div>;
}
