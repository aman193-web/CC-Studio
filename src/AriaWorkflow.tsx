import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';
import { ArrowLeft, Sparkles, X } from 'lucide-react';
const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');
export function AriaAvatar({
  small = false,
  large = false,
  playful = false,
}: {
  small?: boolean;
  large?: boolean;
  playful?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reaction = useRef<gsap.core.Timeline | null>(null);
  const [loved, setLoved] = useState(false);
  useEffect(
    () => () => {
      reaction.current?.kill();
    },
    [],
  );
  const pet = () => {
    if (!playful) return;
    setLoved(true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    reaction.current?.kill();
    reaction.current = gsap
      .timeline()
      .to(ref.current, { scale: 1.1, rotation: -9, duration: 0.18, ease: 'power2.out' })
      .to(ref.current, { rotation: 9, y: -4, duration: 0.2, ease: 'sine.inOut' })
      .to(ref.current, { rotation: -5, duration: 0.2, ease: 'sine.inOut' })
      .to(ref.current, { rotation: 0, y: -2, scale: 1.06, duration: 0.3, ease: 'back.out(2)' });
  };
  const release = () => {
    if (!playful) return;
    setLoved(false);
    reaction.current?.kill();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    reaction.current = gsap
      .timeline()
      .to(ref.current, { scale: 1, rotation: 0, y: 0, duration: 0.3, clearProps: 'transform' });
  };
  return (
    <span
      ref={ref}
      className={cx(
        'aria-avatar',
        small && 'small',
        large && 'large',
        playful && 'aria-playful',
        loved && 'is-loved',
      )}
      role={playful ? 'button' : undefined}
      tabIndex={playful ? 0 : undefined}
      aria-label={playful ? 'Pet Aria' : undefined}
      onPointerEnter={pet}
      onPointerLeave={release}
      onFocus={pet}
      onBlur={release}
      onClick={pet}
      onKeyDown={(event) => {
        if (playful && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          pet();
        }
      }}
    >
      <img
        src="/assets/aria-avatar.png"
        alt={playful ? '' : 'Aria'}
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
      <Sparkles className="avatar-fallback" size={small ? 15 : 22} />
    </span>
  );
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  drawer = false,
  className,
  headerActions,
  closeLabel,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  drawer?: boolean;
  className?: string;
  headerActions?: ReactNode;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  const close = useRef(onClose);
  const closing = useRef(false);
  const closeTween = useRef<gsap.core.Tween | null>(null);
  const dismiss = () => {
    if (closing.current) return;
    closing.current = true;
    if (!drawer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    closeTween.current = gsap.to(ref.current, {
      x: '100%',
      duration: 0.2,
      ease: 'power2.in',
      onComplete: onClose,
    });
  };
  close.current = dismiss;
  useEffect(
    () => () => {
      closeTween.current?.kill();
    },
    [],
  );
  useEffect(() => {
    const el = ref.current!;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (
      el.querySelector(
        drawer ? 'input, textarea, button' : '[autofocus], input, textarea, button',
      ) as HTMLElement
    )?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab') {
        const list = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), textarea, select, [tabindex="0"], a[href]',
          ),
        ).filter((x) => x.offsetParent !== null);
        if (!list.length) return;
        if (e.shiftKey && document.activeElement === list[0]) {
          e.preventDefault();
          list.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === list.at(-1)) {
          e.preventDefault();
          list[0].focus();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = bodyOverflow;
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    };
  }, []);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(
        ref.current,
        drawer
          ? {
              x: '100%',
              duration: 0.32,
              ease: 'power3.out',
            }
          : {
              opacity: 0,
              y: 12,
              scale: 0.985,
              duration: 0.25,
              ease: 'power2.out',
            },
      );
    });
    return () => mm.revert();
  }, [drawer]);
  return (
    <div
      className={cx('modal-backdrop', drawer && 'cc-drawer-backdrop')}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div
        ref={ref}
        className={cx('modal', wide && 'wide', drawer && 'cc-create-drawer', className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {headerActions}
          <button
            className="icon-button"
            aria-label={closeLabel || (drawer ? 'Close new issue sidebar' : 'Close dialog')}
            onClick={dismiss}
          >
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function IssueActionView({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: ReactNode;
}) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    titleRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section className="cc-fullscreen-page cc-embedded-action" aria-label={title}>
      <header className="cc-fullscreen-topbar">
        <button className="cc-back-button" onClick={onBack}>
          <ArrowLeft size={17} />
          Back to issue
        </button>
      </header>
      <div className="cc-fullscreen-content">
        <header className="cc-fullscreen-heading">
          <h1 ref={titleRef} tabIndex={-1}>
            {title}
          </h1>
          {subtitle && <p>{subtitle}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}
