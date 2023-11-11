import {
  type Accessor,
  createMemo,
  For,
  type JSX,
} from 'solid-js';

// Stores
import { setContextMenuStore } from '../../store/ContextMenuStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';
import { setModalStore } from '../../store/ModalStore';

// Helpers
import { unproxify } from '../../helpers/common';

// Subcomponents
import LegendSettings from '../Modals/LegendSettings.tsx';

// Types / interfaces / enums
import type { LayerDescription, LegendTextElement } from '../../global';
import type { TranslationFunctions } from '../../i18n/i18n-types';

export function makeLegendText(
  props: LegendTextElement,
  position: [number, number],
  role: 'title' | 'subtitle' | 'note',
): JSX.Element {
  if (!props || !props.text) return <></>;
  const fontSize = createMemo(() => +(props.fontSize.replace('px', '')));
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
          y={position[1] + i() * fontSize() * 1.1}
        >
          { line }
        </tspan>}
      </For>
    </text>
  </g>;
}

export const distanceBoxContent = 10;

export function computeRectangleBox(refElement: SVGGElement, ...args: any[]) {
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

export function makeRectangleBox(width = 0, height = 0): JSX.Element {
  return <rect
    class={'legend-box'}
    style={{ fill: 'green', 'fill-opacity': '0' }}
    x={0}
    y={0}
    width={width}
    height={height}
  />;
}

export function bindMouseEnterLeave(refElement: SVGGElement): void {
  // Color the .legend-box element when the mouse is over the refElement group
  refElement.addEventListener('mouseover', () => {
    const rectangleBoxLegend = refElement.querySelector('.legend-box') as SVGRectElement;
    rectangleBoxLegend.setAttribute('style', 'fill: green; fill-opacity: 0.1');
  });
  refElement.addEventListener('mouseleave', () => {
    const rectangleBoxLegend = refElement.querySelector('.legend-box') as SVGRectElement;
    rectangleBoxLegend.setAttribute('style', 'fill-opacity: 0');
  });
}

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
  let elem: Element = refElement;
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
  const moveElement = (e: MouseEvent) => {
    if (((i++) % 3) === 0) { // eslint-disable-line no-plusplus
      // We skip some mousemove events to improve performance
      return;
    }
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
    // without updating the position in the layersDescriptionStore (for performance reasons)
    positionX += dx;
    positionY += dy;
    refElement.setAttribute('transform', `translate(${positionX}, ${positionY})`);

    x = e.clientX;
    y = e.clientY;
  };

  const deselectElement = () => {
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
    refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
    outerSvg.style.cursor = 'default'; // eslint-disable-line no-param-reassign
    outerSvg.removeEventListener('mousemove', moveElement);
    outerSvg.removeEventListener('mouseup', deselectElement);
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
    // First change the cursor of the refElement group to default value
    refElement.style.cursor = 'default'; // eslint-disable-line no-param-reassign
    // Then change the cursor of the parent SVG element to grabbing
    outerSvg.style.cursor = 'grabbing'; // eslint-disable-line no-param-reassign

    // Maybe we should disable pointer events on the refElement group ?
    // For now we will keep them enabled (so that we can keep
    // the green color of the legend box when the mouse is over it when dragging)
    // In case we remove pointer events here, we should
    // put them back when the mouse is released (in deselectElement)
  });
}

// Determine the size of an SVG text element before displaying it
export function getTextSize(
  text: string,
  fontSize: string,
  fontFamily: string,
): { width: number, height: number } {
  // Font size as a number
  const fontSizePx = +(fontSize.replace('px', ''));
  // Create an element to measure the text
  const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  elem.style.visibility = 'hidden';
  elem.setAttribute('font-size', fontSize);
  elem.setAttribute('font-family', fontFamily);
  // Add all the lines of the text
  elem.innerHTML = `${text.split('\\n').map((line, i) => `<tspan y="${fontSizePx * i * 1.1}">${line}</tspan>`).join('')}`;
  // Add the element to the DOM (but it is invisible)
  (document.querySelector('svg.map-zone__map') as SVGElement).appendChild(elem);
  // Compute the size of the text
  const bb = elem.getBBox();
  // Remove the element from the DOM
  elem.remove();
  return { width: bb.width, height: bb.height };
}

export function makeLegendSettingsModal(layerId: string, LL: Accessor<TranslationFunctions>): void {
  // Store the state of the legend before the user opens the modal
  // (in case he/she wants to cancel the changes)
  const legendProperties = unproxify(
    layersDescriptionStore.layers
      .find((l) => l.id === layerId)?.legend,
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
    width: 700,
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
            (l) => l.id === layerId,
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
