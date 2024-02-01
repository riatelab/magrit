// Imports from solid-js
import {
  createEffect,
  createSignal,
  type JSX,
  on,
  onMount,
} from 'solid-js';

// Imports from other packages
import { bbox } from '@turf/turf';
import topojson, { simplifyTopojson } from '../../helpers/topojson';
import d3 from '../../helpers/d3-custom';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { randomColorFromCategoricalPalette } from '../../helpers/color';
import { round } from '../../helpers/math';

// Stores
import { layersDescriptionStore } from '../../store/LayersDescriptionStore';
import { GeoJSONFeatureCollection } from '../../global';
import InputFieldNumber from '../Inputs/InputNumber.tsx';

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

  // Description of the layers to simplify
  const descriptions = layersDescriptionStore.layers
    .filter((layer) => props.ids.includes(layer.id));

  // We create a TopoJSON topology from the layers
  // (we need to do this because we want to preserve the topology between the polygons
  // and possibly simplify the same way common arcs between polygons of different layers)
  const layers = {};
  const layerNames = [];
  const bboxs = [];
  descriptions.forEach((description) => {
    // eslint-disable-next-line no-param-reassign
    layers[description.name] = description.data;
    layerNames.push(description.name);
    bboxs.push(bbox(description.data));
  });

  const mergedBbox = bboxs.reduce((acc, bb) => {
    /* eslint-disable no-param-reassign, prefer-destructuring */
    if (bb[0] < acc[0]) {
      acc[0] = bb[0];
    }
    if (bb[1] < acc[1]) {
      acc[1] = bb[1];
    }
    if (bb[2] > acc[2]) {
      acc[2] = bb[2];
    }
    if (bb[3] > acc[3]) {
      acc[3] = bb[3];
    }
    return acc;
  }, bboxs[0]);
  /* eslint-enable no-param-reassign, prefer-destructuring */
  console.log(mergedBbox);

  // Convert bbox to a GeoJSON polygon
  const bboxPolygon = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [mergedBbox[0], mergedBbox[1]],
        [mergedBbox[0], mergedBbox[3]],
        [mergedBbox[2], mergedBbox[3]],
        [mergedBbox[2], mergedBbox[1]],
        [mergedBbox[0], mergedBbox[1]],
      ]],
    },
  };

  let topo = topojson.topology(layers);
  let simplified = JSON.parse(JSON.stringify(topo));

  const [
    simplificationFactor,
    setSimplificationFactor,
  ] = createSignal(0);

  const [
    quantizationFactor,
    setQuantizationFactor,
  ] = createSignal(1e7);

  console.log(topo);
  onMount(() => {
    const canvas = refParentNode.querySelector('canvas')!;
    const context = canvas.getContext('2d')!;

    const { width, height } = canvas;

    // Projection
    const projection = d3.geoNaturalEarth2()
      .scale(1)
      .translate([0, 0])
      .fitExtent([[0, 0], [width, height]], bboxPolygon);

    // Path
    const path = d3.geoPath(projection)
      .context(context);

    let transform = d3.zoomIdentity;

    // Draw function
    function draw() {
      context.save();
      context.clearRect(0, 0, width, height);

      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);

      context.lineWidth = 1 / transform.k;

      layerNames.forEach((layerName) => {
        context.strokeStyle = randomColorFromCategoricalPalette('Vivid');
        const data = topojson.feature(
          simplified,
          simplified.objects[layerName],
        ) as GeoJSONFeatureCollection;
        for (let i = 0, n = data.features.length; i < n; i += 1) {
          const d = data.features[i].geometry;
          context.beginPath();
          path(d as never);
          context.stroke();
        }
      });
      context.restore();
    }

    function simplify() {
      const sf = simplificationFactor();
      if (sf === 0) {
        simplified = JSON.parse(JSON.stringify(topo));
      } else {
        const tolerance = (1 - simplificationFactor()) / 2;
        simplified = simplifyTopojson(topo, tolerance);
      }
      draw();
    }

    function convertToQuantizedTopojson() {
      const qf = quantizationFactor();
      topo = topojson.topology(layers, qf);
      simplify();
    }

    createEffect(
      on(simplificationFactor, simplify),
    );

    createEffect(
      on(quantizationFactor, convertToQuantizedTopojson),
    );

    d3.select(canvas)
      .call(d3.zoom()
        .on('zoom', (e: any) => {
          transform = e.transform;
          draw();
        }));
  });

  return <div ref={refParentNode!}>
    <div>
      <InputFieldNumber
        label={'Quantization factor'}
        value={quantizationFactor()}
        onChange={(v) => setQuantizationFactor(v)}
        min={1e1}
        max={1e7}
        step={1e1}
      />
      <div class="field">
        <label class="label">Simplification factor</label>
        <div class="control">
          <input
            type="range"
            min="0"
            max="1"
            value={simplificationFactor()}
            step="0.01"
            onChange={(e) => {
              setSimplificationFactor(e.currentTarget.valueAsNumber);
            }}
          />
          <output style={{ 'vertical-align': 'text-bottom' }}>
            {round((1 - simplificationFactor()) * 100, 2)}%
          </output>
        </div>
      </div>
      <canvas width="800" height="600"></canvas>
    </div>
  </div>;
}
