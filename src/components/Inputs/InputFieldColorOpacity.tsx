import { For, type JSX, mergeProps } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';
import { useI18nContext } from '../../i18n/i18n-solid';

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
  const { LL } = useI18nContext();
  const mergedProps = mergeProps({ width: 200, gap: 5 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div>
      <div class="control is-flex">
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Color()}</div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Opacity()}</div>
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
            padding: 0,
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
  const { LL } = useI18nContext();
  const mergedProps = mergeProps({ width: 200, gap: 5 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div>
      <div class="control is-flex">
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Width()}
        </div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Color()}
        </div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Opacity()}
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
          max={100}
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
            padding: 0,
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
  valuePalette: string[];
  valueOpacity: number;
  onClickPalette: (e: Event) => void;
  onChangeOpacity: (opacity: number) => void;
  width?: number;
  disabled?: boolean;
  gap?: number;
}

export function InputFieldPaletteOpacity(props: InputFieldPaletteOpacityProps): JSX.Element {
  const { LL } = useI18nContext();
  const mergedProps = mergeProps({ width: 200, gap: 5 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div>
      <div class="control is-flex">
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Palette()}</div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Opacity()}</div>
      </div>
      <div class="control is-flex">
        <div
          class="input is-clickable"
          style={{
            width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
            height: '1.75em',
          }}
          onClick={(e) => mergedProps.onClickPalette(e)}
          // title={LL().LayerSettings.InformationPalette()}
        >
          <For each={mergedProps.valuePalette}>
            {
              (color) => (
                <div
                  style={{
                    width: `${100 / mergedProps.valuePalette.length}%`,
                    height: '100%',
                    background: color,
                  }}
                ></div>
              )
            }
          </For>
        </div>
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

interface InputFieldWidthPaletteOpacityProps {
  label: LocalizedString | string;
  valueWidth: number;
  valuePalette: string[];
  valueOpacity: number;
  onChangeWidth: (width: number) => void;
  onClickPalette: (e: Event) => void;
  onChangeOpacity: (opacity: number) => void;
  width?: number;
  disabled?: boolean;
  gap?: number;
}

export function InputFieldWidthPaletteOpacity(
  props: InputFieldWidthPaletteOpacityProps,
): JSX.Element {
  const { LL } = useI18nContext();
  const mergedProps = mergeProps({ width: 200, gap: 5 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div>
      <div class="control is-flex">
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Width()}
        </div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Palette()}
        </div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Opacity()}
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
          max={100}
          step={0.1}
          style={{
            width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
            height: '1.75em',
          }}
          disabled={mergedProps.disabled}
        />
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div
          class="input is-clickable"
          style={{
            width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
            height: '1.75em',
          }}
          onClick={(e) => mergedProps.onClickPalette(e)}
          // title={LL().LayerSettings.InformationPalette()}
        >
          <For each={mergedProps.valuePalette}>
            {
              (color) => (
                <div
                  style={{
                    width: `${100 / mergedProps.valuePalette.length}%`,
                    height: '100%',
                    background: color,
                  }}
                ></div>
              )
            }
          </For>
        </div>
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

interface InputFieldColorWidthProps {
  label: LocalizedString | string;
  valueColor: string;
  valueWidth: number;
  onChangeColor: (color: string) => void;
  onChangeWidth: (width: number) => void;
  width?: number;
  disabled?: boolean;
  gap?: number;
}

export function InputFieldColorWidth(props: InputFieldColorWidthProps): JSX.Element {
  const { LL } = useI18nContext();
  const mergedProps = mergeProps({ width: 200, gap: 5 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div>
      <div class="control is-flex">
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Color()}</div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 2) - mergedProps.gap / 2}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Width()}</div>
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
            padding: 0,
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
            mergedProps.onChangeWidth(+e.currentTarget.value);
          }}
          value={mergedProps.valueWidth}
          min={0}
          max={10}
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

interface InputFieldColorWidthHeightProps {
  label: LocalizedString | string;
  valueColor: string;
  valueWidth: number;
  valueHeight: number;
  onChangeColor: (color: string) => void;
  onChangeWidth: (width: number) => void;
  onChangeHeight: (height: number) => void;
  width?: number;
  disabled?: boolean;
  gap?: number;
}

export function InputFieldColorWidthHeight(props: InputFieldColorWidthHeightProps): JSX.Element {
  const { LL } = useI18nContext();
  const mergedProps = mergeProps({ width: 200, gap: 5 }, props);
  return <div class="field">
    <label class="label">{mergedProps.label}</label>
    <div>
      <div class="control is-flex">
        <div style={{
          width: `${(mergedProps.width / 3) - mergedProps.gap / 3}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Color()}</div>
        <div style={{ width: `${mergedProps.gap}px` }}></div>
        <div style={{
          width: `${(mergedProps.width / 3) - mergedProps.gap / 3}px`,
          'text-align': 'center',
          'font-size': '0.9em',
        }}>{LL().LayerSettings.Width()}</div>
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
            padding: 0,
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
            mergedProps.onChangeWidth(+e.currentTarget.value);
          }}
          value={mergedProps.valueWidth}
          min={0}
          max={10}
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