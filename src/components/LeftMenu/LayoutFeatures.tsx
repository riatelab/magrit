// Import from solid-js
import {
  createSignal, JSX, Show,
} from 'solid-js';
import { produce } from 'solid-js/store';

// Assets
import layoutFeatureRectangle from '../../assets/layout-features/rect-01.png';
import layoutFeatureGraticule from '../../assets/layout-features/graticule-01.png';
import layoutFeatureSphere from '../../assets/layout-features/sphere-01.png';
import layoutFeatureScaleBar from '../../assets/layout-features/scale.png';
import layoutFeatureNorthArrow from '../../assets/layout-features/north-01.png';
import layoutFeatureArrow from '../../assets/layout-features/arrow-01.png';
import layoutFeatureText from '../../assets/layout-features/text-01.png';
import layoutFeatureDraw from '../../assets/layout-features/draw-01.png';
import layoutFeatureEllipse from '../../assets/layout-features/ellipse-01.png';

// Stores
import { mapStore, setMapStore } from '../../store/MapStore';
import { layersDescriptionStore, setLayersDescriptionStore } from '../../store/LayersDescriptionStore';

// Helpers
import { useI18nContext } from '../../i18n/i18n-solid';
import {
  alreadyHasGraticule,
  alreadyHasSphere,
  makeDefaultGraticule,
  makeDefaultSphere,
} from '../../helpers/layers';

export default function LayoutFeatures(): JSX.Element {
  const { LL } = useI18nContext();

  return <div class="layout-features-section">
    <div class="field">
      <label class="label">{ LL().LayoutFeatures.BackgroundColor() }</label>
      <div class="control">
        <input
          class="color"
          type="color"
          value={mapStore.backgroundColor}
          onChange={
            (e) => {
              setMapStore({
                backgroundColor: e.target.value,
              });
            }
          }
        />
      </div>
    </div>
    <div class="field">
      <label class="label">{ LL().LayoutFeatures.Opacity() }</label>
      <div class="control">
        <input
          class="number"
          type="number"
          value={mapStore.backgroundColorOpacity}
          onChange={
            (e) => {
              setMapStore({
                backgroundColorOpacity: +e.target.value,
              });
            }
          }
          min="0"
          max="1"
          step="0.1"
        />
      </div>
    </div>
    <div class="field-block">
      <label class="label">{ LL().LayoutFeatures.MapSkinElements() }</label>
      <div class="is-flex is-justify-content-space-evenly">
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureRectangle}
          alt={ LL().LayoutFeatures.Rectangle() }
          title={ LL().LayoutFeatures.Rectangle() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureEllipse}
          alt={ LL().LayoutFeatures.Ellipse() }
          title={ LL().LayoutFeatures.Ellipse() }
          onClick={(e) => {}}
        />
        <img
          classList={{
            'layout-features-section__icon-element': true,
            disabled: alreadyHasGraticule(layersDescriptionStore.layers),
          }}
          src={layoutFeatureGraticule}
          alt={ LL().LayoutFeatures.Graticule() }
          title={ LL().LayoutFeatures.Graticule() }
          onClick={(e) => {
            if (!alreadyHasGraticule(layersDescriptionStore.layers)) {
              setLayersDescriptionStore(
                produce(
                  (draft) => {
                    draft.layers.push(makeDefaultGraticule());
                  },
                ),
              );
            }
          }}
        />
        <img
          classList={{
            'layout-features-section__icon-element': true,
            disabled: alreadyHasSphere(layersDescriptionStore.layers),
          }}
          src={layoutFeatureSphere}
          alt={ LL().LayoutFeatures.Sphere() }
          title={ LL().LayoutFeatures.Sphere() }
          onClick={(e) => {
            if (!alreadyHasSphere(layersDescriptionStore.layers)) {
              setLayersDescriptionStore(
                produce(
                  (draft) => {
                    // We always want the sphere to be under the other layers
                    draft.layers.unshift(makeDefaultSphere());
                  },
                ),
              );
            }
          }}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureNorthArrow}
          alt={ LL().LayoutFeatures.NorthArrow() }
          title={ LL().LayoutFeatures.NorthArrow() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureScaleBar}
          alt={ LL().LayoutFeatures.ScaleBar() }
          title={ LL().LayoutFeatures.ScaleBar() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureArrow}
          alt={ LL().LayoutFeatures.Line() }
          title={ LL().LayoutFeatures.Line() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureText}
          alt={ LL().LayoutFeatures.Text() }
          title={ LL().LayoutFeatures.Text() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element disabled"
          src={layoutFeatureDraw}
          alt={ LL().LayoutFeatures.FreeDrawing() }
          title={ LL().LayoutFeatures.FreeDrawing() }
          onClick={(e) => {}}
        />
      </div>
    </div>

  </div>;
}
