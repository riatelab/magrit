// Imports from solid-js
import {
  createEffect,
  createSignal,
  type JSX,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';

// Imports from NoUiSlider
import noUiSlider from 'nouislider';
import { type API as NoUiSliderApi } from 'nouislider';
import 'nouislider/dist/nouislider.css';

// Custom styles
import '../../styles/NoUiSliderBulma.css';

interface InputConstrainedSliderProps {
  // The label of the slider.
  label?: string;
  // The current value of the slider.
  value: number;
  // The values that the slider can take (such as 2, 4, 8 and 16).
  allowedValues: number[];
  // The function to format the value of the slider.
  formater?: (value: number) => string;
  // The function to call when the value of the slider changes.
  onChange: (number: number) => void;
  // Controls the bar between the handles or the edges of the slider
  connect?: 'lower' | 'upper' | boolean | undefined;
  // Width of the slider.
  width?: number;
}

export default function InputConstrainedSlider(props: InputConstrainedSliderProps): JSX.Element {
  let refSliderNode: HTMLDivElement;
  let slider: NoUiSliderApi;

  const [
    currentValue,
    setCurrentValue,
  ] = createSignal(props.value); // eslint-disable-line solid/reactivity

  const createSlider = () => {
    slider = noUiSlider.create(refSliderNode, {
      start: props.value,
      step: 1,
      range: {
        min: 0,
        max: props.allowedValues.length - 1,
      },
      format: {
        to: (value) => props.allowedValues[value],
        from: (value) => props.allowedValues.indexOf(+value),
      },
    });

    slider.on('update', (values, handle) => {
      props.onChange(+values[handle]);
      setCurrentValue(+values[handle]);
    });
  };

  onMount(() => {
    createSlider();
  });

  onCleanup(() => {
    if (slider) slider.destroy();
  });
  return <div class="field pr-2 mr-4" style={{ 'margin-bottom': 'none' }}>
    <Show when={props.label}>
      <label class="label">{props.label}</label>
    </Show>
    <div class="output mr-5 ml-2">
      {
        props.formater
          ? props.formater(currentValue())
          : currentValue()
      }
    </div>
    <div class="control">
      <div class="slider slider-styled is-info" ref={refSliderNode!} style={{ width: `${props.width || 120}px` }}>
      </div>
    </div>
  </div>;
}
