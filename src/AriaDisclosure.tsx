import { useEffect, useRef } from 'react';
import type { ComponentProps } from 'react';
import { gsap } from 'gsap';
/** Native keyboard semantics with a short, interruptible disclosure transition. */
export function AriaDisclosure(props: ComponentProps<'details'>) {
  const ref = useRef<HTMLDetailsElement>(null),
    tween = useRef<gsap.core.Tween | null>(null);
  useEffect(
    () => () => {
      tween.current?.kill();
    },
    [],
  );
  return (
    <details
      {...props}
      ref={ref}
      onClick={(event) => {
        props.onClick?.(event);
        const summary = ref.current?.querySelector(':scope > summary');
        const target = event.target as HTMLElement;
        if (
          !summary?.contains(target) ||
          target.closest('input,button,a') ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
        )
          return;
        event.preventDefault();
        const el = ref.current!;
        tween.current?.kill();
        const from = el.getBoundingClientRect().height;
        if (!el.open) {
          el.open = true;
          const to = el.getBoundingClientRect().height;
          tween.current = gsap.fromTo(
            el,
            { height: from, overflow: 'hidden' },
            {
              height: to,
              duration: 0.2,
              ease: 'power2.out',
              onComplete: () => {
                el.style.height = '';
                el.style.overflow = '';
              },
            },
          );
        } else
          tween.current = gsap.to(el, {
            height: summary.getBoundingClientRect().height,
            overflow: 'hidden',
            duration: 0.18,
            ease: 'power2.in',
            onComplete: () => {
              el.open = false;
              el.style.height = '';
              el.style.overflow = '';
            },
          });
      }}
    />
  );
}
