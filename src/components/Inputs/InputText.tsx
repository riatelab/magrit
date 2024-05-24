import { For, type JSX, Show } from 'solid-js';
import { v4 as uuidv4 } from 'uuid';
import { type LocalizedString } from 'typesafe-i18n';

interface InputFieldTextProps {
  label: LocalizedString | string;
  value?: string;
  placeholder?: string;
  onChange?: (text: string) => void;
  onKeyUp?: (text: string) => void;
  width?: number;
  layout?: 'horizontal' | 'vertical';
  dataList?: { value: string, name: string }[];
  bindKeyUpAsChange?: boolean;
}

export default function InputFieldText(props: InputFieldTextProps): JSX.Element {
  const id = uuidv4();
  return <div class={props.layout === 'vertical' ? 'field-block' : 'field'}>
    <label class="label">{ props.label }</label>
    <div class="control">
      <input
        class="input"
        type="text"
        onChange={(e) => { if (props.onChange) props.onChange(e.currentTarget.value); }}
        onKeyUp={(e) => {
          if (props.onKeyUp) props.onKeyUp(e.currentTarget.value);
          else if (props.bindKeyUpAsChange && props.onChange) props.onChange(e.currentTarget.value);
        }}
        value={ props.value || '' }
        placeholder={ props.placeholder }
        style={{ width: props.width ? `${props.width}px` : 'unset' }}
        list={props.dataList ? `datalist-${id}` : undefined}
      />
      <Show when={props.dataList}>
        <datalist id={`datalist-${id}`}>
          <For each={props.dataList}>
            {(e) => <option value={e.value}>{e.name}</option>}
          </For>
        </datalist>
      </Show>
    </div>
  </div>;
}
