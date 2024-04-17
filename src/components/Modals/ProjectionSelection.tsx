// Imports for solid-js
import {
  createSignal,
  For,
  type JSX,
  Show,
} from 'solid-js';

// Imports from other external libraries
import { BsMap } from 'solid-icons/bs';
import { FiExternalLink } from 'solid-icons/fi';
import { HiOutlineGlobeAlt } from 'solid-icons/hi';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { epsgDb, type EpsgDbEntryType } from '../../helpers/projection';
import { isNumber } from '../../helpers/common';
import { round } from '../../helpers/math';

// Stores
import { setMapStore } from '../../store/MapStore';

// Sub-components
import InputFieldText from '../Inputs/InputText.tsx';

// Types / Interfaces / Enums
import { ScoredResult } from '../../global.d';
import MessageBlock from '../MessageBlock.tsx';
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

const projectionEntries = availableProjections.map((projection) => ({
  name: projection,
  value: projection,
  type: 'd3',
}));

const findMatchingProjections = (search: string): ScoredResult<EpsgDbEntryType>[] => {
  // Explore the EPSG database to find projection
  // names or code matching the search string
  const searchString = search.trim()
    .toLowerCase();

  // Return early if the search string is empty
  if (searchString === '') return [];

  // Directly return the projection if the search string
  // is an EPSG code
  if (searchString.includes('epsg:') || isNumber(searchString)) {
    const code = searchString.replace('epsg:', '');
    const projection = epsgDb[code];
    if (projection) return [{ score: 1, item: projection }];
  }

  // Otherwise, search for matching projections
  // in the name field of the EPSG database
  const matchingProjections: ScoredResult<EpsgDbEntryType>[] = [];

  // First, we split the search string into words
  // (so we split on space, comma, slash and underscore)
  const searchWords = searchString.split(/[/\s_-]/g);

  // Then, we search for
  Object.entries(epsgDb)
    .forEach(([code, projection]) => {
      // We will see if each word of the search string is included in the projection name
      // and give a score according to the number of words that match
      // (so score will be 1 if all words match, 0.5 if half of the words match, etc.)
      let score = 0;
      searchWords.forEach((word) => {
        if (
          projection.name.toLowerCase().includes(word)
          || (projection.area !== null && projection.area.toLowerCase().includes(word))
        ) {
          score += 1 / searchWords.length;
        }
      });
      if (score > 0) {
        matchingProjections.push({
          item: projection,
          score: round(score, 2),
        });
      }
    });

  return matchingProjections
    .filter((elem) => elem.score > 0.5)
    .sort((a, b) => b.score - a.score);
};

export default function ProjectionSelection() : JSX.Element {
  const { LL } = useI18nContext();

  const [
    currentTab,
    setCurrentTab,
  ] = createSignal<'d3' | 'custom'>('d3');
  // Signals for "d3" tab
  const [
    selectedGlobalProjection,
    setSelectedGlobalProjection,
  ] = createSignal<string | null>(null);
  // Signals for "custom" tab
  const [
    matchingProjections,
    setMatchingProjections,
  ] = createSignal<ScoredResult<EpsgDbEntryType>[] | null>(null);
  const [
    selectedProjection,
    setSelectedProjection,
  ] = createSignal<EpsgDbEntryType | null>(null);

  return <div class="projection-selection" style={{ height: '50vh' }}>
    <div class="tabs is-boxed">
      <ul style={{ margin: 0 }}>
        <li classList={{ 'is-active': currentTab() === 'd3' }}>
          <a onClick={() => { setCurrentTab('d3'); }}>
            <span class="icon is-small"><HiOutlineGlobeAlt /></span>
            <span>{LL().ProjectionSelection.GlobalProjection()}</span>
          </a>
        </li>
        <li classList={{ 'is-active': currentTab() === 'custom' }}>
          <a onClick={() => { setCurrentTab('custom'); }}>
            <span class="icon is-small"><BsMap/></span>
            <span>{LL().ProjectionSelection.LocalProjection()}</span>
          </a>
        </li>
      </ul>
    </div>
    <div class="projection-selection__content">
      <div class="projection-selection__content-global">
        <Show when={currentTab() === 'd3'}>
          <MessageBlock type={'info'}>
            {LL().ProjectionSelection.InformationGlobalProjection()}
          </MessageBlock>
          <DropdownMenu
            id={'projection-selection_global-projection-dropdown'}
            entries={projectionEntries}
            defaultEntry={projectionEntries[0]}
            onChange={(v) => {
              setSelectedGlobalProjection(v);
            }}
            style={{ 'max-height': '30vh' }}
          />
          <div class="mt-4" style={{ 'text-align': 'center' }}>
            <button
              class="button"
              onClick={() => {
                setMapStore(
                  'projection',
                  {
                    type: 'd3',
                    name: selectedGlobalProjection()!,
                    value: `geo${selectedGlobalProjection()!}`,
                  },
                );
              }}
            >Apply
            </button>
          </div>
        </Show>
      </div>
      <div class="projection-selection__content-local">
        <Show when={currentTab() === 'custom'}>
          <MessageBlock type={'info'}>
            {LL().ProjectionSelection.InformationLocalProjection()}
          </MessageBlock>
          <InputFieldText
            width={400}
            label={LL().ProjectionSelection.SearchProjection()}
            placeholder={'e.g. EPSG:3035, Lambert-93, Martinique 1938 / UTM zone 20N, ...'}
            onKeyUp={(value) => {
              setMatchingProjections(findMatchingProjections(value));
              console.log(matchingProjections());
            }}
          />
          <div class="is-flex" style={{ 'column-gap': '1em', height: '30vh' }}>
            <div
              class="projection-selection-list"
              style={{ width: '50%', height: '100%' }}
            >
              <Show when={matchingProjections() !== null}>
                <div class="projection-selection-list__header" style={{ 'margin-block-end': '1em' }}>
                  {LL().ProjectionSelection.NMatchingProjections(matchingProjections()!.length)}
                </div>
                <Show when={matchingProjections()!.length > 80}>
                  <div class="projection-selection-list__warning">
                    {LL().ProjectionSelection.TooManyResults()}
                  </div>
                </Show>
                <Show when={matchingProjections()!.length <= 80}>
                  <div style={{ height: '90%', 'overflow-y': 'auto' }}>
                    <For each={matchingProjections()!}>
                      {(elem) => (
                        <div
                          class="projection-selection-list__item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (
                              selectedProjection()
                              && selectedProjection()!.code === elem.item.code
                            ) {
                              setSelectedProjection(null);
                            } else {
                              setSelectedProjection(elem.item);
                            }
                          }}
                        >
                          {elem.item.name} ({elem.item.code}) - <small>Score : {elem.score}</small>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </Show>
            </div>
            <div class="projection-selection-details" style={{ width: '50%' }}>
              <div style={{ 'margin-block-end': '2em' }}>
              </div>
              <Show when={selectedProjection() !== null}>
                <div style={{ height: '80%', 'overflow-y': 'auto' }}>
                  <p>
                    <b>{selectedProjection()!.name}</b>
                    &nbsp;({selectedProjection()!.code})
                  </p>
                  <p>
                    <span style={{ 'font-weight': 500 }}>{LL().ProjectionSelection.Kind()}</span> {
                    {
                      'CRS-PROJCRS': LL().ProjectionSelection.ProjCRS(),
                      'CRS-GEOGCRS': LL().ProjectionSelection.GeogCRS(),
                    }[selectedProjection()!.kind]
                  }</p>
                  <p>
                    <span style={{ 'font-weight': 500 }}>{LL().ProjectionSelection.BboxGeo()}</span>
                    &nbsp;{selectedProjection()!.bbox.join(', ')}</p>
                  <p>
                    <span style={{ 'font-weight': 500 }}>{LL().ProjectionSelection.Area()}</span>
                    &nbsp;{selectedProjection()!.area}</p>
                  <p>
                    <span style={{ 'font-weight': 500 }}>{LL().ProjectionSelection.Unit()}</span>
                    &nbsp;{selectedProjection()!.unit}</p>
                  <p>
                    <a
                      href={`https://epsg.io/${selectedProjection()!.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FiExternalLink style={{ height: '1em', width: '1em', 'vertical-align': 'text-top' }}/>
                      &nbsp;{LL().ProjectionSelection.MoreInformation()}
                    </a>
                  </p>
                </div>
                <div style={{ 'text-align': 'center' }}>
                  <button
                    class="button"
                    onClick={() => {
                      setMapStore(
                        'projection',
                        {
                          type: 'proj4',
                          name: selectedProjection()!.name,
                          value: selectedProjection()!.proj4,
                          bounds: selectedProjection()!.bbox,
                          code: `EPSG:${selectedProjection()!.code}`,
                        },
                      );
                    }}
                  >Apply
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </div>
  </div>;
}
