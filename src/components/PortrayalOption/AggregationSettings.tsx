// Imports from solid-js
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
  on,
  Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName } from '../../helpers/common';
import { randomColorFromCategoricalPalette } from '../../helpers/color';
import { generateIdLayer } from '../../helpers/layers';
import aggregateLayer from '../../helpers/aggregationLayer';
import { DataType, type Variable } from '../../helpers/typeDetection';

// Stores
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { showErrorMessage } from '../../store/NiceAlertStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import MessageBlock from '../MessageBlock.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types / Interfaces / Enums
import type { PortrayalSettingsProps } from './common';
import { type LayerDescription } from '../../global.d';

async function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  aggregationMethod: 'geos' | 'topojson',
  newLayerName: string,
): Promise<void> {
  const aggregateAllFeatures = targetVariable === '';
  const dataToAggregate = (layersDescriptionStore.layers
    .find((layer) => layer.id === referenceLayerId) as LayerDescription).data;
  const newData = await aggregateLayer(
    dataToAggregate,
    targetVariable,
    aggregationMethod,
  );
  const color = randomColorFromCategoricalPalette();
  const newLayerDescription = {
    id: generateIdLayer(),
    name: newLayerName,
    data: newData,
    type: 'polygon',
    fields: aggregateAllFeatures ? [] : [
      {
        name: targetVariable,
        dataType: DataType.string,
        type: 'categorical',
      } as Variable,
    ],
    representationType: 'default',
    visible: true,
    fillOpacity: 1,
    fillColor: color,
    strokeColor: '#000000',
    strokeWidth: 1,
    strokeOpacity: 1,
    dropShadow: null,
    shapeRendering: 'auto',
  } as LayerDescription;

  setLayersDescriptionStore(
    produce((draft: LayersDescriptionStoreType) => {
      draft.layers.push(newLayerDescription);
    }),
  );
}

export default function AggregationSettings(
  props: PortrayalSettingsProps,
): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = layersDescriptionStore.layers
    .find((layer) => layer.id === props.layerId) as LayerDescription;

  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === 'categorical');

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.AggregationOptions.NewLayerName({
      layerName: layerDescription.name,
    }) as string,
  );

  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>('');

  const [
    aggregationMethod,
    setAggregationMethod,
  ] = createSignal<'topojson' | 'geos'>('geos');

  const makePortrayal = async () => {
    // Check name of the new layer
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Actually create the new layer
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        targetVariable(),
        aggregationMethod(),
        layerName,
      ).then(() => {
        // Hide loading overlay
        setLoading(false);
        // Open the LayerManager to show the new layer
        openLayerManager();
      })
        .catch((e) => {
          setLoading(false);
          showErrorMessage(e.message ? e.message : `${e}`, LL);
          console.warn('Original error:', e);
        });
    }, 0);
  };

  createEffect(
    on(
      () => targetVariable(),
      () => {
        // Compute how many categories we have

      },
    ),
  );

  return <div class="portrayal-section__portrayal-options-aggregation">
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.CommonOptions.Variable() }
      onChange={(v) => { setTargetVariable(v); }}
      value={ targetVariable() }
    >
      <option value=""> { LL().FunctionalitiesSection.AggregationOptions.None() } </option>
      <For each={targetFields}>
        {
          (variable) => <option value={ variable.name }>{ variable.name }</option>
        }
      </For>
    </InputFieldSelect>
    {/*
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.AggregationOptions.Method() }
      onChange={(v) => { setAggregationMethod(v as 'geos' | 'topojson'); }}
      value={ aggregationMethod() }
    >
      <option value="geos">GEOS</option>
      <option value="topojson">TopoJSON</option>
    </InputFieldSelect>
    */}
    <Show when={targetVariable() === ''}>
      <MessageBlock type={'warning'} useIcon={true}>
        { LL().FunctionalitiesSection.AggregationOptions.Information() }
      </MessageBlock>
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={ LL().FunctionalitiesSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
