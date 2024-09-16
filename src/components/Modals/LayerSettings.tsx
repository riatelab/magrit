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
import { unproxify } from '../../helpers/common';
import d3 from '../../helpers/d3-custom';
import { webSafeFonts, fonts } from '../../helpers/font';
import { makeDorlingDemersSimulation } from '../../helpers/geo';
import { generateIdLegend } from '../../helpers/legends';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';
import { semiCirclePath } from '../../helpers/svg';

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
  updateProp,
  debouncedUpdateProp,
} from '../../store/LayersDescriptionStore';
import { setClassificationPanelStore } from '../../store/ClassificationPanelStore';
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { globalStore } from '../../store/GlobalStore';

// Types / Interfaces
import {
  type CategoricalChoroplethParameters,
  type ClassificationParameters,
  type LabelsParameters,
  type LayerDescription,
  type LayerDescriptionLabels,
  type LinksParameters,
  type MushroomsParameters,
  type ProportionalSymbolsParameters,
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
  type CategoricalPictogramParameters, type ID3Element,
} from '../../global.d';

// Styles
import '../../styles/LayerAndLegendSettings.css';
import MessageBlock from '../MessageBlock.tsx';
import {
  InputFieldColorOpacity,
  InputFieldPaletteOpacity,
  InputFieldWidthColorOpacity,
  InputFieldWidthPaletteOpacity,
} from '../Inputs/InputFieldColorOpacity.tsx';

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
    <AestheticsSection {...props} />
  </>;
}

function makeSettingsLabels(
  props: LayerDescriptionLabels,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const rendererParameters = props.rendererParameters as LabelsParameters;
  const isProportional = !!props.rendererParameters.proportional;

  return <>
    <InputFieldSelect
      disabled={true}
      label={LL().LayerSettings.PortrayedVariable()}
      onChange={(v) => {}}
      value={props.rendererParameters.variable}
    >
      <option value={props.rendererParameters.variable}>{props.rendererParameters.variable}</option>
    </InputFieldSelect>
    <MessageBlock type={'warning'}>
      <p>{LL().LayerSettings.InformationLabelSettings()}</p>
    </MessageBlock>
    <Show when={!isProportional}>
      <InputFieldNumber
        label={ LL().LayerSettings.FontSize() }
        value={rendererParameters.default.fontSize}
        onChange={(v) => {
          updateProp(props.id, ['rendererParameters', 'default', 'fontSize'], v);
          // Update the fontSize properties for each "specific" parameters
          setLayersDescriptionStoreBase(
            produce((draft: LayersDescriptionStoreType) => {
              const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
              Object.keys((layer.rendererParameters as LabelsParameters).specific).forEach((k) => {
                // eslint-disable-next-line no-param-reassign
                layer.rendererParameters.specific[+k].fontSize = v;
              });
            }),
          );
        }}
        min={1}
        max={100}
        step={1}
        strictMin={true}
      />
    </Show>
    <Show when={isProportional}>
      <InputFieldSelect
        disabled={true}
        label={LL().LayerSettings.VariableForProportionality()}
        onChange={(v) => {}}
        value={props.rendererParameters.proportional!.variable}
      >
        <option value={props.rendererParameters.proportional!.variable}>
          {props.rendererParameters.proportional!.variable}
        </option>
      </InputFieldSelect>
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue()}
        value={props.rendererParameters.proportional!.referenceValue}
        onChange={(v) => {
          debouncedUpdateProp(
            props.id,
            ['rendererParameters', 'proportional', 'referenceValue'],
            v,
          );
        }}
        min={0}
        max={Infinity}
        step={1}
      />
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ReferenceSize()}
        value={props.rendererParameters.proportional!.referenceSize}
        onChange={(v) => {
          debouncedUpdateProp(
            props.id,
            ['rendererParameters', 'proportional', 'referenceSize'],
            v,
          );
        }}
        min={1}
        max={200}
        step={1}
        strictMin={true}
      />
    </Show>
    <InputFieldSelect
      label={LL().LayerSettings.FontFamily()}
      onChange={(v) => {
        updateProp(props.id, ['rendererParameters', 'default', 'fontFamily'], v);
        // Update the fontFamily properties for each "specific" parameters
        setLayersDescriptionStoreBase(
          produce((draft: LayersDescriptionStoreType) => {
            const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
            Object.keys((layer.rendererParameters as LabelsParameters).specific).forEach((k) => {
              // eslint-disable-next-line no-param-reassign
              layer.rendererParameters.specific[+k].fontFamily = v;
            });
          }),
        );
      }}
      value={rendererParameters.default.fontFamily}
    >
      <option disabled>{LL().Fonts.FontFamilyTypes()}</option>
      <For each={webSafeFonts}>
        {(font) => <option value={font}>{font}</option>}
      </For>
      <option disabled>{LL().Fonts.Fonts()}</option>
      <For each={fonts}>
        {(font) => <option value={font}>{font}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldColor
      label={LL().LayerSettings.TextColor()}
      value={rendererParameters.default.fontColor}
      onChange={(v) => {
        updateProp(props.id, ['rendererParameters', 'default', 'fontColor'], v);
        // Update the fontColor properties for each "specific" parameters
        setLayersDescriptionStoreBase(
          produce((draft: LayersDescriptionStoreType) => {
            const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
            Object.keys((layer.rendererParameters as LabelsParameters).specific).forEach((k) => {
              // eslint-disable-next-line no-param-reassign
              layer.rendererParameters.specific[+k].fontColor = v;
            });
          }),
        );
      }}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.XOffset() }
      value={rendererParameters.default.textOffset[0]}
      onChange={
        (v) => {
          const value = [v, rendererParameters.default.textOffset[1]];
          updateProp(props.id, ['rendererParameters', 'default', 'textOffset'], value);
          // Update the textOffset properties for each "specific" parameters
          setLayersDescriptionStoreBase(
            produce((draft: LayersDescriptionStoreType) => {
              const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
              Object.keys((layer.rendererParameters as LabelsParameters).specific).forEach((k) => {
                // eslint-disable-next-line no-param-reassign
                layer.rendererParameters.specific[+k].textOffset = value;
              });
            }),
          );
        }
      }
      min={-100}
      max={100}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.YOffset() }
      value={rendererParameters.default.textOffset[1]}
      onChange={
        (v) => {
          const value = [rendererParameters.default.textOffset[0], v];
          updateProp(props.id, ['rendererParameters', 'default', 'textOffset'], value);
          // Update the textOffset properties for each "specific" parameters
          setLayersDescriptionStoreBase(
            produce((draft: LayersDescriptionStoreType) => {
              const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
              Object.keys((layer.rendererParameters as LabelsParameters).specific).forEach((k) => {
                // eslint-disable-next-line no-param-reassign
                layer.rendererParameters.specific[+k].textOffset = value;
              });
            }),
          );
        }
      }
      min={-100}
      max={100}
      step={1}
    />
    <InputFieldSelect
      label={ LL().LayerSettings.FontStyle() }
      onChange={(v) => {
        updateProp(props.id, ['rendererParameters', 'default', 'fontStyle'], v);
        // Update the fontStyle properties for each "specific" parameters
        setLayersDescriptionStoreBase(
          produce((draft: LayersDescriptionStoreType) => {
            const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
            Object.keys((layer.rendererParameters as LabelsParameters).specific).forEach((k) => {
              // eslint-disable-next-line no-param-reassign
              layer.rendererParameters.specific[+k].fontStyle = v;
            });
          }),
        );
      }}
      value={rendererParameters.default.fontStyle}
    >
      <option value="normal">Normal</option>
      <option value="italic">Italic</option>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().LayerSettings.FontWeight() }
      onChange={(v) => {
        updateProp(props.id, ['rendererParameters', 'default', 'fontWeight'], v);
        // Update the fontWeight properties for each "specific" parameters
        setLayersDescriptionStoreBase(
          produce((draft: LayersDescriptionStoreType) => {
            const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
            Object.keys((layer.rendererParameters as LabelsParameters).specific).forEach((k) => {
              // eslint-disable-next-line no-param-reassign
              layer.rendererParameters.specific[+k].fontWeight = v;
            });
          }),
        );
      }}
      value={rendererParameters.default.fontWeight}
    >
      <option value="normal">Normal</option>
      <option value="bold">Bold</option>
    </InputFieldSelect>
    <InputFieldCheckbox
      label={ LL().LayerSettings.BufferAroundText() }
      checked={rendererParameters.default.halo !== undefined}
      onChange={(v) => {
        const value = v ? { color: '#ffffff', width: 2 } : undefined;
        updateProp(props.id, ['rendererParameters', 'default', 'halo'], value);
        // Update the halo properties for each "specific" parameters
        setLayersDescriptionStoreBase(
          produce((draft: LayersDescriptionStoreType) => {
            const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
            Object.keys((layer.rendererParameters as LabelsParameters).specific).forEach((k) => {
              // eslint-disable-next-line no-param-reassign
              layer.rendererParameters.specific[+k].halo = value;
            });
          }),
        );
      }}
    />
    <Show when={rendererParameters.default.halo !== undefined}>
      <InputFieldColor
        label={ LL().LayerSettings.BufferColor() }
        value={rendererParameters.default.halo!.color}
        onChange={(v) => {
          const haloProps = {
            color: v,
            width: rendererParameters.default.halo!.width,
          };
          updateProp(props.id, ['rendererParameters', 'default', 'halo'], haloProps);
          // Update the halo properties for each "specific" parameters
          setLayersDescriptionStoreBase(
            produce((draft: LayersDescriptionStoreType) => {
              const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
              Object.keys((layer.rendererParameters as LabelsParameters).specific).forEach((k) => {
                // eslint-disable-next-line no-param-reassign
                layer.rendererParameters.specific[+k].halo = haloProps;
              });
            }),
          );
        }}
      />
      <InputFieldNumber
        label={ LL().LayerSettings.BufferWidth() }
        value={rendererParameters.default.halo!.width}
        onChange={
          (v) => {
            const haloProps = {
              color: rendererParameters.default.halo!.color,
              width: v,
            };
            updateProp(props.id, ['rendererParameters', 'default', 'halo'], haloProps);
            // Update the halo properties for each "specific" parameters
            setLayersDescriptionStoreBase(
              produce((draft: LayersDescriptionStoreType) => {
                const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
                Object.keys((layer.rendererParameters as LabelsParameters).specific)
                  .forEach((k) => {
                    // eslint-disable-next-line no-param-reassign
                    layer.rendererParameters.specific[+k].halo = haloProps;
                  });
              }),
            );
          }
        }
        min={0}
        max={10}
        step={1}
        strictMin={true}
      />
    </Show>
    <InputFieldCheckbox
      label={ LL().LayerSettings.AllowMovingLabels() }
      checked={rendererParameters.movable}
      onChange={(v) => {
        debouncedUpdateProp(props.id, ['rendererParameters', 'movable'], v);
      }}
    />
    <div class="is-flex is-justify-content-space-around">
      <InputFieldButton
        label={LL().LayerSettings.ResetLabelLocations()}
        onClick={() => {
          // Restore position of the labels
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
        }}
      />
      <InputFieldButton
        label={LL().LayerSettings.ResetLabelContents()}
        onClick={() => {
          // Restore content of the labels
          setLayersDescriptionStoreBase(
            produce((draft: LayersDescriptionStoreType) => {
              const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
              Object.keys((layer.rendererParameters as LabelsParameters).specific)
                .forEach((k) => {
                  // eslint-disable-next-line no-param-reassign
                  layer.rendererParameters.specific[+k].text = layer.data.features[+k]
                    .properties[layer.rendererParameters.variable];
                });
            }),
          );
        }}
      />
    </div>
    <AestheticsSection {...props} />
  </>;
}

function makeSettingsDefaultPoint(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const redrawMushrooms = () => {
    const g = document.getElementById(props.id)!;
    const pos = ['top', 'bottom'];
    // Redraw the symbols (circles)
    g.querySelectorAll('g').forEach((gg) => {
      const projectedCoords = globalStore.pathGenerator.centroid(
        // eslint-disable-next-line no-underscore-dangle
        (gg as SVGGElement & ID3Element).__data__.geometry,
      );
      if (!Number.isNaN(projectedCoords[0])) {
        gg.querySelectorAll('path').forEach((p, i) => {
          const sizeValue = p.getAttribute('mgt:size-value')!;
          p.setAttribute(
            'd',
            semiCirclePath(
              +sizeValue,
              projectedCoords[0],
              projectedCoords[1],
              pos[i] as 'top' | 'bottom',
            ),
          );
        });
        gg.setAttribute('visibility', 'visible');
      } else {
        gg.setAttribute('visibility', 'hidden');
      }
    });
  };

  return <>
    {/*
      The way the entities are colored depends on the renderer...
        - For 'default' renderer (i.e. no classification), we can choose the color manually
        - For 'choropleth' renderer, we propose to reopen the classification modal
        - For 'proportional' renderer, ... (TODO)
    */}
    <Show when={props.representationType !== 'proportionalSymbols' && props.representationType !== 'mushrooms'}>
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
      <InputFieldNumber
        label={LL().LayerSettings.SymbolSize()}
        value={props.symbolSize!}
        onChange={(v) => debouncedUpdateProp(props.id, 'symbolSize', v)}
        min={1}
        max={20}
        step={1}
      />
    </Show>
    <Show when={props.representationType === 'default'}>
      <InputFieldColorOpacity
        label={LL().LayerSettings.Fill()}
        valueColor={props.fillColor!}
        valueOpacity={props.fillOpacity!}
        onChangeColor={(v) => debouncedUpdateProp(props.id, 'fillColor', v)}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      />
    </Show>
    <Show when={props.representationType === 'choropleth'}>
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
      <InputFieldPaletteOpacity
        label={LL().LayerSettings.Fill()}
        valuePalette={(props.rendererParameters as ClassificationParameters).palette.colors}
        valueOpacity={props.fillOpacity!}
        onClickPalette={() => {}}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      />
    </Show>
    <Show when={props.representationType === 'proportionalSymbols'}>
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
        max={Infinity}
        step={0.1}
      />
    </Show>
    <Show when={
      props.representationType === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'singleColor'
    }>
      <InputFieldColorOpacity
        label={LL().LayerSettings.Fill()}
        valueColor={(props.rendererParameters as ProportionalSymbolsParameters).color as string}
        valueOpacity={props.fillOpacity!}
        onChangeColor={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'color'], v)}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      />
    </Show>
    <Show when={
      props.representationType === 'proportionalSymbols'
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
      <InputFieldPaletteOpacity
        label={LL().LayerSettings.Fill()}
        valuePalette={(props.rendererParameters!.color as ClassificationParameters).palette.colors}
        valueOpacity={props.fillOpacity!}
        onClickPalette={() => {}}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      />
    </Show>
    <Show when={
      props.representationType === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'categoricalVariable'
    }>
      <InputFieldPaletteOpacity
        label={LL().LayerSettings.Fill()}
        valuePalette={
          (props.rendererParameters.color as CategoricalChoroplethParameters)
            .mapping
            .map((c) => c.color)
        }
        valueOpacity={props.fillOpacity!}
        onClickPalette={() => {}}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      />
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
      {/* <InputFieldPaletteOpacity
        label={LL().LayerSettings.Fill()}
        valuePalette={{ type: 'categorical' }}
        valueOpacity={props.fillOpacity!}
        onClickPalette={() => {}}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      /> */}
    </Show>
    <Show when={props.representationType === 'categoricalChoropleth'}>
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
      <InputFieldPaletteOpacity
        label={LL().LayerSettings.Fill()}
        valuePalette={
          (props.rendererParameters as CategoricalChoroplethParameters)
            .mapping
            .map((c) => c.color)
        }
        valueOpacity={props.fillOpacity!}
        onClickPalette={() => {}}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      />
    </Show>
    <InputFieldWidthColorOpacity
      label={LL().LayerSettings.Stroke()}
      valueWidth={props.strokeWidth!}
      valueColor={props.strokeColor!}
      valueOpacity={props.strokeOpacity!}
      onChangeWidth={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
      onChangeColor={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
      onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
    />
    <Show when={props.representationType === 'mushrooms'}>
      <div class="mt-4 mb-5 has-text-weight-bold">
        {LL().FunctionalitiesSection.MushroomsOptions.TopProperties()}
      </div>
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ReferenceSize()}
        value={(props.rendererParameters as MushroomsParameters).top.referenceSize}
        onChange={(v) => {
          debouncedUpdateProp(props.id, ['rendererParameters', 'top', 'referenceSize'], v);
          redrawMushrooms();
        }}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue()}
        value={(props.rendererParameters as MushroomsParameters).top.referenceValue}
        onChange={(v) => {
          debouncedUpdateProp(props.id, ['rendererParameters', 'top', 'referenceValue'], v);
          redrawMushrooms();
        }}
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
        onChange={(v) => {
          debouncedUpdateProp(props.id, ['rendererParameters', 'bottom', 'referenceSize'], v);
          redrawMushrooms();
        }}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue()}
        value={(props.rendererParameters as MushroomsParameters).bottom.referenceValue}
        onChange={(v) => {
          debouncedUpdateProp(props.id, ['rendererParameters', 'bottom', 'referenceValue'], v);
          redrawMushrooms();
        }}
        min={1}
        max={Infinity}
        step={0.1}
      />
      <InputFieldColor
        label={LL().LayerSettings.FillColor()}
        value={(props.rendererParameters as MushroomsParameters).bottom.color as string}
        onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'bottom', 'color'], v)}
      />
    </Show>
    <Show when={props.representationType === 'proportionalSymbols'}>
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
          strictMinMax={true}
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
    {/*
      We want to propose to add histogram to the map for choro-like layer,
      but we want this option to be at
      the bottom of the panel, just above the aesthetics section
    */}
    <Show when={props.representationType === 'choropleth'}>
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
                  visible: true,
                  roundDecimals: 2,
                  title: {
                    text: (props.rendererParameters as ClassificationParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  axis: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.labels,
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
      props.representationType === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'ratioVariable'
    }>
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
                  visible: true,
                  roundDecimals: 2,
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
                  axis: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.labels,
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
      props.representationType === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'categoricalVariable'
    }>
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
                  roundDecimals: null,
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
                  axis: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.labels,
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
    <Show when={props.representationType === 'categoricalChoropleth'}>
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
                  roundDecimals: null,
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
                  axis: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.labels,
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
    {/* Options for default renderer / graticule renderer */}
    <Show when={props.representationType === 'default' || props.representationType === 'graticule'}>
      <InputFieldWidthColorOpacity
        label={LL().LayerSettings.Line()}
        valueWidth={props.strokeWidth!}
        valueColor={props.strokeColor!}
        valueOpacity={props.strokeOpacity!}
        onChangeWidth={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
        onChangeColor={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
      />
      <InputFieldCheckbox
        label={ LL().LayerSettings.StrokeDashed() }
        checked={!!props.strokeDasharray}
        onChange={(checked) => {
          const v = checked ? '5 5' : undefined;
          debouncedUpdateProp(props.id, 'strokeDasharray', v);
        }}
      />
      <Show when={props.representationType === 'graticule'}>
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
          strictMinMax={true}
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
          strictMinMax={true}
        />
      </Show>
    </Show>

    {/* Options for discontinuity renderer */}
    <Show when={props.representationType === 'discontinuity'}>
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
      <InputFieldColorOpacity
        label={LL().LayerSettings.Line()}
        valueColor={props.strokeColor!}
        valueOpacity={props.strokeOpacity!}
        onChangeColor={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
      />
    </Show>

    {/* Options for links renderer */}
    <Show when={props.representationType === 'links'}>
      <Show when={(props.rendererParameters as LinksParameters).sizeType === 'fixed'}>
        <InputFieldWidthColorOpacity
          label={LL().LayerSettings.Line()}
          valueWidth={props.strokeWidth!}
          valueColor={props.strokeColor!}
          valueOpacity={props.strokeOpacity!}
          onChangeWidth={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
          onChangeColor={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
          onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
        />
      </Show>
      <Show when={(props.rendererParameters as LinksParameters).sizeType !== 'fixed'}>
        <InputFieldColorOpacity
          label={LL().LayerSettings.Line()}
          valueColor={props.strokeColor!}
          valueOpacity={props.strokeOpacity!}
          onChangeColor={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
          onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
        />
        <Show when={(props.rendererParameters as LinksParameters).sizeType === 'proportional'}>
          <InputFieldNumber
            label={ LL().FunctionalitiesSection.LinksOptions.LinkSizeProportionalReferenceSize() }
            value={ (props.rendererParameters as LinksParameters).proportional!.referenceRadius }
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
            max={Infinity}
            step={0.5}
          />
        </Show>
        <Show when={(props.rendererParameters as LinksParameters).classification}>
          <></>
        </Show>
      </Show>
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
      <InputFieldCheckbox
        label={ LL().LayerSettings.StrokeDashed() }
        checked={!!props.strokeDasharray}
        onChange={(checked) => {
          const v = checked ? '5 5' : undefined;
          debouncedUpdateProp(props.id, 'strokeDasharray', v);
        }}
      />
    </Show>

    {/* Options for proportional symbol renderer */}
    <Show when={props.representationType === 'proportionalSymbols'}>
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
        max={Infinity}
        step={0.1}
      />
      <Show when={(props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'singleColor'}>
        <InputFieldColorOpacity
          label={LL().LayerSettings.Line()}
          valueColor={(props.rendererParameters as ProportionalSymbolSingleColorParameters).color!}
          valueOpacity={props.strokeOpacity!}
          onChangeColor={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'color'], v)}
          onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
        />
      </Show>
      <Show when={(props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'ratioVariable'}>
        <div class="field" style={{ 'text-align': 'center' }}>
          <button
            class="button"
            style={{ margin: 'auto' }}
            onClick={() => {
              // Save current state of classification parameters
              const params = unproxify(
                props.rendererParameters.color as never,
              ) as ClassificationParameters;
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
                    'rendererParameters',
                    'color',
                    params,
                  );
                },
                onConfirm: (newParams) => {
                  setLayersDescriptionStoreBase(
                    'layers',
                    (l: LayerDescription) => l.id === props.id,
                    'rendererParameters',
                    'color',
                    newParams,
                  );
                },
              });
            }}
          >{LL().LayerSettings.ChangeClassification()}</button>
        </div>
        <InputFieldWidthPaletteOpacity
          label={LL().LayerSettings.Line()}
          valueWidth={props.strokeWidth!}
          valuePalette={(props.rendererParameters as ClassificationParameters).palette.colors}
          valueOpacity={props.strokeOpacity!}
          onChangeWidth={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
          onClickPalette={() => {}}
          onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
        />
      </Show>
      <Show when={(props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'categoricalVariable'}>
        <InputFieldWidthPaletteOpacity
          label={LL().LayerSettings.Line()}
          valueWidth={props.strokeWidth!}
          valuePalette={
            (props.rendererParameters.color as CategoricalChoroplethParameters)
              .mapping
              .map((c) => c.color)
          }
          valueOpacity={props.strokeOpacity!}
          onChangeWidth={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
          onClickPalette={() => {}}
          onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
        />
        <DetailsSummary
          summaryContent={LL().FunctionalitiesSection.CategoricalChoroplethOptions.Customize()}
        >
          <CategoriesCustomisation
            mapping={() => (
              props.rendererParameters.color! as CategoricalChoroplethParameters).mapping}
            setMapping={(m) => {
              updateProp(props.id, ['rendererParameters', 'color', 'mapping'], m as never);
            }}
            detailed={false}
          />
        </DetailsSummary>
      </Show>
    </Show>

    {/* Options for choropleth renderer */}
    <Show when={props.representationType === 'choropleth'}>
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
      <InputFieldWidthPaletteOpacity
        label={LL().LayerSettings.Line()}
        valueWidth={props.strokeWidth!}
        valuePalette={(props.rendererParameters as ClassificationParameters).palette.colors}
        valueOpacity={props.strokeOpacity!}
        onChangeWidth={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
        onClickPalette={() => {}}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
      />
    </Show>

    {/* Options for categorical choropleth renderer */}
    <Show when={props.representationType === 'categoricalChoropleth'}>
      <InputFieldWidthPaletteOpacity
        label={LL().LayerSettings.Line()}
        valueWidth={props.strokeWidth!}
        valuePalette={
          (props.rendererParameters as CategoricalChoroplethParameters)
            .mapping
            .map((c) => c.color)
        }
        valueOpacity={props.strokeOpacity!}
        onChangeWidth={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
        onClickPalette={() => {}}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
      />
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
    </Show>
    {/*
      We want to propose to add histogram to the map for choro-like layer,
      but we want this option to be at
      the bottom of the panel, just above the aesthetics section
    */}
    <Show when={props.representationType === 'categoricalChoropleth'}>
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
                  roundDecimals: null,
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
                  axis: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.labels,
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
    <Show when={props.representationType === 'choropleth'}>
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
                  visible: true,
                  roundDecimals: 2,
                  title: {
                    text: (props.rendererParameters as ClassificationParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  axis: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.labels,
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
      props.representationType === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'categoricalVariable'
    }>
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
                  visible: true,
                  roundDecimals: null,
                  title: {
                    text: (
                      props.rendererParameters as CategoricalChoroplethParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  axis: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.labels,
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
    <Show when={
      props.representationType === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'ratioVariable'
    }>
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
                  visible: true,
                  roundDecimals: 2,
                  title: {
                    text: (props.rendererParameters as ClassificationParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  axis: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.labels,
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
    <Show when={props.representationType === 'default' || props.representationType === 'sphere' || props.representationType === 'cartogram'}>
      <InputFieldColorOpacity
        label={LL().LayerSettings.Fill()}
        valueColor={props.fillColor!}
        valueOpacity={props.fillOpacity!}
        onChangeColor={(v) => debouncedUpdateProp(props.id, 'fillColor', v)}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      />
    </Show>
    <Show when={props.representationType === 'choropleth' || props.representationType === 'grid'}>
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
      <InputFieldPaletteOpacity
        label={LL().LayerSettings.Fill()}
        valuePalette={(props.rendererParameters as ClassificationParameters).palette.colors}
        valueOpacity={props.fillOpacity!}
        onClickPalette={() => {}}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      />
    </Show>
    <Show when={props.representationType === 'smoothed'}>
      <InputFieldSelect
        label={LL().LayerSettings.Palette()}
        onChange={(palName) => {
          const n = (props.rendererParameters as ClassificationParameters).breaks.length - 1;
          const palette = getPaletteWrapper(
            palName,
            n,
            (props.rendererParameters as ClassificationParameters).palette.reversed,
          );
          debouncedUpdateProp(props.id, ['rendererParameters', 'palette'], palette);
        }}
        value={(props.rendererParameters as ClassificationParameters).palette.name}
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
            props.rendererParameters as ClassificationParameters
          ).palette.reversed
        }
        onChange={(value) => {
          const p = unproxify(
            (props.rendererParameters as ClassificationParameters).palette,
          ) as CustomPalette;
          p.colors = p.colors.toReversed();
          p.reversed = value;
          updateProp(props.id, ['rendererParameters', 'palette'], p);
        }}
      />
      <InputFieldPaletteOpacity
        label={LL().LayerSettings.Fill()}
        valuePalette={(props.rendererParameters as ClassificationParameters).palette.colors}
        valueOpacity={props.fillOpacity!}
        onClickPalette={() => {}}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      />
    </Show>
    <Show when={props.representationType === 'categoricalChoropleth'}>
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
      <InputFieldPaletteOpacity
        label={LL().LayerSettings.Fill()}
        valuePalette={
          (props.rendererParameters as CategoricalChoroplethParameters)
            .mapping
            .map((c) => c.color)
        }
        valueOpacity={props.fillOpacity!}
        onClickPalette={() => {}}
        onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'fillOpacity', v)}
      />
    </Show>
    <InputFieldWidthColorOpacity
      label={LL().LayerSettings.Stroke()}
      valueWidth={props.strokeWidth!}
      valueColor={props.strokeColor!}
      valueOpacity={props.strokeOpacity!}
      onChangeWidth={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
      onChangeColor={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
      onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
    />
    {/*
      We want to propose to add histogram to the map for choro-like layer,
      but we want this option to be at
      the bottom of the panel, just above the aesthetics section
    */}
    <Show when={props.representationType === 'choropleth' || props.representationType === 'grid'}>
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
                  visible: true,
                  roundDecimals: 2,
                  title: {
                    text: (props.rendererParameters as ClassificationParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  axis: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.labels,
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
    <Show when={props.representationType === 'categoricalChoropleth'}>
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
                  visible: true,
                  roundDecimals: null,
                  title: {
                    text: (
                      props.rendererParameters as CategoricalChoroplethParameters).variable,
                    ...applicationSettingsStore.defaultLegendSettings.title,
                  } as LegendTextElement,
                  subtitle: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.subtitle,
                  },
                  axis: {
                    text: undefined,
                    ...applicationSettingsStore.defaultLegendSettings.labels,
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
  if (layerDescription.representationType === 'labels') {
    innerElement = makeSettingsLabels(layerDescription as LayerDescriptionLabels, LL);
  } else if (layerDescription.representationType === 'categoricalPictogram') {
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
