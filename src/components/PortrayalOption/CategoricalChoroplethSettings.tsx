// Import from solid-js
import {
  createMemo,
  createSignal,
  For,
  type JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { getColors } from 'dicopal';
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { generateIdLayer } from '../../helpers/layers';
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName, isNonNull } from '../../helpers/common';
import { VariableType } from '../../helpers/typeDetection';
import { randomColor } from '../../helpers/color';
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
  type CategoricalChoroplethMapping,
  type CategoricalChoroplethParameters,
  type ChoroplethLegendParameters,
  type GeoJSONFeature,
  type LayerDescriptionCategoricalChoropleth,
  type LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
} from '../../global.d';

const defaultNoDataColor = '#ffffff';

const selectDefaultColors = (n: number): string[] => {
  let colors;
  if (n <= 7) {
    // We use colors from the otake ito palette
    // which is safe for colorblind people but we skip the first color
    colors = getColors('Okabe_Ito_Categorigal', 8)!.toReversed().slice(0, n);
  } else if (n <= 12) {
    // We use colors from Set3 of colorbrewer
    colors = getColors('Set3', 12)!.toReversed().slice(0, n);
  } else if (n <= 20) {
    // We use colors from Tableau (but this is paired colors)
    colors = getColors('Tableau', 20)!.toReversed().slice(0, n);
  } else {
    // Return an array of random color
    colors = Array.from({ length: n }, randomColor);
  }
  return colors;
};

const makeCategoriesMap = (
  features: GeoJSONFeature[],
  variable: string,
): Map<string | number | null, number> => {
  const m = new Map();
  features.forEach((f) => {
    const value = f.properties[variable];
    if (isNonNull(value)) m.set(value, (m.get(value) || 0) + 1);
    else m.set(null, (m.get(null) || 0) + 1);
  });
  return m;
};

const makeCategoriesMapping = (
  categories: Map<string | number | null, number>,
): CategoricalChoroplethMapping[] => {
  const hasNull = categories.has(null);
  const n = categories.size - (hasNull ? 1 : 0);
  const colors = selectDefaultColors(n);
  return Array.from(categories)
    .map((c, i) => ({
      value: c[0],
      categoryName: c[0] ? String(c[0]) : null,
      color: colors[i] || defaultNoDataColor,
      count: c[1],
    }))
    .sort((a, b) => a.categoryName - b.categoryName);
};

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newName: string,
  categoriesMapping: CategoricalChoroplethMapping[],
): void {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  // const categories = makeCategoriesMap(referenceLayerDescription.data.features, targetVariable);
  // const mapping = makeCategoriesMapping(categories);

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(120, 340);

  const newLayerDescription = {
    id: generateIdLayer(),
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
    legend: {
      // Part common to all legends
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
      roundDecimals: 1,
      backgroundRect: {
        visible: false,
      },
      // Part specific to choropleth
      type: LegendType.choropleth,
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
    } as ChoroplethLegendParameters,
  } as LayerDescriptionCategoricalChoropleth;

  if (newLayerDescription.type === 'point') {
    // We also need to transfert the pointRadius parameter
    newLayerDescription.pointRadius = referenceLayerDescription.pointRadius || 5;
  }

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );
}

export default function CategoricalChoroplethSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth).
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = createMemo(() => layerDescription()
    .fields?.filter((variable) => variable.type === VariableType.categorical));

  // Signals for the current component:
  // the target variable, the target layer name and the classification parameters
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields()![0].name);
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(`Categorical_${layerDescription().name}`);
  const [
    categoriesMapping,
    setCategoriesMapping,
  ] = createSignal<CategoricalChoroplethMapping[]>(
    makeCategoriesMapping(makeCategoriesMap(layerDescription().data.features, targetVariable())),
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
        layerDescription().id,
        targetVariable(),
        layerName,
        categoriesMapping(),
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
            makeCategoriesMap(layerDescription().data.features, value),
          ),
        );
      }}
      value={ targetVariable() }
    >
      <For each={targetFields()}>
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
