import {
  createSignal,
  type JSX,
  onCleanup,
  onMount,
} from 'solid-js';
import noUiSlider from 'nouislider';
import { type API as NoUiSliderApi } from 'nouislider';
import 'nouislider/dist/nouislider.css';

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

  onMount(() => {
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
  });

  onCleanup(() => {
    slider.destroy();
  });

  return <div class="field">
    <label class="label">{props.label}</label>
    <div class="output mr-6 ml-6">
      {
        props.formater
          ? props.formater(currentValue())
          : currentValue()
      }
    </div>
    <div class="control" style={{ width: '220px' }}>
      <div class="slider" ref={refSliderNode!}>
      </div>
    </div>
  </div>;
}
