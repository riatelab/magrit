// Import from solid-js
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  on,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
import { setLoading } from '../../store/GlobalStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { VariableType } from '../../helpers/typeDetection';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import type { ClassificationParameters } from '../../global';

function onClickValidate(
  referenceLayerId: string,
  targetVariables: [string, string],
) {

}

export default function BivariateChoroSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!; // eslint-disable-line solid/reactivity

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth).
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === VariableType.ratio);

  // Signals for the current component:
  // - the target variables,
  const [targetVariable1, setTargetVariable1] = createSignal<string>(targetFields[0].name);
  const [targetVariable2, setTargetVariable2] = createSignal<string>(targetFields[1].name);

  // - the classification method for each of the variables
  const [
    classificationVar1,
    setClassificationVar1,
  ] = createSignal<ClassificationParameters>();
  const [
    classificationVar2,
    setClassificationVar2,
  ] = createSignal<ClassificationParameters>();

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.BivariateChoroplethOptions.NewLayerName({
      variable1: targetVariable1(),
      variable2: targetVariable2(),
      layerName: layerDescription.name,
    }) as string,
  );

  createEffect(
    on(
      () => [targetVariable1(), targetVariable2()],
      () => {
        setNewLayerName(
          LL().FunctionalitiesSection.BivariateChoroplethOptions.NewLayerName({
            variable1: targetVariable1(),
            variable2: targetVariable2(),
            layerName: layerDescription.name,
          }) as string,
        );
      },
    ),
  );

  const makePortrayal = async () => {
    // Close the current modal
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');
  };

  return <div class="portrayal-section__portrayal-options-bivariatechoropleth">
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.CommonOptions.Variable() }
      onChange={(value) => {
        setTargetVariable1(value);
      }}
      value={ targetVariable1() }
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.CommonOptions.Variable() }
      onChange={(value) => {
        setTargetVariable2(value);
      }}
      value={ targetVariable2() }
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={'Classification variable 1'}
      onChange={(value) => {}}
    >
     <For each={['quantiles', 'ckmeans']}>
       { (method) => <option value={ method }>{ method }</option> }
     </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={'Classification variable 2'}
      onChange={(value) => {}}
    >
      <For each={['quantiles', 'ckmeans']}>
        { (method) => <option value={ method }>{ method }</option> }
      </For>
    </InputFieldSelect>
    <InputResultName
      value={newLayerName()}
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      disabled={
        targetVariable1() === targetVariable2()
        || classificationVar1() === undefined
        || classificationVar2() === undefined
      }
      label={ LL().FunctionalitiesSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
