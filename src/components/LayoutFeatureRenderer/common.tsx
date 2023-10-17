// Import from solid-js
import { type Accessor } from 'solid-js';
import { render } from 'solid-js/web';

// Helpers
import { TranslationFunctions } from '../../i18n/i18n-types';

// Stores
import { setContextMenuStore } from '../../store/ContextMenuStore';
import { setModalStore } from '../../store/ModalStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Types
import { type LayoutFeature } from '../../global';

export function bindDragBehavior(refElement: SVGElement, props: LayoutFeature): void {
  // Allow the user to move the refElement group by dragging it on the screen.
  // To do this we change the position property of the corresponding
  // layout feature (which is reactive and so will trigger a re-render at the new position).
  let x = 0;
  let y = 0;
  // let isDragging = false;
  let outerSvg: SVGSVGElement;
  let elem: Element;

  let i = 0;
  const moveElement = (e: MouseEvent) => {
    if (i++ % 2 === 0) return; // eslint-disable-line no-plusplus
    const dx = e.clientX - x;
    const dy = e.clientY - y;

    setLayersDescriptionStore(
      'layoutFeatures',
      (l: LayoutFeature) => l.id === props.id,
      {
        position: [
          props.position[0] + dx,
          props.position[1] + dy,
        ],
      },
    );

    x = e.clientX;
    y = e.clientY;
  };

  const deselectElement = () => {
    refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
    outerSvg.style.cursor = 'default'; // eslint-disable-line no-param-reassign
    outerSvg.removeEventListener('mousemove', moveElement);
    outerSvg.removeEventListener('mouseup', deselectElement);
  };

  refElement.addEventListener('mouseover', () => {
    refElement.style.cursor = 'grab'; // eslint-disable-line no-param-reassign
  });

  refElement.addEventListener('mouseout', () => {
    refElement.style.cursor = 'default'; // eslint-disable-line no-param-reassign
  });

  refElement.addEventListener('mousedown', (e) => {
    // Dragging only occurs when the user
    // clicks with the main mouse button (usually the left one).
    // If the mousedown is triggered by another button, we return immediately.
    if (e.button > 1) return;
    e.stopPropagation();
    // isDragging = true;
    x = e.clientX;
    y = e.clientY;

    elem = refElement;
    // Find the parent SVG element and listen to mousemove and mouseup events on it
    // instead of the refElement group, because the mouse can move faster than
    // the mousemove event is triggered, and we want to be able to move the
    // refElement group even if the mouse is not over it.
    while (true) {
      if (elem.tagName.toLowerCase() === 'svg') {
        outerSvg = elem as unknown as SVGSVGElement;
        break;
      } else {
        elem = elem.parentElement as Element;
      }
    }
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

export function makeLayoutFeaturesSettingsModal(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): void {
  setModalStore({
    show: true,
    content: null,
    title: LL().Legend.Modal.Title(),
    confirmCallback: () => {},
    cancelCallback: () => {},
    escapeKey: 'cancel',
  });
  render(() => <></>, document.getElementById('.modal-card-body') as HTMLElement);
}

export function triggerContextMenuLayoutFeature(
  event: MouseEvent,
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): void {
  setContextMenuStore({
    show: true,
    position: [event.clientX, event.clientY],
    entries: [
      {
        label: LL().LayoutFeatures.ContextMenu.Edit(),
        callback: () => {

        },
      },
      {
        label: LL().LayoutFeatures.ContextMenu.Delete(),
        callback: () => {
          const layoutFeatures = layersDescriptionStore.layoutFeatures
            .filter((l) => l.id !== layoutFeatureId);
          setLayersDescriptionStore({ layoutFeatures });
        },
      },
      {
        type: 'divider',
      },
      {
        label: LL().LayoutFeatures.ContextMenu.Up(),
        callback: () => {
          // We change the place of the layout feature in the layoutFeatures array
          // so that it changes 1 place down on the svg element
          // (and so that it is rendered after the previous layout feature)
          const layoutFeatures = layersDescriptionStore.layoutFeatures.slice();
          const index = layoutFeatures.findIndex((l) => l.id === layoutFeatureId);
          if (index < layoutFeatures.length - 1) {
            const tmp = layoutFeatures[index + 1];
            layoutFeatures[index + 1] = layoutFeatures[index];
            layoutFeatures[index] = tmp;
            setLayersDescriptionStore({ layoutFeatures });
          }
        },
      },
      {
        label: LL().LayoutFeatures.ContextMenu.Down(),
        callback: () => {
          // We change the place of the layout feature in the layoutFeatures array
          // so that it changes 1 place up on the svg element
          // (and so that it is rendered before the previous layout feature)
          const layoutFeatures = layersDescriptionStore.layoutFeatures.slice();
          const index = layoutFeatures.findIndex((l) => l.id === layoutFeatureId);
          if (index > 0) {
            const tmp = layoutFeatures[index - 1];
            layoutFeatures[index - 1] = layoutFeatures[index];
            layoutFeatures[index] = tmp;
            setLayersDescriptionStore({ layoutFeatures });
          }
        },
      },
    ],
  });
}
