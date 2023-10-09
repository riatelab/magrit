import { JSX } from 'solid-js';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

export default function LegendSettings(
  props: {
    layerId: string,
    LL: unknown,
  },
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const { LL, layerId } = props; // eslint-disable-line solid/reactivity
  const layerDescription = layersDescriptionStore.layers
    .find((layer) => layer.id === layerId);
  return <div class="legend-settings">
    <div class="legend-settings__title">
      { LL().Legend.Modal.Title() }
    </div>
    <br />
    <div class="legend-settings__content">
      { }
    </div>
  </div>;
}
