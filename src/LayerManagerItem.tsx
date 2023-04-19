import { JSX, Show } from 'solid-js';
import {
  FaSolidTable,
  FaSolidEye,
  FaSolidMagnifyingGlass,
  FaSolidTrash,
  FaSolidTableCells,
} from 'solid-icons/fa';
import './styles/LayerManagerItem.css';
import 'font-gis/css/font-gis.css';

const typeIcons = {
  point: 'fg-point',
  line: 'fg-polyline',
  polygon: 'fg-polygon-o',
  raster: 'fg-finish',
};

export default function LayerManagerItem(props): JSX.Element {
  return <div class="layer-manager-item">
    <div class="layer-manager-item__name">
      <span>{ props.name }</span>
    </div>
    <div class="layer-manager-item__icons">
      <div class="layer-manager-item__icons-left">
        <Show
          when={props.type === 'table'}
          fallback={<i class={typeIcons[props.type]}></i>}
        >
          <FaSolidTableCells />
        </Show>

    </div>
    <div class="layer-manager-item__icons-right">
      <Show when={props.type !== 'table'}>
        <FaSolidEye />
        <FaSolidMagnifyingGlass />
      </Show>
      <FaSolidTable />
      <FaSolidTrash />
    </div>
  </div>
  </div>;
}
