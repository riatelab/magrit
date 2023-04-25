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

const onClickEye = (id: string) => {
  console.log('click eye on item ', id);
};

const onCLickMagnifyingGlass = (id: string) => {
  console.log('click magnifying glass on item ', id);
};

const onClickTable = (id: string) => {
  console.log('click magnifying glass on item ', id);
};

const onClickTrash = (id: string) => {
  console.log('click magnifying glass on item ', id);
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
          fallback={<i class={typeIcons[props.type]} />}
        >
          <FaSolidTableCells />
        </Show>

    </div>
    <div class="layer-manager-item__icons-right">
      <Show when={props.type !== 'table'}>
        <FaSolidEye onClick={() => { onClickEye(props.id); }} />
        <FaSolidMagnifyingGlass onClick={() => { onCLickMagnifyingGlass(props.id); }} />
      </Show>
      <FaSolidTable onClick={() => { onClickTable(props.id); }} />
      <FaSolidTrash onClick={() => { onClickTrash(props.id); }} />
    </div>
  </div>
  </div>;
}
