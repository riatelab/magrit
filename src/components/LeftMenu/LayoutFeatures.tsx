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
  BackgroundRect,
  Ellipse,
  FreeDrawing,
  Line,
  Rectangle,
  ScaleBar,
  Text,
} from '../../global';
import { DistanceUnit, LayoutFeatureType, ScaleBarStyle } from '../../global.d';

const generateIdLayoutFeature = () => `LayoutFeature-${uuidv4()}`;

const makeTemporaryPoint = (x: number, y: number) => {
  const widthPoint = 5;
  const elem = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  elem.classList.add('temporary-point');
  elem.setAttribute('x', `${x - widthPoint / 2}`);
  elem.setAttribute('y', `${y - widthPoint / 2}`);
  elem.setAttribute('width', `${widthPoint}`);
  elem.setAttribute('height', `${widthPoint}`);
  elem.setAttribute('fill', 'red');
  return elem;
};

const addTemporaryPoint = (x: number, y: number) => {
  const svgElement = getTargetSvg();
  svgElement.appendChild(makeTemporaryPoint(x, y));
};

const getSvgCoordinates = (svgElement: SVGSVGElement, ev: MouseEvent) => {
  // Get click coordinates in screen space
  const pt = svgElement.createSVGPoint();
  pt.x = ev.clientX;
  pt.y = ev.clientY;

  // Transform the screen coordinates into the svg coordinates
  return pt.matrixTransform(svgElement.getScreenCTM()!.inverse());
};

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
              // Point coordinates in SVG space
              const cursorPt = getSvgCoordinates(svgElement, ev);
              pts.push([cursorPt.x, cursorPt.y]);

              // Add a temporary point
              addTemporaryPoint(cursorPt.x, cursorPt.y);
            };
            const onDblClick = () => {
              // Remove last point
              pts.pop();
              // Remove event listeners
              svgElement.removeEventListener('click', onClick);
              svgElement.removeEventListener('dblclick', onDblClick);
              // Reset cursor
              svgElement.style.cursor = 'default';
              // Remove temporary points
              svgElement.querySelectorAll('.temporary-point').forEach((elem) => elem.remove());
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
                backgroundRect: { visible: false } as BackgroundRect,
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
              // Point coordinates in SVG space
              const cursorPt = getSvgCoordinates(svgElement, ev);
              pts.push([cursorPt.x, cursorPt.y]);

              // Add a temporary point
              addTemporaryPoint(cursorPt.x, cursorPt.y);

              // When we have two points, we can create the rectangle
              if (pts.length === 2) {
                // Clean up everything
                svgElement.removeEventListener('click', onClick);
                svgElement.style.cursor = 'default';
                svgElement.querySelectorAll('.temporary-point').forEach((elem) => elem.remove());

                // Create the rectangle
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
              // Point coordinates in SVG space
              const cursorPt = getSvgCoordinates(svgElement, ev);
              pts.push([cursorPt.x, cursorPt.y]);

              // Add temporary point
              addTemporaryPoint(cursorPt.x, cursorPt.y);

              if (pts.length === 2) {
                // Clean up everything
                svgElement.removeEventListener('click', onClick);
                svgElement.style.cursor = 'default';
                svgElement.querySelectorAll('.temporary-point').forEach((elem) => elem.remove());

                // Compute the distance between the two points
                const distance = Msqrt(
                  Mabs(pts[0][0] - pts[1][0]) ** 2 + Mabs(pts[0][1] - pts[1][1]) ** 2,
                );

                // Create the ellipse
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
                  (draft: LayersDescriptionStoreType) => {
                    draft.layers.push(makeDefaultGraticule());
                  },
                ),
              );

              toast.success(LL().LayoutFeatures.ConfirmationMessages.Graticule(), {
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
                  (draft: LayersDescriptionStoreType) => {
                    // We always want the sphere to be under the other layers
                    draft.layers.unshift(makeDefaultSphere());
                  },
                ),
              );
              toast.success(LL().LayoutFeatures.ConfirmationMessages.Sphere(), {
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
          onClick={() => {
            const scaleBarDescription = {
              id: generateIdLayoutFeature(),
              type: LayoutFeatureType.ScaleBar,
              position: [100, 100],
              width: 500,
              height: 10,
              distance: 200,
              rotation: 0,
              unit: DistanceUnit.km,
              label: 'Kilometers',
              tickValues: [0, 50, 100, 250, 500],
              tickPadding: 10,
              style: ScaleBarStyle.blackAndWhiteBar,
            } as ScaleBar;

            setLayersDescriptionStore(
              produce(
                (draft: LayersDescriptionStoreType) => {
                  draft.layoutFeatures.push(scaleBarDescription);
                },
              ),
            );
          }}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureText}
          alt={ LL().LayoutFeatures.Text() }
          title={ LL().LayoutFeatures.Text() }
          onClick={() => {
            toast.success(LL().LayoutFeatures.DrawingInstructions.Text(), {
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
            const onClick = (ev: MouseEvent) => {
              // Point coordinates in SVG space
              const cursorPt = getSvgCoordinates(svgElement, ev);

              // Add a temporary point
              addTemporaryPoint(cursorPt.x, cursorPt.y);

              // Create the text
              const textDescription = {
                id: generateIdLayoutFeature(),
                type: LayoutFeatureType.Text,
                position: [cursorPt.x, cursorPt.y],
                text: LL().LayoutFeatures.DrawingInstructions.TextPlaceholder(),
                fontSize: 12,
                fontFamily: 'Sans-serif',
                fontColor: '#000000',
                fontOpacity: 1,
                fontStyle: 'normal',
                fontWeight: 'normal',
                textAnchor: 'start',
                rotation: 0,
                backgroundRect: { visible: false } as BackgroundRect,
              } as Text;

              setLayersDescriptionStore(
                produce(
                  (draft: LayersDescriptionStoreType) => {
                    draft.layoutFeatures.push(textDescription);
                  },
                ),
              );

              // Clean up everything
              svgElement.removeEventListener('click', onClick);
              svgElement.style.cursor = 'default';
              svgElement.querySelectorAll('.temporary-point')
                .forEach((elem) => elem.remove());
            };
            svgElement.style.cursor = 'crosshair';
            svgElement.addEventListener('click', onClick);
          }}
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
            const rectElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rectElement.setAttribute('width', '100%');
            rectElement.setAttribute('height', '100%');
            rectElement.setAttribute('fill', 'transparent');
            svgElement.appendChild(rectElement);

            // Store the current lockZoomPan value
            const lockZoomPanValue = mapStore.lockZoomPan;

            // Disable zoom and pan temporarily
            setMapStore({
              lockZoomPan: true,
            });

            // The points of the free drawing
            const pts: [number, number][] = [];

            let started = false;

            function startDrag(ev: MouseEvent) {
              started = true;
            }

            function drag(ev: MouseEvent) {
              ev.preventDefault();
              ev.stopPropagation();
              if (started) {
                // Point coordinates in SVG space
                const cursorPt = getSvgCoordinates(svgElement, ev);
                pts.push([cursorPt.x, cursorPt.y]);
              }
            }

            function endDrag(ev: MouseEvent) {
              if (started) {
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                rectElement.removeEventListener('mousedown', startDrag);
                rectElement.removeEventListener('mousemove', drag);
                rectElement.removeEventListener('mouseup', endDrag);
                rectElement.removeEventListener('mouseleave', endDrag);
                rectElement.remove();
                started = false;
                svgElement.style.cursor = 'default';

                const freeDrawingDescription = {
                  id: generateIdLayoutFeature(),
                  type: LayoutFeatureType.FreeDrawing,
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

                // Restore the lockZoomPan value
                setMapStore({
                  lockZoomPan: lockZoomPanValue,
                });
              }
            }

            rectElement.addEventListener('mousedown', startDrag);
            rectElement.addEventListener('mousemove', drag);
            rectElement.addEventListener('mouseup', endDrag);
            rectElement.addEventListener('mouseleave', endDrag);

            svgElement.style.cursor = 'crosshair';
          }}
        />
      </div>
    </div>

  </div>;
}
