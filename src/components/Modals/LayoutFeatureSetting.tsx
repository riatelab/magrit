// Imports from solid-js
import {
  type Accessor,
  For,
  type JSX,
  Show,
} from 'solid-js';

// Stores
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Subcomponents
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldText from '../Inputs/InputText.tsx';
import InputFieldTextarea from '../Inputs/InputTextarea.tsx';

// Helpers
import type { TranslationFunctions } from '../../i18n/i18n-types';
import { webSafeFonts } from '../../helpers/font';

// Types / Interfaces / Enums
import {
  DistanceUnit,
  type FreeDrawing,
  type Image,
  type LayoutFeature,
  LayoutFeatureType,
  type Line,
  type NorthArrow,
  type Rectangle,
  type ScaleBar, ScaleBarBehavior,
  ScaleBarStyle,
  type Text,
} from '../../global.d';
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';

/**
 * Update a single property of a layout feature in the layersDescriptionStore,
 * given its id and the path to the property.
 *
 * @param {string} layoutFeatureId - The id of the layout feature to update.
 * @param {string[]} props - The path to the property to update.
 * @param {string | number | number[] | boolean | undefined} value - The new value of the property.
 * @return {void}
 */
const updateLayoutFeatureProperty = (
  layoutFeatureId: string,
  props: string[],
  value: string | number | number[] | boolean | undefined,
) => {
  const allPropsExceptLast = props.slice(0, props.length - 1);
  const lastProp = props[props.length - 1];
  const args = [
    'layoutFeatures',
    (f: LayoutFeature) => f.id === layoutFeatureId,
    ...allPropsExceptLast,
    {
      [lastProp]: value,
    },
  ];
  setLayersDescriptionStore(...args);
};

function makeSettingsRectangle(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeatures
    .find((f) => f.id === layoutFeatureId) as Rectangle;
  return <>
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.Width() }
      value={ ft.width }
      onChange={(value) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['width'],
        value,
      )}
      min={10}
      max={1000}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.Height() }
      value={ ft.height }
      onChange={(value) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['height'],
        value,
      )}
      min={1}
      max={1000}
      step={1}
    />
    <InputFieldColor
      label={ LL().LayoutFeatures.Modal.FillColor() }
      value={ft.fillColor}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['fillColor'],
        newValue,
      )}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.FillOpacity() }
      value={ft.fillOpacity}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['fillOpacity'],
        newValue,
      )}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldColor
      label={ LL().LayoutFeatures.Modal.StrokeColor() }
      value={ft.strokeColor}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['strokeColor'],
        newValue,
      )}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.StrokeOpacity() }
      value={ft.strokeOpacity}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['strokeOpacity'],
        newValue,
      )}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.StrokeWidth() }
      value={ft.strokeWidth}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['strokeWidth'],
        newValue,
      )}
      min={0}
      max={100}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.RoundCorners() }
      value={ft.cornerRadius}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['cornerRadius'],
        newValue,
      )}
      min={0}
      max={100}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.Rotation() }
      value={ft.rotation}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['rotation'],
        newValue,
      )}
      min={-360}
      max={360}
      step={1}
    />
  </>;
}

function makeSettingsScaleBar(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeatures
    .find((f) => f.id === layoutFeatureId) as ScaleBar;
  return <>
    <InputFieldSelect
      label={ LL().LayoutFeatures.Modal.ScaleBarBehavior() }
      onChange={(value) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['behavior'],
        value,
      )}
      value={ft.behavior}
    >
      <option value={ScaleBarBehavior.absoluteSize}>
        { LL().LayoutFeatures.Modal.ScaleBarAbsoluteSize() }
      </option>
      <option value={ScaleBarBehavior.geographicSize}>
        { LL().LayoutFeatures.Modal.ScaleBarGeographicSize() }
      </option>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().LayoutFeatures.Modal.ScaleBarType() }
      onChange={(value) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['style'],
        value,
      )}
      value={ ft.style }
    >
      <For each={Object.keys(ScaleBarStyle)}>
        {
          (style) => <option value={style}>
            { LL().LayoutFeatures.Modal[style as keyof typeof ScaleBarStyle]() }
          </option>
        }
      </For>
    </InputFieldSelect>
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.Width() }
      value={ ft.width }
      onChange={(value) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['width'],
        value,
      )}
      min={10}
      max={1000}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.Height() }
      value={ ft.height }
      onChange={(value) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['height'],
        value,
      )}
      min={1}
      max={400}
      step={1}
    />
    <InputFieldSelect
      label={ LL().LayoutFeatures.Modal.Units() }
      onChange={(value) => {
        updateLayoutFeatureProperty(
          layoutFeatureId,
          ['unit'],
          value,
        );
        let label = '';
        if (value === DistanceUnit.m) {
          label = 'm';
        } else if (value === DistanceUnit.km) {
          label = 'km';
        } else if (value === DistanceUnit.mi) {
          label = 'mi';
        } else if (value === DistanceUnit.ft) {
          label = 'ft';
        } else if (value === DistanceUnit.yd) {
          label = 'yd';
        } else if (value === DistanceUnit.nmi) {
          label = 'nmi';
        }
        updateLayoutFeatureProperty(
          layoutFeatureId,
          ['label'],
          label,
        );
      }}
      value={ft.unit}
    >
      <For each={Object.keys(DistanceUnit)}>
        {
          (unit) => <option value={unit}>
            { LL().LayoutFeatures.Modal[unit as keyof typeof DistanceUnit]() }
          </option>
        }
      </For>
    </InputFieldSelect>
    <InputFieldText
      label={ LL().LayoutFeatures.Modal.UnitLabel() }
      onChange={(value) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['label'],
        value,
      )}
      value={ft.label}
    />
    <Show when={ft.style === ScaleBarStyle.blackAndWhiteBar}>
      <InputFieldText
        label={ LL().LayoutFeatures.Modal.TickValues() }
        onChange={(value) => {
          const ticks = value.split(',').map((v) => +v);
          if (ticks.some((t) => Number.isNaN(t))) {
            return;
          }
          updateLayoutFeatureProperty(
            layoutFeatureId,
            ['tickValues'],
            ticks,
          );
        }}
        value={ft.tickValues.join(', ')}
      />
    </Show>
  </>;
}

function makeSettingsText(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeatures
    .find((f) => f.id === layoutFeatureId) as Text;

  return <>
    <InputFieldTextarea
      label={LL().LayoutFeatures.Modal.TextContent()}
      value={ft.text}
      rows={ft.text.split('\n').length}
      onChange={(value) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['text'],
        value,
      )}
    />
    <div>
      <label
        class="label"
        style={{ 'margin-bottom': '0.5em' }}
      >
        {LL().LayoutFeatures.Modal.TextProperties()}
      </label>
    </div>
    <div
      class="is-flex is-justify-content-space-around mb-5"
      // style={{ 'margin-bottom': '1.5em !important' }}
    >
      <select
        class="select"
        value={ft.fontFamily}
        style={{ width: '100px' }}
        onChange={(e) => updateLayoutFeatureProperty(
          layoutFeatureId,
          ['fontFamily'],
          e.currentTarget.value,
        )}
      >
        <For each={webSafeFonts}>
          {(font) => <option value={font}>{font}</option>}
        </For>
      </select>
      <div>
        <input
          class="input"
          type="number"
          value={ft.fontSize}
          style={{ width: '70px' }}
          onChange={(e) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['fontSize'],
            +e.currentTarget.value,
          )}
        />
        <span
          style={{ 'vertical-align': 'sub', 'margin-left': '0.2em' }}
        >px</span>
      </div>
      <input
        class="input"
        type="color"
        value={ft.fontColor}
        style={{ width: '70px', padding: '0.2em' }}
        onChange={(e) => updateLayoutFeatureProperty(
          layoutFeatureId,
          ['fontColor'],
          e.currentTarget.value,
        )}
      />
    </div>
    <div>
      <label
        class="label"
        style={{ 'margin-bottom': '0.5em' }}
      >
        {LL().LayoutFeatures.Modal.TextAnchor()}
      </label>
    </div>
    <div class="mb-5 is-flex is-justify-content-space-evenly">
      <label>
        <input
          type="radio"
          name="radio-text-anchor"
          value="start"
          {...(ft.textAnchor === 'start' ? { checked: true } : {}) }
          onChange={(e) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['textAnchor'],
            e.currentTarget.value,
          )}
        />
        { LL().LayoutFeatures.Modal.Start() }
      </label>
      <label>
        <input
          type="radio"
          name="radio-text-anchor"
          value="middle"
          {...(ft.textAnchor === 'middle' ? { checked: true } : {}) }
          onChange={(e) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['textAnchor'],
            e.currentTarget.value,
          )}
        />
        { LL().LayoutFeatures.Modal.Middle() }
      </label>
      <label>
        <input
          type="radio"
          name="radio-text-anchor"
          value="end"
          {...(ft.textAnchor === 'end' ? { checked: true } : {}) }
          onChange={(e) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['textAnchor'],
            e.currentTarget.value,
          )}
        />
        { LL().LayoutFeatures.Modal.End() }
      </label>
    </div>
    <InputFieldNumber
      label={LL().LayoutFeatures.Modal.Rotation()}
      value={ft.rotation}
      onChange={(v) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['rotation'],
        v,
      )}
      min={0}
      max={360}
      step={1}
    />
  </>;
}

function makeSettingsLine(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeatures
    .find((f) => f.id === layoutFeatureId) as Line;

  return <>
    <InputFieldColor
      label={LL().LayoutFeatures.Modal.StrokeColor()}
      value={ft.strokeColor}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['strokeColor'],
        newValue,
      )}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.StrokeOpacity() }
      value={ft.strokeOpacity}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['strokeOpacity'],
        newValue,
      )}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.StrokeWidth() }
      value={ft.strokeWidth}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['strokeWidth'],
        newValue,
      )}
      min={0}
      max={100}
      step={1}
    />
    <InputFieldCheckbox
      label={'Display arrow'}
      checked={ft.arrow}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['arrow'],
        newValue,
      )}
    />
  {/* We also want to allow the line to be dashed */}
  <InputFieldCheckbox
    label={'Dashed line'}
    checked={!!ft.strokeDasharray}
    onChange={(newValue) => updateLayoutFeatureProperty(
      layoutFeatureId,
      ['strokeDasharray'],
      newValue ? '5 5' : undefined,
    )}
  />
  </>;
}

function makeSettingsImage(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeatures
    .find((f) => f.id === layoutFeatureId) as Image;

  return <>
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.Size() }
      value={ ft.size }
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['size'],
        newValue,
      )}
      min={1}
      max={400}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.Rotation() }
      value={ ft.rotation }
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['rotation'],
        newValue,
      )}
      min={0}
      max={360}
      step={1}
    />
    <Show when={ft.imageType === 'SVG'}>
      <InputFieldCheckbox
        label={ LL().LayoutFeatures.Modal.AllowModifyingFillStroke() }
        checked={ ft.allowModifyFillStroke === true }
        onChange={ (newValue) => {
          updateLayoutFeatureProperty(
            layoutFeatureId,
            ['allowModifyFillStroke'],
            newValue,
          );
          if (!newValue) {
            // We also want to reset the fill and stroke properties
            updateLayoutFeatureProperty(
              layoutFeatureId,
              ['fillColor'],
              undefined,
            );
            updateLayoutFeatureProperty(
              layoutFeatureId,
              ['strokeColor'],
              undefined,
            );
            updateLayoutFeatureProperty(
              layoutFeatureId,
              ['strokeWidth'],
              undefined,
            );
          }
        }}
      />
      <Show when={ ft.allowModifyFillStroke }>
        <InputFieldColor
          label={ LL().LayoutFeatures.Modal.FillColor() }
          value={ ft.fillColor }
          onChange={(newValue) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['fillColor'],
            newValue,
          )}
        />
        <InputFieldColor
          label={ LL().LayoutFeatures.Modal.StrokeColor() }
          value={ ft.strokeColor }
          onChange={(newValue) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['strokeColor'],
            newValue,
          )}
        />
        <InputFieldNumber
          label={ LL().LayoutFeatures.Modal.StrokeWidth()}
          value={ ft.strokeWidth }
          onChange={(newValue) => updateLayoutFeatureProperty(
            layoutFeatureId,
            ['strokeWidth'],
            newValue,
          )}
          min={0}
          max={10}
          step={0.1}
        />
      </Show>
    </Show>
  </>;
}

function makeSettingsNorthArrow(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeatures
    .find((f) => f.id === layoutFeatureId) as NorthArrow;

  return <>
    <InputFieldSelect
      label={LL().LayoutFeatures.Modal.NorthArrowType()}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['style'],
        newValue,
      )}
      value={ft.style}
    >
      <option value="simple">{LL().LayoutFeatures.Modal.SimpleNorthArrow()}</option>
      <option value="fancy">{LL().LayoutFeatures.Modal.FancyNorthArrow()}</option>
    </InputFieldSelect>
    <InputFieldNumber
      label={LL().LayoutFeatures.Modal.Size()}
      value={ ft.size }
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['size'],
        newValue,
      )}
      min={5}
      max={100}
      step={1}
    />
    <InputFieldCheckbox
      label={ LL().LayoutFeatures.Modal.RotateToNorth()}
      checked={ ft.autoRotate }
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['autoRotate'],
        newValue,
      )}
    />
    <Show when={ !ft.autoRotate }>
      <InputFieldNumber
        label={ LL().LayoutFeatures.Modal.Rotation()}
        value={ ft.rotation }
        onChange={(newValue) => updateLayoutFeatureProperty(
          layoutFeatureId,
          ['rotation'],
          newValue,
        )}
        min={0}
        max={360}
        step={1}
      />
    </Show>
  </>;
}

function makeSettingsFreeDrawing(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeatures
    .find((f) => f.id === layoutFeatureId) as FreeDrawing;
  return <>
    <InputFieldColor
      label={ LL().LayoutFeatures.Modal.StrokeColor() }
      value={ft.strokeColor}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['strokeColor'],
        newValue,
      )}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.StrokeOpacity() }
      value={ft.strokeOpacity}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['strokeOpacity'],
        newValue,
      )}
      min={0}
      max={1}
      step={0.1}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.StrokeWidth() }
      value={ft.strokeWidth}
      onChange={(newValue) => updateLayoutFeatureProperty(
        layoutFeatureId,
        ['strokeWidth'],
        newValue,
      )}
      min={0}
      max={100}
      step={1}
    />
  </>;
}

export default function LayoutFeatureSettings(
  props: {
    layoutFeatureId: string,
    LL: Accessor<TranslationFunctions>
  },
): JSX.Element {
  // We can use destructuring here because we know that the props
  // won't change during the lifetime of the component
  const {
    layoutFeatureId,
    LL,
  } = props; // eslint-disable-line solid/reactivity

  const layoutFeature = layersDescriptionStore.layoutFeatures
    .find((f) => f.id === layoutFeatureId);

  if (!layoutFeature) {
    // Due to the way this settings modal is triggered,
    // this should never happen...
    throw new Error('LayoutFeatureSettings: layoutFeature is undefined');
  }

  return <div class="layout-feature-settings">
    <div class="layout-features-settings__content">
      {
        ({
          [LayoutFeatureType.Line]: makeSettingsLine,
          [LayoutFeatureType.Rectangle]: makeSettingsRectangle,
          [LayoutFeatureType.ScaleBar]: makeSettingsScaleBar,
          [LayoutFeatureType.FreeDrawing]: makeSettingsFreeDrawing,
          [LayoutFeatureType.Text]: makeSettingsText,
          [LayoutFeatureType.NorthArrow]: makeSettingsNorthArrow,
          [LayoutFeatureType.Image]: makeSettingsImage,
        })[layoutFeature.type](layoutFeatureId, LL)
      }
    </div>
  </div>;
}
