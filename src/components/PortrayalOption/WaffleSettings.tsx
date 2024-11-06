// Imports from solid-js
import {
  createEffect,
  createSignal,
  For,
  type JSX, on,
  Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { randomColorFromCategoricalPalette } from '../../helpers/color';
import {
  findSuitableName, isFiniteNumber,
} from '../../helpers/common';
import { coordsPointOnFeature } from '../../helpers/geo';
import { generateIdLayer } from '../../helpers/layers';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';
import { generateIdLegend } from '../../helpers/legends';
import { Mmax, Mmin } from '../../helpers/math';

// Sub-components
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldMultiSelect from '../Inputs/InputMultiSelect.tsx';
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
  ProportionalSymbolsSymbolType,
  RepresentationType,
  type WaffleLegend,
  type WaffleParameters,
} from '../../global.d';
import type { PortrayalSettingsProps } from './common';
import MessageBlock from '../MessageBlock.tsx';

function guessSymbolValue(
  layerId: string,
  selectedVariables: { name: string, displayName: string, color: string }[],
) {
  if (selectedVariables.length < 2) {
    return 0;
  }

  const ld = layersDescriptionStore.layers.find((l) => l.id === layerId)!;

  let minSum = Infinity;
  let maxSum = -Infinity;

  // We want to find the maximum sum and the minimum sum
  // (between all the features) of the selected variables
  ld.data.features.forEach((feature) => {
    let sum = 0;
    selectedVariables.forEach((variable) => {
      if (isFiniteNumber(feature.properties[variable.name])) {
        sum += +feature.properties[variable.name];
      }
    });
    maxSum = Mmax(maxSum, sum);
    minSum = Mmin(minSum, sum);
  });

  // We want to find a divisor (ideally a multiple of 10) that
  // allows the user to encode the sum of the selected variables
  // in a stack of symbols (without having too much symbols for the
  // features that have the largest sum and without having no symbol
  // for the features that have the smallest sum)
  let divisor = 0;
  const step = maxSum > 100 ? 10 : 1;
  while (maxSum / divisor > step) {
    if (minSum / divisor < selectedVariables.length) {
      break;
    }
    divisor += step;
  }

  return divisor;
}

function isValidSymbolValue(
  layerId: string,
  selectedVariables: { name: string, displayName: string, color: string }[],
  symbolValue: number,
) {
  const ld = layersDescriptionStore.layers.find((l) => l.id === layerId)!;

  let minNumberOfSymbols = Infinity;
  let maxNumberOfSymbols = -Infinity;

  // We want to find the number of symbols that will be displayed
  // for each feature
  ld.data.features.forEach((feature) => {
    let numberOfSymbols = 0;
    selectedVariables.forEach((variable) => {
      if (isFiniteNumber(feature.properties[variable.name])) {
        numberOfSymbols += +feature.properties[variable.name] / symbolValue;
      }
    });

    maxNumberOfSymbols = Mmax(maxNumberOfSymbols, numberOfSymbols);
    minNumberOfSymbols = Mmin(minNumberOfSymbols, numberOfSymbols);
  });

  if (maxNumberOfSymbols > 1000) {
    return { valid: false, reason: 'tooManySymbols' };
  }
  // if (minNumberOfSymbols < 1) {
  //   return { valid: false, reason: 'tooFewSymbols' };
  // }
  return { valid: true };
}

function onClickValidate(
  referenceLayerId: string,
  targetVariables: { name: string, displayName: string, color: string }[],
  symbolValue: number,
  symbolValueSentence: string,
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
    anchor: 'middle',
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
    orientation: 'vertical',
    labels: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
    } as LegendTextElement,
    boxWidth: size,
    boxHeight: size,
    boxSpacing: 10,
    boxCornerRadius: symbolType === 'circle' ? size / 2 : 0,
    stroke: true,
    spacingBelowBoxes: 10,
    valueText: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
      text: symbolValueSentence,
    } as LegendTextElement,
  } as WaffleLegend;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
        draft.layoutFeaturesAndLegends.push(legend);
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
  ] = createSignal<number>(10);

  // Number of columns
  const [
    columns,
    setColumns,
  ] = createSignal<number>(5);

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

  createEffect(
    on(
      () => selectedVariables(),
      () => {
        setSymbolValue(
          guessSymbolValue(
            layerDescription.id,
            selectedVariables(),
          ),
        );
      },
    ),
  );

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
        LL().FunctionalitiesSection.WaffleOptions.SymbolRatioNote({ value: symbolValue() }),
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
      disabled={selectedVariables().length < 2}
      bindKeyUpAsChange={true}
    />
    <Show when={
      selectedVariables().length >= 2
      && isValidSymbolValue(
        layerDescription.id,
        selectedVariables(),
        symbolValue(),
      ).reason === 'tooManySymbols'
    }>
      <MessageBlock type={'danger'} useIcon={true}>
        {
          LL().FunctionalitiesSection
            .WaffleOptions.WarningTooManySymbols({
              value: guessSymbolValue(layerDescription.id, selectedVariables()),
            })
        }
      </MessageBlock>
    </Show>
    <Show when={
      selectedVariables().length >= 2
      && isValidSymbolValue(
        layerDescription.id,
        selectedVariables(),
        symbolValue(),
      ).reason === 'tooFewSymbols'
    }>
      <MessageBlock type={'danger'} useIcon={true}>
        {
          LL().FunctionalitiesSection
            .WaffleOptions.WarningTooFewSymbols({
              value: guessSymbolValue(layerDescription.id, selectedVariables()),
            })
        }
      </MessageBlock>
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={ LL().FunctionalitiesSection.CreateLayer() }
      onClick={makePortrayal}
      disabled={
        !(selectedVariables().length >= 2
          && isValidSymbolValue(
            layerDescription.id,
            selectedVariables(),
            symbolValue(),
          ).valid
        )
      }
    />
  </div>;
}
