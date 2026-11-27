import { AriaDisclosure } from './AriaDisclosure';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { gsap } from 'gsap';
import {
  Activity,
  ArrowDown,
  Check,
  ChevronDown,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { Issue } from './data';
import type { AriaEvent, WorkspacePreference } from './ariaTypes';
const animatedEvents = new Set<string>();
function ActivityEntry({ event }: { event: AriaEvent }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (animatedEvents.has(event.id)) return;
    animatedEvents.add(event.id);
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(
        () => gsap.from(ref.current, { opacity: 0, y: 5, duration: 0.2 }),
        ref,
      );
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [event.id]);
  return (
    <div ref={ref} className={`aa-entry ${event.kind}`}>
      <span className="aa-event-icon">
        {event.kind === 'error' ? (
          <AlertCircle size={14} />
        ) : event.kind === 'verification' ? (
          <Check size={14} />
        ) : (
          <Sparkles size={13} />
        )}
      </span>
      <div>
        <p>{event.message}</p>
        {event.details?.length ? (
          <AriaDisclosure>
            <summary>
              <ChevronDown size={12} />{' '}
              {event.details.length === 1 ? 'View details' : `${event.details.length} details`}
            </summary>
            <ul>
              {event.details.map((d, n) => (
                <li key={n}>{d}</li>
              ))}
            </ul>
          </AriaDisclosure>
        ) : null}
        <time>
          {new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>
    </div>
  );
}
function ActivityPanel({ issue }: { issue: Issue }) {
  const scroll = useRef<HTMLDivElement>(null),
    nearBottom = useRef(true);
  const [unseen, setUnseen] = useState(false);
  const runs = [...(issue.runHistory || []), ...(issue.run ? [issue.run] : [])].filter(
    (r) => r.events?.length,
  );
  const count = runs.reduce((n, r) => n + (r.events?.length || 0), 0);
  useEffect(() => {
    if (nearBottom.current) {
      scroll.current?.scrollTo({ top: scroll.current.scrollHeight });
      setUnseen(false);
    } else setUnseen(true);
  }, [count]);
  const active = issue.run?.phase === 'analyzing' || issue.run?.phase === 'executing';
  return (
    <>
      <div
        ref={scroll}
        className="aa-feed"
        onScroll={() => {
          const el = scroll.current!;
          nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 55;
          if (nearBottom.current) setUnseen(false);
        }}
      >
        <p className="aa-demo-note">
          Demonstration activity · repository tools are not connected to this run.
        </p>
        {runs.length ? (
          runs.map((run, n) => (
            <section key={run.id || n} className="aa-attempt">
              <div className="aa-attempt-label">
                Attempt {n + 1}{' '}
                <span>
                  {run.phase === 'completed'
                    ? 'Complete'
                    : run.phase === 'blocked'
                      ? 'Needs attention'
                      : run.phase === 'cancelled'
                        ? 'Stopped'
                        : run.phase === 'plan'
                          ? 'Awaiting approval'
                          : run.phase === 'clarification'
                            ? 'Waiting for input'
                            : 'In progress'}
                </span>
              </div>
              {run.events?.map((e) => (
                <ActivityEntry key={e.id} event={e} />
              ))}
              {run === issue.run && active && (
                <div className="aa-current" role="status">
                  <span className="ap-active-dot" />
                  <div>
                    <strong>
                      {run.phase === 'analyzing'
                        ? 'Preparing the implementation plan'
                        : 'Working now'}
                    </strong>
                    <p>
                      {run.phase === 'executing'
                        ? run.scope?.find((s) => !s.done)?.title
                        : 'Reviewing the requirement and existing work.'}
                    </p>
                  </div>
                </div>
              )}
            </section>
          ))
        ) : (
          <div className="aa-empty">
            <Activity size={24} />
            <h3>Activity will appear here</h3>
            <p>Start with Fix with Aria to prepare a plan.</p>
          </div>
        )}
      </div>
      {unseen && (
        <button
          className="aa-jump"
          onClick={() => {
            scroll.current?.scrollTo({
              top: scroll.current.scrollHeight,
              behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
            });
            nearBottom.current = true;
            setUnseen(false);
          }}
        >
          <ArrowDown size={13} /> Jump to latest
        </button>
      )}
    </>
  );
}
export function IssueDetailsWorkspace({
  issue,
  preference,
  onPreference,
  children,
}: {
  issue: Issue;
  preference: WorkspacePreference;
  onPreference: (p: WorkspacePreference) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null),
    divider = useRef<HTMLDivElement>(null),
    drag = useRef(false);
  const [mobileTab, setMobileTab] = useState('details');
  const open = !preference.collapsed;
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 851px) and (prefers-reduced-motion: no-preference)', () => {
      const el = ref.current!;
      const width = el.clientWidth;
      const left = (width * preference.ratio) / 100;
      const right = Math.max(0, width - left - 8);
      const ctx = gsap.context(
        () =>
          gsap.fromTo(
            el,
            { gridTemplateColumns: open ? `${width}px 0px 0px` : `${left}px 8px ${right}px` },
            {
              gridTemplateColumns: open ? `${left}px 8px ${right}px` : `${width}px 0px 0px`,
              duration: 0.25,
              ease: 'power2.out',
              clearProps: 'grid-template-columns',
            },
          ),
        ref,
      );
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, [open]);
  const toggle = () => onPreference({ ...preference, collapsed: open, explicit: true });
  return (
    <div
      className={`aw-workspace ${open ? 'activity-open' : ''} mobile-${mobileTab}`}
      ref={ref}
      style={{ '--work-ratio': `${preference.ratio}%` } as CSSProperties}
    >
      <div className="aw-mobile-tabs">
        <button aria-pressed={mobileTab === 'details'} onClick={() => setMobileTab('details')}>
          Issue details
        </button>
        <button
          aria-pressed={mobileTab === 'activity'}
          onClick={() => {
            if (!open) onPreference({ ...preference, collapsed: false, explicit: true });
            setMobileTab('activity');
          }}
        >
          Aria activity {issue.run && <span className="aw-notification" />}
        </button>
      </div>
      <div className="aw-left">
        <header className="aw-panel-heading">
          <span>Issue & implementation</span>
          <button
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? 'Collapse Aria activity' : 'Show Aria activity'}
          >
            {open ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            <span>{open ? 'Hide activity' : 'Aria activity'}</span>
          </button>
        </header>
        <div className="aw-left-scroll">{children}</div>
      </div>
      {open && (
        <>
          <div
            ref={divider}
            className="aw-divider"
            role="separator"
            aria-label="Resize issue and activity panels"
            aria-orientation="vertical"
            aria-valuemin={40}
            aria-valuemax={75}
            aria-valuenow={preference.ratio}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                onPreference({
                  ...preference,
                  ratio: Math.min(
                    75,
                    Math.max(40, preference.ratio + (e.key === 'ArrowRight' ? 2 : -2)),
                  ),
                });
              }
            }}
            onPointerDown={(e) => {
              drag.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const box = ref.current!.getBoundingClientRect();
              onPreference({
                ...preference,
                ratio: Math.min(75, Math.max(40, ((e.clientX - box.left) / box.width) * 100)),
              });
            }}
            onPointerUp={(e) => {
              drag.current = false;
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              drag.current = false;
            }}
          >
            <i />
          </div>
          <aside className="aw-right" aria-label="Aria activity">
            <header className="aw-panel-heading">
              <span>
                <Activity size={15} /> Aria Activity
              </span>
              <span className="aa-readonly">Read only</span>
            </header>
            <ActivityPanel issue={issue} />
          </aside>
        </>
      )}
    </div>
  );
}
