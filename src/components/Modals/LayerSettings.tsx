import { Accessor, JSX } from 'solid-js';
import { TranslationFunctions } from '../../i18n/i18n-types';
import { createDropShadow } from '../MapRenderer/FilterDropShadow';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Types / Interfaces
import type { LayerDescription } from '../../global';

// Styles
import '../../styles/LayerAndLegendSettings.css';

function makeOnChangeProp(
  props: LayerDescription,
  prop: string,
  modifier: (arg0: string) => unknown = (x) => x,
): () => void {
  return function onChangeProp() {
    // Mutate the store for the layer
    const layer = layersDescriptionStore.layers
      .find((l) => l.id === props.id);
    if (layer) {
      setLayersDescriptionStore(
        'layers',
        (l) => l.id === props.id,
        { [prop]: modifier(this.value) },
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
  return <div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.FillColor() }</label>
      <div class="control">
        <input class="color" type="color" onChange={makeOnChangeProp(props, 'fillColor')} value={props.fillColor} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeColor() }</label>
      <div class="control">
        <input class="color" type="color" onChange={makeOnChangeProp(props, 'strokeColor')} value={props.strokeColor} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.FillOpacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnChangeProp(props, 'fillOpacity')}
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
          onChange={makeOnChangeProp(props, 'strokeOpacity')}
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
          onChange={makeOnChangeProp(props, 'strokeWidth', (v) => `${v}px`)}
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
          onChange={makeOnChangeProp(props, 'pointRadius', (v) => +v)}
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
        <input class="color" type="color" onChange={makeOnChangeProp(props, 'strokeColor')} value={props.strokeColor} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeOpacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnChangeProp(props, 'strokeOpacity')}
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
          onChange={makeOnChangeProp(props, 'strokeWidth', (v) => `${v}px`)}
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
  return <div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.FillColor() }</label>
      <div class="control">
        <input class="color" type="color" onChange={makeOnChangeProp(props, 'fillColor')} value={props.fillColor} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.StrokeColor() }</label>
      <div class="control">
        <input class="color" type="color" onChange={makeOnChangeProp(props, 'strokeColor')} value={props.strokeColor} />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayerSettings.FillOpacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          onChange={makeOnChangeProp(props, 'fillOpacity')}
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
          onChange={makeOnChangeProp(props, 'strokeOpacity')}
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
          onChange={makeOnChangeProp(props, 'strokeWidth', (v) => `${v}px`)}
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
  props: {
    id: string,
    LL: Accessor<TranslationFunctions>,
  },
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
      { LL().LayerSettings.Name() } : { layerDescription.name }
    </div>
    <br />
    <div class="layer-settings__content">
      { innerElement }
    </div>
  </div>;
}
