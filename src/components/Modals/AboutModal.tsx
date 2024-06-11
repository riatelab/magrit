// Imports from solid-js
import {
  type Accessor,
  createSignal,
  type JSX,
  For, Show,
} from 'solid-js';

// Imports from other packages
import { FaSolidCircleQuestion, FaSolidGear } from 'solid-icons/fa';
import { FiExternalLink } from 'solid-icons/fi';

// Stores
import { applicationSettingsStore, setApplicationSettingsStore } from '../../store/ApplicationSettingsStore';

// Subcomponents
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldColor from '../Inputs/InputColor.tsx';
import magritLogo from '../../assets/magrit-logo-only.png';

// Helpers
import { webSafeFonts, fonts } from '../../helpers/font';

// Types / Interfaces
import { type TranslationFunctions } from '../../i18n/i18n-types';

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

export default function AboutModal(
  props: {
    version: string,
    LL: Accessor<TranslationFunctions>
  },
): JSX.Element {
  // We dont care about reactivity here because the values won't
  // change during the lifetime of the component
  const {
    version,
    LL,
  } = props; // eslint-disable-line solid/reactivity

  const [
    currentTab,
    setCurrentTab,
  ] = createSignal<'about' | 'settings'>('about');

  return <>
    <div class="tabs is-boxed">
      <ul style={{ margin: 0 }}>
        <li classList={{ 'is-active': currentTab() === 'about' }}>
          <a onClick={() => {
            setCurrentTab('about');
          }}>
            <span class="icon is-small"><FaSolidCircleQuestion/></span>
            <span>{LL().AboutAndSettingsPanel.TabAbout()}</span>
          </a>
        </li>
        <li classList={{ 'is-active': currentTab() === 'settings' }}>
          <a onClick={() => {
            setCurrentTab('settings');
          }}>
            <span class="icon is-small"><FaSolidGear/></span>
            <span>{LL().AboutAndSettingsPanel.TabSettings()}</span>
          </a>
        </li>
      </ul>
    </div>
    <Show when={currentTab() === 'about'}>
      <div class="tab-about">
        <div>
          <p class="has-text-centered">
            <b>Magrit - Version {version}</b>
          </p>
        </div>
        <div class="has-text-centered">
          <img class="magrit-logo" src={magritLogo} alt="magrit-logo" style={{ width: '100px' }}/>
        </div>
        <div>
          <p><b>{LL().AboutAndSettingsPanel.description()}</b></p>
        </div>
        <hr/>
        <div style={{ 'text-align': 'center' }}>
          <b>{LL().AboutAndSettingsPanel.usefulLinks()}</b>
          <br/>
          <p>
            <a
              class={'button is-link'}
              style={{ width: '280px' }}
              href={`${window.location.origin}/docs/`}
              target="_blank"
            >
              <b>{LL().AboutAndSettingsPanel.documentation()}</b>
            </a>
          </p>
          <p>
            <a
              class={'button is-link'}
              style={{ width: '280px' }}
              href="https://riate.cnrs.fr"
              target="_blank"
            >
              <FiExternalLink size={'1em'} style={{ 'margin-right': '0.35em' }}/>
              <b>{LL().AboutAndSettingsPanel.UarRiate()}</b>
            </a>
          </p>
          <p>
            <a
              class={'button is-link'}
              style={{ width: '280px' }}
              href="https://github.com/riatelab/magrit"
              target="_blank"
            >
              <FiExternalLink size={'1em'} style={{ 'margin-right': '0.35em' }}/>
              <b>{LL().AboutAndSettingsPanel.linkGithub()}</b>
            </a>
          </p>
          <p>
            <a
              class={'button is-link'}
              style={{ width: '280px' }}
              href="https://github.com/riatelab/magrit/issues"
              target="_blank"
            >
              <FiExternalLink size={'1em'} style={{ 'margin-right': '0.35em' }}/>
              <b>{LL().AboutAndSettingsPanel.linkGithubIssues()}</b>
            </a>
          </p>
        </div>
      </div>
    </Show>
    <Show when={currentTab() === 'settings'}>
      <div class="tab-settings">
        <InputFieldSelect
          label={props.LL().AboutAndSettingsPanel.LocaleNumberFormatting()}
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
        <hr/>
        <InputFieldColor
          label={props.LL().AboutAndSettingsPanel.SnappingGridColor()}
          value={applicationSettingsStore.snappingGridColor}
          onChange={(v) => setApplicationSettingsStore('snappingGridColor', v)}
        />
        <hr/>
        <div class="has-text-centered">
          <p>{props.LL().AboutAndSettingsPanel.DefaultOptionsInformation()}</p>
        </div>
        <br />
        <div class="field-block">
          <label class="label">{props.LL().AboutAndSettingsPanel.DefaultLegendOptions()}</label>
          <TextOptionTable LL={props.LL}/>
        </div>
        <br />
        <InputFieldColor
          label={props.LL().AboutAndSettingsPanel.DefaultNoDataColor()}
          value={applicationSettingsStore.defaultNoDataColor}
          onChange={(v) => setApplicationSettingsStore('defaultNoDataColor', v)}
        />
      </div>
    </Show>
  </>;
}
