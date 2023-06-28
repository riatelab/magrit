import {
  createSignal, For, JSX, Show,
} from 'solid-js';
import { FaSolidAngleDown } from 'solid-icons/fa';
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { exportMapToPng, exportMapToSvg, exportToGeo } from '../../helpers/exports';
import { useI18nContext } from '../../i18n/i18n-solid';
import { SupportedGeoFileTypes } from '../../helpers/supportedFormats';

const noCrsFormats = ['GeoJSON', 'CSV', 'KML', 'TopoJSON'];

function onClickTabButton(event: Event, tab: string) {
  const tabsParentElement = event.currentTarget.parentElement.parentElement.parentElement;
  // Change the active tab
  const tabButtons = tabsParentElement.querySelectorAll('li.is-active');
  for (let i = 0; i < tabButtons.length; i++) { // eslint-disable-line no-plusplus
    tabButtons[i].classList.remove('is-active');
  }
  event.currentTarget.parentElement.classList.add('is-active');
  // Get all elements with class="tab-content" and hide them
  const tabContent = document.querySelectorAll('.export-section__content > div');
  for (let i = 0; i < tabContent.length; i++) { // eslint-disable-line no-plusplus
    tabContent[i].classList.add('is-hidden');
  }
  // Remove the class 'is-hidden' on the tab that should be opened by the button
  document.getElementById(`export-section__content__${tab}`).classList.remove('is-hidden');
}

function isButtonDisabled(
  selectedLayer: string | null,
  selectedFormat: string | null,
  selectedCrs: string | null,
  customCrs: string,
): boolean {
  if (!selectedLayer) return true;
  if (!selectedFormat) return true;
  if (!noCrsFormats.includes(selectedFormat) && !selectedCrs) return true;
  if (typeof selectedCrs === 'string' && selectedCrs.indexOf('EPSG') && customCrs === '') return true;
  return false;
}

function setDropdownItemTarget(event: Event) {
  const target = event.currentTarget as HTMLElement;
  const dropdownItemTarget = target
    .parentElement
    .parentElement
    .parentElement
    .querySelector('.dropdown-item-target');
  dropdownItemTarget.textContent = target.textContent;
}

async function exportToGeoWrapper(
  selectedLayer: string,
  selectedFormat: string,
  selectedCrs: string,
  customCrs: string,
) {
  const layer = layersDescriptionStore.layers
    .find((l) => l.name === selectedLayer);

  // eslint-disable-next-line no-nested-ternary
  const crs = noCrsFormats.includes(selectedFormat)
    ? null
    : selectedCrs.indexOf('EPSG') === 0
      ? selectedCrs
      : customCrs;
  // TODO : validate CRS if custom
  await exportToGeo(layer.data, layer.name, SupportedGeoFileTypes[selectedFormat], crs);
}

/**
 * This component is responsible for exporting the current map to a file as well as for exporting
 * the data from the current map to a file.
 *
 * @constructor
 */
export default function ExportSection(): JSX.Element {
  const { LL } = useI18nContext();
  const predefinedCrs = [
    'EPSG:4326',
    'EPSG:3857',
    'EPSG:2154',
    'EPSG:3035',
    LL().ExportSection.CustomCRS(),
  ];
  const [selectedLayer, setSelectedLayer] = createSignal(null);
  const [selectedFormat, setSelectedFormat] = createSignal(null);
  const [selectedCrs, setSelectedCrs] = createSignal(null);
  const [customCrs, setCustomCrs] = createSignal('');
  return <div class="export-section">
    <div class="export-section__tabs tabs is-centered is-boxed is-fullwidth">
      <ul class="ml-0">
        <li class="is-active">
          <a onClick={(ev) => onClickTabButton(ev, 'svg')}>
            <span>SVG</span>
          </a>
        </li>
        <li>
          <a onClick={(ev) => onClickTabButton(ev, 'png')}>
            <span>PNG</span>
          </a>
        </li>
        <li>
          <a onClick={(ev) => onClickTabButton(ev, 'geo')}>
            <span>{ LL().ExportSection.Layers() }</span>
          </a>
        </li>
      </ul>
    </div>
    <div class="export-section__content">
      <div id="export-section__content__svg">
        <div class="has-text-centered">
          <button
            onClick={ async () => { await exportMapToSvg('export.svg', false); } }
            class="button is-success"
          >
            { LL().ExportSection.ExportSvg() }
          </button>
        </div>

      </div>
      <div id="export-section__content__png" class="is-hidden">
        <div class="has-text-centered">
          <button
            onClick={ async () => { await exportMapToPng('export.png', 1); } }
            class="button is-success"
          >
            { LL().ExportSection.ExportPng() }
          </button>
        </div>
      </div>
      <div id="export-section__content__geo" class="is-hidden">
        <div class="dropdown is-hoverable dropdown__layer" style={{ width: '100%' }}>
          <div class="dropdown-trigger" style={{ width: '100%' }}>
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu-export-geo-file" style={{ width: '100%' }}>
              <span
                class="dropdown-item-target"
                style={{
                  width: '100%',
                  'text-overflow': 'ellipsis',
                  overflow: 'hidden',
                  'text-align': 'left',
                }}
              >
                { LL().ExportSection.SelectLayers() }
              </span>
              <span class="icon is-small">
                <FaSolidAngleDown />
              </span>
            </button>
          </div>
          <div class="dropdown-menu" id="dropdown-menu-export-geo-file" role="menu">
            <div class="dropdown-content">
              <For each={layersDescriptionStore.layers.map((layer) => layer.name)}>
                {(layerName) => (
                  <a href="#" class="dropdown-item" onClick={ (ev) => {
                    setDropdownItemTarget(ev);
                    setSelectedLayer(layerName);
                  } }>
                    {layerName}
                  </a>
                )}
              </For>
            </div>
          </div>
        </div>
        <br/><br/>
        <div class="dropdown is-hoverable dropdown__format" style={{ width: '100%' }}>
          <div class="dropdown-trigger" style={{ width: '100%' }}>
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu-export-geo-format" style={{ width: '100%' }}>
              <span
                class="dropdown-item-target"
                style={{
                  width: '100%',
                  'text-overflow': 'ellipsis',
                  overflow: 'hidden',
                  'text-align': 'left',
                }}
              >
                { LL().ExportSection.SelectFormat() }
              </span>
              <span class="icon is-small">
                <FaSolidAngleDown />
              </span>
            </button>
          </div>
          <div class="dropdown-menu" id="dropdown-menu-export-geo-format" role="menu">
            <div class="dropdown-content">
              <For each={Object.keys(SupportedGeoFileTypes)}>
                {(formatName) => (
                  <a href="#" class="dropdown-item" onClick={ (ev) => {
                    setDropdownItemTarget(ev);
                    setSelectedFormat(formatName);
                  } }>
                    {formatName}
                  </a>
                )}
              </For>
            </div>
          </div>
        </div>
        <br/>
        <br/>
        <Show when={ !noCrsFormats.includes(selectedFormat()) }>
          <div class="dropdown is-hoverable dropdown__crs" style={{ width: '100%' }}>
            <div class="dropdown-trigger" style={{ width: '100%' }}>
              <button class="button" aria-haspopup="true" aria-controls="dropdown-menu-export-geo-crs" style={{ width: '100%' }}>
                <span
                  class="dropdown-item-target"
                  style={{
                    width: '100%',
                    'text-overflow': 'ellipsis',
                    overflow: 'hidden',
                    'text-align': 'left',
                  }}
                >
                  { LL().ExportSection.SelectCRS() }
                </span>
                <span class="icon is-small">
                  <FaSolidAngleDown />
                </span>
              </button>
            </div>
            <div class="dropdown-menu" id="dropdown-menu-export-geo-crs" role="menu">
              <div class="dropdown-content">
                <For each={predefinedCrs}>
                  {(crsName) => (
                    <a href="#" class="dropdown-item" onClick={ (ev) => {
                      setDropdownItemTarget(ev);
                      setSelectedCrs(crsName);
                    } }>
                      {crsName}
                    </a>
                  )}
                </For>
              </div>
            </div>
          </div>
        <br/>
        <br/>
        </Show>
        <Show when={ selectedCrs() === LL().ExportSection.CustomCRS() }>
          <div>
            <input
              class="input"
              type="text"
              placeholder="+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs"
              onChange={ (ev) => setCustomCrs(ev.target.value) }
            />
          </div>
          <br/>
          <br/>
        </Show>
        <div class="has-text-centered">
          <button
            class="button is-success text-align-center"
            disabled={ isButtonDisabled(
              selectedLayer(),
              selectedFormat(),
              selectedCrs(),
              customCrs(),
            )}
            onClick={ async () => {
              await exportToGeoWrapper(
                selectedLayer(),
                selectedFormat(),
                selectedCrs(),
                customCrs(),
              );
            } }
          >
            { LL().ExportSection.Export() }
          </button>
        </div>
      </div>
    </div>
  </div>;
}
