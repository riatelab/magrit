// Imports from solid-js
import {
  createEffect,
  createSignal,
  For,
  on,
  Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// GeoJSON types
import { Feature, Position } from 'geojson';

// Imports from other packages
import { getAsymmetricDivergingColors } from 'dicopal';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { PortrayalSettingsProps } from './common';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';
import { findSuitableName, unproxify } from '../../helpers/common';
import { getEntitiesByClass } from '../../helpers/classification';
import { computeCandidateValuesForSymbolsLegend, coordsPointOnFeature, PropSizer } from '../../helpers/geo';
import { generateIdLayer } from '../../helpers/layers';
import { generateIdLegend } from '../../helpers/legends';
import { Mabs, toPrecisionAfterDecimalPoint } from '../../helpers/math';
import { computeLinearRegression, LinearRegressionResult, makeCorrelationMatrix } from '../../helpers/statistics';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';

// Subcomponents
import InputResultName from './InputResultName.tsx';
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import {
  CorrelationMatrix,
  DiagnosticPlots,
  InformationBeforeValidation,
  LmSummary,
  makeOptionsStandardisedResidualsColors,
  ScatterPlot,
} from './LinearRegressionComponents.tsx';
import CollapsibleSection from '../CollapsibleSection.tsx';
import InputFieldRadio from '../Inputs/InputRadio.tsx';
import MessageBlock from '../MessageBlock.tsx';
import PlotFigure from '../PlotFigure.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';

// Types / enums / interfaces
import { DataType, Variable } from '../../helpers/typeDetection';
import {
  type ChoroplethLegend,
  type ClassificationParameters,
  type CustomPalette,
  type LegendTextElement, type LinearRegressionScatterPlot,
  type ProportionalSymbolsLegend,
  type ProportionalSymbolsPositiveNegativeParameters,
  LegendType, Orientation,
  ProportionalSymbolsSymbolType, RepresentationType,
  type LayerDescriptionLMResultRatio, type LayerDescriptionLMResultStock,
} from '../../global.d';

interface OptionsChoro {
  type: 'choropleth';
  palette: string;
}

interface OptionsPropSymbols {
  type: 'proportionalSymbols';
  colors: [string, string];
  symbolType: 'circle' | 'square';
}

function onClickValidate(
  layerId: string,
  linearRegressionResult: LinearRegressionResult,
  portrayalOptions: OptionsChoro | OptionsPropSymbols,
  addScatterPlot: boolean,
  newLayerName: string,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === layerId)!;

  // Copy the dataset and enrich it with the linear regression result
  // Takes the opportunity to iterate over the dataset to compute
  // extent of the targeted variable
  const newDataset = unproxify(referenceLayerDescription.data);
  let minStdRes = Infinity;
  let maxStdRes = -Infinity;
  let minRes = Infinity;
  let maxRes = -Infinity;
  newDataset.features.forEach((f: Feature, i: number) => {
    // eslint-disable-next-line no-param-reassign
    f.properties.fitted = linearRegressionResult.fittedValues[i] as (number | null);
    // eslint-disable-next-line no-param-reassign
    f.properties.residual = linearRegressionResult.residuals[i] as (number | null);
    // eslint-disable-next-line no-param-reassign
    f.properties.standardizedResidual = linearRegressionResult
      .standardisedResiduals[i] as (number | null);
    if (f.properties.standardizedResidual !== null) {
      if ((f.properties.standardizedResidual as number) < minStdRes) {
        minStdRes = f.properties.standardizedResidual as number;
      }
      if (f.properties.standardizedResidual as number > maxStdRes) {
        maxStdRes = f.properties.standardizedResidual as number;
      }
    }
    if (f.properties.residual !== null) {
      if ((f.properties.residual as number) < minRes) {
        minRes = f.properties.residual as number;
      }
      if ((f.properties.residual as number) > maxRes) {
        maxRes = f.properties.residual as number;
      }
    }
  });

  // Fields description
  const newFields = (unproxify(referenceLayerDescription.fields) as Variable[]).concat([
    {
      name: 'fitted',
      type: 'ratio', // FIXME: we should take the type (ratio / stock) of the x variable
      hasMissingValues: linearRegressionResult.ignored > 0,
      dataType: DataType.number,
    },
    {
      name: 'residual',
      type: 'ratio', // FIXME: we should take the type (ratio / stock) of the x variable
      hasMissingValues: linearRegressionResult.ignored > 0,
      dataType: DataType.number,
    },
    {
      name: 'standardizedResidual',
      type: 'ratio',
      hasMissingValues: linearRegressionResult.ignored > 0,
      dataType: DataType.number,
    },
  ]);

  // Generate ID of new layer
  const newId = generateIdLayer();

  if (portrayalOptions.type === 'choropleth') {
    // Prepare the classification parameters
    const palName = portrayalOptions.palette as string;
    const breaks = [minStdRes, -1.5, -0.5, 0.5, 1.5, maxStdRes];
    const classificationParameters = {
      variable: 'standardizedResidual',
      method: 'manual',
      classes: 5,
      breaks,
      palette: {
        id: `${palName}-5`,
        name: palName,
        number: 5,
        type: 'diverging',
        colors: getAsymmetricDivergingColors(palName, 2, 2, true, true, false),
        provenance: 'dicopal',
        reversed: false,
      } as CustomPalette,
      noDataColor: applicationSettingsStore.defaultNoDataColor,
      entitiesByClass: getEntitiesByClass(
        linearRegressionResult.standardisedResiduals,
        [minStdRes, -1.5, -0.5, 0.5, 1.5, maxStdRes],
      ),
    } as ClassificationParameters;

    const newLayerDescription = {
      id: newId,
      name: newLayerName,
      data: newDataset,
      type: referenceLayerDescription.type,
      fields: newFields,
      representationType: 'choropleth' as RepresentationType,
      visible: true,
      strokeColor: '#000000',
      strokeWidth: 0.4,
      strokeOpacity: 1,
      fillOpacity: 1,
      dropShadow: null,
      shapeRendering: referenceLayerDescription.shapeRendering,
      rendererParameters: classificationParameters,
      layerCreationOptions: linearRegressionResult,
    } as LayerDescriptionLMResultRatio;

    if (newLayerDescription.type === 'point') {
      // We also need to transfert the symbolSize and the symbolType parameters
      newLayerDescription.symbolSize = referenceLayerDescription.symbolSize || 5;
      newLayerDescription.symbolType = referenceLayerDescription.symbolType || 'circle';
    }

    // Find a position for the legend
    const legendPosition = getPossibleLegendPosition(120, 340);

    const legend = {
      // Part common to all legends
      id: generateIdLegend(),
      layerId: newId,
      title: {
        text: 'Standardized residuals',
        ...applicationSettingsStore.defaultLegendSettings.title,
      } as LegendTextElement,
      subtitle: {
        text: `${linearRegressionResult.options.y} ~ ${linearRegressionResult.options.x}`,
        ...applicationSettingsStore.defaultLegendSettings.subtitle,
      } as LegendTextElement,
      note: {
        text: '',
        ...applicationSettingsStore.defaultLegendSettings.note,
      } as LegendTextElement,
      position: legendPosition,
      visible: true,
      roundDecimals: 1,
      backgroundRect: {
        visible: false,
      },
      // Part specific to choropleth
      type: LegendType.choropleth,
      orientation: Orientation.vertical,
      boxWidth: 50,
      boxHeight: 30,
      boxSpacing: 0,
      boxSpacingNoData: 10,
      boxCornerRadius: 0,
      labels: {
        ...applicationSettingsStore.defaultLegendSettings.labels,
      } as LegendTextElement,
      noDataLabel: 'No data',
      noDataBox: true,
      stroke: false,
      tick: false,
    } as ChoroplethLegend;

    setLayersDescriptionStore(
      produce(
        (draft: LayersDescriptionStoreType) => {
          draft.layers.push(newLayerDescription);
          draft.layoutFeaturesAndLegends.push(legend);
        },
      ),
    );
  } else {
    // Prepare the proportional symbols parameters
    const [colorPos, colorNeg] = portrayalOptions.colors as [string, string];
    if (
      referenceLayerDescription.type === 'polygon'
    ) {
      newDataset.features.forEach((feature: Feature) => {
        // eslint-disable-next-line no-param-reassign
        feature.geometry = {
          type: 'Point',
          coordinates: coordsPointOnFeature(feature.geometry as never) as Position,
        };
      });
    }

    // Store the original position of the features (we will need it
    // later if the avoid overlapping option is set
    // to recompute the new position if the user changes the
    // settings of proportional symbols or zoom in/out
    // and also if the user wants to change the position of the
    // symbols manually)
    if (referenceLayerDescription.type !== 'linestring') {
      newDataset.features.forEach((feature: Feature) => {
        // eslint-disable-next-line no-param-reassign
        feature.geometry.originalCoordinates = feature.geometry.coordinates;
      });
    }

    // We also need to reorder the features so that those with bigger residuals
    // values are on the bottom
    newDataset.features
      .sort((a, b) => Mabs(b.properties.residual) - Mabs(a.properties.residual));

    const symbolType = (referenceLayerDescription.type === 'linestring'
      ? 'line'
      : portrayalOptions.symbolType) as ProportionalSymbolsSymbolType;

    const propSymbolsParameters = {
      variable: 'residual',
      symbolType,
      referenceRadius: 50,
      referenceValue: maxRes,
      avoidOverlapping: false,
      iterations: 100,
      movable: false,
      colorMode: 'positiveNegative',
      color: [colorPos, colorNeg], // ['#3d8f63', '#8F3D6B'],
    } as ProportionalSymbolsPositiveNegativeParameters;

    const newLayerDescription = {
      id: newId,
      name: newLayerName,
      data: newDataset,
      type: referenceLayerDescription.type === 'linestring' ? 'linestring' : 'point',
      fields: newFields,
      representationType: 'proportionalSymbols' as RepresentationType,
      visible: true,
      strokeColor: '#000000',
      strokeWidth: 1,
      strokeOpacity: 1,
      fillColor: undefined,
      fillOpacity: 1,
      dropShadow: null,
      shapeRendering: 'auto',
      rendererParameters: propSymbolsParameters,
      layerCreationOptions: linearRegressionResult,
    } as LayerDescriptionLMResultStock;

    // Find a position for the legend
    const legendPosition = getPossibleLegendPosition(150, 150);

    const propSize = new PropSizer(
      propSymbolsParameters.referenceValue,
      propSymbolsParameters.referenceRadius,
      propSymbolsParameters.symbolType,
    );

    const legendValuesPos = computeCandidateValuesForSymbolsLegend(
      0,
      maxRes,
      propSize.scale,
      propSize.getValue,
      4,
    ).slice(1);

    const legendValuesNeg = computeCandidateValuesForSymbolsLegend(
      0,
      Mabs(minRes),
      propSize.scale,
      propSize.getValue,
      4,
    ).slice(1).map((d) => -d).toReversed();

    const legend = {
      // Legend common part
      id: generateIdLegend(),
      layerId: newId,
      title: {
        text: 'Residual',
        ...applicationSettingsStore.defaultLegendSettings.title,
      } as LegendTextElement,
      subtitle: {
        text: `${linearRegressionResult.options.y} ~ ${linearRegressionResult.options.x}`,
        ...applicationSettingsStore.defaultLegendSettings.subtitle,
      } as LegendTextElement,
      note: {
        text: '',
        ...applicationSettingsStore.defaultLegendSettings.note,
      } as LegendTextElement,
      position: legendPosition,
      visible: true,
      roundDecimals: 1,
      backgroundRect: {
        visible: false,
      },
      // Part specific to proportional symbols
      type: LegendType.proportional,
      layout: 'vertical',
      values: [...legendValuesNeg, ...legendValuesPos],
      spacing: 5,
      labels: {
        ...applicationSettingsStore.defaultLegendSettings.labels,
      } as LegendTextElement,
      symbolType: propSymbolsParameters.symbolType,
    } as ProportionalSymbolsLegend;

    setLayersDescriptionStore(
      produce(
        (draft: LayersDescriptionStoreType) => {
          draft.layers.push(newLayerDescription);
          draft.layoutFeaturesAndLegends.push(legend);
        },
      ),
    );
  }

  if (addScatterPlot) {
    // Add the scatter plot to the layout
    setLayersDescriptionStore(
      produce(
        (draft: LayersDescriptionStoreType) => {
          draft.layoutFeaturesAndLegends.push({
            id: generateIdLegend(),
            layerId: newId,
            type: LegendType.linearRegressionScatterPlot,
            position: getPossibleLegendPosition(300, 300),
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
  }
}

export default function LinearRegressionSettings(props: PortrayalSettingsProps) {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // The fields that are of type stock or ratio
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === 'stock' || variable.type === 'ratio');

  // Extract properties from the layer description
  const dataset = layerDescription.data.features.map((f) => f.properties) as Record<string, any>[];

  // Identifier variable (useful for tooltip
  // on the various chart that are displayed in this component)
  // TODO: In the future we might ask the user to select the identifier variable...
  const identifierVariable = layerDescription.fields.find((f) => f.type === 'identifier')?.name;
  const identifiers = identifierVariable
    ? dataset.map((d) => d[identifierVariable])
    : undefined;

  // The pearson correlation matrix between the variables
  const pearsonMatrix = makeCorrelationMatrix(
    dataset,
    targetFields.map((f) => f.name),
    'pearson',
  );

  // The spearman correlation matrix between the variables
  const spearmanMatrix = makeCorrelationMatrix(
    dataset,
    targetFields.map((f) => f.name),
    'spearman',
  );

  // Signals for the current component:
  // Explained (response) variable
  const [
    explainedVariable,
    setExplainedVariable,
  ] = createSignal<string>('');

  // Explanatory variable
  const [
    explanatoryVariable,
    setExplanatoryVariable,
  ] = createSignal<string>('');

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.LinearRegressionOptions.NewLayerName({
      xVariable: explanatoryVariable(),
      yVariable: explainedVariable(),
      layerName: layerDescription.name,
    }) as string,
  );

  const [
    drawConfidenceInterval,
    setDrawConfidenceInterval,
  ] = createSignal<boolean>(false);

  const [
    selectedMatrix,
    setSelectedMatrix,
  ] = createSignal<'pearson' | 'spearman'>('pearson');

  const [
    drawRegressionLine,
    setDrawRegressionLine,
  ] = createSignal<boolean>(false);

  const [
    linearRegressionResult,
    setLinearRegressionResult,
  ] = createSignal<LinearRegressionResult | null>(null);

  const [
    portrayalType,
    setPortrayalType,
  ] = createSignal<'choropleth' | 'proportionalSymbols'>('choropleth');

  const [
    paletteName,
    setPaletteName,
  ] = createSignal<string>('PuOr');

  const [
    symbolType,
    setSymbolType,
  ] = createSignal<'circle' | 'square' | 'line'>('circle');

  const [
    colors,
    setColors,
  ] = createSignal<[string, string]>(['#3d8f63', '#8F3D6B']);

  const [
    addScatterPlot,
    setAddScatterPlot,
  ] = createSignal<boolean>(true);

  createEffect(
    on(
      () => [explainedVariable(), explanatoryVariable()],
      () => {
        setNewLayerName(
          LL().FunctionalitiesSection.LinearRegressionOptions.NewLayerName({
            xVariable: explanatoryVariable(),
            yVariable: explainedVariable(),
            layerName: layerDescription.name,
          }) as string,
        );
      },
    ),
  );

  const makePortrayal = async () => {
    const layerName = findSuitableName(
      newLayerName() || LL().FunctionalitiesSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );

    const portrayalOptions = portrayalType() === 'choropleth'
      ? {
        type: 'choropleth',
        palette: paletteName(),
      } as OptionsChoro
      : {
        type: 'proportionalSymbols',
        colors: colors(),
        symbolType: symbolType(),
      } as OptionsPropSymbols;

    // Close the current modal
    setFunctionalitySelectionStore({ show: false, id: '', type: '' });

    // Display loading overlay
    setLoading(true);

    // Create the portrayal
    setTimeout(() => {
      onClickValidate(
        layerDescription.id,
        linearRegressionResult() as LinearRegressionResult,
        portrayalOptions,
        addScatterPlot(),
        layerName,
      );

      setLoading(false);

      openLayerManager();
    }, 0);
  };

  return <div class="portrayal-section__portrayal-options-linear-regression">
    <CollapsibleSection
      title={LL().FunctionalitiesSection.LinearRegressionOptions.DisplayCorrelationMatrix()}
    >
      <InputFieldRadio
        label={''}
        value={selectedMatrix()}
        values={
          [
            { value: 'pearson', label: LL().FunctionalitiesSection.LinearRegressionOptions.PearsonCorrelation() },
            { value: 'spearman', label: LL().FunctionalitiesSection.LinearRegressionOptions.SpearmanCorrelation() },
          ]
        }
        onChange={(v) => {
          setSelectedMatrix(v as 'pearson' | 'spearman');
        }}
      />
      <Show when={selectedMatrix() === 'pearson'}>
        <CorrelationMatrix matrix={pearsonMatrix}/>
      </Show>
      <Show when={selectedMatrix() === 'spearman'}>
        <CorrelationMatrix matrix={spearmanMatrix}/>
      </Show>
    </CollapsibleSection>

    <InputFieldSelect
      label={LL().FunctionalitiesSection.LinearRegressionOptions.ExplainedVariable()}
      onChange={(value) => {
        setDrawRegressionLine(false);
        setLinearRegressionResult(null);
        setExplainedVariable(value);
      }}
      value={explainedVariable()}
    >
      <option value="" disabled={true}>
        {LL().FunctionalitiesSection.LinearRegressionOptions.ExplainedVariable()}
      </option>
      <For each={targetFields}>
        {(variable) => <option value={variable.name}>{variable.name}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().FunctionalitiesSection.LinearRegressionOptions.ExplanatoryVariable()}
      onChange={(value) => {
        setDrawRegressionLine(false);
        setLinearRegressionResult(null);
        setExplanatoryVariable(value);
      }}
      value={explanatoryVariable()}
    >
      <option value="" disabled={true}>
        {LL().FunctionalitiesSection.LinearRegressionOptions.ExplanatoryVariable()}
      </option>
      <For each={targetFields}>
        {(variable) => <option value={variable.name}>{variable.name}</option>}
      </For>
    </InputFieldSelect>
    <hr />
    <Show when={
      explainedVariable() && explanatoryVariable()
      && explanatoryVariable() === explainedVariable()
    }>
      <MessageBlock type={'danger'}>
        <p>{LL().FunctionalitiesSection.LinearRegressionOptions.MessageSameVariable()}</p>
      </MessageBlock>
    </Show>
    <Show when={
      explainedVariable() && explanatoryVariable()
      && explanatoryVariable() !== explainedVariable()}
    >
      <ScatterPlot
        dataset={dataset}
        explainedVariable={explainedVariable()}
        explanatoryVariable={explanatoryVariable()}
        logX={false}
        logY={false}
        drawLine={drawRegressionLine()}
        drawConfidenceInterval={drawConfidenceInterval()}
      />
      <Show when={linearRegressionResult() === null}>
        <div class="has-text-centered m-4">
          <button
            class="button"
            onClick={() => {
              setDrawRegressionLine(!drawRegressionLine());
              setLinearRegressionResult(
                computeLinearRegression(
                  dataset,
                  {
                    x: explanatoryVariable(),
                    y: explainedVariable(),
                    logX: false,
                    logY: false,
                  },
                ),
              );
            }}
          >
            {LL().FunctionalitiesSection.LinearRegressionOptions.Compute()}
          </button>
        </div>
      </Show>
    </Show>
    <Show when={linearRegressionResult() !== null}>
      <div style={{ width: '34%', 'text-align': 'center', margin: 'auto' }}>
        <InputFieldCheckbox
          label={LL().FunctionalitiesSection.LinearRegressionOptions.DrawConfidenceInterval()}
          checked={drawConfidenceInterval()}
          onChange={(v) => {
            setDrawConfidenceInterval(v);
          }}
        />
      </div>
      <hr/>
      <LmSummary {...(linearRegressionResult() as LinearRegressionResult)} />
      <hr/>
      <DiagnosticPlots {...(linearRegressionResult() as LinearRegressionResult)} />
      <InformationBeforeValidation/>
      <p class={'m-4'}></p>
      <hr/>
      <InputFieldSelect
        label={LL().FunctionalitiesSection.LinearRegressionOptions.PortrayalType()}
        onChange={(v) => {
          setPortrayalType(v as 'choropleth' | 'proportionalSymbols');
        }}
        value={portrayalType()}
        width={'400px'}
      >
        <option value="choropleth">
          {LL().FunctionalitiesSection.LinearRegressionOptions.PortrayalTypeChoropleth()}
        </option>
        <option value="proportionalSymbols">
          {LL().FunctionalitiesSection.LinearRegressionOptions.PortrayalTypePropSymbol()}
        </option>
      </InputFieldSelect>
      <Show when={portrayalType() === 'choropleth'}>
        <div class="is-flex">
          <PlotFigure
            id="classification-color-selection"
            options={
              makeOptionsStandardisedResidualsColors(
                dataset,
                linearRegressionResult()!,
                getAsymmetricDivergingColors(paletteName(), 2, 2, true, true, false),
                [-1.5, -0.5, 0.5, 1.5],
                identifierVariable,
              )
            }
            style={{ width: '50%' }}
          />
          <div
            class="is-flex is-justify-content-center is-align-items-center has-text-centered"
            style={{ width: '50%' }}
          >
            <InputFieldSelect
              label={'Palette'}
              onChange={(v) => {
                setPaletteName(v);
              }}
              value={paletteName()}
              layout={'vertical'}
            >
              <option value="ArmyRose">ArmyRose</option>
              <option value="Balance">Balance</option>
              <option value="Berlin">Berlin</option>
              <option value="Geyser">Geyser</option>
              <option value="PuOr">PuOr</option>
              <option value="PRGn">PRGn</option>
              <option value="Spectral">Spectral</option>
              <option value="Temps">Temps</option>
            </InputFieldSelect>
          </div>
        </div>
      </Show>
      <Show when={portrayalType() === 'proportionalSymbols'}>
        <InputFieldSelect
          label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.SymbolType()}
          onChange={(value) => {
            setSymbolType(value as ProportionalSymbolsSymbolType);
          }}
          value={symbolType()}
        >
          <For each={
            Object.values(ProportionalSymbolsSymbolType)
              .filter((st) => (layerDescription.type === 'linestring' ? true : st !== ProportionalSymbolsSymbolType.line))
          }>
            {
              (st) => <option
                value={st}
              >{LL().FunctionalitiesSection.ProportionalSymbolsOptions.SymbolTypes[st]()}</option>
            }
          </For>
        </InputFieldSelect>
        <InputFieldColor
          label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ColorPositiveValues()}
          value={colors()[0]}
          onChange={(v) => {
            setColors([v, colors()[1]]);
          }}
        />
        <InputFieldColor
          label={LL().FunctionalitiesSection.ProportionalSymbolsOptions.ColorPositiveValues()}
          value={colors()[1]}
          onChange={(v) => {
            setColors([colors()[0], v]);
          }}
        />
      </Show>
      <InputFieldCheckbox
        label={LL().FunctionalitiesSection.LinearRegressionOptions.AddScatterPlot()}
        checked={addScatterPlot()}
        onChange={(v) => {
          setAddScatterPlot(v);
        }}
      />
    </Show>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => {
        setNewLayerName(value);
      }}
      onEnter={makePortrayal}
      disabled={linearRegressionResult() === null}
    />
    <ButtonValidation
      disabled={linearRegressionResult() === null}
      label={LL().FunctionalitiesSection.CreateLayer()}
      onClick={makePortrayal}
    />
  </div>;
}
