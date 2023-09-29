// Import from solid-js
import { createEffect, createSignal, For } from 'solid-js';
import { FaSolidCircleCheck } from 'solid-icons/fa';

// Imports from other packages
import { v4 as uuidv4 } from 'uuid';
import { getPalette, Palette } from 'dicopal';
import {
  quantile, equal, jenks, q6,
} from 'statsbreaks';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../../store/LayersDescriptionStore';
import { setClassificationPanelStore } from '../../../store/ClassificationPanelStore';
import { applicationSettingsStore } from '../../../store/ApplicationSettingsStore';

// Helper functions
import { useI18nContext } from '../../../i18n/i18n-solid';
import { noop } from '../../../helpers/classification';
import { isNumber } from '../../../helpers/common';

// Subcomponents
import ResultNameInput from './ResultNameInput.tsx';

// Assets
import imgQuantiles from '../../../assets/quantiles.png';
import imgEqualIntervals from '../../../assets/equal_intervals.png';
import imgQ6 from '../../../assets/q6.png';
import imgJenks from '../../../assets/jenks.png';
import imgMoreOption from '../../../assets/buttons2.svg';

// Types
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

// eslint-disable-next-line prefer-destructuring
const defaultColorScheme = applicationSettingsStore.defaultColorScheme;
const defaultNoDataColor = '#ffffff';
const defaultNumberOfClasses = 6;
const defaultPal = getPalette(defaultColorScheme, defaultNumberOfClasses) as Palette;

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
    dropShadow: true,
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

  // The description of the layer for which we are creating the settings menu
  const collectLayerDescription = () => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId);

  let layerDescription = collectLayerDescription();

  // This should never happen...
  if (!layerDescription) {
    throw Error('Unexpected Error: Layer not found');
  }

  const collectTargetFields = () => layerDescription
    .fields?.filter((variable) => variable.type === VariableType.ratio);

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth)
  let targetFields = collectTargetFields();

  // This should never happen either...
  if (!targetFields || targetFields.length === 0) {
    throw Error('Unexpected Error: No ratio field found');
  }

  // Signals for the current component:
  // the target variable, the target layer name and the classification parameters
  const [targetVariable, setTargetVariable] = createSignal<string>(targetFields[0].name);
  const [newLayerName, setNewLayerName] = createSignal<string>(`Choropleth_${layerDescription.name}`);

  const collectValues = () => layerDescription.data.features
    .map((f) => f.properties[targetVariable()])
    .filter((d) => isNumber(d))
    .map((d) => +d) as number[];

  // Collect the values of the target variable (only those that are numbers)
  let values = collectValues();

  // We need to track changes to the current layerDescription
  // (and so the target fields and values)
  // if the user changes the target variable or changes the types
  // of the fields of the layer while this menu is open.
  // Todo: maybe we should just unmount the component when this pane is collapsed?
  //  (so changing the type of the field, on another pane, wont mess with portrayal settings)
  createEffect(() => {
    console.log('inside choroplethSettings createEffect');
    layerDescription = collectLayerDescription();
    if (!layerDescription) {
      throw Error('Unexpected Error: Layer not found');
    }
    targetFields = collectTargetFields();
    if (!targetFields || targetFields.length === 0) {
      throw Error('Unexpected Error: No ratio field found');
    }
    values = collectValues();
  });

  const [
    targetClassification,
    setTargetClassification,
  ] = createSignal<ClassificationParameters>({
    variable: targetVariable(), // eslint-disable-line solid/reactivity
    method: ClassificationMethod.quantiles,
    classes: defaultNumberOfClasses,
    breaks: quantile(values, { nb: defaultNumberOfClasses, precision: null }),
    palette: defaultPal,
    nodataColor: defaultNoDataColor,
    entitiesByClass: [],
  } as ClassificationParameters);

  const makePortrayal = () => {
    onClickValidate(
      props.layerId,
      targetVariable(),
      targetClassification(),
      newLayerName() || LL().PortrayalSection.NewLayer(),
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
            classes: defaultNumberOfClasses,
            breaks: quantile(values, { nb: defaultNumberOfClasses, precision: null }),
            palette: defaultPal,
            nodataColor: defaultNoDataColor,
            entitiesByClass: [],
          } as ClassificationParameters);
        }}>
          <For each={collectTargetFields()}>
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
          alt={ LL().ClassificationPanel.classificationMethods.equalInterval() }
          title={ LL().ClassificationPanel.classificationMethods.equalInterval() }
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
          alt={ LL().ClassificationPanel.classificationMethods.q6() }
          title={ LL().ClassificationPanel.classificationMethods.q6() }
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
          alt={ LL().ClassificationPanel.classificationMethods.jenks() }
          title={ LL().ClassificationPanel.classificationMethods.jenks() }
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
          alt={ LL().ClassificationPanel.classificationMethods.manual() }
          title={ LL().ClassificationPanel.classificationMethods.manual() }
          onClick={ () => {
            setClassificationPanelStore({
              show: true,
              layerName: newLayerName(),
              variableName: targetVariable(),
              series: layerDescription.data.features.map((f) => f.properties[targetVariable()]),
              nClasses: 6,
              colorScheme: defaultColorScheme,
              invertColorScheme: false,
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
    <ResultNameInput
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <div class="has-text-centered">
      <button
        class="button is-success portrayal-section__button-validation"
        onClick={makePortrayal}
      >
        { LL().PortrayalSection.CreateLayer() }
      </button>
    </div>
  </div>;
}
