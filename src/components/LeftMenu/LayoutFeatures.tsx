// Import from solid-js
import {
  createSignal, JSX, Show,
} from 'solid-js';

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
      <label class="label">{ LL().LayoutFeaturesSection.BackgroundColor() }</label>
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
      <label class="label">{ LL().LayoutFeaturesSection.Opacity() }</label>
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
      <label class="label">{ LL().LayoutFeaturesSection.MapSkinElements() }</label>
      <div class="is-flex is-justify-content-space-evenly">
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureRectangle}
          alt={ LL().LayoutFeaturesSection.Rectangle() }
          title={ LL().LayoutFeaturesSection.Rectangle() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureEllipse}
          alt={ LL().LayoutFeaturesSection.Ellipse() }
          title={ LL().LayoutFeaturesSection.Ellipse() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureGraticule}
          alt={ LL().LayoutFeaturesSection.Graticule() }
          title={ LL().LayoutFeaturesSection.Graticule() }
          onClick={(e) => {
            if (!alreadyHasGraticule(layersDescriptionStore.layers)) {
              setLayersDescriptionStore({
                layers: [
                  makeDefaultGraticule(),
                  ...layersDescriptionStore.layers,
                ],
              });
            }
          }}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureSphere}
          alt={ LL().LayoutFeaturesSection.Sphere() }
          title={ LL().LayoutFeaturesSection.Sphere() }
          onClick={(e) => {
            if (!alreadyHasSphere(layersDescriptionStore.layers)) {
              setLayersDescriptionStore({
                layers: [
                  makeDefaultSphere(),
                  ...layersDescriptionStore.layers,
                ],
              });
            }
          }}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureNorthArrow}
          alt={ LL().LayoutFeaturesSection.NorthArrow() }
          title={ LL().LayoutFeaturesSection.NorthArrow() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureScaleBar}
          alt={ LL().LayoutFeaturesSection.ScaleBar() }
          title={ LL().LayoutFeaturesSection.ScaleBar() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureArrow}
          alt={ LL().LayoutFeaturesSection.Line() }
          title={ LL().LayoutFeaturesSection.Line() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureText}
          alt={ LL().LayoutFeaturesSection.Text() }
          title={ LL().LayoutFeaturesSection.Text() }
          onClick={(e) => {}}
        />
        <img
          class="layout-features-section__icon-element"
          src={layoutFeatureDraw}
          alt={ LL().LayoutFeaturesSection.FreeDrawing() }
          title={ LL().LayoutFeaturesSection.FreeDrawing() }
          onClick={(e) => {}}
        />
      </div>
    </div>

  </div>;
}
