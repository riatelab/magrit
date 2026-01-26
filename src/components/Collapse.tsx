import {
  JSX,
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
} from 'solid-js';

type CollapseProps = {
  /** Whether the content is visible or collapsed */
  value: boolean;
  /**
   * Animation duration in milliseconds,
   * defaults to 0 (no animation)
   */
  duration?: number;
  /** Content to be collapsed/expanded */
  children: JSX.Element;
  /** Additional CSS class */
  class?: string;
};

/**
 * Collapse component, used to show/hide content with a smooth animation and create accordions.
 * This is a lightweight rewrite of the previous component, after ditching solid-collapse
 * due to issues that we had with it (see https://github.com/riatelab/magrit/issues/202).
 * It uses ResizeObserver which is supported in all modern browsers since 2020
 * (source: https://caniuse.com/?search=ResizeObserver).
 * @param {CollapseProps} props
 * @constructor
 */
export default function Collapse(props: CollapseProps) {
  const [local, others] = splitProps(props, ['value', 'duration', 'children', 'class']);
  const duration = () => local.duration ?? 0;

  let contentRef: HTMLDivElement | undefined;
  const [height, setHeight] = createSignal(0);
  const [shouldRender, setShouldRender] = createSignal(local.value);
  // To remove from the flow during closing (to avoid affecting surrounding layout)
  const [isClosing, setIsClosing] = createSignal(false);

  // Mesure content height and set it
  let ro: ResizeObserver | undefined;
  const measure = () => {
    if (!contentRef) return;
    setHeight(contentRef.scrollHeight);
  };
  const attachObserver = () => {
    ro?.disconnect();
    if (!contentRef) return;
    ro = new ResizeObserver(() => {
      // Update height only if opened
      if (local.value) measure();
    });
    ro.observe(contentRef);
  };
  onCleanup(() => ro?.disconnect());

  // Handle open/close changes
  createEffect(() => {
    if (local.value) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsClosing(false);
        attachObserver();
        measure();
      });
    } else {
      if (shouldRender()) setIsClosing(true);
      setHeight(0);
    }
  });

  createEffect(() => {
    if (shouldRender()) {
      requestAnimationFrame(() => {
        attachObserver();
        measure();
      });
    } else {
      ro?.disconnect();
    }
  });

  const handleTransitionEnd: JSX.EventHandlerUnion<HTMLDivElement, TransitionEvent> = (e) => {
    if (e.target !== e.currentTarget) return;
    if (!local.value) {
      setShouldRender(false);
      setIsClosing(false);
    }
  };

  return (
    <div
      {...others}
      class={`collapse ${local.class ?? ''}`.trim()}
      aria-hidden={!local.value}
      style={{
        position: isClosing() ? 'absolute' : 'relative',
        width: '100%',
        'max-height': `${height()}px`,
        opacity: local.value ? 1 : 0,
        overflow: local.value ? 'visible' : 'hidden',
        transition: `max-height ${duration()}ms ease, opacity ${Math.round(duration() * 0.7)}ms ease`,
        'pointer-events': isClosing() ? 'none' : 'auto',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {shouldRender() && (
        <div ref={contentRef} class="collapse__inner">
          {local.children}
        </div>
      )}
    </div>
  );
}
