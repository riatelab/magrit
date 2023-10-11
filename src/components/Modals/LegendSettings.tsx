// Imports from solid-js
import {
  Accessor,
  createSignal, For,
  JSX,
  Show,
} from 'solid-js';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Helpers
import { webSafeFonts } from '../../helpers/font';

// Types / Interfaces / Enums
import type { TranslationFunctions } from '../../i18n/i18n-types';
import type { LayerDescription } from '../../global';

const updateProps = (layerId: string, props: string[], value: string | number) => {
  const allPropsExceptLast = props.slice(0, props.length - 1);
  const lastProp = props[props.length - 1];
  const args = [
    'layers',
    (l) => l.id === layerId,
    ...allPropsExceptLast,
    {
      [lastProp]: value,
    },
  ];
  setLayersDescriptionStore(...args);
};

function makeSettingsChoroplethLegend(
  layer: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);
  return <>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.LegendTitle() }</label>
      <div class="control">
        <input
          class="input"
          type="text"
          value={ layer.legend!.title.text }
          onChange={(ev) => updateProps(layer.id, ['legend', 'title', 'text'], ev.target.value)}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.LegendSubtitle() }</label>
      <div class="control">
        <input
          class="input"
          type="text"
          value={ layer.legend?.subtitle?.text || '' }
          onChange={(ev) => updateProps(layer.id, ['legend', 'subtitle', 'text'], ev.target.value)}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.LegendNote() }</label>
      <div class="control">
        <input
          class="input"
          type="text"
          value={ layer.legend?.note?.text || '' }
          onChange={(ev) => updateProps(layer.id, ['legend', 'note', 'text'], ev.target.value)}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.RoundDecimals() }</label>
      <div class="control">
        <input
          class="input"
          type="number"
          min={-3}
          max={30}
          step={1}
          value={ layer.legend?.roundDecimals }
          onChange={(ev) => {
            const value = ev.target.value.length > 0
              ? +ev.target.value
              : 0;
            updateProps(layer.id, ['legend', 'roundDecimals'], +ev.target.value);
          }}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.BoxWidth() }</label>
      <div class="control">
        <input
          class="input"
          type="number"
          value={ layer.legend?.boxWidth }
          min={0}
          max={100}
          step={1}
          onChange={(ev) => updateProps(layer.id, ['legend', 'boxWidth'], +ev.target.value)}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.BoxHeight() }</label>
      <div class="control">
        <input
          class="input"
          type="number"
          value={ layer.legend?.boxHeight }
          min={0}
          max={100}
          step={1}
          onChange={(ev) => updateProps(layer.id, ['legend', 'boxHeight'], +ev.target.value)}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.BoxSpacing() }</label>
      <div class="control">
        <input
          class="input"
          type="number"
          min={0}
          max={100}
          step={1}
          value={ layer.legend?.boxSpacing }
          onChange={(ev) => updateProps(layer.id, ['legend', 'boxSpacing'], +ev.target.value)}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.BoxCornerRadius() }</label>
      <div class="control">
        <input
          class="input"
          type="number"
          min={0}
          max={100}
          step={1}
          value={ layer.legend?.boxCornerRadius }
          onChange={(ev) => updateProps(layer.id, ['legend', 'boxCornerRadius'], +ev.target.value)}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.LegendChoroplethOrientation() }</label>
      <div class="control">
        <label class="radio" style={{ 'margin-right': '2em' }}>
          <input
            type="radio"
            name="legend-orientation"
            {...(layer.legend?.orientation === 'horizontal' ? { checked: true } : {}) }
            onChange={(ev) => {
              const value = ev.target.checked ? 'horizontal' : 'vertical';
              updateProps(layer.id, ['legend', 'orientation'], value);
              console.log(layer.legend?.orientation);
            }}
          />
          { LL().Legend.Modal.LegendChoroplethOrientationHorizontal() }
        </label>
        <label class="radio">
          <input
            type="radio"
            name="legend-orientation"
            {...(layer.legend?.orientation === 'vertical' ? { checked: true } : {}) }
            onChange={(ev) => {
              const value = ev.target.checked ? 'vertical' : 'horizontal';
              updateProps(layer.id, ['legend', 'orientation'], value);
              console.log(layer.legend?.orientation);
            }}
          />
          { LL().Legend.Modal.LegendChoroplethOrientationVertical() }
        </label>
      </div>
    </div>
    <hr />
    <div
      class="field"
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
    >
      <p class="label">
        { LL().Legend.Modal.MoreOptions() }
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <table style={{ 'text-align': 'center' }}>
        <thead>
         <tr>
           <th></th>
           <th>Title</th>
           <th>Subtitle</th>
           <th>Value labels</th>
           <th>Note</th>
         </tr>
        </thead>
        <tbody>
        <tr>
          <td>{ LL().CommonTextElement.FontSize() }</td>
          <For each={['title', 'subtitle', 'labels', 'note']}>
            {(textElement) => <td>
              <div class="control">
                <input
                  class="input"
                  type="number"
                  value={ layer.legend![textElement].fontSize.replace('px', '') }
                  min={0}
                  max={100}
                  step={1}
                  onChange={
                    (ev) => updateProps(
                      layer.id,
                      ['legend', textElement, 'fontSize'],
                      `${ev.target.value}px`,
                    )
                  }
                />
              </div>
            </td>}
          </For>
        </tr>
        <tr>
          <td>{ LL().CommonTextElement.FontColor() }</td>
          <For each={['title', 'subtitle', 'labels', 'note']}>
            {(textElement) => <td>
              <input
                class="color"
                type="color"
                value={ layer.legend![textElement].fontColor }
                onChange={(e) => updateProps(
                  layer.id,
                  ['legend', textElement, 'fontColor'],
                  e.target.value,
                )}
              />
            </td>}
          </For>
        </tr>
        <tr>
          <td>{ LL().CommonTextElement.FontStyle() }</td>
          <For each={['title', 'subtitle', 'labels', 'note']}>
            {(textElement) => <td>
              <select
                value={ layer.legend![textElement].fontStyle }
                onChange={(ev) => updateProps(
                  layer.id,
                  ['legend', textElement, 'fontStyle'],
                  ev.target.value,
                )}
              >
                <option value="normal">{ LL().CommonTextElement.Normal() }</option>
                <option value="italic">{ LL().CommonTextElement.Italic() }</option>
              </select>
            </td>}
          </For>
        </tr>
        <tr>
          <td>{ LL().CommonTextElement.FontWeight() }</td>
          <For each={['title', 'subtitle', 'labels', 'note']}>
            {(textElement) => <td>
              <select
                value={ layer.legend![textElement].fontWeight }
                onChange={(ev) => updateProps(
                  layer.id,
                  ['legend', textElement, 'fontWeight'],
                  ev.target.value,
                )}
              >
                <option value="normal">{ LL().CommonTextElement.Normal() }</option>
                <option value="bold">{ LL().CommonTextElement.Bold() }</option>
              </select>
            </td>}
          </For>
        </tr>
        <tr>
          <td>{ LL().CommonTextElement.FontFamily() }</td>
          <For each={['title', 'subtitle', 'labels', 'note']}>
            {(textElement) => <td>
              <select
                value={ layer.legend![textElement].fontFamily }
                onChange={(ev) => updateProps(
                  layer.id,
                  ['legend', textElement, 'fontFamily'],
                  ev.target.value,
                )}
              >
                <For each={webSafeFonts}>
                  {(font) => <option value={font}>{font}</option>}
                </For>
              </select>
            </td>}
          </For>
        </tr>
        </tbody>
      </table>
    </Show>
  </>;
}

export default function LegendSettings(
  props: {
    layerId: string,
    LL: unknown,
  },
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const { LL, layerId } = props; // eslint-disable-line solid/reactivity
  const layerDescription = layersDescriptionStore.layers
    .find((layer) => layer.id === layerId);
  return <div class="legend-settings">
    {/* <div class="legend-settings__title"> */}
    {/*   { LL().Legend.Modal.Title() } */}
    {/* </div> */}
    <br />
    <div class="legend-settings__content">
      { makeSettingsChoroplethLegend(layerDescription, LL) }
    </div>
  </div>;
}
