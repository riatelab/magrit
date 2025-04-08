// Imports from solid-js
import {
  Accessor,
  For,
  JSX,
  Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// GeoJSON types
import type { Feature, MultiLineString } from 'geojson';

// Imports from other libs
import { getPalettes } from 'dicopal';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { getPaletteWrapper } from '../../helpers/color';
import { unproxify } from '../../helpers/common';
import d3 from '../../helpers/d3-custom';
import { makeDorlingDemersSimulation } from '../../helpers/geo';
import { generateIdLegend } from '../../helpers/legends';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';
import { toPrecisionAfterDecimalPoint } from '../../helpers/math';
import { LinearRegressionResult } from '../../helpers/statistics';

// Sub-components
import DetailsSummary from '../DetailsSummary.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import { webSafeFonts, fonts } from '../../helpers/font';
import InputFieldText from '../Inputs/InputText.tsx';
import InputFieldButton from '../Inputs/InputButton.tsx';
import { CategoriesCustomisation } from '../PortrayalOption/CategoricalChoroplethComponents.tsx';
import {
  CategoriesCustomisation as CategoriesCustomisationPicto,
} from '../PortrayalOption/CategoricalPictogramComponents.tsx';
import { LinksSelectionOnExistingLayer } from '../PortrayalOption/LinksComponents.tsx';
import MessageBlock from '../MessageBlock.tsx';
import {
  InputFieldColorOpacity,
  InputFieldPaletteOpacity,
  InputFieldWidthColorOpacity,
  InputFieldWidthPaletteOpacity,
} from '../Inputs/InputFieldColorOpacity.tsx';
import VariableCustomisation from '../PortrayalOption/WaffleComponents.tsx';

// Stores
import {
  layersDescriptionStore,
  type LayersDescriptionStoreType,
  // In this component we use the base version of the store to avoid pushing
  // the changes to the undo/redo stack (because there is a
  // cancel button in the LayerSettings modal)
  setLayersDescriptionStoreBase,
  updateProp,
  debouncedUpdateProp,
} from '../../store/LayersDescriptionStore';
import { setClassificationPanelStore } from '../../store/ClassificationPanelStore';
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Types / Interfaces
import {
  type CategoricalChoroplethParameters,
  type ClassificationParameters,
  type LabelsParameters,
  type LayerDescription,
  type LayerDescriptionLabels,
  type LayerDescriptionWaffle,
  type LinksParameters,
  type MushroomsParameters,
  type ProportionalSymbolsParameters,
  LinkCurvature,
  LinkHeadType,
  ProportionalSymbolsSymbolType,
  type ProportionalSymbolsParametersBase,
  type GraticuleParameters,
  type LayoutFeature,
  type Legend,
  LegendType,
  type LegendTextElement,
  type CategoricalChoroplethBarchartLegend,
  type ProportionalSymbolCategoryParameters,
  type ChoroplethHistogramLegend,
  type ProportionalSymbolsRatioParameters,
  CustomPalette,
  type ProportionalSymbolSingleColorParameters,
  type LayerDescriptionCategoricalPictogram,
  type CategoricalPictogramParameters,
  ClassificationMethod,
  type WaffleLegend,
  type LinearRegressionScatterPlot,
  type ProportionalSymbolsPositiveNegativeParameters,
} from '../../global.d';

// Styles
import '../../styles/LayerAndLegendSettings.css';

const layerLinkedToHistogramOrBarChart = (
  layer: LayerDescription,
  layoutFeaturesAndLegends: (LayoutFeature | Legend)[],
): boolean => {
  const elem = layoutFeaturesAndLegends
    .find((l) => (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart') && (l as Legend).layerId === layer.id);
  return !!elem;
};

const linkedHistogramOrBarChartVisible = (
  layer: LayerDescription,
  layoutFeaturesAndLegends: (LayoutFeature | Legend)[],
): boolean => {
  const elem = layoutFeaturesAndLegends
    .find((l) => (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart') && (l as Legend).layerId === layer.id);
  return !!(elem && (elem as Legend).visible);
};

const layerLinkedToRegressionPlot = (
  layer: LayerDescription,
  layoutFeaturesAndLegends: (LayoutFeature | Legend)[],
): boolean => {
  const elem = layoutFeaturesAndLegends
    .find((l) => l.type === 'linearRegressionScatterPlot' && (l as Legend).layerId === layer.id);
  return !!elem;
};

const linkedRegressionPlotVisible = (
  layer: LayerDescription,
  layoutFeaturesAndLegends: (LayoutFeature | Legend)[],
): boolean => {
  const elem = layoutFeaturesAndLegends
    .find((l) => l.type === 'linearRegressionScatterPlot' && (l as Legend).layerId === layer.id);
  return !!(elem && (elem as Legend).visible);
};

const redrawLayer = (targetId: string) => {
  // We redraw the layer by toggling its visibility
  setLayersDescriptionStoreBase(
    produce((draft: LayersDescriptionStoreType) => {
      const layer = draft.layers.find((l) => l.id === targetId) as LayerDescriptionLabels;
      layer.visible = false;
    }),
  );
  setLayersDescriptionStoreBase(
    produce((draft: LayersDescriptionStoreType) => {
      const layer = draft.layers.find((l) => l.id === targetId) as LayerDescriptionLabels;
      layer.visible = true;
    }),
  );
};

/**
 * Update the note of the legend of a choropleth layer
 * to change the "Classified using XXX method" if any
 * and if the classification method has changed.
 * @param {string} targetId
 * @param {ClassificationMethod} newMethod
 * @param {Accessor<TranslationFunctions>} LL
 */
const updateLegendNoteChoro = (
  targetId: string,
  newMethod: ClassificationMethod,
  LL: Accessor<TranslationFunctions>,
) => {
  // All the possible 'Classified using XXX method' messages in the current language
  const allMessages = Object.values(ClassificationMethod)
    .map((m) => LL().ClassificationPanel.classificationMethodLegendDescriptions[m]() as string);

  setLayersDescriptionStoreBase(
    produce((draft: LayersDescriptionStoreType) => {
      draft.layoutFeaturesAndLegends.forEach((l) => {
        if (l.layerId === targetId && l.type === LegendType.choropleth) {
          const legend = l as Legend;
          if (allMessages.includes(legend.note.text || '')) {
            // We update the note of the legend
            legend.note.text = LL()
              .ClassificationPanel.classificationMethodLegendDescriptions[newMethod]();
          }
        }
      });
    }),
  );
};

/**
 * Update the valueText properties of the waffle legend when the symbolValue
 * is changed in the layer settings.
 * @param {string} targetId
 * @param {number} newValue
 * @param {Accessor<TranslationFunctions>} LL
 */
const updateWaffleLegendValueText = (
  targetId: string,
  newValue: number,
  LL: Accessor<TranslationFunctions>,
) => {
  setLayersDescriptionStoreBase(
    produce((draft: LayersDescriptionStoreType) => {
      draft.layoutFeaturesAndLegends.forEach((l) => {
        if (l.type === LegendType.waffle && l.layerId === targetId) {
          const legend = l as WaffleLegend;
          legend.valueText.text = LL().FunctionalitiesSection
            .WaffleOptions.SymbolRatioNote({ value: newValue });
        }
      });
    }),
  );
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

function makeSettingsWaffle(
  props: LayerDescriptionWaffle,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  return <>
    <div class="mb-4">
      <VariableCustomisation
        variables={() => props.rendererParameters.variables}
        setVariables={(m) => {
          updateProp(props.id, ['rendererParameters', 'variables'], m as never);
          redrawLayer(props.id);
        }}
      />
    </div>
    <InputFieldNumber
      label={LL().LayerSettings.SymbolSize()}
      value={props.rendererParameters.size!}
      onChange={(v) => {
        updateProp(props.id, ['rendererParameters', 'size'], v);
        redrawLayer(props.id);
      }}
      min={1}
      strictMin={true}
      max={20}
      step={1}
      bindKeyUpAsChange={true}
    />
    <Show when={props.rendererParameters.columns.type === 'fixed'}>
      <InputFieldNumber
        label={LL().FunctionalitiesSection.WaffleOptions.ColumnsNumber()}
        value={props.rendererParameters.columns.value!}
        onChange={(v) => {
          updateProp(props.id, ['rendererParameters', 'columns', 'value'], v);
          redrawLayer(props.id);
        }}
        min={1}
        strictMin={true}
        max={20}
        step={1}
        bindKeyUpAsChange={true}
      />
    </Show>
    <InputFieldNumber
      label={LL().FunctionalitiesSection.WaffleOptions.Spacing()}
      value={props.rendererParameters.spacing!}
      onChange={(v) => {
        updateProp(props.id, ['rendererParameters', 'spacing'], v);
        redrawLayer(props.id);
      }}
      min={0}
      strictMin={true}
      max={20}
      step={1}
      bindKeyUpAsChange={true}
    />
    <InputFieldNumber
      label={LL().FunctionalitiesSection.WaffleOptions.SymbolValue()}
      value={props.rendererParameters.symbolValue!}
      onChange={(v) => {
        // TODO: make the same validation step as in WaffleSettings
        updateProp(props.id, ['rendererParameters', 'symbolValue'], v);
        updateWaffleLegendValueText(props.id, v, LL);
        redrawLayer(props.id);
      }}
      min={1}
      max={Infinity}
      step={10}
    />
    <InputFieldSelect
      label={LL().LayerSettings.SymbolHorizontalAnchor()}
      onChange={(v) => {
        updateProp(props.id, ['rendererParameters', 'horizontalAnchor'], v);
        redrawLayer(props.id);
      }}
      value={props.rendererParameters.horizontalAnchor}
    >
      <option value="start">{LL().LayerSettings.TextAnchorStart()}</option>
      <option value="middle">{LL().LayerSettings.TextAnchorMiddle()}</option>
      <option value="end">{LL().LayerSettings.TextAnchorEnd()}</option>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().LayerSettings.SymbolVerticalAnchor()}
      onChange={(v) => {
        updateProp(props.id, ['rendererParameters', 'verticalAnchor'], v);
        redrawLayer(props.id);
      }}
      value={props.rendererParameters.verticalAnchor}
    >
      <option value="top">{LL().LayerSettings.TextAnchorTop()}</option>
      <option value="middle">{LL().LayerSettings.TextAnchorMiddle()}</option>
      <option value="bottom">{LL().LayerSettings.TextAnchorBottom()}</option>
    </InputFieldSelect>
    <InputFieldWidthColorOpacity
      label={LL().LayerSettings.Stroke()}
      valueWidth={props.strokeWidth!}
      valueColor={props.strokeColor!}
      valueOpacity={props.strokeOpacity!}
      onChangeWidth={(v) => debouncedUpdateProp(props.id, 'strokeWidth', v)}
      onChangeColor={(v) => debouncedUpdateProp(props.id, 'strokeColor', v)}
      onChangeOpacity={(v) => debouncedUpdateProp(props.id, 'strokeOpacity', v)}
    />
    <InputFieldCheckbox
      label={ LL().LayerSettings.AllowMovingSymbols() }
      checked={(props.rendererParameters as ProportionalSymbolsParameters).movable}
      onChange={(v) => debouncedUpdateProp(props.id, ['rendererParameters', 'movable'], v)}
    />
    <AestheticsSection {...props} />
  </>;
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
      onChange={() => {}}
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
        onChange={() => {}}
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
    <InputFieldSelect
      label={LL().LayerSettings.TextAnchor()}
      value={rendererParameters.default.textAnchor}
      onChange={(v) => {
        updateProp(props.id, ['rendererParameters', 'default', 'textAnchor'], v);
        // Update the textAnchor properties for each "specific" parameters
        setLayersDescriptionStoreBase(
          produce((draft: LayersDescriptionStoreType) => {
            const layer = draft.layers.find((l) => l.id === props.id) as LayerDescriptionLabels;
            Object.keys((layer.rendererParameters as LabelsParameters).specific).forEach((k) => {
              // eslint-disable-next-line no-param-reassign
              layer.rendererParameters.specific[+k].textAnchor = v as 'start' | 'middle' | 'end';
            });
          }),
        );
      }}
    >
      <option value="start">{LL().LayerSettings.TextAnchorStart()}</option>
      <option value="middle">{LL().LayerSettings.TextAnchorMiddle()}</option>
      <option value="end">{LL().LayerSettings.TextAnchorEnd()}</option>
    </InputFieldSelect>
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
          redrawLayer(props.id);
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
          redrawLayer(props.id);
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
  const isLinearRegressionResult = (
    props.layerCreationOptions && props.layerCreationOptions.adjustedRSquared);
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

                updateLegendNoteChoro(props.id, newParams.method, LL);
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
        onChange={() => {}}
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
        onChange={(v) => {
          updateProp(props.id, ['rendererParameters', 'referenceRadius'], v);
          redrawLayer(props.id);
        }}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={ LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue() }
        value={(props.rendererParameters as ProportionalSymbolsParameters).referenceValue}
        onChange={(v) => {
          updateProp(props.id, ['rendererParameters', 'referenceValue'], v);
          redrawLayer(props.id);
        }}
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

                updateLegendNoteChoro(props.id, newParams.method, LL);
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
    <Show when={
      props.representationType === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'positiveNegative'
    }>
      <InputFieldColor
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ColorPositiveValues()}
        value={(props.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[0]}
        onChange={(v) => {
          updateProp(props.id, ['rendererParameters', 'color', 0], v);
          redrawLayer(props.id);
        }}
      />
      <InputFieldColor
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ColorNegativeValues()}
        value={(props.rendererParameters as ProportionalSymbolsPositiveNegativeParameters).color[1]}
        onChange={(v) => {
          updateProp(props.id, ['rendererParameters', 'color', 1], v);
          redrawLayer(props.id);
        }}
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
          updateProp(props.id, ['rendererParameters', 'top', 'referenceSize'], v);
          redrawLayer(props.id);
        }}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue()}
        value={(props.rendererParameters as MushroomsParameters).top.referenceValue}
        onChange={(v) => {
          updateProp(props.id, ['rendererParameters', 'top', 'referenceValue'], v);
          redrawLayer(props.id);
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
          updateProp(props.id, ['rendererParameters', 'bottom', 'referenceSize'], v);
          redrawLayer(props.id);
        }}
        min={1}
        max={200}
        step={0.1}
      />
      <InputFieldNumber
        label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.OnValue()}
        value={(props.rendererParameters as MushroomsParameters).bottom.referenceValue}
        onChange={(v) => {
          updateProp(props.id, ['rendererParameters', 'bottom', 'referenceValue'], v);
          redrawLayer(props.id);
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
            // First, deactivate the "allow moving symbols" option
            setLayersDescriptionStoreBase(
              'layers',
              (l: LayerDescription) => l.id === props.id,
              'rendererParameters',
              { movable: false },
            );
            // Compute position of the symbols
            setLayersDescriptionStoreBase(
              produce((draft: LayersDescriptionStoreType) => {
                draft.layers.filter((l) => l.id === props.id).forEach((layerDescription) => {
                  const r = (layerDescription.rendererParameters as ProportionalSymbolsParameters);
                  // eslint-disable-next-line no-param-reassign
                  layerDescription.data.features = makeDorlingDemersSimulation(
                    unproxify(layerDescription.data.features as never) as Feature[],
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
                    unproxify(layerDescription.data.features as never) as Feature[],
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
        onChange={(v) => {
          updateProp(props.id, ['rendererParameters', 'movable'], v);
          // Redraw the layer to rebind the drag-related events
          if (v) {
            redrawLayer(props.id);
          }
        }}
        disabled={(props.rendererParameters as ProportionalSymbolsParameters).avoidOverlapping}
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
          linkedHistogramOrBarChartVisible(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          if (v && !layerLinkedToHistogramOrBarChart(
            props,
            layersDescriptionStore.layoutFeaturesAndLegends,
          )) {
            const legendPosition = getPossibleLegendPosition(300, 250);

            setLayersDescriptionStoreBase(
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
          } else {
            const elem = layersDescriptionStore.layoutFeaturesAndLegends
              .find((l) => (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart') && l.layerId === props.id);

            if (elem) {
              setLayersDescriptionStoreBase(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeaturesAndLegends.forEach((l) => {
                      if (
                        (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart')
                        && l.layerId === props.id
                      ) {
                        // eslint-disable-next-line no-param-reassign
                        l.visible = !l.visible;
                      }
                    });
                  },
                ),
              );
            }
          }
        }}
      />
      <Show when={isLinearRegressionResult}>
        <InputFieldCheckbox
          label={LL().LayerSettings.AddLinearRegressionScatterPlot()}
          checked={
            linkedRegressionPlotVisible(props, layersDescriptionStore.layoutFeaturesAndLegends)
          }
          onChange={(v) => {
            if (v && !layerLinkedToRegressionPlot(
              props,
              layersDescriptionStore.layoutFeaturesAndLegends,
            )) {
              const legendPosition = getPossibleLegendPosition(300, 300);
              const linearRegressionResult = props.layerCreationOptions as LinearRegressionResult;
              setLayersDescriptionStoreBase(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeaturesAndLegends.push({
                      id: generateIdLegend(),
                      layerId: props.id,
                      type: LegendType.linearRegressionScatterPlot,
                      position: legendPosition,
                      width: 300,
                      height: 300,
                      regressionLineColor: '#FF0000',
                      confidenceInterval: false,
                      confidenceIntervalColor: '#FF0000',
                      dotColor: '#008000',
                      visible: true,
                      roundDecimals: 1,
                      title: {
                        text: `${linearRegressionResult.options.y} ~ ${linearRegressionResult.options.x}`,
                        ...applicationSettingsStore.defaultLegendSettings.title,
                      } as LegendTextElement,
                      subtitle: {
                        text: `R² = ${(+linearRegressionResult.rSquared.toFixed(4)).toLocaleString()}`,
                        ...applicationSettingsStore.defaultLegendSettings.subtitle,
                      },
                      axis: {
                        text: undefined,
                        ...applicationSettingsStore.defaultLegendSettings.labels,
                      },
                      note: {
                        text: `${linearRegressionResult.options.y} = ${toPrecisionAfterDecimalPoint(linearRegressionResult.coefficients['X.Intercept'][0], 4)} + ${linearRegressionResult.options.x} * ${toPrecisionAfterDecimalPoint(linearRegressionResult.coefficients[linearRegressionResult.options.y][0], 4)}`,
                        ...applicationSettingsStore.defaultLegendSettings.note,
                      },
                      backgroundRect: {
                        visible: false,
                      },
                    } as LinearRegressionScatterPlot);
                  },
                ),
              );
            } else {
              const elem = layersDescriptionStore.layoutFeaturesAndLegends
                .find((l) => l.type === 'linearRegressionScatterPlot' && l.layerId === props.id);

              if (elem) {
                setLayersDescriptionStoreBase(
                  produce(
                    (draft: LayersDescriptionStoreType) => {
                      draft.layoutFeaturesAndLegends.forEach((l) => {
                        if (l.type === 'linearRegressionScatterPlot' && l.layerId === props.id) {
                          // eslint-disable-next-line no-param-reassign
                          l.visible = !l.visible;
                        }
                      });
                    },
                  ),
                );
              }
            }
          }}
        />
      </Show>
    </Show>
    <Show when={
      props.representationType === 'proportionalSymbols'
      && (props.rendererParameters as ProportionalSymbolsParametersBase).colorMode === 'ratioVariable'
    }>
      <InputFieldCheckbox
        label={LL().LayerSettings.AddHistogramChoropleth()}
        checked={
          linkedHistogramOrBarChartVisible(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          if (v && !layerLinkedToHistogramOrBarChart(
            props,
            layersDescriptionStore.layoutFeaturesAndLegends,
          )) {
            const legendPosition = getPossibleLegendPosition(300, 250);

            setLayersDescriptionStoreBase(
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
                      text: (props.rendererParameters as ProportionalSymbolsRatioParameters)
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
          } else {
            const elem = layersDescriptionStore.layoutFeaturesAndLegends
              .find((l) => (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart') && l.layerId === props.id);

            if (elem) {
              setLayersDescriptionStoreBase(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeaturesAndLegends.forEach((l) => {
                      if (
                        (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart')
                        && l.layerId === props.id
                      ) {
                        // eslint-disable-next-line no-param-reassign
                        l.visible = !l.visible;
                      }
                    });
                  },
                ),
              );
            }
          }
        }}
      />
    </Show>
    <Show when={isLinearRegressionResult}>
      <InputFieldCheckbox
        label={LL().LayerSettings.AddLinearRegressionScatterPlot()}
        checked={
          linkedRegressionPlotVisible(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          if (v && !layerLinkedToRegressionPlot(
            props,
            layersDescriptionStore.layoutFeaturesAndLegends,
          )) {
            const legendPosition = getPossibleLegendPosition(300, 300);
            const linearRegressionResult = props.layerCreationOptions as LinearRegressionResult;
            setLayersDescriptionStoreBase(
              produce(
                (draft: LayersDescriptionStoreType) => {
                  draft.layoutFeaturesAndLegends.push({
                    id: generateIdLegend(),
                    layerId: props.id,
                    type: LegendType.linearRegressionScatterPlot,
                    position: legendPosition,
                    width: 300,
                    height: 300,
                    regressionLineColor: '#FF0000',
                    confidenceInterval: false,
                    confidenceIntervalColor: '#FF0000',
                    dotColor: '#008000',
                    visible: true,
                    roundDecimals: 1,
                    title: {
                      text: `${linearRegressionResult.options.y} ~ ${linearRegressionResult.options.x}`,
                      ...applicationSettingsStore.defaultLegendSettings.title,
                    } as LegendTextElement,
                    subtitle: {
                      text: `R² = ${(+linearRegressionResult.rSquared.toFixed(4)).toLocaleString()}`,
                      ...applicationSettingsStore.defaultLegendSettings.subtitle,
                    },
                    axis: {
                      text: undefined,
                      ...applicationSettingsStore.defaultLegendSettings.labels,
                    },
                    note: {
                      text: `${linearRegressionResult.options.y} = ${toPrecisionAfterDecimalPoint(linearRegressionResult.coefficients['X.Intercept'][0], 4)} + ${linearRegressionResult.options.x} * ${toPrecisionAfterDecimalPoint(linearRegressionResult.coefficients[linearRegressionResult.options.y][0], 4)}`,
                      ...applicationSettingsStore.defaultLegendSettings.note,
                    },
                    backgroundRect: {
                      visible: false,
                    },
                  } as LinearRegressionScatterPlot);
                },
              ),
            );
          } else {
            const elem = layersDescriptionStore.layoutFeaturesAndLegends
              .find((l) => l.type === 'linearRegressionScatterPlot' && l.layerId === props.id);

            if (elem) {
              setLayersDescriptionStoreBase(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeaturesAndLegends.forEach((l) => {
                      if (l.type === 'linearRegressionScatterPlot' && l.layerId === props.id) {
                        // eslint-disable-next-line no-param-reassign
                        l.visible = !l.visible;
                      }
                    });
                  },
                ),
              );
            }
          }
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
        onChange={() => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStoreBase(
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
        onChange={() => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStoreBase(
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
  const isLinearRegressionResult = (
    props.layerCreationOptions && props.layerCreationOptions.adjustedRSquared);
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
          <div class="field" style={{ 'text-align': 'center' }}>
            <button
              class="button"
              style={{ margin: 'auto' }}
              onClick={() => {
                // Save current state of classification parameters
                const params = unproxify(
                  (props.rendererParameters as LinksParameters).classification as never,
                );
                setClassificationPanelStore({
                  show: true,
                  type: 'size',
                  layerName: props.name,
                  series: props.data.features
                    .map((f) => f.properties.Intensity),
                  classificationParameters: params,
                  onCancel: () => {
                    setLayersDescriptionStoreBase(
                      'layers',
                      (l: LayerDescription) => l.id === props.id,
                      'rendererParameters',
                      'classification',
                      params,
                    );
                  },
                  onConfirm: (newParams) => {
                    setLayersDescriptionStoreBase(
                      'layers',
                      (l: LayerDescription) => l.id === props.id,
                      'rendererParameters',
                      'classification',
                      newParams,
                    );
                  },
                });
              }}
            >{LL().LayerSettings.ChangeClassification()}</button>
          </div>
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

                  updateLegendNoteChoro(props.id, newParams.method, LL);
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

                updateLegendNoteChoro(props.id, newParams.method, LL);
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
        onChange={() => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStoreBase(
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
          linkedHistogramOrBarChartVisible(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          if (v && !layerLinkedToHistogramOrBarChart(
            props,
            layersDescriptionStore.layoutFeaturesAndLegends,
          )) {
            const legendPosition = getPossibleLegendPosition(300, 250);

            setLayersDescriptionStoreBase(
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
          } else {
            const elem = layersDescriptionStore.layoutFeaturesAndLegends
              .find((l) => (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart') && l.layerId === props.id);

            if (elem) {
              setLayersDescriptionStoreBase(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeaturesAndLegends.forEach((l) => {
                      if (
                        (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart')
                        && l.layerId === props.id
                      ) {
                        // eslint-disable-next-line no-param-reassign
                        l.visible = !l.visible;
                      }
                    });
                  },
                ),
              );
            }
          }
        }}
      />
      <Show when={isLinearRegressionResult}>
        <InputFieldCheckbox
          label={LL().LayerSettings.AddLinearRegressionScatterPlot()}
          checked={
            linkedRegressionPlotVisible(props, layersDescriptionStore.layoutFeaturesAndLegends)
          }
          onChange={(v) => {
            if (v && !layerLinkedToRegressionPlot(
              props,
              layersDescriptionStore.layoutFeaturesAndLegends,
            )) {
              const legendPosition = getPossibleLegendPosition(300, 300);
              const linearRegressionResult = props.layerCreationOptions as LinearRegressionResult;
              setLayersDescriptionStoreBase(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeaturesAndLegends.push({
                      id: generateIdLegend(),
                      layerId: props.id,
                      type: LegendType.linearRegressionScatterPlot,
                      position: legendPosition,
                      width: 300,
                      height: 300,
                      regressionLineColor: '#FF0000',
                      confidenceInterval: false,
                      confidenceIntervalColor: '#FF0000',
                      dotColor: '#008000',
                      visible: true,
                      roundDecimals: 1,
                      title: {
                        text: `${linearRegressionResult.options.y} ~ ${linearRegressionResult.options.x}`,
                        ...applicationSettingsStore.defaultLegendSettings.title,
                      } as LegendTextElement,
                      subtitle: {
                        text: `R² = ${(+linearRegressionResult.rSquared.toFixed(4)).toLocaleString()}`,
                        ...applicationSettingsStore.defaultLegendSettings.subtitle,
                      },
                      axis: {
                        text: undefined,
                        ...applicationSettingsStore.defaultLegendSettings.labels,
                      },
                      note: {
                        text: `${linearRegressionResult.options.y} = ${toPrecisionAfterDecimalPoint(linearRegressionResult.coefficients['X.Intercept'][0], 4)} + ${linearRegressionResult.options.x} * ${toPrecisionAfterDecimalPoint(linearRegressionResult.coefficients[linearRegressionResult.options.y][0], 4)}`,
                        ...applicationSettingsStore.defaultLegendSettings.note,
                      },
                      backgroundRect: {
                        visible: false,
                      },
                    } as LinearRegressionScatterPlot);
                  },
                ),
              );
            } else {
              const elem = layersDescriptionStore.layoutFeaturesAndLegends
                .find((l) => l.type === 'linearRegressionScatterPlot' && l.layerId === props.id);

              if (elem) {
                setLayersDescriptionStoreBase(
                  produce(
                    (draft: LayersDescriptionStoreType) => {
                      draft.layoutFeaturesAndLegends.forEach((l) => {
                        if (l.type === 'linearRegressionScatterPlot' && l.layerId === props.id) {
                          // eslint-disable-next-line no-param-reassign
                          l.visible = !l.visible;
                        }
                      });
                    },
                  ),
                );
              }
            }
          }}
        />
      </Show>
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
        onChange={() => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStoreBase(
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
          linkedHistogramOrBarChartVisible(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          if (v && !layerLinkedToHistogramOrBarChart(
            props,
            layersDescriptionStore.layoutFeaturesAndLegends,
          )) {
            const legendPosition = getPossibleLegendPosition(300, 250);

            setLayersDescriptionStoreBase(
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
          } else {
            const elem = layersDescriptionStore.layoutFeaturesAndLegends
              .find((l) => (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart') && l.layerId === props.id);

            if (elem) {
              setLayersDescriptionStoreBase(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeaturesAndLegends.forEach((l) => {
                      if (
                        (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart')
                        && l.layerId === props.id
                      ) {
                        // eslint-disable-next-line no-param-reassign
                        l.visible = !l.visible;
                      }
                    });
                  },
                ),
              );
            }
          }
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

  const isLinearRegressionResult = (
    props.layerCreationOptions && props.layerCreationOptions.adjustedRSquared);

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

                updateLegendNoteChoro(props.id, newParams.method, LL);
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
          linkedHistogramOrBarChartVisible(props, layersDescriptionStore.layoutFeaturesAndLegends)
        }
        onChange={(v) => {
          if (v && !layerLinkedToHistogramOrBarChart(
            props,
            layersDescriptionStore.layoutFeaturesAndLegends,
          )) {
            const legendPosition = getPossibleLegendPosition(300, 250);

            setLayersDescriptionStoreBase(
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
          } else {
            const elem = layersDescriptionStore.layoutFeaturesAndLegends
              .find((l) => (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart') && l.layerId === props.id);

            if (elem) {
              setLayersDescriptionStoreBase(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeaturesAndLegends.forEach((l) => {
                      if (
                        (l.type === 'choroplethHistogram' || l.type === 'categoricalChoroplethBarchart')
                        && l.layerId === props.id
                      ) {
                        // eslint-disable-next-line no-param-reassign
                        l.visible = !l.visible;
                      }
                    });
                  },
                ),
              );
            }
          }
        }}
      />
      <Show when={isLinearRegressionResult}>
        <InputFieldCheckbox
          label={LL().LayerSettings.AddLinearRegressionScatterPlot()}
          checked={
            linkedRegressionPlotVisible(props, layersDescriptionStore.layoutFeaturesAndLegends)
          }
          onChange={(v) => {
            if (v && !layerLinkedToRegressionPlot(
              props,
              layersDescriptionStore.layoutFeaturesAndLegends,
            )) {
              const legendPosition = getPossibleLegendPosition(300, 300);
              const linearRegressionResult = props.layerCreationOptions as LinearRegressionResult;
              setLayersDescriptionStore(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeaturesAndLegends.push({
                      id: generateIdLegend(),
                      layerId: props.id,
                      type: LegendType.linearRegressionScatterPlot,
                      position: legendPosition,
                      width: 300,
                      height: 300,
                      regressionLineColor: '#FF0000',
                      confidenceInterval: false,
                      confidenceIntervalColor: '#FF0000',
                      dotColor: '#008000',
                      visible: true,
                      roundDecimals: 1,
                      title: {
                        text: `${linearRegressionResult.options.y} ~ ${linearRegressionResult.options.x}`,
                        ...applicationSettingsStore.defaultLegendSettings.title,
                      } as LegendTextElement,
                      subtitle: {
                        text: `R² = ${(+linearRegressionResult.rSquared.toFixed(4)).toLocaleString()}`,
                        ...applicationSettingsStore.defaultLegendSettings.subtitle,
                      },
                      axis: {
                        text: undefined,
                        ...applicationSettingsStore.defaultLegendSettings.labels,
                      },
                      note: {
                        text: `${linearRegressionResult.options.y} = ${toPrecisionAfterDecimalPoint(linearRegressionResult.coefficients['X.Intercept'][0], 4)} + ${linearRegressionResult.options.x} * ${toPrecisionAfterDecimalPoint(linearRegressionResult.coefficients[linearRegressionResult.options.y][0], 4)}`,
                        ...applicationSettingsStore.defaultLegendSettings.note,
                      },
                      backgroundRect: {
                        visible: false,
                      },
                    } as LinearRegressionScatterPlot);
                  },
                ),
              );
            } else {
              const elem = layersDescriptionStore.layoutFeaturesAndLegends
                .find((l) => l.type === 'linearRegressionScatterPlot' && l.layerId === props.id);

              if (elem) {
                setLayersDescriptionStoreBase(
                  produce(
                    (draft: LayersDescriptionStoreType) => {
                      draft.layoutFeaturesAndLegends.forEach((l) => {
                        if (l.type === 'linearRegressionScatterPlot' && l.layerId === props.id) {
                          // eslint-disable-next-line no-param-reassign
                          l.visible = !l.visible;
                        }
                      });
                    },
                  ),
                );
              }
            }
          }}
        />
      </Show>
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
        onChange={() => {
          const legendPosition = getPossibleLegendPosition(300, 250);

          setLayersDescriptionStoreBase(
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
  } else if (layerDescription.representationType === 'waffle') {
    innerElement = makeSettingsWaffle(
      layerDescription as LayerDescriptionWaffle,
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
