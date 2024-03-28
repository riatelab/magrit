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

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setPortrayalSelectionStore } from '../../store/PortrayalSelectionStore';

// Helper
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName, getMinimumPrecision, isNumber } from '../../helpers/common';
import { generateIdLayer } from '../../helpers/layers';
import { generateIdLegend } from '../../helpers/legends';
import { VariableType } from '../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import { ChoroplethClassificationSelector } from './ChoroplethComponents.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  type ChoroplethHistogramLegend,
  type ChoroplethLegend,
  type ClassificationParameters,
  type LayerDescriptionChoropleth,
  type LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
} from '../../global.d';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  classification: ClassificationParameters,
  newName: string,
  noteContent: string,
  displayChartOnMap: boolean,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(120, 340);

  // How many decimals to display in the legend
  const minPrecision = getMinimumPrecision(classification.breaks);

  // Generate ID of new layer
  const newId = generateIdLayer();

  // Prepare the layer description for the new layer
  const newLayerDescription = {
    id: newId,
    name: newName,
    data: referenceLayerDescription.data,
    type: referenceLayerDescription.type,
    fields: referenceLayerDescription.fields,
    renderer: 'choropleth' as RepresentationType,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 0.4,
    strokeOpacity: 1,
    fillOpacity: 1,
    dropShadow: null,
    shapeRendering: referenceLayerDescription.shapeRendering,
    rendererParameters: classification,
  } as LayerDescriptionChoropleth;

  if (newLayerDescription.type === 'point') {
    // We also need to transfert the pointRadius parameter
    newLayerDescription.pointRadius = referenceLayerDescription.pointRadius || 5;
  }

  const legend = {
    // Part common to all legends
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
      text: noteContent,
      ...applicationSettingsStore.defaultLegendSettings.note,
    } as LegendTextElement,
    position: legendPosition,
    visible: true,
    roundDecimals: minPrecision < 0 ? 0 : minPrecision,
    backgroundRect: {
      visible: false,
    },
    // Part specific to choropleth
    type: LegendType.choropleth,
    orientation: Orientation.vertical,
    boxWidth: 50,
    boxHeight: 30,
    boxSpacing: 0,
    boxSpacingNoData: 10,
    boxCornerRadius: 0,
    labels: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
    } as LegendTextElement,
    noDataLabel: 'No data',
    stroke: false,
    tick: false,
  } as ChoroplethLegend;

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
            type: LegendType.choroplethHistogram,
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
          } as ChoroplethHistogramLegend);
        },
      ),
    );
  }
}
export default function ChoroplethSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth).
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === VariableType.ratio);

  // Signals for the current component:
  // the target variable, the target layer name and the classification parameters
  const [targetVariable, setTargetVariable] = createSignal<string>(targetFields[0].name);
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().PortrayalSection.ChoroplethOptions.NewLayerName({
      layerName: layerDescription.name,
    }) as string,
  );
  const [displayChartOnMap, setDisplayChartOnMap] = createSignal<boolean>(false);

  // Collect the values of the target variable (only those that are numbers)
  const values = createMemo(() => layerDescription.data.features
    .map((f) => f.properties[targetVariable()])
    .filter((d) => isNumber(d))
    .map((d: any) => +d) as number[]);

  const [
    targetClassification,
    setTargetClassification,
  ] = createSignal<ClassificationParameters>();

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

    // Actually create the layer
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        targetVariable(),
        targetClassification()!,
        layerName,
        LL().ClassificationPanel
          .classificationMethodLegendDescriptions[targetClassification()!.method](),
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
      }}
      value={ targetVariable() }
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <ChoroplethClassificationSelector
      values={values}
      targetVariable={targetVariable}
      targetClassification={targetClassification}
      setTargetClassification={setTargetClassification}
    />
    <InputFieldCheckbox
      label={LL().PortrayalSection.ChoroplethOptions.DisplayChartOnMap()}
      checked={displayChartOnMap()}
      onChange={(v) => { setDisplayChartOnMap(v); }}
    />
    <InputResultName
      value={newLayerName()}
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      disabled={targetClassification() === undefined}
      label={ LL().PortrayalSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
