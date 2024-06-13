// Imports from solid-js
import {
  createEffect,
  createSignal,
  For,
  type JSX,
  on,
  onMount,
  Setter,
  Show,
} from 'solid-js';

// Imports from other packages
import { type AllGeoJSON, bbox } from '@turf/turf';
import topojson, { simplifyTopojson } from '../helpers/topojson';
import d3 from '../helpers/d3-custom';

// Helpers
import { useI18nContext } from '../i18n/i18n-solid';
import { cleanGeometryGeos, countCoordinates, findIntersections } from '../helpers/geo';
import { round } from '../helpers/math';

// Other components
import InputFieldCheckbox from './Inputs/InputCheckbox.tsx';
import InputFieldNumber from './Inputs/InputNumber.tsx';
import InputFieldRangeSlider from './Inputs/InputRangeSlider.tsx';

// Stores
import {
  layersDescriptionStore,
} from '../store/LayersDescriptionStore';

// Types / Interfaces / Enums
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../global';

// Style
import '../styles/SimplificationModal.css';
import '../styles/RangeSlider.css';

interface SimplificationInfo {
  id: number,
  name: string;
  color: string;
  polygons: number;
  edges: number;
  vertices: number;
  selfIntersections: GeoJSONFeature[] | null;
  features: GeoJSONFeature[],
}

/**
 * Compute the simplification info of a layer (given its name) in a TopoJSON topology.
 *
 * @param {any} topo
 * @param {string} layerName
 * @param {boolean} checkSelfIntersections
 */
const getSimplificationInfo = async (
  topo: any,
  layerName: string,
  checkSelfIntersections: boolean,
): Promise<Partial<SimplificationInfo>> => {
  const topoLayer = topo.objects[layerName];
  const geoLayer = topojson.feature(topo, topoLayer) as unknown as GeoJSONFeatureCollection;
  let nbGeometries = 0;
  let vertices = 0;
  // let vertices2 = 0;
  console.time(`clean, filter and count points ${layerName}`);
  for (let i = 0; i < geoLayer.features.length; i += 1) {
    const feature = geoLayer.features[i];
    // eslint-disable-next-line no-param-reassign, no-await-in-loop
    feature.geometry = await cleanGeometryGeos(feature.geometry);
    if (feature.geometry) {
      // We can count the number of points (cleanGeometry removes duplicate points and
      // ensured that polygons still have more than 3 points)
      const c = countCoordinates(feature.geometry);
      nbGeometries += 1;
      vertices += c;
    }
  }
  const features = geoLayer.features.filter((f) => f.geometry);
  console.timeEnd(`clean, filter and count points ${layerName}`);

  let selfIntersections = null;
  if (checkSelfIntersections) {
    console.time(`check self intersections ${layerName}`);
    selfIntersections = findIntersections(topo, layerName);
    console.timeEnd(`check self intersections ${layerName}`);
  }

  return {
    polygons: nbGeometries,
    edges: 0,
    vertices,
    selfIntersections,
    features,
  };
};
/*
 * This is the component that is used to simplify the path of layers.
 * The idea is to draw (in PlatCarre) the layer(s) that the user wants to simplify,
 * and let the user choose (using a slider) the simplification factor.

 * In order to preserve the topology between the polygons, we will use (common)
 * arcs between the polygons thanks to TopoJSON.
 *
 * Maybe we could propose several simplification algorithms
 * (Douglas-Peucker, Visvalingam-Whyatt, etc.).
 */
export default function Simplification(
  props: {
    ids: string[], // The ids of the layers to simplify
    setSimplifiedLayers: Setter<GeoJSONFeature[][]>,
    style?: { [k: string]: string },
  },
): JSX.Element {
  const { LL } = useI18nContext();
  let refParentNode: HTMLDivElement;

  // Description of the layers to simplify
  const descriptions = layersDescriptionStore.layers
    .filter((layer) => props.ids.includes(layer.id));

  // Colors to use to draw the paths of the layers
  const colors = [
    '#010101',
    '#960000',
    '#008f00',
    '#00008f',
    '#8f008f',
    '#8f8f00',
  ];

  // We create a TopoJSON topology from the layers
  // (we need to do this because we want to preserve the topology between the polygons
  // and possibly simplify the same way common arcs between polygons of different layers)
  const layers: { [k: string]: GeoJSONFeatureCollection } = {};
  const layerNames: string[] = [];
  const bboxs: [number, number, number, number][] = [];
  descriptions.forEach((description) => {
    // eslint-disable-next-line no-param-reassign
    layers[description.name] = description.data;
    layerNames.push(description.name);
    bboxs.push(bbox(description.data as AllGeoJSON) as [number, number, number, number]);
  });

  // Merge the bounding boxes of the layers...
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

  // ...and convert bbox to a GeoJSON polygon to fit the map extent on first draw
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

  // Object that stores the topology of the layers
  // (could be updated when the quantization factor changes)
  let topo = topojson.topology(layers);

  // Object that stores the simplified topology of the layers
  // (could be updated when the simplification factor changes)
  let simplified = JSON.parse(JSON.stringify(topo));

  // Object that stores the meshes of the layers
  // (that's what we will draw on the canvas, this is faster than drawing the polygons)
  const meshes: { [key: string]: any } = {};

  // We also count various stuff for each layer: the number of polygons,
  // the number of edges, etc.
  const [
    stats,
    setStats,
  ] = createSignal<SimplificationInfo[]>([]);

  // Signals for inputs
  const [
    simplificationFactor,
    setSimplificationFactor,
  ] = createSignal(0);
  const [
    quantizationFactor,
    setQuantizationFactor,
  ] = createSignal('1e+6');
  const [
    checkIntersections,
    setCheckIntersections,
  ] = createSignal(false);

  onMount(() => {
    // Draw on the canvas once the component is mounted
    const canvas = refParentNode.querySelector('canvas')!;
    const context = canvas.getContext('2d')!;
    const { width, height } = canvas.getBoundingClientRect();

    // Canvas size
    canvas.width = Math.floor(width * window.devicePixelRatio);
    canvas.height = Math.floor(height * window.devicePixelRatio);

    // Projection
    const projectionRaw = (lng: number, lat: number) => [
      lng, lat,
    ];

    const projection = d3.geoProjection(projectionRaw as d3.GeoRawProjection)
      .fitExtent([[5, 5], [width - 5, height - 5]], bboxPolygon);
    // Path
    const path = d3.geoPath(projection)
      .context(context)
      .digits(0);

    // Transform (we will update it when the user zooms in/out)
    let transform = d3.zoomIdentity;

    // Draw function
    function draw() {
      context.save();
      context.clearRect(0, 0, width, height);

      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);

      context.lineWidth = 0.5 / transform.k;

      // For each layer, draw the mesh
      layerNames.forEach((layerName, i) => {
        context.strokeStyle = colors[i % colors.length];
        context.beginPath();
        path(meshes[layerName] as never);
        context.stroke();
      });
      context.restore();
    }

    function drawPoints(points: GeoJSONFeature[] | null) {
      if (!points) return;
      context.save();
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);
      context.lineWidth = 0.5 / transform.k;
      context.fillStyle = 'red';
      points.forEach((point) => {
        context.beginPath();
        path.pointRadius(2 / transform.k);
        path(point as never);
        context.fill();
      });
      context.restore();
    }

    // Update transform variable and redraw
    // when the user zooms in/out
    d3.select(canvas)
      // @ts-expect-error because of complex typing requirements
      .call(d3.zoom()
        .on('zoom', (e: any) => {
          transform = e.transform;
          draw();
          stats().forEach((si) => { drawPoints(si.selfIntersections); });
        }));

    async function simplify() {
      // When the simplification factor changes, we update the simplified topology
      const sf = simplificationFactor();
      if (sf === 0) {
        // If no simplification, we just copy the topology
        simplified = JSON.parse(JSON.stringify(topo));
      } else {
        // Otherwise, we simplify the topology
        const tolerance = (1 - simplificationFactor()) / 2;
        simplified = simplifyTopojson(topo, tolerance);
      }

      // Also update the stats
      const s = await Promise.all(
        layerNames.map(async (layerName, i) => {
          const simplificationInfo = await getSimplificationInfo(
            simplified,
            layerName,
            checkIntersections(),
          );
          return {
            id: i,
            name: layerName,
            color: colors[i % colors.length],
            ...simplificationInfo,
          } as SimplificationInfo;
        }),
      );

      // We update the meshes
      layerNames.forEach((layerName) => {
        meshes[layerName] = topojson.mesh(
          simplified,
          simplified.objects[layerName],
        );
      });

      // And redraw on the canvas
      draw();

      // Also draw self intersections as a red dot on the canvas
      s.forEach((si) => {
        drawPoints(si.selfIntersections);
      });

      // Store the stats in the signal
      setStats(s);

      // Pass the layers to the parent component
      props.setSimplifiedLayers(s.map((si) => si.features));
    }

    function convertToQuantizedTopojson() {
      // When the quantization factor changes, we update the topology...
      const qf = +quantizationFactor();
      topo = topojson.topology(layers, qf);
      // ...and we simplify again based on the new topology
      simplify();
    }

    // We create effects to automatically simplify and redraw when the simplification
    // or quantization factors change.
    // We also update the stats if the user wants to check for self intersections.
    createEffect(
      on(simplificationFactor, simplify),
    );
    createEffect(
      on(quantizationFactor, convertToQuantizedTopojson),
    );
    createEffect(
      on(checkIntersections, simplify),
    );
  });

  return <div
    class="simplification-inner"
    ref={refParentNode!}
    style={props.style}
  >
    <div class="is-flex">
      <div class="simplification-inner__parameters-container">
        <div class="field">
          <label class="label">{LL().SimplificationModal.QuantizationFactor()}</label>
          <div class="control">
            <input
              class="input"
              type="number"
              onChange={(e) => {
                const value = +e.currentTarget.value;
                if (+e.currentTarget.value < +e.currentTarget.min) {
                  e.currentTarget.value = Number(e.currentTarget.min).toExponential();
                } else if (+e.currentTarget.value > +e.currentTarget.max) {
                  e.currentTarget.value = Number(e.currentTarget.max).toExponential();
                } else if (value < +quantizationFactor()) {
                  e.currentTarget.value = (+quantizationFactor() / 10).toExponential();
                } else if (value > +quantizationFactor()) {
                  e.currentTarget.value = (+quantizationFactor() * 10).toExponential();
                } else {
                  e.currentTarget.value = value.toExponential();
                }
                setQuantizationFactor(e.currentTarget.value);
              }}
              onBlur={(e) => {
                const value = Number(e.currentTarget.value);
                if (value < 1e2) {
                  e.currentTarget.value = '1e2';
                } else if (value > 1e6) {
                  e.currentTarget.value = '1e6';
                } else {
                  e.currentTarget.value = value.toExponential();
                }
                setQuantizationFactor(e.currentTarget.value);
              }}
              value={quantizationFactor()}
              min={1e2}
              max={1e6}
              step={1e2}
              style={{ width: '120px' }}
            />
          </div>
        </div>
        <InputFieldRangeSlider
          label={LL().SimplificationModal.SimplificationFactor()}
          value={simplificationFactor()}
          formater={(v) => `${round(v * 100, 2)}%`}
          onChange={(v) => setSimplificationFactor(v)}
          min={0}
          max={1}
          step={0.0005}
          width={100}
        />
        <InputFieldCheckbox
          label={LL().SimplificationModal.CheckSelfIntersection()}
          checked={checkIntersections()}
          onChange={(v) => {
            setCheckIntersections(v);
          }}
        />
      </div>
      <div class="simplification-inner__layer-list-container">
        <Show when={stats()}>
          <ul class="simplification-inner__layer-list">
            <For each={stats()}>
              {
                (si) => <li>
                  <input type="checkbox" checked/>
                  <strong>{si.name}</strong>
                  <div
                    class="simplification-inner__color-box"
                    style={{ background: si.color }}
                   />
                  <div>
                    {
                      LL().SimplificationModal.CountGeometries({
                        geom: si.polygons,
                        pts: si.vertices,
                      })
                    }
                    <Show when={descriptions[si.id].data.features.length - si.polygons > 0}>
                      ,&nbsp;
                      <span class="has-text-danger">
                      {
                        LL().SimplificationModal.NullGeometries({
                          null: descriptions[si.id].data.features.length - si.polygons,
                        })
                      }
                      </span>
                    </Show>
                    <Show when={si.selfIntersections}>
                      ,&nbsp;
                      <span class="has-text-warning">
                      {
                        LL().SimplificationModal.CountSelfIntersections({
                          count: si.selfIntersections!.length,
                        })
                      }
                      </span>
                    </Show>
                  </div>
                </li>
              }
            </For>
          </ul>
        </Show>
      </div>
    </div>
    <div class="simplification-inner__map-container">
      <canvas style={{ background: 'white' }} />
    </div>
  </div>;
}
