import { JSX } from 'solid-js';
import { globalStore } from '../store/GlobalStore';
import '../styles/MapZone.css';

export default function MapZone(): JSX.Element {
  return <div class="map-zone">
    <div class="map-zone__inner">
      <svg
        width={globalStore.mapDimensions.width}
        height={globalStore.mapDimensions.height}
        class="map-zone__map"
      />
    </div>
  </div>;
}
