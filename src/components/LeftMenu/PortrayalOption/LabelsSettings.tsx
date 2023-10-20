// Import from solid-js
import {
  createMemo,
  createSignal,
  For,
  JSX,
  Show,
} from 'solid-js';

// Stores
import { layersDescriptionStore } from '../../../store/LayersDescriptionStore';

// Helpers
import { useI18nContext } from '../../../i18n/i18n-solid';

// Subcomponents
import InputResultName from './InputResultName.tsx';

// Types / Interfaces / Enums
import { VariableType } from '../../../global';

function makePortrayal() {
  console.log('make labels portrayal');
}

export default function LabelsSettings(props: { layerId: string }): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth)
  const targetFields = createMemo(() => layerDescription().fields);

  const [targetVariable, setTargetVariable] = createSignal<string>(targetFields()[0].name);
  const [newLayerName, setNewLayerName] = createSignal<string>(`Choropleth_${layerDescription().name}`);

  return <div class="portrayal-section__portrayal-options-labels">
    <div class="field">
      <label class="label"> { LL().PortrayalSection.CommonOptions.Variable() } </label>
      <div class="select" style={{ 'max-width': '60%' }}>
        <select>
          <For each={targetFields()}>
            { (variable) => <option value={ variable.name }>{ variable.name }</option> }
          </For>
        </select>
      </div>
    </div>
    <InputResultName
      onKeyUp={(value) => setNewLayerName(value)}
      onEnter={makePortrayal}
    />
  </div>;
}
