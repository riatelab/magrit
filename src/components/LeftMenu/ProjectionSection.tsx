// Imports from solid-js
import {
  Accessor, createMemo, For, JSX, Show,
} from 'solid-js';

// Import from other packages
import { FaSolidAngleDown } from 'solid-icons/fa';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import type { TranslationFunctions } from '../../i18n/i18n-types';
import { camelToFlat, unproxify } from '../../helpers/common';
import { epsgDb, removeNadGrids } from '../../helpers/projection';

// Stores
import { globalStore } from '../../store/GlobalStore';
import { mapStore, setMapStore } from '../../store/MapStore';
import { setModalStore } from '../../store/ModalStore';

// Sub-components
import { onClickDropdown, onKeyDownDropdown, setDropdownItemTarget } from '../DropdownMenu.tsx';
import ProjectionSelection from '../Modals/ProjectionSelection.tsx';
import InputFieldNumberSlider from '../Inputs/InputNumberSlider.tsx';
import InputFieldDoubleNumberSlider from '../Inputs/InputDoubleNumberSlider.tsx';

function onChangeProjectionEntry(
  entry: { name: string, value: string, type: string },
  LL: Accessor<TranslationFunctions>,
) {
  // Value is either the name of the projection (to be used in the projection function for d3)
  // or "other"
  if (entry.value === 'other') {
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
  } else if (entry.type === 'd3') {
    // The projection function name in d3 is 'geo' + the value
    const functionName = `geo${entry.value}`;
    // Changing this in the mapStore will
    // actually change the projection and the path generator
    // in the global store and redraw the map
    setMapStore(
      'projection',
      {
        name: entry.value,
        value: functionName,
        type: 'd3',
      },
    );
  } else {
    const proj = epsgDb[entry.value];
    setMapStore(
      'projection',
      {
        name: proj.name,
        value: removeNadGrids((proj.proj4 || proj.wkt) as string),
        bounds: proj.bbox,
        code: `EPSG:${proj.code}`,
        type: 'proj4',
      },
    );
  }
}

const formatCurrentProjection = (
  type: string,
  name: string,
  code: string | undefined,
  // eslint-disable-next-line no-nested-ternary
) => (type === 'd3' ? camelToFlat(name) : code ? `${name} (${code})` : name);

export default function ProjectionSection(): JSX.Element {
  const { LL } = useI18nContext();
  let refParentNodeDropdown: HTMLDivElement;

  const shortListEntries = createMemo(() => [
    {
      name: LL().MapConfiguration.GlobalProjections(),
      type: 'group',
    },
    {
      name: 'Natural Earth 2',
      value: 'NaturalEarth2',
      type: 'd3',
    },
    {
      name: 'Robinson',
      value: 'Robinson',
      type: 'd3',
    },
    {
      name: 'Equal Earth',
      value: 'EqualEarth',
      type: 'd3',
    },
    {
      name: 'Mercator',
      value: 'Mercator',
      type: 'd3',
    },
    {
      type: 'divider',
    },
    {
      name: LL().MapConfiguration.LocalProjections(),
      type: 'group',
    },
    {
      name: 'ETRS89-extended / LAEA Europe (EPSG:3035)',
      value: '3035',
      type: 'proj4',
    },
    {
      name: 'RGF93 / Lambert-93 (EPSG:2154)',
      value: '2154',
      type: 'proj4',
    },
    {
      name: 'Madrid 1870 (Madrid) / Spain LCC (EPSG:2062)',
      value: '2062',
      type: 'proj4',
    },
    {
      name: 'OSGB36 / British National Grid (EPSG:27700)',
      value: '27700',
      type: 'proj4',
    },
    {
      name: 'NAD83 / Conus Albers (EPSG:5070)',
      value: '5070',
      type: 'proj4',
    },
    {
      type: 'divider',
    },
    {
      name: LL().MapConfiguration.MoreProjection(),
      value: 'other',
      type: '',
    },
  ]);

  const hasParallel = createMemo(() => !!globalStore.projection?.parallel);

  const hasParallels = createMemo(() => !!globalStore.projection?.parallels);

  return <div class="projection-section">
    <div class="field-block">
      <label class="label">{LL().MapConfiguration.Projection()}</label>
      <div
        classList={{ dropdown: true }}
        style={{ width: '100%' }}
        id={'map-configuration__projection-dropdown-container'}
        ref={refParentNodeDropdown!}
      >
        <div
          class="dropdown-trigger"
          style={{ width: '100%' }}
          onClick={onClickDropdown}
          onKeyDown={onKeyDownDropdown}
        >
          <button
            class="button"
            aria-haspopup="true"
            aria-controls={'map-configuration__projection-dropdown'}
            style={{ width: '100%' }}
            title={LL().MapConfiguration.Projection()}
            aria-label={LL().MapConfiguration.Projection()}
          >
        <span
          class="dropdown-item-target"
          style={{
            width: '100%',
            'text-overflow': 'ellipsis',
            overflow: 'hidden',
            'text-align': 'left',
          }}
        >
          {formatCurrentProjection(
            mapStore.projection.type,
            mapStore.projection.name,
            mapStore.projection.code,
          )}
        </span>
            <span class="icon is-small">
          <FaSolidAngleDown/>
        </span>
          </button>
        </div>
        <div class="dropdown-menu" id={'map-configuration__projection-dropdown'} role="menu" style={{ width: '100%' }}>
          <div class="dropdown-content" style={{ 'z-index': 1001 }}>
            <For each={shortListEntries()}>
              {(entry) => {
                if (entry.type === 'group') {
                  return <div
                    class="dropdown-item"
                    style={{ color: 'var(--bulma-text-weak)' }}
                  >
                    <p>{entry.name}</p>
                  </div>;
                }
                if (entry.type === 'divider') {
                  return <hr class="dropdown-divider"/>;
                }
                return <a href="#" class="dropdown-item" onClick={(ev) => {
                  if (entry.value !== 'other') setDropdownItemTarget(ev, {});
                  onChangeProjectionEntry(entry as never, LL);
                }}>
                  {entry.name}
                </a>;
              }}
            </For>
          </div>
        </div>
      </div>
    </div>
    <Show when={globalStore.projection && mapStore.projection.type === 'd3'}>
      {/* <DetailsSummary summaryContent={LL().MapConfiguration.ShowProjectionParameters()}> */}
        <InputFieldNumberSlider
          label={LL().MapConfiguration.ProjectionCenterLambda()}
          value={mapStore.rotate[0]}
          onChange={(v) => {
            setMapStore('rotate', [v, mapStore.rotate[1], mapStore.rotate[2]]);
          }}
          min={-180}
          max={180}
          step={0.1}
        />
        <InputFieldNumberSlider
          label={LL().MapConfiguration.ProjectionCenterPhi()}
          value={mapStore.rotate[1]}
          onChange={(v) => {
            setMapStore('rotate', [mapStore.rotate[0], v, mapStore.rotate[2]]);
          }}
          min={-180}
          max={180}
          step={0.1}
        />
        <InputFieldNumberSlider
          label={LL().MapConfiguration.ProjectionCenterGamma()}
          value={mapStore.rotate[2]}
          onChange={(v) => {
            setMapStore('rotate', [mapStore.rotate[0], mapStore.rotate[1], v]);
          }}
          min={-180}
          max={180}
          step={0.1}
        />
        <Show when={hasParallel()}>
          <InputFieldNumberSlider
            label={LL().MapConfiguration.StandardParallel()}
            value={mapStore.parallel || globalStore.projection.parallel()}
            onChange={(v) => {
              setMapStore('parallel', v);
            }}
            min={-90}
            max={90}
            step={0.1}
          />
        </Show>
        <Show when={hasParallels()}>
          <InputFieldDoubleNumberSlider
            label={LL().MapConfiguration.StandardParallels()}
            values={mapStore.parallels || globalStore.projection.parallels()}
            onChange={(v) => {
              console.log(v);
              setMapStore('parallels', v);
            }}
            min={-90}
            max={90}
            step={0.1}
          />
        </Show>
      {/* </DetailsSummary> */}
    </Show>
  </div>;
}
