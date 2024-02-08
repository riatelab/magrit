// Import from solid-js
import { JSX } from 'solid-js';
import { produce } from 'solid-js/store';

// Imports from other packages
import toast from 'solid-toast';

// Assets
import layoutFeatureRectangle from '../../assets/layout-features/rect-01.png';
import layoutFeatureGraticule from '../../assets/layout-features/graticule-01.png';
import layoutFeatureSphere from '../../assets/layout-features/sphere-01.png';
import layoutFeatureScaleBar from '../../assets/layout-features/scale.png';
import layoutFeatureNorthArrow from '../../assets/layout-features/north-01.png';
import layoutFeatureArrow from '../../assets/layout-features/arrow-01.png';
import layoutFeatureText from '../../assets/layout-features/text-01.png';
import layoutFeatureDraw from '../../assets/layout-features/draw-01.png';
import layoutFeatureSymbol from '../../assets/layout-features/symbols-01.png';

// Stores
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { mapStore, setMapStore } from '../../store/MapStore';
import { setModalStore } from '../../store/ModalStore';

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
import {
  addTemporaryPoint,
  drawSuggestionLine,
  drawTemporaryLine,
  generateIdLayoutFeature,
  getSvgCoordinates,
  removeTemporaryLines,
  snapToNearestAngle,
} from '../../helpers/layoutFeatures';

// Other components
import ImageSymbolSelection from '../Modals/ImageSymbolSelection.tsx';

// Types / Interfaces
import type {
  BackgroundRect,
  FreeDrawing,
  Image,
  Line,
  NorthArrow,
  Rectangle,
  ScaleBar,
  Text,
} from '../../global';

// Enums
import {
  DistanceUnit,
  ImageType,
  LayoutFeatureType,
  ScaleBarBehavior,
  ScaleBarStyle,
} from '../../global.d';

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
          alt={LL().LayoutFeatures.Line()}
          title={LL().LayoutFeatures.Line()}
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
              let cursorPt: { x: number, y: number } = getSvgCoordinates(svgElement, ev);

              const isCtrlPressed = ev.ctrlKey;

              if (isCtrlPressed && pts.length > 0) {
                // We want to calculate the angle between the last point and the cursor
                // and snap the cursor to the nearest 15° angle
                cursorPt = snapToNearestAngle(pts[pts.length - 1], cursorPt, 15);
              }
              pts.push([cursorPt.x, cursorPt.y]);

              // Add a temporary point
              addTemporaryPoint(cursorPt.x, cursorPt.y);

              // Draw the temporary line for confirmed points
              if (pts.length > 1) {
                drawTemporaryLine(pts.slice(pts.length - 2, pts.length));
              }
            };

            const onMove = (ev: MouseEvent) => {
              // Draw line between last point and cursor
              let cursorPt: { x: number, y: number } = getSvgCoordinates(svgElement, ev);
              if (pts.length > 0) {
                const isCtrlPressed = ev.ctrlKey;
                if (isCtrlPressed) {
                  // We want to calculate the angle between the last point and the cursor
                  // and snap the cursor to the nearest 15° angle
                  cursorPt = snapToNearestAngle(pts[pts.length - 1], cursorPt, 15);
                }

                drawSuggestionLine(
                  [
                    pts[pts.length - 1],
                    [cursorPt.x, cursorPt.y],
                  ],
                );
              }
            };

            const onDblClick = () => {
              // Remove last point (the one that was added by the double click)
              pts.pop();
              // Maybe the user tried a single click, then a double click at the end of the line,
              // so we need to check the distance between the last two points to see if we should
              // pop one more point
              if (pts.length > 3) {
                const distance = Msqrt(
                  Mabs(pts[pts.length - 1][0] - pts[pts.length - 2][0]) ** 2
                  + Mabs(pts[pts.length - 1][1] - pts[pts.length - 2][1]) ** 2,
                );
                if (distance < 2) {
                  pts.pop();
                }
              }
              // Remove event listeners
              svgElement.removeEventListener('click', onClick);
              svgElement.removeEventListener('dblclick', onDblClick);
              svgElement.removeEventListener('mousemove', onMove);
              // Reset cursor
              svgElement.style.cursor = 'default';
              // Remove temporary points
              svgElement.querySelectorAll('.temporary-point').forEach((elem) => elem.remove());
              // Remove the temporary line
              removeTemporaryLines();
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
            svgElement.addEventListener('mousemove', onMove);
          }}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureRectangle}
          alt={LL().LayoutFeatures.Rectangle()}
          title={LL().LayoutFeatures.Rectangle()}
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
          classList={{
            'layout-features-section__icon-element': true,
            disabled: alreadyHasGraticule(layersDescriptionStore.layers),
          }}
          src={layoutFeatureGraticule}
          alt={LL().LayoutFeatures.Graticule()}
          title={LL().LayoutFeatures.Graticule()}
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
          alt={LL().LayoutFeatures.Sphere()}
          title={LL().LayoutFeatures.Sphere()}
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
          alt={LL().LayoutFeatures.NorthArrow()}
          title={LL().LayoutFeatures.NorthArrow()}
          onClick={() => {
            // TODO: we could propose to the user to click on the map to place the north arrow
            const northArrowDescription = {
              id: generateIdLayoutFeature(),
              type: LayoutFeatureType.NorthArrow,
              position: [100, 100],
              size: 40,
              autoRotate: true,
              rotation: 0,
              style: 'simple',
              fillColor: '#000000',
              strokeColor: '#000000',
              strokeOpacity: 1,
              backgroundRect: { visible: false } as BackgroundRect,
            } as NorthArrow;

            setLayersDescriptionStore(
              produce(
                (draft: LayersDescriptionStoreType) => {
                  draft.layoutFeatures.push(northArrowDescription);
                },
              ),
            );
          }}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureScaleBar}
          alt={LL().LayoutFeatures.ScaleBar()}
          title={LL().LayoutFeatures.ScaleBar()}
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
              backgroundRect: { visible: false } as BackgroundRect,
              behavior: 'absoluteSize' as ScaleBarBehavior,
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
          alt={LL().LayoutFeatures.Text()}
          title={LL().LayoutFeatures.Text()}
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
          class="layout-features-section__icon-element"
          src={layoutFeatureSymbol}
          alt={LL().LayoutFeatures.Image()}
          title={LL().LayoutFeatures.Image()}
          onClick={() => {
            // First we open a modal allowing the user to
            // choose an existing image or upload a new one
            // ...
            setModalStore({
              show: true,
              title: LL().ImageSymbolSelection.Title(),
              content: () => <ImageSymbolSelection LL={LL} />,
            });
            // Then we create the corresponding layout feature
            // const onConfirm = (image: string, type: ImageType) => {
            //   const imageDescription = {
            //     id: generateIdLayoutFeature(),
            //     position: [100, 100],
            //     type: LayoutFeatureType.Image,
            //     content: image,
            //     size: 60,
            //     rotation: 0,
            //     backgroundRect: { visible: false } as BackgroundRect,
            //     imageType: type,
            //   } as Image;
            //
            //   setLayersDescriptionStore(
            //     produce(
            //       (draft: LayersDescriptionStoreType) => {
            //         draft.layoutFeatures.push(imageDescription);
            //       },
            //     ),
            //   );
            // };
            // eslint-disable-next-line max-len
            // const content1 = 'data:image/png;base64,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';
            // const content2 = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 642.41 929.51" version="1.1"><g transform="translate(-51.471 -91.49)"><path d="m373.75 91.496c-0.95-1.132-74.87 153.23-164.19 343.02-160.8 341.68-162.27 345.16-156.49 350.27 3.203 2.83 6.954 4.79 8.319 4.34 1.365-0.46 71.171-73.88 155.14-163.1 83.97-89.22 153.66-162.83 154.87-163.56 1.2-0.72 71.42 72.34 156.04 162.29s155.21 163.82 156.95 164.19 5.57-1.19 8.5-3.44c5.04-3.86-3.75-23.46-156.04-348-88.77-189.18-162.15-344.88-163.1-346.01zm-2.72 42.694c1.4-1.53 2.45 63.91 2.45 148.36v151.07l-142.3 151.34c-124.61 132.46-143.8 152.86-145.1 153.51 0.143-0.35 1.009-1.57 1.361-2.26 0.81-1.59 64.409-137.07 141.3-301.05 76.89-163.99 140.93-299.45 142.29-300.97zm-99.77 642v244.81h32.11v-204.82l108.55 204.82h44.6v-244.81h-32.11v204.8l-108.56-204.8h-44.59z" /></g></svg>';
            // onConfirm(content2, ImageType.SVG);
          }}
        />
        <img
          class="layout-features-section__icon-element disabled"
          src={layoutFeatureDraw}
          alt={LL().LayoutFeatures.FreeDrawing()}
          title={LL().LayoutFeatures.FreeDrawing()}
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
