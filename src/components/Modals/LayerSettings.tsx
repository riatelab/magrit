// Imports from solid-js
import {
  Accessor,
  For,
  JSX,
  Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other libs
import { getPalettes } from 'dicopal';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { getPaletteWrapper } from '../../helpers/color';
import { debounce, unproxify } from '../../helpers/common';
import d3 from '../../helpers/d3-custom';
import { webSafeFonts } from '../../helpers/font';
import { makeDorlingDemersSimulation } from '../../helpers/geo';
import { generateIdLegend } from '../../helpers/legends';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Sub-components
import DetailsSummary from '../DetailsSummary.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldText from '../Inputs/InputText.tsx';
import InputFieldButton from '../Inputs/InputButton.tsx';
import { CategoriesCustomisation } from '../PortrayalOption/CategoricalChoroplethComponents.tsx';
import {
  CategoriesCustomisation as CategoriesCustomisationPicto,
} from '../PortrayalOption/CategoricalPictogramComponents.tsx';
import { LinksSelectionOnExistingLayer } from '../PortrayalOption/LinksComponents.tsx';

// Stores
import {
  layersDescriptionStore,
  type LayersDescriptionStoreType,
  // In this component we use the base version of the store to avoid pushing
  // the changes to the undo/redo stack (because there is a
  // cancel button in the LayerSettings modal)
  setLayersDescriptionStoreBase,
  // Except for the layoutFeaturesAndLegends, where we want to push the changes
  // through the undo/redo stack
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setClassificationPanelStore } from '../../store/ClassificationPanelStore';
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Types / Interfaces
import {
  type CategoricalChoroplethParameters,
  type ClassificationParameters,
  type GriddedLayerParameters,
  type LabelsParameters,
  type LayerDescription,
  type LayerDescriptionLabels,
  type LinksParameters,
  type MushroomsParameters,
  type ProportionalSymbolsParameters,
  type SmoothedLayerParameters,
  LinkCurvature,
  LinkHeadType,
  ProportionalSymbolsSymbolType,
  type ProportionalSymbolsParametersBase,
  type GraticuleParameters,
  type MultiLineString,
  type LayoutFeature,
  type Legend,
  LegendType,
  type LegendTextElement,
  type CategoricalChoroplethBarchartLegend,
  type ProportionalSymbolCategoryParameters,
  type ChoroplethHistogramLegend,
  type ProportionalSymbolsRatioParameters,
  CustomPalette,
  type GeoJSONFeature,
  type ProportionalSymbolSingleColorParameters,
  type LayerDescriptionCategoricalPictogram,
  type CategoricalPictogramParameters,
} from '../../global.d';

// Styles
import '../../styles/LayerAndLegendSettings.css';

const updateProp = (
  layerId: string,
  propOrProps: string | string[],
  value: string | number | boolean | object | null,
) => {
  if (Array.isArray(propOrProps)) {
    const allPropsExceptLast = propOrProps.slice(0, propOrProps.length - 1);
    const lastProp = propOrProps[propOrProps.length - 1];
    const args = [
      'layers',
      (l: LayerDescription) => l.id === layerId,
      ...allPropsExceptLast,
      {
        [lastProp]: value,
      },
    ];
    // @ts-expect-error because we use a spread argument
    setLayersDescriptionStoreBase(...args);
  } else {
    setLayersDescriptionStoreBase(
      'layers',
      (l: LayerDescription) => l.id === layerId,
      { [propOrProps]: value },
    );
  }
};

const debouncedUpdateProp = debounce(updateProp, 200);

const layerLinkedToHistogramOrBarChart = (
  layer: LayerDescription,
  layoutFeaturesAndLegends: (LayoutFeature | Legend)[],
): boolean => {
  const ids = layoutFeaturesAndLegends
    .filter((l) => l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart')
    .map((l) => (l as Legend).layerId);
  return ids.includes(layer.id);
};

function AestheticsSection(props: LayerDescription): JSX.Element {
  const { LL } = useI18nContext();

  return <div>
    <InputFieldCheckbox
      label={LL().LayerSettings.DropShadow()}
      checked={!!props.dropShadow}
      onChange={(checked) => {
        const value = checked
          ? {
            dx: 5, dy: 5, stdDeviation: 7, color: '#000000',
          } : null;
        updateProp(
          props.id,
          'dropShadow',
          value,
        );
      }}
    />
    <Show when={!!props.dropShadow}>
      <InputFieldNumber
        label={LL().LayerSettings.DropShadowDx()}
        value={props.dropShadow!.dx}
        onChange={(v) => debouncedUpdateProp(props.id, ['dropShadow', 'dx'], v)}
        min={-20}
        max={20}
        step={1}
      />
      <InputFieldNumber
        label={LL().LayerSettings.DropShadowDy()}
        value={props.dropShadow!.dy}
        onChange={(v) => debouncedUpdateProp(props.id, ['dropShadow', 'dy'], v)}
        min={-20}
        max={20}
        step={1}
      />
      <InputFieldCheckbox
        label={LL().LayerSettings.DropShadowBlur()}
        checked={props.dropShadow!.stdDeviation !== 0}
        onChange={(checked) => {
          const value = checked ? 7 : 0;
          debouncedUpdateProp(props.id, ['dropShadow', 'stdDeviation'], value);
        }}
      />
      <InputFieldColor
        label={LL().LayerSettings.DropShadowColor()}
        value={props.dropShadow!.color}
        onChange={(v) => debouncedUpdateProp(props.id, ['dropShadow', 'color'], v)}
      />
    </Show>
  </div>;
}

function makeSettingsPictograms(
  props: LayerDescriptionCategoricalPictogram,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  return <>
    <DetailsSummary
      summaryContent={LL().FunctionalitiesSection.CategoricalPictogramOptions.Customize()}
    >
      <CategoriesCustomisationPicto
        mapping={() => (
          props.rendererParameters! as CategoricalPictogramParameters).mapping
        }
        setMapping={(m) => {
          updateProp(props.id, ['rendererParameters', 'mapping'], m as never);
        }}
        detailed={false}
      />
    </DetailsSummary>
  </>;
}

function makeSettingsLabels(
  props: LayerDescriptionLabels,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const rendererParameters = props.rendererParameters as LabelsParameters;
  return <>
    <InputFieldSelect
      label={ LL().LayerSettings.FontFamily() }
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'fontFamily'], v)}
      value={rendererParameters.fontFamily}
    >
      <For each={webSafeFonts}>
        {(font) => <option value={font}>{font}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldNumber
      label={ LL().LayerSettings.FontSize() }
      value={rendererParameters.fontSize}
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'fontSize'], v)}
      min={1}
      max={100}
      step={1}
    />
    <InputFieldColor
      label={ LL().LayerSettings.TextColor() }
      value={rendererParameters.fontColor}
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'fontColor'], v)}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.XOffset() }
      value={rendererParameters.textOffset[0]}
      onChange={
        (v) => {
          const value = [v, rendererParameters.textOffset[1]];
          debouncedUpdateProp(props.id, ['rendererParameters', 'textOffset'], value);
        }
      }
      min={-100}
      max={100}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.YOffset() }
      value={rendererParameters.textOffset[1]}
      onChange={
        (v) => {
          const value = [rendererParameters.textOffset[0], v];
          debouncedUpdateProp(props.id, ['rendererParameters', 'textOffset'], value);
        }
      }
      min={-100}
      max={100}
      step={1}
    />
    <InputFieldSelect
      label={ LL().LayerSettings.FontStyle() }
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'fontStyle'], v)}
      value={rendererParameters.fontStyle}
    >
      <option value="normal">Normal</option>
      <option value="italic">Italic</option>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().LayerSettings.FontWeight() }
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'fontWeight'], v)}
      value={rendererParameters.fontWeight}
    >
      <option value="normal">Normal</option>
      <option value="bold">Bold</option>
    </InputFieldSelect>
    <InputFieldCheckbox
      label={ LL().LayerSettings.BufferAroundText() }
      checked={rendererParameters.halo !== undefined}
      onChange={(v) => {
        if (v) {
          debouncedUpdateProp(props.id, ['rendererParameters', 'halo'], { color: '#ffffff', width: 2 });
        } else {
          debouncedUpdateProp(props.id, ['rendererParameters', 'halo'], undefined);
        }
      }}
    />
    <Show when={rendererParameters.halo !== undefined}>
      <InputFieldColor
        label={ LL().LayerSettings.BufferColor() }
        value={rendererParameters.halo!.color}
        onChange={(v) => {
          const haloProps = {
            color: v,
            width: rendererParameters.halo!.width,
          };
          debouncedUpdateProp(props.id, ['rendererParameters', 'halo'], haloProps);
        }}
      />
      <InputFieldNumber
        label={ LL().LayerSettings.BufferWidth() }
        value={rendererParameters.halo!.width}
        onChange={
          (v) => {
            const haloProps = {
              color: rendererParameters.halo!.color,
              width: v,
            };
            debouncedUpdateProp(props.id, ['rendererParameters', 'halo'], haloProps);
          }
        }
        min={0}
        max={10}
        step={1}
      />
    </Show>
    <InputFieldCheckbox
      label={ LL().LayerSettings.AllowMovingLabels() }
      checked={rendererParameters.movable}
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'movable'], v)}
    />
    <InputFieldButton
      label={LL().LayerSettings.ResetLabelLocations()}
      onClick={() => {
        // TODO...
      }}
    />
  </>;
}

function makeSettingsDefaultPoint(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  return <>
    {/*
      The way the entities are colored depends on the renderer...
        - For 'default' renderer (i.e. no classification), we can choose the color manually
        - For 'choropleth' renderer, we propose to reopen the classification modal
        - For 'proportional' renderer, ... (TODO)
    */}
    <Show when={props.renderer === 'default'}>
      <InputFieldColor
        label={ LL().LayerSettings.FillColor() }
        value={props.fillColor!}
        onChange={(v) => debouncedUpdateProp(props.id, 'fillColor', v)}
      />
    </Show>
    <Show when={props.renderer === 'choropleth'}>
      <div class="field" style={{ 'text-align': 'center' }}>
        <button
          class="button"
          style={{ margin: 'auto' }}
          onClick={() => {
            // Save current state of classification parameters
            const params = unproxify(props.rendererParameters as never);
            setClassificationPanelStore({
              show: true,
              type: 'color',
              layerName: props.name,
              series: props.data.features
                .map((f) => f.properties[(
                  props.rendererParameters as ClassificationParameters).variable]),
              classificationParameters: params,
              onCancel: () => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: params },
                );
              },
              onConfirm: (newParams) => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: newParams },
                );
              },
            });
          }}
        >{LL().LayerSettings.ChangeClassification()}</button>
      </div>
      <InputFieldCheckbox
        label={LL().LayerSettings.AddHistogramChoropleth()}
        checked={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        disabled={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStore(
            produce(
              (draft: LayersDescriptionStoreType) => {
                draft.layoutFeaturesAndLegends.push({
                  id: generateIdLegend(),
                  layerId: props.id,
                  type: LegendType.choroplethHistogram,
                  position: [legendPosition[0], legendPosition[1]],
                  width: 300,
                  height: 250,
                  fontColor: '#000000',
                  visible: true,
                  title: {
                    text: (props.rendererParameters as ClassificationParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  note: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.note,
                  },
                  backgroundRect: {
                    visible: false,
                  },
                } as ChoroplethHistogramLegend);
              },
            ),
          );
        }}
      />
    </Show>
    <Show when={props.renderer === 'proportionalSymbols'}>
      <InputFieldSelect
        disabled={true}
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.SymbolType()}
        onChange={(v) => {}}
        value={(props.rendererParameters as ProportionalSymbolsParameters).symbolType}
      >
        <option value={ProportionalSymbolsSymbolType.circle}>
          { LL().FunctionalitiesSection.ProportionalSymbolsOptions.SymbolTypes.circle() }
        </option>
        <option value={ProportionalSymbolsSymbolType.square}>
          { LL().FunctionalitiesSection.ProportionalSymbolsOptions.SymbolTypes.square() }
        </option>
      </InputFieldSelect>
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ReferenceSize()}
        value={(props.rendererParameters as ProportionalSymbolsParameters).referenceRadius}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'referenceRadius'], v)}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={ LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue() }
        value={(props.rendererParameters as ProportionalSymbolsParameters).referenceValue}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'referenceValue'], v)}
        min={1}
        max={99999999999}
        step={0.1}
      />
    </Show>
    <Show when={
      props.renderer === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'singleColor'
    }>
      <InputFieldColor
        label={ LL().LayerSettings.FillColor() }
        value={ (props.rendererParameters as ProportionalSymbolsParameters).color as string }
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'color'], v)}
      />
    </Show>
    <Show when={
      props.renderer === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'ratioVariable'
    }>
      <div class="field" style={{ 'text-align': 'center' }}>
        <button
          class="button"
          style={{ margin: 'auto' }}
          onClick={() => {
            // Save current state of classification parameters
            const params = unproxify(props.rendererParameters!.color as never);
            setClassificationPanelStore({
              show: true,
              type: 'color',
              layerName: props.name,
              series: props.data.features
                .map((f) => f.properties[(
                  props.rendererParameters!.color as ClassificationParameters).variable]),
              classificationParameters: params,
              onCancel: () => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  'rendererParameters',
                  { color: params },
                );
              },
              onConfirm: (newParams) => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  'rendererParameters',
                  { color: newParams },
                );
              },
            });
          }}
        >{LL().LayerSettings.ChangeClassification()}</button>
      </div>
      <InputFieldCheckbox
        label={LL().LayerSettings.AddHistogramChoropleth()}
        checked={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        disabled={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStore(
            produce(
              (draft: LayersDescriptionStoreType) => {
                draft.layoutFeaturesAndLegends.push({
                  id: generateIdLegend(),
                  layerId: props.id,
                  type: LegendType.choroplethHistogram,
                  position: [legendPosition[0], legendPosition[1]],
                  width: 300,
                  height: 250,
                  fontColor: '#000000',
                  visible: true,
                  title: {
                    text: (
                      props.rendererParameters as ProportionalSymbolsRatioParameters)
                      .color.variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  note: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.note,
                  },
                  backgroundRect: {
                    visible: false,
                  },
                } as ChoroplethHistogramLegend);
              },
            ),
          );
        }}
      />
    </Show>
    <Show when={
      props.renderer === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'categoricalVariable'
    }>
      <DetailsSummary
        summaryContent={LL().FunctionalitiesSection.CategoricalChoroplethOptions.Customize()}
      >
        <CategoriesCustomisation
          mapping={() => (
            props.rendererParameters!.color as CategoricalChoroplethParameters).mapping
          }
          setMapping={(m) => {
            updateProp(props.id, ['rendererParameters', 'color', 'mapping'], m as never);
          }}
          detailed={false}
        />
      </DetailsSummary>
      <InputFieldCheckbox
        label={LL().LayerSettings.AddBarChartCategoricalChoropleth()}
        checked={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        disabled={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStore(
            produce(
              (draft: LayersDescriptionStoreType) => {
                draft.layoutFeaturesAndLegends.push({
                  id: generateIdLegend(),
                  layerId: props.id,
                  type: LegendType.categoricalChoroplethBarchart,
                  position: [legendPosition[0], legendPosition[1]],
                  width: 300,
                  height: 250,
                  orientation: 'horizontal',
                  order: 'none',
                  fontColor: '#000000',
                  visible: true,
                  title: {
                    text: (
                      props.rendererParameters as ProportionalSymbolCategoryParameters)
                      .color.variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  note: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.note,
                  },
                  backgroundRect: {
                    visible: false,
                  },
                } as CategoricalChoroplethBarchartLegend);
              },
            ),
          );
        }}
      />
    </Show>
    <InputFieldColor
      label={LL().LayerSettings.StrokeColor()}
      value={props.strokeColor!}
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
    />
    <InputFieldNumber
      label={LL().LayerSettings.FillOpacity()}
      value={props.fillOpacity!}
      onChange={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={LL().LayerSettings.StrokeOpacity()}
      value={props.strokeOpacity!}
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={LL().LayerSettings.StrokeWidth()}
      value={props.strokeWidth!}
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
      min={0}
      max={10}
      step={0.1}
    />
    <Show when={props.renderer !== 'proportionalSymbols' && props.renderer !== 'mushrooms'}>
      <InputFieldNumber
        label={LL().LayerSettings.SymbolSize()}
        value={props.symbolSize!}
        onChange={(v) => debouncedUpdateProp(props.id, 'symbolSize', v)}
        min={1}
        max={20}
        step={1}
      />
      <InputFieldSelect
        label={LL().LayerSettings.SymbolType()}
        onChange={(v) => debouncedUpdateProp(props.id, 'symbolType', v)}
        value={props.symbolType!}
      >
        <option value="circle">{LL().LayerSettings.SymbolTypes.circle()}</option>
        <option value="square">{LL().LayerSettings.SymbolTypes.square()}</option>
        <option value="cross">{LL().LayerSettings.SymbolTypes.cross()}</option>
        <option value="star">{LL().LayerSettings.SymbolTypes.star()}</option>
        <option value="diamond">{LL().LayerSettings.SymbolTypes.diamond()}</option>
        <option value="diamond2">{LL().LayerSettings.SymbolTypes.diamond2()}</option>
        <option value="triangle">{LL().LayerSettings.SymbolTypes.triangle()}</option>
      </InputFieldSelect>
    </Show>
    <Show when={props.renderer === 'mushrooms'}>
      <div class="mt-4 mb-5 has-text-weight-bold">
        {LL().FunctionalitiesSection.MushroomsOptions.TopProperties()}
      </div>
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ReferenceSize()}
        value={(props.rendererParameters as MushroomsParameters).top.referenceSize}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'top', 'referenceSize'], v)}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue()}
        value={(props.rendererParameters as MushroomsParameters).top.referenceValue}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'top', 'referenceValue'], v)}
        min={1}
        max={99999999999}
        step={0.1}
      />
      <InputFieldColor
        label={LL().LayerSettings.FillColor()}
        value={(props.rendererParameters as MushroomsParameters).top.color as string}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'top', 'color'], v)}
      />
      <div class="mt-4 mb-5 has-text-weight-bold">
        {LL().FunctionalitiesSection.MushroomsOptions.BottomProperties()}
      </div>
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ReferenceSize()}
        value={(props.rendererParameters as MushroomsParameters).bottom.referenceSize}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'bottom', 'referenceSize'], v)}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue()}
        value={(props.rendererParameters as MushroomsParameters).bottom.referenceValue}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'bottom', 'referenceValue'], v)}
        min={1}
        max={99999999999}
        step={0.1}
      />
      <InputFieldColor
        label={LL().LayerSettings.FillColor()}
        value={(props.rendererParameters as MushroomsParameters).bottom.color as string}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'bottom', 'color'], v)}
      />
    </Show>
    <Show when={props.renderer === 'proportionalSymbols'}>
      <InputFieldCheckbox
        label={ LL().FunctionalitiesSection.ProportionalSymbolsOptions.AvoidOverlapping() }
        checked={ (props.rendererParameters as ProportionalSymbolsParameters).avoidOverlapping }
        onChange={(checked) => {
          setLayersDescriptionStoreBase(
            'layers',
            (l: LayerDescription) => l.id === props.id,
            'rendererParameters',
            { avoidOverlapping: checked },
          );
          if (checked) {
            // Compute position of the symbols
            setLayersDescriptionStoreBase(
              produce((draft: LayersDescriptionStoreType) => {
                draft.layers.filter((l) => l.id === props.id).forEach((layerDescription) => {
                  const r = (layerDescription.rendererParameters as ProportionalSymbolsParameters);
                  // eslint-disable-next-line no-param-reassign
                  layerDescription.data.features = makeDorlingDemersSimulation(
                    unproxify(layerDescription.data.features as never) as GeoJSONFeature[],
                    r.variable,
                    {
                      referenceSize: r.referenceRadius,
                      referenceValue: r.referenceValue,
                      symbolType: r.symbolType,
                    },
                    r.iterations,
                    layerDescription.strokeWidth as number,
                  );
                });
              }),
            );
          } else {
            // Restore position of the symbols
            setLayersDescriptionStoreBase(
              produce((draft: LayersDescriptionStoreType) => {
                draft.layers.filter((l) => l.id === props.id).forEach((layerDescription) => {
                  layerDescription.data.features.forEach((f) => {
                    // eslint-disable-next-line no-param-reassign
                    f.geometry.coordinates[0] = f.geometry.originalCoordinates[0] as number;
                    // eslint-disable-next-line no-param-reassign
                    f.geometry.coordinates[1] = f.geometry.originalCoordinates[1] as number;
                  });
                });
              }),
            );
          }
        }}
      />
      <Show when={(props.rendererParameters as ProportionalSymbolsParameters).avoidOverlapping}>
        <InputFieldNumber
          label={LL().LayerSettings.Iterations()}
          value={(props.rendererParameters as ProportionalSymbolsParameters).iterations}
          min={1}
          max={1000}
          step={1}
          onChange={(v) => {
            debouncedUpdateProp(props.id, ['rendererParameters', 'iterations'], v);
            // Compute position of the symbols with the new value
            // for "iterations"
            setLayersDescriptionStoreBase(
              produce((draft: LayersDescriptionStoreType) => {
                draft.layers.filter((l) => l.id === props.id).forEach((layerDescription) => {
                  const r = (layerDescription.rendererParameters as ProportionalSymbolsParameters);
                  // eslint-disable-next-line no-param-reassign
                  layerDescription.data.features = makeDorlingDemersSimulation(
                    unproxify(layerDescription.data.features as never) as GeoJSONFeature[],
                    r.variable,
                    {
                      referenceSize: r.referenceRadius,
                      referenceValue: r.referenceValue,
                      symbolType: r.symbolType,
                    },
                    v,
                    layerDescription.strokeWidth as number,
                  );
                });
              }),
            );
          }}
        />
      </Show>
      <InputFieldCheckbox
        label={ LL().LayerSettings.AllowMovingSymbols() }
        checked={(props.rendererParameters as ProportionalSymbolsParameters).movable}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'movable'], v)}
      />
    </Show>
    <Show when={props.renderer === 'categoricalChoropleth'}>
      <DetailsSummary
        summaryContent={LL().FunctionalitiesSection.CategoricalChoroplethOptions.Customize()}
      >
        <CategoriesCustomisation
          mapping={() => (props.rendererParameters as CategoricalChoroplethParameters).mapping}
          setMapping={(m) => {
            updateProp(props.id, ['rendererParameters', 'mapping'], m as never);
          }}
          detailed={false}
        />
      </DetailsSummary>
      <InputFieldCheckbox
        label={LL().LayerSettings.AddBarChartCategoricalChoropleth()}
        checked={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        disabled={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStore(
            produce(
              (draft: LayersDescriptionStoreType) => {
                draft.layoutFeaturesAndLegends.push({
                  id: generateIdLegend(),
                  layerId: props.id,
                  type: LegendType.categoricalChoroplethBarchart,
                  position: [legendPosition[0], legendPosition[1]],
                  width: 300,
                  height: 250,
                  orientation: 'horizontal',
                  order: 'none',
                  fontColor: '#000000',
                  visible: true,
                  title: {
                    text: (
                      props.rendererParameters as CategoricalChoroplethParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  note: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.note,
                  },
                  backgroundRect: {
                    visible: false,
                  },
                } as CategoricalChoroplethBarchartLegend);
              },
            ),
          );
        }}
      />
    </Show>
    <AestheticsSection {...props} />
  </>;
}

function makeSettingsDefaultLine(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  return <>
    <Show when={props.renderer === 'discontinuity'}>
      <div class="field" style={{ 'text-align': 'center' }}>
        <button
          class="button"
          style={{ margin: 'auto' }}
          onClick={() => {
            // Save current state of classification parameters
            const params = unproxify(props.rendererParameters as never);
            setClassificationPanelStore({
              show: true,
              type: 'size',
              layerName: props.name,
              series: props.data.features
                .map((f) => f.properties.value),
              classificationParameters: params,
              onCancel: () => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: params },
                );
              },
              onConfirm: (newParams) => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: newParams },
                );
              },
            });
          }}
        >{LL().LayerSettings.ChangeClassification()}</button>
      </div>
    </Show>
    <Show when={
      props.renderer === 'default'
      || props.renderer === 'discontinuity'
      || props.renderer === 'links'
    }>
      <InputFieldColor
        label={ LL().LayerSettings.StrokeColor() }
        value={ props.strokeColor! }
        onChange={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
      />
    </Show>
    <Show when={
      props.renderer === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'singleColor'
    }>
      <InputFieldColor
        label={ LL().LayerSettings.StrokeColor() }
        value={ (props.rendererParameters as ProportionalSymbolSingleColorParameters).color! }
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'color'], v)}
      />
    </Show>
    <Show when={
      props.renderer === 'choropleth'
      // || (props.renderer === 'proportionalSymbols'
      //   && (props.rendererParameters as ProportionalSymbolsParametersBase)
      //     .colorMode === 'ratioVariable')
    }>
      <div class="field" style={{ 'text-align': 'center' }}>
        <button
          class="button"
          style={{ margin: 'auto' }}
          onClick={() => {
            // Save current state of classification parameters
            const params = unproxify(props.rendererParameters as never);
            setClassificationPanelStore({
              show: true,
              type: 'color',
              layerName: props.name,
              series: props.data.features
                .map((f) => f.properties[(
                  props.rendererParameters as ClassificationParameters).variable]),
              classificationParameters: params,
              onCancel: () => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: params },
                );
              },
              onConfirm: (newParams) => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: newParams },
                );
              },
            });
          }}
        >{LL().LayerSettings.ChangeClassification()}</button>
      </div>
      <InputFieldCheckbox
        label={LL().LayerSettings.AddHistogramChoropleth()}
        checked={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        disabled={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStore(
            produce(
              (draft: LayersDescriptionStoreType) => {
                draft.layoutFeaturesAndLegends.push({
                  id: generateIdLegend(),
                  layerId: props.id,
                  type: LegendType.choroplethHistogram,
                  position: [legendPosition[0], legendPosition[1]],
                  width: 300,
                  height: 250,
                  fontColor: '#000000',
                  visible: true,
                  title: {
                    text: (props.rendererParameters as ClassificationParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  note: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.note,
                  },
                  backgroundRect: {
                    visible: false,
                  },
                } as ChoroplethHistogramLegend);
              },
            ),
          );
        }}
      />
    </Show>
    <InputFieldNumber
      label={LL().LayerSettings.StrokeOpacity()}
      value={props.strokeOpacity!}
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
      min={0}
      max={1}
      step={0.1}
    />
    <Show when={
      props.renderer !== 'discontinuity'
      && !(props.renderer === 'links'
        && ['Exchange', 'BilateralVolume'].includes((props.rendererParameters as LinksParameters).type))
      && !(props.renderer === 'proportionalSymbols')
    }>
      <InputFieldNumber
        label={ LL().LayerSettings.StrokeWidth() }
        value={props.strokeWidth!}
        onChange={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
        min={0}
        max={10}
        step={0.1}
      />
    </Show>
    <InputFieldCheckbox
      label={ LL().LayerSettings.StrokeDashed() }
      checked={!!props.strokeDasharray}
      onChange={(checked) => {
        const v = checked ? '5 5' : undefined;
        debouncedUpdateProp(props.id, 'strokeDasharray', v);
      }}
    />
    <Show when={
      props.renderer === 'links'
      && ['Exchange', 'BilateralVolume'].includes((props.rendererParameters as LinksParameters).type)
      && (props.rendererParameters as LinksParameters).proportional
    }>
      <InputFieldNumber
        label={ LL().FunctionalitiesSection.LinksOptions.LinkSizeProportionalReferenceSize() }
        value={ (props.rendererParameters as LinksParameters).proportional!.referenceSize }
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'proportional', 'referenceSize'], v)}
        min={1}
        max={50}
        step={0.5}
      />
      <InputFieldNumber
        label={ LL().FunctionalitiesSection.LinksOptions.LinkSizeProportionalReferenceValue() }
        value={ (props.rendererParameters as LinksParameters).proportional!.referenceValue }
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'proportional', 'referenceValue'], v)}
        min={1}
        max={1e12}
        step={0.5}
      />
    </Show>
    <Show when={
      props.renderer === 'links'
      && ['Exchange', 'BilateralVolume'].includes((props.rendererParameters as LinksParameters).type)
      && (props.rendererParameters as LinksParameters).classification
    }>
      <></>
    </Show>
    <Show when={props.renderer === 'links'}>
      <InputFieldSelect
        label={LL().FunctionalitiesSection.LinksOptions.LinkCurvature()}
        value={(props.rendererParameters as LinksParameters).curvature}
        onChange={(v) => updateProp(props.id, ['rendererParameters', 'curvature'], v)}
      >
        <For each={Object.entries(LinkCurvature)}>
          {
            ([key, value]) => <option value={value}>
              {LL().FunctionalitiesSection.LinksOptions[`LinkCurvature${key}`]()}
            </option>
          }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={LL().FunctionalitiesSection.LinksOptions.LinkHeadType()}
        value={(props.rendererParameters as LinksParameters).head}
        onChange={(v) => updateProp(props.id, ['rendererParameters', 'head'], v)}
      >
        <For each={Object.entries(LinkHeadType)}>
          {
            ([key, value]) => <option value={value}>
              {LL().FunctionalitiesSection.LinksOptions[`LinkHeadType${key}`]()}
            </option>
          }
        </For>
      </InputFieldSelect>
      <DetailsSummary summaryContent={LL().FunctionalitiesSection.LinksOptions.Selection()}>
        <LinksSelectionOnExistingLayer layerId={props.id}/>
      </DetailsSummary>
    </Show>
    <Show when={props.renderer === 'graticule'}>
      <InputFieldNumber
        label={ LL().LayerSettings.GraticuleStepX() }
        value={(props.rendererParameters as GraticuleParameters).step[0]}
        onChange={(v) => {
          const newStep: [number, number] = [
            v,
            (props.rendererParameters as GraticuleParameters).step[1],
          ];

          updateProp(
            props.id,
            ['rendererParameters', 'step'],
            newStep,
          );

          debouncedUpdateProp(
            props.id,
            ['data', 'features', 0, 'geometry'],
            d3.geoGraticule().step(newStep)() as MultiLineString,
          );
        }}
        min={1}
        max={180}
        step={1}
      />
      <InputFieldNumber
        label={ LL().LayerSettings.GraticuleStepY() }
        value={(props.rendererParameters as GraticuleParameters).step[1]}
        onChange={(v) => {
          const newStep: [number, number] = [
            (props.rendererParameters as GraticuleParameters).step[0],
            v,
          ];

          updateProp(
            props.id,
            ['rendererParameters', 'step'],
            newStep,
          );

          debouncedUpdateProp(
            props.id,
            ['data', 'features', 0, 'geometry'],
            d3.geoGraticule().step(newStep)() as MultiLineString,
          );
        }}
        min={1}
        max={180}
        step={1}
      />
    </Show>
    <Show when={
      props.renderer === 'categoricalChoropleth'
      // || (props.renderer === 'proportionalSymbols'
      //   && (props.rendererParameters as ProportionalSymbolsParametersBase)
      //     .colorMode === 'categoricalVariable')
    }>
      <DetailsSummary
        summaryContent={LL().FunctionalitiesSection.CategoricalChoroplethOptions.Customize()}
      >
        <CategoriesCustomisation
          mapping={() => (props.rendererParameters as CategoricalChoroplethParameters).mapping}
          setMapping={(m) => {
            updateProp(props.id, ['rendererParameters', 'mapping'], m as never);
          }}
          detailed={false}
        />
      </DetailsSummary>
      <InputFieldCheckbox
        label={LL().LayerSettings.AddBarChartCategoricalChoropleth()}
        checked={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        disabled={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStore(
            produce(
              (draft: LayersDescriptionStoreType) => {
                draft.layoutFeaturesAndLegends.push({
                  id: generateIdLegend(),
                  layerId: props.id,
                  type: LegendType.categoricalChoroplethBarchart,
                  position: [legendPosition[0], legendPosition[1]],
                  width: 300,
                  height: 250,
                  orientation: 'horizontal',
                  order: 'none',
                  fontColor: '#000000',
                  visible: true,
                  title: {
                    text: (
                      props.rendererParameters as CategoricalChoroplethParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  note: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.note,
                  },
                  backgroundRect: {
                    visible: false,
                  },
                } as CategoricalChoroplethBarchartLegend);
              },
            ),
          );
        }}
      />
    </Show>
    <AestheticsSection {...props} />
  </>;
}

function makeSettingsDefaultPolygon(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const availableSequentialPalettes = getPalettes({ type: 'sequential', number: 8 })
    .map((d) => ({
      name: `${d.name} (${d.provider})`,
      value: d.name,
    }));

  return <>
    {/*
      The way the entities are colored depends on the renderer...
        - For 'default' renderer (i.e. no classification) or 'sphere',
          we can choose the color manually
        - For 'choropleth' renderer, we propose to reopen the classification modal
        - For 'proportional' renderer, ... (TODO)
    */}
    <Show when={props.renderer === 'default' || props.renderer === 'sphere' || props.renderer === 'cartogram'}>
      <InputFieldColor
        label={ LL().LayerSettings.FillColor() }
        value={props.fillColor!}
        onChange={(v) => debouncedUpdateProp(props.id, 'fillColor', v)}
      />
    </Show>
    <Show when={props.renderer === 'choropleth'}>
      <div class="field" style={{ 'text-align': 'center' }}>
        <button
          class="button"
          style={{ margin: 'auto' }}
          onClick={() => {
            // Save current state of classification parameters
            const params = unproxify(props.rendererParameters as never);
            setClassificationPanelStore({
              show: true,
              type: 'color',
              layerName: props.name,
              series: props.data.features
                .map((f) => f.properties[(
                  props.rendererParameters as ClassificationParameters).variable]),
              classificationParameters: params,
              onCancel: () => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: params },
                );
              },
              onConfirm: (newParams) => {
                setLayersDescriptionStoreBase(
                  'layers',
                  (l: LayerDescription) => l.id === props.id,
                  { rendererParameters: newParams },
                );
              },
            });
          }}
        >{LL().LayerSettings.ChangeClassification()}</button>
      </div>
      <InputFieldCheckbox
        label={LL().LayerSettings.AddHistogramChoropleth()}
        checked={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        disabled={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStore(
            produce(
              (draft: LayersDescriptionStoreType) => {
                draft.layoutFeaturesAndLegends.push({
                  id: generateIdLegend(),
                  layerId: props.id,
                  type: LegendType.choroplethHistogram,
                  position: [legendPosition[0], legendPosition[1]],
                  width: 300,
                  height: 250,
                  fontColor: '#000000',
                  visible: true,
                  title: {
                    text: (props.rendererParameters as ClassificationParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  note: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.note,
                  },
                  backgroundRect: {
                    visible: false,
                  },
                } as ChoroplethHistogramLegend);
              },
            ),
          );
        }}
      />
    </Show>
    <Show when={props.renderer === 'smoothed' || props.renderer === 'grid'}>
      <InputFieldSelect
        label={LL().LayerSettings.Palette()}
        onChange={(palName) => {
          const n = (props.rendererParameters as SmoothedLayerParameters).breaks.length - 1;
          const palette = getPaletteWrapper(
            palName,
            n,
            (props.rendererParameters as SmoothedLayerParameters).palette.reversed,
          );
          debouncedUpdateProp(props.id, ['rendererParameters', 'palette'], palette);
        }}
        value={(props.rendererParameters as SmoothedLayerParameters).palette.name}
        width={300}
      >
        <For each={availableSequentialPalettes}>
          {
            (d) => <option value={d.value}>{d.name}</option>
          }
        </For>
      </InputFieldSelect>
      <InputFieldCheckbox
        label={ LL().ClassificationPanel.reversePalette() }
        checked={
          (
            props.rendererParameters as SmoothedLayerParameters | GriddedLayerParameters
          ).palette.reversed
        }
        onChange={(value) => {
          const p = unproxify(
            (props.rendererParameters as SmoothedLayerParameters | GriddedLayerParameters).palette,
          ) as CustomPalette;
          p.colors = p.colors.toReversed();
          p.reversed = value;
          updateProp(props.id, ['rendererParameters', 'palette'], p);
        }}
      />
    </Show>
    <InputFieldColor
      label={ LL().LayerSettings.StrokeColor() }
      value={ props.strokeColor! }
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.FillOpacity() }
      value={ props.fillOpacity! }
      onChange={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.StrokeOpacity() }
      value={ props.strokeOpacity! }
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.StrokeWidth() }
      value={props.strokeWidth!}
      onChange={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
      min={0}
      max={10}
      step={0.1}
    />
    <Show when={props.renderer === 'categoricalChoropleth'}>
      <DetailsSummary
        summaryContent={LL().FunctionalitiesSection.CategoricalChoroplethOptions.Customize()}
      >
        <CategoriesCustomisation
          mapping={() => (props.rendererParameters as CategoricalChoroplethParameters).mapping}
          setMapping={(m) => {
            updateProp(props.id, ['rendererParameters', 'mapping'], m as never);
          }}
          detailed={true}
        />
      </DetailsSummary>
      <InputFieldCheckbox
        label={LL().LayerSettings.AddBarChartCategoricalChoropleth()}
        checked={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        disabled={
          layerLinkedToHistogramOrBarChart(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStore(
            produce(
              (draft: LayersDescriptionStoreType) => {
                draft.layoutFeaturesAndLegends.push({
                  id: generateIdLegend(),
                  layerId: props.id,
                  type: LegendType.categoricalChoroplethBarchart,
                  position: [legendPosition[0], legendPosition[1]],
                  width: 300,
                  height: 250,
                  orientation: 'horizontal',
                  order: 'none',
                  fontColor: '#000000',
                  visible: true,
                  title: {
                    text: (
                      props.rendererParameters as CategoricalChoroplethParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  note: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.note,
                  },
                  backgroundRect: {
                    visible: false,
                  },
                } as CategoricalChoroplethBarchartLegend);
              },
            ),
          );
        }}
      />
    </Show>
    <AestheticsSection {...props} />
  </>;
}

export default function LayerSettings(
  props: {
    id: string,
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const { id, LL } = props; // eslint-disable-line solid/reactivity
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === id) as LayerDescription;

  let innerElement;
  if (layerDescription.renderer === 'labels') {
    innerElement = makeSettingsLabels(layerDescription as LayerDescriptionLabels, LL);
  } else if (layerDescription.renderer === 'categoricalPictogram') {
    innerElement = makeSettingsPictograms(
      layerDescription as LayerDescriptionCategoricalPictogram,
      LL,
    );
  } else {
    innerElement = {
      point: makeSettingsDefaultPoint,
      linestring: makeSettingsDefaultLine,
      polygon: makeSettingsDefaultPolygon,
    }[layerDescription.type as ('point' | 'linestring' | 'polygon')](layerDescription, LL);
  }

  return <div class="layer-settings">
    <div class="layer-settings__title">
      <InputFieldText
        label={ LL().LayerSettings.Name() }
        value={ layerDescription.name }
        onChange={(v) => updateProp(layerDescription.id, 'name', v)}
        width={460}
      />
    </div>
    <br />
    <div class="layer-settings__content">
      { innerElement }
    </div>
  </div>;
}
