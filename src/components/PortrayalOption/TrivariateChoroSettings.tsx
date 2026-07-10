// Import from solid-js
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  on, Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';
import {
  tricolore,
  tricoloreSextant,
  TricoloreViz,
  CompositionUtils,
} from 'tricolore';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { generateIdLayer } from '../../helpers/layers';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import MessageBlock from '../MessageBlock.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import { VariableType } from '../../helpers/typeDetection';
import { findSuitableName } from '../../helpers/common';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
import { setLoading } from '../../store/GlobalStore';
import { TricoloreScaleType } from '../../global.d';

function onClickValidate(
  referenceLayerId: string,
  targetVariables: [string, string, string],
  newName: string,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(420, 420);

  // Generate ID of new layer
  const newId = generateIdLayer();
}

export default function TrivariateChoroSettings(props: PortrayalSettingsProps): JSX.Element {
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
  const [targetVariable3, setTargetVariable3] = createSignal<string>(targetFields[2].name);

  // - whether to use mean centering
  const [useMeanCentering, setUseMeanCentering] = createSignal<boolean>(false);

  // - whether the color scale is discrete, continuous or sextant
  const [
    colorScaleType,
    setColorScaleType,
  ] = createSignal<TricoloreScaleType>(TricoloreScaleType.Discrete);

  // TODO: add logic to check
  const isTernaryComposition = createMemo(() => false);

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.TrivariateChoroplethOptions.NewLayerName({
      variable1: targetVariable1(),
      variable2: targetVariable2(),
      variable3: targetVariable3(),
      layerName: layerDescription.name,
    }) as string,
  );

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Actually create the layer
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        [targetVariable1(), targetVariable2(), targetVariable3()],
        layerName,
      );

      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  createEffect(
    on(
      () => [targetVariable1(), targetVariable2(), targetVariable3()],
      () => {
        setNewLayerName(
          LL().FunctionalitiesSection.TrivariateChoroplethOptions.NewLayerName({
            variable1: targetVariable1(),
            variable2: targetVariable2(),
            variable3: targetVariable3(),
            layerName: layerDescription.name,
          }) as string,
        );
      },
    ),
  );

  return <div class="portrayal-section__portrayal-options-trivariatechoropleth">
    <InputFieldSelect
      label={ `${LL().FunctionalitiesSection.CommonOptions.Variable()} 1` }
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
      label={ `${LL().FunctionalitiesSection.CommonOptions.Variable()} 2` }
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
      label={ `${LL().FunctionalitiesSection.CommonOptions.Variable()} 3` }
      onChange={(value) => {
        setTargetVariable3(value);
      }}
      value={ targetVariable3() }
    >
      <For each={targetFields}>
        { (variable) => <option value={ variable.name }>{ variable.name }</option> }
      </For>
    </InputFieldSelect>
    <Show when={!isTernaryComposition()}>
      <MessageBlock type={'danger'} useIcon={true}>
        { LL().FunctionalitiesSection.TrivariateChoroplethOptions.InformationTernaryComposition() }
      </MessageBlock>
    </Show>
    <Show when={isTernaryComposition()}>
      <InputFieldSelect
        label={ LL().FunctionalitiesSection.TrivariateChoroplethOptions.ColorScaleType() }
        onChange={(value) => { setColorScaleType(value as TricoloreScaleType); }}
        value={colorScaleType()}
      >
        <For each={Object.entries(TricoloreScaleType)}>
          {([key, value]) => <option value={key}>{value}</option>}
        </For>
      </InputFieldSelect>
      <InputFieldCheckbox
        label={ LL().FunctionalitiesSection.TrivariateChoroplethOptions.UseMeanCentering() }
        checked={useMeanCentering()}
        onChange={(value) => { setUseMeanCentering(value); }}
      />
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => { setNewLayerName(value); }}
      onEnter={ makePortrayal }
    />
    <ButtonValidation
      label={ LL().FunctionalitiesSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
