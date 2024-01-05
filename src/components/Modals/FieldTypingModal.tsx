// Imports from solid-js
import { For, JSX } from 'solid-js';
import { autofocus } from '@solid-primitives/autofocus';

// Stores
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import {
  fieldTypingModalStore,
  resetFieldTypingModalStore,
} from '../../store/FieldTypingModalStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { unproxify } from '../../helpers/common';
import { VariableType, Variable } from '../../helpers/typeDetection';

// Types / Interfaces / Enums
import type { LayerDescription } from '../../global';

export default function FieldTypingModal(): JSX.Element {
  const { LL } = useI18nContext();
  const { targetId, targetType } = fieldTypingModalStore;

  // Do we need to search for the dataset in the "layers" or "tables" array?
  const key = `${targetType}s` as Exclude<keyof LayersDescriptionStoreType, 'layoutFeatures'>;

  const dataset = layersDescriptionStore[key].find((l) => l.id === targetId);

  // This should never happen (due to the way the modal is called)
  if (!dataset) {
    throw new Error(`Layer or table '${targetId}' not found`);
  }

  const descriptions = unproxify(dataset.fields as never) as Variable[];

  let refParentNode: HTMLDivElement;

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

  return <div class="modal-window modal" style={{ display: 'flex' }} ref={refParentNode!}>
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
            // Compare the new descriptions with the old ones
            // to avoid changing the store if nothing changed
            if (JSON.stringify(newDescriptions) !== JSON.stringify(descriptions)) {
              setLayersDescriptionStore(
                'layers',
                (l: LayerDescription) => l.id === targetId,
                { fields: newDescriptions },
              );
            }
            resetFieldTypingModalStore();
          } }
        >{ LL().SuccessButton() }</button>
        <button
          class="button"
          onClick={ () => {
            // Reset the descriptions to their original values when clicking on cancel
            setLayersDescriptionStore(
              'layers',
              (l: LayerDescription) => l.id === targetId,
              { fields: descriptions },
            );
            resetFieldTypingModalStore();
          } }
        >{ LL().CancelButton() }</button>
      </footer>
    </div>
  </div>;
}
