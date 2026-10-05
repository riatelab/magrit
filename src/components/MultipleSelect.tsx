import {
  children,
  createEffect,
  type JSX,
  type ParentProps, mergeProps,
} from 'solid-js';

interface MultipleSelectProps {
  size?: number;
  onChange?: JSX.ChangeEventHandler<HTMLSelectElement, Event>;
  style?: { [key: string]: string };
  values: string[];
  width?: number;
}

export default function MultipleSelect(props: ParentProps<MultipleSelectProps>): JSX.Element {
  let selectNode!: HTMLSelectElement;
  const mergedProps = mergeProps({ size: 3 }, props);
  const c = children(() => mergedProps.children);

  createEffect(() => {
    c(); // Option dependency
    const values = mergedProps.values; // eslint-disable-line prefer-destructuring
    for (let i = 0; i < selectNode.options.length; i += 1) {
      selectNode.options[i].selected = values.includes(selectNode.options[i].value);
    }
  });

  return (
    <div class="control">
      <div
        class="select is-multiple"
        style={{ height: 'unset', width: mergedProps.width !== undefined ? `${mergedProps.width}px` : 'unset' }}
      >
        <select
          multiple
          size={mergedProps.size ?? 3}
          style={{ height: 'unset', ...mergedProps.style }}
          onChange={(e) => mergedProps.onChange?.(e)}
          ref={selectNode}
        >
          {c()}
        </select>
      </div>
    </div>
  );
}
