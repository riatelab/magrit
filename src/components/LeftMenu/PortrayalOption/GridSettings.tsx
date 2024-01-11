// Imports from solid-js
import {
  createMemo,
  createSignal,
  For,
  JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Helpers
import { useI18nContext } from '../../../i18n/i18n-solid';
import { getPossibleLegendPosition } from '../../LegendRenderer/common.tsx';
import { getClassificationFunction } from '../../../helpers/classification';
import { findSuitableName } from '../../../helpers/common';
import { generateIdLayer } from '../../../helpers/layers';

// Stores
import { applicationSettingsStore } from '../../../store/ApplicationSettingsStore';
import { setGlobalStore } from '../../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../../store/LayersDescriptionStore';

// Subcomponents
import InputFieldSelect from '../../Inputs/InputSelect.tsx';
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';
import InputResultName from './InputResultName.tsx';

// Types / Interfaces / Enums
import type { PortrayalSettingsProps } from './common';
import { DataType, type Variable, VariableType } from '../../../helpers/typeDetection';
import {
  type GriddedLayerParameters,
  type LayerDescriptionGriddedLayer,
  type LegendTextElement,
  LegendType,
  RepresentationType,
} from '../../../global.d';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newLayerName: string,
): void {
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId)!;

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newLayerName,
    type: 'polygon',
    renderer: 'grid',
    data: referenceLayerDescription.data,
    fields: [],
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 0.5,
    strokeOpacity: 1,
    fillColor: '#a12f2f',
    fillOpacity: 1,
    dropShadow: false,
    blurFilter: false,
    shapeRendering: referenceLayerDescription.shapeRendering,
    rendererParameters: {} as GriddedLayerParameters,
    legend: {} as never,
  } as LayerDescriptionGriddedLayer;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );
}

export default function GridSettings(
  props: PortrayalSettingsProps,
): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  // The fields that can be used for computing the discontinuity.
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = createMemo(() => layerDescription()
    .fields?.filter((variable) => variable.type === 'stock' || variable.type === 'ratio'));

  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields()![0].name);

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(`Gridded_${layerDescription().name}`);

  const makePortrayal = () => {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Display loading overlay
    setGlobalStore({ isLoading: true });

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription().id,
        targetVariable(),
        layerName,
      );
      // Hide loading overlay
      setGlobalStore({ isLoading: false });
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-grid">
    <InputFieldSelect
      label={ LL().PortrayalSection.CommonOptions.Variable() }
      onChange={(value) => { setTargetVariable(value); }}
      value={ targetVariable() }
    >
      <For each={targetFields()}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputResultName
      onKeyUp={(value) => setNewLayerName(value)}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().PortrayalSection.CreateLayer() } onClick={ makePortrayal } />
  </div>;
}
