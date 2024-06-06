import { type JSX, mergeProps } from 'solid-js';
import { type LocalizedString } from 'typesafe-i18n';
import { useI18nContext } from '../../i18n/i18n-solid';
import * as PaletteThumbnails from '../../helpers/palette-thumbnail';

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
  valuePalette: { provider: string, name: string, type: 'sequential' | 'categorical' | 'diverging' };
  valueOpacity: number;
  onClickPalette: (e: Event) => void;
  onChangeOpacity: (opacity: number) => void;
  width?: number;
  disabled?: boolean;
  gap?: number;
}

const getUrlImagePalette = (
  d: { name: string, provider: string, type: 'sequential' | 'diverging' | 'categorical' },
) => { // eslint-disable-line consistent-return
  if (PaletteThumbnails[`img${d.provider}${d.name}`]) {
    return PaletteThumbnails[`img${d.provider}${d.name}`];
  }
  if (d.type === 'sequential') {
    return PaletteThumbnails.imgcolorbrewerOrRd;
  }
  if (d.type === 'categorical') {
    return PaletteThumbnails.imgd3Observable10;
  }
  if (d.type === 'diverging') {
    return PaletteThumbnails.imgcolorbrewerRdYlGn;
  }
};

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
          title={LL().LayerSettings.InformationPalette()}
        >
          <img
            src={getUrlImagePalette(mergedProps.valuePalette)}
            alt={`${mergedProps.valuePalette.name} (${mergedProps.valuePalette.provider})`}
            style={{
              height: '1em',
              width: '100%',
            }}
          />
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
  valuePalette: { provider: string, name: string, type: 'sequential' | 'categorical' | 'diverging' };
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
        >
          <img
            src={getUrlImagePalette(mergedProps.valuePalette)}
            alt={`${mergedProps.valuePalette.name} (${mergedProps.valuePalette.provider})`}
          />
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
