// Import from solid-js
import {
  createEffect, createSignal, For, type JSX, on, Show,
} from 'solid-js';
import { unwrap } from 'solid-js/store';

// Imports from other packages
import { bbox } from '@turf/turf';

// Stores
import { setLoading } from '../../store/GlobalStore';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { mapStore } from '../../store/MapStore';
import { setPortrayalSelectionStore } from '../../store/PortrayalSelectionStore';

// Helper
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName } from '../../helpers/common';
import { computeAppropriateResolution } from '../../helpers/geo';
import { generateIdLayer } from '../../helpers/layers';
import { getProjectionUnit } from '../../helpers/projection';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  GridCellShape,
  type GridParameters,
  type LayerDescription,
  PointAnalysisMeshType,
  PointAnalysisRatioType,
  PointAnalysisStockType,
  RepresentationType,
} from '../../global.d';

function onClickValidate(
  referenceLayerId: string,
  typeLayerToCreate: 'choropleth' | 'proportionalSymbols',
  computationType: PointAnalysisStockType | PointAnalysisRatioType,
  meshParams: GridParameters | string,
  newName: string,
) {
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId)!;

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  const newId = generateIdLayer();

  const newLayerDescription = {
    id: newId,
    name: newName,
    type: 'polygon',
  } as LayerDescription;
}

export default function PointAnalysisSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // All the polygon layer descriptions
  const polygonLayers = layersDescriptionStore.layers
    .filter((l) => l.type === 'polygon')!;

  // The bbox of the layer
  const bboxLayer = bbox(layerDescription.data);

  // The description of the current projection
  const currentProjection = unwrap(mapStore.projection);
  const {
    isGeo,
    unit: distanceUnit,
    toMeter,
  } = getProjectionUnit(currentProjection);

  // Appropriate resolution for the grid in case grid is chosen
  const appropriateResolution = (
    1000 * +(
      computeAppropriateResolution(bboxLayer, 0.1).toPrecision(2))
  ) * toMeter;

  // Signals for the current component:
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(`Choropleth_${layerDescription.name}`);
  const [
    layerType,
    setLayerType,
  ] = createSignal<RepresentationType.choropleth | RepresentationType.proportionalSymbols>(
    RepresentationType.choropleth,
  );
  const [
    meshType,
    setMeshType,
  ] = createSignal<PointAnalysisMeshType>(PointAnalysisMeshType.Grid);
  const [
    computationType,
    setComputationType,
  ] = createSignal<PointAnalysisStockType | PointAnalysisRatioType>();
  // If mesh type is Polygon Layer:
  const [
    meshLayerToUse,
    setMeshLayerToUse,
  ] = createSignal<string>();
  // If mesh type is Grid:
  const [
    cellType,
    setCellType,
  ] = createSignal<GridCellShape>('square');
  const [
    targetResolution,
    setTargetResolution,
  ] = createSignal<number>(appropriateResolution);
  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    const meshParams: GridParameters | string = meshType() === 'Grid'
      ? {
        xMin: bboxLayer[0],
        yMin: bboxLayer[1],
        xMax: bboxLayer[2],
        yMax: bboxLayer[3],
        resolution: targetResolution(),
      } as GridParameters
      : meshLayerToUse()!;

    // Close the current modal
    setPortrayalSelectionStore({ show: false, layerId: '' });

    // Display loading overlay
    setLoading(true);

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        layerType(),
        computationType()!,
        meshParams,
        layerName,
      );

      setLoading(false);

      openLayerManager();
    }, 0);
  };

  createEffect(
    on(
      () => layerType(),
      () => {
        if (layerType() === RepresentationType.choropleth) {
          setComputationType(PointAnalysisRatioType.Density);
        } else { // layerType() === RepresentationType.proportionalSymbols
          setComputationType(PointAnalysisStockType.Count);
        }
      },
    ),
  );

  createEffect(
    on(
      () => meshType(),
      () => {
        if (meshType() === 'PolygonLayer') {
          setMeshLayerToUse(polygonLayers[0].id);
        }
      },
    ),
  );

  return <div class="portrayal-section__portrayal-options-choropleth">
    <InputFieldSelect
      label={LL().PortrayalSection.PointAnalysisOptions.MapType()}
      onChange={(v) => {
        setLayerType(v as RepresentationType.choropleth | RepresentationType.proportionalSymbols);
      }}
      value={layerType()}>
      <option value={RepresentationType.choropleth}>
        {LL().PortrayalSection.PointAnalysisOptions.MapTypeRatio()}
      </option>
      <option value={RepresentationType.proportionalSymbols}>
        {LL().PortrayalSection.PointAnalysisOptions.MapTypeStock()}
      </option>
    </InputFieldSelect>
    <Show when={layerType() === 'proportionalSymbols'}>
      <InputFieldSelect
        label={LL().PortrayalSection.PointAnalysisOptions.ComputationType()}
        onChange={(v) => {
          setComputationType(v as PointAnalysisStockType | PointAnalysisRatioType);
        }}
        value={computationType()!}
      >
        <For each={Object.values(PointAnalysisStockType)}>
          {(v) => <option value={v}>
            {LL().PortrayalSection.PointAnalysisOptions[`ComputationType${v}`]()}
          </option>}
        </For>
      </InputFieldSelect>
    </Show>
    <Show when={layerType() === 'choropleth'}>
      <InputFieldSelect
        label={LL().PortrayalSection.PointAnalysisOptions.ComputationType()}
        onChange={(v) => {
          setComputationType(v as PointAnalysisStockType | PointAnalysisRatioType);
        }}
        value={computationType()!}
      >
        <For each={Object.values(PointAnalysisRatioType)}>
          {(v) => <option value={v}>
            {LL().PortrayalSection.PointAnalysisOptions[`ComputationType${v}`]()}
          </option>}
        </For>
      </InputFieldSelect>
    </Show>
    <InputFieldSelect
      label={LL().PortrayalSection.PointAnalysisOptions.MeshType()}
      onChange={(v) => { setMeshType(v as PointAnalysisMeshType); }}
      value={meshType()}
    >
      <option value={PointAnalysisMeshType.Grid}>
        {LL().PortrayalSection.PointAnalysisOptions.MeshTypeGrid()}
      </option>
      <option value={PointAnalysisMeshType.PolygonLayer} disabled={polygonLayers.length === 0}>
        {LL().PortrayalSection.PointAnalysisOptions.MeshTypePolygonLayer()}
      </option>
    </InputFieldSelect>
    <Show when={meshType() === PointAnalysisMeshType.PolygonLayer}>
      <InputFieldSelect
        label={LL().PortrayalSection.PointAnalysisOptions.LayerToUse()}
        onChange={(v) => { setMeshLayerToUse(v); }}
        value={meshLayerToUse()}
      >
        <For each={polygonLayers}>
          {(l) => <option value={l.id}>{l.name}</option>}
        </For>
      </InputFieldSelect>
    </Show>
    <Show when={meshType() === PointAnalysisMeshType.Grid}>
      <InputFieldSelect
        label={LL().PortrayalSection.GridOptions.CellShape()}
        onChange={(v) => { setCellType(v as GridCellShape); }}
        value={cellType()}
      >
        <option value="square">{LL().PortrayalSection.GridOptions.CellSquare()}</option>
        <option value="hexagon">{LL().PortrayalSection.GridOptions.CellHexagon()}</option>
        <option value="diamond">{LL().PortrayalSection.GridOptions.CellDiamond()}</option>
        <option value="triangle">{LL().PortrayalSection.GridOptions.CellTriangle()}</option>
      </InputFieldSelect>
      <InputFieldNumber
        label={LL().PortrayalSection.GridOptions.ResolutionWithUnit({ unit: distanceUnit })}
        value={targetResolution()}
        onChange={(value) => setTargetResolution(value)}
        min={0}
        max={500}
        step={0.1}
      />
    </Show>
    <InputResultName
      onKeyUp={(value) => {
        setNewLayerName(value);
      }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      label={ LL().PortrayalSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
