// Imports from solid-js
import {
  Accessor, createMemo, JSX, Show,
} from 'solid-js';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import type { TranslationFunctions } from '../../i18n/i18n-types';
import { unproxify } from '../../helpers/common';

// Stores
import { globalStore } from '../../store/GlobalStore';
import { mapStore, setMapStore } from '../../store/MapStore';
import { setModalStore } from '../../store/ModalStore';

// Sub-components
import DetailsSummary from '../DetailsSummary.tsx';
import DropdownMenu from '../DropdownMenu.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldRangeSlider from '../Inputs/InputRangeSlider.tsx';
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
  'Hatano',
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
  'NellHammer',
  'InterruptedQuarticAuthalic',
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

const projectionShortlist = [
  'ETRS 89 / LAEA Europe (EPSG:3035)',
  'RGF93 / Lambert-93 (EPSG:2154)',
  'Mercator',
  'Natural Earth II',
  'Robinson',
  'Equal Earth',
];

const projectionEntries = availableProjections.map((projection) => ({
  name: projection,
  value: projection,
  type: 'd3',
}));

function onChangeProjectionEntry(
  value: string,
  LL: Accessor<TranslationFunctions>,
) {
  // Value is either the name of the projection (to be used in the projection function for d3)
  // or "other"
  if (value === 'other') {
    // Save the current projection definition if the user clics on "cancel"
    const currentProjection = unproxify(mapStore.projection as never);
    // Open the modal that will allow the user to select a projection
    setModalStore({
      show: true,
      content: () => <ProjectionSelection />,
      title: LL().ProjectionSelection.title(),
      confirmCallback: () => {
        // Nothing to do on confirm
        // because the projection is already changed
        // from inside the modal...
      },
      cancelCallback: () => {
        setMapStore('projection', currentProjection);
      },
      width: '900px',
      escapeKey: 'cancel',
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
    type: '',
  });

  const hasParallel = createMemo(() => !!globalStore.projection?.parallel);

  const hasParallels = createMemo(() => !!globalStore.projection?.parallels);

  return <div class="map-configuration">
    <InputFieldNumber
      label={LL().MapConfiguration.Width()}
      value={mapStore.mapDimensions.width}
      onChange={(v) => {
        // Note that clip extent (if used) is automatically updated (in MapStore)
        // and that the path are automatically updated (triggered from MapStore too)
        setMapStore({
          mapDimensions: {
            width: v,
            height: mapStore.mapDimensions.height,
          },
        });
      }}
      min={10}
      max={globalStore.windowDimensions.width}
      step={1}
      width={100}
    />
    <InputFieldNumber
      label={LL().MapConfiguration.Height()}
      value={mapStore.mapDimensions.height}
      onChange={(v) => {
        // Note that clip extent (if used) is automatically updated (in MapStore)
        // and that the path are automatically updated (triggered from MapStore too)
        setMapStore({
          mapDimensions: {
            width: mapStore.mapDimensions.width,
            height: v,
          },
        });
      }}
      min={10}
      max={globalStore.windowDimensions.height}
      step={1}
      width={100}
    />
    <InputFieldCheckbox
      label={LL().MapConfiguration.LockZoom()}
      checked={mapStore.lockZoomPan}
      onChange={(v) => {
        setMapStore({
          lockZoomPan: v,
        });
      }}
    />
    <div class="field-block">
      <label class="label">{LL().MapConfiguration.Projection()}</label>
      <DropdownMenu
        id={'map-configuration__projection-dropdown'}
        entries={projectionEntries}
        defaultEntry={mapStore.projection}
        onChange={(value) => {
          onChangeProjectionEntry(value, LL);
        }}
      />
    </div>
    <Show when={globalStore.projection && mapStore.projection.type === 'd3'}>
      <DetailsSummary summaryContent={LL().MapConfiguration.ShowProjectionParameters()}>
        <InputFieldRangeSlider
          label={LL().MapConfiguration.ProjectionCenterLambda()}
          value={mapStore.rotate[0]}
          onChange={(v) => {
            setMapStore('rotate', [v, mapStore.rotate[1], mapStore.rotate[2]]);
          }}
          min={-180}
          max={180}
          step={1}
        />
        <InputFieldRangeSlider
          label={LL().MapConfiguration.ProjectionCenterPhi()}
          value={mapStore.rotate[1]}
          onChange={(v) => {
            setMapStore('rotate', [mapStore.rotate[0], v, mapStore.rotate[2]]);
          }}
          min={-180}
          max={180}
          step={1}
        />
        <InputFieldRangeSlider
          label={LL().MapConfiguration.ProjectionCenterGamma()}
          value={mapStore.rotate[2]}
          onChange={(v) => {
            setMapStore('rotate', [mapStore.rotate[0], mapStore.rotate[1], v]);
          }}
          min={-180}
          max={180}
          step={1}
        />
        <Show when={hasParallel()}>
          <InputFieldRangeSlider
            label={LL().MapConfiguration.StandardParallel()}
            value={mapStore.parallel || globalStore.projection.parallel()}
            onChange={(v) => {
              setMapStore('parallel', v);
            }}
            min={-90}
            max={90}
            step={1}
          />
        </Show>
        <Show when={hasParallels()}>
          <InputFieldRangeSlider
            label={LL().MapConfiguration.StandardParallels()}
            value={mapStore.parallels || globalStore.projection.parallels()}
            onChange={(v) => {
              setMapStore('parallels', v);
            }}
            min={-90}
            max={90}
            step={1}
          />
        </Show>
      </DetailsSummary>
    </Show>
  </div>;
}
