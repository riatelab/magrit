// Imports from solid-js
import {
  createMemo,
  createSignal,
  For,
  type JSX,
  Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Helpers
import { useI18nContext } from '../../../i18n/i18n-solid';
import { findSuitableName } from '../../../helpers/common';
import { generateIdLayer } from '../../../helpers/layers';
import { VariableType } from '../../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../../LegendRenderer/common.tsx';

// Subcomponents
import InputFieldSelect from '../../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';
import InputFieldNumber from '../../Inputs/InputNumber.tsx';

// Stores
import { setGlobalStore } from '../../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../../store/LayersDescriptionStore';

// Types / Interfaces / Enums
import type { PortrayalSettingsProps } from './common';
import { CartogramMethod, LayerDescriptionCartogram, RepresentationType } from '../../../global.d';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  cartogramMethod: CartogramMethod,
  newName: string,
) {
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId)!;

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(120, 340);

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newName,
    renderer: 'cartogram' as RepresentationType,
  } as LayerDescriptionCartogram;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );
}

export default function CartogramSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth).
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = createMemo(() => layerDescription()
    .fields?.filter((variable) => variable.type === VariableType.stock));

  // Signals for the current component:
  // the target variable, the target layer name, the method to use
  // (and the number of iterations for some algorithms)
  const [targetVariable, setTargetVariable] = createSignal<string>(targetFields()[0].name);
  const [newLayerName, setNewLayerName] = createSignal<string>(`Choropleth_${layerDescription().name}`);
  const [
    cartogramMethod,
    setCartogramMethod,
  ] = createSignal<CartogramMethod>('Dougenik' as CartogramMethod);
  const [
    numberOfIterations,
    setNumberOfIterations,
  ] = createSignal<number>(5);

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
        cartogramMethod(),
        layerName,
      );
      // Hide loading overlay
      setGlobalStore({ isLoading: false });
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-cartogram">
    <InputFieldSelect
      label={ LL().PortrayalSection.CommonOptions.Variable() }
      onChange={(value) => { setTargetVariable(value); }}
      value={ targetVariable() }
    >
      <For each={targetFields()}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().PortrayalSection.CartogramOptions.Algorithm()}
      onChange={(v) => setCartogramMethod(v as CartogramMethod)}
      value={cartogramMethod()}
      width={200}
    >
      <For each={Object.values(CartogramMethod)}>
        {
          (cm) => <option value={cm}>{LL().PortrayalSection.CartogramOptions[cm]()}</option>
        }
      </For>
    </InputFieldSelect>
    <Show when={cartogramMethod() === CartogramMethod.Dougenik}>
      <InputFieldNumber
        label={LL().PortrayalSection.CartogramOptions.Iterations()}
        value={numberOfIterations()}
        onChange={(v) => setNumberOfIterations(v)}
        min={1}
        max={100}
        step={1}
      />
    </Show>
    <InputResultName
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().PortrayalSection.CreateLayer() } onClick={ makePortrayal } />
  </div>;
}
