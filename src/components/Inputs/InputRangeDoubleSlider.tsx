import {
  createSignal,
  type JSX,
  onCleanup,
  onMount,
} from 'solid-js';
import noUiSlider from 'nouislider';
import { type API as NoUiSliderApi } from 'nouislider';
import 'nouislider/dist/nouislider.css';

interface InputFieldDoubleRangeNumberProps {
  label: string;
  formater?: (value: number) => string;
  values: [number, number];
  onChange: (v: [number, number]) => void;
  min: number;
  max: number;
  step: number;
  connect?: 'lower' | 'upper' | boolean;
  width?: number;
}

export default function InputFieldRangeDoubleSlider(
  props: InputFieldDoubleRangeNumberProps,
): JSX.Element {
  let refSliderNode: HTMLDivElement;
  let slider: NoUiSliderApi;

  const [
    currentValue,
    setCurrentValue,
  ] = createSignal(props.values);

  onMount(() => {
    slider = noUiSlider.create(refSliderNode!, {
      start: props.values,
      range: {
        min: props.min,
        max: props.max,
      },
      connect: props.connect !== undefined ? props.connect : false,
      step: props.step,
    });

    slider.on('update', (values, handle) => {
      console.log(values);
      props.onChange(values[handle].map(Number) as [number, number]);
      setCurrentValue(values[handle]);
    });
  });

  onCleanup(() => {
    if (slider) slider.destroy();
  });

  return <div class="field">
    <label class="label">{props.label}</label>
    <div class="output mr-6 ml-6">
      {
        props.formater
          ? currentValue().map(props.formater).join(' - ')
          : currentValue()
      }
    </div>
    <div class="control" style={{ width: '220px' }}>
      <div class="slider slider-styled is-info" ref={refSliderNode!}>
      </div>
    </div>
  </div>;
}
