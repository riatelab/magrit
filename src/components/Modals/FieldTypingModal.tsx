// Imports from solid-js
import { For, JSX } from 'solid-js';
import { autofocus } from '@solid-primitives/autofocus';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { fieldTypingModalStore, setFieldTypingModalStore } from '../../store/FieldTypingModalStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { unproxify } from '../../helpers/common';
import { detectTypeField, VariableType, Variable } from '../../helpers/typeDetection';
import { LayerDescription } from '../../global';

export default function FieldTypingModal(): JSX.Element {
  const { LL } = useI18nContext();
  const { layerId } = fieldTypingModalStore;
  const layer = layersDescriptionStore.layers.find((l) => l.id === layerId);

  let refParentNode: HTMLDivElement;

  // This should never happen (due to the way the modal is called)
  if (!layer) {
    throw new Error('Layer not found');
  }

  const fields: string[] = Object.keys(layer.data.features[0].properties);
  let descriptions: Variable[];

  if (layer.fields) {
    // If the layers fields are already typed, use them..
    descriptions = unproxify(layer.fields) as Variable[];
  } else {
    // ...otherwise, try to guess the type of each field
    descriptions = fields.map((field) => {
      const o = detectTypeField(
        layer.data.features.map((ft) => ft.properties[field]),
        field,
      );
      return {
        name: field,
        hasMissingValues: o.hasMissingValues,
        type: o.variableType,
        dataType: o.dataType,
      };
    });
  }

  const getNewDescriptions = () => {
    // Get all the select elements
    // (they are in the same order as the fields in the 'description' array)
    const selects = (refParentNode as HTMLDivElement).querySelectorAll('select');
    // Fetch the selected option for each select element
    return descriptions
      .map((field, i) => {
        const nf = { ...field };
        selects[i].querySelectorAll('option')
          .forEach((option) => {
            if (option.selected) {
              nf.type = option.value as VariableType; // eslint-disable-line no-param-reassign
            }
          });
        return nf;
      });
  };

  return <div class="modal-window modal" style={{ display: 'flex' }} ref={refParentNode}>
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{ LL().FieldsTyping.ModalTitle() }</p>
        {/* <button class="delete" aria-label="close"></button> */}
      </header>
      <section class="modal-card-body">
        <For each={descriptions}>
          {
            (field) => (
              <div class="field">
                <label class="label">{ field.name }</label>
                <div class="control">
                  <div class="select">
                    <select>
                      <option value="identifier" selected={field.type === VariableType.identifier}>
                        { LL().FieldsTyping.VariableTypes.identifier() }
                      </option>
                      <option value="stock" selected={field.type === VariableType.stock}>
                        { LL().FieldsTyping.VariableTypes.stock() }
                      </option>
                      <option value="ratio" selected={field.type === VariableType.ratio}>
                        { LL().FieldsTyping.VariableTypes.ratio() }
                      </option>
                      <option value="categorical" selected={field.type === VariableType.categorical}>
                        { LL().FieldsTyping.VariableTypes.categorical() }
                      </option>
                      <option value="unknown" selected={field.type === VariableType.unknown}>
                        { LL().FieldsTyping.VariableTypes.unknown() }
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )
          }
        </For>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success"
          ref={autofocus}
          autofocus
          onClick={ () => {
            const newDescriptions = getNewDescriptions();
            setLayersDescriptionStore(
              'layers',
              (l) => l.id === layerId,
              { fields: newDescriptions },
            );
            setFieldTypingModalStore({ show: false, layerId: '' });
          } }
        >{ LL().SuccessButton() }</button>
        <button
          class="button"
          onClick={ () => {
            setLayersDescriptionStore(
              'layers',
              (l: LayerDescription) => l.id === layerId,
              { fields: descriptions },
            );
            setFieldTypingModalStore({ show: false, layerId: '' });
          } }
        >{ LL().CancelButton() }</button>
      </footer>
    </div>
  </div>;
}
