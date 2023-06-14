import { JSX /* , createSignal */ } from 'solid-js';
import { exportMapToPng, exportMapToSvg } from '../helpers/exports';

/**
 * This component is responsible for exporting the current map to a file as well as for exporting
 * the data from the current map to a file.
 *
 * @constructor
 */
export default function ExportSection(): JSX.Element {
  return <div class="tabs is-centered is-boxed is-fullwidth">
    <ul>
      <li class="is-active"><a><span>SVG</span></a></li>
      <li class="is-active"><a><span>PNG</span></a></li>
      <li class="is-active"><a><span>Données</span></a></li>
    </ul>
  </div>;
}

console.log(exportMapToPng, exportMapToSvg);
