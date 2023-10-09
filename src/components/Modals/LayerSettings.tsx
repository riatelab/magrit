import { Accessor, JSX, useContext } from 'solid-js';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { createDropShadow } from '../MapRenderer/FilterDropShadow';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Types / Interfaces
import type { LayerDescription } from '../../global';

// Styles
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

function makeOnChangeDropShadow(props: LayerDescription): () => void {
  return function onChangeDropShadow() {
    // Mutate the store for the layer
    const layer = layersDescriptionStore.layers.find((l) => l.id === props.id);
    if (layer) {
      const { checked } = this;
      if (checked) {
        // Need to investigate why this is not working as expected
        // (i.e. the filter should be added automatically to the def section)
        const filter = createDropShadow(props.id);
        (document.querySelector('.map-zone svg defs') as SVGDefsElement).appendChild(filter);
      } else {
        // Same here, it should be removed automatically
        const filter = document.querySelector(`#filter-drop-shadow-${props.id}`);
        if (filter) filter.remove();
      }
      setLayersDescriptionStore(
        'layers',
        (l) => l.id === props.id,
        { dropShadow: checked },
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

function makeSettingsChoroplethPolygon(
  props: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  console.log(props);
  return <div>
    <div>

    </div>
    <div>

    </div>
    <div>

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
    <div class="field">
      <label class="label">{ LL().LayerSettings.DropShadow() }</label>
      <div class="control">
        <input
          class="checkbox"
          type="checkbox"
          onChange={makeOnChangeDropShadow(props)}
          checked={props.dropShadow}
        />
      </div>
    </div>
  </div>;
}

export default function LayerSettings(
  props,
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const { id, LL } = props; // eslint-disable-line solid/reactivity
  const layerDescription = layersDescriptionStore.layers
    .find((l) => l.id === id) as LayerDescription;
  const innerElement = {
    point: makeSettingsDefaultPoint,
    linestring: makeSettingsDefaultLine,
    polygon: makeSettingsDefaultPolygon,
  }[layerDescription.type as ('point' | 'linestring' | 'polygon')](layerDescription, LL);
  return <div class="layer-settings">
    <div class="layer-settings__title">
      { LL().LayerSettings.Name } : { layerDescription.name }
    </div>
    <br />
    <div class="layer-settings__content">
      { innerElement }
    </div>
  </div>;
}
