import { type JSX } from 'solid-js';
import { useI18nContext } from '../../i18n/i18n-solid';

/*
 * This is a modal that is used to simplify the path of layers.
 * The idea is to draw (in PlatCarre) the layer(s) that the user wants to simplify,
 * and let the user choose (using a slider) the simplification factor.
 * When the user clicks on "Apply", the simplification is done and the modal closes...
 *
 * We will draw the paths using a canvas.
 *
 * In order to preserve the topology between the polygons, we will use (common)
 * arcs between the polygons thanks to TopoJSON.
 *
 * Maybe we could propose several simplification algorithms
 * (Douglas-Peucker, Visvalingam-Whyatt, etc.).
 */
export default function SimplificationModal(
  props: {
    ids: string[], // The ids of the layers to simplify
  },
): JSX.Element {
  const { LL } = useI18nContext();
  let refParentNode: HTMLDivElement;

  return <div ref={refParentNode!}>
    <div>
      <canvas></canvas>
    </div>
  </div>;
}
