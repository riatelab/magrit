// Imports from solid-js
import {
  type Accessor,
  createEffect,
  createSignal,
  For,
  type JSX,
  on,
  onMount,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Stores
import { setModalStore } from '../../store/ModalStore';
import { LayersDescriptionStoreType, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Helpers
import type { TranslationFunctions } from '../../i18n/i18n-types';
import { generateIdLayoutFeature } from '../../helpers/layoutFeatures';
import sanitizeSVG from '../../helpers/sanitize-svg';

// All the images of our symbol library
import images from '../../helpers/symbol-library';

// Types / Interfaces / Enums
import {
  type BackgroundRect,
  type Image,
  ImageType,
  LayoutFeatureType,
} from '../../global.d';

export default function ImageSymbolSelection(
  props: { LL: Accessor<TranslationFunctions> },
): JSX.Element {
  const { LL } = props;
  const [
    imageType,
    setImageType,
  ] = createSignal<ImageType>(ImageType.SVG);
  const [
    imageContent,
    setImageContent,
  ] = createSignal('');

  let imageSelectionModal: HTMLDivElement;
  let refSuccessButton: HTMLButtonElement;

  const backgroundValue = (content: string) => {
    if (imageType() === ImageType.SVG) {
      return `url(data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(content)))})`;
    }
    return `url(${content})`;
  };

  onMount(() => {
    // State of the confirm button
    refSuccessButton = imageSelectionModal.parentElement!.parentElement!.parentElement!
      .querySelector('.button.is-success')! as HTMLButtonElement;

    refSuccessButton.disabled = true;

    // Define what happens when the user confirms the selection
    setModalStore({
      confirmCallback: () => {
        const imageDescription = {
          id: generateIdLayoutFeature(),
          position: [100, 100],
          type: LayoutFeatureType.Image,
          content: imageContent(),
          size: 60,
          rotation: 0,
          backgroundRect: { visible: false } as BackgroundRect,
          imageType: imageType(),
        } as Image;

        setLayersDescriptionStore(
          produce(
            (draft: LayersDescriptionStoreType) => {
              draft.layoutFeaturesAndLegends.push(imageDescription);
            },
          ),
        );
      },
    });
  });

  createEffect(
    on(
      () => imageContent(),
      () => {
        if (imageContent()) {
          refSuccessButton.disabled = false;
        } else {
          refSuccessButton.disabled = true;
        }
      },
    ),
  );

  return <div class="image-symbol-selection" ref={imageSelectionModal!}>
    <p><strong>{ LL().ImageSymbolSelection.SelectImage() }</strong></p>
    <div
      class="image-symbol-selection__symbol-library"
      style={{
        width: '100%',
        height: '20vh',
        overflow: 'auto',
        border: 'solid 1px rgb(29, 88, 139)',
        background: 'whitesmoke',
      }}
    >
      <For each={images}>
        {
          (svgContent) => <div
            style={{
              width: '40px',
              height: '40px',
              display: 'inline-block',
              'background-size': '40px 40px',
              'background-image': `url(data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))})`,
            }}
            onClick={() => {
              setImageType(ImageType.SVG);
              setImageContent(sanitizeSVG(svgContent));
            }}
          ></div>
        }
      </For>
    </div>
    <br/>
    <p><strong>{ LL().ImageSymbolSelection.UploadImage() }</strong></p>
    <div>
      <button
        class="button"
        onClick={() => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', '.png,.svg,.jpeg,.jpg');
          input.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
              // If the file is an SVG, we want to store its content as a string.
              // If the file is a PNG, we want to store its content as a data URL.
              if (file.type === 'image/svg+xml') {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setImageType(ImageType.SVG);
                  setImageContent(sanitizeSVG(ev.target?.result as string));
                };
                reader.readAsText(file);
              } else {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setImageType(ImageType.RASTER);
                  setImageContent(ev.target?.result as string);
                };
                reader.readAsDataURL(file);
              }
            }
          });
          input.dispatchEvent(new MouseEvent('click'));
        }}
      >{ LL().ImageSymbolSelection.Browse() }</button>
    </div>
    <br/>
    <p><strong>{ LL().ImageSymbolSelection.SelectedImage() }</strong></p>
    <div
      class="image-symbol-selection__selected-image"
      style={{
        width: '60px',
        height: '60px',
        overflow: 'auto',
        border: 'solid 1px rgb(29, 88, 139)',
        'background-color': 'whitesmoke',
        'background-image': backgroundValue(imageContent()),
        'background-repeat': 'no-repeat',
        'background-size': 'cover',
        'background-position': 'bottom center, 50%, 50%',
      }}
    ></div>
  </div>;
}
