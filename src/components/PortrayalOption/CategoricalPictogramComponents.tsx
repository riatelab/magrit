// Imports from solid-js
import {
  createMemo, createSignal,
  For, type JSX, Match,
  mergeProps, Show, Switch,
} from 'solid-js';
import { Portal } from 'solid-js/web';

// Import from other libraries
import { FaSolidEye, FaSolidEyeSlash } from 'solid-icons/fa';
import { BsThreeDotsVertical } from 'solid-icons/bs';
import * as Plot from '@observablehq/plot';
import Sortable from 'solid-sortablejs';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import { randomColor } from '../../helpers/color';
import { isNonNull } from '../../helpers/common';
import images from '../../helpers/symbol-library';
import sanitizeSVG from '../../helpers/sanitize-svg';

// Types / Interfaces / Enums
import { type CategoricalPictogramMapping, ImageType } from '../../global.d';

const getBackgroundValue = (
  item: Pick<CategoricalPictogramMapping, 'iconType' | 'iconContent'>,
) => {
  if (item.iconType === ImageType.SVG) {
    return `url(data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(item.iconContent)))})`;
  }
  return `url(${item.iconContent})`;
};

export function CategoriesPlot(
  props: {
    mapping: CategoricalPictogramMapping[],
    height?: number,
    width?: number,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  const mergedProps = mergeProps(
    { height: 200, width: undefined },
    props,
  );
  const mapping = createMemo(() => mergedProps.mapping.filter((m) => isNonNull(m.value)));

  const domain = createMemo(() => mapping()
    .filter((m) => m.show)
    .map((m) => m.categoryName));
  const range = createMemo(() => Array.from({ length: domain().length }, randomColor));
  const data = createMemo(() => mapping()
    .filter((m) => m.show)
    .map((m, i) => ({
      position: i,
      category: m.categoryName,
      color: range()[i],
      frequency: m.count,
    })));

  return <div>
    {
      Plot.plot({
        width: mergedProps.width,
        height: mergedProps.height,
        color: {
          domain: domain(),
          range: range(),
          legend: true,
        },
        x: {
          type: 'band',
          tickFormat: null,
          ticks: 0,
          label: LL().FunctionalitiesSection.CategoricalChoroplethOptions.XAxisCategories(),
        },
        y: {
          label: LL().FunctionalitiesSection.CategoricalChoroplethOptions.YAxisCount(),
        },
        marks: [
          Plot.barY(
            data(),
            {
              x: 'category',
              y: 'frequency',
              fill: 'color',
              channels: {
                position: (d) => d.position,
              },
              sort: {
                x: 'position',
                order: 'ascending',
              },
            },
          ),
          Plot.ruleY([0]),
        ],
      })
    }
  </div>;
}

export function IconSelectionOverlay(
  props: {
    position: [number, number],
    icon: { type: ImageType, content: string },
    setIcon: (icon: { type: ImageType, content: string }) => void,
    close: () => void,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  const [
    imageType,
    setImageType,
  ] = createSignal<ImageType>(props.icon.type);
  const [
    imageContent,
    setImageContent,
  ] = createSignal(props.icon.content);

  return <div
    class="image-symbol-selection"
    style={{
      padding: '2em',
      position: 'absolute',
      width: '350px',
      left: `${props.position[0]}px`,
      top: `${props.position[1]}px`,
      background: 'var(--bulma-background)',
      'z-index': 'calc(Infinity)',
    }}
  >
    <p><strong>{LL().ImageSymbolSelection.SelectImage()}</strong></p>
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
    <p><strong>{LL().ImageSymbolSelection.UploadImage()}</strong></p>
    <div>
      <button
        class="button"
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
                  setImageType(ImageType.RASTER);
                  setImageContent(ev.target?.result as string);
                };
                reader.readAsDataURL(file);
              }
            }
          });
          input.dispatchEvent(new MouseEvent('click'));
        }}
      >{LL().ImageSymbolSelection.Browse()}</button>
    </div>
    <br/>
    <p><strong>{LL().ImageSymbolSelection.SelectedImage()}</strong></p>
    <div
      class="image-symbol-selection__selected-image"
      style={{
        width: '60px',
        height: '60px',
        overflow: 'auto',
        border: 'solid 1px rgb(29, 88, 139)',
        'background-color': 'whitesmoke',
        'background-image': getBackgroundValue({ iconType: imageType(), iconContent: imageContent() }),
        'background-repeat': 'no-repeat',
        'background-size': 'cover',
        'background-position': 'bottom center, 50%, 50%',
      }}
    ></div>
    <div class="has-text-centered">
      <button
        class="button"
        onClick={() => {
          props.setIcon({
            type: imageType(),
            content: imageContent(),
          });
          props.close();
        }}
      >{LL().ApplyButton()}</button>
    </div>
  </div>;
}

export function CategoriesCustomisation(
  props: {
    mapping: () => CategoricalPictogramMapping[],
    setMapping: (mapping: CategoricalPictogramMapping[]) => void,
    detailed?: boolean,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  const [
    overlayParams,
    setOverlayParams,
  ] = createSignal<{
    position: [number, number],
    icon: { type: ImageType, content: string },
    setIcon:(icon: { type: ImageType, content: string }) => void,
    close: () => void,
  } | null>(null);
  const [
    disabled,
    setDisabled,
  ] = createSignal<boolean>(false);

  // We need to filter out null entries from the mapping
  // before we can use it in the Sortable component
  const mapping = createMemo(() => props.mapping().filter((m) => isNonNull(m.value)));

  // We also need to write a wrapper for the setMapping function
  // to add null entries back to the mapping
  const setMapping = (m: CategoricalPictogramMapping[]) => {
    props.setMapping(
      mapping()
        .filter((mm) => !isNonNull(mm.value))
        .concat(
          m.filter((mmm) => isNonNull(mmm.value)),
        ),
    );
  };

  return <div>
    <Sortable
      items={mapping()}
      setItems={setMapping as any}
      idField={'value'}
      disabled={disabled()}
    >
      {
        (item) => <div
          style={{
            width: '100%',
            border: 'solid 0.5px currentColor',
            display: 'flex',
            'align-items': 'center',
            gap: '0.3em',
          }}
        >
          <BsThreeDotsVertical style={{ cursor: 'grab' }} />
          <Switch>
            <Match when={item.show}>
              <FaSolidEye
                style={{ cursor: 'pointer', padding: '0.5em' }}
                onClick={() => {
                  props.setMapping(
                    props.mapping()
                      .map((m) => (m.value === item.value ? { ...m, show: false } : m)),
                  );
                }}
              />
            </Match>
            <Match when={!item.show}>
              <FaSolidEyeSlash
                style={{ cursor: 'pointer', padding: '0.5em' }}
                onClick={() => {
                  props.setMapping(
                    props.mapping()
                      .map((m) => (m.value === item.value ? { ...m, show: true } : m)),
                  );
                }}
              />
            </Match>
          </Switch>
          <div
            style={{
              display: 'inline-block',
              height: '2.5em',
              width: '2.5em',
              'background-color': 'whitesmoke',
              'background-image': getBackgroundValue(item),
              'background-repeat': 'no-repeat',
              'background-size': 'cover',
              'background-position': 'bottom center, 50%, 50%',
            }}
            onClick={(e) => {
              setOverlayParams({
                position: [e.clientX, e.clientY],
                icon: { type: item.iconType, content: item.iconContent },
                setIcon: (icon) => {
                  props.setMapping(
                    props.mapping()
                      .map((m) => (
                        m.value === item.value
                          ? { ...m, iconType: icon.type, iconContent: icon.content }
                          : m
                      )),
                  );
                },
                close: () => setOverlayParams(null),
              });
            }}
          ></div>
          <input
            type="text"
            style={{ height: '3em', width: '40%' }}
            value={item.categoryName || ''}
            onChange={(e) => {
              props.setMapping(
                props.mapping()
                  .map((m) => (
                    m.value === item.value ? { ...m, categoryName: e.target.value } : m)),
              );
              setDisabled(false);
            }}
            onFocus={() => { setDisabled(true); }}
            onFocusOut={() => { setDisabled(false); }}
          />
          <div
            style={{
              'border-right': 'solid 1px currentColor',
              height: '3em',
              display: 'flex',
              'align-items': 'center',
              'padding-right': '0.5em',
            }}
          >
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={item.iconDimension[0]}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                props.setMapping(
                  props.mapping()
                    .map((m) => (
                      m.value === item.value
                        ? { ...m, iconDimension: [v, v] }
                        : m
                    )),
                );
                setDisabled(false);
              }}
              onFocus={() => { setDisabled(true); }}
              onFocusOut={() => { setDisabled(false); }}
              style={{ width: '4em' }}
            />
            px
          </div>
          <Show when={props.detailed}>
          <div style={{ width: 'calc(100% - (40% + 4em))' }}>
            &nbsp;({ LL().FunctionalitiesSection.CategoricalChoroplethOptions.Value() }
            &nbsp;{item.value} -
            &nbsp;{ LL().FunctionalitiesSection.CategoricalChoroplethOptions.Count() }
            &nbsp;{item.count})
          </div>
          </Show>
        </div>
      }
    </Sortable>
    <Show when={overlayParams()}>
      <Portal>
        <IconSelectionOverlay
          position={overlayParams()!.position}
          icon={overlayParams()!.icon}
          setIcon={overlayParams()!.setIcon}
          close={overlayParams()!.close}
        />
      </Portal>
    </Show>
  </div>;
}
