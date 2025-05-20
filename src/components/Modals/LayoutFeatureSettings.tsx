// Imports from solid-js
import {
  type Accessor,
  For,
  type JSX,
  Show,
} from 'solid-js';

// Stores
import {
  layersDescriptionStore,
  setLayersDescriptionStoreBase,
} from '../../store/LayersDescriptionStore';
import { setMapStoreBase } from '../../store/MapStore';

// Subcomponents
import InputFieldCheckbox from '../Inputs/InputCheckbox.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldRadio from '../Inputs/InputRadio.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldText from '../Inputs/InputText.tsx';
import InputFieldTextarea from '../Inputs/InputTextarea.tsx';
import { InputFieldColorOpacity, InputFieldWidthColorOpacity } from '../Inputs/InputFieldColorOpacity.tsx';

// Helpers
import type { TranslationFunctions } from '../../i18n/i18n-types';
import { convertFromUnit, convertToUnit } from '../../helpers/distances';
import { webSafeFonts, fonts } from '../../helpers/font';

// Types / Interfaces / Enums
import {
  DistanceUnit,
  type FreeDrawing,
  type Image,
  type LayoutFeature,
  LayoutFeatureType,
  type Legend,
  type Line,
  type NorthArrow,
  type Rectangle,
  type ScaleBar,
  ScaleBarBehavior,
  ScaleBarMeasureLocation,
  ScaleBarStyle,
  type Text,
} from '../../global.d';

/**
 * Update a single property of a layout feature in the layersDescriptionStore,
 * given its id and the path to the property, bypassing the undo/redo mechanism.
 *
 * @param {string} layoutFeatureId - The id of the layout feature to update.
 * @param {string[]} props - The path to the property to update.
 * @param {string | number | number[] | boolean
 * | undefined | { color: string, width: number }} value - The new value of the property.
 * @return {void}
 */
const updateLayoutFeaturePropertyBase = (
  layoutFeatureId: string,
  props: string[],
  value: string | number | number[] | boolean | undefined | { color: string, width: number },
): void => {
  const allPropsExceptLast = props.slice(0, props.length - 1);
  const lastProp = props[props.length - 1];
  const args = [
    'layoutFeaturesAndLegends',
    (f: LayoutFeature | Legend) => f.id === layoutFeatureId,
    ...allPropsExceptLast,
    {
      [lastProp]: value,
    },
  ];
  setLayersDescriptionStoreBase(...args);
};

function makeSettingsRectangle(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeaturesAndLegends
    .find((f) => f.id === layoutFeatureId) as Rectangle;
  return <>
    <InputFieldColorOpacity
      label={LL().LayoutFeatures.Modal.Fill()}
      valueColor={ft.fillColor}
      valueOpacity={ft.fillOpacity}
      onChangeColor={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['fillColor'],
        newValue,
      )}
      onChangeOpacity={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['fillOpacity'],
        newValue,
      )}
    />
    <InputFieldWidthColorOpacity
      label={LL().LayoutFeatures.Modal.Stroke()}
      valueWidth={ft.strokeWidth}
      valueColor={ft.strokeColor}
      valueOpacity={ft.strokeOpacity}
      onChangeWidth={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['strokeWidth'],
        newValue,
      )}
      onChangeColor={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['strokeColor'],
        newValue,
      )}
      onChangeOpacity={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['strokeOpacity'],
        newValue,
      )}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.Width() }
      value={ ft.width }
      onChange={(value) => updateLayoutFeaturePropertyBase(
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
      onChange={(value) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['height'],
        value,
      )}
      min={1}
      max={1000}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.RoundCorners() }
      value={ft.cornerRadius}
      onChange={(newValue) => updateLayoutFeaturePropertyBase(
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
      onChange={(newValue) => updateLayoutFeaturePropertyBase(
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
  const ft = layersDescriptionStore.layoutFeaturesAndLegends
    .find((f) => f.id === layoutFeatureId) as ScaleBar;
  return <>
    <InputFieldSelect
      label={LL().LayoutFeatures.Modal.ScaleBarBehavior()}
      onChange={(value) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['behavior'],
        value,
      )}
      value={ft.behavior}
      width={'250px'}
    >
      <option value={ScaleBarBehavior.absoluteSize}>
        {LL().LayoutFeatures.Modal.ScaleBarAbsoluteSize()}
      </option>
      <option value={ScaleBarBehavior.geographicSize}>
        {LL().LayoutFeatures.Modal.ScaleBarGeographicSize()}
      </option>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().LayoutFeatures.Modal.ScaleBarMeasureLocation()}
      onChange={(value) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['measureLocation'],
        value,
      )}
      value={ft.measureLocation}
      width={'250px'}
    >
      <option value={ScaleBarMeasureLocation.underScaleBar}>
        {LL().LayoutFeatures.Modal.ScaleBarMeasureLocationUnderScaleBar()}
      </option>
      <option value={ScaleBarMeasureLocation.centerMap}>
        {LL().LayoutFeatures.Modal.ScaleBarMeasureLocationCenterMap()}
      </option>
    </InputFieldSelect>
    <InputFieldSelect
      label={LL().LayoutFeatures.Modal.ScaleBarType()}
      onChange={(value) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['style'],
        value,
      )}
      value={ft.style}
      width={'250px'}
    >
      <For each={Object.keys(ScaleBarStyle).filter((d) => d !== 'blackAndWhiteBar')}>
        {
          (style) => <option value={style}>
            {LL().LayoutFeatures.Modal[style as keyof typeof ScaleBarStyle]()}
          </option>
        }
      </For>
    </InputFieldSelect>
    <Show when={ft.style !== ScaleBarStyle.simpleLine}>
      <InputFieldNumber
        label={LL().LayoutFeatures.Modal.Height()}
        value={ft.height}
        onChange={(value) => updateLayoutFeaturePropertyBase(
          layoutFeatureId,
          ['height'],
          value,
        )}
        min={1}
        max={400}
        step={1}
      />
    </Show>
    <Show when={ft.behavior === 'absoluteSize'}>
      <InputFieldNumber
        label={LL().LayoutFeatures.Modal.Width()}
        value={ft.width}
        onChange={(value) => updateLayoutFeaturePropertyBase(
          layoutFeatureId,
          ['width'],
          value,
        )}
        min={10}
        max={1000}
        step={1}
      />
    </Show>
    <Show when={ft.behavior === 'geographicSize'}>
      <InputFieldNumber
        label={LL().LayoutFeatures.Modal.Distance()}
        value={convertToUnit(ft.distance, ft.unit)}
        onChange={(value) => updateLayoutFeaturePropertyBase(
          layoutFeatureId,
          ['distance'],
          convertFromUnit(value, ft.unit),
        )}
        min={1}
        max={100000}
        step={1}
      />
    </Show>
    <InputFieldSelect
      label={LL().LayoutFeatures.Modal.Units()}
      onChange={(value) => {
        updateLayoutFeaturePropertyBase(
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
        updateLayoutFeaturePropertyBase(
          layoutFeatureId,
          ['label', 'text'],
          label,
        );
      }}
      value={ft.unit}
    >
      <For each={Object.keys(DistanceUnit)}>
        {
          (unit) => <option value={unit}>
            {LL().LayoutFeatures.Modal[unit as keyof typeof DistanceUnit]()}
          </option>
        }
      </For>
    </InputFieldSelect>
    <InputFieldText
      label={LL().LayoutFeatures.Modal.UnitLabel()}
      onChange={(value) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['label', 'text'],
        value,
      )}
      value={ft.label.text}
      width={200}
    />
    <Show when={ft.style === ScaleBarStyle.blackAndWhiteBar}>
      <InputFieldText
        label={LL().LayoutFeatures.Modal.TickValues()}
        onChange={(value) => {
          const ticks = value.split(',').map((v) => +v);
          if (ticks.some((t) => Number.isNaN(t))) {
            return;
          }
          updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['tickValues'],
            ticks,
          );
        }}
        value={ft.tickValues.join(', ')}
      />
    </Show>
    <InputFieldRadio
      label={LL().LayoutFeatures.Modal.LabelPosition()}
      values={[
        { value: 'top', label: LL().LayoutFeatures.Modal.Top() },
        { value: 'bottom', label: LL().LayoutFeatures.Modal.Bottom() },
      ]}
      value={ft.labelPosition}
      onChange={(value) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['labelPosition'],
        value,
      )}
    />
    <div>
      <label
        class="label"
        style={{ 'margin-bottom': '0.5em' }}
      >
        {LL().LayoutFeatures.Modal.FontProperties()}
      </label>
    </div>
    <div class="is-flex is-justify-content-space-around mb-5 pr-3 pl-3">
      <div class="select">
        <select
          class="select"
          value={ft.label.fontFamily}
          style={{ width: '120px' }}
          onChange={(e) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['label', 'fontFamily'],
            e.currentTarget.value,
          )}
        >
          <option disabled>{LL().Fonts.FontFamilyTypes()}</option>
          <For each={webSafeFonts}>
            {(font) => <option value={font}>{font}</option>}
          </For>
          <option disabled>{LL().Fonts.Fonts()}</option>
          <For each={fonts}>
            {(font) => <option value={font}>{font}</option>}
          </For>
        </select>
      </div>
      <div>
        <input
          class="input"
          type="number"
          value={ft.label.fontSize}
          style={{ width: '70px' }}
          onChange={(e) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['label', 'fontSize'],
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
        value={ft.label.fontColor}
        style={{ width: '70px', padding: '0.2em' }}
        onChange={(e) => updateLayoutFeaturePropertyBase(
          layoutFeatureId,
          ['label', 'fontColor'],
          e.currentTarget.value,
        )}
      />
      <div class="buttons">
        <button
          classList={{
            button: true,
            'is-warning': ft.label.fontWeight === 'bold',
            'is-outlined': ft.label.fontWeight === 'bold',
          }}
          aria-label={LL().LayoutFeatures.Modal.Bold()}
          title={LL().LayoutFeatures.Modal.Bold()}
          onClick={() => {
            updateLayoutFeaturePropertyBase(
              layoutFeatureId,
              ['label', 'fontWeight'],
              ft.label.fontWeight === 'bold' ? 'normal' : 'bold',
            );
          }}
        ><b>B</b></button>
        <button
          classList={{
            button: true,
            'is-warning': ft.label.fontStyle === 'italic',
            'is-outlined': ft.label.fontStyle === 'italic',
          }}
          aria-label={LL().LayoutFeatures.Modal.Italic()}
          title={LL().LayoutFeatures.Modal.Italic()}
          onClick={() => {
            updateLayoutFeaturePropertyBase(
              layoutFeatureId,
              ['label', 'fontStyle'],
              ft.label.fontStyle === 'italic' ? 'normal' : 'italic',
            );
          }}
        ><i>I</i>
        </button>
      </div>
    </div>
  </>;
}

function makeSettingsText(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeaturesAndLegends
    .find((f) => f.id === layoutFeatureId) as Text;

  const isMapSource = layoutFeatureId === 'LayoutFeature-source';
  const isMapTitle = layoutFeatureId === 'LayoutFeature-title';

  return <>
    <InputFieldTextarea
      label={LL().LayoutFeatures.Modal.TextContent()}
      value={ft.text}
      rows={ft.text.split('\n').length}
      bindKeyUpAsChange={true}
      onChange={(value) => {
        updateLayoutFeaturePropertyBase(
          layoutFeatureId,
          ['text'],
          value,
        );
        if (isMapSource) {
          setMapStoreBase('mapAnnotations', 'source', value);
        } else if (isMapTitle) {
          setMapStoreBase('mapAnnotations', 'title', value);
        }
      }}
    />
    <div>
      <label
        class="label"
        style={{ 'margin-bottom': '0.5em' }}
      >
        {LL().LayoutFeatures.Modal.FontProperties()}
      </label>
    </div>
    <div class="is-flex is-justify-content-space-around mb-5 pr-3 pl-3">
      <div class="select">
        <select
          class="select"
          value={ft.fontFamily}
          style={{ width: '100px' }}
          onChange={(e) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['fontFamily'],
            e.currentTarget.value,
          )}
        >
          <option disabled>{LL().Fonts.FontFamilyTypes()}</option>
          <For each={webSafeFonts}>
            {(font) => <option value={font}>{font}</option>}
          </For>
          <option disabled>{LL().Fonts.Fonts()}</option>
          <For each={fonts}>
            {(font) => <option value={font}>{font}</option>}
          </For>
        </select>
      </div>
      <div>
        <input
          class="input"
          type="number"
          value={ft.fontSize}
          style={{ width: '70px' }}
          onChange={(e) => updateLayoutFeaturePropertyBase(
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
        onChange={(e) => updateLayoutFeaturePropertyBase(
          layoutFeatureId,
          ['fontColor'],
          e.currentTarget.value,
        )}
      />
    </div>
    <div class="is-flex is-justify-content-center mb-6">
      <div class="buttons">
        <button
          classList={{
            button: true,
            'is-warning': ft.fontWeight === 'bold',
            'is-outlined': ft.fontWeight === 'bold',
          }}
          aria-label={LL().LayoutFeatures.Modal.Bold()}
          title={LL().LayoutFeatures.Modal.Bold()}
          onClick={() => {
            updateLayoutFeaturePropertyBase(
              layoutFeatureId,
              ['fontWeight'],
              ft.fontWeight === 'bold' ? 'normal' : 'bold',
            );
          }}
        ><b>B</b></button>
        <button
          classList={{
            button: true,
            'is-warning': ft.fontStyle === 'italic',
            'is-outlined': ft.fontStyle === 'italic',
          }}
          aria-label={LL().LayoutFeatures.Modal.Italic()}
          title={LL().LayoutFeatures.Modal.Italic()}
          onClick={() => {
            updateLayoutFeaturePropertyBase(
              layoutFeatureId,
              ['fontStyle'],
              ft.fontStyle === 'italic' ? 'normal' : 'italic',
            );
          }}
        ><i>I</i>
        </button>
        <button
          classList={{
            button: true,
            'is-warning': ft.textDecoration === 'underline',
            'is-outlined': ft.textDecoration === 'underline',
          }}
          aria-label={LL().LayoutFeatures.Modal.Underline()}
          title={LL().LayoutFeatures.Modal.Underline()}
          onClick={() => {
            updateLayoutFeaturePropertyBase(
              layoutFeatureId,
              ['textDecoration'],
              ft.textDecoration === 'underline' ? 'none' : 'underline',
            );
          }}
        ><u>U</u></button>
        <button
          classList={{
            button: true,
            'is-warning': ft.textDecoration === 'line-through',
            'is-outlined': ft.textDecoration === 'line-through',
          }}
          aria-label={LL().LayoutFeatures.Modal.LineThrough()}
          title={LL().LayoutFeatures.Modal.LineThrough()}
          onClick={() => {
            updateLayoutFeaturePropertyBase(
              layoutFeatureId,
              ['textDecoration'],
              ft.textDecoration === 'line-through' ? 'none' : 'line-through',
            );
          }}
        ><span style={{ 'text-decoration': 'line-through' }}>B</span>
        </button>
      </div>
    </div>
    <div class="mb-5 is-flex is-justify-content-space-between">
      <label class="label mr-6">
        {LL().LayoutFeatures.Modal.TextAnchor()}
      </label>
      <label>
        <input
          type="radio"
          name="radio-text-anchor"
          value="start"
          {...(ft.textAnchor === 'start' ? { checked: true } : {})}
          onChange={(e) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['textAnchor'],
            e.currentTarget.value,
          )}
        />
        {LL().LayoutFeatures.Modal.Start()}
      </label>
      <label>
        <input
          type="radio"
          name="radio-text-anchor"
          value="middle"
          {...(ft.textAnchor === 'middle' ? { checked: true } : {})}
          onChange={(e) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['textAnchor'],
            e.currentTarget.value,
          )}
        />
        {LL().LayoutFeatures.Modal.Middle()}
      </label>
      <label>
        <input
          type="radio"
          name="radio-text-anchor"
          value="end"
          {...(ft.textAnchor === 'end' ? { checked: true } : {})}
          onChange={(e) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['textAnchor'],
            e.currentTarget.value,
          )}
        />
        {LL().LayoutFeatures.Modal.End()}
      </label>
    </div>
    <InputFieldNumber
      label={LL().LayoutFeatures.Modal.Rotation()}
      value={ft.rotation}
      onChange={(v) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['rotation'],
        v % 360,
      )}
      min={0}
      max={360}
      step={1}
    />
    <InputFieldCheckbox
      label={LL().LayoutFeatures.Modal.BufferAroundText()}
      checked={!!ft.halo}
      onChange={(v) => {
        if (v) {
          updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['halo'],
            {
              color: '#ffffff',
              width: 1,
            },
          );
        } else {
          updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['halo'],
            undefined,
          );
        }
      }}
    />
    <Show when={ft.halo !== undefined}>
      <InputFieldColor
        label={ LL().LayerSettings.BufferColor() }
        value={ft.halo!.color}
        onChange={(v) => {
          const haloProps = {
            color: v,
            width: ft.halo!.width,
          };
          updateLayoutFeaturePropertyBase(layoutFeatureId, ['halo'], haloProps);
        }}
      />
      <InputFieldNumber
        label={ LL().LayerSettings.BufferWidth() }
        value={ft.halo!.width}
        onChange={
          (v) => {
            const haloProps = {
              color: ft.halo!.color,
              width: v,
            };
            updateLayoutFeaturePropertyBase(layoutFeatureId, ['halo'], haloProps);
          }
        }
        min={0}
        max={10}
        step={1}
      />
    </Show>
  </>;
}

function makeSettingsLine(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeaturesAndLegends
    .find((f) => f.id === layoutFeatureId) as Line;

  return <>
    <InputFieldWidthColorOpacity
      label={LL().LayoutFeatures.Modal.Line()}
      valueWidth={ft.strokeWidth}
      valueColor={ft.strokeColor}
      valueOpacity={ft.strokeOpacity}
      onChangeWidth={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['strokeWidth'],
        newValue,
      )}
      onChangeColor={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['strokeColor'],
        newValue,
      )}
      onChangeOpacity={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['strokeOpacity'],
        newValue,
      )}
    />
    <InputFieldCheckbox
      label={LL().LayoutFeatures.Modal.DisplayArrowHead()}
      checked={ft.arrow}
      onChange={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['arrow'],
        newValue,
      )}
    />
  {/* We also want to allow the line to be dashed */}
  <InputFieldCheckbox
    label={LL().LayoutFeatures.Modal.DashedLine()}
    checked={!!ft.strokeDasharray}
    onChange={(newValue) => updateLayoutFeaturePropertyBase(
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
  const ft = layersDescriptionStore.layoutFeaturesAndLegends
    .find((f) => f.id === layoutFeatureId) as Image;

  return <>
    <InputFieldNumber
      label={ LL().LayoutFeatures.Modal.Size() }
      value={ ft.size }
      onChange={(newValue) => updateLayoutFeaturePropertyBase(
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
      onChange={(newValue) => updateLayoutFeaturePropertyBase(
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
          updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['allowModifyFillStroke'],
            newValue,
          );
          if (!newValue) {
            // We also want to reset the fill and stroke properties
            updateLayoutFeaturePropertyBase(
              layoutFeatureId,
              ['fillColor'],
              undefined,
            );
            updateLayoutFeaturePropertyBase(
              layoutFeatureId,
              ['strokeColor'],
              undefined,
            );
            updateLayoutFeaturePropertyBase(
              layoutFeatureId,
              ['strokeWidth'],
              undefined,
            );
          }
        }}
      />
      <Show when={ ft.allowModifyFillStroke }>
        <InputFieldColorOpacity
          label={LL().LayoutFeatures.Modal.Fill()}
          valueColor={ft.fillColor || '#ffffff'}
          valueOpacity={ft.fillOpacity || 1}
          onChangeColor={(newValue) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['fillColor'],
            newValue,
          )}
          onChangeOpacity={(newValue) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['fillOpacity'],
            newValue,
          )}
        />
        <InputFieldWidthColorOpacity
          label={LL().LayoutFeatures.Modal.Line()}
          valueWidth={ft.strokeWidth || 1}
          valueColor={ft.strokeColor || '#000000'}
          valueOpacity={ft.strokeOpacity || 1}
          onChangeWidth={(newValue) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['strokeWidth'],
            newValue,
          )}
          onChangeColor={(newValue) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['strokeColor'],
            newValue,
          )}
          onChangeOpacity={(newValue) => updateLayoutFeaturePropertyBase(
            layoutFeatureId,
            ['strokeOpacity'],
            newValue,
          )}
        />
      </Show>
    </Show>
  </>;
}

function makeSettingsNorthArrow(
  layoutFeatureId: string,
  LL: Accessor<TranslationFunctions>,
): JSX.Element {
  const ft = layersDescriptionStore.layoutFeaturesAndLegends
    .find((f) => f.id === layoutFeatureId) as NorthArrow;

  return <>
    <InputFieldSelect
      label={LL().LayoutFeatures.Modal.NorthArrowType()}
      onChange={(newValue) => updateLayoutFeaturePropertyBase(
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
      onChange={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['size'],
        newValue,
      )}
      min={5}
      max={100}
      step={1}
    />
    <Show when={ ft.style === 'simple' }>
      <InputFieldColor
        label={LL().LayoutFeatures.Modal.Fill()}
        value={ft.fillColor}
        onChange={(newValue) => updateLayoutFeaturePropertyBase(
          layoutFeatureId,
          ['fillColor'],
          newValue,
        )}
      />
    </Show>
    <InputFieldCheckbox
      label={ LL().LayoutFeatures.Modal.RotateToNorth()}
      checked={ ft.autoRotate }
      onChange={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['autoRotate'],
        newValue,
      )}
    />
    <Show when={ !ft.autoRotate }>
      <InputFieldNumber
        label={ LL().LayoutFeatures.Modal.Rotation()}
        value={ ft.rotation }
        onChange={(newValue) => updateLayoutFeaturePropertyBase(
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
  const ft = layersDescriptionStore.layoutFeaturesAndLegends
    .find((f) => f.id === layoutFeatureId) as FreeDrawing;
  return <>
    <InputFieldWidthColorOpacity
      label={LL().LayoutFeatures.Modal.Line()}
      valueWidth={ft.strokeWidth}
      valueColor={ft.strokeColor}
      valueOpacity={ft.strokeOpacity}
      onChangeWidth={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['strokeWidth'],
        newValue,
      )}
      onChangeColor={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['strokeColor'],
        newValue,
      )}
      onChangeOpacity={(newValue) => updateLayoutFeaturePropertyBase(
        layoutFeatureId,
        ['strokeOpacity'],
        newValue,
      )}
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

  const layoutFeature = layersDescriptionStore.layoutFeaturesAndLegends
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
        })[layoutFeature.type as LayoutFeatureType](layoutFeatureId, LL)
      }
    </div>
  </div>;
}
