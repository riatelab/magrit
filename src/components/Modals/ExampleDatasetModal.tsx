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
import { yieldOrContinue } from 'main-thread-scheduling';
import { FaSolidDatabase } from 'solid-icons/fa';
import { ImFilter } from 'solid-icons/im';
import { HiSolidDocumentText } from 'solid-icons/hi';
import { BsMap } from 'solid-icons/bs';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import rewindLayer from '../../helpers/rewind';
import { getGeometryType } from '../../helpers/formatConversion';
import { generateIdLayer, getDefaultRenderingParams } from '../../helpers/layers';
import {
  findSuitableName, isFiniteNumber, isNonNull, removeDiacritics,
} from '../../helpers/common';
import { makeDefaultLegendDescription } from '../../helpers/legends';
import { epsgDb, removeNadGrids } from '../../helpers/projection';
import { patchProject } from '../../helpers/project';

// Stores
import { setApplicationSettingsStore } from '../../store/ApplicationSettingsStore';
import {
  globalStore, setGlobalStore,
  setLoading, setReloadingProject,
} from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  type LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { setModalStore } from '../../store/ModalStore';
import { fitExtent, setMapStore, setMapStoreBase } from '../../store/MapStore';

// Subcomponents
import Pagination from '../Pagination.tsx';

// Assets
import allDatasets from '../../assets/datasets.json';
import allTemplates from '../../assets/templates.json';

// Types
import {
  DefaultLegend, GeoJSONFeatureCollection, LayerDescription, ProjectDescription,
} from '../../global';
import type { Variable } from '../../helpers/typeDetection';
import type { Translation, TranslationFunctions } from '../../i18n/i18n-types';

type CartographicProjection = { type: 'd3', value: 'string' } | { type: 'proj4', code: number };

interface TemplateEntry {
  id: string & keyof Translation['Templates'],
  active: boolean,
  layers: TemplateLayer[],
  defaultProjection: CartographicProjection,
}

interface TemplateLayer {
  id: string,
  role: 'main' | 'layout',
  type: 'vector' | 'raster',
  totalFeatures: number,
}

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
  id: string & keyof Translation['Datasets'],
  // Do we currently propose the dataset in the ui ?
  active: boolean,
  // Type of dataset
  type: 'vector' | 'raster';
  // The total number of features in the dataset (vector)
  // or the total number of pixels in the dataset (raster)
  totalFeatures: number;
  // Information about the cartographic projection in which the dataset
  // should be displayed
  // Type is 'd3' for d3 projections (with value like "NaturalEarth2")
  // and 'proj4' for proj4 projections (with code like 2154)
  defaultProjection: CartographicProjection,
  // Information about the geometry provider
  geometry: DataProvider,
  // Information about the data provider(s)
  data: DataProvider[],
  // Information about the various fields in the dataset
  fields: (Variable & { provenance: number })[],
}

const datasets = allDatasets.filter((d) => d.active) as unknown as DatasetEntry[];
const templates = allTemplates.filter((t) => t.active) as unknown as TemplateEntry[];

const findMaxEntryPerPage = () => {
  const height = window.innerHeight;
  if (height < 680) {
    return 2;
  }
  if (height < 1000) {
    return 4;
  }
  return 6;
};

function CardTemplateEntry(
  t: TemplateEntry & { onClick: (arg0: MouseEvent) => void },
): JSX.Element {
  const { LL } = useI18nContext();
  return <div
    class="card is-clickable"
    style={{ margin: '1em', 'max-height': '208px' }}
    onClick={(e) => t.onClick(e)}
  >
    <header class="card-header" style={{ 'box-shadow': 'none' }}>
      <p class="card-header-title">
        <FaSolidDatabase style={{ height: '1.2em', width: '1.8em' }}/>
        <span style={{ 'font-size': '1.3em' }}>{LL().Templates[t.id].name()}</span>
      </p>
    </header>
    <section class="card-content">
      <div class="content">
        {LL().Templates[t.id].abstract()}
      </div>
    </section>
  </div>;
}

function TemplatePage(
  props: {
    templateEntries: TemplateEntry[],
    setSelectedTemplate: Setter<TemplateEntry | null>,
    offset: number,
    maxEntryPerPage: number,
  },
): JSX.Element {
  return <div
    style={{
      display: 'grid',
      'grid-template-columns': '1fr 1fr',
      height: '78%',
      'overflow-y': 'auto',
    }}>
    <For each={props.templateEntries.slice(props.offset, props.offset + props.maxEntryPerPage)}>
      {
        (t) => <CardTemplateEntry
          {...t}
          onClick={() => props.setSelectedTemplate(t)}
        />
      }
    </For>
  </div>;
}

function CardDatasetEntry(
  ds: DatasetEntry & { onClick: (arg0: MouseEvent) => void },
): JSX.Element {
  const { LL } = useI18nContext();
  return <div
    class="card is-clickable"
    style={{ margin: '1em', 'max-height': '208px' }}
    onClick={(e) => ds.onClick(e)}
  >
    <header class="card-header" style={{ 'box-shadow': 'none' }}>
      <p class="card-header-title">
        <FaSolidDatabase style={{ height: '1.2em', width: '1.8em' }}/>
        <span style={{ 'font-size': '1.3em' }}>{ LL().Datasets[ds.id].name() }</span>
      </p>
    </header>
    <section class="card-content">
      <div class="content">
        { LL().Datasets[ds.id].abstract() }
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
  return <div
    style={{
      display: 'grid',
      'grid-template-columns': '1fr 1fr',
      height: '78%',
      'overflow-y': 'auto',
    }}>
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

function CardTemplateDetail(t: TemplateEntry): JSX.Element {
  const { LL } = useI18nContext();
  return <div>
    <h3>{LL().Templates[t.id].name()}</h3>
    <h4>{LL().DatasetCatalog.about()}</h4>
    <div>
      <table>
        <tbody>
        <tr>
          <td>{LL().DatasetCatalog.layers()}</td>
          <td>{t.layers.map((l) => LL().Templates[t.id].layers[l.id]()).join(', ')}</td>
        </tr>
        </tbody>
      </table>
    </div>
    <br/>
    <h4>{LL().DatasetCatalog.description()}</h4>
    <div>
      <p>{LL().Templates[t.id].abstract()}</p>
    </div>
    <h4>{LL().DatasetCatalog.preview()}</h4>
    <div class="has-text-centered">
      <img
        src={`template/${t.id}.png`}
        class="image"
        style={{ border: 'solid 1px silver', width: '300px', margin: 'auto' }}
        alt={LL().DatasetCatalog.altTemplatePreview()}
      />
    </div>
  </div>;
}

function CardDatasetDetail(ds: DatasetEntry): JSX.Element {
  const { LL } = useI18nContext();
  return <div>
    <h3>{LL().Datasets[ds.id].name()}</h3>
    <h4>{LL().DatasetCatalog.about()}</h4>
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
            ds.data.map((d, i) => LL().Datasets[ds.id].dataAttribution[`${i + 1}`]()).join(', ')}</td>
        </tr>
        <tr>
          <td>{LL().DatasetCatalog.licenceData()}</td>
          <td>{ds.data.map((d) => d.license).filter((d) => !!d).join(', ')}</td>
        </tr>
        </tbody>
      </table>
    </div>
    <br/>
    <h4>{LL().DatasetCatalog.description()}</h4>
    <div>
      <p> {LL().Datasets[ds.id].abstract()}</p>
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
              <td>{LL().Datasets[ds.id].fields[variableDescription.name]()}</td>
              <td>{
                variableDescription.provenance === 0
                  ? LL().Datasets[ds.id].geometryAttribution()
                  : LL().Datasets[ds.id].dataAttribution[variableDescription.provenance]()

              }</td>
            </tr>
          }
        </For>
      </tbody>
    </table>
    <h4>{LL().DatasetCatalog.preview() }</h4>
    <div class="has-text-centered">
      <img
        src={`dataset/${ds.id}.png`}
        class="image"
        style={{ border: 'solid 1px silver', width: '300px', margin: 'auto' }}
        alt={LL().DatasetCatalog.altDatasetPreview()}
      />
    </div>
  </div>;
}

function addExampleLayer(
  geojson: GeoJSONFeatureCollection,
  name: string,
  projection: { type: 'd3', value: 'string' } | { type: 'proj4', code: number },
  fields: (Variable & { provenance: number })[],
): string {
  const rewoundGeojson = rewindLayer(geojson, true);
  const geomType = getGeometryType(rewoundGeojson);
  const layerId = generateIdLayer();

  // Read the type of the fields from the metadata
  const fieldsDescription: Variable[] = fields.map((v) => ({
    name: v.name,
    dataType: v.dataType,
    type: v.type,
    hasMissingValues: v.hasMissingValues,
  } as Variable));

  // Cast values to the detected field type if possible and needed
  fieldsDescription.forEach((field) => {
    if (field.dataType === 'number') {
      rewoundGeojson.features.forEach((ft) => {
        // eslint-disable-next-line no-param-reassign
        ft.properties[field.name] = isFiniteNumber(ft.properties[field.name])
          ? +ft.properties[field.name]
          : null;
      });
    } else {
      rewoundGeojson.features.forEach((ft) => {
        // eslint-disable-next-line no-param-reassign
        ft.properties[field.name] = isNonNull(ft.properties[field.name])
          ? ft.properties[field.name]
          : null;
      });
    }
  });

  const safeName = findSuitableName(
    name,
    layersDescriptionStore.layers.map((l) => l.name),
  );

  // Add the new layer (and the corresponding legend)
  // to the LayerManager by adding it to the layersDescriptionStore
  const newLayerDescription = {
    id: layerId,
    name: safeName,
    type: geomType,
    data: rewoundGeojson,
    visible: true,
    fields: fieldsDescription,
    ...getDefaultRenderingParams(geomType),
    shapeRendering: 'auto',
    // shapeRendering: geomType === 'polygon'
    //   && rewoundGeojson.features.length > 10000 ? 'optimizeSpeed' : 'auto',
  } as LayerDescription;

  const newLegendDescription = makeDefaultLegendDescription(newLayerDescription);

  const fit = layersDescriptionStore.layers.length === 0 || !globalStore.userHasAddedLayer;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        if (!globalStore.userHasAddedLayer) {
          // eslint-disable-next-line no-param-reassign
          draft.layers = [];
          setGlobalStore({ userHasAddedLayer: true });
        }
        draft.layers.push(newLayerDescription as LayerDescription);
        draft.layoutFeaturesAndLegends.push(newLegendDescription as DefaultLegend);
      },
    ),
  );

  // Change the projection of the map if needed
  if (projection.type === 'd3') {
    setMapStore(
      'projection',
      {
        name: projection.value,
        value: `geo${projection.value}`,
        type: 'd3',
      },
    );
  } else { // projetion.type === 'proj4'
    const proj = epsgDb[projection.code];
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

  // Fit extent to the new layer if its the first layer added
  if (fit) {
    fitExtent(layerId);
  }

  return layerId;
}

const reloadFromProjectObject = async (obj: ProjectDescription): Promise<void> => {
  // Set the app in "reloading" mode
  // (it displays a loading overlay and prevents the user from adding new layers
  // it  also set a flag the enable restoring the extent of the map
  // - more details in store/MapStore.ts)
  setReloadingProject(true);

  await yieldOrContinue('smooth');

  // Get the different parts of the project
  // after applying the necessary patches
  // for making it compatible with the current version of the application
  // if necessary.
  const {
    version,
    applicationSettings,
    layers,
    layoutFeaturesAndLegends,
    map,
    tables,
  } = patchProject(obj);

  // Reset the application settings store
  setApplicationSettingsStore(applicationSettings);
  // Reset the layers description store before changing the map store
  // (this avoid redrawing the map for the potential current layers)
  setLayersDescriptionStore({ layers: [], layoutFeaturesAndLegends: [], tables: [] });
  // Update the layer description store with the layers and layout features
  setLayersDescriptionStore({ layers, layoutFeaturesAndLegends, tables });
  // Update the map store
  // (this updates the projection and pathGenerator in the global store)
  setMapStoreBase(map);
  // Reverse the "userHasAddedLayer" flag
  setGlobalStore({ userHasAddedLayer: true });
  // Hide the loading overlay
  setReloadingProject(false);
};

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
  // Reference to parent element
  let refParentElement: HTMLDivElement;
  // Current tab
  const [
    currentTab,
    setCurrentTab,
  ] = createSignal<'datasets' | 'templates'>('datasets');
  // The maximum number of entries per page
  const [
    maxEntryPerPage,
    setMaxEntryPerPage,
  ] = createSignal(findMaxEntryPerPage());

  // Stuff for the 'datasets' tab:
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
  const [currentPageDataset, setCurrentPageDataset] = createSignal<number>(1);
  // The offset of the current page (i.e. the index of the first entry of the page)
  const offsetDataset = createMemo(() => (currentPageDataset() - 1) * maxEntryPerPage());
  // The total number of pages
  const totalPagesDataset = createMemo(
    () => Math.ceil(filteredDatasets().length / maxEntryPerPage()),
  );

  // Stuff for the 'templates' tab:
  const [
    filteredTemplates,
    setFilteredTemplates,
  ] = createSignal<TemplateEntry[]>(templates);
  const [
    selectedTemplate,
    setSelectedTemplate,
  ] = createSignal<TemplateEntry | null>(null);
  // The page that is currently displayed
  const [currentPageTemplate, setCurrentPageTemplate] = createSignal<number>(1);
  // The offset of the current page (i.e. the index of the first entry of the page)
  const offsetTemplate = createMemo(() => (currentPageTemplate() - 1) * maxEntryPerPage());
  // The total number of pages
  const totalPagesTemplate = createMemo(
    () => Math.ceil(filteredTemplates().length / maxEntryPerPage()),
  );

  // Filter the datasets using the search terms
  // (for now we are only filtering on exact matches on the keywords)
  const filterDs = () => {
    if (selectedSearchTerms() === '') {
      return datasets;
    }
    const terms = selectedSearchTerms()
      .split(' ')
      .map((t) => removeDiacritics(t.toLowerCase()));

    return datasets.filter((ds) => {
      let found = false;
      const keywords = LL().Datasets[ds.id].keywords().split(',').map((k) => removeDiacritics(k.trim().toLowerCase()));
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

  // Filter the templates using the search terms
  const filterTemp = (): TemplateEntry[] => {
    if (selectedSearchTerms() === '') {
      return templates;
    }
    const terms = selectedSearchTerms()
      .split(' ')
      .map((t) => removeDiacritics(t.toLowerCase()));

    return templates.filter((ds) => true);
  };

  onMount(() => {
    setModalStore({
      confirmCallback: () => {
        if (currentTab() === 'datasets') {
          setLoading(true);
          fetch(`dataset/${selectedDataset()!.id}.geojson`)
            .then((response) => response.json())
            .then((geojsonData) => {
              addExampleLayer(
                geojsonData,
                selectedDataset()!.id,
                selectedDataset()!.defaultProjection,
                selectedDataset()!.fields,
              );
            })
            .finally(() => {
              setLoading(false);
            });
        } else { // currentTab() === 'templates'
          setLoading(true);
          fetch(`template/${selectedTemplate()!.id}.mjson`)
            .then((response) => response.json())
            .then(async (project) => {
              await reloadFromProjectObject(project);
            })
            .finally(() => {
              setLoading(false);
            });
        }
      },
    });

    const modalResizeObserver = new ResizeObserver((entries) => {
      entries.forEach(() => {
        setMaxEntryPerPage(findMaxEntryPerPage());
      });
    });

    modalResizeObserver.observe(document.querySelector('.catalog-container')!);

    (refParentElement.querySelector('input.search-field') as HTMLInputElement).focus();
  });

  createEffect(
    on(
      () => [selectedDataset(), selectedTemplate()],
      () => {
        if (selectedDataset() !== null || selectedTemplate() !== null) {
          document.querySelector('.modal .button.confirm-button')!.removeAttribute('disabled');
        } else {
          document.querySelector('.modal .button.confirm-button')!.setAttribute('disabled', 'true');
        }
      },
    ),
  );

  createEffect(
    on(
      () => currentTab(),
      () => {
        // Focus on the search bar when switching tabs
        (refParentElement.querySelector('input.search-field') as HTMLInputElement)
          .focus();
        // Remove any search terms when switching tabs
        setSelectedSearchTerms('');
        // Remove any selected dataset / template
        setSelectedTemplate(null);
        setSelectedDataset(null);
      },
    ),
  );

  return <div
    class="catalog-container"
    style={{ height: '80vh' }}
    ref={refParentElement!}
  >
  <div class="tabs is-boxed">
      <ul style={{ margin: 0 }}>
        <li classList={{ 'is-active': currentTab() === 'datasets' }}>
          <a onClick={() => {
            setCurrentTab('datasets');
          }}>
            <span class="icon is-small"><BsMap/></span>
            <span>{LL().DatasetCatalog.tabDatasets()}</span>
          </a>
        </li>
        <li classList={{ 'is-active': currentTab() === 'templates' }}>
          <a onClick={() => {
            setCurrentTab('templates');
          }}>
            <span class="icon is-small"><HiSolidDocumentText/></span>
            <span>{LL().DatasetCatalog.tabTemplates()}</span>
          </a>
        </li>
      </ul>
    </div>
    <Show when={currentTab() === 'datasets'}>
      <div class="is-flex catalog__datasets">
        <div style={{
          width: '60%',
          padding: '1em',
          margin: '1em',
          border: 'solid 1px silver',
          'border-radius': '1em',
          overflow: 'auto',
          height: '72vh',
        }}>
          <div class="is-flex">
            <div class="field has-addons" style={{ margin: '1em' }}>
              <div class="control">
                <input
                  class="input search-field"
                  type="text"
                  value={selectedSearchTerms()}
                  style={{ width: '300px' }}
                  onChange={(e) => setSelectedSearchTerms(e.currentTarget.value)}
                  placeholder={LL().DatasetCatalog.placeholderSearchBar()}
                />
              </div>
              <div class="control">
                <button
                  class="button is-info"
                  onClick={() => {
                    setCurrentPageDataset(1);
                    setFilteredDatasets(filterDs());
                  }}
                >
                  {LL().DatasetCatalog.searchButton()}
                </button>
              </div>
              <div class="control">
                <button
                  class="button is-warning"
                  onClick={() => {
                    setSelectedSearchTerms('');
                    setCurrentPageDataset(1);
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
                  height: '1.5em',
                  width: '1.5em',
                  'margin-right': '1em',
                  opacity: filteredDatasets().length === datasets.length ? 0 : 1,
                }}
              />
              <span>{LL().DatasetCatalog.datasets(filteredDatasets().length)}</span>
            </div>
          </div>
          <Show
            when={filteredDatasets().length > 0}
            fallback={<p>{LL().DatasetCatalog.noSearchResult()}</p>}
          >
            <DatasetPage
              setSelectedDataset={setSelectedDataset}
              offset={offsetDataset()}
              maxEntryPerPage={maxEntryPerPage()}
              datasetEntries={filteredDatasets()}
            />
            <Pagination
              totalPages={totalPagesDataset()}
              onClick={(pageNumber) => setCurrentPageDataset(pageNumber)}
              currentPage={currentPageDataset()}
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
          height: '72vh',
        }}>
          <div>
            <Show
              when={selectedDataset() !== null}
              fallback={<p>{LL().DatasetCatalog.placeholderDatasetDetail()}</p>}
            >
              <CardDatasetDetail {...selectedDataset() as DatasetEntry} />
            </Show>
          </div>
        </div>
      </div>
    </Show>
    <Show when={currentTab() === 'templates'}>
      <div class="is-flex catalog__templates">
        <div style={{
          width: '60%',
          padding: '1em',
          margin: '1em',
          border: 'solid 1px silver',
          'border-radius': '1em',
          overflow: 'auto',
          height: '72vh',
        }}>
          <div class="is-flex">
            <div class="field has-addons" style={{ margin: '1em' }}>
              <div class="control">
                <input
                  class="input search-field"
                  type="text"
                  value={selectedSearchTerms()}
                  style={{ width: '300px' }}
                  onChange={(e) => setSelectedSearchTerms(e.currentTarget.value)}
                  placeholder={LL().DatasetCatalog.placeholderSearchBar()}
                />
              </div>
              <div class="control">
                <button
                  class="button is-info"
                  onClick={() => {
                    setCurrentPageDataset(1);
                    setFilteredTemplates(filterTemp());
                  }}
                >
                  {LL().DatasetCatalog.searchButton()}
                </button>
              </div>
              <div class="control">
                <button
                  class="button is-warning"
                  onClick={() => {
                    setSelectedSearchTerms('');
                    setCurrentPageTemplate(1);
                    setFilteredDatasets(filterTemp());
                  }}
                >
                  X
                </button>
              </div>
            </div>
            <div class="field" style={{ margin: '1em', 'justify-content': 'start' }}>
              <ImFilter
                style={{
                  height: '1.5em',
                  width: '1.5em',
                  'margin-right': '1em',
                  opacity: filteredTemplates().length === datasets.length ? 0 : 1,
                }}
              />
              <span>{LL().DatasetCatalog.datasets(filteredTemplates().length)}</span>
            </div>
          </div>
          <Show
            when={filteredTemplates().length > 0}
            fallback={<p>{LL().DatasetCatalog.noSearchResult()}</p>}
          >
            <TemplatePage
              setSelectedTemplate={setSelectedTemplate}
              offset={offsetTemplate()}
              maxEntryPerPage={maxEntryPerPage()}
              templateEntries={filteredTemplates()}
            />
            <Pagination
              totalPages={totalPagesTemplate()}
              onClick={(pageNumber) => setCurrentPageTemplate(pageNumber)}
              currentPage={currentPageTemplate()}
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
          height: '72vh',
        }}>
          <div>
            <Show
              when={selectedTemplate() !== null}
              fallback={<p>{LL().DatasetCatalog.placeholderTemplateDetail()}</p>}
            >
              <CardTemplateDetail {...selectedTemplate() as TemplateEntry} />
            </Show>
          </div>
        </div>
      </div>
    </Show>
  </div>;
}
