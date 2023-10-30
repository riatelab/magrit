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
import { capitalizeFirstLetter, debounce, isNumber } from '../../helpers/common';
import type { TranslationFunctions } from '../../i18n/i18n-types';

// Types / Interfaces / Enums
import {
  type LayerDescription,
  LegendType,
} from '../../global.d';

/**
 * Update a single property of a layer in the layersDescriptionStore,
 * given its id and the path to the property.
 *
 * @param {string} layerId - The id of the layer to update.
 * @param {string[]} props - The path to the property to update.
 * @param {string | number} value - The new value of the property.
 * @return {void}
 */
const updateProps = (layerId: string, props: string[], value: string | number) => {
  const allPropsExceptLast = props.slice(0, props.length - 1);
  const lastProp = props[props.length - 1];
  const args = [
    'layers',
    (l: LayerDescription) => l.id === layerId,
    ...allPropsExceptLast,
    {
      [lastProp]: value,
    },
  ];
  setLayersDescriptionStore(...args);
};

const debouncedUpdateProps = debounce(updateProps, 250);

function TextOptionTable(props: { layer: LayerDescription, LL: Accessor<TranslationFunctions> }) {
  return <table style={{ 'text-align': 'center' }}>
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
      <td>{ props.LL().CommonTextElement.FontSize() }</td>
      <For each={['title', 'subtitle', 'labels', 'note']}>
        {(textElement) => <td>
          <div class="control">
            <input
              class="input"
              type="number"
              value={ props.layer.legend![textElement].fontSize.replace('px', '') }
              min={0}
              max={100}
              step={1}
              onChange={
                (ev) => debouncedUpdateProps(
                  props.layer.id,
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
      <td>{ props.LL().CommonTextElement.FontColor() }</td>
      <For each={['title', 'subtitle', 'labels', 'note']}>
        {(textElement) => <td>
          <input
            class="color"
            type="color"
            value={ props.layer.legend![textElement].fontColor }
            onChange={(e) => debouncedUpdateProps(
              props.layer.id,
              ['legend', textElement, 'fontColor'],
              e.target.value,
            )}
          />
        </td>}
      </For>
    </tr>
    <tr>
      <td>{ props.LL().CommonTextElement.FontStyle() }</td>
      <For each={['title', 'subtitle', 'labels', 'note']}>
        {(textElement) => <td>
          <select
            value={ props.layer.legend![textElement].fontStyle }
            onChange={(ev) => debouncedUpdateProps(
              props.layer.id,
              ['legend', textElement, 'fontStyle'],
              ev.target.value,
            )}
          >
            <option value="normal">{ props.LL().CommonTextElement.Normal() }</option>
            <option value="italic">{ props.LL().CommonTextElement.Italic() }</option>
          </select>
        </td>}
      </For>
    </tr>
    <tr>
      <td>{ props.LL().CommonTextElement.FontWeight() }</td>
      <For each={['title', 'subtitle', 'labels', 'note']}>
        {(textElement) => <td>
          <select
            value={ props.layer.legend![textElement].fontWeight }
            onChange={(ev) => debouncedUpdateProps(
              props.layer.id,
              ['legend', textElement, 'fontWeight'],
              ev.target.value,
            )}
          >
            <option value="normal">{ props.LL().CommonTextElement.Normal() }</option>
            <option value="bold">{ props.LL().CommonTextElement.Bold() }</option>
          </select>
        </td>}
      </For>
    </tr>
    <tr>
      <td>{ props.LL().CommonTextElement.FontFamily() }</td>
      <For each={['title', 'subtitle', 'labels', 'note']}>
        {(textElement) => <td>
          <select
            value={ props.layer.legend![textElement].fontFamily }
            onChange={(ev) => debouncedUpdateProps(
              props.layer.id,
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
  </table>;
}

function FieldText(
  props: { layer: LayerDescription, LL: Accessor<TranslationFunctions>, role: string },
): JSX.Element {
  return <div class="field">
    <label class="label">{ props.LL().Legend.Modal[`Legend${capitalizeFirstLetter(props.role)}`]() }</label>
    <div class="control">
      <input
        class="input"
        type="text"
        value={ props.layer.legend![props.role].text || '' }
        onChange={(ev) => debouncedUpdateProps(props.layer.id, ['legend', props.role, 'text'], ev.target.value)}
      />
    </div>
  </div>;
}

function FieldRoundDecimals(
  props: { layer: LayerDescription, LL: Accessor<TranslationFunctions> },
): JSX.Element {
  return <div class="field">
    <label class="label">{ props.LL().Legend.Modal.RoundDecimals() }</label>
    <div class="control">
      <input
        class="input"
        type="number"
        min={-3}
        max={30}
        step={1}
        value={ props.layer.legend?.roundDecimals as number }
        onChange={(ev) => {
          const value = ev.target.value.length > 0
            ? +ev.target.value
            : 0;
          debouncedUpdateProps(props.layer.id, ['legend', 'roundDecimals'], value);
        }}
      />
    </div>
  </div>;
}
function makeSettingsProportionalSymbolsLegend(
  layer: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  return <>
    <FieldText layer={layer} LL={LL} role={'title'} />
    <FieldText layer={layer} LL={LL} role={'subtitle'} />
    <FieldText layer={layer} LL={LL} role={'note'} />
    <FieldRoundDecimals layer={layer} LL={LL} />
    <div class="field">
      <label class="label">{ LL().Legend.Modal.LegendSymbolLayout() }</label>
      <div class="control">
        <label class="radio" style={{ 'margin-right': '2em' }}>
          <input
            type="radio"
            name="legend-layout"
            {...(layer.legend?.layout === 'stacked' ? { checked: true } : {}) }
            onChange={() => {
              debouncedUpdateProps(layer.id, ['legend', 'orientation'], 'stacked');
            }}
          />
          { LL().Legend.Modal.LegendSymbolLayoutStacked() }
        </label>
        <label class="radio" style={{ 'margin-right': '2em' }}>
          <input
            type="radio"
            name="legend-layout"
            {...(layer.legend?.layout === 'horizontal' ? { checked: true } : {}) }
            onChange={() => {
              debouncedUpdateProps(layer.id, ['legend', 'orientation'], 'horizontal');
            }}
          />
          { LL().Legend.Modal.LegendSymbolLayoutHorizontal() }
        </label>
        <label class="radio">
          <input
            type="radio"
            name="legend-layout"
            {...(layer.legend?.layout === 'vertical' ? { checked: true } : {}) }
            onChange={() => {
              debouncedUpdateProps(layer.id, ['legend', 'orientation'], 'vertical');
            }}
          />
          { LL().Legend.Modal.LegendSymbolLayoutVertical() }
        </label>
      </div>
    </div>
    <hr />
    <div onClick={() => setDisplayMoreOptions(!displayMoreOptions())}>
      <p class="label"> { LL().Legend.Modal.MoreOptions() } </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable layer={layer} LL={LL} />
    </Show>
  </>;
}

function makeSettingsChoroplethLegend(
  layer: LayerDescription,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  const hasNoData = layer.data.features.filter(
    (feature) => !isNumber(feature.properties[layer.rendererParameters!.variable]),
  ).length > 0;

  return <>
    <FieldText layer={layer} LL={LL} role={'title'} />
    <FieldText layer={layer} LL={LL} role={'subtitle'} />
    <FieldText layer={layer} LL={LL} role={'note'} />
    <FieldRoundDecimals layer={layer} LL={LL} />
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
          onChange={(ev) => debouncedUpdateProps(layer.id, ['legend', 'boxWidth'], +ev.target.value)}
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
          onChange={(ev) => debouncedUpdateProps(layer.id, ['legend', 'boxHeight'], +ev.target.value)}
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
          onChange={(ev) => debouncedUpdateProps(layer.id, ['legend', 'boxCornerRadius'], +ev.target.value)}
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
          onChange={(ev) => debouncedUpdateProps(layer.id, ['legend', 'boxSpacing'], +ev.target.value)}
        />
      </div>
    </div>
    <Show when={hasNoData}>
      <div class="field">
        <label class="label">{ LL().Legend.Modal.BoxSpacingNoData() }</label>
        <div class="control">
          <input
            class="input"
            type="number"
            min={0}
            max={100}
            step={1}
            value={ layer.legend?.boxSpacingNoData }
            onChange={(ev) => debouncedUpdateProps(layer.id, ['legend', 'boxSpacingNoData'], +ev.target.value)}
          />
        </div>
      </div>
      <div class="field">
        <label class="label">{ LL().Legend.Modal.NoDataLabel() }</label>
        <div class="control">
          <input
            class="input"
            type="text"
            value={ layer.legend?.noDataLabel }
            onChange={(ev) => debouncedUpdateProps(layer.id, ['legend', 'noDataLabel'], ev.target.value)}
          />
        </div>
      </div>
    </Show>
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
              debouncedUpdateProps(layer.id, ['legend', 'orientation'], value);
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
              debouncedUpdateProps(layer.id, ['legend', 'orientation'], value);
            }}
          />
          { LL().Legend.Modal.LegendChoroplethOrientationVertical() }
        </label>
      </div>
    </div>
    <hr />
    <div onClick={() => setDisplayMoreOptions(!displayMoreOptions())}>
      <p class="label">
        { LL().Legend.Modal.MoreOptions() }
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable layer={layer} LL={LL} />
    </Show>
  </>;
}

export default function LegendSettings(
  props: {
    layerId: string,
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const { LL, layerId } = props; // eslint-disable-line solid/reactivity
  const layerDescription = layersDescriptionStore.layers
    .find((layer) => layer.id === layerId) as LayerDescription;

  if (!layerDescription.legend) {
    // Due to the way the legend settings modal is triggered,
    // this should never happen...
    throw new Error('LegendSettings: layerDescription.legend is undefined');
  }

  return <div class="legend-settings">
    {/* <div class="legend-settings__title"> */}
    {/*   { LL().Legend.Modal.Title() } */}
    {/* </div> */}
    <br />
    <div class="legend-settings__content">
      {
        ({
          [LegendType.choropleth]: makeSettingsChoroplethLegend,
          [LegendType.proportional]: makeSettingsProportionalSymbolsLegend,
        })[layerDescription.legend!.type](layerDescription, LL)
      }
    </div>
  </div>;
}
