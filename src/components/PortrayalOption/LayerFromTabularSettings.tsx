// Imports from solid-js
import {
  createEffect,
  createSignal, For, type JSX, on, Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName, isNonNull, isNumber } from '../../helpers/common';
import { getGeometryType } from '../../helpers/formatConversion';
import {
  makeLayerFromTableAndWKT,
  makeLayerFromTableAndXY,
  wktSeemsValid,
} from '../../helpers/layerFromTable';
import { generateIdLayer, getDefaultRenderingParams } from '../../helpers/layers';

// Stores
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import {
  setFunctionalitySelectionStore,
} from '../../store/FunctionalitySelectionStore';
import { setLoading } from '../../store/GlobalStore';

// Other components
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputResultName from './InputResultName.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldRadio from '../Inputs/InputRadio.tsx';
import MessageBlock from '../MessageBlock.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types / Interfaces / Enums
import { type LayerDescription } from '../../global.d';

function validateFieldsXY(
  tableId: string,
  fieldX: string,
  fieldY: string,
): number {
  // We want to know if the fields are valid (i.e. they are storing numbers)
  // and return the number of entries that have valid values for both fields
  const table = layersDescriptionStore.tables.find((t) => t.id === tableId)!;
  const valuesX = table.data.map((d) => d[fieldX]);
  const valuesY = table.data.map((d) => d[fieldY]);

  const validBoth = valuesX.filter((v, i) => (
    isNonNull(v) && isNumber(v) && isNonNull(valuesY[i]) && isNumber(valuesY[i])
  ));

  return validBoth.length;
}

function validateFieldWkt(
  tableId: string,
  fieldWkt: string,
): number {
  // We want to know if the field is valid (i.e. it contains valid WKT strings)
  // and return the number of entries that have valid values
  const table = layersDescriptionStore.tables.find((t) => t.id === tableId)!;
  const valuesWkt = table.data.map((d) => d[fieldWkt]);

  const validWkt = valuesWkt.filter((v) => isNonNull(v)
    && typeof v === 'string'
    && wktSeemsValid(v));

  return validWkt.length;
}

async function onClickValidate(
  referenceTableId: string,
  newLayerName: string,
  mode: 'coordinates' | 'wkt',
  fieldOrFields: string | [string, string],
) {
  const tableDescription = layersDescriptionStore.tables
    .find((table) => table.id === referenceTableId)!;

  if (mode === 'coordinates') {
    const newData = await makeLayerFromTableAndXY(
      tableDescription.data,
      fieldOrFields[0],
      fieldOrFields[1],
    );

    const newFields = tableDescription.fields
      .filter((f) => f.name !== fieldOrFields[0] && f.name !== fieldOrFields[1])
      .map((f) => ({ ...f }));

    const newLayerDescription = {
      id: generateIdLayer(),
      name: newLayerName,
      data: newData,
      type: 'point',
      fields: newFields,
      visible: true,
      ...getDefaultRenderingParams('point'),
      shapeRendering: 'auto',
    } as LayerDescription;

    setLayersDescriptionStore(
      produce((draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
      }),
    );
  } else {
    const newData = await makeLayerFromTableAndWKT(
      tableDescription.data,
      fieldOrFields as string,
    );

    const newFields = tableDescription.fields
      .filter((f) => f.name !== fieldOrFields as string)
      .map((f) => ({ ...f }));

    const geometryType = getGeometryType(newData);

    const newLayerDescription = {
      id: generateIdLayer(),
      name: newLayerName,
      data: newData,
      type: geometryType,
      fields: newFields,
      visible: true,
      ...getDefaultRenderingParams(geometryType),
      shapeRendering: 'auto',
    } as LayerDescription;

    setLayersDescriptionStore(
      produce((draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
      }),
    );
  }
}

export default function LayerFromTabularSettings(
  props: { tableId: string },
): JSX.Element {
  const { LL } = useI18nContext();

  const tableDescription = layersDescriptionStore.tables
    .find((table) => table.id === props.tableId)!;

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(tableDescription.name);

  const [
    mode,
    setMode,
  ] = createSignal<'coordinates' | 'wkt'>('coordinates');

  const [
    fieldX,
    setFieldX,
  ] = createSignal<string>('');

  const [
    fieldY,
    setFieldY,
  ] = createSignal<string>('');

  const [
    fieldWkt,
    setFieldWkt,
  ] = createSignal<string>('');

  const [
    pointCrs,
    setPointCrs,
  ] = createSignal<string>('EPSG:4326');

  const [
    validEntries,
    setValidEntries,
  ] = createSignal<number>();

  createEffect(
    on(
      () => [fieldX(), fieldY(), fieldWkt()],
      () => {
        if (mode() === 'coordinates') {
          setValidEntries(validateFieldsXY(
            props.tableId,
            fieldX(),
            fieldY(),
          ));
        } else {
          setValidEntries(validateFieldWkt(
            props.tableId,
            fieldWkt(),
          ));
        }
      },
    ),
  );

  createEffect(
    on(
      () => mode(),
      () => {
        setFieldX('');
        setFieldY('');
        setFieldWkt('');
      },
    ),
  );

  const makePortrayal = async () => {
    // Check name of the new layer
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, layerId: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Actually create the layer
    setTimeout(async () => {
      await onClickValidate(
        tableDescription.id,
        layerName,
        mode(),
        mode() === 'coordinates'
          ? [fieldX(), fieldY()]
          : fieldWkt(),
      );

      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-layer-from-tabular">
    <InputFieldRadio
      label={LL().FunctionalitiesSection.LayerFromTableOptions.Mode()}
      value={mode()}
      values={[
        {
          value: 'coordinates',
          label: LL().FunctionalitiesSection.LayerFromTableOptions.ModeXY(),
        },
        {
          value: 'wkt',
          label: LL().FunctionalitiesSection.LayerFromTableOptions.ModeWKT(),
        },
      ]}
      onChange={(value) => { setMode(value as 'coordinates' | 'wkt'); }}
    />
    <Show when={mode() === 'coordinates'}>
      <InputFieldSelect
        label={LL().FunctionalitiesSection.LayerFromTableOptions.FieldX()}
        onChange={(value) => { setFieldX(value); }}
        value={fieldX()}
      >
        <option disabled value="">{ LL().FunctionalitiesSection.CommonOptions.VariablePlaceholder() }</option>
        <For each={tableDescription.fields}>
          {(field) => <option value={field.name}>{field.name}</option>}
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={LL().FunctionalitiesSection.LayerFromTableOptions.FieldY()}
        onChange={(value) => { setFieldY(value); }}
        value={fieldY()}
      >
        <option disabled value="">{ LL().FunctionalitiesSection.CommonOptions.VariablePlaceholder() }</option>
        <For each={tableDescription.fields}>
          {(field) => <option value={field.name}>{field.name}</option>}
        </For>
      </InputFieldSelect>
    </Show>
    <Show when={mode() === 'wkt'}>
      <InputFieldSelect
        label={LL().FunctionalitiesSection.LayerFromTableOptions.FieldWkt()}
        onChange={(value) => { setFieldWkt(value); }}
        value={fieldWkt()}
      >
        <option disabled value="">{ LL().FunctionalitiesSection.CommonOptions.VariablePlaceholder() }</option>
        <For each={tableDescription.fields}>
          {(field) => <option value={field.name}>{field.name}</option>}
        </For>
      </InputFieldSelect>
    </Show>
    <Show when={
      (
        (mode() === 'coordinates' && fieldX() && fieldY())
        || (mode() === 'wkt' && fieldWkt())
      ) && validEntries() && validEntries()! === 0
    }>
      <MessageBlock type={'danger'} useIcon={true}>
        <p>No entry to create</p>
      </MessageBlock>
    </Show>
    <Show when={
      (
        (mode() === 'coordinates' && fieldX() && fieldY())
        || (mode() === 'wkt' && fieldWkt())
      ) && validEntries() && validEntries()! > 0
    }>
      <MessageBlock type={'success'} useIcon={true}>
        <p>{ validEntries() } features to create</p>
      </MessageBlock>
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={LL().FunctionalitiesSection.CreateLayer()}
      onClick={makePortrayal}
      disabled={!(validEntries() && validEntries()! > 0)}
    />
  </div>;
}
