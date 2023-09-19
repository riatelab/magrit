import type { ParentProps, JSX } from 'solid-js';
import { children } from 'solid-js';

interface SimpleSelectProps {
  id?: string;
  onChange?: JSX.ChangeEventHandler<HTMLSelectElement, any>;
  style?: { [key: string]: string };
}

export default function SimpleSelect(props: ParentProps<SimpleSelectProps>): JSX.Element {
  const c = children(() => props.children);

  return <div class={'control'}>
    <div class={'select'} style={props.style}>
      <select onChange={props.onChange} id={props.id}>
        {c()}
      </select>
    </div>
  </div>;
}
