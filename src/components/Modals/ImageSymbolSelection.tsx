// Imports from solid-js
import {
  type Accessor,
  createSignal,
  For,
  type JSX,
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

  const backgroundValue = (content: string) => {
    if (imageType() === ImageType.SVG) {
      return `url(data:image/svg+xml;base64,${btoa(content)})`;
    }
    return `url(${content})`;
  };

  onMount(() => {
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

  return <div class="image-symbol-selection">
    <p><strong>{ LL().ImageSymbolSelection.SelectedImage() }</strong></p>
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
      {/* TODO: add list of symbols... */}
      <For each={images}>
        {
          (svgContent) => <div
            style={{
              width: '40px',
              height: '40px',
              display: 'inline-block',
              'background-size': '40px 40px',
              'background-image': `url(data:image/svg+xml;base64,${btoa(svgContent)})`,
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
        onClick={() => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', '.png,.svg');
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
                  setImageType(ImageType.PNG);
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
