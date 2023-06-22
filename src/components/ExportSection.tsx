import { For, JSX } from 'solid-js';
import { FaSolidAngleDown } from 'solid-icons/fa';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import { exportMapToPng, exportMapToSvg, exportToGeo } from '../helpers/exports';
import { useI18nContext } from '../i18n/i18n-solid';
import { SupportedGeoFileTypes } from '../helpers/supportedFormats';

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

function setDropdownItemTarget(event: Event) {
  const target = event.currentTarget as HTMLElement;
  const dropdownItemTarget = target
    .parentElement
    .parentElement
    .parentElement
    .querySelector('.dropdown-item-target');
  dropdownItemTarget.textContent = target.textContent;
}

function exportToGeoWrapper() {
  const layerName = document.querySelector('.dropdown__layer .dropdown-item-target').textContent;
  const format = document.querySelector('.dropdown__format .dropdown-item-target').textContent;
  const layer = layersDescriptionStore.layers.find((l) => l.name === layerName);
  const result = exportToGeo(layer.data, layer.name, SupportedGeoFileTypes[format]);
  console.log(result);
}
/**
 * This component is responsible for exporting the current map to a file as well as for exporting
 * the data from the current map to a file.
 *
 * @constructor
 */
export default function ExportSection(): JSX.Element {
  const { LL } = useI18nContext();
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
        <button
          onClick={ async () => { await exportMapToSvg('export.svg', false); } }
          class="button is-success"
        >
          { LL().ExportSection.ExportSvg() }
        </button>
      </div>
      <div id="export-section__content__png" class="is-hidden">
        <button
          onClick={ async () => { await exportMapToPng('export.png', 1); } }
          class="button is-success"
        >
          { LL().ExportSection.ExportPng() }
        </button>
      </div>
      <div id="export-section__content__geo" class="is-hidden">
        <div class="dropdown is-hoverable dropdown__layer">
          <div class="dropdown-trigger">
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu-export-geo-file">
              <span class="dropdown-item-target">{ LL().ExportSection.SelectLayers() }</span>
              <span class="icon is-small">
                <FaSolidAngleDown />
              </span>
            </button>
          </div>
          <div class="dropdown-menu" id="dropdown-menu-export-geo-file" role="menu">
            <div class="dropdown-content">
              <For each={layersDescriptionStore.layers.map((layer) => layer.name)}>
                {(layerName) => (
                  <a href="#" class="dropdown-item" onClick={ setDropdownItemTarget }>
                    {layerName}
                  </a>
                )}
              </For>
            </div>
          </div>
        </div>
        <div class="dropdown is-hoverable dropdown__format">
          <div class="dropdown-trigger">
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu-export-geo-format">
              <span class="dropdown-item-target">{ LL().ExportSection.SelectFormat() }</span>
              <span class="icon is-small">
                <FaSolidAngleDown />
              </span>
            </button>
          </div>
          <div class="dropdown-menu" id="dropdown-menu-export-geo-format" role="menu">
            <div class="dropdown-content">
              <For each={Object.keys(SupportedGeoFileTypes)}>
                {(formatName) => (
                  <a href="#" class="dropdown-item" onClick={ setDropdownItemTarget }>
                    {formatName}
                  </a>
                )}
              </For>
            </div>
          </div>
        </div>
        <br/>
        <button
          class="button is-success text-align-center"
          onClick={ exportToGeoWrapper }
        >
          { LL().ExportSection.Export() }
        </button>
      </div>
    </div>
  </div>;
}
