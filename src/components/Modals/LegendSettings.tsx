// Imports from solid-js
import {
  Accessor,
  createSignal,
  For,
  type JSX,
  Show,
} from 'solid-js';

// Imports from other libs
import { FaSolidPlus } from 'solid-icons/fa';

// Stores
import { layersDescriptionStore, setLayersDescriptionStoreBase } from '../../store/LayersDescriptionStore';

// Helpers
import { webSafeFonts, fonts } from '../../helpers/font';
import {
  ascending,
  capitalizeFirstLetter,
  debounce,
  isFiniteNumber,
  isNonNull,
  unproxify,
} from '../../helpers/common';
import { findLayerById } from '../../helpers/layers';
import { round } from '../../helpers/math';
import type { TranslationFunctions } from '../../i18n/i18n-types';

// Subcomponents
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldText from '../Inputs/InputText.tsx';

// Types / Interfaces / Enums
import {
  type CategoricalChoroplethBarchartLegend, type CategoricalChoroplethLegend,
  type CategoricalPictogramLegend, type ChoroplethHistogramLegend,
  type ChoroplethLegend,
  type DiscontinuityLegend,
  type LabelsLegend,
  type LayerDescriptionCategoricalChoropleth,
  type LayerDescriptionChoropleth,
  type LayerDescriptionGriddedLayer,
  type LayerDescriptionSmoothedLayer,
  type LayoutFeature,
  type Legend,
  LegendType,
  type LinearRegressionScatterPlot,
  type MushroomsLegend,
  type ProportionalSymbolsLegend,
  type ProportionalSymbolsParameters,
  RepresentationType,
} from '../../global.d';
import InputFieldSelect from '../Inputs/InputSelect.tsx';

/**
 * Update a single property of a legend in the layersDescriptionStore,
 * given its id and the path to the property.
 * TODO: we should refactor updateProp in LayersDescriptionStore.tsx
 *    to be able to use it here too.
 *
 * @param {string} legendId - The id of the legend to update.
 * @param {string[]} props - The path to the property to update.
 * @param {string | number | boolean} value - The new value of the property.
 * @return {void}
 */
const updateProps = (
  legendId: string,
  props: string[],
  value: string | number | boolean,
): void => {
  const allPropsExceptLast = props.slice(0, props.length - 1);
  const lastProp = props[props.length - 1];
  const args = [
    'layoutFeaturesAndLegends',
    (l: LayoutFeature | Legend) => l.id === legendId,
    ...allPropsExceptLast,
    {
      [lastProp]: value,
    },
  ];
  setLayersDescriptionStoreBase(...args);
};

const debouncedUpdateProps = debounce(updateProps, 200);

function TextOptionTable(
  props: {
    legend: Legend,
    textProperties: ('title' | 'subtitle' | 'labels' | 'note')[],
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  return <table class="table-font-properties" style={{ 'text-align': 'center' }}>
    <thead>
    <tr>
      <th></th>
      <For each={props.textProperties}>
        {(textElement) => <th>
          {props.LL().Legend.Modal[`${textElement}TextElement`]()}
        </th>}
      </For>
    </tr>
    </thead>
    <tbody>
    <tr>
      <td>{ props.LL().CommonTextElement.FontSize() }</td>
      <For each={props.textProperties}>
        {(textElement) => <td>
          <div class="control">
            <input
              class="input"
              type="number"
              value={ props.legend[textElement].fontSize }
              min={0}
              max={100}
              step={1}
              onChange={
                (ev) => debouncedUpdateProps(
                  props.legend.id,
                  [textElement, 'fontSize'],
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
      <For each={props.textProperties}>
        {(textElement) => <td>
          <input
            class="color"
            type="color"
            value={ props.legend[textElement].fontColor }
            onChange={(e) => debouncedUpdateProps(
              props.legend.id,
              [textElement, 'fontColor'],
              e.target.value,
            )}
          />
        </td>}
      </For>
    </tr>
    <tr>
      <td>{ props.LL().CommonTextElement.FontStyle() }</td>
      <For each={props.textProperties}>
        {(textElement) => <td>
          <select
            value={ props.legend[textElement].fontStyle }
            onChange={(ev) => debouncedUpdateProps(
              props.legend.id,
              [textElement, 'fontStyle'],
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
      <For each={props.textProperties}>
        {(textElement) => <td>
          <select
            value={ props.legend[textElement].fontWeight }
            onChange={(ev) => debouncedUpdateProps(
              props.legend.id,
              [textElement, 'fontWeight'],
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
      <For each={props.textProperties}>
        {(textElement) => <td>
          <select
            value={ props.legend[textElement].fontFamily }
            onChange={(ev) => debouncedUpdateProps(
              props.legend.id,
              [textElement, 'fontFamily'],
              ev.target.value,
            )}
          >
            <option disabled>{props.LL().Fonts.FontFamilyTypes()}</option>
            <For each={webSafeFonts}>
              {(font) => <option value={font}>{font}</option>}
            </For>
            <option disabled>{props.LL().Fonts.Fonts()}</option>
            <For each={fonts}>
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
  props: { legend: Legend, LL: Accessor<TranslationFunctions>, role: string },
): JSX.Element {
  return <div class="field">
    <label class="label">{ props.LL().Legend.Modal[`Legend${capitalizeFirstLetter(props.role)}`]() }</label>
    <div class="control">
      <input
        class="input"
        type="text"
        value={ props.legend[props.role].text || '' }
        onChange={(ev) => debouncedUpdateProps(props.legend.id, [props.role, 'text'], ev.target.value)}
      />
    </div>
  </div>;
}

function FieldRoundDecimals(
  props: { legend: Legend, LL: Accessor<TranslationFunctions> },
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
        value={ props.legend.roundDecimals as number }
        onChange={(ev) => {
          const value = ev.target.value.length > 0
            ? +ev.target.value
            : 0;
          debouncedUpdateProps(props.legend.id, ['roundDecimals'], value);
        }}
      />
    </div>
  </div>;
}

function OptionBackgroundRectangle(
  props: {
    legend: Legend,
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  return <>
    <InputFieldCheckbox
      label={ props.LL().Legend.Modal.DisplayBackgroundRectangle() }
      checked={props.legend.backgroundRect.visible}
      onChange={(v) => {
        if (v && !props.legend.backgroundRect.fill) {
          updateProps(props.legend.id, ['backgroundRect', 'fill'], '#ffffff');
        }
        if (v && !props.legend.backgroundRect.fillOpacity) {
          updateProps(props.legend.id, ['backgroundRect', 'fillOpacity'], 1);
        }
        if (v && !props.legend.backgroundRect.stroke) {
          updateProps(props.legend.id, ['backgroundRect', 'stroke'], '#000000');
        }
        if (v && !props.legend.backgroundRect.strokeWidth) {
          updateProps(props.legend.id, ['backgroundRect', 'strokeWidth'], 1);
        }
        if (v && !props.legend.backgroundRect.strokeOpacity) {
          updateProps(props.legend.id, ['backgroundRect', 'strokeOpacity'], 1);
        }
        debouncedUpdateProps(props.legend.id, ['backgroundRect', 'visible'], v);
      }}
    />
    <Show when={props.legend.backgroundRect.visible}>
      <InputFieldColor
        label={ props.LL().Legend.Modal.BackgroundRectangleColor() }
        value={ props.legend.backgroundRect.fill! }
        onChange={(v) => debouncedUpdateProps(props.legend.id, ['backgroundRect', 'fill'], v)}
      />
      <InputFieldNumber
        label={ props.LL().Legend.Modal.BackgroundRectangleOpacity() }
        value={ props.legend.backgroundRect.fillOpacity! }
        onChange={(v) => debouncedUpdateProps(props.legend.id, ['backgroundRect', 'fillOpacity'], v)}
        min={0}
        max={1}
        step={0.1}
      />
      <InputFieldColor
        label={ props.LL().Legend.Modal.BackgroundRectangleStrokeColor() }
        value={ props.legend.backgroundRect.stroke! }
        onChange={(v) => debouncedUpdateProps(props.legend.id, ['backgroundRect', 'stroke'], v)}
      />
      <InputFieldNumber
        label={ props.LL().Legend.Modal.BackgroundRectangleStrokeOpacity() }
        value={ props.legend.backgroundRect.strokeOpacity! }
        onChange={(v) => debouncedUpdateProps(props.legend.id, ['backgroundRect', 'strokeOpacity'], v)}
        min={0}
        max={1}
        step={0.1}
      />
      <InputFieldNumber
        label={ props.LL().Legend.Modal.BackgroundRectangleStrokeWidth() }
        value={ props.legend.backgroundRect.strokeWidth! }
        onChange={(v) => debouncedUpdateProps(props.legend.id, ['backgroundRect', 'strokeWidth'], v)}
        min={0}
        max={10}
        step={1}
      />
    </Show>
  </>;
}

function FieldChangeValues(
  props: { legend: ProportionalSymbolsLegend, LL: Accessor<TranslationFunctions> },
): JSX.Element {
  const styleInputElement = { width: '8.5em !important', 'font-size': '0.9rem' };
  return <div class="field">
    <label class="label" style={{ width: '30%' }}>
      { props.LL().Legend.Modal.ChooseValues() }
    </label>
    <div class="control" style={{ width: '70%', 'text-align': 'right' }}>
      <FaSolidPlus
        style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }}
        title={props.LL().Legend.Modal.AddValue()}
        onClick={() => {
          const values = unproxify(props.legend.values.slice()) as number[];
          values.unshift(props.legend.values[0] - 1);
          debouncedUpdateProps(props.legend.id, ['values'], values);
        }}
      />
      <For each={props.legend.values}>
        {
          (value, i) => <input
            style={styleInputElement}
            type="number"
            min={0}
            step={1}
            value={round(value, (props.legend.roundDecimals || 0) + 3)}
            onChange={(ev) => {
              const newValue = +ev.target.value;
              const values = unproxify(props.legend.values.slice()) as number[];
              values[i()] = newValue;
              values.sort(ascending);
              debouncedUpdateProps(props.legend.id, ['values'], values.filter((v) => v !== 0));
            }}
          />
        }
      </For>
    </div>
  </div>;
}

function FieldChangeMushroomValues(
  props: {
    legend: MushroomsLegend,
    which: 'top' | 'bottom',
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  const styleInputElement = { width: '8.5em !important', 'font-size': '0.9rem' };
  return <div class="field">
    <label class="label">{ props.LL().Legend.Modal.ChooseValues() }</label>
    <div class="control">
      <FaSolidPlus
        style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }}
        onClick={() => {
          const values = unproxify(props.legend.values[props.which].slice()) as number[];
          values.unshift(1);
          debouncedUpdateProps(props.legend.id, ['values', props.which], values);
        }}
      />
      <For each={props.legend.values[props.which]}>
        {
          (value, i) => <input
            style={styleInputElement}
            type="number"
            min={0}
            step={1}
            value={value}
            onChange={(ev) => {
              const newValue = +ev.target.value;
              const values = unproxify(props.legend.values[props.which].slice()) as number[];
              values[i()] = newValue;
              values.sort(ascending);
              debouncedUpdateProps(
                props.legend.id,
                ['values', props.which],
                values.filter((v) => v !== 0),
              );
            }}
          />
        }
      </For>
    </div>
  </div>;
}

function makeSettingsProportionalSymbolsLegend(
  legend: ProportionalSymbolsLegend,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )!;
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  return <>
    <FieldText legend={legend} LL={LL} role={'title'} />
    <FieldText legend={legend} LL={LL} role={'subtitle'} />
    <FieldText legend={legend} LL={LL} role={'note'} />
    <FieldRoundDecimals legend={legend} LL={LL} />
    <FieldChangeValues legend={legend} LL={LL} />
    <div class="field">
      <label class="label">{ LL().Legend.Modal.LegendSymbolLayout() }</label>
      <div class="control">
        <Show when={(layer.rendererParameters as ProportionalSymbolsParameters).colorMode !== 'positiveNegative'}>
          <label class="radio" style={{ 'margin-right': '2em' }}>
            <input
              type="radio"
              name="legend-layout"
              {...(legend.layout === 'stacked' ? { checked: true } : {}) }
              onChange={() => {
                updateProps(legend.id, ['layout'], 'stacked');
              }}
            />
            { LL().Legend.Modal.LegendSymbolLayoutStacked() }
          </label>
        </Show>
        <label class="radio" style={{ 'margin-right': '2em' }}>
          <input
            type="radio"
            name="legend-layout"
            {...(legend.layout === 'horizontal' ? { checked: true } : {}) }
            onChange={() => {
              updateProps(legend.id, ['layout'], 'horizontal');
            }}
          />
          { LL().Legend.Modal.LegendSymbolLayoutHorizontal() }
        </label>
        <label class="radio">
          <input
            type="radio"
            name="legend-layout"
            {...(legend.layout === 'vertical' ? { checked: true } : {}) }
            onChange={() => {
              updateProps(legend.id, ['layout'], 'vertical');
            }}
          />
          { LL().Legend.Modal.LegendSymbolLayoutVertical() }
        </label>
      </div>
    </div>
    <Show when={['horizontal', 'vertical'].includes(legend.layout)}>
      <div class="field">
        <label class="label">{ LL().Legend.Modal.SymbolsSpacing() }</label>
        <div class="control">
          <input
            class="input"
            type="number"
            min={0}
            max={100}
            step={1}
            value={ legend.spacing }
            onChange={(ev) => debouncedUpdateProps(legend.id, ['spacing'], +ev.target.value)}
          />
        </div>
      </div>
    </Show>
    <OptionBackgroundRectangle legend={legend} LL={LL} />
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        { LL().Legend.Modal.FontProperties() }
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }} />
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable
        legend={legend}
        LL={LL}
        textProperties={['title', 'subtitle', 'labels', 'note']}
      />
    </Show>
  </>;
}

function makeSettingsChoroplethLegend(
  legend: CategoricalChoroplethLegend | ChoroplethLegend,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  const layer = findLayerById(
    layersDescriptionStore.layers,
    legend.layerId,
  )! as LayerDescriptionChoropleth
  | LayerDescriptionSmoothedLayer
  | LayerDescriptionCategoricalChoropleth
  | LayerDescriptionGriddedLayer;

  const isChoroplethLegend = (
    representationType: RepresentationType,
  ) => ['choropleth', 'smoothed', 'grid'].includes(representationType);

  const hasNoData = legend.type === 'categoricalChoropleth'
    ? layer.data.features.filter(
      (feature) => !isNonNull(feature.properties[layer.rendererParameters!.variable]),
    ).length > 0
    : layer.data.features.filter(
      (feature) => !isFiniteNumber(feature.properties[layer.rendererParameters!.variable]),
    ).length > 0;

  return <>
    <FieldText legend={legend} LL={LL} role={'title'} />
    <FieldText legend={legend} LL={LL} role={'subtitle'} />
    <FieldText legend={legend} LL={LL} role={'note'} />
    <FieldRoundDecimals legend={legend} LL={LL} />
    <div class="field">
      <label class="label">{ LL().Legend.Modal.BoxWidth() }</label>
      <div class="control">
        <input
          class="input"
          type="number"
          value={ legend.boxWidth }
          min={0}
          max={100}
          step={1}
          onChange={(ev) => debouncedUpdateProps(legend.id, ['boxWidth'], +ev.target.value)}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.BoxHeight() }</label>
      <div class="control">
        <input
          class="input"
          type="number"
          value={ legend.boxHeight }
          min={0}
          max={100}
          step={1}
          onChange={(ev) => debouncedUpdateProps(legend.id, ['boxHeight'], +ev.target.value)}
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
          value={ legend.boxCornerRadius }
          onChange={(ev) => {
            const radiusValue = +ev.target.value;
            // Remove the tick if the radius is > 0
            // (because the tick is interesting only for square / rectangular boxes)
            if (radiusValue > 0 && legend.tick) {
              updateProps(legend.id, ['tick'], false);
            }
            debouncedUpdateProps(legend.id, ['boxCornerRadius'], radiusValue);
          }}
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
          value={ legend.boxSpacing }
          onChange={(ev) => {
            const spacingValue = +ev.target.value;
            // Remove the tick if the spacing is > 0
            // (because the tick is interesting only if boxes are adjacent)
            if (spacingValue > 0 && legend.tick) {
              updateProps(legend.id, ['tick'], false);
            }
            debouncedUpdateProps(legend.id, ['boxSpacing'], spacingValue);
          }}
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().Legend.Modal.DisplayStroke() }</label>
      <div class="control">
        <input
          type="checkbox"
          checked={legend.stroke}
          onChange={(ev) => updateProps(legend.id, ['stroke'], ev.target.checked)}
        />
      </div>
    </div>
    <Show when={
      isChoroplethLegend(layer.renderer)
      && legend.boxSpacing === 0
      && legend.boxCornerRadius === 0
    }>
      <div class="field">
        <label class="label">
          { LL().Legend.Modal.DisplayTick() }
        </label>
        <div class="control">
          <input
            type="checkbox"
            checked={legend.tick}
            onChange={(ev) => updateProps(legend.id, ['tick'], ev.target.checked)}
          />
        </div>
      </div>
    </Show>
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
            value={ legend.boxSpacingNoData }
            onChange={(ev) => debouncedUpdateProps(legend.id, ['boxSpacingNoData'], +ev.target.value)}
          />
        </div>
      </div>
      <div class="field">
        <label class="label">{ LL().Legend.Modal.NoDataLabel() }</label>
        <div class="control">
          <input
            class="input"
            type="text"
            value={ legend.noDataLabel }
            onChange={(ev) => debouncedUpdateProps(legend.id, ['noDataLabel'], ev.target.value)}
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
            {...(legend.orientation === 'horizontal' ? { checked: true } : {}) }
            onChange={(ev) => {
              const value = ev.target.checked ? 'horizontal' : 'vertical';
              updateProps(legend.id, ['orientation'], value);
            }}
          />
          { LL().Legend.Modal.LegendOrientationHorizontal() }
        </label>
        <label class="radio">
          <input
            type="radio"
            name="legend-orientation"
            {...(legend.orientation === 'vertical' ? { checked: true } : {}) }
            onChange={(ev) => {
              const value = ev.target.checked ? 'vertical' : 'horizontal';
              updateProps(legend.id, ['orientation'], value);
            }}
          />
          { LL().Legend.Modal.LegendOrientationVertical() }
        </label>
      </div>
    </div>
    <OptionBackgroundRectangle legend={legend} LL={LL} />
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        { LL().Legend.Modal.FontProperties() }
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }} />
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable
        legend={legend}
        LL={LL}
        textProperties={['title', 'subtitle', 'labels', 'note']}
      />
    </Show>
  </>;
}

function makeSettingsDiscontinuityLegend(
  legend: DiscontinuityLegend,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  return <>
   <FieldText legend={legend} LL={LL} role={'title'} />
   <FieldText legend={legend} LL={LL} role={'subtitle'} />
   <FieldText legend={legend} LL={LL} role={'note'} />
   <FieldRoundDecimals legend={legend} LL={LL} />
   <div class="field">
     <label class="label">{ LL().Legend.Modal.LineLength() }</label>
     <div class="control">
       <input
         class="input"
         type="number"
         value={ legend.lineLength }
         min={0}
         max={100}
         step={1}
         onChange={(ev) => debouncedUpdateProps(legend.id, ['lineLength'], +ev.target.value)}
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
            {...(legend.orientation === 'horizontal' ? { checked: true } : {}) }
            onChange={(ev) => {
              const value = ev.target.checked ? 'horizontal' : 'vertical';
              updateProps(legend.id, ['orientation'], value);
            }}
          />
          { LL().Legend.Modal.LegendOrientationHorizontal() }
        </label>
        <label class="radio">
          <input
            type="radio"
            name="legend-orientation"
            {...(legend?.orientation === 'vertical' ? { checked: true } : {}) }
            onChange={(ev) => {
              const value = ev.target.checked ? 'vertical' : 'horizontal';
              updateProps(legend.id, ['orientation'], value);
            }}
          />
          { LL().Legend.Modal.LegendOrientationVertical() }
        </label>
      </div>
    </div>
    <OptionBackgroundRectangle legend={legend} LL={LL} />
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        { LL().Legend.Modal.FontProperties() }
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }} />
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable
        legend={legend}
        LL={LL}
        textProperties={['title', 'subtitle', 'labels', 'note']}
      />
    </Show>
 </>;
}

function makeSettingsLabels(
  legend: LabelsLegend,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  return <>
    <FieldText legend={legend} LL={LL} role={'title'}/>
    <FieldText legend={legend} LL={LL} role={'subtitle'}/>
    <FieldText legend={legend} LL={LL} role={'note'}/>
    <OptionBackgroundRectangle legend={legend} LL={LL}/>
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        {LL().Legend.Modal.FontProperties()}
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }}/>
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable
        legend={legend}
        LL={LL}
        textProperties={['title', 'subtitle', 'labels', 'note']}
      />
    </Show>
  </>;
}

function makeSettingsMushrooms(
  legend: MushroomsLegend,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  return <>
    <FieldText legend={legend} LL={LL} role={'title'}/>
    <FieldText legend={legend} LL={LL} role={'subtitle'}/>
    <FieldText legend={legend} LL={LL} role={'note'}/>
    <div class="mt-4 mb-5 has-text-weight-bold">
      {LL().FunctionalitiesSection.MushroomsOptions.TopProperties()}
    </div>
    <InputFieldColor
      label={LL().Legend.Modal.MushroomsTopTitleColor()}
      value={legend.topTitle.fontColor}
      onChange={(v) => {
        debouncedUpdateProps(legend.id, ['topTitle', 'fontColor'], v);
      }}
    />
    <InputFieldText
      label={LL().Legend.Modal.MushroomsTopTitle()}
      value={legend.topTitle.text}
      onChange={(v) => debouncedUpdateProps(legend.id, ['topTitle', 'text'], v)}
    />
    <FieldChangeMushroomValues legend={legend} which={'top'} LL={LL} />
    <div class="mt-4 mb-5 has-text-weight-bold">
      {LL().FunctionalitiesSection.MushroomsOptions.BottomProperties()}
    </div>
    <InputFieldColor
      label={LL().Legend.Modal.MushroomsBottomTitleColor()}
      value={legend.bottomTitle.fontColor}
      onChange={(v) => {
        debouncedUpdateProps(legend.id, ['bottomTitle', 'fontColor'], v);
      }}
    />
    <InputFieldText
      label={LL().Legend.Modal.MushroomsBottomTitle()}
      value={legend.bottomTitle.text}
      onChange={(v) => debouncedUpdateProps(legend.id, ['bottomTitle', 'text'], v)}
    />
    <FieldChangeMushroomValues legend={legend} which={'bottom'} LL={LL} />
    <OptionBackgroundRectangle legend={legend} LL={LL}/>
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        {LL().Legend.Modal.FontProperties()}
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }}/>
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable
        legend={legend}
        LL={LL}
        textProperties={['title', 'subtitle', 'labels', 'note']}
      />
    </Show>
  </>;
}

function makeSettingsChoroplethHistogram(
  legend: ChoroplethHistogramLegend,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  return <>
    <FieldText legend={legend} LL={LL} role={'title'}/>
    <FieldText legend={legend} LL={LL} role={'subtitle'}/>
    <FieldText legend={legend} LL={LL} role={'note'}/>
    <InputFieldNumber
      label={LL().Legend.Modal.Width()}
      value={legend.width}
      onChange={(v) => debouncedUpdateProps(legend.id, ['width'], v)}
      min={10}
      max={800}
      step={1}
    />
    <InputFieldNumber
      label={LL().Legend.Modal.Height()}
      value={legend.height}
      onChange={(v) => debouncedUpdateProps(legend.id, ['height'], v)}
      min={10}
      max={800}
      step={1}
    />
    <InputFieldNumber
      label={LL().Legend.Modal.RoundDecimals()}
      value={legend.roundDecimals}
      onChange={(v) => debouncedUpdateProps(legend.id, ['roundDecimals'], v)}
      min={-3}
      max={30}
      step={1}
    />
    <InputFieldColor
      label={'Axes color'}
      value={legend.fontColor}
      onChange={(v) => debouncedUpdateProps(legend.id, ['fontColor'], v)}
    />
    <OptionBackgroundRectangle legend={legend} LL={LL}/>
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        {LL().Legend.Modal.FontProperties()}
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }}/>
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable
        legend={legend}
        LL={LL}
        textProperties={['title', 'subtitle', 'note']}
      />
    </Show>
  </>;
}

function makeSettginsCategoricalChoroplethBarchart(
  legend: CategoricalChoroplethBarchartLegend,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  return <>
    <FieldText legend={legend} LL={LL} role={'title'}/>
    <FieldText legend={legend} LL={LL} role={'subtitle'}/>
    <FieldText legend={legend} LL={LL} role={'note'}/>
    <InputFieldNumber
      label={LL().Legend.Modal.Width()}
      value={legend.width}
      onChange={(v) => debouncedUpdateProps(legend.id, ['width'], v)}
      min={10}
      max={800}
      step={1}
    />
    <InputFieldNumber
      label={LL().Legend.Modal.Height()}
      value={legend.height}
      onChange={(v) => debouncedUpdateProps(legend.id, ['height'], v)}
      min={10}
      max={800}
      step={1}
    />
    <InputFieldColor
      label={LL().Legend.Modal.AxesAndLabelsColor()}
      value={legend.fontColor}
      onChange={(v) => debouncedUpdateProps(legend.id, ['fontColor'], v)}
    />
    <div class="field">
      <label class="label">{LL().Legend.Modal.LegendOrientation()}</label>
      <div class="control">
        <label class="radio" style={{ 'margin-right': '2em' }}>
          <input
            type="radio"
            name="legend-orientation"
            {...(legend.orientation === 'horizontal' ? { checked: true } : {})}
            onChange={(ev) => {
              const value = ev.target.checked ? 'horizontal' : 'vertical';
              updateProps(legend.id, ['orientation'], value);
            }}
          />
          {LL().Legend.Modal.LegendOrientationHorizontal()}
        </label>
        <label class="radio">
          <input
            type="radio"
            name="legend-orientation"
            {...(legend.orientation === 'vertical' ? { checked: true } : {})}
            onChange={(ev) => {
              const value = ev.target.checked ? 'vertical' : 'horizontal';
              updateProps(legend.id, ['orientation'], value);
            }}
          />
          {LL().Legend.Modal.LegendOrientationVertical()}
        </label>
      </div>
    </div>
    <InputFieldSelect
      label={LL().Legend.Modal.BarOrder()}
      onChange={(v) => { debouncedUpdateProps(legend.id, ['order'], v); }}
      value={legend.order}
    >
      <option value="ascending">{LL().Legend.Modal.BarOrderAscending()}</option>
      <option value="descending">{LL().Legend.Modal.BarOrderDescending()}</option>
      <option value="none">{LL().Legend.Modal.BarOrderNone()}</option>
    </InputFieldSelect>
    <OptionBackgroundRectangle legend={legend} LL={LL}/>
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        {LL().Legend.Modal.FontProperties()}
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }}/>
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable
        legend={legend}
        LL={LL}
        textProperties={['title', 'subtitle', 'note']}
      />
    </Show>
  </>;
}

function makeSettingsScatterPlot(
  legend: LinearRegressionScatterPlot,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  return <>
    <FieldText legend={legend} LL={LL} role={'title'}/>
    <FieldText legend={legend} LL={LL} role={'subtitle'}/>
    <FieldText legend={legend} LL={LL} role={'note'}/>
    <InputFieldNumber
      label={LL().Legend.Modal.Width()}
      value={legend.width}
      onChange={(v) => debouncedUpdateProps(legend.id, ['width'], v)}
      min={10}
      max={800}
      step={1}
    />
    <InputFieldNumber
      label={LL().Legend.Modal.Height()}
      value={legend.height}
      onChange={(v) => debouncedUpdateProps(legend.id, ['height'], v)}
      min={10}
      max={800}
      step={1}
    />
    <InputFieldNumber
      label={LL().Legend.Modal.RoundDecimals()}
      value={legend.roundDecimals}
      onChange={(v) => debouncedUpdateProps(legend.id, ['roundDecimals'], v)}
      min={-3}
      max={30}
      step={1}
    />
    <InputFieldColor
      label={LL().Legend.Modal.AxesAndLabelsColor()}
      value={legend.fontColor}
      onChange={(v) => debouncedUpdateProps(legend.id, ['fontColor'], v)}
    />
    <OptionBackgroundRectangle legend={legend} LL={LL}/>
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        {LL().Legend.Modal.FontProperties()}
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }}/>
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable
        legend={legend}
        LL={LL}
        textProperties={['title', 'subtitle', 'note']}
      />
    </Show>
  </>;
}

function makeSettingsCategoricalPictogram(
  legend: CategoricalPictogramLegend,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const [
    displayMoreOptions,
    setDisplayMoreOptions,
  ] = createSignal<boolean>(false);

  return <>
    <FieldText legend={legend} LL={LL} role={'title'}/>
    <FieldText legend={legend} LL={LL} role={'subtitle'}/>
    <FieldText legend={legend} LL={LL} role={'note'}/>
    <div class="field">
      <label class="label">{LL().Legend.Modal.SymbolsSpacing()}</label>
      <div class="control">
        <input
          class="input"
          type="number"
          min={0}
          max={100}
          step={1}
          value={legend.spacing}
          onChange={(ev) => debouncedUpdateProps(legend.id, ['spacing'], +ev.target.value)}
        />
      </div>
    </div>
    <OptionBackgroundRectangle legend={legend} LL={LL}/>
    <div
      onClick={() => setDisplayMoreOptions(!displayMoreOptions())}
      style={{ cursor: 'pointer' }}
    >
      <p class="label">
        {LL().Legend.Modal.FontProperties()}
        <FaSolidPlus style={{ 'vertical-align': 'text-bottom', margin: 'auto 0.5em' }}/>
      </p>
    </div>
    <Show when={displayMoreOptions()}>
      <TextOptionTable
        legend={legend}
        LL={LL}
        textProperties={['title', 'subtitle', 'labels', 'note']}
      />
    </Show>
  </>;
}

function getInnerPanel(legend: Legend, LL: Accessor<TranslationFunctions>): JSX.Element {
  if (legend.type === LegendType.choropleth) {
    return makeSettingsChoroplethLegend(legend as ChoroplethLegend, LL);
  }
  if (legend.type === LegendType.categoricalChoropleth) {
    return makeSettingsChoroplethLegend(legend as CategoricalChoroplethLegend, LL);
  }
  if (legend.type === LegendType.proportional) {
    return makeSettingsProportionalSymbolsLegend(legend as ProportionalSymbolsLegend, LL);
  }
  if (legend.type === LegendType.discontinuity) {
    return makeSettingsDiscontinuityLegend(legend as DiscontinuityLegend, LL);
  }
  if (legend.type === LegendType.labels) {
    return makeSettingsLabels(legend as LabelsLegend, LL);
  }
  if (legend.type === LegendType.mushrooms) {
    return makeSettingsMushrooms(legend as MushroomsLegend, LL);
  }
  if (legend.type === LegendType.categoricalChoroplethBarchart) {
    return makeSettginsCategoricalChoroplethBarchart(
      legend as CategoricalChoroplethBarchartLegend,
      LL,
    );
  }
  if (legend.type === LegendType.choroplethHistogram) {
    return makeSettingsChoroplethHistogram(
      legend as ChoroplethHistogramLegend,
      LL,
    );
  }
  if (legend.type === LegendType.linearRegressionScatterPlot) {
    return makeSettingsScatterPlot(
      legend as LinearRegressionScatterPlot,
      LL,
    );
  }
  if (legend.type === LegendType.categoricalPictogram) {
    return makeSettingsCategoricalPictogram(
      legend as CategoricalPictogramLegend,
      LL,
    );
  }
  return <></>;
}

export default function LegendSettings(
  props: {
    legendId: string,
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const { LL, legendId } = props; // eslint-disable-line solid/reactivity
  const legendDescription = layersDescriptionStore.layoutFeaturesAndLegends
    .find((el) => el.id === legendId) as Legend;

  return <div class="legend-settings">
    <br />
    <div class="legend-settings__content">
      {
        getInnerPanel(legendDescription, LL)
      }
    </div>
  </div>;
}
