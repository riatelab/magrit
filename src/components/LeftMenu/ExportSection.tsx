// Imports from solid-js
import {
  createEffect,
  createSignal, JSX, Show,
} from 'solid-js';

// Helpers
import { exportMapToPng, exportMapToSvg, exportToGeo } from '../../helpers/exports';
import { useI18nContext } from '../../i18n/i18n-solid';
import { isExportableLayer } from '../../helpers/layerDescription';
import { Mround } from '../../helpers/math';
import { SupportedGeoFileTypes } from '../../helpers/supportedFormats';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { mapStore } from '../../store/MapStore';

// Sub-components
import DropdownMenu from '../DropdownMenu.tsx';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';

const noCrsFormats = ['GeoJSON', 'CSV', 'KML', 'TopoJSON'];

function onClickTabButton(event: Event & { currentTarget: HTMLAnchorElement }, tab: string) {
  const tabsParentElement = event.currentTarget.parentElement!.parentElement!.parentElement!;

  // Change the active tab, reflect the change in the aria-selected attribute
  const tabButtons = tabsParentElement.querySelectorAll('li.is-active');
  for (let i = 0; i < tabButtons.length; i++) { // eslint-disable-line no-plusplus
    tabButtons[i].classList.remove('is-active');
    tabButtons[i].firstElementChild!.setAttribute('aria-selected', 'false');
  }
  event.currentTarget.parentElement!.classList.add('is-active');
  event.currentTarget.setAttribute('aria-selected', 'true');
  // Get all elements with class="tab-content" and hide them
  const tabContent = document.querySelectorAll('.export-section__content > div');
  for (let i = 0; i < tabContent.length; i++) { // eslint-disable-line no-plusplus
    tabContent[i].classList.add('is-hidden');
    tabContent[i].setAttribute('hidden', 'hidden');
  }

  // Remove the class 'is-hidden' on the tab that should be opened by the button
  // and the attribute 'hidden'
  const displayedTab = document.getElementById(`export-section__content__${tab}`) as HTMLElement;
  displayedTab.classList.remove('is-hidden');
  displayedTab.removeAttribute('hidden');
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
  const [
    exportWidth,
    setExportWidth,
  ] = createSignal(mapStore.mapDimensions.width);
  const [
    exportHeight,
    setExportHeight,
  ] = createSignal(mapStore.mapDimensions.height);

  // We also want to update the width and height
  // displayed in these menu when the map dimensions change
  createEffect(() => {
    setExportWidth(mapStore.mapDimensions.width);
    setExportHeight(mapStore.mapDimensions.height);
  });

  // TODO: handle focusing on the tab names to allow keyboard navigation between tabs
  //  (currently the focus is inside the tab content, so the user can't
  //  navigate between tabs using the keyboard)
  return <div class="export-section">
    <div class="export-section__tabs tabs is-centered is-boxed is-fullwidth">
      <ul class="ml-0" role="tablist" aria-label={LL().ExportSection.Description()}>
        <li class="is-active" role="presentation">
          <a
            id="export-section__content__svg-tab"
            onClick={(ev) => onClickTabButton(ev, 'svg')}
            aria-controls="export-section__content__svg"
            aria-selected="true"
            role="tab"
          >
            SVG
          </a>
        </li>
        <li role="presentation">
          <a
            id="export-section__content__png-tab"
            onClick={(ev) => onClickTabButton(ev, 'png')}
            aria-controls="export-section__content__png"
            role="tab"
          >
            PNG
          </a>
        </li>
        <li role="presentation">
          <a
            id="export-section__content__geo-tab"
            onClick={(ev) => onClickTabButton(ev, 'geo')}
            aria-controls="export-section__content__geo"
            role="tab"
          >
            { LL().ExportSection.Layers() }
          </a>
        </li>
      </ul>
    </div>
    <div class="export-section__content">
      <div
        id="export-section__content__svg"
        role="tabpanel"
        tabindex="0"
        aria-labelledby="export-section__content__svg-tab"
      >
        <InputFieldCheckbox
          label={ LL().ExportSection.ClipSvgCurrentExtent() }
          checked={ clipCurrentExtentChecked() }
          onChange={(checked) => setClipCurrentExtentChecked(checked)}
        />
        <div class="has-text-centered">
          <button
            onClick={ async () => { await exportMapToSvg('export.svg', clipCurrentExtentChecked()); } }
            class="button is-success"
          >
            { LL().ExportSection.ExportSvg() }
          </button>
        </div>

      </div>
      <div
        id="export-section__content__png"
        role="tabpanel"
        tabindex="0"
        class="is-hidden"
        aria-labelledby="export-section__content__png-tab"
      >
        <InputFieldNumber
          label={ LL().ExportSection.Width() }
          value={ exportWidth() }
          onChange={(v) => {
            const { width, height } = mapStore.mapDimensions;
            const ratio = height / width;
            const computedValue = Mround(v * ratio * 10) / 10;
            setExportWidth(v);
            setExportHeight(computedValue);
          }}
          min={1}
          max={10000}
          step={0.1}
        />
        <InputFieldNumber
          label={ LL().ExportSection.Height() }
          value={ exportHeight() }
          onChange={(v) => {
            const { width, height } = mapStore.mapDimensions;
            const ratio = width / height;
            const computedValue = Mround(v * ratio * 10) / 10;
            setExportHeight(v);
            setExportWidth(computedValue);
          }}
          min={1}
          max={10000}
          step={0.1}
        />
        <div class="has-text-centered">
          <button
            onClick={async () => {
              const scaleFactor = exportHeight() / mapStore.mapDimensions.height;
              await exportMapToPng('export.png', scaleFactor);
            }}
            class="button is-success"
          >
            { LL().ExportSection.ExportPng() }
          </button>
        </div>
      </div>
      <div
        id="export-section__content__geo"
        role="tabpanel"
        tabindex="0"
        class="is-hidden"
        aria-labelledby="export-section__content__geo-tab"
      >
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
            disabled={isButtonDisabled(
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
