import { JSX /* , createSignal */ } from 'solid-js';
import { layersDescriptionStore } from '../store/LayersDescriptionStore';
import { exportMapToPng, exportMapToSvg } from '../helpers/exports';

function onClickButton(event: Event, tab: string) {
  // Change the active tab
  const tabButtons = document.getElementsByClassName('is-active');
  for (let i = 0; i < tabButtons.length; i++) { // eslint-disable-line no-plusplus
    tabButtons[i].classList.remove('is-active');
  }
  event.currentTarget.parentElement.classList.add('is-active');
  // Get all elements with class="tab-content" and hide them
  const tabContent = document.querySelectorAll('.tab-content > div');
  for (let i = 0; i < tabContent.length; i++) { // eslint-disable-line no-plusplus
    tabContent[i].classList.add('is-hidden');
  }
  // Remove the class 'is-hidden' on the tab that should be opened by the button
  document.getElementById(`tab-content-${tab}`).classList.remove('is-hidden');
}

/**
 * This component is responsible for exporting the current map to a file as well as for exporting
 * the data from the current map to a file.
 *
 * @constructor
 */
export default function ExportSection(): JSX.Element {
  // const { LL } = useI18nContext();
  const layerNames = layersDescriptionStore.layers.map((layer) => layer.name);
  console.log(layerNames);
  return <>
    <div class="tabs is-centered is-boxed is-fullwidth">
      <ul>
        <li class="is-active">
          <a onClick={(ev) => onClickButton(ev, 'svg')}>
            <span>SVG</span>
          </a>
        </li>
        <li>
          <a onClick={(ev) => onClickButton(ev, 'png')}>
            <span>PNG</span>
          </a>
        </li>
        <li>
          <a onClick={(ev) => onClickButton(ev, 'geo')}>
            <span>Données</span>
          </a>
        </li>
      </ul>
    </div>
    <div class="tab-content">
      <div id="tab-content-svg">
        <button
          onClick={ () => { exportMapToSvg('export.svg'); } }
          class="button is-success"
        >
          Exporter en SVG
        </button>
      </div>
      <div id="tab-content-png" class="is-hidden">
        <button
          onClick={ () => { exportMapToPng('export.png', 1); } }
          class="button is-success"
        >
          Exporter en PNG
        </button>
      </div>
      <div id="tab-content-geo" class="is-hidden">
        <div class="dropdown is-hoverable">
          <div class="dropdown-trigger">
            <button class="button" aria-haspopup="true" aria-controls="dropdown-menu-export-geo">
              <span>Click me</span>
              <span class="icon is-small">
                <i class="fas fa-angle-down" aria-hidden="true"></i>
              </span>
            </button>
          </div>
          <div class="dropdown-menu" id="dropdown-menu-export-geo" role="menu">
            <div class="dropdown-content">
              <a href="#" class="dropdown-item">
                Overview
              </a>
              <a href="#" class="dropdown-item">
                Modifiers
              </a>
            </div>
          </div>
        </div>
        <br/>
        <button
          class="button is-success"
        >
          Exporter en GeoJSON
        </button>
      </div>
    </div>
  </>;
}

console.log(exportMapToPng);
console.log(exportMapToSvg);
