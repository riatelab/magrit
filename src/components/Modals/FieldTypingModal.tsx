import { Accessor, For, JSX } from 'solid-js';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { fieldTypingModalStore, setFieldTypingModalStore } from '../../store/FieldTypingModalStore';
import { useI18nContext } from '../../i18n/i18n-solid';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { VariableTypes, Variable } from '../../global.d';
import { detectTypeField } from '../../helpers/typeDetection';

const makeDropDownVariableType = (
  type: VariableTypes,
  LL: Accessor<TranslationFunctions>,
): JSX.Element => <div class="control">
    <div class="select">
      <select>
        <option value="identifier" selected={type === VariableTypes.identifier}>
          { LL().FieldsTyping.VariableTypes.identifier() }
        </option>
        <option value="stock" selected={type === VariableTypes.stock}>
          { LL().FieldsTyping.VariableTypes.stock() }
        </option>
        <option value="ratio" selected={type === VariableTypes.ratio}>
          { LL().FieldsTyping.VariableTypes.ratio() }
        </option>
        <option value="categorical" selected={type === VariableTypes.categorical}>
          { LL().FieldsTyping.VariableTypes.categorical() }
        </option>
        <option value="unknown" selected={type === VariableTypes.unknown}>
          { LL().FieldsTyping.VariableTypes.unknown() }
        </option>
      </select>
    </div>
  </div>;

export default function FieldTypingModal(): JSX.Element {
  const { LL } = useI18nContext();
  let bodyContent;

  const { layerId } = fieldTypingModalStore;
  const layer = layersDescriptionStore.layers.find((l) => l.id === layerId);

  const fields: string[] = Object.keys(layer.data.features[0].properties);
  let descriptions: Variable[];

  if (layer.fields) {
    descriptions = layer.fields;
  } else {
    descriptions = fields.map((field) => {
      const o = detectTypeField(layer.data.features.map((ft) => ft.properties[field]));
      return {
        name: field,
        hasMissingValues: o.hasMissingValues,
        type: o.variableType,
        dataType: o.dataType,
      };
    });
  }

  const getNewDescriptions = () => {
    // Fetch the selected option for each select element
    const selects = bodyContent.querySelectorAll('select');
    descriptions.forEach((field, i) => {
      selects[i].querySelectorAll('option').forEach((option) => {
        if (option.selected) {
          field.type = option.value as VariableTypes; // eslint-disable-line no-param-reassign
        }
      });
    });
    return descriptions;
  };

  return <div class="modal-window modal" style={{ display: 'flex' }}>
    <div class="modal-background"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">{ LL().FieldsTyping.ModalTitle() }</p>
        {/* <button class="delete" aria-label="close"></button> */}
      </header>
      <section class="modal-card-body" ref={bodyContent}>
        <For each={descriptions}>
          {
            (field) => <div class="field">
              <label class="label">{ field.name }</label>
              { makeDropDownVariableType(field.type, LL) }
            </div>
          }
        </For>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success"
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
              (l) => l.id === layerId,
              { fields: descriptions },
            );
            setFieldTypingModalStore({ show: false, layerId: '' });
          } }
        >{ LL().CancelButton() }</button>
      </footer>
    </div>
  </div>;
}
