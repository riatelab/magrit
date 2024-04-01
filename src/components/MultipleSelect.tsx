import {
  children,
  createEffect,
  on,
  onMount,
  type JSX,
  type ParentProps, mergeProps,
} from 'solid-js';

interface MultipleSelectProps {
  size?: number;
  onChange?: JSX.ChangeEventHandler<HTMLSelectElement, Event>;
  style?: { [key: string]: string };
  values: string[];
}

export default function MultipleSelect(props: ParentProps<MultipleSelectProps>): JSX.Element {
  let selectNode: HTMLSelectElement;
  const mergedProps = mergeProps({ size: 3, style: { height: 'unset' } }, props);
  const c = children(() => mergedProps.children);

  createEffect(
    on(
      () => mergedProps.values,
      () => {
        for (let i = 0; i < selectNode.options.length; i += 1) {
          if (mergedProps.values.includes(selectNode.options[i].value)) {
            selectNode.options[i].selected = true;
          }
        }
      },
    ),
  );

  onMount(() => {
    for (let i = 0; i < selectNode.options.length; i += 1) {
      if (mergedProps.values.includes(selectNode.options[i].value)) {
        selectNode.options[i].selected = true;
      }
    }
  });

  return <div class={'control'}>
    <div
      class={'select is-multiple'}
      style={{
        height: 'unset',
      }}
    >
      <select
        onChange={(e) => {
          if (mergedProps.onChange) mergedProps.onChange(e);
        }}
        multiple={true}
        size={mergedProps.size}
        style={mergedProps.style}
        ref={selectNode!}
      >
        {c()}
      </select>
    </div>
  </div>;
}
