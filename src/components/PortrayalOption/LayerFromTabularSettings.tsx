// Imports from solid-js
import {
  createEffect, createSignal, For,
  type JSX, Match, on, Show, Switch,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';
import proj4 from 'proj4';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName, isNonNull, isFiniteNumber } from '../../helpers/common';
import { getGeometryType } from '../../helpers/formatConversion';
import {
  makeLayerFromTableAndWKT,
  makeLayerFromTableAndXY,
  wktSeemsValid,
} from '../../helpers/layerFromTable';
import { generateIdLayer, getDefaultRenderingParams } from '../../helpers/layers';
import {
  epsgDb,
  getProjectionFromEpsgCode,
  reprojWithProj4,
} from '../../helpers/projection';

// Stores
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import {
  setFunctionalitySelectionStore,
} from '../../store/FunctionalitySelectionStore';
import { fitExtent } from '../../store/MapStore';
import { setLoading } from '../../store/GlobalStore';

// Other components
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputResultName from './InputResultName.tsx';
import InputFieldRadio from '../Inputs/InputRadio.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldText from '../Inputs/InputText.tsx';
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
    isNonNull(v) && isFiniteNumber(v) && isNonNull(valuesY[i]) && isFiniteNumber(valuesY[i])
  ));

  return validBoth.length;
}

function validateExtentCoordinates(
  tableId: string,
  fieldX: string,
  fieldY: string,
  targetCrs: string = 'EPSG:4326',
): number | null {
  // We want to know if the coordinates are in the expected range for the target CRS
  const table = layersDescriptionStore.tables.find((t) => t.id === tableId)!;
  const valuesX = table.data.map((d) => d[fieldX]);
  const valuesY = table.data.map((d) => d[fieldY]);

  // Find the projection in the EPSG database
  const projection = epsgDb[+targetCrs.replace('EPSG:', '')];
  if (!projection || !projection.bbox) return null;

  // Instantiate a proj4 object for the target CRS
  const p = proj4(projection.proj4 || projection.wkt);

  // Transform the box coordinates to the target CRS
  const [ymax0, xmin0, ymin0, xmax0] = projection.bbox;
  const [xmin, ymin] = p.forward([xmin0, ymin0]);
  const [xmax, ymax] = p.forward([xmax0, ymax0]);

  // Check if the coordinates are in the expected range
  const validExtent = valuesX.filter((v, i) => (
    v >= xmin && v <= xmax && valuesY[i] >= ymin && valuesY[i] <= ymax
  ));

  return validExtent.length;
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
  epsgCode: string,
) {
  const tableDescription = layersDescriptionStore.tables
    .find((table) => table.id === referenceTableId)!;

  const shouldFitLayer = layersDescriptionStore.layers.length === 0;
  const layerId = generateIdLayer();

  if (mode === 'coordinates') {
    let newData = await makeLayerFromTableAndXY(
      tableDescription.data,
      fieldOrFields[0],
      fieldOrFields[1],
    );

    if (epsgCode !== 'EPSG:4326') {
      newData = reprojWithProj4(
        getProjectionFromEpsgCode(epsgCode),
        newData,
        true,
      );
    }

    const newFields = tableDescription.fields
      .filter((f) => f.name !== fieldOrFields[0] && f.name !== fieldOrFields[1])
      .map((f) => ({ ...f }));

    const newLayerDescription = {
      id: layerId,
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
    let newData = await makeLayerFromTableAndWKT(
      tableDescription.data,
      fieldOrFields as string,
    );

    if (epsgCode !== 'EPSG:4326') {
      newData = reprojWithProj4(
        getProjectionFromEpsgCode(epsgCode),
        newData,
        true,
      );
    }

    const newFields = tableDescription.fields
      .filter((f) => f.name !== fieldOrFields as string)
      .map((f) => ({ ...f }));

    const geometryType = getGeometryType(newData);

    const newLayerDescription = {
      id: layerId,
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

  if (shouldFitLayer) {
    fitExtent(layerId);
  }
}

export default function LayerFromTabularSettings(
  props: { tableId: string },
): JSX.Element {
  const { LL } = useI18nContext();

  const tableDescription = layersDescriptionStore.tables
    .find((table) => table.id === props.tableId)!; // eslint-disable-line solid/reactivity

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
    selectValue,
    setSelectValue,
  ] = createSignal<string>('EPSG:4326');

  const [
    pointCrs,
    setPointCrs,
  ] = createSignal<string>('EPSG:4326');

  const [
    validEntries,
    setValidEntries,
  ] = createSignal<number | null>(null);

  const [
    entriesInExtent,
    setEntriesInExtent,
  ] = createSignal<number | null>(null);

  createEffect(
    on(
      () => [fieldX(), fieldY(), fieldWkt(), pointCrs()],
      () => {
        if (mode() === 'coordinates') {
          if (fieldX() === '' || fieldY() === '') return;
          setValidEntries(validateFieldsXY(
            props.tableId,
            fieldX(),
            fieldY(),
          ));
          setEntriesInExtent(validateExtentCoordinates(
            props.tableId,
            fieldX(),
            fieldY(),
            pointCrs(),
          ));
        } else {
          if (fieldWkt() === '') return;
          setValidEntries(validateFieldWkt(
            props.tableId,
            fieldWkt(),
          ));
          setEntriesInExtent(null);
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
        setValidEntries(null);
        setEntriesInExtent(null);
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
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

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
        pointCrs(),
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
    <InputFieldSelect
      label={LL().FunctionalitiesSection.LayerFromTableOptions.Crs()}
      onChange={(v) => {
        setSelectValue(v);
        if (v !== '') setPointCrs(v);
      }}
      value={selectValue()}
    >
      <option value="EPSG:4326">EPSG:4326</option>
      <option value="EPSG:3857">EPSG:3857</option>
      <option value="EPSG:2154">EPSG:2154</option>
      <option value="EPSG:3035">EPSG:3035</option>
      <option value="">{LL().FunctionalitiesSection.LayerFromTableOptions.MoreCrs()}</option>
    </InputFieldSelect>
    <Show when={selectValue() === ''}>
      <InputFieldText
        label={''}
        value={pointCrs()}
        dataList={
          Object.keys(epsgDb)
            .map((k) => ({ value: `EPSG:${k}`, name: `EPSG:${k} (${epsgDb[k].name})` }))
        }
        onChange={(v) => { setPointCrs(v); }}
        width={200}
      />
    </Show>
    <Show when={
      (
        (mode() === 'coordinates' && fieldX() && fieldY())
        || (mode() === 'wkt' && fieldWkt())
      ) && validEntries() !== null && validEntries()! === 0
    }>
      <MessageBlock type={'danger'} useIcon={true}>
        <p>{ LL().FunctionalitiesSection.LayerFromTableOptions.NoFeatureToCreate() }</p>
      </MessageBlock>
    </Show>
    <Show when={
      (
        (mode() === 'coordinates' && fieldX() && fieldY())
        || (mode() === 'wkt' && fieldWkt())
      ) && validEntries() !== null && validEntries()! > 0
    }>
      <Switch>
        <Match when={entriesInExtent() === null || entriesInExtent()! > 0}>
          <MessageBlock type={'success'} useIcon={true}>
            <p>{
              LL().FunctionalitiesSection.LayerFromTableOptions.NFeaturesToCreate(validEntries()!)
            }</p>
          </MessageBlock>
        </Match>
        <Match when={entriesInExtent() !== null && entriesInExtent() === 0}>
          <MessageBlock type={'danger'} useIcon={true}>
            <p>{
              LL().FunctionalitiesSection.LayerFromTableOptions.CoordsNotInCRS()
            }</p>
          </MessageBlock>
        </Match>
      </Switch>
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={LL().FunctionalitiesSection.CreateLayer()}
      onClick={makePortrayal}
      disabled={
        !(validEntries() !== null && validEntries()! > 0)
        || (entriesInExtent() !== null && entriesInExtent() === 0)
      }
    />
  </div>;
}
