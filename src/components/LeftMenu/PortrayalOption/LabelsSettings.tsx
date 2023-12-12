// Import from solid-js
import {
  createMemo,
  createSignal,
  For,
  JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../../store/LayersDescriptionStore';
import { applicationSettingsStore } from '../../../store/ApplicationSettingsStore';

// Helpers
import { useI18nContext } from '../../../i18n/i18n-solid';
import { findSuitableName } from '../../../helpers/common';
import { makeCentroidLayer } from '../../../helpers/geo';
import { generateIdLayer } from '../../../helpers/layers';
import { getPossibleLegendPosition } from '../../LegendRenderer/common.tsx';

// Subcomponents
import ButtonValidation from '../../Inputs/InputButtonValidation.tsx';
import InputResultName from './InputResultName.tsx';

// Types / Interfaces / Enums
import {
  type LabelsLegendParameters,
  type LabelsParameters,
  type LegendTextElement,
  LegendType,
  RepresentationType,
} from '../../../global.d';
import { PortrayalSettingsProps } from './common';

function onClickValidate(
  referenceLayerId: string,
  targetVariable: string,
  newLayerName: string,
): void {
  const referenceLayerDescription = layersDescriptionStore.layers
    .find((l) => l.id === referenceLayerId)!;

  if (referenceLayerDescription === undefined) {
    throw new Error('Unexpected Error: Reference layer not found');
  }

  // Convert the layer to a point layer (if it is not already a point layer)
  // in order to be able to position and display labels
  const newData = makeCentroidLayer(
    referenceLayerDescription.data,
    referenceLayerDescription.type as 'point' | 'linestring' | 'polygon',
  );

  // Store the original position of the features (we will need it
  // later if the user wants to change the position of the
  // labels manually)
  newData.features.forEach((feature) => {
    // eslint-disable-next-line no-param-reassign
    feature.geometry.originalCoordinates = feature.geometry.coordinates;
  });

  // Find a position for the legend
  const legendPosition = getPossibleLegendPosition(100, 100);

  const newLayerDescription = {
    id: generateIdLayer(),
    name: newLayerName,
    data: newData,
    type: 'point',
    fields: referenceLayerDescription.fields,
    renderer: 'labels' as RepresentationType,
    visible: true,
    // strokeColor: '#000000',
    // strokeWidth: 1,
    // strokeOpacity: 1,
    // fillColor: '#000000',
    // fillOpacity: 1,
    dropShadow: false,
    blurFilter: false,
    shapeRendering: 'auto',
    rendererParameters: {
      variable: targetVariable,
      fontSize: 12,
      fontFamily: 'Sans-serif',
      fontColor: '#000000',
      fontStyle: 'normal',
      fontWeight: 'normal',
      textAnchor: 'middle',
      textAlignment: 'middle',
      textOffset: [0, 0],
      textBuffer: {
        size: 0,
        color: '#fefefe',
      },
      movable: false,
    } as LabelsParameters,
    legend: {
      // Part common to all legends
      title: {
        text: targetVariable,
        ...applicationSettingsStore.defaultLegendSettings.title,
      } as LegendTextElement,
      subtitle: {
        text: 'This is a subtitle',
        ...applicationSettingsStore.defaultLegendSettings.subtitle,
      },
      note: {
        text: 'This is a bottom note',
        ...applicationSettingsStore.defaultLegendSettings.note,
      },
      position: legendPosition,
      visible: true,
      backgroundRect: {
        visible: false,
      },
      type: LegendType.labels,
      labels: {
        text: `${referenceLayerDescription.name} (${targetVariable})`,
        ...applicationSettingsStore.defaultLegendSettings.labels,
      } as LegendTextElement,
    } as LabelsLegendParameters,
  };

  setLayersDescriptionStore(
    produce(
      (draft) => {
        draft.layers.push(newLayerDescription);
      },
    ),
  );
}

export default function LabelsSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = createMemo(() => layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!);

  // The fields of the layer that can be used as a target variable for this portrayal
  // (i.e. all the fields)
  const targetFields = createMemo(() => layerDescription().fields);

  const [targetVariable, setTargetVariable] = createSignal<string>(targetFields()[0].name);
  const [newLayerName, setNewLayerName] = createSignal<string>(`Labels_${layerDescription().name}`);

  function makePortrayal() {
    const layerName = findSuitableName(
      newLayerName() || LL().PortrayalSection.NewLayer(),
      layersDescriptionStore.layers.map((l) => l.name),
    );

    onClickValidate(
      props.layerId,
      targetVariable(),
      layerName,
    );
  }

  return <div class="portrayal-section__portrayal-options-labels">
    <div class="field">
      <label class="label"> { LL().PortrayalSection.CommonOptions.Variable() } </label>
      <div class="select" style={{ 'max-width': '60%' }}>
        <select
          onChange={(e) => setTargetVariable(e.currentTarget.value)}
        >
          <For each={targetFields()}>
            { (variable) => <option value={ variable.name }>{ variable.name }</option> }
          </For>
        </select>
      </div>
    </div>
    <InputResultName
      onKeyUp={(value) => setNewLayerName(value)}
      onEnter={makePortrayal}
    />
    <ButtonValidation label={ LL().PortrayalSection.CreateLayer() } onClick={ makePortrayal } />
  </div>;
}
