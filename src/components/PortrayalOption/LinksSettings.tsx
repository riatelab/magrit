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
import { quantile } from 'statsbreaks';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { zip } from '../../helpers/array';
import { PortrayalSettingsProps } from './common';
import { findSuitableName, isFiniteNumber, unproxify } from '../../helpers/common';
import { computeCandidateValuesForSymbolsLegend, makeCentroidLayer, PropSizer } from '../../helpers/geo';
import { generateIdLayer } from '../../helpers/layers';
import { createLinksData, createSimpleLinksData } from '../../helpers/links';
import { VariableType } from '../../helpers/typeDetection';
import { generateIdLegend } from '../../helpers/legends';
import { extent } from '../../helpers/math';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Stores
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import MessageBlock from '../MessageBlock.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types / Interfaces / Enums
import {
  ClassificationMethod,
  type DefaultLegend,
  type GraduatedLineLegend,
  type LayerDescription,
  type LayerDescriptionLinks,
  type LegendTextElement,
  LegendType,
  LinkCurvature,
  LinkHeadType,
  LinkPosition,
  type LinksParameters,
  LinkType,
  type ProportionalSymbolsLegend,
  RepresentationType,
  type TableDescription,
  VectorType,
} from '../../global.d';

function onClickValidate(
  referenceLayerId: string,
  tableId: string,
  layerIdentifierVariable: string,
  tableOriginVariable: string,
  tableDestinationVariable: string,
  tableIntensityVariable: string,
  linkType: LinkType,
  linkSizeType: 'fixed' | 'graduated' | 'proportional',
  linkHeadType: LinkHeadType,
  linkCurveType: LinkCurvature,
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

  const newData = linkType === LinkType.Exchange
    ? createLinksData(
      inputData,
      unwrap(tableDescription.data),
      layerIdentifierVariable,
      tableOriginVariable,
      tableDestinationVariable,
      tableIntensityVariable,
    )
    : createSimpleLinksData(
      inputData,
      unwrap(tableDescription.data),
      layerIdentifierVariable,
      tableOriginVariable,
      tableDestinationVariable,
      tableIntensityVariable,
    );

  const params = {
    variable: tableIntensityVariable,
    type: linkType,
    head: linkHeadType,
    curvature: linkCurveType,
    position: LinkPosition.Initial,
    filters: [
      // {
      //   variable: 'DistanceKm',
      //   operator: '>',
      //   value: 3000,
      // } as Filter,
      // {
      //   variable: 'Intensity',
      //   operator: '==',
      //   value: '2',
      // } as Filter,
    ],
  } as Partial<LinksParameters>;

  if (linkType !== LinkType.Link) {
    // If the link type is not 'link', we want to use the intensity to
    // determine the width of the links.
    // Otherwise, links have a fixed width.
    if (linkSizeType === 'proportional') {
      const maxData = newData.features.reduce(
        (acc, f) => (
          isFiniteNumber(f.properties.Intensity)
            ? Math.max(acc, +f.properties.Intensity)
            : 0),
        0,
      );

      params.sizeType = 'proportional';
      params.proportional = {
        referenceRadius: 10,
        referenceValue: maxData,
      };
    } else { // so sizeType === 'graduated'
      const allValues = newData.features
        .filter((d) => isFiniteNumber(d.properties.Intensity))
        .map((d) => +d.properties.Intensity);
      params.sizeType = 'graduated';
      params.classification = {
        classificationMethod: ClassificationMethod.quantiles,
        classes: 4,
        breaks: quantile(allValues, 4),
        sizes: [1, 2, 3.5, 5.5],
      };
    }
  } else {
    params.sizeType = 'fixed';
  }

  const newId = generateIdLayer();

  const newFields = [
    {
      name: 'Origin',
      type: VariableType.categorical,
      dataType: tableDescription.fields.find((f) => f.name === tableOriginVariable)!.dataType,
      hasMissingValues: false,
    },
    {
      name: 'Destination',
      type: VariableType.categorical,
      dataType: tableDescription.fields.find((f) => f.name === tableDestinationVariable)!.dataType,
      hasMissingValues: false,
    },
    {
      name: 'DistanceKm',
      type: VariableType.stock,
      dataType: 'number',
      hasMissingValues: false,
    },
  ];

  if (tableIntensityVariable !== '') {
    newFields.push({
      name: 'Intensity',
      type: VariableType.stock,
      dataType: 'number',
      hasMissingValues: false,
    });
  }

  // Also add field description for all the other variables that are present in the table
  // and that have been copied if linkType === LinkType.Exchange
  if (linkType === LinkType.Exchange) {
    const fds = tableDescription.fields
      .filter((f) => (
        f.name !== tableOriginVariable
        && f.name !== tableDestinationVariable
        && f.name !== tableIntensityVariable))
      .map((f) => unproxify(f));

    newFields.push(...fds);
  }

  const newLayerDescription = {
    id: newId,
    name: newName,
    data: newData,
    type: 'linestring',
    fields: newFields,
    representationType: 'links' as RepresentationType,
    visible: true,
    strokeWidth: 1,
    strokeColor: '#000000',
    strokeOpacity: 1,
    dropShadow: null,
    shapeRendering: 'auto',
    rendererParameters: params as LinksParameters,
  } as LayerDescriptionLinks;

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(150, 150);

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );

  let legend;
  if (linkType !== LinkType.Link) {
    if (linkSizeType === 'proportional') {
      const values = newData.features.map((d) => +d.properties.Intensity);
      const [min, max] = extent(values);

      const propSize = new PropSizer(
        params.proportional!.referenceValue,
        params.proportional!.referenceRadius,
        'line',
      );

      const legendValues = computeCandidateValuesForSymbolsLegend(
        min,
        max,
        propSize.scale,
        propSize.getValue,
        3,
      );
      legend = {
        // Legend common part
        id: generateIdLegend(),
        layerId: newId,
        title: {
          text: 'Intensity',
          ...applicationSettingsStore.defaultLegendSettings.title,
        } as LegendTextElement,
        subtitle: {
          ...applicationSettingsStore.defaultLegendSettings.subtitle,
        } as LegendTextElement,
        note: {
          ...applicationSettingsStore.defaultLegendSettings.note,
        } as LegendTextElement,
        position: legendPosition,
        visible: true,
        roundDecimals: 0,
        backgroundRect: {
          visible: false,
        },
        // Part specific to proportional symbols
        type: LegendType.proportional,
        layout: 'vertical',
        values: legendValues,
        spacing: 5,
        labels: {
          ...applicationSettingsStore.defaultLegendSettings.labels,
        } as LegendTextElement,
        symbolType: 'line',
      } as ProportionalSymbolsLegend;
    } else { // linkSizeType === 'graduated'
      legend = {
        id: generateIdLegend(),
        layerId: newId,
        title: {
          text: 'Intensity',
          ...applicationSettingsStore.defaultLegendSettings.title,
        } as LegendTextElement,
        subtitle: {
          ...applicationSettingsStore.defaultLegendSettings.subtitle,
        } as LegendTextElement,
        note: {
          ...applicationSettingsStore.defaultLegendSettings.note,
        } as LegendTextElement,
        position: legendPosition,
        visible: true,
        roundDecimals: 2,
        backgroundRect: {
          visible: false,
        },
        type: LegendType.graduatedLine,
        orientation: 'horizontal',
        lineLength: 50,
        labels: {
          ...applicationSettingsStore.defaultLegendSettings.labels,
        } as LegendTextElement,
      } as GraduatedLineLegend;
    }
  } else {
    legend = {
      id: generateIdLegend(),
      layerId: newId,
      title: {
        text: '',
        ...applicationSettingsStore.defaultLegendSettings.title,
      },
      subtitle: {
        ...applicationSettingsStore.defaultLegendSettings.subtitle,
      },
      note: {
        ...applicationSettingsStore.defaultLegendSettings.note,
      },
      position: legendPosition,
      visible: false,
      roundDecimals: 0,
      backgroundRect: { visible: false },
      // Part specific to default legends
      type: 'default',
      typeGeometry: 'linestring',
      displayAsPolygon: false,
      labels: {
        text: 'Link',
        ...applicationSettingsStore.defaultLegendSettings.labels,
      },
      boxWidth: 50,
      boxHeight: 30,
      boxCornerRadius: 0,
    } as DefaultLegend;
  }

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layoutFeaturesAndLegends.push(legend);
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
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // The fields of the layer that are of type 'identified'
  // (i.e. the fields that can be used to identify the origin
  // and destination of the links to be created)
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === VariableType.identifier);

  // Signals for the current component:
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields[0].name);
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
  ] = createSignal<string>(
    LL().FunctionalitiesSection.LinksOptions.NewLayerName({
      layerName: layerDescription.name,
    }) as string,
  );

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
      .filter((v) => v.dataType === 'number');
  });

  const [
    matchingState,
    setMatchingState,
  ] = createSignal<{ allMatch: boolean, someMatch: boolean } | null>(null);

  const [
    linkType,
    setLinkType,
  ] = createSignal<LinkType>(LinkType.Link);

  const [
    linkHeadType,
    setLinkHeadType,
  ] = createSignal<LinkHeadType>(LinkHeadType.Arrow);

  const [
    linkCurveType,
    setLinkCurveType,
  ] = createSignal<LinkCurvature>(LinkCurvature.StraightOnSphere);

  const [
    linkSizeType,
    setLinkSizeType,
  ] = createSignal('fixed');

  createEffect(
    () => {
      if (
        targetDataset() !== ''
        && targetVariable() !== ''
        && originVariable() !== ''
        && destinationVariable() !== ''
      ) {
        const matching = hasMatchingIds(
          layerDescription,
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

  createEffect(
    () => {
      if (intensityVariable() === '') {
        setLinkSizeType('fixed');
      } else {
        setLinkSizeType('proportional');
      }
    },
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

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        targetDataset(),
        targetVariable(),
        originVariable(),
        destinationVariable(),
        intensityVariable(),
        linkType(),
        linkSizeType(),
        linkHeadType(),
        linkCurveType(),
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
      label={ LL().FunctionalitiesSection.LinksOptions.IdentifierField() }
      onChange={(value) => {
        setTargetVariable(value);
      }}
      value={ targetVariable() }
    >
      <For each={targetFields}>
        { (variable) => <option value={variable.name}>{variable.name}</option> }
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().FunctionalitiesSection.LinksOptions.Dataset() }
      onChange={(value) => {
        setTargetDataset(value);
      }}
      value={ targetDataset() }
    >
      <option value="">{ LL().FunctionalitiesSection.LinksOptions.SelectDataset() }</option>
      <For each={layersDescriptionStore.tables}>
        {
          (table) => <option value={table.id}>{ table.name }</option>
        }
      </For>
    </InputFieldSelect>
    <Show when={targetDataset() !== ''}>
      <InputFieldSelect
        label={ LL().FunctionalitiesSection.LinksOptions.OriginId() }
        onChange={(value) => {
          setOriginVariable(value);
        }}
        value={ originVariable() }
      >
        <For each={targetFieldsOD()}>
          { (variable) => <option value={variable.name}>{variable.name}</option> }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={ LL().FunctionalitiesSection.LinksOptions.DestinationId() }
        onChange={(value) => {
          setDestinationVariable(value);
        }}
        value={ destinationVariable() }
      >
        <For each={targetFieldsOD()}>
          { (variable) => <option value={variable.name}>{variable.name}</option> }
        </For>
      </InputFieldSelect>
      <Show when={matchingState() !== null}>
        <Show when={matchingState()?.allMatch}>
          <MessageBlock type={'success'} useIcon={true}>
            { LL().FunctionalitiesSection.LinksOptions.AllMatch() }
          </MessageBlock>
        </Show>
        <Show when={matchingState()?.someMatch}>
          <MessageBlock type={'warning'} useIcon={true}>
            { LL().FunctionalitiesSection.LinksOptions.SomeMatch() }
          </MessageBlock>
        </Show>
        <Show when={!matchingState()?.allMatch && !matchingState()?.someMatch}>
          <MessageBlock type={'danger'} useIcon={true}>
            { LL().FunctionalitiesSection.LinksOptions.NoMatch() }
          </MessageBlock>
        </Show>
      </Show>
      <InputFieldSelect
        label={ LL().FunctionalitiesSection.LinksOptions.Intensity() }
        onChange={(value) => {
          setIntensityVariable(value);
          if (value === '') {
            setLinkType(LinkType.Link);
          } else {
            setLinkType(LinkType.Exchange);
          }
        }}
        value={ intensityVariable() }
      >
        <option value=''>{LL().FunctionalitiesSection.LinksOptions.NoIntensity()}</option>
        <For each={targetFieldsIntensity()}>
          { (variable) => <option value={variable.name}>{variable.name}</option> }
        </For>
      </InputFieldSelect>
      <Show when={intensityVariable() !== ''}>
        <InputFieldSelect
          label={ LL().FunctionalitiesSection.LinksOptions.LinkType() }
          onChange={(value) => {
            setLinkType(value as LinkType);
          }}
          value={ linkType() }
          >
          <For each={Object.entries(LinkType).filter((d) => d[0] !== 'Link')}>
            {
              ([key, value]) => <option value={value}>
                { LL().FunctionalitiesSection.LinksOptions[`LinkType${key}`]() }
              </option>
            }
          </For>
        </InputFieldSelect>
      </Show>
      <Show when={intensityVariable() === ''}>
        <InputFieldSelect
          label={ LL().FunctionalitiesSection.LinksOptions.LinkType() }
          onChange={(value) => {
            setLinkType(value as LinkType);
          }}
          value={ linkType() }
          disabled={true}
        >
          <option value={LinkType.Link}>
            { LL().FunctionalitiesSection.LinksOptions.LinkTypeLink() }
          </option>
        </InputFieldSelect>
      </Show>
      <InputFieldSelect
        label={LL().FunctionalitiesSection.LinksOptions.LinkSizeType()}
        onChange={(value) => {
          setLinkSizeType(value);
        }}
        value={linkSizeType()}
        disabled={intensityVariable() === ''}
      >
        <option value={'fixed'} disabled={intensityVariable() !== ''}>{LL().FunctionalitiesSection.LinksOptions.LinkSizeFixed()}</option>
        <option value={'proportional'}>{LL().FunctionalitiesSection.LinksOptions.LinkSizeProportional()}</option>
        <option value={'graduated'}>{LL().FunctionalitiesSection.LinksOptions.LinkSizeGraduated()}</option>
      </InputFieldSelect>
      <InputFieldSelect
        label={LL().FunctionalitiesSection.LinksOptions.LinkHeadType()}
        onChange={(value) => {
          setLinkHeadType(value as LinkHeadType);
        }}
        value={ linkHeadType() }
      >
        <For each={Object.entries(LinkHeadType)}>
          {
            ([key, value]) => <option value={value}>
              { LL().FunctionalitiesSection.LinksOptions[`LinkHeadType${key}`]() }
            </option>
          }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={ LL().FunctionalitiesSection.LinksOptions.LinkCurvature() }
        onChange={(value) => {
          setLinkCurveType(value as LinkCurvature);
        }}
        value={ linkCurveType() }
      >
        <For each={Object.entries(LinkCurvature)}>
          {
            ([key, value]) => <option value={value}>
              { LL().FunctionalitiesSection.LinksOptions[`LinkCurvature${key}`]() }
            </option>
          }
        </For>
      </InputFieldSelect>
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={ LL().FunctionalitiesSection.CreateLayer() }
      onClick={makePortrayal}
      disabled={matchingState() === null || !matchingState()?.someMatch}
    />
  </div>;
}
