import { type Accessor, type JSX } from 'solid-js';
import { FiExternalLink } from 'solid-icons/fi';
import { type TranslationFunctions } from '../../i18n/i18n-types';
import magritLogo from '../../assets/magrit-logo-only.png';

export default function AboutModal(
  props: {
    version: string,
    LL: Accessor<TranslationFunctions>
  },
): JSX.Element {
  // We dont care about reactivity here because the values won't
  // change during the lifetime of the component
  const {
    version,
    LL,
  } = props; // eslint-disable-line solid/reactivity

  return <>
    <div>
      <p class="has-text-centered">
        <b>Version { version }</b>
      </p>
    </div>
    <div class="has-text-centered">
      <img class="magrit-logo" src={magritLogo} alt="magrit-logo" style={{ width: '100px' }} />
    </div>
    <div>
      <p><b>{ LL().AboutPanel.description() }</b></p>
    </div>
    <hr />
    <div style={{ 'text-align': 'center' }}>
      <b>{LL().AboutPanel.usefulLinks()}</b>
      <br/>
      <p>
        <a
          class={'button is-link'}
          style={{ width: '280px' }}
          href={`${window.location.origin}/docs/`}
          target="_blank"
        >
          <b>{LL().AboutPanel.documentation()}</b>
        </a>
      </p>
      <p>
        <a
          class={'button is-link'}
          style={{ width: '280px' }}
          href="https://riate.cnrs.fr"
          target="_blank"
        >
          <FiExternalLink size={'1em'} style={{ 'margin-right': '0.35em' }}/>
          <b>{LL().AboutPanel.UarRiate()}</b>
        </a>
      </p>
      <p>
        <a
          class={'button is-link'}
          style={{ width: '280px' }}
          href="https://github.com/riatelab/magrit"
          target="_blank"
        >
          <FiExternalLink size={'1em'} style={{ 'margin-right': '0.35em' }}/>
          <b>{LL().AboutPanel.linkGithub()}</b>
        </a>
      </p>
      <p>
        <a
          class={'button is-link'}
          style={{ width: '280px' }}
          href="https://github.com/riatelab/magrit/issues"
          target="_blank"
        >
          <FiExternalLink size={'1em'} style={{ 'margin-right': '0.35em' }}/>
          <b>{LL().AboutPanel.linkGithubIssues()}</b>
        </a>
      </p>
    </div>
  </>;
}
