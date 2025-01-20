// Imports from solid-js
import {
  createEffect,
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

interface InputFieldNumberSliderProps {
  label: string;
  value: number;
  onChange: (number: number) => void;
  min: number;
  max: number;
  step: number;
  connect?: 'lower' | 'upper' | boolean;
  widthSlider?: number;
  widthInput?: number;
}

export default function InputFieldNumberSlider(props: InputFieldNumberSliderProps): JSX.Element {
  let refSliderNode: HTMLDivElement;
  let slider: NoUiSliderApi;

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
    <label class="label" style={{ width: '120px' }}>{props.label}</label>
    <input
      class={'input'}
      type="number"
      value={props.value}
      onChange={(e) => {
        slider.set(+e.currentTarget.value);
        props.onChange(+e.currentTarget.value);
      }}
      min={props.min}
      max={props.max}
      step={props.step}
      style={{
        width: `${props.widthInput || 80}px`,
      }}
    />
    <div class="control">
      <div
        class="slider slider-styled is-info"
        ref={refSliderNode!}
        style={{ width: `${props.widthSlider || 120}px` }}
      >
      </div>
    </div>
  </div>;
}
