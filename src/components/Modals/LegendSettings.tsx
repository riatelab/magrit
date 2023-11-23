// Imports from solid-js
import {
  Accessor,
  createSignal, For,
  JSX,
  Show,
} from 'solid-js';

// Imports from other libs
import { FaSolidPlus } from 'solid-icons/fa';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Helpers
import { webSafeFonts } from '../../helpers/font';
import {
  ascending,
  capitalizeFirstLetter,
  debounce,
  isNumber,
  unproxify,
} from '../../helpers/common';
import type { TranslationFunctions } from '../../i18n/i18n-types';

// Types / Interfaces / Enums
import {
  type LayerDescription,
  type LayerDescriptionChoropleth, LayerDescriptionDiscontinuity, LayerDescriptionLabels,
  type LayerDescriptionProportionalSymbols,
  LegendType,
} from '../../global.d';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';

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

function TextOptionTable(
  props: { layer: LayerDescription, LL: Accessor<TranslationFunctions> },
): JSX.Element {
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
              value={ props.layer.legend![textElement].fontSize }
              min={0}
              max={100}
              step={1}
              onChange={
                (ev) => debouncedUpdateProps(
                  props.layer.id,
                  ['legend', textElement, 'fontSize'],
                  +ev.target.value,
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

function OptionBackgroundRectangle(
  props: {
    layer: LayerDescription,
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  return <>
    <InputFieldCheckbox
      label={ props.LL().Legend.Modal.DisplayBackgroundRectangle() }
      checked={props.layer.legend!.backgroundRect.visible}
      onChange={(v) => {
        if (v && !props.layer.legend!.backgroundRect.fill) {
          updateProps(props.layer.id, ['legend', 'backgroundRect', 'fill'], '#ffffff');
        }
        if (v && !props.layer.legend!.backgroundRect.fillOpacity) {
          updateProps(props.layer.id, ['legend', 'backgroundRect', 'fillOpacity'], 1);
        }
        if (v && !props.layer.legend!.backgroundRect.stroke) {
          updateProps(props.layer.id, ['legend', 'backgroundRect', 'stroke'], '#000000');
        }
        if (v && !props.layer.legend!.backgroundRect.strokeWidth) {
          updateProps(props.layer.id, ['legend', 'backgroundRect', 'strokeWidth'], 1);
        }
        if (v && !props.layer.legend!.backgroundRect.strokeOpacity) {
          updateProps(props.layer.id, ['legend', 'backgroundRect', 'strokeOpacity'], 1);
        }
        debouncedUpdateProps(props.layer.id, ['legend', 'backgroundRect', 'visible'], v);
      }}
    />
    <Show when={props.layer.legend!.backgroundRect.visible}>
      <InputFieldColor
        label={ props.LL().Legend.Modal.BackgroundRectangleColor() }
        value={ props.layer.legend!.backgroundRect.fill! }
        onChange={(v) => debouncedUpdateProps(props.layer.id, ['legend', 'backgroundRect', 'fill'], v)}
      />
      <InputFieldNumber
        label={ props.LL().Legend.Modal.BackgroundRectangleOpacity() }
        value={ props.layer.legend!.backgroundRect.fillOpacity! }
        onChange={(v) => debouncedUpdateProps(props.layer.id, ['legend', 'backgroundRect', 'fillOpacity'], v)}
        min={0}
        max={1}
        step={0.1}
      />
      <InputFieldColor
        label={ props.LL().Legend.Modal.BackgroundRectangleStrokeColor() }
        value={ props.layer.legend!.backgroundRect.stroke! }
        onChange={(v) => debouncedUpdateProps(props.layer.id, ['legend', 'backgroundRect', 'stroke'], v)}
      />
      <InputFieldNumber
        label={ props.LL().Legend.Modal.BackgroundRectangleStrokeOpacity() }
        value={ props.layer.legend!.backgroundRect.strokeOpacity! }
        onChange={(v) => debouncedUpdateProps(props.layer.id, ['legend', 'backgroundRect', 'strokeOpacity'], v)}
        min={0}
        max={1}
        step={0.1}
      />
      <InputFieldNumber
        label={ props.LL().Legend.Modal.BackgroundRectangleStrokeWidth() }
        value={ props.layer.legend!.backgroundRect.strokeWidth! }
        onChange={(v) => debouncedUpdateProps(props.layer.id, ['legend', 'backgroundRect', 'strokeWidth'], v)}
        min={0}
        max={10}
        step={1}
      />
    </Show>
  </>;
}

function FieldChangeValues(
  props: { layer: LayerDescriptionProportionalSymbols, LL: Accessor<TranslationFunctions> },
): JSX.Element {
  const styleInputElement = { width: '8.5em !important', 'font-size': '0.9rem' };
  return <div class="field">
    <label class="label">{ props.LL().Legend.Modal.ChooseValues() }</label>
    <div class="control">
      <FaSolidPlus
        style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }}
        onClick={() => {
          const values = unproxify(props.layer.legend.values.slice()) as number[];
          values.unshift(1);
          debouncedUpdateProps(props.layer.id, ['legend', 'values'], values);
        }}
      />
      <For each={props.layer.legend.values}>
        {
          (value, i) => <input
            style={styleInputElement}
            type="number"
            min={0}
            step={1}
            value={value}
            onChange={(ev) => {
              const newValue = +ev.target.value;
              const values = unproxify(props.layer.legend.values.slice()) as number[];
              values[i()] = newValue;
              values.sort(ascending);
              debouncedUpdateProps(props.layer.id, ['legend', 'values'], values.filter((v) => v !== 0));
            }}
          />
        }
      </For>
    </div>
  </div>;
}

function makeSettingsProportionalSymbolsLegend(
  layer: LayerDescriptionProportionalSymbols,
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
    <FieldChangeValues layer={layer} LL={LL} />
    <div class="field">
      <label class="label">{ LL().Legend.Modal.LegendSymbolLayout() }</label>
      <div class="control">
        <label class="radio" style={{ 'margin-right': '2em' }}>
          <input
            type="radio"
            name="legend-layout"
            {...(layer.legend?.layout === 'stacked' ? { checked: true } : {}) }
            onChange={() => {
              debouncedUpdateProps(layer.id, ['legend', 'layout'], 'stacked');
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
              debouncedUpdateProps(layer.id, ['legend', 'layout'], 'horizontal');
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
              debouncedUpdateProps(layer.id, ['legend', 'layout'], 'vertical');
            }}
          />
          { LL().Legend.Modal.LegendSymbolLayoutVertical() }
        </label>
      </div>
    </div>
    <Show when={['horizontal', 'vertical'].includes(layer.legend?.layout)}>
      <div class="field">
        <label class="label">{ LL().Legend.Modal.SymbolsSpacing() }</label>
        <div class="control">
          <input
            class="input"
            type="number"
            min={0}
            max={100}
            step={1}
            value={ layer.legend?.spacing }
            onChange={(ev) => debouncedUpdateProps(layer.id, ['legend', 'spacing'], +ev.target.value)}
          />
        </div>
      </div>
    </Show>
    <hr />
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        { LL().Legend.Modal.MoreOptions() }
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }} />
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable layer={layer} LL={LL} />
      <hr />
      <OptionBackgroundRectangle layer={layer} LL={LL} />
    </Show>
  </>;
}

function makeSettingsChoroplethLegend(
  layer: LayerDescriptionChoropleth,
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
      <label class="label">{ LL().Legend.Modal.LegendOrientation() }</label>
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
          { LL().Legend.Modal.LegendOrientationHorizontal() }
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
          { LL().Legend.Modal.LegendOrientationVertical() }
        </label>
      </div>
    </div>
    <hr />
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        { LL().Legend.Modal.MoreOptions() }
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }} />
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable layer={layer} LL={LL} />
      <hr />
      <OptionBackgroundRectangle layer={layer} LL={LL} />
    </Show>
  </>;
}

function makeSettingsDiscontinuityLegend(
  layer: LayerDescriptionDiscontinuity,
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
     <label class="label">{ LL().Legend.Modal.LineLength() }</label>
     <div class="control">
       <input
         class="input"
         type="number"
         value={ layer.legend.lineLength }
         min={0}
         max={100}
         step={1}
         onChange={(ev) => debouncedUpdateProps(layer.id, ['legend', 'lineLength'], +ev.target.value)}
       />
     </div>
   </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.LegendOrientation() }</label>
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
          { LL().Legend.Modal.LegendOrientationHorizontal() }
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
          { LL().Legend.Modal.LegendOrientationVertical() }
        </label>
      </div>
    </div>
    <hr />
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        { LL().Legend.Modal.MoreOptions() }
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }} />
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable layer={layer} LL={LL} />
      <hr />
      <OptionBackgroundRectangle layer={layer} LL={LL} />
    </Show>
 </>;
}

function makeSettingsLabels(
  layer: LayerDescriptionLabels,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  return <></>;
}

function getInnerPanel(ld: LayerDescription, LL: Accessor<TranslationFunctions>): JSX.Element {
  if (ld.legend?.type === LegendType.choropleth) {
    return makeSettingsChoroplethLegend(ld as LayerDescriptionChoropleth, LL);
  }
  if (ld.legend?.type === LegendType.proportional) {
    return makeSettingsProportionalSymbolsLegend(ld as LayerDescriptionProportionalSymbols, LL);
  }
  if (ld.legend?.type === LegendType.discontinuity) {
    return makeSettingsDiscontinuityLegend(ld as LayerDescriptionDiscontinuity, LL);
  }
  if (ld.legend?.type === LegendType.labels) {
    return makeSettingsLabels(ld as LayerDescriptionLabels, LL);
  }
  return <></>;
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
    <br />
    <div class="legend-settings__content">
      {
        getInnerPanel(layerDescription, LL)
      }
    </div>
  </div>;
}
