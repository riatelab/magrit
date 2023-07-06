import { createSignal, For } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import { getPalette } from 'dicopal';
import { layersDescriptionStore, setLayersDescriptionStore } from '../store/LayersDescriptionStore';
import { getClassifier } from '../helpers/classification';
import {
  ClassificationMethod,
  ClassificationParameters,
  LayerDescription, LegendParameters,
  RepresentationTypes,
  VariableTypes,
} from '../global.d';
import { useI18nContext } from '../i18n/i18n-solid';
import imgQuantiles from '../assets/quantiles.png';
import imgEqualIntervals from '../assets/equal_intervals.png';
import imgQ6 from '../assets/q6.png';
import imgJenks from '../assets/jenks.png';
import { isNumber } from '../helpers/common';

const defaultNoDataColor = '#ffffff';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  classification: ClassificationMethod,
  newName: string,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw Error('Unexpected Error: Reference layer not found');
  }

  const nClasses = 5;
  const values = referenceLayerDescription.data.features.map((f) => f.properties[targetVariable]);
  const classifier = new (getClassifier(classification))(values);
  const breaks = classifier.classify(nClasses);
  const pal = getPalette('OrRd', nClasses);

  const colors = values.map((v) => (
    isNumber(v)
      ? pal.colors[classifier.getClass(v)]
      : defaultNoDataColor
  ));

  // Prepare the layer description for the new layer
  const newLayerDescription = {
    id: uuidv4(),
    name: newName,
    data: referenceLayerDescription.data,
    type: referenceLayerDescription.type,
    fields: referenceLayerDescription.fields,
    renderer: 'choropleth' as RepresentationTypes,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: '1px',
    strokeOpacity: 1,
    // fillColor: '#ffffff',
    fillOpacity: 1,
    classification: {
      method: classification,
      variable: targetVariable,
      breaks,
      palette: {
        name: 'OrRd',
        provider: 'colorbrewer',
      },
      colors,
      classes: nClasses,
      nodataColor: defaultNoDataColor,
    } as ClassificationParameters,
    legend: {
      visible: true,
      position: [100, 100],
    } as LegendParameters,
  } as LayerDescription;

  console.log(newLayerDescription);

  setLayersDescriptionStore({
    layers: [
      newLayerDescription,
      ...layersDescriptionStore.layers,
    ],
  });
}
export default function ChoroplethSettings(props): JSX.Element {
  const { LL } = useI18nContext();

  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId);

  if (!layerDescription) {
    throw Error('Unexpected Error: Layer not found');
  }

  const targetFields = layerDescription
    .fields.filter((variable) => variable.type === VariableTypes.ratio);
  // Signals for the current component:
  // the target variable, the target layer name and the classification method
  const [targetVariable, setTargetVariable] = createSignal<string>(targetFields[0].name);
  const [targetLayerName, setTargetLayerName] = createSignal<string | null>(null);
  const [
    targetClassification,
    setTargetClassification,
  ] = createSignal<ClassificationMethod | null>(null);

  return <div class="portrayal-section__portrayal-options-choropleth">
    <div class="field">
      <label class="label">{ LL().PortrayalSection.ChoroplethOptions.Variable() }</label>
      <div class="select">
        <select onChange={ (ev) => { setTargetVariable(ev.target.value); }}>
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
          src={imgQuantiles}
          onClick={ () => { setTargetClassification(ClassificationMethod.quantile); }}
        />
        <img
          src={imgEqualIntervals}
          onClick={ () => { setTargetClassification(ClassificationMethod.equalInterval); }}
        />
        <img
          src={imgQ6}
          onClick={ () => { setTargetClassification(ClassificationMethod.q6); }}
        />
        <img
          src={imgJenks}
          onClick={ () => { setTargetClassification(ClassificationMethod.jenks); }}
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
