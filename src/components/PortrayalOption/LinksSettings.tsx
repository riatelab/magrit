// Import from solid-js
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  Show,
} from 'solid-js';
import { produce, unwrap } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';
import { FaSolidCheck } from 'solid-icons/fa';
import { VsWarning } from 'solid-icons/vs';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { zip } from '../../helpers/array';
import { PortrayalSettingsProps } from './common';
import { findSuitableName } from '../../helpers/common';
import { makeCentroidLayer } from '../../helpers/geo';
import { generateIdLayer } from '../../helpers/layers';
import createLinksData from '../../helpers/links';
import { VariableType } from '../../helpers/typeDetection';

// Stores
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setPortrayalSelectionStore } from '../../store/PortrayalSelectionStore';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types / Interfaces / Enums
import {
  LayerDescription,
  type LayerDescriptionLinks,
  LinkCurvature,
  LinkHeadType,
  LinkPosition,
  type LinksParameters,
  LinkType,
  RepresentationType, TableDescription,
  VectorType,
} from '../../global.d';

function onClickValidate(
  referenceLayerId: string,
  tableId: string,
  layerIdentifierVariable: string,
  tableOriginVariable: string,
  tableDestinationVariable: string,
  tableIntensityVariable: string,
  newName: string,
): void {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  const tableDescription = layersDescriptionStore.tables
    .find((t) => t.id === tableId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }
  if (tableDescription === undefined) {
    throw new Error('Unexpected Error: Table not found');
  }

  const inputData = referenceLayerDescription.type === 'point'
    ? unwrap(referenceLayerDescription.data)
    : makeCentroidLayer(
      referenceLayerDescription.data,
      referenceLayerDescription.type as VectorType,
    );

  const newData = createLinksData(
    inputData,
    unwrap(tableDescription.data),
    layerIdentifierVariable,
    tableOriginVariable,
    tableDestinationVariable,
    tableIntensityVariable,
  );

  const maxData = newData.features.reduce(
    (acc, f) => Math.max(acc, f.properties[tableIntensityVariable]),
    0,
  );

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newName,
    data: newData,
    type: 'linestring',
    fields: [
      {
        name: tableOriginVariable,
        type: VariableType.categorical,
      },
      {
        name: tableDestinationVariable,
        type: VariableType.categorical,
      },
      {
        name: tableIntensityVariable,
        type: VariableType.stock,
      },
    ],
    renderer: 'links' as RepresentationType,
    visible: true,
    strokeWidth: 1,
    strokeColor: '#000000',
    strokeOpacity: 1,
    dropShadow: false,
    blurFilter: false,
    shapeRendering: 'auto',
    rendererParameters: {
      variable: tableIntensityVariable,
      proportional: {
        referenceSize: 10,
        referenceValue: maxData,
      },
      type: LinkType.Exchange,
      head: LinkHeadType.Arrow,
      curvature: LinkCurvature.Straight,
      position: LinkPosition.Initial,
    } as LinksParameters,
    legend: undefined,
  } as LayerDescriptionLinks;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );
}

function extractIdLayers(
  layer: LayerDescription,
  field: string,
): string[] {
  return layer.data.features
    .map((f) => `${f.properties[field]}`);
}

function extractIdTables(
  table: TableDescription,
  field: string,
): string[] {
  return table.data
    .map((f) => `${f[field]}`);
}

function hasMatchingIds(
  layer: LayerDescription,
  table: TableDescription,
  idField: string,
  origin: string,
  destination: string,
): { allMatch: boolean, someMatch: boolean } {
  const layerIds = new Set(extractIdLayers(layer, idField));
  const origins = extractIdTables(table, origin);
  const destinations = extractIdTables(table, destination);

  // We want to know if some of the ids in origins and destinations
  // are in the layerIds array (i.e. if there are links to be created)
  // which is OK, and if all of the ids in origins and destinations are
  // in the layerIds array (i.e. if all the links can be created)
  // which is also OK.
  const allMatch = (
    origins.every((id) => layerIds.has(id))
    && destinations.every((id) => layerIds.has(id))
  );

  const someMatch = allMatch || (
    zip(origins, destinations)
      .some(([o, d]) => layerIds.has(o) && layerIds.has(d))
  );

  return {
    allMatch,
    someMatch,
  };
}

export default function LinksSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  // The fields of the layer that are of type 'identified'
  // (i.e. the fields that can be used to identify the origin
  // and destination of the links to be created)
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = createMemo(() => layerDescription()
    .fields?.filter((variable) => variable.type === VariableType.identifier));

  // Signals for the current component:
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields()![0].name);
  const [
    targetDataset,
    setTargetDataset,
  ] = createSignal<string>('');
  const [
    originVariable,
    setOriginVariable,
  ] = createSignal<string>('');
  const [
    destinationVariable,
    setDestinationVariable,
  ] = createSignal<string>('');
  const [
    intensityVariable,
    setIntensityVariable,
  ] = createSignal<string>('');
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(`Links_${layerDescription().name}`);

  const targetFieldsOD = createMemo(() => {
    if (targetDataset() === '') {
      return [];
    }
    const table = layersDescriptionStore.tables.find((l) => l.id === targetDataset())!;
    return table.fields
      .filter((v) => v.type === VariableType.identifier || v.type === VariableType.categorical);
  });

  const targetFieldsIntensity = createMemo(() => {
    if (targetDataset() === '') {
      return [];
    }
    const table = layersDescriptionStore.tables.find((l) => l.id === targetDataset())!;
    return table.fields
      .filter((v) => v.type === VariableType.ratio || v.type === VariableType.stock);
  });

  const [
    matchingState,
    setMatchingState,
  ] = createSignal<{ allMatch: boolean, someMatch: boolean } | null>(null);

  const [
    linkType,
    setLinkType,
  ] = createSignal<string>(LinkType.Link);

  const [
    linkHeadType,
    setLinkHeadType,
  ] = createSignal<string>(LinkHeadType.Arrow);

  const [
    linkCurveType,
    setLinkCurveType,
  ] = createSignal<string>(LinkCurvature.Straight);

  createEffect(
    () => {
      if (
        targetDataset() !== ''
        && targetVariable() !== ''
        && originVariable() !== ''
        && destinationVariable() !== ''
      ) {
        const matching = hasMatchingIds(
          layerDescription(),
          layersDescriptionStore.tables.find((t) => t.id === targetDataset())!,
          targetVariable(),
          originVariable(),
          destinationVariable(),
        );
        setMatchingState(matching);
      } else {
        setMatchingState(null);
      }
    },
  );

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setPortrayalSelectionStore({ show: false, layerId: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription().id,
        targetDataset(),
        targetVariable(),
        originVariable(),
        destinationVariable(),
        intensityVariable(),
        layerName,
      );
      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-choropleth">
    <InputFieldSelect
      label={ LL().PortrayalSection.LinksOptions.IdentifierField() }
      onChange={(value) => {
        setTargetVariable(value);
      }}
      value={ targetVariable() }
      width={200}
    >
      <For each={targetFields()}>
        { (variable) => <option value={variable.name}>{variable.name}</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().PortrayalSection.LinksOptions.Dataset() }
      onChange={(value) => {
        setTargetDataset(value);
      }}
      value={ targetDataset() }
      width={200}
    >
      <option value="">{ LL().PortrayalSection.LinksOptions.SelectDataset() }</option>
      <For each={layersDescriptionStore.tables}>
        {
          (table) => <option value={table.id}>{ table.name }</option>
        }
      </For>
    </InputFieldSelect>
    <Show when={targetDataset() !== ''}>
      <InputFieldSelect
        label={ LL().PortrayalSection.LinksOptions.OriginId() }
        onChange={(value) => {
          setOriginVariable(value);
        }}
        value={ originVariable() }
        width={200}
      >
        <For each={targetFieldsOD()}>
          { (variable) => <option value={variable.name}>{variable.name}</option> }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={ LL().PortrayalSection.LinksOptions.DestinationId() }
        onChange={(value) => {
          setDestinationVariable(value);
        }}
        value={ destinationVariable() }
        width={200}
      >
        <For each={targetFieldsOD()}>
          { (variable) => <option value={variable.name}>{variable.name}</option> }
        </For>
      </InputFieldSelect>
      <Show when={matchingState() !== null}>
        <Show when={matchingState()?.allMatch}>
          <div class="field is-justify-content-flex-start">
            <FaSolidCheck />
            { 'All origins and destinations match IDs of features in the geographic layer' }
          </div>
        </Show>
        <Show when={matchingState()?.someMatch}>
          <div class="field is-justify-content-flex-start">
            <VsWarning />
            { 'Some origins and destinations (but not all) match IDs of features in the geographic layer' }
          </div>
        </Show>
        <Show when={!matchingState()?.allMatch && !matchingState()?.someMatch}>
          <div class="field is-justify-content-flex-start">
            <VsWarning />
            { 'No origins and destinations match IDs of features in the geographic layer' }
          </div>
        </Show>
      </Show>
      <InputFieldSelect
        label={ LL().PortrayalSection.LinksOptions.Intensity() }
        onChange={(value) => {
          setIntensityVariable(value);
        }}
        value={ intensityVariable() }
        width={200}
      >
        <For each={targetFieldsIntensity()}>
          { (variable) => <option value={variable.name}>{variable.name}</option> }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={ LL().PortrayalSection.LinksOptions.LinkType() }
        onChange={(value) => {
          setLinkType(value);
        }}
        value={ linkType() }
        width={200}
        >
        <For each={Object.entries(LinkType)}>
          {
            ([key, value]) => <option value={key}>{ value }</option>
          }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={ LL().PortrayalSection.LinksOptions.LinkHeadType() }
        onChange={(value) => {
          setLinkHeadType(value);
        }}
        value={ linkHeadType() }
        width={200}
      >
        <For each={Object.entries(LinkHeadType)}>
          {
            ([key, value]) => <option value={key}>{ value }</option>
          }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={ LL().PortrayalSection.LinksOptions.LinkCurvature() }
        onChange={(value) => {
          setLinkCurveType(value);
        }}
        value={ linkCurveType() }
        width={200}
      >
        <For each={Object.entries(LinkCurvature)}>
          {
            ([key, value]) => <option value={key}>{ value }</option>
          }
        </For>
      </InputFieldSelect>
    </Show>
    <InputResultName
      onKeyUp={(value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={ LL().PortrayalSection.CreateLayer() }
      onClick={makePortrayal}
      disabled={matchingState() === null || !matchingState()?.someMatch}
    />
  </div>;
}
