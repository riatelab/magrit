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
  Show,
  Switch,
} from 'solid-js';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// GeoJSON types
import { Feature } from 'geojson';

// Helpers
import { TranslationFunctions } from '../../i18n/i18n-types';
import { isNonNull, removeDiacritics, unproxify } from '../../helpers/common';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setLoading } from '../../store/GlobalStore';

// Sub-components
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldText from '../Inputs/InputText.tsx';
import MultipleSelect from '../MultipleSelect.tsx';
import MessageBlock from '../MessageBlock.tsx';

// Types / Interfaces / Enums
import type { Variable } from '../../helpers/typeDetection';
import type { LayerDescription, TableDescription } from '../../global';

// Style
import '../../styles/JoinModal.css';

interface JoinResult {
  nFeaturesTable: number,
  nFeaturesLayer: number,
  nMatchTable: number,
  nMatchLayer: number,
  nNoMatchTable: number,
  nNoMatchLayer: number,
  nNoDataTable: number,
  nNoDataLayer: number,
  noMatchLayerFeatures: Record<string, any>[],
  noMatchTableFeatures: Record<string, any>[],
}

/* eslint-disable no-nested-ternary */
const getTransformFn = (
  ignoreCase: boolean,
  normalizeText: boolean,
): ((s: any) => string | null) => (
  !ignoreCase && !normalizeText
    ? (s: any) => (isNonNull(s) ? `${s}` : null)
    : ignoreCase && !normalizeText
      ? (s: any) => (isNonNull(s) ? `${s}`.toLowerCase() : null)
      : normalizeText && !ignoreCase
        ? (s: any) => (
          isNonNull(s)
            ? removeDiacritics(`${s}`).replaceAll(' ', '').replaceAll('-', '')
            : null
        )
        : (s: any) => (
          isNonNull(s)
            ? removeDiacritics(`${s}`.toLowerCase()).replaceAll(' ', '').replaceAll('-', '')
            : null
        )
);
/* eslint-enable no-nested-ternary */

const checkJoin = async (
  tableId: string,
  tableField: string,
  layerId: string,
  layerField: string,
  ignoreCase: boolean,
  normalizeText: boolean,
): Promise<JoinResult | undefined> => {
  if (tableId === '' || tableField === '' || layerId === '' || layerField === '') {
    return undefined;
  }

  // The transformation function to compare the values
  const transformFn = getTransformFn(ignoreCase, normalizeText);

  // The table description of the reference table
  const tableDescription: TableDescription = layersDescriptionStore.tables
    .find((l) => l.id === tableId)!;

  // The layer description of the reference layer
  const layerDescription: LayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === layerId)!;

  // The table field values, all converted to string to be able to compare it easily
  const tableFieldValues = tableDescription.data
    .map((d) => transformFn(d[tableField]));

  // The layer field values, all converted to string to be able to compare it easily
  const layerFieldValues = layerDescription.data.features
    .map((f) => transformFn(f.properties[layerField]));

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
    noMatchLayerFeatures: [],
    noMatchTableFeatures: [],
  };

  // For each table field value
  tableFieldValues.forEach((v, i) => {
    // If the value is null
    if (v === null) {
      result.nNoDataTable += 1;
    } else {
      // If the value is not null
      // If the value is in the layer field values
      // eslint-disable-next-line no-lonely-if
      if (layerFieldValues.includes(v)) {
        result.nMatchTable += 1;
      } else {
        result.nNoMatchTable += 1;
        result.noMatchTableFeatures.push(tableDescription.data[i]);
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
      if (tableFieldValues.includes(v)) {
        result.nMatchLayer += 1;
      } else {
        result.nNoMatchLayer += 1;
        result.noMatchLayerFeatures.push(layerDescription.data.features[i].properties);
      }
    }
  });

  return result;
};

interface JoinParameters {
  tableId: string,
  tableField: string,
  layerId: string,
  layerField: string,
  usePrefix: boolean,
  prefixValue: string,
  selectFields: boolean,
  selectedFields: string[],
  removeNotMatching: boolean,
  ignoreCase: boolean,
  normalizeText: boolean,
}

const doJoin = async (joinParameters: JoinParameters): Promise<void> => {
  const {
    tableId,
    tableField,
    layerId,
    layerField,
    usePrefix,
    prefixValue,
    selectFields,
    selectedFields,
    removeNotMatching,
    ignoreCase,
    normalizeText,
  } = joinParameters;

  if (tableId === '' || tableField === '' || layerId === '' || layerField === '') {
    return;
  }

  // The transformation function to compare the values
  const transformFn = getTransformFn(ignoreCase, normalizeText);

  // The table description of the reference table
  const tableDescription: TableDescription = layersDescriptionStore.tables
    .find((l) => l.id === tableId)!;

  // The layer description of the reference layer
  const layerDescription: LayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === layerId)!;

  // Use index to speed up the join
  const tableIndex = new Map(
    tableDescription.data
      .map((item) => [transformFn(item[tableField]), item])
      .filter(([k, _]) => k !== null),
  );

  const newFields = selectFields
    ? tableDescription.fields.filter((f) => selectedFields.includes(f.name)).map((f) => f.name)
    : tableDescription.fields.map((f) => f.name);

  // The joined data as an array of GeoJSON features
  const jointData = layerDescription.data.features.map((ft: Feature) => {
    const feature = unproxify(ft as never) as Feature;
    const jsonItem = tableIndex.get(transformFn(feature.properties[layerField]));
    if (!jsonItem) {
      if (removeNotMatching) {
        return null;
      }
      return {
        ...feature,
        properties: {
          ...feature.properties,
          ...Object.fromEntries(newFields.map((f) => [f, null])),
          [layerField]: feature.properties[layerField],
        },
      };
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
          // [layerField]: feature.properties[layerField],
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
        // [layerField]: feature.properties[layerField],
      },
    };
  }).filter((d) => d !== null) as Feature[];

  const newFieldsDescription = selectFields
    ? unproxify(tableDescription.fields.filter((f) => selectedFields.includes(f.name)))
    : unproxify(tableDescription.fields);

  if (usePrefix) {
    newFieldsDescription.forEach((variable: Variable) => {
      // eslint-disable-next-line no-param-reassign
      variable.name = `${prefixValue}${variable.name}`;
    });
  }

  await yieldOrContinue('smooth');

  setLayersDescriptionStore(
    'layers',
    (l: LayerDescription) => l.id === layerId,
    'data',
    { type: 'FeatureCollection', features: jointData },
  );

  await yieldOrContinue('smooth');

  setLayersDescriptionStore(
    'layers',
    (l: LayerDescription) => l.id === layerId,
    'fields',
    [
      ...layerDescription.fields,
      ...newFieldsDescription
        .filter((f: Variable) => !layerDescription.fields.map((l) => l.name).includes(f.name)),
    ],
  );

  await yieldOrContinue('smooth');
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
  const [ignoreCase, setIgnoreCase] = createSignal(false);
  const [normalizeText, setNormalizeText] = createSignal(false);

  const allSelected = createMemo(() => (
    targetLayerId() !== ''
    && targetFieldTable() !== ''
    && targetFieldLayer() !== ''
  ));

  // We use a resource to check the join, this allows us to easily
  // display a loading indicator while the join is being checked
  const [
    joinResult,
    { mutate: mutateJoinResult, refetch: refetchJoinResult },
  ] = createResource(
    allSelected, // Recompute when all the fields are selected
    // eslint-disable-next-line solid/reactivity
    async () => checkJoin(
      id,
      targetFieldTable(),
      targetLayerId(),
      targetFieldLayer(),
      ignoreCase(),
      normalizeText(),
    ),
  );

  // Do we want to remove features from the geometry layer that do not match?
  const [removeNoMatch, setRemoveNoMatch] = createSignal(false);

  // Do we want to use a prefix for the joined field names?
  const [usePrefix, setUsePrefix] = createSignal(false);
  const [prefixValue, setPrefixValue] = createSignal(`${tableDescription.name}_`);

  // Do we want to only join a subset of the fields?
  const [selectFields, setSelectFields] = createSignal(false);
  const [selectedFields, setSelectedFields] = createSignal<string[]>([]);

  const makeTableDetail = (type: 'table' | 'layer', idCol: string): JSX.Element => {
    const dataId = type === 'layer'
      ? layersDescriptionStore.layers.find((d) => d.id === targetLayerId()!)!.data.features
        .map((f, i) => [i + 1, f.properties[idCol]])
      : tableDescription.data
        .map((d, i) => [i + 1, d[idCol]]);

    const noMatchArray = type === 'layer'
      ? joinResult()!.noMatchLayerFeatures
      : joinResult()!.noMatchTableFeatures;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const a1 = dataId.filter(([_, v]) => noMatchArray.find((d) => `${d[idCol]}` === `${v}`));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const a2 = dataId.filter(([_, v]) => !noMatchArray.find((d) => `${d[idCol]}` === `${v}`));

    return <div class={'join-panel--table-detail'}>
      <table class="table is-bordered is-striped is-narrow is-fullwidth">
        <thead><tr><th>Id</th><th>{idCol}</th></tr></thead>
        <tbody>
          <For each={a1}>
            {
              ([i, v]) => <tr><td>{i}</td><td class={'unmatched'}>{v}</td></tr>
            }
          </For>
          <For each={a2}>
            {
              ([i, v]) => <tr><td>{i}</td><td>{v}</td></tr>
            }
          </For>
        </tbody>
      </table>
    </div>;
  };

  onMount(() => {
    const modalCard = refJoinPanel!.parentElement!.parentElement!;
    modalCard.style.top = '10px';
    refSuccessButton = modalCard.parentElement!
      .querySelector('.button.is-success')! as HTMLButtonElement;

    refSuccessButton.disabled = true;

    refSuccessButton
      .addEventListener('click', async () => {
        setLoading(true);
        await yieldOrContinue('smooth');
        await doJoin({
          tableId: id,
          tableField: targetFieldTable(),
          layerId: targetLayerId(),
          layerField: targetFieldLayer(),
          usePrefix: usePrefix(),
          prefixValue: prefixValue(),
          selectFields: selectFields(),
          selectedFields: selectedFields(),
          removeNotMatching: removeNoMatch(),
          ignoreCase: ignoreCase(),
          normalizeText: normalizeText(),
        });
        if (removeNoMatch()) {
          // We need to rerender the layer to remove the features that do not match
          setLayersDescriptionStore(
            'layers',
            (l: LayerDescription) => l.id === targetLayerId(),
            'visible',
            false,
          );
          setLayersDescriptionStore(
            'layers',
            (l: LayerDescription) => l.id === targetLayerId(),
            'visible',
            true,
          );
        }
        setLoading(false);
      });

    createEffect(
      on(
        () => [
          targetLayerId(),
          targetFieldTable(),
          targetFieldLayer(),
          ignoreCase(),
          normalizeText(),
        ],
        () => {
          refSuccessButton.disabled = !allSelected();
          if (!allSelected()) {
            // Mutate the resource to reset the join result to undefined
            mutateJoinResult(undefined);
          } else {
            // Refetch the resource to check the join
            refetchJoinResult();
          }
        },
      ),
    );

    createEffect(
      on(
        () => joinResult(),
        () => {
          refSuccessButton.disabled = !allSelected()
            || !joinResult()
            || joinResult()?.nMatchLayer === 0;
        },
      ),
    );
  });

  return <div class="join-panel" ref={refJoinPanel!}>
    <MessageBlock type={'info'}>
      <p>{LL().JoinPanel.Information()}</p>
      <p>{LL().JoinPanel.Information2()}</p>
    </MessageBlock>
    <div style={{ 'text-align': 'center' }}>
      <InputFieldSelect
        label={LL().JoinPanel.TargetLayer()}
        onChange={(v) => {
          setTargetLayerId(v);
        }}
        layout={'vertical'}
        width={'300px'}
        value={''}
      >
        <option value=''>
          {LL().JoinPanel.TargetLayerPlaceholder()}
        </option>
        <For each={layersDescriptionStore.layers}>
          {(layer) => <option value={layer.id}>{layer.name}</option>}
        </For>
      </InputFieldSelect>
    </div>
    <Show when={targetLayerId() !== ''}>
      <hr />
      <h4>{LL().JoinPanel.NormalizationParameters()}</h4>
      <div>
        <InputFieldCheckbox
          label={LL().JoinPanel.IgnoreCase()}
          checked={ignoreCase()}
          onChange={(v) => { setIgnoreCase(v); }}
        />
        <InputFieldCheckbox
          label={LL().JoinPanel.NormalizeText()}
          checked={normalizeText()}
          onChange={(v) => { setNormalizeText(v); }}
        />
      </div>
      <hr/>
      <h4>{LL().JoinPanel.JoinFieldParameters()}</h4>
      <div class="is-flex is-flex-direction-row">
        <div style={{ width: '48%', 'text-align': 'center' }}>
          <InputFieldSelect
            label={LL().JoinPanel.JoinFieldLayer({
              layerName: layersDescriptionStore.layers.find((d) => d.id === targetLayerId())!.name,
            })}
            onChange={(v) => {
              setTargetFieldLayer(v);
            }}
            layout={'vertical'}
            width={'100%'}
            value={''}
          >
            <option value=''>
              {LL().JoinPanel.JoinFieldPlaceholder()}
            </option>
            <For each={
              layersDescriptionStore.layers.find((layer) => layer.id === targetLayerId())!.fields
            }>
              {(field) => <option value={field.name}>{field.name}</option>}
            </For>
          </InputFieldSelect>
          <Show when={targetFieldTable() !== '' && targetFieldLayer() !== '' && joinResult()}>
            {/* <DetailsSummary summaryContent={'Sample data'} initialOpen={false}> */}
            { makeTableDetail('layer', targetFieldLayer()) }
            {/* </DetailsSummary> */}
          </Show>
        </div>
        <div style={{ width: '4%', 'text-align': 'center' }}>
          <p><br /></p>
          <b>=</b>
        </div>
        <div style={{ width: '48%', 'text-align': 'center' }}>
          <InputFieldSelect
            label={LL().JoinPanel.JoinFieldTable({ tableName: tableDescription.name })}
            onChange={(v) => {
              setTargetFieldTable(v);
            }}
            layout={'vertical'}
            width={'100%'}
            value={''}
          >
            <option value=''>
              {LL().JoinPanel.JoinFieldPlaceholder()}
            </option>
            <For each={tableDescription.fields}>
              {(field) => <option value={field.name}>{field.name}</option>}
            </For>
          </InputFieldSelect>
          <Show when={targetFieldTable() !== '' && targetFieldLayer() !== '' && joinResult()}>
            {/* <DetailsSummary summaryContent={'Sample data'} initialOpen={false}> */}
            { makeTableDetail('table', targetFieldTable()) }
            {/* </DetailsSummary> */}
          </Show>
        </div>
      </div>
    </Show>
    <Switch>
      <Match when={joinResult.loading}>
        <p><i>{ LL().JoinPanel.Loading() }</i></p>
      </Match>
      <Match when={!joinResult.loading && joinResult()}>
        <hr/>
        <h4>{LL().JoinPanel.ResultInformation()}</h4>
        <div style={{ display: 'flex', 'text-align': 'center' }}>
          <div style={{ width: '50%' }}>
            <strong>{LL().JoinPanel.MatchedGeometry()}</strong>
            &nbsp;{joinResult()!.nMatchLayer}/{joinResult()?.nFeaturesLayer}
            <Show when={joinResult()!.nNoDataLayer > 0}>
              &nbsp;&nbsp;({joinResult()!.nNoDataLayer}&nbsp;{LL().JoinPanel.NoData()})
            </Show>
          </div>
          <div style={{ width: '50%' }}>
            <strong>{LL().JoinPanel.MatchedData()}</strong>
            &nbsp;{joinResult()?.nMatchTable}/{joinResult()?.nFeaturesTable}
            <Show when={joinResult()!.nNoDataTable > 0}>
              &nbsp;&nbsp;({joinResult()!.nNoDataTable}&nbsp;{LL().JoinPanel.NoData()})
            </Show>
          </div>
        </div>
        <Show when={joinResult()!.nMatchLayer === 0}>
          <MessageBlock type={'danger'} useIcon={true}>
            <p>{LL().JoinPanel.ImpossibleJoin()}</p>
          </MessageBlock>
        </Show>
        <Show when={joinResult()!.nMatchLayer > 0}>
          <hr/>
          <Show when={joinResult()!.nNoMatchLayer > 0}>
            <InputFieldCheckbox
              label={LL().JoinPanel.RemoveNotMatching()}
              checked={removeNoMatch()}
              onChange={(v) => { setRemoveNoMatch(v); }}
            />
          </Show>
          <InputFieldCheckbox
            label={LL().JoinPanel.Prefix()}
            checked={usePrefix()}
            onChange={(v) => setUsePrefix(v)}
          />
          <Show when={usePrefix()}>
            <InputFieldText
              label={LL().JoinPanel.PrefixValue()}
              value={prefixValue()}
              onChange={(v) => {
                setPrefixValue(v);
              }}
            />
          </Show>
          <InputFieldCheckbox
            label={LL().JoinPanel.SelectFields()}
            checked={selectFields()}
            onChange={(v) => setSelectFields(v)}
          />
          <Show when={selectFields()}>
            <div class="has-text-centered">
              <MultipleSelect
                onChange={(e) => {
                  setSelectedFields(
                    Array.from(e.target.selectedOptions).map((d: HTMLOptionElement) => d.value),
                  );
                }}
                size={tableDescription.fields.length}
                values={selectedFields()}
                style={{ 'min-width': '300px' }}
              >
                <For each={tableDescription.fields}>
                  {(field) => <option value={field.name}>{field.name}</option>}
                </For>
              </MultipleSelect>
            </div>
          </Show>
        </Show>
      </Match>
    </Switch>
    {/*
    <CollapsibleMessageBanner
      expanded={true}
      title={LL().Messages.Information()}
      type={'info'}
      useIcon={true}
      style={{ 'margin-bottom': '-2em', 'margin-top': '4em' }}
    >
      <p>{LL().JoinPanel.Information()}</p>
      <p>{LL().JoinPanel.Information2()}</p>
    </CollapsibleMessageBanner>
    */}
  </div>;
}
