// Import from solid-js
import {
  children,
  createMemo,
  type JSX,
  ParentProps,
} from 'solid-js';

// Import from other libraries
import { FaSolidTriangleExclamation } from 'solid-icons/fa';

type WarningBannerProps = {
  // When used in a modal, we may want to expand the banner to the full width of the modal.
  expanded?: boolean,
};

/**
 * This is a component used to display a warning banner in a modal or in a page.
 * @param props
 * @constructor
 */
export default function WarningBanner(props: ParentProps<WarningBannerProps>): JSX.Element {
  const c = children(() => props.children);
  const expanded = createMemo(() => props.expanded ?? false);

  return <section
    class="banner warning-banner has-text-centered"
    style={{
      padding: '20px',
      margin: expanded() ? '0 -20px 20px' : '0',
      background: '#f4fbca',
      'border-top': '1px solid var(--border-color)',
    }}
  >
    <FaSolidTriangleExclamation
      class="warning-banner__icon"
      fill="currentColor"
      style={{ height: '1.5em', width: '1.5em' }}
    />
    <div class="warning-banner__content">
      { c() }
    </div>
  </section>;
}
