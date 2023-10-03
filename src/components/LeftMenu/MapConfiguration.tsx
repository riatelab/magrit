// Imports from solid-js
import { JSX } from 'solid-js';

// Helpers
import d3 from '../../helpers/d3-custom';
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { mapStore, setMapStore } from '../../store/MapStore';
import { globalStore, setGlobalStore } from '../../store/GlobalStore';

// Sub-components
import DropdownMenu from '../DropdownMenu.tsx';

const availableProjections = [
  'Airy',
  'Aitoff',
  'Armadillo',
  'August',
  'Baker',
  'Berghaus',
  'Bertin1953',
  'Boggs',
  'Bonne',
  'Bottomley',
  'Bromley',
  'Chamberlin',
  'ChamberlinAfrica',
  'Collignon',
  'Craig',
  'Craster',
  'CylindricalEqualArea',
  'CylindricalStereographic',
  'NaturalEarth2',
  'Eckert1',
  'Eckert2',
  'Eckert3',
  'Eckert4',
  'Eckert5',
  'Eckert6',
  'Eisenlohr',
  'Fahey',
  'Foucaut',
  'FoucautSinusoidal',
  'Gilbert',
  'Gingery',
  'Gringorten',
  'Guyou',
  'Hammer',
  'HammerRetroazimuthal',
  'Healpix',
  'Hill',
  'Homolosine',
  'Hufnagel',
  'Hyperelliptical',
];

const projectionEntries = availableProjections.map((projection) => ({
  name: projection,
  value: projection,
}));

function onChangeProjectionEntry(value: string) {
  const functionName = `geo${value}`;
  const projection = d3[functionName]()
    .center(mapStore.center)
    .translate(mapStore.translate)
    .scale(mapStore.scale);
  const pathGenerator = d3.geoPath(projection);

  setMapStore(
    'projection',
    {
      name: value,
      value: functionName,
      type: 'd3',
    },
  );

  setGlobalStore(
    'projection',
    () => projection,
  );
  setGlobalStore(
    'pathGenerator',
    () => pathGenerator,
  );
}

export default function MapConfiguration(): JSX.Element {
  const { LL } = useI18nContext();
  return <div class="map-configuration">
    <div class="field">
      <label class="label">{ LL().MapConfiguration.Width() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          min="10"
          max={ globalStore.windowDimensions.width }
          value={ mapStore.mapDimensions.width }
          onChange={(e) => {
            setMapStore({
              mapDimensions: {
                width: +e.target.value,
                height: mapStore.mapDimensions.height,
              },
            });
          }}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().MapConfiguration.Height() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          min="10"
          max={ globalStore.windowDimensions.height }
          value={ mapStore.mapDimensions.height }
          onChange={(e) => {
            setMapStore({
              mapDimensions: {
                width: mapStore.mapDimensions.width,
                height: +e.target.value,
              },
            });
          }}
        />
      </div>
    </div>
    <DropdownMenu
      id={ 'map-configuration__projection-dropdown' }
      entries={projectionEntries}
      defaultEntry={mapStore.projection}
      onChange={ onChangeProjectionEntry }
      style={{ 'margin-bottom': '1.5em' }}
    />
    <div class="field">
      <label class="label" for="map-configuration__lock-zoom-checkbox">{ LL().MapConfiguration.LockZoom() }</label>
      <div class="control">
        <input
          id="map-configuration__lock-zoom-checkbox"
          type="checkbox"
          checked={ mapStore.lockZoomPan }
          onChange={(e) => {
            setMapStore({ lockZoomPan: e.target.checked });
          }}
        />
      </div>
    </div>
  </div>;
}
