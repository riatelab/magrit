import { For, JSX } from 'solid-js';
import { globalStore } from '../../store/GlobalStore';
import { LayerDescription, ProportionalSymbolsSymbolType } from '../../global.d';
import { isNumber } from '../../helpers/common';

const PropSizer = function PropSizer(
  fixedValue: number,
  fixedSize: number,
  symbolType: ProportionalSymbolsSymbolType,
) {
  this.fixedValue = fixedValue;
  const { sqrt, abs } = Math;
  if (symbolType === ProportionalSymbolsSymbolType.circle) {
    const { PI } = Math;
    this.smax = fixedSize * fixedSize * PI;
    this.scale = (val) => sqrt(abs(val) * this.smax / this.fixedValue) / PI;
    this.get_value = (size) => ((size * PI) ** 2) / this.smax * this.fixedValue;
  } else if (symbolType === ProportionalSymbolsSymbolType.line) {
    this.smax = fixedSize;
    this.scale = (val) => abs(val) * this.smax / this.fixedValue;
    this.get_value = (size) => size / this.smax * this.fixedValue;
  } else { // symbolType === ProportionalSymbolsSymbolType.square
    this.smax = fixedSize * fixedSize;
    this.scale = (val) => sqrt(abs(val) * this.smax / this.fixedValue);
    this.get_value = (size) => (size ** 2) / this.smax * this.fixedValue;
  }
};

export default function proportionalSymbolsRenderer(
  layerDescription: LayerDescription,
): JSX.Element {
  return <g
    id={layerDescription.name}
    class="layer proportional-symbols"
    visibility={layerDescription.visible ? undefined : 'hidden'}
    fill-opacity={layerDescription.fillOpacity}
    stroke={layerDescription.strokeColor}
    stroke-width={layerDescription.strokeWidth}
    stroke-opacity={layerDescription.strokeOpacity}
    stroke-linecap="round"
    stroke-linejoin="round"
    filter={layerDescription.dropShadow ? `url(#filter-drop-shadow-${layerDescription.id})` : undefined}
  >
    <For each={layerDescription.data.features}>
      {
        (feature) => <circle></circle>
      }
    </For>
  </g>;
}