import { createSignal, For } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import { getPalette } from 'dicopal';
import { layersDescriptionStore, setLayersDescriptionStore } from '../store/LayersDescriptionStore';
import { getClassifier } from '../helpers/classification';
import {
  ClassificationMethods, ClassificationParameters, RepresentationTypes, VariableTypes,
} from '../global.d';
import { useI18nContext } from '../i18n/i18n-solid';
import imgQuantiles from '../assets/quantiles.png';
import imgEqualIntervals from '../assets/equal_intervals.png';
import imgQ6 from '../assets/q6.png';
import imgJenks from '../assets/jenks.png';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  classification: ClassificationMethods,
  newName: string,
) {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  const nClasses = 5;
  const values = referenceLayerDescription.data.features.map((f) => f.properties[targetVariable]);
  const classifier = new (getClassifier(classification))(values);
  const breaks = classifier.classify(nClasses);
  const colors = getPalette('RdYlGn', nClasses);

  // Prepare the layer description for the new layer
  const classificationParameters: ClassificationParameters = {
    method: classification,
    variable: targetVariable,
    breaks,
    palette: {
      name: 'RdYlGn',
      provider: 'colorbrewer',
    },
    colors,
    nodataColor: '#ffffff',
  };

  const newLayerDescription = {
    data: referenceLayerDescription.data,
    id: uuidv4(),
    name: newName,
    type: referenceLayerDescription.type,
    renderer: 'choropleth' as RepresentationTypes,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: '1px',
    strokeOpacity: 1,
    // fillColor: '#ffffff',
    fillOpacity: 1,
    classification: classificationParameters,
  };

  console.log(newLayerDescription);

  const newLayersDescriptionStore = [
    newLayerDescription,
    ...layersDescriptionStore.layers,
  ];
  setLayersDescriptionStore({
    layers: newLayersDescriptionStore,
  });
}
export default function ChoroplethSettings(props): JSX.Element {
  const { LL } = useI18nContext();

  const [targetVariable, setTargetVariable] = createSignal<string | null>(null);

  return <div class="portrayal-section__portrayal-options-choropleth">
    <div class="field">
      <label class="label">{ LL().PortrayalSection.ChoroplethOptions.Variable() }</label>
      <div class="select">
        <select onChange={ (ev) => { setTargetVariable(ev.target.value); }}>
          <For
            each={
              layersDescriptionStore.layers
                .find((l) => l.id === props.layerId)
                ?.fields.filter((variable) => variable.type === VariableTypes.ratio)
            }
          >
            { (variable) => <option value={ variable.name }>{ variable.name }</option> }
          </For>
        </select>
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().PortrayalSection.ChoroplethOptions.Classification() }</label>
      <div style={{ width: '50%', display: 'flex', 'justify-content': 'space-between' }}>
        <img src={imgQuantiles} />
        <img src={imgEqualIntervals} />
        <img src={imgQ6} />
        <img src={imgJenks} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().PortrayalSection.ResultName() }</label>
      <div class="control">
        <input class="input" type="text" placeholder="Nom de la couche" />
      </div>
    </div>
    <div class="has-text-centered">
      <button
        class="button is-success portrayal-section__button-validation"
        onClick={ () => { onClickValidate(props.layerId, targetVariable(), 'jenks', 'New name'); }}
      >
        { LL().PortrayalSection.CreateLayer() }
      </button>
    </div>

  </div>;
}
