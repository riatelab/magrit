// Imports from solid-js
import { type Accessor, For, type JSX } from 'solid-js';

// Helpers
import { type TranslationFunctions } from '../../i18n/i18n-types';
import { fonts, webSafeFonts } from '../../helpers/font';

// Stores
import { applicationSettingsStore, setApplicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Sub-components
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';

// This is a modified version of the option table present in LegendSettings.tsx
function TextOptionTable(
  props: {
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  const textProperties = ['title', 'subtitle', 'labels', 'note'];
  return <table class="table-font-properties" style={{ 'text-align': 'center', margin: 'auto' }}>
    <thead>
    <tr>
      <th></th>
      <For each={textProperties}>
        {(textElement) => <th>
          {props.LL().Legend.Modal[`${textElement}TextElement`]()}
        </th>}
      </For>
    </tr>
    </thead>
    <tbody>
    <tr>
      <td>{ props.LL().CommonTextElement.FontSize() }</td>
      <For each={textProperties}>
        {(textElement) => <td>
          <div class="control">
            <input
              class="input"
              type="number"
              value={ applicationSettingsStore.defaultLegendSettings[textElement].fontSize }
              min={0}
              max={100}
              step={1}
              style={{ width: '6em' }}
              onChange={
                (ev) => {
                  const value = parseInt(ev.target.value, 10);
                  setApplicationSettingsStore(
                    'defaultLegendSettings',
                    textElement as 'title' | 'subtitle' | 'labels' | 'note',
                    'fontSize',
                    value,
                  );
                }
              }
            />
          </div>
        </td>}
      </For>
    </tr>
    <tr>
      <td>{ props.LL().CommonTextElement.FontColor() }</td>
      <For each={textProperties}>
        {(textElement) => <td>
          <input
            class="input"
            type="color"
            style={{ height: '1.75em', padding: '0.05em', width: '5em' }}
            value={ applicationSettingsStore.defaultLegendSettings[textElement].fontColor }
            onChange={
              (ev) => {
                setApplicationSettingsStore(
                  'defaultLegendSettings',
                  textElement as 'title' | 'subtitle' | 'labels' | 'note',
                  'fontColor',
                  ev.target.value,
                );
              }
            }
          />
        </td>}
      </For>
    </tr>
    <tr>
      <td>{ props.LL().CommonTextElement.FontStyle() }</td>
      <For each={textProperties}>
        {(textElement) => <td>
          <select
            value={ applicationSettingsStore.defaultLegendSettings[textElement].fontStyle }
            onChange={
              (ev) => {
                setApplicationSettingsStore(
                  'defaultLegendSettings',
                  textElement as 'title' | 'subtitle' | 'labels' | 'note',
                  'fontStyle',
                  ev.target.value as 'normal' | 'italic',
                );
              }
            }
          >
            <option value="normal">{ props.LL().CommonTextElement.Normal() }</option>
            <option value="italic">{ props.LL().CommonTextElement.Italic() }</option>
          </select>
        </td>}
      </For>
    </tr>
    <tr>
      <td>{ props.LL().CommonTextElement.FontWeight() }</td>
      <For each={textProperties}>
        {(textElement) => <td>
          <select
            value={ applicationSettingsStore.defaultLegendSettings[textElement].fontWeight }
            onChange={
              (ev) => {
                setApplicationSettingsStore(
                  'defaultLegendSettings',
                  textElement as 'title' | 'subtitle' | 'labels' | 'note',
                  'fontWeight',
                  ev.target.value as 'normal' | 'bold',
                );
              }
            }
          >
            <option value="normal">{ props.LL().CommonTextElement.Normal() }</option>
            <option value="bold">{ props.LL().CommonTextElement.Bold() }</option>
          </select>
        </td>}
      </For>
    </tr>
    <tr>
      <td>{ props.LL().CommonTextElement.FontFamily() }</td>
      <For each={textProperties}>
        {(textElement) => <td>
          <select
            value={ applicationSettingsStore.defaultLegendSettings[textElement].fontFamily }
            onChange={
              (ev) => {
                setApplicationSettingsStore(
                  'defaultLegendSettings',
                  textElement as 'title' | 'subtitle' | 'labels' | 'note',
                  'fontFamily',
                  ev.target.value,
                );
              }
            }
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

export default function ApplicationSettingsModal(
  props: {
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  return <>
    <InputFieldSelect
      label={props.LL().ApplicationSettingsModal.LocaleNumberFormatting()}
      onChange={(v) => setApplicationSettingsStore('userLocale', v)}
      value={applicationSettingsStore.userLocale}
    >
      <option value="de-DE">de-DE</option>
      <option value="en-GB">en-GB</option>
      <option value="en-IN">en-IN</option>
      <option value="en-US">en-US</option>
      <option value="es-ES">es-ES</option>
      <option value="fr-FR">fr-FR</option>
      <option value="ar-DZ">ar-DZ</option>
      <option value="fa-IR">fa-IR</option>
      <option value="ar-EG">ar-EG</option>
      <option value="ru-RU">ru-RU</option>
      <option value="zh-CN">zh-CN</option>
      <option value="pt-BR">pt-BR</option>
      <option value="zh-Hans-CN-u-nu-hanidec">zh-Hans-CN-u-nu-hanidec</option>
    </InputFieldSelect>
    <div class="field-block">
      <label class="label">{props.LL().ApplicationSettingsModal.DefaultLegendOptions()}</label>
      <p>{props.LL().ApplicationSettingsModal.DefaultLegendOptionsInformation()}</p>
      <TextOptionTable LL={props.LL} />
    </div>
    <InputFieldColor
      label={props.LL().ApplicationSettingsModal.DefaultNoDataColor()}
      value={applicationSettingsStore.defaultNoDataColor}
      onChange={(v) => setApplicationSettingsStore('defaultNoDataColor', v)}
    />
  </>;
}
