// Imports from solid-js
import { Accessor, For, JSX } from 'solid-js';

// Helpers
import { TranslationFunctions } from '../../i18n/i18n-types';
import { webSafeFonts, fonts } from '../../helpers/font';
import { findLayerById } from '../../helpers/layers';

// Stores
import { globalStore } from '../../store/GlobalStore';
import {
  layersDescriptionStore,
  updateProp,
  debouncedUpdateProp,
} from '../../store/LayersDescriptionStore';

// Other components
import InputFieldColor from '../Inputs/InputColor.tsx';
import InputFieldNumber from '../Inputs/InputNumber.tsx';
import InputFieldSelect from '../Inputs/InputSelect.tsx';
import InputFieldText from '../Inputs/InputText.tsx';

// Types / Interfaces / Enums
import type { ID3Element, LabelsParameters } from '../../global';

export default function SingleLabelEdition(
  props: {
    layerId: string,
    featureIx: number,
    LL: Accessor<TranslationFunctions>,
  },
): JSX.Element {
  const {
    layerId,
    featureIx,
    LL,
    // eslint-disable-next-line solid/reactivity
  } = props;
  const layer = findLayerById(
    layersDescriptionStore.layers,
    layerId,
  )!;

  const rendererParameters = layer.rendererParameters as LabelsParameters;
  const defaultLabel = rendererParameters.default;

  const redraw = () => {
    const layerElement = document.getElementById(layerId);
    layerElement.querySelectorAll('text').forEach((text) => {
      const projectedCoords = globalStore.projection(
        // eslint-disable-next-line no-underscore-dangle
        (t as SVGTextElement & ID3Element).__data__.geometry.coordinates,
      );
      const offsetX = +(t.getAttribute('mgt:offset-x') || 0);
      const offsetY = +(t.getAttribute('mgt:offset-y') || 0);
      t.setAttribute('x', `${projectedCoords[0] + offsetX}`);
      t.setAttribute('y', `${projectedCoords[1] + offsetY}`);
    });
  };

  return <div class="single-label-edition">
    <InputFieldText
      label={LL().LayerSettings.Value()}
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].text
          : layer.data.features[featureIx].properties[rendererParameters.variable]
      }
      onChange={(v) => {
        if (!rendererParameters.specific[featureIx]) {
          debouncedUpdateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx],
            {
              ...defaultLabel,
              text: v,
            },
          );
          return;
        }
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'text'],
          v,
        );
      }}
      width={200}
    />
    <InputFieldSelect
      label={LL().LayerSettings.FontFamily()}
      onChange={(v) => {
        if (!rendererParameters.specific[featureIx]) {
          debouncedUpdateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx],
            {
              ...defaultLabel,
              text: layer.data.features[featureIx].properties[rendererParameters.variable],
              fontFamily: v,
            },
          );
          return;
        }
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'fontFamily'],
          v,
        );
      }}
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].fontFamily
          : rendererParameters.default.fontFamily
      }
    >
      <option disabled>{props.LL().Fonts.FontFamilyTypes()}</option>
      <For each={webSafeFonts}>
        {(font) => <option value={font}>{font}</option>}
      </For>
      <option disabled>{props.LL().Fonts.Fonts()}</option>
      <For each={fonts}>
        {(font) => <option value={font}>{font}</option>}
      </For>
    </InputFieldSelect>
    <InputFieldNumber
      label={LL().LayerSettings.FontSize()}
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].fontSize
          : rendererParameters.default.fontSize
      }
      onChange={(v) => {
        if (!rendererParameters.specific[featureIx]) {
          debouncedUpdateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx],
            {
              ...defaultLabel,
              text: layer.data.features[featureIx].properties[rendererParameters.variable],
              fontSize: v,
            },
          );
          return;
        }
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'fontSize'],
          v,
        );
      }}
      min={1}
      max={100}
      step={1}
    />
    <InputFieldColor
      label={ LL().LayerSettings.TextColor() }
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].fontColor
          : rendererParameters.default.fontColor
      }
      onChange={(v) => {
        if (!rendererParameters.specific[featureIx]) {
          debouncedUpdateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx],
            {
              ...defaultLabel,
              text: layer.data.features[featureIx].properties[rendererParameters.variable],
              fontColor: v,
            },
          );
          return;
        }
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'fontColor'],
          v,
        );
      }}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.XOffset() }
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].textOffset[0]
          : rendererParameters.default.textOffset[0]
      }
      onChange={
        (v) => {
          if (!rendererParameters.specific[featureIx]) {
            const value = [v, rendererParameters.default.textOffset[1]];
            updateProp(
              layerId,
              ['rendererParameters', 'specific', featureIx],
              {
                ...defaultLabel,
                text: layer.data.features[featureIx].properties[rendererParameters.variable],
                textOffset: value,
              },
            );
            return;
          }
          const value = [v, rendererParameters.specific[featureIx].textOffset[1]];
          updateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx, 'textOffset'],
            value,
          );
          redraw();
        }
      }
      min={-100}
      max={100}
      step={1}
    />
    <InputFieldNumber
      label={ LL().LayerSettings.YOffset() }
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].textOffset[1]
          : rendererParameters.default.textOffset[1]
      }
      onChange={
        (v) => {
          if (!rendererParameters.specific[featureIx]) {
            const value = [rendererParameters.default.textOffset[0], v];
            updateProp(
              layerId,
              ['rendererParameters', 'specific', featureIx],
              {
                ...defaultLabel,
                text: layer.data.features[featureIx].properties[rendererParameters.variable],
                textOffset: value,
              },
            );
            return;
          }
          const value = [rendererParameters.specific[featureIx].textOffset[0], v];
          updateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx, 'textOffset'],
            value,
          );
          redraw();
        }
      }
      min={-100}
      max={100}
      step={1}
    />
    <InputFieldSelect
      label={ LL().LayerSettings.FontStyle() }
      onChange={(v) => {
        if (!rendererParameters.specific[featureIx]) {
          debouncedUpdateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx],
            {
              ...defaultLabel,
              text: layer.data.features[featureIx].properties[rendererParameters.variable],
              fontStyle: v,
            },
          );
          return;
        }
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'fontStyle'],
          v,
        );
      }}
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].fontStyle
          : rendererParameters.default.fontStyle
      }
    >
      <option value="normal">Normal</option>
      <option value="italic">Italic</option>
    </InputFieldSelect>
    <InputFieldSelect
      label={ LL().LayerSettings.FontWeight() }
      onChange={(v) => {
        if (!rendererParameters.specific[featureIx]) {
          debouncedUpdateProp(
            layerId,
            ['rendererParameters', 'specific', featureIx],
            {
              ...defaultLabel,
              text: layer.data.features[featureIx].properties[rendererParameters.variable],
              fontWeight: v,
            },
          );
          return;
        }
        debouncedUpdateProp(
          layerId,
          ['rendererParameters', 'specific', featureIx, 'fontWeight'],
          v,
        );
      }}
      value={
        rendererParameters.specific[featureIx]
          ? rendererParameters.specific[featureIx].fontWeight
          : rendererParameters.default.fontWeight
      }
    >
      <option value="normal">Normal</option>
      <option value="bold">Bold</option>
    </InputFieldSelect>
  </div>;
}
