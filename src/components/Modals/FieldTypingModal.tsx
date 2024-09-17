// Imports from solid-js
import {
  For, JSX, onMount, Show,
} from 'solid-js';

// Stores
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { modalStore, setModalStore } from '../../store/ModalStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { unproxify } from '../../helpers/common';
import { VariableType, Variable } from '../../helpers/typeDetection';

// Subcomponents
import MessageBlock from '../MessageBlock.tsx';

// Types / Interfaces / Enums
import type { GeoJSONFeatureCollection, LayerDescription, TableDescription } from '../../global';

export default function FieldTypingModal(
  props: {
    id: string,
    type: 'layer' | 'table',
  },
): JSX.Element {
  const { LL } = useI18nContext();

  // We can destructure the props directly here because we don't
  // care about losing their reactivity (they won't change while the modal is open)
  // eslint-disable-next-line solid/reactivity
  const { id: targetId, type: targetType } = props;

  // Do we need to search for the dataset in the "layers" or "tables" array?
  const key = `${targetType}s` as Exclude<keyof LayersDescriptionStoreType, 'layoutFeaturesAndLegends'>;

  const dataset = layersDescriptionStore[key].find((l) => l.id === targetId);

  // This should never happen (due to the way the modal is called)
  if (!dataset) {
    throw new Error(`Layer or table '${targetId}' not found`);
  }

  const hasDuplicates: Record<string, boolean> = {};
  const hasOnlyOneModality: Record<string, boolean> = {};

  dataset.fields.forEach((field) => {
    const varName = field.name;
    const values = key === 'layers'
      ? (dataset.data as GeoJSONFeatureCollection).features.map((f) => f.properties[varName])
      : (dataset.data as Record<string, any>[]).map((f) => f[varName]);
    const filteredValues = values.filter((v) => v !== null && v !== '' && v !== undefined);
    const dedupValues = new Set(filteredValues);
    hasDuplicates[varName] = filteredValues.length !== dedupValues.size;
    hasOnlyOneModality[varName] = dedupValues.size === 1;
  });

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

  onMount(() => {
    // Did the caller already provide a confirm callback?
    // If so we need to keep it and call it after our own confirm callback
    let cfcb: undefined | (() => void);
    if (modalStore.confirmCallback) {
      cfcb = modalStore.confirmCallback;
    }
    // Did the caller already provide a cancel callback?
    // If so we need to keep it and call it after our own cancel callback
    let cncb: undefined | (() => void);
    if (modalStore.cancelCallback) {
      cncb = modalStore.cancelCallback;
    }
    setModalStore({
      confirmCallback: () => {
        const newDescriptions = getNewDescriptions();
        // Compare the new descriptions with the old ones
        // to avoid changing the store if nothing changed
        if (JSON.stringify(newDescriptions) !== JSON.stringify(descriptions)) {
          setLayersDescriptionStore(
            key,
            (l: LayerDescription | TableDescription) => l.id === targetId,
            { fields: newDescriptions },
          );
        }
        // Call the callback provided by the caller
        if (cfcb) { cfcb(); }
      },
      cancelCallback: () => {
        // Reset the descriptions to their original values when clicking on cancel
        setLayersDescriptionStore(
          key,
          (l: LayerDescription | TableDescription) => l.id === targetId,
          { fields: descriptions },
        );
        // Call the callback provided by the caller
        if (cncb) { cncb(); }
      },
    });
  });

  return <div ref={refParentNode!}>
    <MessageBlock type={'info'}>
      <p>{LL().FieldsTyping.Information1()}</p>
      {/* eslint-disable-next-line solid/no-innerhtml */}
      <p innerHTML={LL().FieldsTyping.Information2()}></p>
    </MessageBlock>
    <For each={descriptions}>
      {
        (field) => (
          <div class="field">
            <label class="label">{field.name}</label>
            <div class="control">
              <div class="select">
                <select>
                  <Show when={!hasDuplicates[field.name]}>
                    <option value="identifier" selected={field.type === VariableType.identifier}>
                      {LL().FieldsTyping.VariableTypes.identifier()}
                    </option>
                  </Show>
                  <Show when={field.dataType === 'number'}>
                    <option value="stock" selected={field.type === VariableType.stock}>
                      {LL().FieldsTyping.VariableTypes.stock()}
                    </option>
                  </Show>
                  <Show when={field.dataType === 'number' && !hasOnlyOneModality[field.name]}>
                    <option value="ratio" selected={field.type === VariableType.ratio}>
                      {LL().FieldsTyping.VariableTypes.ratio()}
                    </option>
                  </Show>
                  <option value="categorical" selected={field.type === VariableType.categorical}>
                    {LL().FieldsTyping.VariableTypes.categorical()}
                  </option>
                  <option value="unknown" selected={field.type === VariableType.unknown}>
                    {LL().FieldsTyping.VariableTypes.unknown()}
                  </option>
                </select>
              </div>
            </div>
          </div>
        )
      }
    </For>
  </div>;
}
