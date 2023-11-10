// Imports for solid-js
import {
  type Accessor, createSignal, For,
  type JSX, Show,
} from 'solid-js';

// Imports from other external libraries
import { FiExternalLink } from 'solid-icons/fi';

// Helpers
import { type TranslationFunctions } from '../../i18n/i18n-types';
import { epsgDb, type EpsgDbEntryType } from '../../helpers/projection';
import { isNumber } from '../../helpers/common';
import { round } from '../../helpers/math';

// Stores
import { setMapStore } from '../../store/MapStore';

// Sub-components
import InputFieldText from '../Inputs/InputText.tsx';

// Types / Interfaces / Enums
import { ScoredResult } from '../../global.d';

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

export default function ProjectionSelection(
  props: {
    LL: Accessor<TranslationFunctions>;
  },
) : JSX.Element {
  const [
    matchingProjections,
    setMatchingProjections,
  ] = createSignal<ScoredResult<EpsgDbEntryType>[] | null>(null);
  const [
    selectedProjection,
    setSelectedProjection,
  ] = createSignal<EpsgDbEntryType | null>(null);
  return <div class="projection-selection">
    <InputFieldText
      width={ 400 }
      label={ props.LL().ProjectionSelection.SearchProjection() }
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
            { props.LL().ProjectionSelection.NMatchingProjections(matchingProjections()!.length) }
          </div>
          <Show when={matchingProjections()!.length > 80}>
            <div class="projection-selection-list__warning">
              { props.LL().ProjectionSelection.TooManyResults() }
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
                      if (selectedProjection() && selectedProjection()!.code === elem.item.code) {
                        setSelectedProjection(null);
                      } else {
                        setSelectedProjection(elem.item);
                      }
                    }}
                  >
                    { elem.item.name } ({ elem.item.code }) - <small>Score : {elem.score}</small>
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
                <b>{ selectedProjection()!.name }</b>
                \ ({ selectedProjection()!.code })
              </p>
              <p>
                <span style={{ 'font-weight': 500 }}>{ props.LL().ProjectionSelection.Kind() }</span> {
                {
                  'CRS-PROJCRS': props.LL().ProjectionSelection.ProjCRS(),
                  'CRS-GEOGCRS': props.LL().ProjectionSelection.GeogCRS(),
                }[selectedProjection()!.kind]
              }</p>
              <p>
                <span style={{ 'font-weight': 500 }}>{ props.LL().ProjectionSelection.BboxGeo() }</span>
                \ { selectedProjection()!.bbox.join(', ') }</p>
              <p>
                <span style={{ 'font-weight': 500 }}>{ props.LL().ProjectionSelection.Area() }</span>
                \ { selectedProjection()!.area }</p>
              <p>
                <span style={{ 'font-weight': 500 }}>{ props.LL().ProjectionSelection.Unit() }</span>
                \ { selectedProjection()!.unit }</p>
              <p>
                <a
                  href={`https://epsg.io/${selectedProjection()!.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiExternalLink style={{ height: '1em', width: '1em', 'vertical-align': 'text-top' }}/>
                  { props.LL().ProjectionSelection.MoreInformation() }
                </a>
              </p>
            </div>
            <div style={{ 'text-align': 'center' }}>
              <button
                onClick={() => {
                  setMapStore(
                    'projection',
                    {
                      type: 'proj4',
                      name: selectedProjection()!.name,
                      value: selectedProjection()!.proj4,
                      bounds: selectedProjection()!.bbox,
                    },
                  );
                }}
              >Apply</button>
            </div>
          </Show>
      </div>
    </div>
  </div>;
}
