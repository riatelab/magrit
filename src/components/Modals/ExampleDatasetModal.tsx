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
import { produce } from 'solid-js/store';

// Imports from other packages
import { FaSolidDatabase } from 'solid-icons/fa';
import { FiExternalLink } from 'solid-icons/fi';
import { ImFilter } from 'solid-icons/im';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { Variable } from '../../helpers/typeDetection';
import { addLayer } from '../../helpers/fileUpload';

// Stores
import { globalStore, setGlobalStore } from '../../store/GlobalStore';
import { type LayersDescriptionStoreType, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setModalStore } from '../../store/ModalStore';

// Subcomponents
import Pagination from '../Pagination.tsx';

// Assets
import datasets from '../../assets/datasets.json';

interface DataProvider {
  // The source of the geometry / dataset
  source: string,
  // The url that allows to download the geometry / dataset
  url: string,
  // The download date (yyyy-mm-dd)
  date: string,
  // The license of the geometry / dataset
  // (ideally an SPDX identifier or an URL to the
  // appropriate license document)
  license: string,
}

interface DatasetEntry {
  // Internal id of the dataset
  id: string,
  // Type of dataset
  type: 'vector' | 'raster';
  // The total number of features in the dataset (vector)
  // or the total number of pixels in the dataset (raster)
  totalFeatures: number;
  // Information about the projection that should be used when displaying these data
  defaultProjection: {
    type: 'd3' | 'proj4',
    value: string, // We allow proj4 string, WKT1 string, or a d3 projection name
  },
  // Information about the geometry provider
  geometry: DataProvider,
  // Information about the data provider(s)
  data: DataProvider[],
  // Information about the various fields in the dataset
  fields: (Variable & { provenance: number })[],
}

function CardDatasetEntry(
  ds: DatasetEntry & { onClick: (arg0: MouseEvent) => void },
): JSX.Element {
  const { LL } = useI18nContext();
  return <div class="card" style={{ margin: '1em' }} onClick={(e) => ds.onClick(e)}>
    <header class="card-header" style={{ 'box-shadow': 'none' }}>
      <p class="card-header-title">
        <FaSolidDatabase style={{ height: '1.2em', width: '1.8em' }}/>
        <span style={{ 'font-size': '1.3em' }}>{ LL().Datasets[ds.id].name }</span>
      </p>
    </header>
    <section class="card-content">
      <div class="content">
        { LL().Datasets[ds.id].abstract }
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
  const { LL } = useI18nContext();
  return <div>
    <h3>{ LL().Datasets[ds.id].name }</h3>
    <h4>{ LL().DatasetCatalog.about() }</h4>
    <div>
      <table>
        <tbody>
        <tr>
          <td>{LL().DatasetCatalog.type()}</td>
          <td>{LL().DatasetCatalog.types[ds.type]()}</td>
        </tr>
        <Show when={ds.totalFeatures}>
          <tr>
            <td></td>
            <td>{LL().DatasetCatalog.features(ds.totalFeatures as number)}</td>
          </tr>
        </Show>
        <tr>
          <td>{LL().DatasetCatalog.providerGeometry()}</td>
          <td>{ds.geometry.source}</td>
        </tr>
        <tr>
          <td>{LL().DatasetCatalog.attributionGeometry()}</td>
          <td>{LL().Datasets[ds.id].geometryAttribution()}</td>
        </tr>
        <tr>
          <td>{LL().DatasetCatalog.licenseGeometry()}</td>
          <td>{ds.geometry.license}</td>
        </tr>
        <tr>
          <td>{LL().DatasetCatalog.providerData()}</td>
          <td>{ds.data.map((d) => d.source).join(', ')}</td>
        </tr>
        <tr>
          <td>{LL().DatasetCatalog.attributionData()}</td>
          <td>{
            ds.data.map((d, i) => LL().Datasets[ds.id].dataAttribution[i + 1]()).join(', ')}</td>
        </tr>
        <tr>
          <td>{LL().DatasetCatalog.licenceData()}</td>
          <td>{ds.data.map((d) => d.license).join(', ')}</td>
        </tr>
        </tbody>
      </table>
    </div>
    <br/>
    <h4>{LL().DatasetCatalog.description()}</h4>
    <div>
      <p> {LL().Datasets[ds.id].abstract}</p>
    </div>
    <br/>
    <h4>{LL().DatasetCatalog.variableDescription()}</h4>
    <table style={{ 'font-size': '0.8rem', width: '100%' }} class="table">
      <thead>
        <tr>
          <th>{LL().DatasetCatalog.variable.name()}</th>
          <th>{LL().DatasetCatalog.variable.description()}</th>
          <th>{LL().DatasetCatalog.variable.provenance()}</th>
        </tr>
      </thead>
      <tbody>
        <For each={ds.fields}>
          {
            (variableDescription) => <tr>
              <td>{variableDescription.name}</td>
              <td>{LL().Datasets[ds.id].fields[variableDescription.name]}</td>
              <td>{
                variableDescription.provenance === 0
                  ? LL().Datasets[ds.id].geometryAttribution
                  : LL().Datasets[ds.id].dataAttribution[variableDescription.provenance]

              }</td>
            </tr>
          }
        </For>
      </tbody>
    </table>
    <h4>{LL().DatasetCatalog.preview() }</h4>
    <div class="has-text-centered">
      <img
        src={`/dataset/${ds.id}.png`}
        class="image"
        style={{ border: 'solid 1px silver', width: '300px', margin: 'auto' }}
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
      const keywords = LL().Datasets[ds.id].keywords().split(',').map((k) => k.trim().toLowerCase());
      terms.forEach((term: string) => {
        keywords.forEach((keyword: string) => {
          if (keyword.includes(term)) {
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
        console.log(selectedDataset());
        fetch(`/dataset/${selectedDataset()!.id}.geojson`)
          .then((response) => {
            console.log(response);
            return response.json();
          })
          .then((geojsonData) => {
            // TODO: write a custom addLayer function for example dataset
            // (allowing to use the types and the defaultProjection declared
            // in the datasets.json file)
            if (!globalStore.userHasAddedLayer) {
              setLayersDescriptionStore(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    // eslint-disable-next-line no-param-reassign
                    draft.layers = [];
                  },
                ),
              );
              setGlobalStore({ userHasAddedLayer: true });
            }

            addLayer(geojsonData, selectedDataset()!.id, true, true);
          });
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
      height: '80vh',
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
      height: '80vh',
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
