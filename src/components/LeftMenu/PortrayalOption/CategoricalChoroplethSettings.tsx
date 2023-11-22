// Import from solid-js
import {
  createMemo,
  createSignal,
  For,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { getPalette, Palette } from 'dicopal';

// Helpers
import { generateIdLayer } from '../../../helpers/layers';
import { useI18nContext } from '../../../i18n/i18n-solid';
import { findSuitableName, isNonNull } from '../../../helpers/common';
import { VariableType } from '../../../helpers/typeDetection';
import { randomColor } from '../../../helpers/color';
import { PortrayalSettingsProps } from './common';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../../store/LayersDescriptionStore';
import { applicationSettingsStore } from '../../../store/ApplicationSettingsStore';

// Subcomponents
import InputResultName from './InputResultName.tsx';
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';
import InputFieldSelect from '../../Inputs/InputSelect.tsx';

// Types / Interfaces / Enums
import {
  CategoricalChoroplethParameters,
  ChoroplethLegendParameters,
  LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
} from '../../../global.d';

const defaultNoDataColor = '#ffffff';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newName: string,
): void {
  // The layer description of the reference layer
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId);

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  const categories = new Set();
  let hasMissing = false;

  referenceLayerDescription.data.features
    .forEach((d) => {
      const value = d.properties[targetVariable];
      if (isNonNull(value)) categories.add(value);
      else hasMissing = true;
    });

  const mapping = Array.from(categories).map((c) => [c, c, randomColor()]);

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newName,
    data: referenceLayerDescription.data,
    type: referenceLayerDescription.type,
    fields: referenceLayerDescription.fields,
    renderer: 'categorical' as RepresentationType,
    visible: true,
    strokeColor: '#000000',
    strokeWidth: '0.4px',
    strokeOpacity: 1,
    fillOpacity: 1,
    dropShadow: false,
    blurFilter: false,
    shapeRendering: referenceLayerDescription.shapeRendering,
    rendererParameters: {
      variable: targetVariable,
      noDataColor: defaultNoDataColor,
      mapping,
    } as CategoricalChoroplethParameters,
    legend: {
      // Part common to all legends
      title: {
        text: targetVariable,
        fontSize: '13px',
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'bold',
      } as LegendTextElement,
      subtitle: {
        fontSize: '12px',
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'normal',
      },
      note: {
        text: undefined,
        fontSize: '11px',
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'normal',
      },
      position: [100, 100],
      visible: true,
      roundDecimals: 1,
      backgroundRect: {
        visible: false,
      },
      // Part specific to choropleth
      type: LegendType.choropleth,
      orientation: Orientation.vertical,
      boxWidth: 45,
      boxHeight: 30,
      boxSpacing: 5,
      boxSpacingNoData: 5,
      boxCornerRadius: 0,
      labels: {
        fontSize: '11px',
        fontFamily: 'Sans-serif',
        fontColor: '#000000',
        fontStyle: 'normal',
        fontWeight: 'normal',
      } as LegendTextElement,
      noDataLabel: 'No data',
    } as ChoroplethLegendParameters,
  };

  setLayersDescriptionStore(
    produce(
      (draft) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );
}

export default function CategoricalChoroplethSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  // The fields of the layer that are of type 'ratio'
  // (i.e. the fields that can be used for the choropleth)
  const targetFields = createMemo(() => layerDescription()
    .fields?.filter((variable) => variable.type === VariableType.categorical));

  // Signals for the current component:
  // the target variable, the target layer name and the classification parameters
  const [
    targetVariable,
    setTargetVariable,
  ] = createSignal<string>(targetFields()[0].name);
  const [
    newLayerName,
    setNewLayerName,
  ] = createSignal<string>(`Categorical_${layerDescription().name}`);

  const makePortrayal = () => {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((d) => d.name),
    );
    onClickValidate(
      props.layerId,
      targetVariable(),
      newLayerName(),
    );
  };

  return <div class="portrayal-section__portrayal-options-choropleth">
    <InputFieldSelect
      label={ LL().PortrayalSection.CommonOptions.Variable() }
      onChange={(value) => { setTargetVariable(value); }}
      value={ targetVariable() }
    >
      <For each={targetFields()}>
        { (variable) => <option value={variable.name}>{variable.name}</option> }
      </For>
    </InputFieldSelect>
    <InputResultName
      onKeyUp={(value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().PortrayalSection.CreateLayer() } onClick={makePortrayal} />
  </div>;
}
