import { Accessor, JSX } from 'solid-js';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import '../../styles/LayerSettings.css';

function makeOnChangeFillColor(props: LayerDescription): () => void {
  return function onChangeFillColor() {
    // Mutate the store for the layer
    const layer = layersDescriptionStore.layers.find((l) => l.id === props.id);
    if (layer) {
      setLayersDescriptionStore(
        'layers',
        (l) => l.id === props.id,
        { fillColor: this.value },
      );
    }
  };
}

function makeOnChangeStrokeColor(props: LayerDescription): () => void {
  return function onChangeStrokeColor() {
    // Mutate the store for the layer
    const layer = layersDescriptionStore.layers.find((l) => l.id === props.id);
    if (layer) {
      setLayersDescriptionStore(
        'layers',
        (l) => l.id === props.id,
        { strokeColor: this.value },
      );
    }
  };
}

function makeOnChangeFillOpacity(props: LayerDescription): () => void {
  return function onChangeFillOpacity() {
    // Mutate the store for the layer
    const layer = layersDescriptionStore.layers.find((l) => l.id === props.id);
    if (layer) {
      setLayersDescriptionStore(
        'layers',
        (l) => l.id === props.id,
        { fillOpacity: this.value },
      );
    }
  };
}

function makeOnChangeStrokeOpacity(props: LayerDescription): () => void {
  return function onChangeStrokeOpacity() {
    // Mutate the store for the layer
    const layer = layersDescriptionStore.layers.find((l) => l.id === props.id);
    if (layer) {
      setLayersDescriptionStore(
        'layers',
        (l) => l.id === props.id,
        { strokeOpacity: this.value },
      );
    }
  };
}

function makeOnchangeStrokeWidth(props: LayerDescription): () => void {
  return function onChangeStrokeWidth() {
    // Mutate the store for the layer
    const layer = layersDescriptionStore.layers.find((l) => l.id === props.id);
    if (layer) {
      setLayersDescriptionStore(
        'layers',
        (l) => l.id === props.id,
        { strokeWidth: `${this.value}px` },
      );
    }
  };
}

function makeOnchangePointRadius(props: LayerDescription): () => void {
  return function onChangePointRadius() {
    // Mutate the store for the layer
    const layer = layersDescriptionStore.layers.find((l) => l.id === props.id);
    if (layer) {
      setLayersDescriptionStore(
        'layers',
        (l) => l.id === props.id,
        { pointRadius: +this.value },
      );
    }
  };
}
function makeSettingsDefaultPoint(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  console.log(props);
  console.log(props.strokeColor, props.fillColor);
  return <div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.FillColor() }</label>
      <div class="control">
        <input class="color" type="color" onChange={makeOnChangeFillColor(props)} value={props.fillColor} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeColor() }</label>
      <div class="control">
        <input class="color" type="color" onChange={makeOnChangeStrokeColor(props)} value={props.strokeColor} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.FillOpacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnChangeFillOpacity(props)}
          value={props.fillOpacity}
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeOpacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnChangeStrokeOpacity(props)}
          value={props.strokeOpacity}
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeWidth() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnchangeStrokeWidth(props)}
          value={+props.strokeWidth.replace('px', '')}
          min="0"
          max="10"
          step="0.1"
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.PointRadius() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnchangePointRadius(props)}
          value={props.pointRadius}
          min="1"
          max="20"
          step="1"
        />
      </div>
    </div>
  </div>;
}

function makeSettingsDefaultLine(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  return <div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeColor() }</label>
      <div class="control">
        <input class="color" type="color" onChange={makeOnChangeStrokeColor(props)} value={props.strokeColor} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeOpacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnChangeStrokeOpacity(props)}
          value={props.strokeOpacity}
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeWidth() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnchangeStrokeWidth(props)}
          value={+props.strokeWidth.replace('px', '')}
          min="0"
          max="10"
          step="0.1"
        />
      </div>
    </div>
  </div>;
}

function makeSettingsDefaultPolygon(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  console.log(props);
  console.log(props.strokeColor, props.fillColor);
  return <div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.FillColor() }</label>
      <div class="control">
        <input class="color" type="color" onChange={makeOnChangeFillColor(props)} value={props.fillColor} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeColor() }</label>
      <div class="control">
        <input class="color" type="color" onChange={makeOnChangeStrokeColor(props)} value={props.strokeColor} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.FillOpacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnChangeFillOpacity(props)}
          value={props.fillOpacity}
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeOpacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnChangeStrokeOpacity(props)}
          value={props.strokeOpacity}
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeWidth() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnchangeStrokeWidth(props)}
          value={+props.strokeWidth.replace('px', '')}
          min="0"
          max="10"
          step="0.1"
        />
      </div>
    </div>
  </div>;
}

export default function LayerSettings(
  props,
): JSX.Element {
  const { id, LL } = props;
  const layerDescription = layersDescriptionStore.layers.find((l) => l.id === id);
  console.log(layerDescription, LL);
  const innerElement = {
    point: makeSettingsDefaultPoint,
    line: makeSettingsDefaultLine,
    polygon: makeSettingsDefaultPolygon,
  }[layerDescription.type](layerDescription, LL);
  return <div class="layer-settings">
    <div class="layer-settings__title">
      { LL().LayerSettings.Name } : { layerDescription.name }
    </div>
    <br></br>
    <div class="layer-settings__content">
      { innerElement }
    </div>
  </div>;
}
