// Import from solid-js
import {
  createMemo, createSignal, For,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { getPalette, Palette } from 'dicopal';
import {
  quantile, equal, jenks, q6,
} from 'statsbreaks';
import { FaSolidCircleCheck } from 'solid-icons/fa';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../../store/LayersDescriptionStore';
import { setClassificationPanelStore } from '../../../store/ClassificationPanelStore';
import { applicationSettingsStore } from '../../../store/ApplicationSettingsStore';

// Helper
import { useI18nContext } from '../../../i18n/i18n-solid';
import { noop } from '../../../helpers/classification';
import { findSuitableName, isNumber } from '../../../helpers/common';
import d3 from '../../../helpers/d3-custom';
import { generateIdLayer } from '../../../helpers/layers';
import { Mmin } from '../../../helpers/math';
import { VariableType } from '../../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../../LegendRenderer/common.tsx';

// Subcomponents
import InputResultName from './InputResultName.tsx';
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';

// Assets
import imgQuantiles from '../../../assets/quantiles.png';
import imgEqualIntervals from '../../../assets/equal_intervals.png';
import imgQ6 from '../../../assets/q6.png';
import imgJenks from '../../../assets/jenks.png';
import imgMoreOption from '../../../assets/buttons2.svg';

// Types
import { PortrayalSettingsProps } from './common';
import {
  type ChoroplethLegendParameters,
  type ClassificationParameters,
  type LayerDescription,
  type LegendTextElement,
  ClassificationMethod,
  LegendType,
  Orientation,
  RepresentationType,
} from '../../../global.d';

// eslint-disable-next-line prefer-destructuring
const defaultColorScheme = applicationSettingsStore.defaultColorScheme;
const defaultNoDataColor = '#ffffff';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  classification: ClassificationParameters,
  newName: string,
  noteContent: string,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(120, 340);

  // Prepare the layer description for the new layer
  const newLayerDescription = {
    id: generateIdLayer(),
    name: newName,
    data: referenceLayerDescription.data,
    type: referenceLayerDescription.type,
    fields: referenceLayerDescription.fields,
    renderer: 'choropleth' as RepresentationType,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: 0.4,
    strokeOpacity: 1,
    fillOpacity: 1,
    dropShadow: false,
    blurFilter: false,
    shapeRendering: referenceLayerDescription.shapeRendering,
    rendererParameters: classification,
    legend: {
      // Part common to all legends
      title: {
        text: targetVariable,
        fontSize: 13,
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'bold',
      } as LegendTextElement,
      subtitle: {
        fontSize: 12,
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'normal',
      },
      note: {
        text: noteContent,
        fontSize: 11,
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'normal',
      },
      position: legendPosition,
      visible: true,
      roundDecimals: 1,
      backgroundRect: {
        visible: false,
      },
      // Part specific to choropleth
      type: LegendType.choropleth,
      orientation: Orientation.vertical,
      boxWidth: 30,
      boxHeight: 30,
      boxSpacing: 5,
      boxSpacingNoData: 10,
      boxCornerRadius: 20,
      labels: {
        fontSize: 11,
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'normal',
      } as LegendTextElement,
      noDataLabel: 'No data',
      stroke: false,
      tick: false,
    } as ChoroplethLegendParameters,
  } as LayerDescription;

  if (newLayerDescription.type === 'point') {
    // We also need to transfert the pointRadius parameter
    newLayerDescription.pointRadius = referenceLayerDescription.pointRadius || 5;
  }

  setLayersDescriptionStore(
    produce(
      (draft) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );
}
export default function ChoroplethSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth)
  const targetFields = createMemo(() => layerDescription()
    .fields?.filter((variable) => variable.type === VariableType.ratio));

  // Signals for the current component:
  // the target variable, the target layer name and the classification parameters
  const [targetVariable, setTargetVariable] = createSignal<string>(targetFields()[0].name);
  const [newLayerName, setNewLayerName] = createSignal<string>(`Choropleth_${layerDescription().name}`);

  // Collect the values of the target variable (only those that are numbers)
  const values = createMemo(() => layerDescription().data.features
    .map((f) => f.properties[targetVariable()])
    .filter((d) => isNumber(d))
    .map((d) => +d) as number[]);

  const [
    noDataColor,
    setNoDataColor,
  ] = createSignal<string>(defaultNoDataColor);
  const numberOfClasses = createMemo(() => Mmin(d3.thresholdSturges(values()), 9));

  const pal = createMemo(() => getPalette(defaultColorScheme, numberOfClasses()) as Palette);

  const [
    targetClassification,
    setTargetClassification,
  ] = createSignal<ClassificationParameters>({
    variable: targetVariable(), // eslint-disable-line solid/reactivity
    method: ClassificationMethod.quantiles,
    classes: numberOfClasses(),
    breaks: quantile(values(), { nb: numberOfClasses(), precision: null }),
    palette: pal(),
    noDataColor: noDataColor(),
    entitiesByClass: [],
    reversePalette: false,
  } as ClassificationParameters);

  const makePortrayal = () => {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );
    onClickValidate(
      props.layerId,
      targetVariable(),
      targetClassification(),
      layerName,
      LL().ClassificationPanel
        .classificationMethodLegendDescriptions[targetClassification().method](),
    );
  };

  return <div class="portrayal-section__portrayal-options-choropleth">
    <div class="field">
      <label class="label">{ LL().PortrayalSection.CommonOptions.Variable() }</label>
      <div class="select" style={{ 'max-width': '60%' }}>
        <select onChange={ (ev) => {
          setTargetVariable(ev.target.value);
          setTargetClassification({
            variable: targetVariable(), // eslint-disable-line solid/reactivity
            method: ClassificationMethod.quantiles,
            classes: numberOfClasses(),
            breaks: quantile(values(), { nb: numberOfClasses(), precision: null }),
            palette: pal(),
            noDataColor: defaultNoDataColor,
            entitiesByClass: [],
            reversePalette: false,
          } as ClassificationParameters);
        }}>
          <For each={targetFields()}>
            { (variable) => <option value={ variable.name }>{ variable.name }</option> }
          </For>
        </select>
      </div>
    </div>
    <div class="field-block">
      <label class="label">{ LL().PortrayalSection.ChoroplethOptions.Classification() }</label>
      <div style={{
        width: '50%', display: 'flex', 'justify-content': 'space-between', margin: 'auto',
      }}>
        <img
          class={`mini-button${targetClassification().method === ClassificationMethod.quantiles ? ' selected' : ''}`}
          src={imgQuantiles}
          alt={ LL().ClassificationPanel.classificationMethods.quantiles() }
          title={ LL().ClassificationPanel.classificationMethods.quantiles() }
          onClick={ () => {
            setTargetClassification({
              variable: targetVariable(), // eslint-disable-line solid/reactivity
              method: ClassificationMethod.quantiles,
              classes: numberOfClasses(),
              breaks: quantile(values(), { nb: numberOfClasses(), precision: null }),
              palette: pal(),
              noDataColor: defaultNoDataColor,
              entitiesByClass: [],
              reversePalette: false,
            } as ClassificationParameters);
          }}
        />
        <img
          class={`mini-button${targetClassification().method === ClassificationMethod.equalIntervals ? ' selected' : ''}`}
          src={imgEqualIntervals}
          alt={ LL().ClassificationPanel.classificationMethods.equalIntervals() }
          title={ LL().ClassificationPanel.classificationMethods.equalIntervals() }
          onClick={ () => {
            setTargetClassification({
              variable: targetVariable(), // eslint-disable-line solid/reactivity
              method: ClassificationMethod.equalIntervals,
              classes: numberOfClasses(),
              breaks: equal(values(), { nb: numberOfClasses(), precision: null }),
              palette: pal(),
              noDataColor: defaultNoDataColor,
              entitiesByClass: [],
              reversePalette: false,
            } as ClassificationParameters);
          }}
        />
        <img
          class={`mini-button${targetClassification().method === ClassificationMethod.q6 ? ' selected' : ''}`}
          src={imgQ6}
          alt={ LL().ClassificationPanel.classificationMethods.q6() }
          title={ LL().ClassificationPanel.classificationMethods.q6() }
          onClick={ () => {
            setTargetClassification({
              variable: targetVariable(), // eslint-disable-line solid/reactivity
              method: ClassificationMethod.q6,
              classes: 6,
              breaks: q6(values(), { precision: null }),
              palette: getPalette(defaultColorScheme, 6) as Palette,
              noDataColor: defaultNoDataColor,
              entitiesByClass: [],
              reversePalette: false,
            } as ClassificationParameters);
          }}
        />
        <img
          class={`mini-button${targetClassification().method === ClassificationMethod.jenks ? ' selected' : ''}`}
          src={imgJenks}
          alt={ LL().ClassificationPanel.classificationMethods.jenks() }
          title={ LL().ClassificationPanel.classificationMethods.jenks() }
          onClick={ () => {
            setTargetClassification({
              variable: targetVariable(), // eslint-disable-line solid/reactivity
              method: ClassificationMethod.jenks,
              classes: numberOfClasses(),
              breaks: jenks(values(), { nb: numberOfClasses(), precision: null }),
              palette: pal(),
              noDataColor: defaultNoDataColor,
              entitiesByClass: [],
              reversePalette: false,
            } as ClassificationParameters);
          }}
        />
        <img
          class={`mini-button${targetClassification().method === ClassificationMethod.manual ? ' selected' : ''}`}
          src={imgMoreOption}
          alt={ LL().ClassificationPanel.classificationMethods.manual() }
          title={ LL().ClassificationPanel.classificationMethods.manual() }
          onClick={ () => {
            setClassificationPanelStore({
              show: true,
              layerName: newLayerName(),
              variableName: targetVariable(),
              series: layerDescription().data.features.map((f) => f.properties[targetVariable()]),
              nClasses: numberOfClasses(),
              colorScheme: defaultColorScheme,
              invertColorScheme: false,
              noDataColor: targetClassification().noDataColor,
              onCancel: noop,
              onConfirm: (classification: ClassificationParameters) => {
                setTargetClassification(classification);
              },
            });
          }}
        />
      </div>
      <div style={{
        display: 'flex', 'align-items': 'center', margin: '10px auto auto auto', 'justify-content': 'center',
      }}>
        <FaSolidCircleCheck fill={'green'} style={{ 'margin-right': '10px' }} />
        { LL().ClassificationPanel.classificationMethods[targetClassification().method]() }
        , {
          // eslint-disable-next-line max-len
          LL().PortrayalSection.ChoroplethOptions.CurrentNumberOfClasses(targetClassification().classes) }
      </div>
    </div>
    <InputResultName
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().PortrayalSection.CreateLayer() } onClick={ makePortrayal } />
  </div>;
}
