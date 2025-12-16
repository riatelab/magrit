// Imports from external libraries
import semver from 'semver';

// The current application version
import { version } from '../../package.json';

// Helpers
import sanitizeSVG from './sanitize-svg';
import { isNonNull } from './common';

// Types, interfaces and enums
import {
  CategoricalChoroplethLegend,
  type CategoricalChoroplethParameters,
  type CategoricalPictogramParameters,
  LayoutFeatureType,
  type LegendBase,
  type ProjectDescription,
  type ProportionalSymbolsParameters,
} from '../global.d';

// Enum indicating the validity state of a project
export enum ValidityState {
  Valid,
  Invalid,
  SavedFromNewerVersion,
}

export const patchProject = (
  project: ProjectDescription,
): ProjectDescription => {
  const projectVersion = project.version;
  // At some point we allowed to save a project with user-defined projections
  // that don't have a name (when checking the "use this projection" box in
  // the import window).
  // This was a bug and causes errors
  // when loading the project again. So here we patch this issue
  // (https://github.com/riatelab/magrit/issues/168)
  // by setting a default name ('User-defined projection') if
  // the name is missing.
  if (project.map?.projection?.type === 'proj4') {
    if (!project.map.projection.name) {
      console.log('Patching project to add a name to the user-defined projection');
      // eslint-disable-next-line no-param-reassign
      project.map.projection.name = 'User-defined projection';
    }
  }

  // We need to path the source SVG of images in layout features
  if (project.layoutFeaturesAndLegends) {
    project.layoutFeaturesAndLegends.forEach((layoutFeatureOrLegend) => {
      if (layoutFeatureOrLegend.type === LayoutFeatureType.Image) {
        const imageFeature = layoutFeatureOrLegend;
        if (imageFeature.imageType === 'SVG') {
          // eslint-disable-next-line no-param-reassign
          imageFeature.content = sanitizeSVG(imageFeature.content);
        }
      }
    });
  }

  // In version 2.0.9, we changed the model of the ScaleBar
  // so its optional 'label' property isn't a string anymore
  // but a LegendTextElement (allowing to set a label as well as
  // font properties).
  if (semver.lt(projectVersion, '2.0.9')) {
    console.log('Patching project to version 2.0.9');
    project.layoutFeaturesAndLegends.forEach((layoutFeatureOrLegend) => {
      if (layoutFeatureOrLegend.type === LayoutFeatureType.ScaleBar) {
        // eslint-disable-next-line no-param-reassign
        layoutFeatureOrLegend.label = {
          text: layoutFeatureOrLegend.label ? layoutFeatureOrLegend.label as unknown as string : '',
          fontSize: 12,
          fontFamily: 'Sans-serif',
          fontStyle: 'normal',
          fontWeight: 'normal',
          fontColor: 'black',
        };
      }
    });
    // eslint-disable-next-line no-param-reassign
    project.version = '2.0.9';
  }

  // In version 2.0.16, we changed the model of the application settings
  // to add a new option 'useProjectionPreclip' to control whether to apply
  // a pre-clip on the projection or not.
  if (semver.lt(projectVersion, '2.0.16')) {
    console.log('Patching project to version 2.0.16');
    // eslint-disable-next-line no-param-reassign
    project.applicationSettings.useProjectionPreclip = true;
    // eslint-disable-next-line no-param-reassign
    project.version = '2.0.16';
  }
  if (semver.lt(projectVersion, '2.1.1')) {
    console.log('Patching project to version 2.1.1');
    // eslint-disable-next-line no-param-reassign
    project.applicationSettings.useUndoRedo = false;
    // eslint-disable-next-line no-param-reassign
    project.version = '2.1.1';
  }

  // In version 2.1.2 we changed the type 'discontinuityLegend' to
  // 'graduatedLineLegend' (in order to be more generic and use it as
  // well for graduated links).
  if (semver.lt(projectVersion, '2.1.2')) {
    console.log('Patching project to version 2.1.2');
    project.layoutFeaturesAndLegends.forEach((layoutFeatureOrLegend) => {
      if (layoutFeatureOrLegend.type === 'discontinuity') {
        // eslint-disable-next-line no-param-reassign
        (layoutFeatureOrLegend as LegendBase).type = 'graduatedLine';
      }
    });
    // eslint-disable-next-line no-param-reassign
    project.version = '2.1.1';
  }

  // In version 2.3.O we added the possibility of choosing
  // whether class intervals are closed on the left or the right
  // (before they were always closed on the right).
  if (semver.lt(projectVersion, '2.3.0')) {
    console.log('Patching project to version 2.3.0');
    // eslint-disable-next-line no-param-reassign
    project.applicationSettings.intervalClosure = 'right';
  }

  // In version 2.3.8, we added the possibility to disable category/categories
  // in categorical choropleth and categorical symbol maps.
  if (semver.lt(projectVersion, '2.3.8')) {
    console.log('Patching project to version 2.3.8');
    project.layers.forEach((layer) => {
      if (layer.representationType === 'categoricalChoropleth' || layer.representationType === 'categoricalPictogram') {
        (
          layer.rendererParameters as
            (CategoricalChoroplethParameters | CategoricalPictogramParameters))
          .mapping
          .forEach((category) => {
            // eslint-disable-next-line no-param-reassign
            category.show = true;
          });
      }
    });
  }

  // Two breaking changes were introduced in version 2.3.14
  if (semver.lt(projectVersion, '2.3.14')) {
    // We added the possibility to make pictogram symbols movable
    // in categorical pictogram maps.
    console.log('Patching project to version 2.3.14');
    project.layers.forEach((layer) => {
      if (layer.representationType === 'categoricalPictogram') {
        const rendererParameters = layer.rendererParameters as CategoricalPictogramParameters;
        // eslint-disable-next-line no-param-reassign
        rendererParameters.movable = false;
      }
    });

    // We also changed how the no-data category is handled
    // in categorical choropleth maps.
    project.layers.forEach((layer) => {
      if (layer.representationType === 'categoricalChoropleth') {
        const rendererParameters = layer.rendererParameters as CategoricalChoroplethParameters;
        const noDataCategory = rendererParameters.mapping.find(
          (category) => !isNonNull(category.value),
        );
        if (noDataCategory) {
          // We also need to find the legend that is linked to this layer to retrieve the label for
          // the no-data category.
          const linkedLegend = project.layoutFeaturesAndLegends.find(
            (layoutFeatureOrLegend) => (
              layoutFeatureOrLegend.type === 'categoricalChoropleth'
              && layoutFeatureOrLegend.layerId === layer.id
            ),
          ) as CategoricalChoroplethLegend;
          // eslint-disable-next-line no-param-reassign
          noDataCategory.show = true;
          // eslint-disable-next-line no-param-reassign
          noDataCategory.color = rendererParameters.noDataColor;
          delete rendererParameters.noDataColor;
          // eslint-disable-next-line no-param-reassign
          noDataCategory.categoryName = linkedLegend.noDataLabel;
        }
      } else if (
        layer.representationType === 'proportionalSymbols'
        && (layer.rendererParameters as ProportionalSymbolsParameters).colorMode === 'categoricalVariable'
      ) {
        const rendererParameters = (
          layer.rendererParameters as ProportionalSymbolsParameters
        ).color as CategoricalChoroplethParameters;
        const noDataCategory = rendererParameters.mapping.find(
          (category) => !isNonNull(category.value),
        );
        if (noDataCategory) {
          // We also need to find the legend that is linked to this layer to retrieve the label for
          // the no-data category.
          const linkedLegend = project.layoutFeaturesAndLegends.find(
            (layoutFeatureOrLegend) => (
              layoutFeatureOrLegend.type === 'categoricalChoropleth'
              && layoutFeatureOrLegend.layerId === layer.id
            ),
          ) as CategoricalChoroplethLegend;
          // eslint-disable-next-line no-param-reassign
          noDataCategory.show = true;
          // eslint-disable-next-line no-param-reassign
          noDataCategory.color = rendererParameters.noDataColor;
          delete rendererParameters.noDataColor;
          // eslint-disable-next-line no-param-reassign
          noDataCategory.categoryName = linkedLegend.noDataLabel;
        }
      }
    });
  }

  // In 2.3.16, we added the possibility to control the size of the snapping grid
  // in the application settings.
  if (semver.lt(projectVersion, '2.3.16')) {
    console.log('Patching project to version 2.3.16');
    if (!project.applicationSettings.snappingGridSize) {
      // eslint-disable-next-line no-param-reassign
      project.applicationSettings.snappingGridSize = 10;
    }
  }
  return project;
};

export const isValidProject = (
  project: ProjectDescription,
): ValidityState => {
  if (
    !project.version
    || !project.layoutFeaturesAndLegends
    || !project.layers
    || !project.map
    || !project.tables
    || !project.applicationSettings
  ) {
    return ValidityState.Invalid;
  }
  if (semver.gt(project.version, version)) {
    return ValidityState.SavedFromNewerVersion;
  }
  return ValidityState.Valid;
};
