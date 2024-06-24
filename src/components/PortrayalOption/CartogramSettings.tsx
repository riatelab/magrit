// Imports from solid-js
import {
  createMemo,
  createSignal,
  For,
  type JSX,
  Show,
} from 'solid-js';
import { produce, unwrap } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  computeCartogramDougenik,
  computeCartogramGastnerSeguyMore,
  computeCartogramOlson,
} from '../../helpers/cartograms';
import { randomColorFromCategoricalPalette } from '../../helpers/color';
import { findSuitableName, isPositiveFiniteNumber, unproxify } from '../../helpers/common';
import { generateIdLayer } from '../../helpers/layers';
import { DataType, type Variable, VariableType } from '../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';
import { getProjectionUnit } from '../../helpers/projection';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import MessageBlock from '../MessageBlock.tsx';

// Stores
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { mapStore } from '../../store/MapStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';

// Types / Interfaces / Enums
import type { PortrayalSettingsProps } from './common';
import {
  CartogramMethod,
  type CartogramParameters,
  type LayerDescriptionCartogram,
  RepresentationType,
} from '../../global.d';

async function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  cartogramMethod: CartogramMethod,
  newName: string,
  iterations: number,
) {
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId)!;

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  const inputData = unproxify(referenceLayerDescription.data as never);

  let newData;
  if (cartogramMethod === CartogramMethod.Olson) {
    newData = computeCartogramOlson(
      inputData,
      targetVariable,
      mapStore.projection,
    );
  } else if (cartogramMethod === CartogramMethod.GastnerSeguyMore) {
    newData = await computeCartogramGastnerSeguyMore(
      inputData,
      targetVariable,
      mapStore.projection,
    );
  } else {
    newData = computeCartogramDougenik(
      inputData,
      targetVariable,
      iterations,
    );
  }

  const newFields = unproxify(referenceLayerDescription.fields as never) as Variable[];

  if (
    cartogramMethod === CartogramMethod.GastnerSeguyMore
    || cartogramMethod === CartogramMethod.Dougenik
  ) {
    // There is a new "area-error" field
    newFields.push({
      name: 'area_error',
      type: VariableType.ratio,
      hasMissingValues: false,
      dataType: 'number' as DataType,
    });
  } else { // cartogramMethod === CartogramMethod.Olson
    // There is a new "scale" field
    newFields.push({
      name: 'scale',
      type: VariableType.ratio,
      hasMissingValues: false,
      dataType: 'number' as DataType,
    });
  }

  // Find a position for the legend
  // const legendPosition = getPossibleLegendPosition(120, 340);

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newName,
    type: 'polygon',
    representationType: 'cartogram' as RepresentationType,
    data: newData,
    fields: newFields,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 0.5,
    strokeOpacity: 1,
    fillColor: randomColorFromCategoricalPalette('Vivid'),
    fillOpacity: 1,
    dropShadow: null,
    shapeRendering: referenceLayerDescription.shapeRendering,
    layerCreationOptions: {
      variable: targetVariable,
      method: cartogramMethod,
      iterations: cartogramMethod === CartogramMethod.Dougenik ? iterations : undefined,
    } as CartogramParameters,
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
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth).
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === VariableType.stock);

  // The description of the current projection
  const currentProjection = unwrap(mapStore.projection);
  const {
    isGeo,
    unit: distanceUnit,
  } = getProjectionUnit(currentProjection);

  console.log(isGeo, distanceUnit);

  // Signals for the current component:
  // the target variable, the target layer name, the method to use
  // (and the number of iterations for some algorithms)
  const [targetVariable, setTargetVariable] = createSignal<string>(targetFields[0].name);
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.CartogramOptions.NewLayerName({
      layerName: layerDescription.name,
    }) as string,
  );
  const [
    cartogramMethod,
    setCartogramMethod,
  ] = createSignal<CartogramMethod>('Dougenik' as CartogramMethod);
  const [
    numberOfIterations,
    setNumberOfIterations,
  ] = createSignal<number>(5);

  const hasMissingOrZeroValues = createMemo(() => {
    const v = targetVariable();
    let hasMissingOrZero = false;
    for (let i = 0; i < layerDescription.data.features.length; i += 1) {
      if (!isPositiveFiniteNumber(layerDescription.data.features[i].properties[v])) {
        hasMissingOrZero = true;
        break;
      }
    }
    return hasMissingOrZero;
  });

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('interactive');

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        targetVariable(),
        cartogramMethod(),
        layerName,
        numberOfIterations(),
      ).then(() => {
        // Hide loading overlay
        setLoading(false);

        // Open the LayerManager to show the new layer
        openLayerManager();
      });
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-cartogram">
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.CommonOptions.Variable() }
      onChange={(value) => { setTargetVariable(value); }}
      value={ targetVariable() }
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().FunctionalitiesSection.CartogramOptions.Algorithm()}
      onChange={(v) => setCartogramMethod(v as CartogramMethod)}
      value={cartogramMethod()}
    >
      <For each={Object.values(CartogramMethod)}>
        {
          (cm) => <option value={cm}>{LL().FunctionalitiesSection.CartogramOptions[cm]()}</option>
        }
      </For>
    </InputFieldSelect>
    <Show when={cartogramMethod() === CartogramMethod.Dougenik}>
      <InputFieldNumber
        label={LL().FunctionalitiesSection.CartogramOptions.Iterations()}
        value={numberOfIterations()}
        onChange={(v) => setNumberOfIterations(v)}
        min={1}
        max={100}
        step={1}
      />
    </Show>
    <Show when={hasMissingOrZeroValues()}>
      <MessageBlock type={'warning'} useIcon={true}>
        {/* eslint-disable-next-line solid/no-innerhtml, max-len */}
        <p innerHTML={LL().FunctionalitiesSection.CartogramOptions.WarningMissingOrZeroValues()}></p>
      </MessageBlock>
    </Show>
    <Show when={isGeo}>
      <MessageBlock type={'warning'} useIcon={true}>
        {/* eslint-disable-next-line solid/no-innerhtml */}
        <p innerHTML={LL().FunctionalitiesSection.CartogramOptions.WarningGeo()}></p>
      </MessageBlock>
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={ LL().FunctionalitiesSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
