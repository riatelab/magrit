// Import from solid-js
import { type Accessor, type JSX } from 'solid-js';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Helpers
import { TranslationFunctions } from '../../i18n/i18n-types';
import { unproxify } from '../../helpers/common';
import { generateIdLayoutFeature } from '../../helpers/layoutFeatures';
import { roundToNearest10 } from '../../helpers/math';

// Stores
import { globalStore } from '../../store/GlobalStore';

// Subcomponents
import LayoutFeatureSettings from '../Modals/LayoutFeatureSettings.tsx';

// Stores
import { type ContextMenuEntry, setContextMenuStore } from '../../store/ContextMenuStore';
import { mapStore, setMapStore } from '../../store/MapStore';
import { setModalStore } from '../../store/ModalStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Types
import type { BackgroundRect, LayoutFeature, Legend } from '../../global';

// TODO: Some of this code is duplicated in the LegendRenderer/common.tsx file.
//   Once we finished implementing the legends and the layout features,
//   we should try refactor this to avoid duplication.
export function bindDragBehavior(
  refElement: SVGElement,
  props: LayoutFeature,
): void {
  // Allow the user to move the refElement group by dragging it on the screen.
  // To do this we change the position property of the corresponding
  // layout feature (which is reactive and so will trigger a re-render at the new position).
  let x = 0;
  let y = 0;

  // Find the parent SVG element and listen to mousemove and mouseup events on it
  // instead of the refElement group, because the mouse can move faster than
  // the mousemove event is triggered, and we want to be able to move the
  // refElement group even if the mouse is not over it.
  let outerSvg: SVGSVGElement;
  let elem: Element = refElement.parentElement as Element;
  while (true) {
    if (elem.tagName.toLowerCase() === 'svg') {
      outerSvg = elem as SVGSVGElement;
      break;
    } else {
      elem = elem.parentElement as Element;
    }
  }

  // The initial state of the cursor
  let initialCursor: string | undefined;

  let [positionX, positionY] = props.position;
  let i = 0;

  const moveElement = async (e: MouseEvent | TouchEvent) => {
    if (((i++) % 2) === 0) { // eslint-disable-line no-plusplus
      // We skip some mousemove / touchmove events to improve performance
      return;
    }

    await yieldOrContinue('smooth');

    let dx: number;
    let dy: number;

    if (e instanceof MouseEvent) {
      dx = e.clientX - x;
      dy = e.clientY - y;
      x = e.clientX;
      y = e.clientY;
    } else {
      dx = e.touches[0].clientX - x;
      dy = e.touches[0].clientY - y;
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    // setLayersDescriptionStore(
    //   'layoutFeaturesAndLegends',
    //   (l: LayoutFeature) => l.id === props.id,
    //   {
    //     position: [
    //       props.position[0] + dx,
    //       props.position[1] + dy,
    //     ],
    //   },
    // );
    // Compute transform attribute of the refElement group
    // without updating the position in the layersDescriptionStore (for performance reasons)
    // (cf. the commented code just above).
    // We will update the position in the layersDescriptionStore
    // once the user has released the mouse button (in deselectElement).
    positionX += dx;
    positionY += dy;
    refElement.setAttribute('transform', `translate(${positionX}, ${positionY})`);
  };

  const deselectElement = async () => {
    refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
    outerSvg.style.cursor = 'default'; // eslint-disable-line no-param-reassign
    outerSvg.removeEventListener('mousemove', moveElement);
    outerSvg.removeEventListener('mouseup', deselectElement);
    outerSvg.removeEventListener('mouseleave', deselectElement);
    outerSvg.removeEventListener('touchmove', moveElement);
    outerSvg.removeEventListener('touchend', deselectElement);
    outerSvg.removeEventListener('touchcancel', deselectElement);

    // Do we want to snap coordinates on a grid ?
    // (if so we do so by rounding the coordinates to the nearest multiple of 10)
    const adjustPosition = globalStore.snapToGridWhenDragging
      ? roundToNearest10
      : (v: number) => v;

    await yieldOrContinue('smooth');

    // Update the position in the layersDescriptionStore
    // once the user has released the mouse button
    setLayersDescriptionStore(
      'layoutFeaturesAndLegends',
      (l: LayoutFeature | Legend) => l.id === props.id,
      {
        position: [
          adjustPosition(positionX),
          adjustPosition(positionY),
        ],
      },
    );
  };

  const startDrag = (e: MouseEvent | TouchEvent) => {
    // On desktop, dragging only occurs when the user
    // clicks with the main mouse button (usually the left one).
    // If the mousedown is triggered by another button, we return immediately.
    if (e instanceof MouseEvent && e.button > 1) return;
    e.stopPropagation();

    if (e instanceof MouseEvent) {
      x = e.clientX;
      y = e.clientY;
    } else {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }

    // Listen on events on the parent SVG element
    outerSvg.addEventListener('mousemove', moveElement);
    outerSvg.addEventListener('mouseup', deselectElement);
    outerSvg.addEventListener('mouseleave', deselectElement);
    outerSvg.addEventListener('touchmove', moveElement);
    outerSvg.addEventListener('touchend', deselectElement);
    outerSvg.addEventListener('touchcancel', deselectElement);

    // Cursor style
    // Store the previous cursor style of the parent SVG element
    initialCursor = outerSvg.style.cursor;
    // First change the cursor of the refElement group to default value
    // eslint-disable-next-line no-param-reassign
    refElement.style.cursor = initialCursor || 'default';
    // Then change the cursor of the parent SVG element to grabbing
    outerSvg.style.cursor = 'grabbing';
    // Maybe we should disable pointer events on the refElement group ?
    // For now we will keep them enabled (so that we can keep
    // the green color of the legend box when the mouse is over it when dragging)
    // In case we remove pointer events here, we should
    // put them back when the mouse is released (in deselectElement)
  };

  refElement.addEventListener('mousedown', startDrag);
  refElement.addEventListener('touchstart', startDrag);

  refElement.addEventListener('mouseover', () => {
    refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
  });

  refElement.addEventListener('mouseout', () => {
    refElement.style.cursor = 'default'; // eslint-disable-line no-param-reassign
  });
}

export function makeLayoutFeaturesSettingsModal(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): void {
  // State before opening the modal, in case cancel is clicked
  const layoutFeatureState = unproxify(
    layersDescriptionStore.layoutFeaturesAndLegends
      .find((l) => l.id === layoutFeatureId) as never,
  );
  setModalStore({
    show: true,
    content: () => <LayoutFeatureSettings layoutFeatureId={layoutFeatureId} LL={LL} />,
    title: LL().LayoutFeatures.Modal.Title(),
    // Nothing special to do when confirm is clicked
    confirmCallback: () => {},
    // Reset the layout feature to its previous state if cancel is clicked
    cancelCallback: () => {
      setLayersDescriptionStore(
        'layoutFeaturesAndLegends',
        (l: LayoutFeature | Legend) => l.id === layoutFeatureId,
        layoutFeatureState,
      );
    },
    escapeKey: 'cancel',
    // We can use a slightly smaller width for this modal
    width: '540px',
  });
}

export function triggerContextMenuLayoutFeature(
  event: MouseEvent,
  layoutFeatureId: string,
  allowClone: boolean,
  allowEdit: boolean,
  LL: Accessor<TranslationFunctions>,
): void {
  const contextMenuEntries: ContextMenuEntry[] = [
    {
      label: LL().LayoutFeatures.ContextMenu.EditSettings(),
      callback: () => {
        makeLayoutFeaturesSettingsModal(layoutFeatureId, LL);
      },
    },
  ];

  if (allowEdit) {
    // TODO: Show markers on the map to allow the user to resize the layout feature
    //       (as in a vector graphics editor)
    // contextMenuEntries.push({
    //   label: LL().LayoutFeatures.ContextMenu.Edit(),
    //   callback: () => {
    //   },
    // });
  }

  contextMenuEntries.push(
    {
      type: 'divider',
    },
    {
      label: LL().LayoutFeatures.ContextMenu.Up(),
      callback: () => {
        // We change the place of the layout feature in the layoutFeatures array
        // so that it changes 1 place down on the svg element
        // (and so that it is rendered after the previous layout feature)
        const layoutFeaturesAndLegends = layersDescriptionStore.layoutFeaturesAndLegends.slice();
        const index = layoutFeaturesAndLegends.findIndex((l) => l.id === layoutFeatureId);
        if (index < layoutFeaturesAndLegends.length - 1) {
          const tmp = layoutFeaturesAndLegends[index + 1];
          layoutFeaturesAndLegends[index + 1] = layoutFeaturesAndLegends[index];
          layoutFeaturesAndLegends[index] = tmp;
          setLayersDescriptionStore({ layoutFeaturesAndLegends });
        }
      },
    },
    {
      label: LL().LayoutFeatures.ContextMenu.Down(),
      callback: () => {
        // We change the place of the layout feature in the layoutFeatures array
        // so that it changes 1 place up on the svg element
        // (and so that it is rendered before the previous layout feature)
        const layoutFeaturesAndLegends = layersDescriptionStore.layoutFeaturesAndLegends.slice();
        const index = layoutFeaturesAndLegends.findIndex((l) => l.id === layoutFeatureId);
        if (index > 0) {
          const tmp = layoutFeaturesAndLegends[index - 1];
          layoutFeaturesAndLegends[index - 1] = layoutFeaturesAndLegends[index];
          layoutFeaturesAndLegends[index] = tmp;
          setLayersDescriptionStore({ layoutFeaturesAndLegends });
        }
      },
    },
  );

  if (allowClone) {
    contextMenuEntries.push({
      type: 'divider',
    });
    contextMenuEntries.push({
      label: LL().LayoutFeatures.ContextMenu.Clone(),
      callback: () => {
        const layoutFeature = layersDescriptionStore.layoutFeaturesAndLegends
          .find((l) => l.id === layoutFeatureId);
        if (layoutFeature) {
          // Compute new position, taking care of the map size,
          // so that the new layout feature is not outside the map
          const mapSize = mapStore.mapDimensions;
          const newPosition = [0, layoutFeature.position[1]];
          if (layoutFeature.position[0] + 200 > mapSize.width) {
            newPosition[0] = layoutFeature.position[0] - 100;
          } else {
            newPosition[0] = layoutFeature.position[0] + 100;
          }
          // if (layoutFeature.position[1] + 100 > mapSize.height) {
          //   newPosition[1] = layoutFeature.position[1] - 100;
          // } else {
          //   newPosition[1] = layoutFeature.position[1] + 100;
          // }
          setLayersDescriptionStore({
            layoutFeaturesAndLegends: [
              ...layersDescriptionStore.layoutFeaturesAndLegends,
              {
                ...layoutFeature,
                id: generateIdLayoutFeature(),
                position: newPosition,
              },
            ],
          });
        }
      },
    });
  }

  contextMenuEntries.push({
    label: LL().LayoutFeatures.ContextMenu.Delete(),
    callback: () => {
      const layoutFeaturesAndLegends = layersDescriptionStore.layoutFeaturesAndLegends
        .filter((l) => l.id !== layoutFeatureId);
      setLayersDescriptionStore({ layoutFeaturesAndLegends });
      if (layoutFeatureId === 'LayoutFeature-title') {
        setMapStore('mapAnnotations', 'title', '');
      } else if (layoutFeatureId === 'LayoutFeature-source') {
        setMapStore('mapAnnotations', 'source', '');
      }
    },
  });

  setContextMenuStore({
    show: true,
    position: [event.clientX, event.clientY],
    entries: contextMenuEntries,
  });
}

export const distanceBoxContent = 10;

export function RectangleBox(
  props: { backgroundRect: BackgroundRect, position?: [number, number], transform?: string },
): JSX.Element {
  return <rect
    class={'layout-feature-box'}
    width={0}
    height={0}
    x={props.position ? `${props.position[0] - distanceBoxContent}px` : 0}
    y={props.position ? `${props.position[1] - distanceBoxContent}px` : 0}
    fill={props.backgroundRect.visible ? props.backgroundRect.fill : 'transparent'}
    fill-opacity={props.backgroundRect.visible ? props.backgroundRect.fillOpacity : 0}
    stroke={props.backgroundRect.visible ? props.backgroundRect.stroke : undefined}
    stroke-opacity={props.backgroundRect.visible ? props.backgroundRect.strokeOpacity : undefined}
    stroke-width={props.backgroundRect.visible ? props.backgroundRect.strokeWidth : undefined}
    transform={props.transform}
  />;
}

// TODO: Some of this code is duplicated in the LegendRenderer/common.tsx file.
//   Once we finished implementing the legends and the layout features,
//   we should try refactor this to avoid duplication.
export function computeRectangleBox(refElement: SVGGElement, ...args: never[]) {
  // First we reset the box to its 0-size so it doesn't interfere with the
  // computation of the bbox of the refElement group
  const rectangleBoxLegend = refElement.querySelector('.layout-feature-box') as SVGRectElement;
  rectangleBoxLegend.setAttribute('width', '0px');
  rectangleBoxLegend.setAttribute('height', '0px');
  rectangleBoxLegend.setAttribute('x', '0px');
  rectangleBoxLegend.setAttribute('y', '0px');

  // We compute the bbox of the refElement group
  const bbox = refElement.getBBox();

  // We set the size of the box to the size of the bbox of the refElement group + a margin
  rectangleBoxLegend.setAttribute('width', `${bbox.width + distanceBoxContent * 2}px`);
  rectangleBoxLegend.setAttribute('height', `${bbox.height + distanceBoxContent * 2}px`);
  rectangleBoxLegend.setAttribute('x', `${bbox.x - distanceBoxContent}px`);
  rectangleBoxLegend.setAttribute('y', `${bbox.y - distanceBoxContent}px`);
}

function bindMouseEnterLeave(refElement: SVGGElement): void {
  // Color the .legend-box element when the mouse is over the refElement group
  // (maybe the .legend-box element already has a color,
  // that's why we use the style attribute instead of the fill attribute here,
  // so that when the style attribute is used it overrides the fill and fill-opacity attributes).
  refElement.addEventListener('mouseover', () => {
    const rectangleBoxLegend = refElement.querySelector('.layout-feature-box') as SVGRectElement;
    rectangleBoxLegend.setAttribute('style', 'fill: green; fill-opacity: 0.1');
  });
  // Remove the style attribute when the mouse leaves the refElement group.
  refElement.addEventListener('mouseleave', () => {
    const rectangleBoxLegend = refElement.querySelector('.layout-feature-box') as SVGRectElement;
    rectangleBoxLegend.removeAttribute('style');
  });
}

export const bindElementsLayoutFeature = (refElement: SVGGElement, lf: LayoutFeature) => {
  computeRectangleBox(refElement);
  bindMouseEnterLeave(refElement);
  bindDragBehavior(refElement, lf);
};
