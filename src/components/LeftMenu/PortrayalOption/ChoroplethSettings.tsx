import { createEffect, createSignal, For } from 'solid-js';

import { v4 as uuidv4 } from 'uuid';
import { getPalette, Palette } from 'dicopal';
import {
  quantile, equal, jenks, q6,
} from 'statsbreaks';

import { layersDescriptionStore, setLayersDescriptionStore } from '../../../store/LayersDescriptionStore';
import { setClassificationPanelStore } from '../../../store/ClassificationPanelStore';

import { noop } from '../../../helpers/classification';
import { isNumber } from '../../../helpers/common';

import { useI18nContext } from '../../../i18n/i18n-solid';

import imgQuantiles from '../../../assets/quantiles.png';
import imgEqualIntervals from '../../../assets/equal_intervals.png';
import imgQ6 from '../../../assets/q6.png';
import imgJenks from '../../../assets/jenks.png';
import imgMoreOption from '../../../assets/buttons2.svg';

import {
  ChoroplethLegendParameters,
  ClassificationMethod,
  ClassificationParameters,
  LayerDescription,
  LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
  VariableType,
} from '../../../global.d';

interface ChoroplethSettingsProps {
  layerId: string;
}

const defaultNoDataColor = '#ffffff';
const defaultNumberOfClasses = 6;
const defaultPal = getPalette('OrRd', defaultNumberOfClasses) as Palette;

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  classification: ClassificationParameters,
  newName: string,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw Error('Unexpected Error: Reference layer not found');
  }

  // if (!pal) {
  //   throw Error('Unexpected Error: Palette not found');
  // }

  // Prepare the layer description for the new layer
  const newLayerDescription = {
    id: uuidv4(),
    name: newName,
    data: referenceLayerDescription.data,
    type: referenceLayerDescription.type,
    fields: referenceLayerDescription.fields,
    renderer: 'choropleth' as RepresentationType,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: '1px',
    strokeOpacity: 1,
    // fillColor: '#ffffff',
    fillOpacity: 1,
    classification,
    legend: {
      title: {
        text: targetVariable,
        fontSize: '13px',
        fontFamily: 'Arial',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'bold',
      } as LegendTextElement,
      type: LegendType.choropleth,
      position: [100, 100],
      visible: true,
      roundDecimals: 2,
      orientation: Orientation.horizontal,
      boxWidth: 40,
      boxHeight: 40,
      boxSpacing: 4,
      boxCornerRadius: 10,
      note: {
        text: 'Wesh yo',
      },
      labels: {
        fontSize: '12px',
        fontFamily: 'Arial',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'normal',
      } as LegendTextElement,
    } as ChoroplethLegendParameters,
  } as LayerDescription;

  console.log(newLayerDescription);

  setLayersDescriptionStore({
    layers: [
      newLayerDescription,
      ...layersDescriptionStore.layers,
    ],
  });
}
export default function ChoroplethSettings(props: ChoroplethSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId);

  if (!layerDescription) {
    throw Error('Unexpected Error: Layer not found');
  }

  const targetFields = layerDescription
    .fields?.filter((variable) => variable.type === VariableType.ratio);

  if (!targetFields || targetFields.length === 0) {
    throw Error('Unexpected Error: No ratio field found');
  }

  // Signals for the current component:
  // the target variable, the target layer name and the classification parameters
  const [targetVariable, setTargetVariable] = createSignal<string>(targetFields![0].name);
  const [targetLayerName, setTargetLayerName] = createSignal<string>(layerDescription.name);

  let values = layerDescription.data.features
    .map((f) => f.properties[targetVariable()])
    .filter((d) => isNumber(d))
    .map((d) => +d) as number[];

  // We want to change 'values' only if the target variable changes
  createEffect(() => {
    values = layerDescription.data.features
      .map((f) => f.properties[targetVariable()])
      .filter((d) => isNumber(d))
      .map((d) => +d) as number[];
  });

  const [
    targetClassification,
    setTargetClassification,
  ] = createSignal<ClassificationParameters>({
    variable: targetVariable(), // eslint-disable-line solid/reactivity
    method: ClassificationMethod.quantile,
    classes: defaultNumberOfClasses,
    breaks: quantile(values, { nb: defaultNumberOfClasses, precision: null }),
    palette: defaultPal,
    nodataColor: defaultNoDataColor,
    entitiesByClass: [],
  } as ClassificationParameters);

  return <div class="portrayal-section__portrayal-options-choropleth">
    <div class="field">
      <label class="label">{ LL().PortrayalSection.ChoroplethOptions.Variable() }</label>
      <div class="select">
        <select onChange={ (ev) => {
          setTargetVariable(ev.target.value);
          setTargetClassification({
            variable: targetVariable(), // eslint-disable-line solid/reactivity
            method: ClassificationMethod.quantile,
            classes: defaultNumberOfClasses,
            breaks: quantile(values, { nb: defaultNumberOfClasses, precision: null }),
            palette: defaultPal,
            nodataColor: defaultNoDataColor,
            entitiesByClass: [],
          } as ClassificationParameters);
        }}>
          <For each={targetFields}>
            { (variable) => <option value={ variable.name }>{ variable.name }</option> }
          </For>
        </select>
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().PortrayalSection.ChoroplethOptions.Classification() }</label>
      <div style={{ width: '50%', display: 'flex', 'justify-content': 'space-between' }}>
        <img
          class={`mini-button${targetClassification().method === ClassificationMethod.quantile ? ' selected' : ''}`}
          src={imgQuantiles}
          alt="Quantiles"
          onClick={ () => {
            setTargetClassification({
              variable: targetVariable(), // eslint-disable-line solid/reactivity
              method: ClassificationMethod.quantile,
              classes: defaultNumberOfClasses,
              breaks: quantile(values, { nb: defaultNumberOfClasses, precision: null }),
              palette: defaultPal,
              nodataColor: defaultNoDataColor,
              entitiesByClass: [],
            } as ClassificationParameters);
          }}
        />
        <img
          class={`mini-button${targetClassification().method === ClassificationMethod.equalInterval ? ' selected' : ''}`}
          src={imgEqualIntervals}
          alt="Equal intervals"
          onClick={ () => {
            setTargetClassification({
              variable: targetVariable(), // eslint-disable-line solid/reactivity
              method: ClassificationMethod.equalInterval,
              classes: defaultNumberOfClasses,
              breaks: equal(values, { nb: defaultNumberOfClasses, precision: null }),
              palette: defaultPal,
              nodataColor: defaultNoDataColor,
              entitiesByClass: [],
            } as ClassificationParameters);
          }}
        />
        <img
          class={`mini-button${targetClassification().method === ClassificationMethod.q6 ? ' selected' : ''}`}
          src={imgQ6}
          alt="Q6"
          onClick={ () => {
            setTargetClassification({
              variable: targetVariable(), // eslint-disable-line solid/reactivity
              method: ClassificationMethod.q6,
              classes: defaultNumberOfClasses,
              breaks: q6(values, { nb: defaultNumberOfClasses, precision: null }),
              palette: defaultPal,
              nodataColor: defaultNoDataColor,
              entitiesByClass: [],
            } as ClassificationParameters);
          }}
        />
        <img
          class={`mini-button${targetClassification().method === ClassificationMethod.jenks ? ' selected' : ''}`}
          src={imgJenks}
          alt="Jenks"
          onClick={ () => {
            setTargetClassification({
              variable: targetVariable(), // eslint-disable-line solid/reactivity
              method: ClassificationMethod.jenks,
              classes: defaultNumberOfClasses,
              breaks: jenks(values, { nb: defaultNumberOfClasses, precision: null }),
              palette: defaultPal,
              nodataColor: defaultNoDataColor,
              entitiesByClass: [],
            } as ClassificationParameters);
          }}
        />
        <img
          class={`mini-button${targetClassification().method === ClassificationMethod.manual ? ' selected' : ''}`}
          src={imgMoreOption}
          onClick={ () => {
            setClassificationPanelStore({
              show: true,
              layerName: targetLayerName(),
              variableName: targetVariable(),
              series: layerDescription.data.features.map((f) => f.properties[targetVariable()]),
              nClasses: 6,
              colorScheme: 'OrRd',
              invertColorScheme: false,
              onCancel: noop,
              onConfirm: (classification: ClassificationParameters) => {
                setTargetClassification(classification);
              },
            });
          }}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().PortrayalSection.ResultName() }</label>
      <div class="control">
        <input class="input" type="text" placeholder="Nom de la couche" onKeyUp={ (ev) => { setTargetLayerName(ev.currentTarget.value); }}/>
      </div>
    </div>
    <div class="has-text-centered">
      <button
        class="button is-success portrayal-section__button-validation"
        onClick={
          () => {
            onClickValidate(
              props.layerId,
              targetVariable(),
              targetClassification(),
              targetLayerName() || LL().PortrayalSection.NewLayer(),
            );
          }
        }
      >
        { LL().PortrayalSection.CreateLayer() }
      </button>
    </div>
  </div>;
}
