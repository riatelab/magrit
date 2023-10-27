import {
  type Accessor, createSignal, For,
  type JSX, Show,
} from 'solid-js';
import { type TranslationFunctions } from '../../i18n/i18n-types';
import {
  epsgDb,
  type EpsgDbEntryType,
} from '../../helpers/projection';
import InputFieldText from '../Inputs/InputText.tsx';
import { isNumber } from '../../helpers/common';

// TODO: improve the search algorithm
const findMatchingProjections = (search: string) => {
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
    if (projection) return [projection];
  }

  // Otherwise, search for matching projections
  // in the name field of the EPSG database
  const matchingProjections: EpsgDbEntryType[] = [];

  Object.entries(epsgDb)
    .forEach(([code, projection]) => {
      if (projection.name.toLowerCase().includes(searchString)) {
        matchingProjections.push(projection);
      }
    });

  return matchingProjections;
};

export default function ProjectionSelection(
  props: {
    LL: Accessor<TranslationFunctions>;
  },
) : JSX.Element {
  const [
    matchingProjections,
    setMatchingProjections,
  ] = createSignal<EpsgDbEntryType[] | null>(null);
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
    <div class="projection-selection-list">
      <Show when={matchingProjections() !== null}>
        { props.LL().ProjectionSelection.NMatchingProjections(matchingProjections()!.length) }
        <Show when={matchingProjections()!.length > 30}>
          <div class="projection-selection-list__warning">
            { props.LL().ProjectionSelection.TooManyResults() }
          </div>
        </Show>
        <Show when={matchingProjections()!.length <= 30}>
          <For each={matchingProjections()!}>
            {(projection) => (
              <div class="projection-selection-list__item">
              { projection.name } ({ projection.code })
            </div>
            )}
          </For>
        </Show>
      </Show>
    </div>
  </div>;
}
