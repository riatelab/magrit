// Imports from solid-js
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { randomColorFromCategoricalPalette } from '../../helpers/color';
import { findSuitableName, isNumber } from '../../helpers/common';
import { computeCandidateValuesForSymbolsLegend, coordsPointOnFeature, PropSizer } from '../../helpers/geo';
import { generateIdLayer } from '../../helpers/layers';
import { generateIdLegend } from '../../helpers/legends';
import { max, min } from '../../helpers/math';

// Sub-components
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
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
  type HalfProportionalMarkParameters,
  type LayerDescriptionMushroomLayer,
  type LegendTextElement,
  type MushroomsLegend,
  type MushroomsParameters,
  LegendType,
  ProportionalSymbolsSymbolType,
  RepresentationType,
} from '../../global.d';
import type { PortrayalSettingsProps } from './common';

function onClickValidate(
  referenceLayerId: string,
  top: HalfProportionalMarkParameters,
  bottom: HalfProportionalMarkParameters,
  extentTop: [number, number],
  extentBottom: [number, number],
  newLayerName: string,
) {
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw Error('Unexpected Error: Reference layer not found');
  }

  const params = {
    top,
    bottom,
    movable: false,
  } as MushroomsParameters;

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

  const propSizeTop = new PropSizer(
    params.top.referenceValue,
    params.top.referenceSize,
    params.top.symbolType,
  );
  const propSizeBottom = new PropSizer(
    params.bottom.referenceValue,
    params.bottom.referenceSize,
    params.bottom.symbolType,
  );

  const legendValuesTop = computeCandidateValuesForSymbolsLegend(
    extentTop[0],
    extentTop[1],
    propSizeTop.scale,
    propSizeTop.getValue,
    3,
  );

  const legendValuesBottom = computeCandidateValuesForSymbolsLegend(
    extentBottom[0],
    extentBottom[1],
    propSizeBottom.scale,
    propSizeBottom.getValue,
    3,
  );

  const newId = generateIdLayer();

  const newLayerDescription = {
    id: newId,
    name: newLayerName,
    data: newData,
    type: 'point',
    fields: referenceLayerDescription.fields,
    renderer: 'mushrooms' as RepresentationType,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 1,
    strokeOpacity: 1,
    fillOpacity: 1,
    dropShadow: null,
    shapeRendering: 'auto',
    rendererParameters: params,
  } as LayerDescriptionMushroomLayer;

  const legend = {
    // Legend common part
    id: generateIdLegend(),
    layerId: newId,
    title: {
      text: 'Mushroom',
      ...applicationSettingsStore.defaultLegendSettings.title,
    } as LegendTextElement,
    subtitle: {
      text: 'This is a subtitle',
      ...applicationSettingsStore.defaultLegendSettings.subtitle,
    } as LegendTextElement,
    note: {
      text: 'This is a bottom note',
      ...applicationSettingsStore.defaultLegendSettings.note,
    } as LegendTextElement,
    position: [10, 10],
    visible: true,
    roundDecimals: 0,
    backgroundRect: {
      visible: false,
    },
    // Part specific to mushrooms legends
    type: LegendType.mushrooms,
    values: {
      top: legendValuesTop,
      bottom: legendValuesBottom,
    },
    labels: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
    } as LegendTextElement,
    topTitle: {
      text: top.variable,
      ...applicationSettingsStore.defaultLegendSettings.subtitle,
      fontColor: top.color,
    } as LegendTextElement,
    bottomTitle: {
      text: bottom.variable,
      ...applicationSettingsStore.defaultLegendSettings.subtitle,
      fontColor: bottom.color,
    } as LegendTextElement,
  } as MushroomsLegend;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
        draft.layoutFeaturesAndLegends.push(legend);
      },
    ),
  );
}

export default function MushroomsSettings(
  props: PortrayalSettingsProps,
): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // The fields of the layer that are of type 'stock'.
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === 'stock');

  const [
    targetVariableTop,
    setTargetVariableTop,
  ] = createSignal<string>(targetFields[0].name);

  const [
    targetVariableBottom,
    setTargetVariableBottom,
  ] = createSignal<string>(targetFields[1].name);

  // Reactive variable that contains the values of the target variable
  // for the top part of the mushroom.
  const valuesTop = createMemo(() => layerDescription.data.features
    .map((feature) => feature.properties[targetVariableTop()])
    .filter((value) => isNumber(value))
    .map((value: any) => +value) as number[]);

  const valuesBottom = createMemo(() => layerDescription.data.features
    .map((feature) => feature.properties[targetVariableBottom()])
    .filter((value) => isNumber(value))
    .map((value: any) => +value) as number[]);

  // Reactive variables that contains the extent (min and max) of the target variables
  const extentTop = createMemo<[number, number]>(
    () => [min(valuesTop() as number[]), max(valuesTop() as number[])],
  );
  const extentBottom = createMemo<[number, number]>(
    () => [min(valuesBottom() as number[]), max(valuesBottom() as number[])],
  );

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.MushroomsOptions.NewLayerName({
      layerName: layerDescription.name,
    }) as string,
  );
  // const [
  //   symbolType,
  //   setSymbolType,
  // ] = createSignal<ProportionalSymbolsSymbolType.circle | ProportionalSymbolsSymbolType.square>(
  //   'circle',
  // );
  const [
    refSymbolSizeTop,
    setRefSymbolSizeTop,
  ] = createSignal<number>(40);
  const [
    refSymbolSizeBottom,
    setRefSymbolSizeBottom,
  ] = createSignal<number>(40);
  const [
    refValueTop,
    setRefValueTop,
  ] = createSignal<number>(extentTop()[1]);
  const [
    refValueBottom,
    setRefValueBottom,
  ] = createSignal<number>(extentBottom()[1]);
  const [
    colorTop,
    setColorTop,
  ] = createSignal<string>(randomColorFromCategoricalPalette('Vivid'));
  const [
    colorBottom,
    setColorBottom,
  ] = createSignal<string>(randomColorFromCategoricalPalette('Vivid'));

  createEffect(() => {
    setRefValueTop(extentTop()[1]);
  });
  createEffect(() => {
    setRefValueBottom(extentBottom()[1]);
  });

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
        {
          variable: targetVariableTop(),
          symbolType: ProportionalSymbolsSymbolType.circle,
          referenceSize: refSymbolSizeTop(),
          referenceValue: refValueTop(),
          color: colorTop(),
        } as HalfProportionalMarkParameters,
        {
          variable: targetVariableBottom(),
          symbolType: ProportionalSymbolsSymbolType.circle,
          referenceSize: refSymbolSizeBottom(),
          referenceValue: refValueBottom(),
          color: colorBottom(),
        } as HalfProportionalMarkParameters,
        extentTop(),
        extentBottom(),
        layerName,
      );

      // Remove overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-mushrooms">
    <div class="mt-4 mb-5 has-text-weight-bold">
      {LL().FunctionalitiesSection.MushroomsOptions.TopProperties()}
    </div>
    <InputFieldSelect
      label={LL().FunctionalitiesSection.CommonOptions.Variable()}
      onChange={(value) => {
        setTargetVariableTop(value);
      }}
      value={targetVariableTop()}
    >
      <For each={targetFields}>
        {(variable) => <option value={variable.name}>{variable.name}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldNumber
      label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ReferenceSize()}
      value={refSymbolSizeTop()}
      onChange={(value) => {
        setRefSymbolSizeTop(value);
      }}
      min={1}
      max={200}
      step={1}
    />
    <InputFieldNumber
      label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue()}
      value={refValueTop()}
      onChange={(value) => {
        setRefValueTop(value);
      }}
      min={1}
      max={999}
      step={0.1}
    />
    <InputFieldColor
      label={LL().FunctionalitiesSection.CommonOptions.Color()}
      value={colorTop()}
      onChange={(value) => {
        setColorTop(value);
      }}
    />
    <div class="mb-5 has-text-weight-bold">
      {LL().FunctionalitiesSection.MushroomsOptions.BottomProperties()}
    </div>
    <InputFieldSelect
      label={LL().FunctionalitiesSection.CommonOptions.Variable()}
      onChange={(value) => {
        setTargetVariableBottom(value);
      }}
      value={targetVariableBottom()}
    >
      <For each={targetFields}>
        {(variable) => <option value={variable.name}>{variable.name}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldNumber
      label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ReferenceSize()}
      value={refSymbolSizeBottom()}
      onChange={(value) => {
        setRefSymbolSizeBottom(value);
      }}
      min={1}
      max={200}
      step={1}
    />
    <InputFieldNumber
      label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue()}
      value={refValueBottom()}
      onChange={(value) => {
        setRefValueBottom(value);
      }}
      min={1}
      max={999}
      step={0.1}
    />
    <InputFieldColor
      label={LL().FunctionalitiesSection.CommonOptions.Color()}
      value={colorBottom()}
      onChange={(value) => {
        setColorBottom(value);
      }}
    />
    <InputResultName
      value={newLayerName()}
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().FunctionalitiesSection.CreateLayer() } onClick={makePortrayal} />
  </div>;
}
