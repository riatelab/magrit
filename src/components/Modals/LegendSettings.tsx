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
import { fonts, webSafeFonts } from '../../helpers/font';
import { prepareStatisticalSummary } from '../../helpers/classification';
import {
  ascending,
  capitalizeFirstLetter,
  debounce,
  isFiniteNumber,
  isNonNull,
  unproxify,
} from '../../helpers/common';
import { findLayerById } from '../../helpers/layers';
import { Mround, round } from '../../helpers/math';
import type { TranslationFunctions } from '../../i18n/i18n-types';

// Subcomponents
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import {
  InputFieldColorOpacity,
  InputFieldColorWidth,
  InputFieldColorWidthHeight,
  InputFieldWidthColorOpacity,
} from '../Inputs/InputFieldColorOpacity.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldText from '../Inputs/InputText.tsx';

// Types / Interfaces / Enums
import {
  type CategoricalChoroplethBarchartLegend,
  type CategoricalChoroplethLegend,
  type CategoricalPictogramLegend,
  type ChoroplethHistogramLegend,
  type ChoroplethLegend, type ClassificationParameters,
  DefaultLegend,
  type DiscontinuityLegend,
  type LabelsLegend, LayerDescription,
  type LayerDescriptionCategoricalChoropleth,
  type LayerDescriptionChoropleth,
  type LayerDescriptionGriddedLayer,
  type LayerDescriptionProportionalSymbols,
  type LayerDescriptionSmoothedLayer,
  type LayoutFeature,
  type Legend,
  LegendType,
  type LinearRegressionScatterPlot,
  type MushroomsLegend,
  type ProportionalSymbolCategoryParameters,
  type ProportionalSymbolsLegend,
  type ProportionalSymbolsParameters,
  type ProportionalSymbolsRatioParameters,
  RepresentationType,
} from '../../global.d';

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
    textProperties: ('title' | 'subtitle' | 'labels' | 'axis' | 'note')[],
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
            class="input"
            type="color"
            style={{ height: '1.75em', padding: '0.05em', width: '5em' }}
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
  props: {
    legend: Legend,
    LL: Accessor<TranslationFunctions>,
    role: 'title' | 'subtitle' | 'note',
  },
): JSX.Element {
  return <div class="field">
    <label class="label">
      { props.LL().Legend.Modal[`Legend${capitalizeFirstLetter(props.role) as 'Title' | 'Subtitle' | 'Note'}`]() }
    </label>
    <div class="control" style={{ width: '300px' }}>
      <input
        class="input"
        type="text"
        value={ props.legend[props.role]?.text || '' }
        style={{ width: '100%' }}
        onKeyUp={(ev) => updateProps(props.legend.id, [props.role, 'text'], ev.currentTarget.value)}
        onChange={(ev) => updateProps(props.legend.id, [props.role, 'text'], ev.currentTarget.value)}
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
      <InputFieldColorOpacity
        label={props.LL().Legend.Modal.BackgroundRectangleFill()}
        valueColor={props.legend.backgroundRect.fill!}
        valueOpacity={props.legend.backgroundRect.fillOpacity!}
        onChangeColor={(v) => debouncedUpdateProps(props.legend.id, ['backgroundRect', 'fill'], v)}
        onChangeOpacity={(v) => debouncedUpdateProps(props.legend.id, ['backgroundRect', 'fillOpacity'], v)}
      />
      <InputFieldWidthColorOpacity
        label={props.LL().Legend.Modal.BackgroundRectangleStroke()}
        valueWidth={props.legend.backgroundRect.strokeWidth!}
        valueColor={props.legend.backgroundRect.stroke!}
        valueOpacity={props.legend.backgroundRect.strokeOpacity!}
        onChangeWidth={(v) => debouncedUpdateProps(props.legend.id, ['backgroundRect', 'strokeWidth'], v)}
        onChangeColor={(v) => debouncedUpdateProps(props.legend.id, ['backgroundRect', 'stroke'], v)}
        onChangeOpacity={(v) => debouncedUpdateProps(props.legend.id, ['backgroundRect', 'strokeOpacity'], v)}
      />
    </Show>
  </>;
}

function FieldChangeValues(
  props: { legend: ProportionalSymbolsLegend, LL: Accessor<TranslationFunctions> },
): JSX.Element {
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
            style={{ 'font-size': '0.9rem', height: '1.5rem' }}
            class="input"
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
            style={{ 'font-size': '0.9rem' }}
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
  | LayerDescriptionGriddedLayer
  | LayerDescriptionProportionalSymbols;

  const isChoroplethLegend = (
    representationType: RepresentationType,
  ) => ['choropleth', 'smoothed', 'grid'].includes(representationType);

  const choroVariable = layer.representationType === 'proportionalSymbols'
    ? (
      layer.rendererParameters as
        ProportionalSymbolsRatioParameters | ProportionalSymbolCategoryParameters
    ).color.variable
    : layer.rendererParameters!.variable;

  const hasNoData = legend.type === 'categoricalChoropleth'
    ? layer.data.features.filter(
      (feature) => !isNonNull(feature.properties[choroVariable]),
    ).length > 0
    : layer.data.features.filter(
      (feature) => !isFiniteNumber(feature.properties[choroVariable]),
    ).length > 0;

  return <>
    <FieldText legend={legend} LL={LL} role={'title'} />
    <FieldText legend={legend} LL={LL} role={'subtitle'} />
    <FieldText legend={legend} LL={LL} role={'note'} />
    <Show when={legend.type !== 'categoricalChoropleth'}>
      <FieldRoundDecimals legend={legend} LL={LL} />
    </Show>
    <InputFieldNumber
      label={ LL().Legend.Modal.BoxWidth() }
      value={ legend.boxWidth }
      min={0}
      max={100}
      step={1}
      onChange={(v) => debouncedUpdateProps(legend.id, ['boxWidth'], v)}
    />
    <InputFieldNumber
      label={ LL().Legend.Modal.BoxHeight() }
      value={ legend.boxHeight }
      min={0}
      max={100}
      step={1}
      onChange={(v) => debouncedUpdateProps(legend.id, ['boxHeight'], v)}
    />
    <InputFieldNumber
      label={ LL().Legend.Modal.BoxCornerRadius() }
      value={ legend.boxCornerRadius }
      min={0}
      max={100}
      step={1}
      strictMin={true}
      onChange={(v) => {
        // Remove the tick if the radius is > 0
        // (because the tick is interesting only for square / rectangular boxes)
        if (v > 0 && legend.tick) {
          updateProps(legend.id, ['tick'], false);
        }
        debouncedUpdateProps(legend.id, ['boxCornerRadius'], v);
      }}
    />
    <InputFieldNumber
      label={ LL().Legend.Modal.BoxSpacing() }
      value={ legend.boxSpacing }
      min={0}
      max={100}
      step={1}
      onChange={(v) => {
        // Remove the tick if the spacing is > 0
        // (because the tick is interesting only if boxes are adjacent)
        if (v > 0 && legend.tick) {
          updateProps(legend.id, ['tick'], false);
        }
        debouncedUpdateProps(legend.id, ['boxSpacing'], v);
      }}
    />
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
      isChoroplethLegend(layer.representationType)
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
      <InputFieldCheckbox
        label={LL().Legend.Modal.NoDataBox()}
        checked={legend.noDataBox}
        onChange={(v) => updateProps(legend.id, ['noDataBox'], v)}
      />
      <Show when={legend.noDataBox}>
        <InputFieldNumber
          label={LL().Legend.Modal.BoxSpacingNoData()}
          value={legend.boxSpacingNoData}
          min={0}
          max={100}
          step={1}
          onChange={(v) => debouncedUpdateProps(legend.id, ['boxSpacingNoData'], v)}
        />
        <div class="field">
          <label class="label">{LL().Legend.Modal.NoDataLabel()}</label>
          <div class="control">
            <input
              class="input"
              type="text"
              value={legend.noDataLabel}
              onChange={(ev) => debouncedUpdateProps(legend.id, ['noDataLabel'], ev.target.value)}
            />
          </div>
        </div>
      </Show>
    </Show>
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
    <InputFieldNumber
      label={LL().Legend.Modal.LineLength()}
      value={legend.lineLength}
      min={5}
      max={100}
      step={1}
      strictMinMax={true}
      onChange={(v) => debouncedUpdateProps(legend.id, ['lineLength'], v)}
    />
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
    <InputFieldText
      label={LL().Legend.Modal.LegendContent()}
      value={legend.labels.text}
      onChange={(v) => updateProps(legend.id, ['labels', 'text'], v)}
      bindKeyUpAsChange={true}
      width={300}
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
        textProperties={['title', 'subtitle', 'labels', 'note']}
      />
    </Show>
  </>;
}

function makeSettingsDefault(
  legend: DefaultLegend,
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
    <InputFieldText
      label={LL().Legend.Modal.LegendContent()}
      value={legend.labels.text}
      onChange={(v) => updateProps(legend.id, ['labels', 'text'], v)}
      bindKeyUpAsChange={true}
      width={300}
    />
    <Show when={legend.displayAsPolygon || legend.typeGeometry === 'polygon'}>
      <InputFieldNumber
        label={ LL().Legend.Modal.BoxWidth() }
        value={ legend.boxWidth }
        min={0}
        max={100}
        step={1}
        onChange={(v) => debouncedUpdateProps(legend.id, ['boxWidth'], v)}
      />
      <InputFieldNumber
        label={ LL().Legend.Modal.BoxHeight() }
        value={ legend.boxHeight }
        min={0}
        max={100}
        step={1}
        onChange={(v) => debouncedUpdateProps(legend.id, ['boxHeight'], v)}
      />
      <InputFieldNumber
        label={ LL().Legend.Modal.BoxCornerRadius() }
        value={ legend.boxCornerRadius }
        min={0}
        max={100}
        step={1}
        strictMin={true}
        onChange={(v) => debouncedUpdateProps(legend.id, ['boxCornerRadius'], v)}
      />
    </Show>
    <Show when={legend.typeGeometry === 'linestring'}>
      <InputFieldNumber
        label={ LL().Legend.Modal.LineLength() }
        value={ legend.boxWidth }
        min={0}
        max={100}
        step={1}
        onChange={(v) => debouncedUpdateProps(legend.id, ['boxWidth'], v)}
      />
    </Show>
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

  const refLayerId = legend.layerId;

  const refLayerDescription = findLayerById(
    layersDescriptionStore.layers,
    refLayerId,
  )!;

  // The values that we are gonna use for the classification
  function getClassificationParameters(layerDescription: LayerDescription) {
    if (layerDescription.representationType === 'choropleth') {
      return layerDescription.rendererParameters as ClassificationParameters;
    }
    if (
      layerDescription.representationType === 'proportionalSymbols'
      && (layerDescription as LayerDescriptionProportionalSymbols).rendererParameters.colorMode === 'ratioVariable'
    ) {
      return (layerDescription.rendererParameters as ProportionalSymbolsRatioParameters).color;
    }
    throw new Error('Invalid reference layer');
  }

  const classificationParameters = getClassificationParameters(refLayerDescription);

  const filteredSeries = refLayerDescription.data.features
    .map((d) => d.properties[classificationParameters.variable])
    .filter((d) => isFiniteNumber(d))
    .map((d) => +d);

  // Basic statistical summary displayed to the user
  const statSummary = prepareStatisticalSummary(filteredSeries);

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
    <InputFieldCheckbox
      label={LL().Legend.Modal.DisplayMean()}
      checked={!!legend.meanOptions}
      onChange={(v) => {
        if (v) {
          updateProps(legend.id, ['meanOptions'], { color: '#ff0000', width: 2, value: statSummary.mean });
        } else {
          updateProps(legend.id, ['meanOptions'], undefined);
        }
      }}
    />
    <Show when={!!legend.meanOptions}>
      <InputFieldColorWidth
        label={''}
        valueColor={legend.meanOptions!.color}
        valueWidth={legend.meanOptions!.width}
        onChangeColor={(v) => { updateProps(legend.id, ['meanOptions', 'color'], v); }}
        onChangeWidth={(v) => { updateProps(legend.id, ['meanOptions', 'width'], v); }}
      />
    </Show>
    <InputFieldCheckbox
      label={LL().Legend.Modal.DisplayMedian()}
      checked={!!legend.medianOptions}
      onChange={(v) => {
        if (v) {
          updateProps(legend.id, ['medianOptions'], {
            color: '#00ff00', width: 2, value: statSummary.median,
          });
        } else {
          updateProps(legend.id, ['medianOptions'], undefined);
        }
      }}
    />
    <Show when={!!legend.medianOptions}>
      <InputFieldColorWidth
        label={''}
        valueColor={legend.medianOptions!.color}
        valueWidth={legend.medianOptions!.width}
        onChangeColor={(v) => { updateProps(legend.id, ['medianOptions', 'color'], v); }}
        onChangeWidth={(v) => { updateProps(legend.id, ['medianOptions', 'width'], v); }}
      />
    </Show>
    {/*
    <InputFieldCheckbox
      label={LL().Legend.Modal.DisplayStdDev()}
      checked={!!legend.stddevOptions}
      onChange={(v) => {
        if (v) {
          updateProps(
            legend.id,
            ['stddevOptions'],
            {
              color: '#ef54e4',
              width: 2,
              values: [-statSummary.standardDeviation, statSummary.standardDeviation],
            },
          );
        } else {
          updateProps(legend.id, ['stddevOptions'], undefined);
        }
      }}
    />
    <Show when={!!legend.stddevOptions}>
      <InputFieldColorWidth
        label={''}
        valueColor={legend.stddevOptions!.color}
        valueWidth={legend.stddevOptions!.width}
        onChangeColor={(v) => { updateProps(legend.id, ['stddevOptions', 'color'], v); }}
        onChangeWidth={(v) => { updateProps(legend.id, ['stddevOptions', 'width'], v); }}
      />
    </Show>
    */}
    <InputFieldCheckbox
      label={LL().Legend.Modal.DisplayPopulation()}
      checked={!!legend.populationOptions}
      onChange={(v) => {
        if (v) {
          updateProps(
            legend.id,
            ['populationOptions'],
            {
              color: '#1100fe', width: 1, series: filteredSeries, height: 5,
            },
          );
        } else {
          updateProps(legend.id, ['populationOptions'], undefined);
        }
      }}
    />
    <Show when={!!legend.populationOptions}>
      <InputFieldColorWidthHeight
        label={''}
        valueColor={legend.populationOptions!.color}
        valueWidth={legend.populationOptions!.width}
        valueHeight={legend.populationOptions!.height}
        onChangeColor={(v) => { updateProps(legend.id, ['populationOptions', 'color'], v); }}
        onChangeWidth={(v) => { updateProps(legend.id, ['populationOptions', 'width'], v); }}
        onChangeHeight={(v) => { updateProps(legend.id, ['populationOptions', 'height'], v); }}
      />
    </Show>
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
        textProperties={['title', 'subtitle', 'axis', 'note']}
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
        textProperties={['title', 'subtitle', 'axis', 'note']}
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
      label={LL().Legend.Modal.DotColor()}
      value={legend.dotColor}
      onChange={(v) => debouncedUpdateProps(legend.id, ['dotColor'], v)}
    />
    <InputFieldColor
      label={LL().Legend.Modal.RegressionLineColor()}
      value={legend.regressionLineColor}
      onChange={(v) => debouncedUpdateProps(legend.id, ['regressionLineColor'], v)}
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
        textProperties={['title', 'subtitle', 'axis', 'note']}
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
  if (legend.type === LegendType.default) {
    return makeSettingsDefault(legend as DefaultLegend, LL);
  }
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
