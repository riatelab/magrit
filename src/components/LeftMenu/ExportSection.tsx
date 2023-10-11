// Imports from solid-js
import {
  createSignal, JSX, Show,
} from 'solid-js';

// Helpers
import { exportMapToPng, exportMapToSvg, exportToGeo } from '../../helpers/exports';
import { useI18nContext } from '../../i18n/i18n-solid';
import { isExportableLayer } from '../../helpers/layerDescription';
import { SupportedGeoFileTypes } from '../../helpers/supportedFormats';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';

// Sub-components
import DropdownMenu from '../DropdownMenu.tsx';

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
  (document.getElementById(`export-section__content__${tab}`) as HTMLElement).classList.remove('is-hidden');
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

async function exportToGeoWrapper(
  selectedLayer: string,
  selectedFormat: string,
  selectedCrs: string,
  customCrs: string,
) {
  const layer = layersDescriptionStore.layers
    .find((l) => l.name === selectedLayer);

  // This should never happen
  // (as the dropdown menu should not allow to select a layer that does not exist).
  // Here we just add a check to avoid a crash if it happens and to
  // make the compiler happy about latter use of 'layer' variable.
  if (!layer) throw new Error(`Layer ${selectedLayer} not found !`);

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

  const [clipCurrentExtentChecked, setClipCurrentExtentChecked] = createSignal(true);
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
        <div class="field">
          <label class="label" for="export-section__content__svg__clip-current-extent">
            { LL().ExportSection.ClipSvgCurrentExtent() }
          </label>
          <input
            type="checkbox"
            id="export-section__content__svg__clip-current-extent"
            checked={clipCurrentExtentChecked()}
            onChange={(ev: Event) => setClipCurrentExtentChecked(!clipCurrentExtentChecked())}
          />
        </div>
        <div class="has-text-centered">
          <button
            onClick={ async () => { await exportMapToSvg('export.svg', clipCurrentExtentChecked()); } }
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
        <DropdownMenu
          id={'export-section__content__geo__layers'}
          entries={
            layersDescriptionStore.layers
              .filter(isExportableLayer)
              .map((layer) => ({ name: layer.name, value: layer.name }))
          }
          defaultEntry={{ name: LL().ExportSection.SelectLayers() }}
          onChange={(layerName) => setSelectedLayer(layerName)}
        />
        <br/>
        <br/>
        <Show when={ selectedLayer() !== null }>
          <DropdownMenu
            id={'export-section__content__geo__formats'}
            entries={
              Object.keys(SupportedGeoFileTypes)
                .map((format) => ({ name: format, value: format }))
            }
            defaultEntry={{ name: LL().ExportSection.SelectFormat() }}
            onChange={(formatName) => setSelectedFormat(formatName)}
          />
          <br/>
          <br/>
        </Show>
        <Show
          when={selectedLayer() && selectedFormat() && !noCrsFormats.includes(selectedFormat()!)}
        >
          <DropdownMenu
            id={'export-section__content__geo__crs'}
            entries={ predefinedCrs.map((n) => ({ name: n, value: n })) }
            defaultEntry={{ name: LL().ExportSection.SelectCRS() }}
            onChange={(crsName) => setSelectedCrs(crsName)}
          />
        <br/>
        <br/>
        </Show>
        <Show
          when={
            selectedLayer()
            && selectedFormat()
            && !noCrsFormats.includes(selectedFormat()!)
            && selectedCrs() === LL().ExportSection.CustomCRS()
          }
        >
          <div>
            <input
              class="input"
              type="text"
              placeholder="+proj=moll +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs +type=crs"
              onKeyUp={ (ev) => setCustomCrs(ev.target.value) }
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
                selectedLayer()!,
                selectedFormat()!,
                selectedCrs()!,
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
