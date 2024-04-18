import {
  children,
  type JSX,
  ParentProps,
} from 'solid-js';

interface CollapsibleSectionProps {
  summaryContent: string,
  initialOpen?: boolean,
}

export default function DetailsSummary(
  props: ParentProps<CollapsibleSectionProps>,
): JSX.Element {
  const c = children(() => props.children);

  return <details open={props.initialOpen}>
    <summary
      class={'mb-4'}
      style={{
        color: 'var(--bulma-text-strong)',
      }}
    >
      { props.summaryContent }
    </summary>
    <div>
      { c() }
    </div>
  </details>;
}
