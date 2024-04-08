// Import from solid-js
import {
  Accessor, createSignal, JSX, Setter,
} from 'solid-js';
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
import { globalStore, setGlobalStore } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  LayersDescriptionStoreType,
  setLayersDescriptionStore,
} from '../../store/LayersDescriptionStore';
import { mapStore, setMapStore } from '../../store/MapStore';
import { setModalStore } from '../../store/ModalStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import type { TranslationFunctions } from '../../i18n/i18n-types';
import d3 from '../../helpers/d3-custom';
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
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';

// Types / Interfaces
import type {
  BackgroundRect,
  FreeDrawing,
  Line,
  NorthArrow,
  Rectangle,
  ScaleBar,
  Text,
} from '../../global';

// Enums
import {
  DistanceUnit,
  LayoutFeatureType,
  ScaleBarBehavior,
  ScaleBarStyle,
} from '../../global.d';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';

const makeDrawingInstructions = (
  LL: Accessor<TranslationFunctions>,
  object: 'Rectangle' | 'Line' | 'Text',
): string => `${LL().LayoutFeatures.DrawingInstructions[object]()}\n${LL().LayoutFeatures.DrawingInstructions.PressEscToCancel()}`;

const createRectangle = (LL: Accessor<TranslationFunctions>) => {
  toast.success(makeDrawingInstructions(LL, 'Rectangle'), {
    duration: Infinity,
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

      // Remove toast
      toast.dismiss();

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
            draft.layoutFeaturesAndLegends.push(rectangleDescription);
          },
        ),
      );
    }
  };
  const onEscape = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      // Remove toast
      toast.dismiss();
      // Remove event listeners
      svgElement.removeEventListener('click', onClick);
      document.body.removeEventListener('keydown', onEscape);
      // Reset cursor
      svgElement.style.cursor = 'default';
      // Remove temporary points
      svgElement.querySelectorAll('.temporary-point').forEach((elem) => elem.remove());
    }
  };
  svgElement.style.cursor = 'crosshair';
  svgElement.addEventListener('click', onClick);
  document.body.addEventListener('keydown', onEscape);
};

const createGraticule = (LL: Accessor<TranslationFunctions>) => {
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
};

const createSphere = (LL: Accessor<TranslationFunctions>) => {
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
};

const createLine = (LL: Accessor<TranslationFunctions>) => {
  toast.success(makeDrawingInstructions(LL, 'Line'), {
    duration: Infinity,
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
    // Remove toast
    toast.dismiss();
    // Remove event listeners
    svgElement.removeEventListener('click', onClick);
    svgElement.removeEventListener('dblclick', onDblClick);
    svgElement.removeEventListener('mousemove', onMove);
    // Reset cursor
    svgElement.style.cursor = 'default';
    // Remove temporary points
    svgElement.querySelectorAll('.temporary-point')
      .forEach((elem) => elem.remove());
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
          draft.layoutFeaturesAndLegends.push(lineDescription);
        },
      ),
    );
  };
  const onEscape = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      // Remove toast
      toast.dismiss();
      // Remove event listeners
      svgElement.removeEventListener('click', onClick);
      svgElement.removeEventListener('dblclick', onDblClick);
      svgElement.removeEventListener('mousemove', onMove);
      document.body.removeEventListener('keydown', onEscape);
      // Reset cursor
      svgElement.style.cursor = 'default';
      // Remove temporary points
      svgElement.querySelectorAll('.temporary-point')
        .forEach((elem) => elem.remove());
      // Remove the temporary line
      removeTemporaryLines();
    }
  };
  svgElement.style.cursor = 'crosshair';
  svgElement.addEventListener('click', onClick);
  svgElement.addEventListener('dblclick', onDblClick);
  svgElement.addEventListener('mousemove', onMove);
  document.body.addEventListener('keydown', onEscape);
};

const createNorthArrow = (/* LL: Accessor<TranslationFunctions>,  */) => {
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
        draft.layoutFeaturesAndLegends.push(northArrowDescription);
      },
    ),
  );
};

const createScaleBar = (/* LL: Accessor<TranslationFunctions>,  */) => {
  // TODO: we could propose to the user to click on the map to place the scalebar
  const scaleBarDescription = {
    id: generateIdLayoutFeature(),
    type: LayoutFeatureType.ScaleBar,
    position: [100, 100],
    width: 100,
    height: 10,
    distance: NaN,
    rotation: 0,
    unit: DistanceUnit.km,
    label: 'km',
    tickValues: [0, 50, 100, 250, 500],
    // tickPadding: 10,
    style: ScaleBarStyle.lineWithTicksOnTop,
    backgroundRect: { visible: false } as BackgroundRect,
    behavior: 'absoluteSize' as ScaleBarBehavior,
  } as ScaleBar;

  setLayersDescriptionStore(
    produce(
      (draft: LayersDescriptionStoreType) => {
        draft.layoutFeaturesAndLegends.push(scaleBarDescription);
      },
    ),
  );
};

const createText = (LL: Accessor<TranslationFunctions>) => {
  toast.success(makeDrawingInstructions(LL, 'Text'), {
    duration: Infinity,
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

    // Remove toast
    toast.dismiss();

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
      textDecoration: 'none',
      rotation: 0,
      backgroundRect: { visible: false } as BackgroundRect,
    } as Text;

    setLayersDescriptionStore(
      produce(
        (draft: LayersDescriptionStoreType) => {
          draft.layoutFeaturesAndLegends.push(textDescription);
        },
      ),
    );

    // Clean up everything
    svgElement.removeEventListener('click', onClick);
    svgElement.style.cursor = 'default';
    svgElement.querySelectorAll('.temporary-point')
      .forEach((elem) => elem.remove());
  };
  const onEscape = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      // Remove toast
      toast.dismiss();
      // Remove event listeners
      svgElement.removeEventListener('click', onClick);
      document.body.removeEventListener('keydown', onEscape);
      // Reset cursor
      svgElement.style.cursor = 'default';
      // Remove temporary points
      svgElement.querySelectorAll('.temporary-point')
        .forEach((elem) => elem.remove());
    }
  };
  svgElement.style.cursor = 'crosshair';
  svgElement.addEventListener('click', onClick);
  document.body.addEventListener('keydown', onEscape);
};

const createFreeDraw = (
  LL: Accessor<TranslationFunctions>,
  setIsFreeDrawing: Setter<boolean>,
) => {
  toast.success(LL().LayoutFeatures.DrawingInstructions.FreeDrawing(), {
    duration: Infinity,
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

  const cleanUp = () => {
    // Remove toast
    toast.dismiss();
    // Remove event listeners
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    document.body.removeEventListener('keydown', onEscape);
    // Reset cursor
    svgElement.style.cursor = 'default';
    // Remove the rect that was receiving mouse events
    rectElement.remove();
    // Remove temporary line
    removeTemporaryLines();
    // Reset "is drawing" state
    setIsFreeDrawing(false);
  };

  // Event listener for escape key
  const onEscape = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      cleanUp();
    }
  };

  // Store the current lockZoomPan value
  const lockZoomPanValue = mapStore.lockZoomPan;

  // Disable zoom and pan temporarily
  setMapStore({ lockZoomPan: true });

  // The points of the free drawing
  let pts: [number, number][] = [];

  // Set the cursor to crosshair to indicate that we are in drawing mode
  svgElement.style.cursor = 'crosshair';

  const dragStarted = (ev: d3.D3DragEvent) => {
    // Push the point to the array
    pts.push([ev.x, ev.y]);
    // Draw the temporary line
    removeTemporaryLines();
    drawTemporaryLine(pts);
  };

  // The line element that will be drawn
  // (we slightly smooth the path using d3.curveBasis)
  const line = d3.line().curve(d3.curveBasis);

  // @ts-expect-error because of complex typing requirements
  // for d3 drag behavior
  d3.select(rectElement).call(d3.drag()
    .container(() => svgElement)
    .subject((ev) => [[ev.x, ev.y]])
    .on('start drag', dragStarted)
    .on('end', () => {
      const freeDrawingDescription = {
        id: generateIdLayoutFeature(),
        type: LayoutFeatureType.FreeDrawing,
        position: [0, 0],
        strokeColor: '#000000',
        strokeWidth: 4,
        strokeOpacity: 1,
        path: line(pts),
      } as FreeDrawing;

      setLayersDescriptionStore(
        produce(
          (draft: LayersDescriptionStoreType) => {
            draft.layoutFeaturesAndLegends.push(freeDrawingDescription);
          },
        ),
      );

      // Restore the lockZoomPan value
      setMapStore({ lockZoomPan: lockZoomPanValue });

      pts = [];
      // cleanUp();
    }));

  document.body.addEventListener('keydown', onEscape);
};

export default function LayoutFeatures(): JSX.Element {
  const { LL } = useI18nContext();

  const [
    isFreeDrawing,
    setIsFreeDrawing,
  ] = createSignal<boolean>(false);

  return <div class="layout-features-section">
    <InputFieldColor
      label={LL().LayoutFeatures.BackgroundColor()}
      value={mapStore.backgroundColor}
      onChange={(v) => { setMapStore({ backgroundColor: v }); }}
      width={100}
    />
    <InputFieldNumber
      label={LL().LayoutFeatures.Opacity()}
      value={mapStore.backgroundColorOpacity}
      onChange={(v) => { setMapStore({ backgroundColorOpacity: v }); }}
      min={0}
      max={1}
      step={0.1}
      width={100}
    />
    <InputFieldCheckbox
      label={LL().LayoutFeatures.SnapToGrid()}
      checked={globalStore.snapToGridWhenDragging}
      onChange={(v) => { setGlobalStore({ snapToGridWhenDragging: v }); }}
    />
    <div class="field-block">
      <label class="label">{ LL().LayoutFeatures.MapSkinElements() }</label>
      <div class="is-flex is-justify-content-space-evenly">
        <button
          class="unstyled"
          title={LL().LayoutFeatures.Line()}
          aria-label={LL().LayoutFeatures.Line()}
        >
          <img
            class="layout-features-section__icon-element"
            src={layoutFeatureArrow}
            alt={LL().LayoutFeatures.Line()}
            onClick={() => { createLine(LL); }}
          />
        </button>
        <button
          class="unstyled"
          title={LL().LayoutFeatures.Rectangle()}
          aria-label={LL().LayoutFeatures.Rectangle()}
          onClick={() => { createRectangle(LL); }}
        >
          <img
            class="layout-features-section__icon-element"
            src={layoutFeatureRectangle}
            alt={LL().LayoutFeatures.Rectangle()}
          />
        </button>
        <button
          class="unstyled"
          title={LL().LayoutFeatures.Graticule()}
          aria-label={LL().LayoutFeatures.Graticule()}
          onClick={() => { createGraticule(LL); }}
        >
          <img
            classList={{
              'layout-features-section__icon-element': true,
              disabled: alreadyHasGraticule(layersDescriptionStore.layers),
            }}
            src={layoutFeatureGraticule}
            alt={LL().LayoutFeatures.Graticule()}
          />
        </button>
        <button
          class="unstyled"
          title={LL().LayoutFeatures.Sphere()}
          aria-label={LL().LayoutFeatures.Sphere()}
          onClick={() => { createSphere(LL); }}
        >
          <img
            classList={{
              'layout-features-section__icon-element': true,
              disabled: alreadyHasSphere(layersDescriptionStore.layers),
            }}
            src={layoutFeatureSphere}
            alt={LL().LayoutFeatures.Sphere()}
          />
        </button>
        <button
          class="unstyled"
          title={LL().LayoutFeatures.NorthArrow()}
          aria-label={LL().LayoutFeatures.NorthArrow()}
          onClick={() => { createNorthArrow(); }}
        >
          <img
            class="layout-features-section__icon-element"
            src={layoutFeatureNorthArrow}
            alt={LL().LayoutFeatures.NorthArrow()}
          />
        </button>
        <button
          class="unstyled"
          title={LL().LayoutFeatures.ScaleBar()}
          aria-label={LL().LayoutFeatures.ScaleBar()}
          onClick={() => { createScaleBar(); }}
        >
          <img
            class="layout-features-section__icon-element"
            src={layoutFeatureScaleBar}
            alt={LL().LayoutFeatures.ScaleBar()}
          />
        </button>
        <button
          class="unstyled"
          title={LL().LayoutFeatures.Text()}
          aria-label={LL().LayoutFeatures.Text()}
          onClick={() => { createText(LL); }}
        >
          <img
            class="layout-features-section__icon-element"
            src={layoutFeatureText}
            alt={LL().LayoutFeatures.Text()}
          />
        </button>
        <button
          class="unstyled"
          title={LL().LayoutFeatures.Image()}
          aria-label={LL().LayoutFeatures.Image()}
          onClick={() => {
            // We open a modal allowing the user to
            // choose an existing image or upload a new one
            setModalStore({
              show: true,
              title: LL().ImageSymbolSelection.Title(),
              content: () => <ImageSymbolSelection LL={LL}/>,
            });
          }}
        >
          <img
            class="layout-features-section__icon-element"
            src={layoutFeatureSymbol}
            alt={LL().LayoutFeatures.Image()}
          />
        </button>
        <button
          classList={{
            unstyled: true,
            'is-outlined': isFreeDrawing(),
            'is-warning': isFreeDrawing(),
          }}
          title={LL().LayoutFeatures.FreeDrawing()}
          aria-label={LL().LayoutFeatures.FreeDrawing()}
          onClick={() => {
            setIsFreeDrawing(!isFreeDrawing());
            if (isFreeDrawing()) {
              createFreeDraw(LL, setIsFreeDrawing);
            } else {
              // Dispatch keyboard event (escape) to remove the free drawing behavior
              document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            }
          }}
        >
          <img
            class="layout-features-section__icon-element"
            src={layoutFeatureDraw}
            alt={LL().LayoutFeatures.FreeDrawing()}
          />
        </button>
      </div>
    </div>
  </div>;
}
