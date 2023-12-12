// Import from solid-js
import { JSX } from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import toast from 'solid-toast';
import { v4 as uuidv4 } from 'uuid';

// Assets
import layoutFeatureRectangle from '../../assets/layout-features/rect-01.png';
import layoutFeatureGraticule from '../../assets/layout-features/graticule-01.png';
import layoutFeatureSphere from '../../assets/layout-features/sphere-01.png';
import layoutFeatureScaleBar from '../../assets/layout-features/scale.png';
import layoutFeatureNorthArrow from '../../assets/layout-features/north-01.png';
import layoutFeatureArrow from '../../assets/layout-features/arrow-01.png';
import layoutFeatureText from '../../assets/layout-features/text-01.png';
import layoutFeatureDraw from '../../assets/layout-features/draw-01.png';
import layoutFeatureEllipse from '../../assets/layout-features/ellipse-01.png';

// Stores
import { mapStore, setMapStore } from '../../store/MapStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  alreadyHasGraticule,
  alreadyHasSphere,
  makeDefaultGraticule,
  makeDefaultSphere,
} from '../../helpers/layers';
import { Mabs, Msqrt } from '../../helpers/math';
import { getTargetSvg } from '../../helpers/svg';

// Types / Interfaces
import type {
  Ellipse,
  FreeDrawing,
  Line,
  Rectangle,
} from '../../global';
import { LayoutFeatureType } from '../../global.d';

const generateIdLayoutFeature = () => `LayoutFeature-${uuidv4()}`;

export default function LayoutFeatures(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="layout-features-section">
    <div class="field">
      <label class="label">{ LL().LayoutFeatures.BackgroundColor() }</label>
      <div class="control">
        <input
          class="color"
          type="color"
          value={mapStore.backgroundColor}
          onChange={
            (e) => {
              setMapStore({
                backgroundColor: e.target.value,
              });
            }
          }
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayoutFeatures.Opacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          value={mapStore.backgroundColorOpacity}
          onChange={
            (e) => {
              setMapStore({
                backgroundColorOpacity: +e.target.value,
              });
            }
          }
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>
    <div class="field-block">
      <label class="label">{ LL().LayoutFeatures.MapSkinElements() }</label>
      <div class="is-flex is-justify-content-space-evenly">
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureArrow}
          alt={ LL().LayoutFeatures.Line() }
          title={ LL().LayoutFeatures.Line() }
          onClick={() => {
            toast.success(LL().LayoutFeatures.DrawingInstructions.Line(), {
              duration: 5000,
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
              },
              iconTheme: {
                primary: '#38bdf8',
                secondary: '#1f2937',
              },
            });
            const svgElement = getTargetSvg();

            const pts: [number, number][] = [];
            const onClick = (ev: MouseEvent) => {
              // Get click coordinates
              const pt = svgElement.createSVGPoint();
              pt.x = ev.clientX;
              pt.y = ev.clientY;
              const cursorPt = pt.matrixTransform(svgElement.getScreenCTM()!.inverse());
              pts.push([cursorPt.x, cursorPt.y]);
            };
            const onDblClick = () => {
              // Remove last point
              pts.pop();
              // Remove event listeners
              svgElement.removeEventListener('click', onClick);
              svgElement.removeEventListener('dblclick', onDblClick);
              // Reset cursor
              svgElement.style.cursor = 'default';
              // Create the layout feature
              const lineDescription = {
                id: generateIdLayoutFeature(),
                type: LayoutFeatureType.Line,
                position: [0, 0],
                strokeColor: '#000000',
                strokeWidth: 4,
                strokeOpacity: 1,
                strokeDasharray: undefined,
                arrow: true,
                points: pts,
              } as Line;
              // Add the layout feature to the store (and so to the map)
              setLayersDescriptionStore(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeatures.push(lineDescription);
                  },
                ),
              );
            };
            svgElement.style.cursor = 'crosshair';
            svgElement.addEventListener('click', onClick);
            svgElement.addEventListener('dblclick', onDblClick);
          }}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureRectangle}
          alt={ LL().LayoutFeatures.Rectangle() }
          title={ LL().LayoutFeatures.Rectangle() }
          onClick={() => {
            toast.success(LL().LayoutFeatures.DrawingInstructions.Rectangle(), {
              duration: 5000,
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
              },
              iconTheme: {
                primary: '#38bdf8',
                secondary: '#1f2937',
              },
            });
            const svgElement = getTargetSvg();
            const pts = [] as [number, number][];
            const onClick = (ev: MouseEvent) => {
              const pt = svgElement.createSVGPoint();
              pt.x = ev.clientX;
              pt.y = ev.clientY;
              const cursorPt = pt.matrixTransform(svgElement.getScreenCTM()!.inverse());
              pts.push([cursorPt.x, cursorPt.y]);
              if (pts.length === 2) {
                svgElement.removeEventListener('click', onClick);
                svgElement.style.cursor = 'default';

                const rectangleDescription = {
                  id: generateIdLayoutFeature(),
                  type: LayoutFeatureType.Rectangle,
                  position: [Math.min(pts[0][0], pts[1][0]), Math.min(pts[0][1], pts[1][1])],
                  fillColor: '#000000',
                  fillOpacity: 0,
                  strokeColor: '#000000',
                  strokeWidth: 4,
                  strokeOpacity: 1,
                  rotation: 0,
                  cornerRadius: 0,
                  width: Math.abs(pts[0][0] - pts[1][0]),
                  height: Math.abs(pts[0][1] - pts[1][1]),
                } as Rectangle;

                setLayersDescriptionStore(
                  produce(
                    (draft: LayersDescriptionStoreType) => {
                      draft.layoutFeatures.push(rectangleDescription);
                    },
                  ),
                );
              }
            };
            svgElement.style.cursor = 'crosshair';
            svgElement.addEventListener('click', onClick);
          }}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureEllipse}
          alt={ LL().LayoutFeatures.Ellipse() }
          title={ LL().LayoutFeatures.Ellipse() }
          onClick={() => {
            toast.success(LL().LayoutFeatures.DrawingInstructions.Ellipse(), {
              duration: 5000,
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
              },
              iconTheme: {
                primary: '#38bdf8',
                secondary: '#1f2937',
              },
            });
            const svgElement = getTargetSvg();
            const pts = [] as [number, number][];
            const onClick = (ev: MouseEvent) => {
              const pt = svgElement.createSVGPoint();
              pt.x = ev.clientX;
              pt.y = ev.clientY;
              const cursorPt = pt.matrixTransform(svgElement.getScreenCTM()!.inverse());
              pts.push([cursorPt.x, cursorPt.y]);
              if (pts.length === 2) {
                svgElement.removeEventListener('click', onClick);
                svgElement.style.cursor = 'default';

                // Compute the distance between the two points
                const distance = Msqrt(
                  Mabs(pts[0][0] - pts[1][0]) ** 2 + Mabs(pts[0][1] - pts[1][1]) ** 2,
                );
                const ellipseDescription = {
                  id: generateIdLayoutFeature(),
                  type: LayoutFeatureType.Ellipse,
                  rx: distance,
                  ry: distance,
                  position: pts[0],
                  rotation: 0,
                  fillColor: '#000000',
                  fillOpacity: 0,
                  strokeColor: '#000000',
                  strokeWidth: 4,
                  strokeOpacity: 1,
                } as Ellipse;

                setLayersDescriptionStore(
                  produce(
                    (draft: LayersDescriptionStoreType) => {
                      draft.layoutFeatures.push(ellipseDescription);
                    },
                  ),
                );
              }
            };
            svgElement.style.cursor = 'crosshair';
            svgElement.addEventListener('click', onClick);
          }}
        />
        <img
          classList={{
            'layout-features-section__icon-element': true,
            disabled: alreadyHasGraticule(layersDescriptionStore.layers),
          }}
          src={layoutFeatureGraticule}
          alt={ LL().LayoutFeatures.Graticule() }
          title={ LL().LayoutFeatures.Graticule() }
          onClick={() => {
            if (!alreadyHasGraticule(layersDescriptionStore.layers)) {
              setLayersDescriptionStore(
                produce(
                  (draft) => {
                    draft.layers.push(makeDefaultGraticule());
                  },
                ),
              );
            }
          }}
        />
        <img
          classList={{
            'layout-features-section__icon-element': true,
            disabled: alreadyHasSphere(layersDescriptionStore.layers),
          }}
          src={layoutFeatureSphere}
          alt={ LL().LayoutFeatures.Sphere() }
          title={ LL().LayoutFeatures.Sphere() }
          onClick={() => {
            if (!alreadyHasSphere(layersDescriptionStore.layers)) {
              setLayersDescriptionStore(
                produce(
                  (draft) => {
                    // We always want the sphere to be under the other layers
                    draft.layers.unshift(makeDefaultSphere());
                  },
                ),
              );
            }
          }}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureNorthArrow}
          alt={ LL().LayoutFeatures.NorthArrow() }
          title={ LL().LayoutFeatures.NorthArrow() }
          onClick={() => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureScaleBar}
          alt={ LL().LayoutFeatures.ScaleBar() }
          title={ LL().LayoutFeatures.ScaleBar() }
          onClick={() => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureText}
          alt={ LL().LayoutFeatures.Text() }
          title={ LL().LayoutFeatures.Text() }
          onClick={() => {}}
        />
        <img
          class="layout-features-section__icon-element disabled"
          src={layoutFeatureDraw}
          alt={ LL().LayoutFeatures.FreeDrawing() }
          title={ LL().LayoutFeatures.FreeDrawing() }
          onClick={() => {
            toast.success(LL().LayoutFeatures.DrawingInstructions.FreeDrawing(), {
              duration: 5000,
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
              },
              iconTheme: {
                primary: '#38bdf8',
                secondary: '#1f2937',
              },
            });
            const svgElement = getTargetSvg();
            // Add a rect on top of the svg element to catch mouse events
            // const rectElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            // rectElement.setAttribute('width', '100%');
            // rectElement.setAttribute('height', '100%');
            // rectElement.setAttribute('fill', 'transparent');
            // svgElement.appendChild(rectElement);

            const pts: [number, number][] = [];
            let started = false;

            const onMouseMove = (ev) => {
              console.log('dragging');
              if (started) {
                // Get click coordinates
                const pt = svgElement.createSVGPoint();
                pt.x = ev.clientX;
                pt.y = ev.clientY;
                const cursorPt = pt.matrixTransform(svgElement.getScreenCTM()!.inverse());
                pts.push([cursorPt.x, cursorPt.y]);
              }
            };

            const onMouseUp = () => {
              svgElement.removeEventListener('click', onClick); // eslint-disable-line @typescript-eslint/no-use-before-define
              svgElement.removeEventListener('mousemove', onMouseMove);
              svgElement.removeEventListener('mouseup', onMouseUp);
              svgElement.remove();
              console.log('stopped');
              console.log(pts);
              started = false;
              svgElement.style.cursor = 'default';

              const freeDrawingDescription = {
                id: generateIdLayoutFeature(),
                type: LayoutFeatureType.Line,
                position: [0, 0],
                strokeColor: '#000000',
                strokeWidth: 4,
                strokeOpacity: 1,
                path: `M ${pts.map((p) => `${p[0]},${p[1]}`).join(' L ')}`,
              } as FreeDrawing;

              setLayersDescriptionStore(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeatures.push(freeDrawingDescription);
                  },
                ),
              );
            };

            const onClick = (ev: MouseEvent) => {
              console.log('click before draw');
              started = true;
              svgElement.addEventListener('dragstart', onMouseMove);
              svgElement.addEventListener('dragend', onMouseUp);
            };

            svgElement.style.cursor = 'crosshair';
            svgElement.addEventListener('click', onClick);
          }}
        />
      </div>
    </div>

  </div>;
}
