import semver from 'semver';
import { version } from '../../package.json';
import {
  LayoutFeatureType,
  type LegendBase,
  type ProjectDescription,
} from '../global.d';

export enum ValidityState {
  Valid,
  Invalid,
  SavedFromNewerVersion,
}

export const patchProject = (
  project: ProjectDescription,
): ProjectDescription => {
  const projectVersion = project.version;
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
