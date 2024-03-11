import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  on,
  Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName } from '../../helpers/common';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setPortrayalSelectionStore } from '../../store/PortrayalSelectionStore';
import { setLoading } from '../../store/GlobalStore';

// Subcomponents
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';
import { PortrayalSettingsProps } from './common';
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputResultName from './InputResultName.tsx';

// Types / Interfaces / Enums
import { LayerDescription } from '../../global';
import FormulaInput from '../FormulaInput.tsx';

async function onClickValidate(
  referenceLayerId: string,
  formula: string,
  newLayerName: string,
) {
  return 1;
}

export default function SelectionSettings(
  props: PortrayalSettingsProps,
): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((layer) => layer.id === props.layerId) as LayerDescription);

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>('');

  const [
    formula,
    setFormula,
  ] = createSignal<string>('');

  const [
    sampleOutput,
    setSampleOutput,
  ] = createSignal<string>('');
  const makePortrayal = async () => {
    // Check name of the new layer
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setPortrayalSelectionStore({ show: false, layerId: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Actually create the layer
    setTimeout(async () => {
      await onClickValidate(
        layerDescription().id,
        formula(),
        layerName,
      );

      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-selection">
    <FormulaInput
      typeDataset={'layer'}
      dsDescription={layerDescription()}
      currentFormula={formula}
      setCurrentFormula={setFormula}
    />
    <div class="control" style={{ display: 'flex', height: '7em' }}>
      <div style={{ display: 'flex', 'align-items': 'center', width: '12%' }}>
        <label class="label">{LL().DataTable.NewColumnModal.sampleOutput()}</label>
      </div>
      <pre
        style={{ display: 'flex', 'align-items': 'center', width: '120%' }}
        classList={{ 'has-text-danger': sampleOutput().startsWith('Error') }}
        id="sample-output"
      >
        {sampleOutput()}
      </pre>
    </div>
    <InputResultName
      onKeyUp={(value) => {
        setNewLayerName(value);
      }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={LL().PortrayalSection.CreateLayer()}
      onClick={makePortrayal}
    />
  </div>;
}
