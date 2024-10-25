// Imports from solid-js
import {
  createSignal,
  For,
  type JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { randomColorFromCategoricalPalette } from '../../helpers/color';
import {
  findSuitableName,
} from '../../helpers/common';
import { coordsPointOnFeature } from '../../helpers/geo';
import { generateIdLayer } from '../../helpers/layers';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';
import { generateIdLegend } from '../../helpers/legends';

// Sub-components
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';

// Types / Interfaces / Enums
import {
  type GeoJSONFeatureCollection,
  type LayerDescriptionWaffle,
  type LegendTextElement,
  LegendType,
  ProportionalSymbolsSymbolType, RepresentationType,
  WaffleParameters,
} from '../../global.d';
import type { PortrayalSettingsProps } from './common';
import InputFieldMultiSelect from '../Inputs/InputMultiSelect.tsx';

function onClickValidate(
  referenceLayerId: string,
  targetVariables: { name: string, displayName: string, color: string }[],
  symbolValue: number,
  size: number,
  columns: number,
  spacing: number,
  symbolType: ProportionalSymbolsSymbolType.circle | ProportionalSymbolsSymbolType.square,
  newLayerName: string,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw Error('Unexpected Error: Reference layer not found');
  }

  // Copy dataset
  const newData = JSON.parse(
    JSON.stringify(
      referenceLayerDescription.data,
    ),
  ) as GeoJSONFeatureCollection;

  if (
    referenceLayerDescription.type === 'polygon'
  ) {
    newData.features.forEach((feature) => {
      // eslint-disable-next-line no-param-reassign
      feature.geometry = {
        type: 'Point',
        coordinates: coordsPointOnFeature(feature.geometry as never),
      };
    });
  }

  // As with proportional symbols, we store the original position
  // of the features (we will need it
  // later if the avoid overlapping option is set
  // to recompute the new position if the user changes the
  // settings of proportional symbols or zoom in/out
  // and also if the user wants to change the position of the
  // symbols manually)
  newData.features.forEach((feature) => {
    // eslint-disable-next-line no-param-reassign
    feature.geometry.originalCoordinates = feature.geometry.coordinates;
  });

  const newId = generateIdLayer();

  const waffleParameters: WaffleParameters = {
    variables: targetVariables,
    symbolType,
    size,
    columns,
    symbolValue,
    spacing,
    movable: false,
  };

  const newLayerDescription = {
    id: newId,
    name: newLayerName,
    data: newData,
    type: 'point',
    fields: referenceLayerDescription.fields,
    representationType: 'waffle' as RepresentationType,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 1,
    strokeOpacity: 1,
    fillOpacity: 1,
    dropShadow: null,
    shapeRendering: 'auto',
    rendererParameters: waffleParameters,
  } as LayerDescriptionWaffle;

  const legend = {
    // Legend common part
    id: generateIdLegend(),
    layerId: newId,
    title: {
      text: 'Waffle',
      ...applicationSettingsStore.defaultLegendSettings.title,
    } as LegendTextElement,
    subtitle: {
      ...applicationSettingsStore.defaultLegendSettings.subtitle,
    } as LegendTextElement,
    note: {
      ...applicationSettingsStore.defaultLegendSettings.note,
    } as LegendTextElement,
    position: getPossibleLegendPosition(150, 150),
    visible: true,
    roundDecimals: 0,
    backgroundRect: {
      visible: false,
    },
    // Part specific to waffle legends
    type: LegendType.waffle,
    // TODO...
  };

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
        // draft.layoutFeaturesAndLegends.push(legend);
      },
    ),
  );
}

export default function WaffleSettings(
  props: PortrayalSettingsProps,
): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!; // eslint-disable-line solid/reactivity

  // The fields of the layer that are of type 'stock'.
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === 'stock');

  // The selected variables
  const [
    selectedVariables,
    setSelectedVariables,
  ] = createSignal<{ name: string, displayName: string, color: string }[]>([]);

  // The name of the layer that will be created
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.WaffleOptions.NewLayerName({
      layerName: layerDescription.name,
    }) as string,
  );

  // Symbol type
  const [
    symbolType,
    setSymbolType,
  ] = createSignal<ProportionalSymbolsSymbolType.circle | ProportionalSymbolsSymbolType.square>(
    ProportionalSymbolsSymbolType.circle,
  );

  // Size for each symbol
  const [
    symbolSize,
    setSymbolSize,
  ] = createSignal<number>(5);

  // Number of columns
  const [
    columns,
    setColumns,
  ] = createSignal<number>(10);

  // Space between symbols
  const [
    space,
    setSpace,
  ] = createSignal<number>(1);

  // The value that is encoded in each symbol
  const [
    symbolValue,
    setSymbolValue,
  ] = createSignal<number>(0);

  const makePortrayal = async () => {
    // Compute a suitable name for the new layer
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Actually create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        selectedVariables(),
        symbolValue(),
        symbolSize(),
        columns(),
        space(),
        symbolType(),
        layerName,
      );

      // Remove overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-proportional-symbols">
    <InputFieldMultiSelect
      label={LL().FunctionalitiesSection.WaffleOptions.Variables()}
      styles={{ height: '7em' }}
      width={300}
      onChange={(values) => {
        setSelectedVariables(
          values.map((name) => {
            const variable = targetFields.find((v) => v.name === name);

            if (variable === undefined) {
              throw Error('Unexpected Error: Variable not found');
            }

            return {
              name: variable.name,
              displayName: variable.name,
              color: randomColorFromCategoricalPalette(),
            };
          }),
        );
      }}
      values={selectedVariables().map((d) => d.name)}
    >
      <For each={targetFields}>
        {
          (variable) => <option value={variable.name}>
            {variable.name}
          </option>
        }
      </For>
    </InputFieldMultiSelect>
    <InputFieldSelect
      label={LL().FunctionalitiesSection.WaffleOptions.SymbolType()}
      value={symbolType()}
      onChange={(value) => { setSymbolType(value); }}
    >
      <option value={ProportionalSymbolsSymbolType.circle}>
        {LL().FunctionalitiesSection.ProportionalSymbolsOptions.SymbolTypes.circle()}
      </option>
      <option value={ProportionalSymbolsSymbolType.square}>
        {LL().FunctionalitiesSection.ProportionalSymbolsOptions.SymbolTypes.square()}
      </option>
    </InputFieldSelect>
    <InputFieldNumber
      label={LL().FunctionalitiesSection.WaffleOptions.Spacing()}
      value={space()}
      onChange={(value) => { setSpace(value); }}
      min={0}
      max={30}
      step={1}
    />
    <InputFieldNumber
      label={LL().FunctionalitiesSection.WaffleOptions.Columns()}
      value={columns()}
      onChange={(value) => { setColumns(value); }}
      min={1}
      max={30}
      step={1}
    />
    <InputFieldNumber
      label={LL().FunctionalitiesSection.WaffleOptions.SymbolSize()}
      value={symbolSize()}
      onChange={(value) => { setSymbolSize(value); }}
      min={1}
      max={30}
      step={1}
    />
    <InputFieldNumber
      label={LL().FunctionalitiesSection.WaffleOptions.SymbolValue()}
      value={symbolValue()}
      onChange={(value) => { setSymbolValue(value); }}
      min={0}
      max={Infinity}
      step={1}
    />
    <InputResultName
      value={newLayerName()}
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().FunctionalitiesSection.CreateLayer() } onClick={makePortrayal} />
  </div>;
}
