// Import from solid-js
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  on,
  Show,
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';
import { CompositionUtils, Viz } from 'tricolore';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setFunctionalitySelectionStore } from '../../store/FunctionalitySelectionStore';
import { setLoading } from '../../store/GlobalStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName, isFiniteNumber, unproxify } from '../../helpers/common';
import { generateIdLayer } from '../../helpers/layers';
import { Msqrt } from '../../helpers/math';
import { VariableType } from '../../helpers/typeDetection';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import MessageBlock from '../MessageBlock.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  TricoloreScaleType,
  type TriChoroSextantOpts,
  type TriChoroDiscreteOpts,
  type TriChoroContinuousOpts,
  type LayerDescriptionTrivariateChoropleth,
  type TrivariateChoroplethParameters,
  type LegendTextElement,
  type TrivariateChoroplethLegend,
  LegendType,
  RepresentationType,
} from '../../global.d';

type SextantColorArray = [string, string, string, string, string, string];

function onClickValidate(
  referenceLayerId: string,
  targetVariables: [string, string, string],
  meanCentering: boolean,
  colorScaleType: TricoloreScaleType,
  params: TriChoroSextantOpts | TriChoroDiscreteOpts | TriChoroContinuousOpts,
  hasNoData: boolean,
  newName: string,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(420, 420);

  // Generate ID of new layer
  const newId = generateIdLayer();

  const rdp = {
    variable1: targetVariables[0],
    variable2: targetVariables[1],
    variable3: targetVariables[2],
    meanCentered: meanCentering,
    colorScaleType,
    colorScaleOptions: params,
    noDataColor: '#dedede',
  } as TrivariateChoroplethParameters;

  const newLayerDescription = {
    id: newId,
    name: newName,
    data: referenceLayerDescription.data,
    type: referenceLayerDescription.type,
    fields: referenceLayerDescription.fields,
    representationType: 'trivariateChoropleth' as RepresentationType,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 0.5,
    strokeOpacity: 1,
    fillOpacity: 1,
    dropShadow: null,
    shapeRendering: referenceLayerDescription.shapeRendering,
    rendererParameters: rdp,
  } as LayerDescriptionTrivariateChoropleth;

  if (newLayerDescription.type === 'point') {
    // We also need to transfert the symbolSize and the symbolType parameters
    newLayerDescription.symbolSize = referenceLayerDescription.symbolSize || 5;
    newLayerDescription.symbolType = referenceLayerDescription.symbolType || 'circle';
  }

  const legend = {
    // Part common to all legends
    id: generateIdLayer(),
    layerId: newId,
    title: {
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
    // Part specific to trivariate choropleth
    type: LegendType.trivariateChoropleth,
    width: 340,
    noDataBox: hasNoData,
    noDataLabel: 'No data',
    displayData: true,
    displayCenter: false,
    displayLines: false,
    axisLabelsPosition: 'edge',
    axisLabels: [`⟵ ${targetVariables[0]}`, `⟵ ${targetVariables[1]}`, `${targetVariables[2]} ⟶`],
    labels: {
      ...applicationSettingsStore.defaultLegendSettings.labels,
    } as LegendTextElement,
    breakValues: {
      fontSize: 11,
      fontFamily: 'Sans-serif',
      fontColor: '#000000',
      fontStyle: 'normal',
      fontWeight: 'normal',
    } as LegendTextElement,
  } as TrivariateChoroplethLegend;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layers.push(newLayerDescription);
        draft.layoutFeaturesAndLegends.push(legend);
      },
    ),
  );
}

export default function TrivariateChoroSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!; // eslint-disable-line solid/reactivity

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth).
  // We know that we have such fields because otherwise this component would not be rendered.
  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === VariableType.ratio);

  // Signals for the current component:
  // - the target variables,
  const [targetVariable1, setTargetVariable1] = createSignal<string>(targetFields[0].name);
  const [targetVariable2, setTargetVariable2] = createSignal<string>(targetFields[1].name);
  const [targetVariable3, setTargetVariable3] = createSignal<string>(targetFields[2].name);

  // - whether to use mean centering
  const [useMeanCentering, setUseMeanCentering] = createSignal<boolean>(false);

  // - whether the color scale is discrete, continuous or sextant
  const [
    colorScaleType,
    setColorScaleType,
  ] = createSignal<TricoloreScaleType>(TricoloreScaleType.Discrete);

  // - the number of classes (for discrete color scale)
  const [
    nClasses,
    setNClasses,
  ] = createSignal<4 | 9 | 16>(9);

  // - the series, needed for checking ternary compositions
  const seriesVar1 = createMemo(() => layerDescription.data.features
    .map((f) => f.properties![targetVariable1()] as number));

  const seriesVar2 = createMemo(() => layerDescription.data.features
    .map((f) => f.properties![targetVariable2()] as number));

  const seriesVar3 = createMemo(() => layerDescription.data.features
    .map((f) => f.properties![targetVariable3()] as number));

  // - the ternary points, as [number, number, number] or null if at least one of
  //   the component is not a finite number
  const pts = createMemo(() => seriesVar1().map((pt, i) => {
    if (
      isFiniteNumber(pt)
      && isFiniteNumber(seriesVar2()[i])
      && isFiniteNumber(seriesVar3()[i])
    ) {
      return [+pt, +seriesVar2()[i], +seriesVar3()[i]];
    }
    return null;
  }));

  // - whether the selected variables are forming an array of ternary points (for now we only
  //   check that they sum to 1 or to 100)
  const isTernaryComposition = createMemo(() => {
    let isValid;
    try {
      CompositionUtils.validateTernaryPoints(pts() as [number, number, number][], 1, 1e-1);
      isValid = true;
    } catch (err) {
      // console.log(err);
      isValid = false;
      try {
        CompositionUtils.validateTernaryPoints(pts() as [number, number, number][], 100, 1e-1);
        isValid = true;
      } catch (err2) {
        // console.log(err2);
        isValid = false;
      }
    }
    return isValid;
  });

  // - the 6 colors to use in case of "sextant" color scale
  const [
    sextantColors,
    setSextantColors,
  ] = createSignal<SextantColorArray>(['#FFFF00', '#B3DCC3', '#01A0C6', '#B8B3D8', '#F11D8C', '#FFB3B3']);

  // - the main parameters for discrete or continuous color scale
  const [colorScaleParams, setColorScaleParams] = createStore({
    hue: 10,
    chroma: 120,
    lightness: 70,
    contrast: 0.2,
    spread: 1,
  });

  let plotDiv: HTMLDivElement;

  createEffect(
    on(
      () => [
        useMeanCentering(), pts(), colorScaleType(), sextantColors(),
        nClasses(), colorScaleParams.hue, colorScaleParams.chroma, colorScaleParams.lightness,
        colorScaleParams.contrast, colorScaleParams.spread,
      ],
      () => {
        if (!plotDiv) return;
        // Clean up previous plot if any
        plotDiv!.innerHTML = '';
        if (!isTernaryComposition()) return;
        const dimensions = {
          width: 300,
          height: 300,
          margin: {
            top: 0,
            right: 0,
            bottom: 30,
            left: 0,
          },
        };
        const center = useMeanCentering()
          ? CompositionUtils.center(
            pts()
              .filter((d) => d !== null) as [number, number, number][],
          )
          : [1 / 3, 1 / 3, 1 / 3];
        const labels = [`⟵ ${targetVariable1()}`, `⟵ ${targetVariable2()}`, `${targetVariable3()} ⟶`];
        let svg;
        if (colorScaleType() === TricoloreScaleType.Sextant) {
          svg = Viz.createSextantPlot(pts(), {
            center,
            labels,
            values: sextantColors(),
            showCenter: false,
            showLines: false,
            labelPosition: 'edge',
          }, dimensions);
        } else if (colorScaleType() === TricoloreScaleType.Discrete) {
          svg = Viz.createDiscretePlot(pts(), {
            center,
            hue: colorScaleParams.hue,
            chroma: colorScaleParams.chroma,
            lightness: colorScaleParams.lightness,
            contrast: colorScaleParams.contrast,
            spread: colorScaleParams.spread,
            labels,
            showCenter: false,
            showLines: false,
            labelPosition: 'edge',
            breaks: Msqrt(nClasses()),
          }, dimensions);
        } else { // TricoloreScaleType.Continuous
          svg = Viz.createContinuousPlot(pts(), {
            center,
            hue: colorScaleParams.hue,
            chroma: colorScaleParams.chroma,
            lightness: colorScaleParams.lightness,
            contrast: colorScaleParams.contrast,
            spread: colorScaleParams.spread,
            labels,
            showCenter: false,
            showLines: false,
            labelPosition: 'edge',
          }, dimensions);
        }
        plotDiv.appendChild(svg);
      },
    ),
  );

  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(
    LL().FunctionalitiesSection.TrivariateChoroplethOptions.NewLayerName({
      variable1: targetVariable1(),
      variable2: targetVariable2(),
      variable3: targetVariable3(),
      layerName: layerDescription.name,
    }) as string,
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

    // Actually create the layer
    setTimeout(() => {
      // eslint-disable-next-line no-nested-ternary
      const params = colorScaleType() === TricoloreScaleType.Sextant
        ? { colors: sextantColors() } as TriChoroSextantOpts
        : colorScaleType() === TricoloreScaleType.Discrete
          ? { classes: nClasses(), ...unproxify(colorScaleParams) } as TriChoroDiscreteOpts
          : { ...unproxify(colorScaleParams) } as TriChoroContinuousOpts;
      const hasNoData = pts().length !== pts().filter((d) => d !== null).length;
      console.log(hasNoData);
      onClickValidate(
        layerDescription.id,
        [targetVariable1(), targetVariable2(), targetVariable3()],
        useMeanCentering(),
        colorScaleType(),
        params,
        hasNoData,
        layerName,
      );

      // Hide loading overlay
      setLoading(false);

      // Open the LayerManager to show the new layer
      openLayerManager();
    }, 0);
  };

  createEffect(
    on(
      () => [targetVariable1(), targetVariable2(), targetVariable3()],
      () => {
        setNewLayerName(
          LL().FunctionalitiesSection.TrivariateChoroplethOptions.NewLayerName({
            variable1: targetVariable1(),
            variable2: targetVariable2(),
            variable3: targetVariable3(),
            layerName: layerDescription.name,
          }) as string,
        );
      },
    ),
  );

  return <div class="portrayal-section__portrayal-options-trivariatechoropleth">
    <div class={'is-flex is-justify-content-space-between'}>
      <InputFieldSelect
        label={ `${LL().FunctionalitiesSection.CommonOptions.Variable()} 1` }
        onChange={(value) => {
          setTargetVariable1(value);
        }}
        value={ targetVariable1() }
        layout={'vertical'}
      >
        <For each={targetFields}>
          { (variable) => <option value={ variable.name }>{ variable.name }</option> }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={ `${LL().FunctionalitiesSection.CommonOptions.Variable()} 2` }
        onChange={(value) => {
          setTargetVariable2(value);
        }}
        value={ targetVariable2() }
        layout={'vertical'}
      >
        <For each={targetFields}>
          { (variable) => <option value={ variable.name }>{ variable.name }</option> }
        </For>
      </InputFieldSelect>
      <InputFieldSelect
        label={ `${LL().FunctionalitiesSection.CommonOptions.Variable()} 3` }
        onChange={(value) => {
          setTargetVariable3(value);
        }}
        value={ targetVariable3() }
        layout={'vertical'}
      >
        <For each={targetFields}>
          { (variable) => <option value={ variable.name }>{ variable.name }</option> }
        </For>
      </InputFieldSelect>
    </div>
    <Show when={!isTernaryComposition()}>
      <MessageBlock type={'danger'} useIcon={true}>
        { LL().FunctionalitiesSection.TrivariateChoroplethOptions.InformationTernaryComposition() }
      </MessageBlock>
    </Show>
    <Show when={isTernaryComposition()}>
      <InputFieldSelect
        label={ LL().FunctionalitiesSection.TrivariateChoroplethOptions.ColorScaleType() }
        onChange={(value) => { setColorScaleType(value as TricoloreScaleType); }}
        value={colorScaleType()}
      >
        <For each={Object.entries(TricoloreScaleType)}>
          {
            ([key, value]) => <option value={key}>
              {LL().FunctionalitiesSection.TrivariateChoroplethOptions[value]()}
            </option>
          }
        </For>
      </InputFieldSelect>
      <Show when={colorScaleType() === TricoloreScaleType.Discrete}>
        <InputFieldSelect
          label={ LL().ClassificationPanel.numberOfClasses() }
          onChange={(value) => { setNClasses(+value as 4 | 9 | 16); }}
          value={`${nClasses()}`}
        >
          <option value={'4'}>4</option>
          <option value={'9'}>9</option>
          <option value={'16'}>16</option>
        </InputFieldSelect>
      </Show>
      <InputFieldCheckbox
        label={ LL().FunctionalitiesSection.TrivariateChoroplethOptions.UseMeanCentering() }
        checked={useMeanCentering()}
        onChange={(value) => { setUseMeanCentering(value); }}
      />
      <Show when={colorScaleType() === TricoloreScaleType.Sextant}>
        <div class={'is-flex is-justify-content-space-evenly'}>
          <For each={[0, 1, 2, 3, 4, 5]}>
            {
              (ix) => <input type="color" value={sextantColors()[ix]} onChange={(e) => {
                const newColors = [...sextantColors()];
                newColors[ix] = e.currentTarget.value;
                setSextantColors(newColors as SextantColorArray);
              }} />
            }
          </For>
        </div>
      </Show>
      <Show when={colorScaleType() !== TricoloreScaleType.Sextant}>
        <div class={'is-flex is-justify-content-space-evenly has-text-centered'}>
          <InputFieldNumber
            label={'Hue'}
            onChange={(value) => { setColorScaleParams('hue', value); }}
            value={colorScaleParams.hue}
            min={0}
            max={360}
            step={1}
            layout={'vertical'}
            width={100}
          />
          <InputFieldNumber
            label={'Chroma'}
            onChange={(value) => { setColorScaleParams('chroma', value); }}
            value={colorScaleParams.chroma}
            min={0}
            max={200}
            step={1}
            layout={'vertical'}
            width={100}
          />
          <InputFieldNumber
            label={'Lightness'}
            onChange={(value) => { setColorScaleParams('lightness', value); }}
            value={colorScaleParams.lightness}
            min={0}
            max={100}
            step={1}
            layout={'vertical'}
            width={100}
          />
          <InputFieldNumber
            label={'Contrast'}
            onChange={(value) => { setColorScaleParams('contrast', value); }}
            value={colorScaleParams.contrast}
            min={0}
            max={1}
            step={0.1}
            layout={'vertical'}
            width={100}
          />
          <InputFieldNumber
            label={'Spread'}
            onChange={(value) => { setColorScaleParams('spread', value); }}
            value={colorScaleParams.spread}
            min={0}
            max={5}
            step={0.1}
            layout={'vertical'}
            width={100}
          />
        </div>
      </Show>
    </Show>
    <div class={'has-text-centered'} ref={plotDiv!}></div>
    <InputResultName
      value={newLayerName()}
      onKeyUp={(value) => { setNewLayerName(value); }}
      onEnter={ makePortrayal }
    />
    <ButtonValidation
      label={ LL().FunctionalitiesSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
