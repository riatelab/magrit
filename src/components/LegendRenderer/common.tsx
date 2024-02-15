import {
  type Accessor,
  For,
  type JSX,
} from 'solid-js';

// Imports from other packages
import { yieldOrContinue } from 'main-thread-scheduling';

// Stores
import { setContextMenuStore } from '../../store/ContextMenuStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setModalStore } from '../../store/ModalStore';
import { mapStore } from '../../store/MapStore';

// Helpers
import { unproxify } from '../../helpers/common';
import getMaximalAvailableRectangle from '../../helpers/maximal-rectangle';
import { getTargetSvg } from '../../helpers/svg';

// Subcomponents
import LegendSettings from '../Modals/LegendSettings.tsx';

// Types / interfaces / enums
import type { BackgroundRect, LayerDescription, LegendTextElement } from '../../global';
import type { TranslationFunctions } from '../../i18n/i18n-types';

export function makeLegendText(
  props: LegendTextElement,
  position: [number, number],
  role: 'title' | 'subtitle' | 'note',
): JSX.Element {
  if (!props || !props.text) return <></>;
  return <g class={`legend-${role}`}>
    <text
      style={{ 'user-select': 'none' }}
      font-size={props.fontSize}
      font-weight={props.fontWeight}
      font-style={props.fontStyle}
      font-family={props.fontFamily}
      fill={props.fontColor}
      pointer-events={'none'}
      dominant-baseline="hanging"
    >
      <For each={props.text!.split('\\n')}>
        {(line, i) => <tspan
          x={position[0]}
          y={position[1] + i() * props.fontSize * 1.1}
        >
          { line }
        </tspan>}
      </For>
    </text>
  </g>;
}

export const distanceBoxContent = 10;

// TODO: Some of this code is duplicated in the LayoutFeatureRenderer/common.tsx file.
//   Once we finished implementing the legends and the layout features,
//   we should try refactor this to avoid duplication.
export function computeRectangleBox(refElement: SVGGElement, ...args: never[]) {
  // First we reset the box to its 0-size so it doesn't interfere with the
  // computation of the bbox of the refElement group
  const rectangleBoxLegend = refElement.querySelector('.legend-box') as SVGRectElement;
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

export function RectangleBox(props: { backgroundRect: BackgroundRect }): JSX.Element {
  return <rect
    class={'legend-box'}
    x={0}
    y={0}
    width={0}
    height={0}
    fill={props.backgroundRect.visible ? props.backgroundRect.fill : 'transparent'}
    fill-opacity={props.backgroundRect.visible ? props.backgroundRect.fillOpacity : 0}
    stroke={props.backgroundRect.visible ? props.backgroundRect.stroke : undefined}
    stroke-opacity={props.backgroundRect.visible ? props.backgroundRect.strokeOpacity : undefined}
    stroke-width={props.backgroundRect.visible ? props.backgroundRect.strokeWidth : undefined}
  />;
}
export function bindMouseEnterLeave(refElement: SVGGElement): void {
  // Color the .legend-box element when the mouse is over the refElement group
  // (maybe the .legend-box element already has a color,
  // that's why we use the style attribute instead of the fill attribute here,
  // so that when the style attribute is used it overrides the fill and fill-opacity attributes).
  refElement.addEventListener('mouseover', () => {
    const rectangleBoxLegend = refElement.querySelector('.legend-box') as SVGRectElement;
    rectangleBoxLegend.setAttribute('style', 'fill: green; fill-opacity: 0.1');
  });
  // Remove the style attribute when the mouse leaves the refElement group.
  refElement.addEventListener('mouseleave', () => {
    const rectangleBoxLegend = refElement.querySelector('.legend-box') as SVGRectElement;
    rectangleBoxLegend.removeAttribute('style');
  });
}

// TODO: Some of this code is duplicated in the LayoutFeatureRenderer/common.tsx file.
//   Once we finished implementing the legends and the layout features,
//   we should try refactor this to avoid duplication.
export function bindDragBehavior(refElement: SVGGElement, layer: LayerDescription): void {
  // Allow the user to move the refElement group
  // by dragging it on the screen.
  // To do this we change the transform attribute of the refElement group.
  // We also change the cursor to indicate that the group is draggable.
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

  // Get the initial position of the legend
  let [positionX, positionY] = layer.legend!.position;
  let i = 0;
  const moveElement = async (e: MouseEvent) => {
    if (((i++) % 2) === 0) { // eslint-disable-line no-plusplus
      // We skip some mousemove events to improve performance
      return;
    }

    await yieldOrContinue('smooth');

    const dx = e.clientX - x;
    const dy = e.clientY - y;

    // setLayersDescriptionStore(
    //   'layers',
    //   (l: LayerDescription) => l.id === layer.id,
    //   'legend',
    //   {
    //     position: [
    //       layer.legend!.position[0] + dx,
    //       layer.legend!.position[1] + dy,
    //     ],
    //   },
    // );
    // Compute transform attribute of the refElement group
    // without updating the position in the layersDescriptionStore (for performance reasons).
    // We will update the position in the layersDescriptionStore
    // once the user has released the mouse button (in deselectElement).
    positionX += dx;
    positionY += dy;
    refElement.setAttribute('transform', `translate(${positionX}, ${positionY})`);

    x = e.clientX;
    y = e.clientY;
  };

  const deselectElement = async () => {
    refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
    outerSvg.style.cursor = 'default'; // eslint-disable-line no-param-reassign
    outerSvg.removeEventListener('mousemove', moveElement);
    outerSvg.removeEventListener('mouseup', deselectElement);

    await yieldOrContinue('smooth');

    // Update the position in the layersDescriptionStore
    // once the user has released the mouse button
    setLayersDescriptionStore(
      'layers',
      (l: LayerDescription) => l.id === layer.id,
      'legend',
      {
        position: [
          positionX,
          positionY,
        ],
      },
    );
  };

  refElement.addEventListener('mousedown', (e) => {
    // Dragging only occurs when the user
    // clicks with the main mouse button (usually the left one).
    // If the mousedown is triggered by another button, we return immediately.
    if (e.button > 1) return;
    e.stopPropagation();

    // isDragging = true;
    x = e.clientX;
    y = e.clientY;

    // Listen on events on the parent SVG element
    outerSvg.addEventListener('mousemove', moveElement);
    outerSvg.addEventListener('mouseup', deselectElement);
    // Cursor style
    // First change the cursor of the refElement group to grabbing
    refElement.style.cursor = 'grabbing'; // eslint-disable-line no-param-reassign
    // Then change the cursor of the parent SVG element to grabbing
    outerSvg.style.cursor = 'grabbing'; // eslint-disable-line no-param-reassign

    // Maybe we should disable pointer events on the refElement group ?
    // For now we will keep them enabled (so that we can keep
    // the green color of the legend box when the mouse is over it when dragging)
    // In case we remove pointer events here, we should
    // put them back when the mouse is released (in deselectElement)
  });
}

const optionsBBox = {
  fill: true,
  stroke: true,
};

// Determine the size of an SVG text element before displaying it
export function getTextSize(
  text: string | undefined,
  fontSize: number,
  fontFamily: string,
  strokeWidth: number = 0,
): { width: number, height: number } {
  // Create an element to measure the text
  const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  elem.style.visibility = 'hidden';
  elem.style.paintOrder = 'stroke';
  elem.setAttribute('font-size', `${fontSize}px`);
  elem.setAttribute('font-family', fontFamily);
  elem.setAttribute('stroke-width', `${strokeWidth}px` || '0px');
  // Add all the lines of the text
  elem.innerHTML = `${text?.split('\\n').map((line, i) => `<tspan y="${fontSize * i * 1.1}">${line}</tspan>`).join('')}`;
  // Add the element to the DOM (but it is invisible)
  (document.querySelector('svg.map-zone__map') as SVGElement).appendChild(elem);
  // Compute the size of the text
  const bb = elem.getBBox(optionsBBox);
  // Remove the element from the DOM
  elem.remove();
  return { width: bb.width, height: bb.height };
}

export function makeLegendSettingsModal(layerId: string, LL: Accessor<TranslationFunctions>): void {
  // Store the state of the legend before the user opens the modal
  // (in case he/she wants to cancel the changes)
  const legendProperties = unproxify(
    layersDescriptionStore.layers
      .find((l) => l.id === layerId)?.legend as never,
  );
  // Open the modal
  setModalStore({
    show: true,
    content: () => <LegendSettings layerId={layerId} LL={LL} />,
    title: LL().Legend.Modal.Title(),
    confirmCallback: () => {}, // Do nothing on confirm
    cancelCallback: () => {
      // Reset the legend of the layer on cancel
      setLayersDescriptionStore(
        'layers',
        (l: LayerDescription) => l.id === layerId,
        { legend: legendProperties },
      );
    },
    escapeKey: 'cancel',
    width: '700px',
  });
}

export function triggerContextMenuLegend(
  event: MouseEvent,
  layerId: string,
  LL: Accessor<TranslationFunctions>,
): void {
  console.log('context menu legend');
  setContextMenuStore({
    show: true,
    position: [event.clientX, event.clientY],
    entries: [
      {
        label: LL().Legend.ContextMenu.Edit(),
        callback: () => {
          makeLegendSettingsModal(layerId, LL);
        },
      },
      {
        label: LL().Legend.ContextMenu.Hide(),
        callback: () => {
          setLayersDescriptionStore(
            'layers',
            (l: LayerDescription) => l.id === layerId,
            'legend',
            { visible: false },
          );
        },
      },
      {
        type: 'divider',
      },
      {
        label: LL().Legend.ContextMenu.Up(),
        callback: () => { console.log('Up'); },
      },
      {
        label: LL().Legend.ContextMenu.Down(),
        callback: () => { console.log('Down'); },
      },
    ],
  });
}

export const bindElementsLegend = (refElement: SVGGElement, layer: LayerDescription) => {
  computeRectangleBox(refElement);
  bindMouseEnterLeave(refElement);
  bindDragBehavior(refElement, layer);
};

export const getAllLegendNodes = (): NodeListOf<SVGGElement> => document.querySelectorAll('g.legend');

export const getPossibleLegendPosition = (
  sizeX: number,
  sizeY: number,
): [number, number] => {
  const legendNodes = getAllLegendNodes();
  if (legendNodes.length === 0) {
    // If this is the first legend, we put it at the top left corner
    return [10, 10];
  }
  const mapDimensions = { ...mapStore.mapDimensions };
  const mapBox = getTargetSvg().getBoundingClientRect();
  const mapPosition = { x0: mapBox.x, y0: mapBox.y };
  const legendDimensions = sizeX && sizeY
    ? { width: sizeX, height: sizeY }
    : { width: 40, height: 100 };
  const aRect = getMaximalAvailableRectangle(
    legendNodes,
    mapDimensions,
    mapPosition,
    legendDimensions,
  );

  // If the legend is too close to the top left border of the map,
  // (x=0 and y=0) or if no position is available (x=-1 and y=-1),
  // we move it down and/or right
  return [aRect.x > 0 ? aRect.x : 10, aRect.y > 0 ? aRect.y : 10];
};
