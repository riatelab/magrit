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
  values: [number, number];
  onChange: (numbers: [number, number]) => void;
  min: number;
  max: number;
  step: number;
  connect?: 'lower' | 'upper' | boolean;
  widthSlider?: number;
  widthInput?: number;
}

export default function InputFieldDoubleNumberSlider(
  props: InputFieldNumberSliderProps,
): JSX.Element {
  let refSliderNode: HTMLDivElement;
  let slider: NoUiSliderApi;

  const createSlider = () => {
    slider = noUiSlider.create(refSliderNode, {
      start: props.values,
      range: {
        min: props.min,
        max: props.max,
      },
      connect: props.connect !== undefined ? props.connect : false,
      step: props.step,
    });
    slider.on('update', (values, handle) => {
      if (handle === 0) {
        // Left handle
        props.onChange([+values[handle], props.values[1]]);
      } else {
        // Right handle
        props.onChange([props.values[0], +values[handle]]);
      }
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
    <label class="label" style={{ width: '100px' }}>{props.label}</label>
    <div>
      <input
        class={'input'}
        type="number"
        value={props.values[0]}
        onChange={(e) => {
          slider.set([+e.currentTarget.value, props.values[1]]);
          props.onChange([+e.currentTarget.value, props.values[1]]);
        }}
        min={props.min}
        max={props.max}
        step={props.step}
        style={{
          width: `${props.widthInput || 60}px`,
        }}
      />
      <input
        class={'input'}
        type="number"
        value={props.values[1]}
        onChange={(e) => {
          slider.set([+e.currentTarget.value, props.values[1]]);
          props.onChange([props.values[0], +e.currentTarget.value]);
        }}
        min={props.min}
        max={props.max}
        step={props.step}
        style={{
          width: `${props.widthInput || 60}px`,
        }}
      />
    </div>
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
