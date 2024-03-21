// Import from solid-js
import {
  children,
  createMemo,
  type JSX,
  ParentProps,
} from 'solid-js';
import { FaSolidTriangleExclamation } from 'solid-icons/fa';

type ErrorBannerProps = {
  // When used in a modal, we may want to expand the banner to the full width of the modal.
  expanded?: boolean,
};

export default function ErrorBanner(props: ParentProps<ErrorBannerProps>): JSX.Element {
  const c = children(() => props.children);
  const expanded = createMemo(() => props.expanded ?? false);

  return <section
    class="banner error-banner has-text-centered"
    style={{
      padding: '20px',
      margin: expanded() ? '0 -2em 20px' : '0',
      background: '#fde7e7',
      'border-top': '1px solid var(--border-color)',
    }}
  >
    <FaSolidTriangleExclamation
      class="error-banner__icon"
      fill="currentColor"
      style={{ height: '1.5em', width: '1.5em' }}
    />
    <div class="error-banner__content">
      { c() }
    </div>
  </section>;
}
