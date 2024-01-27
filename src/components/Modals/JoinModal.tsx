// Imports from solid-js
import {
  Accessor,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  type JSX,
  Match,
  on,
  onMount,
  Show, Switch,
} from 'solid-js';

// Imports from other packages
import { FaSolidCircleInfo } from 'solid-icons/fa';

// Helpers
import { TranslationFunctions } from '../../i18n/i18n-types';
import { sleep, unproxify } from '../../helpers/common';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Sub-components
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldText from '../Inputs/InputText.tsx';

// Types / Interfaces / Enums
import type { GeoJSONFeature, LayerDescription, TableDescription } from '../../global';
import MultipleSelect from '../MultipleSelect.tsx';

interface JoinResult {
  nFeaturesTable: number,
  nFeaturesLayer: number,
  nMatchTable: number,
  nMatchLayer: number,
  nNoMatchTable: number,
  nNoMatchLayer: number,
  nNoDataTable: number,
  nNoDataLayer: number,
}

const checkJoin = async (
  tableId: string,
  tableField: string,
  layerId: string,
  layerField: string,
): Promise<JoinResult | undefined> => {
  if (tableId === '' || tableField === '' || layerId === '' || layerField === '') {
    return undefined;
  }
  // The table description of the reference table
  const tableDescription: TableDescription = layersDescriptionStore.tables
    .find((l) => l.id === tableId)!;

  // The layer description of the reference layer
  const layerDescription: LayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === layerId)!;

  // The table field values, all converted to string
  const tableFieldValues = tableDescription.data
    .map((d) => `${d[tableField]}`);

  // The layer field values, all converted to string
  const layerFieldValues = layerDescription.data.features
    .map((f) => `${f.properties[layerField]}`);

  // The result
  const result: JoinResult = {
    nFeaturesTable: tableDescription.data.length,
    nFeaturesLayer: layerDescription.data.features.length,
    nMatchTable: 0,
    nMatchLayer: 0,
    nNoMatchTable: 0,
    nNoMatchLayer: 0,
    nNoDataTable: 0,
    nNoDataLayer: 0,
  };

  // For each table field value
  tableFieldValues.forEach((v, i) => {
    // If the value is null
    if (v === null) {
      result.nNoDataTable += 1;
    } else {
      // If the value is not null
      // If the value is in the layer field values
      // Note that we convert the value to string to be able to compare it
      // eslint-disable-next-line no-lonely-if
      if (layerFieldValues.includes(`${v}`)) {
        result.nMatchTable += 1;
      } else {
        result.nNoMatchTable += 1;
      }
    }
  });

  // For each layer field value
  layerFieldValues.forEach((v, i) => {
    // If the value is null
    if (v === null) {
      result.nNoDataLayer += 1;
    } else {
      // If the value is not null
      // If the value is in the table field values
      // Note that we convert the value to string to be able to compare it
      // eslint-disable-next-line no-lonely-if
      if (tableFieldValues.includes(`${v}`)) {
        result.nMatchLayer += 1;
      } else {
        result.nNoMatchLayer += 1;
      }
    }
  });

  // Just to test the loading indicator
  await sleep(1000);

  return result;
};

const doJoin = async (
  tableId: string,
  tableField: string,
  layerId: string,
  layerField: string,
  usePrefix: boolean,
  prefixValue: string,
  selectFields: boolean,
  selectedFields: string[],
): Promise<void> => {
  if (tableId === '' || tableField === '' || layerId === '' || layerField === '') {
    return;
  }
  // The table description of the reference table
  const tableDescription: TableDescription = layersDescriptionStore.tables
    .find((l) => l.id === tableId)!;

  // The layer description of the reference layer
  const layerDescription: LayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === layerId)!;

  // Use index to speed up the join
  const tableIndex = new Map(
    tableDescription.data.map((item) => [String(item[tableField]), item]),
  );

  // The joined data as an array of GeoJSON features
  const jointData = layerDescription.data.features.map((ft: GeoJSONFeature) => {
    const feature = unproxify(ft as never) as GeoJSONFeature;
    const jsonItem = tableIndex.get(String(feature.properties[layerField]));
    if (!jsonItem) {
      return feature;
    }
    if (!usePrefix && !selectFields) {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          ...jsonItem,
          [layerField]: feature.properties[layerField],
        },
      };
    }
    if (usePrefix && !selectFields) {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          ...Object.fromEntries(
            Object.entries(jsonItem).map(([k, v]) => [`${prefixValue}${k}`, v]),
          ),
          [layerField]: feature.properties[layerField],
        },
      };
    }
    if (!usePrefix && selectFields) {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          ...Object.fromEntries(
            Object.entries(jsonItem).filter(([k, v]) => selectedFields.includes(k)),
          ),
          [layerField]: feature.properties[layerField],
        },
      };
    }
    // So we have usePrefix && selectFields
    return {
      ...feature,
      properties: {
        ...feature.properties,
        ...Object.fromEntries(
          Object.entries(jsonItem)
            .filter(([k, v]) => selectedFields.includes(k))
            .map(([k, v]) => [`${prefixValue}${k}`, v]),
        ),
        [layerField]: feature.properties[layerField],
      },
    };
  }) as GeoJSONFeature[];

  console.log(jointData);
};

export default function JoinPanel(
  props: {
    id: string,
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const { id, LL } = props; // eslint-disable-line solid/reactivity
  const tableDescription = layersDescriptionStore.tables
    .find((l) => l.id === id) as TableDescription;

  let refJoinPanel: HTMLDivElement;
  let refSuccessButton: HTMLButtonElement;

  const [targetLayerId, setTargetLayerId] = createSignal('');
  const [targetFieldTable, setTargetFieldTable] = createSignal('');
  const [targetFieldLayer, setTargetFieldLayer] = createSignal('');

  const allSelected = createMemo(() => (
    targetLayerId() !== ''
    && targetFieldTable() !== ''
    && targetFieldLayer() !== ''
  ));

  // We use a resource to check the join, this allow us to easily
  // display a loading indicator while the join is being checked
  const [joinResult, { mutate: mutateJoinResult }] = createResource(
    allSelected, // Recompute when all the fields are selected
    // eslint-disable-next-line solid/reactivity
    async () => checkJoin(
      id,
      targetFieldTable(),
      targetLayerId(),
      targetFieldLayer(),
    ),
  );

  // Do we want to use a prefix for the joined field names?
  const [usePrefix, setUsePrefix] = createSignal(false);
  const [prefixValue, setPrefixValue] = createSignal(`${tableDescription.name}_`);

  // Do we want to only join a subset of the fields?
  const [selectFields, setSelectFields] = createSignal(false);
  const [selectedFields, setSelectedFields] = createSignal<string[]>([]);

  onMount(() => {
    refSuccessButton = refJoinPanel.parentElement!.parentElement!.parentElement!
      .querySelector('.button.is-success')! as HTMLButtonElement;

    refSuccessButton.disabled = true;

    refSuccessButton
      .addEventListener('click', () => {
        console.log(targetLayerId(), targetFieldLayer(), targetFieldTable());
        doJoin(
          id,
          targetFieldTable(),
          targetLayerId(),
          targetFieldLayer(),
          usePrefix(),
          prefixValue(),
          selectFields(),
          selectedFields(),
        );
      });

    createEffect(
      on(
        () => [targetLayerId(), targetFieldTable(), targetFieldLayer()],
        () => {
          refSuccessButton.disabled = !allSelected();
          if (!allSelected()) {
            // Mutate the resource to reset the join result to undefined
            mutateJoinResult(undefined);
          }
        },
      ),
    );
  });

  return <div class="join-panel" ref={refJoinPanel!}>
    <section
      class="has-text-centered"
      style={{
        padding: '20px',
        margin: '0 -20px 20px',
        background: '#cafbe5',
        'border-top': '1px solid #dbdbdb',
      }}
    >
      <FaSolidCircleInfo
        fill="darkgreen"
        style={{ height: '1.5em', width: '1.5em' }}
      />
      <p>{LL().JoinPanel.Information()}</p>
    </section>
    <InputFieldSelect
      label={LL().JoinPanel.TargetLayer()}
      onChange={(v) => {
        setTargetLayerId(v);
      }}
      value={''}
    >
      <option value=''>
        {LL().JoinPanel.TargetLayerPlaceholder()}
      </option>
      <For each={layersDescriptionStore.layers}>
        {(layer) => <option value={layer.id}>{layer.name}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().JoinPanel.JoinFieldTable()}
      onChange={(v) => {
        setTargetFieldTable(v);
      }}
      value={''}
    >
      <option value=''>
        {LL().JoinPanel.JoinFieldPlaceholder()}
      </option>
      <For each={tableDescription.fields}>
        {(field) => <option value={field.name}>{field.name}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().JoinPanel.JoinFieldLayer()}
      onChange={(v) => {
        setTargetFieldLayer(v);
      }}
      value={''}
    >
      <option value=''>
        {LL().JoinPanel.JoinFieldPlaceholder()}
      </option>
      <Show when={targetLayerId() !== ''}>
        <For each={
          layersDescriptionStore.layers.find((layer) => layer.id === targetLayerId())!.fields
        }>
          {(field) => <option value={field.name}>{field.name}</option>}
        </For>
      </Show>
    </InputFieldSelect>
    <Switch>
      <Match when={joinResult.loading}>
        <p><i>{ LL().JoinPanel.Loading() }</i></p>
      </Match>
      <Match when={!joinResult.loading && joinResult()}>
        <hr/>
        <h3>{ LL().JoinPanel.ResultInformation() }</h3>

        <hr />
        <InputFieldCheckbox
          label={LL().JoinPanel.Prefix()}
          checked={usePrefix()}
          onChange={(v) => setUsePrefix(v)}
        />
        <Show when={usePrefix()}>
          <InputFieldText
            label={LL().JoinPanel.PrefixValue()}
            value={prefixValue()}
            onChange={(v) => { setPrefixValue(v); }}
          />
        </Show>
        <InputFieldCheckbox
          label={LL().JoinPanel.SelectFields()}
          checked={selectFields()}
          onChange={(v) => setSelectFields(v)}
        />
        <Show when={selectFields()}>
          <MultipleSelect size={tableDescription.fields.length}>
            <For each={tableDescription.fields}>
              {(field) => <option value={field.name}>{field.name}</option>}
            </For>
          </MultipleSelect>
        </Show>
      </Match>
    </Switch>
  </div>;
}
