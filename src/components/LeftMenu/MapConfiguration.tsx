import { JSX } from 'solid-js';
import { mapStore, setMapStore } from '../../store/MapStore';
import { useI18nContext } from '../../i18n/i18n-solid';
import { globalStore, setGlobalStore } from '../../store/GlobalStore';
import DropdownMenu from '../DropdownMenu.tsx';
import d3 from '../../helpers/d3-custom';

const availableProjections = [
  'geoAiry',
  'geoAitoff',
  'geoArmadillo',
  'geoAugust',
  'geoBaker',
  'geoBerghaus',
  'geoBertin1953',
  'geoBoggs',
  'geoBonne',
  'geoBottomley',
  'geoBromley',
  'geoChamberlin',
  'geoChamberlinAfrica',
  'geoCollignon',
  'geoCraig',
  'geoCraster',
  'geoCylindricalEqualArea',
  'geoCylindricalStereographic',
];

const projectionEntries = availableProjections.map((projection) => ({
  name: projection,
  value: projection,
}));

function onChangeProjectionEntry(value: string) {
  const projection = d3[value]();
  const pathGenerator = d3.geoPath(projection);

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
      entries={projectionEntries}
      defaultEntry={projectionEntries[0]}
      onChange={ onChangeProjectionEntry }
    />
  </div>;
}
