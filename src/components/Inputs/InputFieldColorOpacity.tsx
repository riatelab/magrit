import { type JSX, mergeProps } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldColorOpacityProps {
  label: LocalizedString | string;
  valueColor: string;
  valueOpacity: number;
  onChangeColor: (color: string) => void;
  onChangeOpacity: (opacity: number) => void;
  width?: number;
  disabled?: boolean;
  gap?: number;
}

export function InputFieldColorOpacity(props: InputFieldColorOpacityProps): JSX.Element {
  const mergedProps = mergeProps({ width: 200, gap: 5 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div>
      <div class="control is-flex">
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>Color</div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>Opacity</div>
      </div>
      <div class="control is-flex">
        <input
          type="color"
          class="input"
          onChange={(e) => {
            mergedProps.onChangeColor(e.currentTarget.value);
          }}
          value={mergedProps.valueColor}
          style={{
            width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
            height: '1.75em',
          }}
          disabled={mergedProps.disabled}
        />
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <input
          class="input"
          type="number"
          onChange={(e) => {
            if (+e.currentTarget.value < +e.currentTarget.min) {
              e.currentTarget.value = e.currentTarget.min;
            }
            if (+e.currentTarget.value > +e.currentTarget.max) {
              e.currentTarget.value = e.currentTarget.max;
            }
            mergedProps.onChangeOpacity(+e.currentTarget.value);
          }}
          value={mergedProps.valueOpacity}
          min={0}
          max={1}
          step={0.1}
          style={{
            width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
            height: '1.75em',
          }}
          disabled={mergedProps.disabled}
        />
      </div>
    </div>
  </div>;
}

interface InputFieldWidthColorOpacityProps {
  label: LocalizedString | string;
  valueWidth: number;
  valueColor: string;
  valueOpacity: number;
  onChangeWidth: (width: number) => void;
  onChangeColor: (color: string) => void;
  onChangeOpacity: (opacity: number) => void;
  width?: number;
  disabled?: boolean;
  gap?: number;
}

export function InputFieldWidthColorOpacity(props: InputFieldWidthColorOpacityProps): JSX.Element {
  const mergedProps = mergeProps({ width: 200, gap: 5 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div>
      <div class="control is-flex">
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>Width (px)
        </div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>Color
        </div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>Opacity
        </div>
      </div>
      <div class="control is-flex">
        <input
          class="input"
          type="number"
          onChange={(e) => {
            if (+e.currentTarget.value < +e.currentTarget.min) {
              e.currentTarget.value = e.currentTarget.min;
            }
            if (+e.currentTarget.value > +e.currentTarget.max) {
              e.currentTarget.value = e.currentTarget.max;
            }
            mergedProps.onChangeWidth(+e.currentTarget.value);
          }}
          value={mergedProps.valueWidth}
          min={0}
          max={1}
          step={0.1}
          style={{
            width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
            height: '1.75em',
          }}
          disabled={mergedProps.disabled}
        />
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <input
          type="color"
          class="input"
          onChange={(e) => {
            mergedProps.onChangeColor(e.currentTarget.value);
          }}
          value={mergedProps.valueColor}
          style={{
            width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
            height: '1.75em',
          }}
          disabled={mergedProps.disabled}
        />
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <input
          class="input"
          type="number"
          onChange={(e) => {
            if (+e.currentTarget.value < +e.currentTarget.min) {
              e.currentTarget.value = e.currentTarget.min;
            }
            if (+e.currentTarget.value > +e.currentTarget.max) {
              e.currentTarget.value = e.currentTarget.max;
            }
            mergedProps.onChangeOpacity(+e.currentTarget.value);
          }}
          value={mergedProps.valueOpacity}
          min={0}
          max={1}
          step={0.1}
          style={{
            width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
            height: '1.75em',
          }}
          disabled={mergedProps.disabled}
        />
      </div>
    </div>
  </div>;
}

interface InputFieldPaletteOpacityProps {
  label: LocalizedString | string;
  valuePalette: string;
  valueOpacity: number;
  // onChangeColor: (color: string) => void;
  onChangeOpacity: (opacity: number) => void;
  width?: number;
  disabled?: boolean;
  gap?: number;
}

export function InputFieldPaletteOpacity(props: InputFieldPaletteOpacityProps): JSX.Element {
  const mergedProps = mergeProps({ width: 200, gap: 5 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div>
      <div class="control is-flex">
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>Color</div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>Opacity</div>
      </div>
      <div class="control is-flex">
        <div
          class="input"
          style={{
            width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
            height: '1.75em',
          }}
        />
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <input
          class="input"
          type="number"
          onChange={(e) => {
            if (+e.currentTarget.value < +e.currentTarget.min) {
              e.currentTarget.value = e.currentTarget.min;
            }
            if (+e.currentTarget.value > +e.currentTarget.max) {
              e.currentTarget.value = e.currentTarget.max;
            }
            mergedProps.onChangeOpacity(+e.currentTarget.value);
          }}
          value={mergedProps.valueOpacity}
          min={0}
          max={1}
          step={0.1}
          style={{
            width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
            height: '1.75em',
          }}
          disabled={mergedProps.disabled}
        />
      </div>
    </div>
  </div>;
}
