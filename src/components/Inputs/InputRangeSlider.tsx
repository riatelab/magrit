// Imports from solid-js
import {
  createEffect,
  createSignal,
  type JSX,
  on,
  onCleanup,
  onMount,
} from 'solid-js';

// Imports from NoUiSlider
import noUiSlider from 'nouislider';
import { type API as NoUiSliderApi } from 'nouislider';
import 'nouislider/dist/nouislider.css';

// Custom styles
import '../../styles/NoUiSliderBulma.css';

interface InputFieldRangeNumberProps {
  label: string;
  formater?: (value: number) => string;
  value: number;
  onChange: (number: number) => void;
  min: number;
  max: number;
  step: number;
  connect?: 'lower' | 'upper' | boolean;
  width?: number;
}

export default function InputFieldRangeSlider(props: InputFieldRangeNumberProps): JSX.Element {
  let refSliderNode: HTMLDivElement;
  let slider: NoUiSliderApi;

  const [
    currentValue,
    setCurrentValue,
  ] = createSignal(props.value);

  const createSlider = () => {
    slider = noUiSlider.create(refSliderNode, {
      start: props.value,
      range: {
        min: props.min,
        max: props.max,
      },
      connect: props.connect !== undefined ? props.connect : false,
      step: props.step,
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

  createEffect(
    on(
      () => [props.min, props.max],
      () => {
        if (slider) {
          slider.updateOptions({
            range: {
              min: props.min,
              max: props.max,
            },
          }, true);
        }
      },
    ),
  );

  createEffect(
    on(
      () => [props.step],
      () => {
        if (slider) {
          slider.updateOptions({
            step: props.step,
          }, true);
        }
      },
    ),
  );

  return <div class="field pr-2">
    <label class="label">{props.label}</label>
    <div class="output mr-4 ml-2">
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
