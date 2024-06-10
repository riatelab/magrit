// Imports from solid-js
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSX,
  on,
  onMount,
  Setter,
  Show,
} from 'solid-js';

// Imports from other packages
import { FaSolidDatabase } from 'solid-icons/fa';
import { FiExternalLink } from 'solid-icons/fi';
import { ImFilter } from 'solid-icons/im';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { setModalStore } from '../../store/ModalStore';

// Subcomponents
import Pagination from '../Pagination.tsx';

// Assets
import imgParis from '../../assets/Mairie_de_Paris.jpg';
import imgWorld from '../../assets/World_Time_Zones_Map.jpg';

interface DataProvider {
  // The source of the geometry / dataset
  source: string,
  // The attribution to be shown in the map when using
  // the described geometry / data
  attribution: string,
  // The url that allows to download the geometry / dataset
  url: string,
  // The download date (yyyy-mm-dd)
  date: string,
  // The license of the geometry / dataset
  // (ideally an SPDX identifier)
  license: string,
}

interface FieldDescription {
  // The name of the field
  name: string,
  // // The description of the field
  // description: string,
  // The (magrit-)type of the field
  type: 'unknown' | 'stock' | 'ratio' | 'categorical' | 'identifier',
  // The provenance of the field (the index of the appropriate data provider in
  // the 'data' array).
  provenance: number,
}

interface DatasetEntry {
  // Internal id of the dataset
  id: string,
  // // Name of the dataset
  // name: string;
  // // Description of the dataset
  // description: string;
  // Type of dataset
  type: 'vector' | 'raster';
  // The total number of features in the dataset (vector)
  // or the total number of pixels in the dataset (raster)
  totalFeatures: number;
  // Keywords associated with the dataset
  keywords: string[];
  // Information about the geometry provider
  geometry: DataProvider,
  // Information about the data provider(s)
  data: DataProvider[],
  // Information about the various fields in the dataset
  fields: FieldDescription[],
}

const dds1 = {
  name: {
    en: 'Paris districts',
    fr: 'Quartiers de Paris',
  },
  description: {
    en: 'The 80 districts of Paris.',
    fr: 'Les 80 quartiers administratifs de Paris.',
  },
  type: 'vector',
  keywords: ['paris', 'quartiers', 'districts'],
  source: 'https://opendata.paris.fr/explore/dataset/quartier_paris/',
  directLink: 'https://opendata.paris.fr/explore/dataset/quartier_paris/download/?format=geojson&timezone=Europe/Berlin&lang=fr&use_labels_for_header=true&csv_separator=%3B',
  license: 'ODbL-1.0',
  attribution: 'Direction de l\'Urbanisme - Ville de Paris',
  imageUrl: imgParis,
  date: '2013',
  totalFeatures: 80,
} as DatasetEntry;

const dds2 = {
  name: {
    en: 'World countries',
    fr: 'Pays du monde',
  },
  description: {
    en: 'All the countries of the world.',
    fr: 'Tous les pays du monde.',
  },
  type: 'vector',
  keywords: ['world', 'monde', 'countries', 'country', 'pays'],
  source: 'https://www.naturalearthdata.com/',
  directLink: 'https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/ne_110m_admin_0_countries.zip',
  license: 'Public Domain',
  attribution: 'Natural Earth',
  imageUrl: imgWorld,
  date: '2022',
} as DatasetEntry;

const datasets = Array.from({ length: 100 })
  .map((_, i) => {
    const dds = [dds1, dds2][i % 2];
    const o = JSON.parse(JSON.stringify(dds));
    o.name.en = `${o.name.en} ${i}`;
    o.name.fr = `${o.name.fr} ${i}`;
    return o;
  });

function CardDatasetEntry(
  ds: DatasetEntry & { onClick: (arg0: MouseEvent) => void },
): JSX.Element {
  const { locale } = useI18nContext();
  return <div class="card" style={{ margin: '1em' }} onClick={(e) => ds.onClick(e)}>
    <header class="card-header" style={{ 'box-shadow': 'none' }}>
      <p class="card-header-title">
        <FaSolidDatabase style={{ height: '1.2em', width: '1.8em' }}/>
        <span style={{ 'font-size': '1.3em' }}>{ ds.name[locale()] }</span>
      </p>
    </header>
    <section class="card-content">
      <div class="content">
        { ds.description[locale()] }
      </div>
    </section>
  </div>;
}

function DatasetPage(props: {
  datasetEntries: DatasetEntry[],
  setSelectedDataset: Setter<DatasetEntry | null>,
  offset: number,
  maxEntryPerPage: number,
}): JSX.Element {
  return <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr' }}>
    <For each={props.datasetEntries.slice(props.offset, props.offset + props.maxEntryPerPage)}>
      {
        (d) => <
          CardDatasetEntry
          {...d}
          onClick={() => props.setSelectedDataset(d) }
        />
      }
    </For>
  </div>;
}

function CardDatasetDetail(ds: DatasetEntry): JSX.Element {
  const { locale, LL } = useI18nContext();
  return <div>
    <h3>{ ds.name[locale()] || ds.name.en }</h3>
    <h4>{ LL().DatasetCatalog.about() }</h4>
    <div>
      <table>
        <tbody>
          <tr>
            <td>{ LL().DatasetCatalog.license() }</td>
            <td>{ ds.license }</td>
          </tr>
          <tr>
            <td>{ LL().DatasetCatalog.provider() }</td>
            <td>{ ds.source }</td>
          </tr>
          <tr>
            <td>{ LL().DatasetCatalog.attributions() }</td>
            <td>{ ds.attribution }</td>
          </tr>
          <tr>
            <td>{ LL().DatasetCatalog.type() }</td>
            <td>{ LL().DatasetCatalog.types[ds.type]() }</td>
          </tr>
          <Show when={ds.totalFeatures}>
            <tr>
              <td></td>
              <td>{ LL().DatasetCatalog.features(ds.totalFeatures as number) }</td>
            </tr>
          </Show>
          <Show when={ds.directLink}>
            <tr>
              <td></td>
              <td>
                <a href={ds.directLink} target="_blank" rel="noopener noreferrer">
                  <FiExternalLink style={{ height: '1em', width: '1em', 'vertical-align': 'text-top' }}/>
                  { LL().DatasetCatalog.directLink() }
                </a>
              </td>
            </tr>
          </Show>
        </tbody>
      </table>
    </div>
    <br />
    <h4>{ LL().DatasetCatalog.description() }</h4>
    <div>
      <p> { ds.description[locale()] || ds.description.en }</p>
    </div>
    <br />
    <h4>{ LL().DatasetCatalog.preview() }</h4>
    <div>
      <img
        src={ds.imageUrl}
        class="image"
        style={{ border: 'solid 1px silver' }}
        alt={LL().DatasetCatalog.altDatasetPreview()}
      />
    </div>
  </div>;
}

// A large modal (or even a full page) that shows the datasets
// available for the user to choose from.
//
// It should contain:
// - A search bar
// - A (paginated) list of datasets
// - A section with the details of the selected dataset
// - A button to confirm the selection and add it to the map
export default function ExampleDatasetModal(): JSX.Element {
  const { LL } = useI18nContext();
  // Array of datasets (potentially filtered using the search bar)
  const [
    filteredDatasets,
    setFilteredDatasets,
  ] = createSignal<DatasetEntry[]>(datasets);
  // The dataset that is currently selected (null if none)
  const [
    selectedDataset,
    setSelectedDataset,
  ] = createSignal<DatasetEntry | null>(null);
  // The search terms that are currently entered in the search bar
  const [
    selectedSearchTerms,
    setSelectedSearchTerms,
  ] = createSignal<string>('');
  // The page that is currently displayed
  const [currentPage, setCurrentPage] = createSignal<number>(1);

  // The maximum number of entries per page
  const maxEntryPerPage = 6;

  // The offset of the current page (i.e. the index of the first entry of the page)
  const offset = createMemo(() => (currentPage() - 1) * maxEntryPerPage);

  // The total number of pages
  const totalPages = createMemo(() => Math.ceil(filteredDatasets().length / maxEntryPerPage));

  // Filter the datasets using the search terms
  // (for now we are only filtering on exact matches on the keywords)
  const filterDs = () => {
    if (selectedSearchTerms() === '') {
      return datasets;
    }
    const terms = selectedSearchTerms()
      .split(' ')
      .map((t) => t.toLowerCase());

    return datasets.filter((ds) => {
      let found = false;
      terms.forEach((term: string) => {
        ds.keywords.forEach((keyword: string) => {
          if (keyword.toLowerCase().includes(term)) {
            found = true;
          }
        });
      });
      return found;
    });
  };

  onMount(() => {
    setModalStore({
      confirmCallback: () => {
        // TODO: Add the selected dataset to the map...
        console.log(selectedDataset());
      },
    });
  });

  createEffect(
    on(
      () => selectedDataset(),
      () => {
        if (selectedDataset() !== null) {
          document.querySelector('.modal .button.confirm-button')!.removeAttribute('disabled');
        } else {
          document.querySelector('.modal .button.confirm-button')!.setAttribute('disabled', 'true');
        }
      },
    ),
  );

  return <div class="is-flex">
    <div style={{
      width: '60%',
      padding: '1em',
      margin: '1em',
      border: 'solid 1px silver',
      'border-radius': '1em',
      overflow: 'auto',
    }}>
      <div class="is-flex">
        <div class="field has-addons" style={{ margin: '1em' }}>
          <div class="control">
            <input
              class="input"
              type="text"
              value={selectedSearchTerms()}
              style={{ width: '300px' }}
              onChange={(e) => setSelectedSearchTerms(e.currentTarget.value)}
              placeholder={ LL().DatasetCatalog.placeholderSearchBar() }
            />
          </div>
          <div class="control">
            <button
              class="button is-info"
              onClick={() => {
                setCurrentPage(1);
                setFilteredDatasets(filterDs());
              }}
            >
              { LL().DatasetCatalog.searchButton() }
            </button>
          </div>
          <div class="control">
            <button
              class="button is-warning"
              onClick={() => {
                setSelectedSearchTerms('');
                setCurrentPage(1);
                setFilteredDatasets(filterDs());
              }}
            >
              X
            </button>
          </div>
        </div>
        <div class="field" style={{ margin: '1em', 'justify-content': 'start' }}>
          <ImFilter
            style={{
              height: '1.5em', width: '1.5em', 'margin-right': '1em', opacity: filteredDatasets().length === datasets.length ? 0 : 1,
            }}
          />
          <span>{ LL().DatasetCatalog.datasets(filteredDatasets().length) }</span>
        </div>
      </div>
      <Show
        when={filteredDatasets().length > 0}
        fallback={<p>{ LL().DatasetCatalog.noSearchResult() }</p>}
      >
        <DatasetPage
          setSelectedDataset={setSelectedDataset}
          offset={offset()}
          maxEntryPerPage={maxEntryPerPage}
          datasetEntries={filteredDatasets()}
        />
        <Pagination
          totalPages={totalPages()}
          onClick={(pageNumber) => setCurrentPage(pageNumber)}
          currentPage={currentPage()}
        />
      </Show>
    </div>
    <div style={{
      width: '40%',
      padding: '1em',
      margin: '1em',
      border: 'solid 1px silver',
      'border-radius': '1em',
      overflow: 'auto',
    }}>
      <div>
        <Show
          when={selectedDataset() !== null}
          fallback={<p>{ LL().DatasetCatalog.placeholderDatasetDetail() }</p>}
        >
          <CardDatasetDetail {...selectedDataset() as DatasetEntry} />
        </Show>
      </div>
    </div>
  </div>;
}
