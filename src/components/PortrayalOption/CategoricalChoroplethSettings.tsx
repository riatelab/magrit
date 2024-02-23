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
import { FaSolidArrowRight } from 'solid-icons/fa';
import * as Plot from '@observablehq/plot';
import type { Plot as PlotType } from '@observablehq/plot';

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

// Types / Interfaces / Enums
import {
  type CategoricalChoroplethParameters,
  type ChoroplethLegendParameters, GeoJSONFeature,
  type LayerDescriptionCategoricalChoropleth,
  type LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
} from '../../global.d';

const defaultNoDataColor = '#ffffff';
// const nullSymbol = Symbol('null');
// type NullType = typeof nullSymbol;

type CategoricalChoroplethMapping = [string | number | null, string | null, string, number];

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
    .map((c, i) => [
      c[0],
      c[0] ? String(c[0]) : null,
      colors[i] || defaultNoDataColor,
      c[1],
    ])
    .sort((a, b) => a[0] - b[0]);
};

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newName: string,
): void {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  const categories = makeCategoriesMap(referenceLayerDescription.data.features, targetVariable);
  const mapping = makeCategoriesMapping(categories);

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
      mapping,
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

function CategoriesSummary(props: { mapping: CategoricalChoroplethMapping[] }): JSX.Element {
  const { LL } = useI18nContext();
  const hasNull = createMemo(() => props.mapping.some((m) => m[0] === null));
  const nCategories = createMemo(() => props.mapping.length - (hasNull() ? 1 : 0));
  return <div style={{ 'margin-top': '-1em', 'margin-bottom': '1em' }}>
    <div>
      <FaSolidArrowRight />&nbsp;
      <span>{ LL().PortrayalSection.CategoricalChoroplethOptions.Categories(nCategories()) }</span>
      {
        hasNull()
          ? <>
              <br />
              <FaSolidArrowRight/>&nbsp;
              <span>{ LL().PortrayalSection.CategoricalChoroplethOptions.HasNull() }</span>
          </>
          : ''
      }
    </div>
  </div>;
}

function CategoriesPlot(props: { mapping: CategoricalChoroplethMapping[] }): JSX.Element {
  const { LL } = useI18nContext();
  const domain = createMemo(() => props.mapping.map((m) => m[1]));
  const range = createMemo(() => props.mapping.map((m) => m[2]));
  const data = createMemo(() => props.mapping.map((m, i) => ({
    position: i,
    category: m[1],
    color: m[2],
    frequency: m[3],
  })));
  return <div
    style={{
      padding: '1em',
      border: 'solid 1px currentColor',
      'margin-bottom': '1em',
    }}
  >
    {
      Plot.plot({
        height: 200,
        color: {
          domain: domain(),
          range: range(),
          legend: true,
        },
        x: {
          type: 'band',
          tickFormat: null,
          ticks: 0,
          // TODO: use i18ned labels
        },
        y: {
          // TODO: use i18ned labels
        },
        marks: [
          Plot.barY(
            data(),
            {
              x: 'category',
              y: 'frequency',
              fill: 'color',
              channels: {
                position: (d) => d.position,
              },
              sort: {
                y: 'position',
              },
            },
          ),
          Plot.ruleY([0]),
        ],
      })
    }
  </div>;
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
      width={200}
    >
      <For each={targetFields()}>
        { (variable) => <option value={variable.name}>{variable.name}</option> }
      </For>
    </InputFieldSelect>
    <CategoriesSummary mapping={categoriesMapping()} />
    <CategoriesPlot mapping={categoriesMapping()} />
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
