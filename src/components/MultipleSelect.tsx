import type { ParentProps, JSX } from 'solid-js';
import { children } from 'solid-js';

interface MultipleSelectProps {
  size?: number;
  onChange?: JSX.ChangeEventHandler<HTMLSelectElement, Event>;
  style?: { [key: string]: string };
}

export default function MultipleSelect(props: ParentProps<MultipleSelectProps>): JSX.Element {
  const c = children(() => props.children);

  return <div class={'control'}>
    <div class={'select is-multiple'}>
      <select
        onChange={(e) => {
          if (props.onChange) props.onChange(e);
        }}
        multiple={true}
        size={props.size || 3}
      >
        {c()}
      </select>
    </div>
  </div>;
}
