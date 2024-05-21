// Imports from solid-js
import { JSX, onCleanup, onMount } from 'solid-js';

// Imports from other packages
import { LocalizedString } from 'typesafe-i18n';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

// Stores
import { modalStore, resetModalStore } from '../../store/ModalStore';
import { globalStore } from '../../store/GlobalStore';

// Styles
import '../../styles/ModalWindow.css';

export default function DefaultModal(): JSX.Element {
  const { LL } = useI18nContext();
  const successButton: LocalizedString = modalStore.successButton || LL().SuccessButton();
  const cancelButton: LocalizedString = modalStore.cancelButton || LL().CancelButton();

  let refParentNode: HTMLDivElement;

  const makeListenerEscKey = (behavior: 'confirm' | 'cancel' | null) => {
    if (behavior === null) return () => {};
    return (event: KeyboardEvent) => {
      const isEscape = event.key
        ? (event.key === 'Escape' || event.key === 'Esc')
        : (event.keyCode === 27);
      if (isEscape) {
        (refParentNode.querySelector(`.${behavior}-button`) as HTMLElement).click();
      }
    };
  };

  // Listener for when the escape key is pressed
  const listenerEscKey = makeListenerEscKey(modalStore.escapeKey);

  // Listener for when the browser window is resized
  const windowResizeListener = () => {
    const modal = refParentNode.querySelector('.modal-card') as HTMLElement;
    const modalRect = modal.getBoundingClientRect();

    // Reset the position of the modal to the center
    // when the window is resized
    modal.style.top = `${(globalStore.windowDimensions.height - modalRect.height) / 2}px`;
    modal.style.left = `${(globalStore.windowDimensions.width - modalRect.width) / 2}px`;
  };

  // Resize Observer for the modal (because it can grow in height depending on its content)
  const modalResizeObserver = new ResizeObserver((entries) => {
    entries.forEach((e) => {
      // If the modal overflow the window, we want to move it up a bit
      // so that it doesn't overflow the window anymore
      const modal = e.target as HTMLElement;
      const modalRect = modal.getBoundingClientRect();
      if (modalRect.bottom > globalStore.windowDimensions.height) {
        modal.style.top = `${modal.offsetTop - (modalRect.bottom + 15 - globalStore.windowDimensions.height)}px`;
      }
    });
  });

  onMount(() => {
    // Bind the escape key to the chosen behavior
    document.addEventListener('keydown', listenerEscKey);
    // Get the position of the modal (it is centered by default using CSS)
    const modal = refParentNode.querySelector('.modal-card') as HTMLElement;
    const modalRect = modal.getBoundingClientRect();
    // Set the position of the modal
    modal.style.position = 'fixed';
    modal.style.top = `${(globalStore.windowDimensions.height - modalRect.height) / 2}px`;
    modal.style.left = `${(globalStore.windowDimensions.width - modalRect.width) / 2}px`;
    // Make the modal draggable
    const header = modal.querySelector('.modal-card-head') as HTMLElement;
    header.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      header.style.cursor = 'move';
      const initialX = e.clientX;
      const initialY = e.clientY;
      const initialTop = modal.offsetTop;
      const initialLeft = modal.offsetLeft;
      const mouseMoveListener = (ee: MouseEvent) => {
        modal.style.top = `${initialTop + ee.clientY - initialY}px`;
        modal.style.left = `${initialLeft + ee.clientX - initialX}px`;
      };
      // Detach listeners when the mouse is released
      const mouseUpListener = () => {
        document.removeEventListener('mousemove', mouseMoveListener);
        document.removeEventListener('mouseup', mouseUpListener);
        header.style.cursor = 'grab';
      };
      // We bind the mousemove and mouseup listeners to the document
      // (and not to the modal) to avoid the modal to be stuck
      // if the user moves the mouse too fast.
      document.addEventListener('mousemove', mouseMoveListener);
      document.addEventListener('mouseup', mouseUpListener);
    });
    // Move the modal to the center when the window is resized
    // (to do this we need to listen to the resize event on the window)
    window.addEventListener('resize', windowResizeListener);

    // Also observe the modal for resize
    modalResizeObserver.observe(modal);
  });

  onCleanup(() => {
    // Unbind the escape key
    document.removeEventListener('keydown', listenerEscKey);
    // Unbind the resize listener
    window.removeEventListener('resize', windowResizeListener);
  });

  return <div
    class="modal-window modal"
    style={{ display: 'flex' }}
    ref={refParentNode!}
    aria-modal="true"
    role="dialog"
  >
    <div class="modal-background"></div>
    <div class="modal-card" style={ modalStore.width ? { width: modalStore.width } : {} }>
      <header
        class="modal-card-head"
        style={{ cursor: 'grab' }}
      >
        <p class="modal-card-title">{ modalStore.title }</p>
        {/* <button class="delete" aria-label="close"></button> */}
      </header>
      <section class="modal-card-body">
        { modalStore.content }
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success confirm-button"
          // ref={autofocus}
          autofocus
          onClick={ () => {
            (modalStore.confirmCallback || (() => {}))();
            resetModalStore();
          }}
        >{ successButton }</button>
        <button
          class="button cancel-button"
          onClick={ () => {
            (modalStore.cancelCallback || (() => {}))();
            resetModalStore();
          } }
        >{ cancelButton }</button>
      </footer>
    </div>
  </div>;
}
