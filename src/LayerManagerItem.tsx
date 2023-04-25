import { JSX, Show } from 'solid-js';
import {
  FaSolidTable,
  FaSolidEye,
  FaSolidMagnifyingGlass,
  FaSolidTrash,
  FaSolidTableCells,
} from 'solid-icons/fa';
import { layersDescriptionStore, setLayersDescriptionStore } from './store/LayersDescriptionStore';
import './styles/LayerManagerItem.css';
import 'font-gis/css/font-gis.css';

const typeIcons: { polygon: string; line: string; raster: string; point: string } = {
  point: 'fg-point',
  line: 'fg-polyline',
  polygon: 'fg-polygon-o',
  raster: 'fg-finish',
};

const onClickEye = (id: number) => {
  console.log('click eye on item ', id);
};

const onCLickMagnifyingGlass = (id: number) => {
  console.log('click magnifying glass on item ', id);
};

const onClickTable = (id: number) => {
  console.log('click table on item ', id);
};

const onClickTrash = (id: number) => {
  console.log('click trash on item ', id);
  const layers = layersDescriptionStore.layers
    .filter((layerDescription) => layerDescription.id !== id);
  setLayersDescriptionStore({ layers });
};

export default function LayerManagerItem(props: LayerDescription): JSX.Element {
  return <div class="layer-manager-item">
    <div class="layer-manager-item__name">
      <span>{ props.name }</span>
    </div>
    <div class="layer-manager-item__icons">
      <div class="layer-manager-item__icons-left">
        <Show
          when={props.type === 'table'}
          fallback={<i class={typeIcons[props.type as ('point' | 'line' | 'polygon' | 'raster')]} />}
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
