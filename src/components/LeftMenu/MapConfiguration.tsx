// Imports from solid-js
import { JSX } from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { unproxify } from '../../helpers/common';

// Stores
import { globalStore, setGlobalStore } from '../../store/GlobalStore';
import { mapStore, setMapStore } from '../../store/MapStore';
import { setModalStore } from '../../store/ModalStore';

// Sub-components
import DropdownMenu from '../DropdownMenu.tsx';
import ProjectionSelection from '../Modals/ProjectionSelection.tsx';

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
  'InterruptedBoggs',
  'InterruptedHomolosine',
  'InterruptedMollweide',
  'InterruptedMollweideHemispheres',
  'InterruptedSinuMollweide',
  'InterruptedSinusoidal',
  'Kavrayskiy7',
  'Lagrange',
  'Larrivee',
  'Laskowski',
  'Littrow',
  'Loximuthal',
  'Miller',
  'ModifiedSereographic',
  'Mollweide',
  'NellHammr',
  'InterrupteduarticAuthalic',
  'Nicolosi',
  'Patterson',
  'Polyconic',
  'Polyhedral',
  'PolyhedralButterfly',
  'PolyhedralCollignon',
  'PolyhedralWaterman',
  'GringortenQuincuncial',
  'PeirceQuincuncial',
  'RectangularPolyconic',
  'Robinson',
  'Satellite',
  'SinuMollweide',
  'Sinusoidal',
  'Stitch',
  'Times',
  'VanDerGrinten',
  'VanDerGrinten2',
  'VanDerGrinten3',
  'VanDerGrinten4',
  'Wagner',
  'Wagner4',
  'Wagner6',
  'Wiechel',
  'Winkel3',
];

const projectionEntries = availableProjections.map((projection) => ({
  name: projection,
  value: projection,
}));

function onChangeProjectionEntry(value: string) {
  // Value is either the name of the projection (to be used in the projection function for d3)
  // or "other"
  if (value === 'other') {
    // Save the current projection definition if the user clics on "cancel"
    const currentProjection = unproxify(mapStore.projection);
    // Open the modal that will allow the user to select a projection
    setModalStore({
      show: true,
      content: () => <ProjectionSelection LL={useI18nContext().LL} />,
      title: 'Select a projection',
      confirmCallback: () => {
        // Nothing to do on confirm
        // because the projection is already changed
        // from inside the modal...
      },
      cancelCallback: () => {
        setMapStore('projection', currentProjection);
      },
      width: 900,
    });
  } else {
    // The projection function name in d3 is 'geo' + the value
    const functionName = `geo${value}`;
    // Changing this in the mapStore will
    // actually change the projection and the path generator
    // in the global store and redraw the map
    setMapStore(
      'projection',
      {
        name: value,
        value: functionName,
        type: 'd3',
      },
    );
  }
}

export default function MapConfiguration(): JSX.Element {
  const { LL } = useI18nContext();

  projectionEntries.push({
    name: LL().MapConfiguration.CustomProjection(),
    value: 'other',
  });

  return <div class="map-configuration">
    <div class="field">
      <label class="label">{ LL().MapConfiguration.Width() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          min={10}
          step={1}
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
          min={10}
          step={1}
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
    <div class="field-block">
      <label class="label">{ LL().MapConfiguration.Projection() }</label>
      <DropdownMenu
        id={ 'map-configuration__projection-dropdown' }
        entries={projectionEntries}
        defaultEntry={mapStore.projection}
        onChange={ onChangeProjectionEntry }
      />
    </div>
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
