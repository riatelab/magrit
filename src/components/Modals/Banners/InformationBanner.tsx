// Import from solid-js
import {
  children,
  createMemo,
  type JSX,
  ParentProps,
} from 'solid-js';

// Import from other libraries
import { FaSolidCircleInfo } from 'solid-icons/fa';

type InformationBannerProps = {
  // When used in a modal, we may want to expand the banner to the full width of the modal.
  expanded?: boolean,
};

/**
 * This is a component used to display an information banner in a modal or in a page.
 * @param props
 * @constructor
 */
export default function InformationBanner(props: ParentProps<InformationBannerProps>): JSX.Element {
  const c = children(() => props.children);
  const expanded = createMemo(() => props.expanded ?? false);

  return <section
    class="banner information-banner has-text-centered"
    style={{
      padding: '20px',
      margin: expanded() ? '0 -2em 20px' : '0',
      background: '#cafbe5',
      'border-top': '1px solid var(--border-color)',
    }}
  >
    <FaSolidCircleInfo
      class="information-banner__icon"
      fill="currentColor"
      style={{ height: '1.5em', width: '1.5em' }}
    />
    <div class="information-banner__content">
      { c() }
    </div>
  </section>;
}
