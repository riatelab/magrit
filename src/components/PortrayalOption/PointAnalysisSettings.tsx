// Import from solid-js
import {
  createMemo,
  createSignal,
  For,
  type JSX,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Stores
import { applicationSettingsStore } from '../../store/ApplicationSettingsStore';
import { setLoading } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setPortrayalSelectionStore } from '../../store/PortrayalSelectionStore';

// Helper
import { useI18nContext } from '../../i18n/i18n-solid';
import { findSuitableName, getMinimumPrecision, isNumber } from '../../helpers/common';
import { generateIdLayer } from '../../helpers/layers';
import { generateIdLegend } from '../../helpers/legends';
import { VariableType } from '../../helpers/typeDetection';
import { getPossibleLegendPosition } from '../LegendRenderer/common.tsx';

// Subcomponents
import ButtonValidation from '../Inputs/InputButtonValidation.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputResultName from './InputResultName.tsx';
import { ChoroplethClassificationSelector } from './ChoroplethComponents.tsx';
import { openLayerManager } from '../LeftMenu/LeftMenu.tsx';

// Types
import type { PortrayalSettingsProps } from './common';
import {
  type CategoricalChoroplethBarchartLegend,
  type ChoroplethLegend,
  type ClassificationParameters,
  type LayerDescription,
  type LegendTextElement,
  LegendType,
  Orientation,
  RepresentationType,
} from '../../global.d';

function onClickValidate() {}

export default function PointAnalysisSettings(props: PortrayalSettingsProps): JSX.Element {
  const { LL } = useI18nContext();

  // The description of the layer for which we are creating the settings menu
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === props.layerId)!;

  // Signals for the current component:
  const [newLayerName, setNewLayerName] = createSignal<string>(`Choropleth_${layerDescription.name}`);

  const makePortrayal = async () => {};

  return <div class="portrayal-section__portrayal-options-choropleth">
    <InputResultName
      onKeyUp={ (value) => { setNewLayerName(value); }}
      onEnter={makePortrayal}
    />
    <ButtonValidation
      disabled={targetClassification() === undefined}
      label={ LL().PortrayalSection.CreateLayer() }
      onClick={ makePortrayal }
    />
  </div>;
}
