import { AriaDisclosure } from './AriaDisclosure';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, CSSProperties } from 'react';
import { gsap } from 'gsap';
import { AriaAvatar } from './AriaWorkflow';
import { planTasks } from './ariaDemo';
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
import type { Issue, Phase } from './data';
import type { AriaEvent, WorkspacePreference } from './ariaTypes';
const animatedEvents = new Set<string>();
const eventLabels = {
  analysis: 'Planning',
  execution: 'Execution',
  verification: 'Task outcome',
  error: 'Needs attention',
  approval: 'Approval',
};
const phaseContext: Record<Phase, { title: string; description: string }> = {
  idle: {
    title: 'Ready when you are',
    description:
      'Aria turns this requirement into a focused plan. You review the scope before work starts.',
  },
  analyzing: {
    title: 'Preparing your plan',
    description:
      'Organizing the requirement, existing tasks and your instructions into a proposed scope.',
  },
  clarification: {
    title: 'Your input is needed',
    description:
      'Answer the question in the issue panel so Aria can finish the plan. No work starts while waiting.',
  },
  plan: {
    title: 'Ready for your approval',
    description:
      'Review the proposed tasks in the issue panel. Adjust the scope or request changes before approving.',
  },
  executing: {
    title: 'Working through the plan',
    description:
      'Following the approved scope in dependency order. Completed tasks are retained if work is interrupted.',
  },
  blocked: {
    title: 'Attention needed',
    description: 'Work is paused. Review the blocker in the issue panel to decide how to continue.',
  },
  cancelled: {
    title: 'Work is paused',
    description:
      'Completed work is preserved. Resume the remaining tasks or prepare a revised plan.',
  },
  completed: {
    title: 'Approved work finished',
    description: 'Review the task outcomes and implementation summary in the issue panel.',
  },
};
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
        <div className="aa-event-meta">
          <strong>{eventLabels[event.kind]}</strong>
          <time dateTime={event.at}>
            {new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
        <p className="aa-event-title">{event.message}</p>
        {event.details?.[0] && <p className="aa-event-context">{event.details[0]}</p>}
        {(event.details?.length || 0) > 1 && (
          <AriaDisclosure className="aa-event-details">
            <summary>
              <ChevronDown size={13} /> More context · {event.details!.length - 1}
            </summary>
            <ul>
              {event.details!.slice(1).map((d, n) => (
                <li key={n}>{d}</li>
              ))}
            </ul>
          </AriaDisclosure>
        )}
      </div>
    </div>
  );
}
export function ActivityPanel({ issue, compact = false }: { issue: Issue; compact?: boolean }) {
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
  const context = phaseContext[issue.run?.phase || 'idle'];
  const completed = issue.run?.scope?.filter((item) => item.done).length || 0;
  const total = issue.run?.scope?.length || planTasks(issue.run?.plan).length;

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
        {!compact && (
          <section
            className={`aa-overview aa-phase-${issue.run?.phase || 'idle'}`}
            aria-label="Current Aria status"
          >
            <div className="aa-overview-heading">
              <AriaAvatar small />
              <div>
                <span>ARIA WORKSPACE</span>
                <h2>{context.title}</h2>
              </div>
            </div>
            <p>{context.description}</p>
            {issue.run?.plan && (
              <div className="aa-run-stats">
                <span>
                  Plan <strong>v{issue.run.plan.version}</strong>
                </span>
                <span>
                  <strong>{total}</strong> {issue.run.scope ? 'approved tasks' : 'selected tasks'}
                </span>
                {issue.run.scope && (
                  <span>
                    <strong>
                      {completed}/{total}
                    </strong>{' '}
                    complete
                  </span>
                )}
              </div>
            )}
            {issue.run?.scope && (
              <progress aria-label="Approved tasks completed" value={completed} max={total || 1} />
            )}
            {issue.run?.plan && (
              <AriaDisclosure className="aa-plan-context">
                <summary>
                  <ChevronDown size={13} /> Scope & verification
                </summary>
                <div>
                  <h3>Intended outcome</h3>
                  <p>{issue.run.plan.outcome}</p>
                  <h3>Planned checks</h3>
                  <ul>
                    {issue.run.plan.verification.map((check, i) => (
                      <li key={i}>{check}</li>
                    ))}
                  </ul>
                </div>
              </AriaDisclosure>
            )}
          </section>
        )}
        <div className="aa-timeline-heading">
          <h3>Activity timeline</h3>
          <span>
            {count} {count === 1 ? 'update' : 'updates'}
          </span>
        </div>
        {runs.length ? (
          runs.map((run, n) => (
            <section key={run.id || n} className="aa-attempt">
              <div className="aa-attempt-label">
                <strong>
                  Run {n + 1}
                  {run.plan ? ` · Plan v${run.plan.version}` : ''}
                </strong>{' '}
                <span>
                  {run.phase === 'completed'
                    ? 'Complete'
                    : run.phase === 'blocked'
                      ? 'Needs attention'
                      : run.phase === 'cancelled'
                        ? 'Stopped'
                        : run.phase === 'plan'
                          ? 'Plan ready'
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
                        : run.events?.at(-1)?.message ||
                          'Reviewing the requirement and existing work.'}
                    </p>
                  </div>
                </div>
              )}
            </section>
          ))
        ) : (
          <div className="aa-empty">
            <Activity size={24} />
            <h3>No activity yet</h3>
            <p>
              Select <strong>Fix with Aria</strong> to begin. Planning updates, your approvals and
              task outcomes will appear here as they happen.
            </p>
            <div className="aa-empty-stages">
              <span>Plan the work</span>
              <span>Review & approve</span>
              <span>Follow progress</span>
            </div>
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
