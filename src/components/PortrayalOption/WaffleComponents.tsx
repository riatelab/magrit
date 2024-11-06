// Imports from solid-js
import {
  createMemo,
  createSignal,
  JSX,
} from 'solid-js';

// Import from other libraries
import { BsThreeDotsVertical } from 'solid-icons/bs';
import Sortable from 'solid-sortablejs';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';

export default function VariableCustomisation(
  props: {
    variables: () => { name: string, displayName: string, color: string }[],
    setVariables: (variables: { name: string, displayName: string, color: string }[]) => void,
  },
): JSX.Element {
  const { LL } = useI18nContext();
  const [
    disabled,
    setDisabled,
  ] = createSignal<boolean>(false);

  const vars = createMemo(() => props.variables().toReversed());

  const setVars = (variables: { name: string, displayName: string, color: string }[]) => {
    props.setVariables(variables.toReversed());
  };

  return <div>
    <Sortable
      items={vars()}
      setItems={setVars as any}
      idField={'name'}
      disabled={disabled()}
    >
      {
        (item) => <div>
          <div
            style={{ width: '100%', border: 'solid 0.5px currentColor' }}
          >
            <BsThreeDotsVertical style={{ cursor: 'grab' }} />
            <input
              type="color"
              style={{ height: '2em', 'vertical-align': 'bottom' }}
              value={item.color}
              onChange={(e) => {
                props.setVariables(
                  props.variables()
                    .map((v) => (v.name === item.name
                      ? { ...v, color: e.currentTarget.value }
                      : v)),
                );
              }}
            />
            <input
              type="text"
              style={{ height: '2em', width: '45%' }}
              value={item.displayName}
              onChange={(e) => {
                props.setVariables(
                  props.variables()
                    .map((v) => (v.name === item.name
                      ? { ...v, displayName: e.currentTarget.value }
                      : v)),
                );
                setDisabled(false);
              }}
              onFocus={() => { setDisabled(true); }}
              onFocusOut={() => { setDisabled(false); }}
            />
            <span>
              &nbsp;(
              { LL().FunctionalitiesSection.CommonOptions.Variable() }
              &nbsp;{item.name})
            </span>
          </div>
        </div>
      }
    </Sortable>
  </div>;
}
