// Imports from solid-js
import {
  createEffect,
  createSignal, For, type JSX, on, Show,
} from 'solid-js';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setPortrayalSelectionStore } from '../../store/PortrayalSelectionStore';

// Other components
import InputResultName from './InputResultName.tsx';
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import { findSuitableName, isNonNull, isNumber } from '../../helpers/common';
import { setLoading } from '../../store/GlobalStore';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import MessageBlock from '../MessageBlock.tsx';

// Types / Interfaces / Enums

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

  const validWkt = valuesWkt.filter((v) => {
    return isNonNull(v)
      && typeof v === 'string'
      && (
        v.startsWith('POINT')
        || v.startsWith('LINESTRING')
        || v.startsWith('POLYGON')
        || v.startsWith('MULTIPOINT')
        || v.startsWith('MULTILINESTRING')
        || v.startsWith('MULTIPOLYGON')
      );
  });

  return validWkt.length;
}

async function onClickValidate(
  referenceTableId: string,
  newLayerName: string,
) {
  console.log('onClickValidate', referenceTableId, newLayerName);
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
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    // Close the current modal
    setPortrayalSelectionStore({ show: false, layerId: '' });

    // Display loading overlay
    setLoading(true);

    await yieldOrContinue('smooth');

    // Actually create the layer
    setTimeout(async () => {
      await onClickValidate(
        tableDescription.id,
        layerName,
      );

      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-layer-from-tabular">
    <Show when={mode() === 'coordinates'}>
      <InputFieldSelect
        label={LL().PortrayalSection.LayerFromTableOptions.FieldX()}
        onChange={(value) => { setFieldX(value); }}
        value={fieldX()}
      >
        <option value="">{ LL().PortrayalSection.LayerFromTableOptions.FieldX() }</option>
        <For each={tableDescription.fields}>
          {(field) => <option value={field.name}>{field.name}</option>}
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={LL().PortrayalSection.LayerFromTableOptions.FieldY()}
        onChange={(value) => { setFieldY(value); }}
        value={fieldY()}
      >
        <option value="">{ LL().PortrayalSection.LayerFromTableOptions.FieldY() }</option>
        <For each={tableDescription.fields}>
          {(field) => <option value={field.name}>{field.name}</option>}
        </For>
      </InputFieldSelect>
    </Show>
    <Show when={mode() === 'wkt'}>
      <InputFieldSelect
        label={LL().PortrayalSection.LayerFromTableOptions.FieldWkt()}
        onChange={(value) => { setFieldWkt(value); }}
        value={fieldWkt()}
      >
        <option value="">{ LL().PortrayalSection.LayerFromTableOptions.FieldWkt() }</option>
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
      label={LL().PortrayalSection.CreateLayer()}
      onClick={makePortrayal}
      disabled={!(validEntries() && validEntries()! > 0)}
    />
  </div>;
}
