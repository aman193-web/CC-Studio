import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Circle,
  Code2,
  FileCode2,
  GitPullRequest,
  List,
  LoaderCircle,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { taskPlan } from './data';
import type { Issue, Run, Task } from './data';
const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');
export function AriaAvatar({ small = false, large = false }: { small?: boolean; large?: boolean }) {
  return (
    <span className={cx('aria-avatar', small && 'small', large && 'large')}>
      <img
        src="/assets/aria-avatar.png"
        alt="Aria"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
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
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const el = ref.current!;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (
      el.querySelector(
        drawer ? 'input, textarea' : '[autofocus], input, textarea, button',
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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={cx('modal', wide && 'wide', drawer && 'cc-create-drawer')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            aria-label={drawer ? 'Close new issue sidebar' : 'Close dialog'}
            onClick={onClose}
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

export function AriaWorkspace({
  issue,
  onClose,
  onStart,
  onRunUpdate,
  onApprove,
  onDone,
}: {
  issue: Issue;
  onClose: () => void;
  onStart: (instructions: string) => void;
  onRunUpdate: (changes: Partial<Run>) => void;
  onApprove: () => void;
  onDone: () => void;
}) {
  const [instructions, setInstructions] = useState(issue.run?.instructions || '');
  const [answer, setAnswer] = useState('session');
  const [custom, setCustom] = useState('');
  const [expanded, setExpanded] = useState<number | null>(1);
  const [showSummary, setShowSummary] = useState(false);
  const phase = issue.run?.phase || 'idle';
  const tasks = issue.run?.tasks || [];
  const enabled = tasks.filter((t) => t.enabled);
  const stage =
    phase === 'idle'
      ? 0
      : ['analyzing', 'clarification'].includes(phase)
        ? 1
        : phase === 'plan'
          ? 2
          : phase === 'executing'
            ? 3
            : 4;
  const editTask = (id: number, changes: Partial<Task>) =>
    onRunUpdate({ tasks: tasks.map((t) => (t.id === id ? { ...t, ...changes } : t)) });
  return (
    <section id="issue-aria-workflow" className="cc-inline-aria" aria-label="Aria workflow">
      <div className="aria-modal-body">
        <div className="workflow-source">
          <span>Created in {issue.source === 'Studio' ? 'CC Studio' : 'GitLab'}</span>
          <span>GitLab ticket #{issue.id}</span>
        </div>
        <div className="aria-steps">
          {['Context', 'Analyze', 'Approve', 'Execute', 'Review'].map((s, i) => (
            <div key={s} className={cx(i === stage && 'current', i < stage && 'complete')}>
              <span>{i < stage ? <Check size={12} /> : i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        {phase === 'idle' && (
          <div className="aria-stage">
            <div className="aria-greeting">
              <AriaAvatar large />
              <h2>Let’s make a plan.</h2>
              <p>
                I’ll turn this issue into a focused plan. <br />
                You’ll have the final say before I start.
              </p>
            </div>
            <div className="context-card">
              <FileCode2 size={18} />
              <div>
                <strong>{issue.title}</strong>
                <p>
                  {issue.description ||
                    'Add optional instructions below to give Aria more context.'}
                </p>
              </div>
            </div>
            <label className="instructions-label">
              Anything else I should know?<span className="optional">Optional</span>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Reuse the existing components and keep changes small…"
              />
            </label>
          </div>
        )}
        {phase === 'analyzing' && (
          <div className="aria-stage analyzing-stage">
            <div className="aria-greeting compact-greeting">
              <AriaAvatar large />
              <h2>Connecting the dots…</h2>
              <p>Turning your issue and instructions into a focused plan.</p>
            </div>
            <div className="analysis-list">
              <p>
                <CheckCircle2 size={16} />
                Reading the issue and your context
              </p>
              <p>
                <LoaderCircle size={16} className="spin" />
                Mapping the work into small tasks
              </p>
              <p className="muted">
                <Circle size={16} />
                Preparing your plan for review
              </p>
            </div>
            <div className="animated-progress">
              <i />
            </div>
            <small>Usually just a few seconds</small>
          </div>
        )}
        {phase === 'clarification' && (
          <div className="aria-stage">
            <div className="question-heading">
              <AriaAvatar />
              <div>
                <span className="eyebrow">ONE QUICK QUESTION</span>
                <h2>How long should filters be remembered?</h2>
              </div>
            </div>
            <p className="question-copy">
              There are a couple of good ways to handle this. Your preference will help me choose
              the right approach.
            </p>
            <fieldset className="answer-options">
              <legend className="sr-only">Filter persistence preference</legend>
              {[
                {
                  value: 'session',
                  title: 'While the browser is open',
                  desc: 'Remember filters during the current session.',
                  badge: 'Recommended',
                },
                {
                  value: 'persistent',
                  title: 'Across browser sessions',
                  desc: 'Keep preferences on this device, even after closing the browser.',
                },
                {
                  value: 'custom',
                  title: 'I have something else in mind',
                  desc: 'Tell Aria how you’d like it to work.',
                },
              ].map((o) => (
                <label key={o.value} className={answer === o.value ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="answer"
                    value={o.value}
                    checked={answer === o.value}
                    onChange={() => setAnswer(o.value)}
                  />
                  <span>
                    <strong>
                      {o.title}
                      {o.badge && <em>{o.badge}</em>}
                    </strong>
                    <small>{o.desc}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="instructions-label">
              Additional context
              <span className="optional">{answer === 'custom' ? 'Required' : 'Optional'}</span>
              <textarea
                rows={3}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Add a preference or a detail Aria should consider…"
              />
            </label>
          </div>
        )}
        {phase === 'plan' && (
          <div className="aria-stage">
            <div className="question-heading">
              <AriaAvatar />
              <div>
                <span className="eyebrow">PLAN BEFORE CODE</span>
                <h2>Review your plan</h2>
              </div>
            </div>
            <p className="question-copy">
              Review the work below, adjust the assignments, and approve when you’re happy.
            </p>
            {issue.run?.answer && (
              <div className="answer-summary">
                <Check size={14} />
                {issue.run.answer}
              </div>
            )}
            <div className="plan-meta">
              <span>
                <List size={14} />
                {enabled.length} tasks selected
              </span>
              <span>
                <Sparkles size={14} />
                Aria handles every task
              </span>
            </div>
            <div className="plan-tasks">
              {tasks.map((t, index) => (
                <div key={t.id} className={cx('plan-task', !t.enabled && 'excluded')}>
                  <div className="plan-task-title">
                    <input
                      type="checkbox"
                      aria-label={`Include ${t.title}`}
                      checked={t.enabled}
                      onChange={(e) => editTask(t.id, { enabled: e.target.checked })}
                    />
                    <button
                      onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                      aria-expanded={expanded === t.id}
                    >
                      <span className="task-number">0{index + 1}</span>
                      <strong>{t.title}</strong>
                      <ChevronDown size={15} />
                    </button>
                  </div>
                  {expanded === t.id && (
                    <div className="task-description">
                      <p>{t.detail}</p>
                      <ul>
                        {(t.subtasks || taskPlan(issue.title)[index].subtasks || []).map(
                          (subtask) => (
                            <li key={subtask}>{subtask}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                  <div className="task-assignment">
                    <span>
                      <Code2 size={13} />
                      Coding agent
                    </span>
                    <strong className="cc-task-agent">Aria</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="approval-note">
              <ShieldCheck size={17} />
              <span>You’re in control. Aria will only execute the tasks you approve.</span>
            </div>
          </div>
        )}
        {(phase === 'executing' || phase === 'completed') && (
          <div className="aria-stage">
            <div className="aria-greeting compact-greeting">
              {phase === 'completed' ? (
                <span className="completion-icon">
                  <CheckCheck size={28} />
                </span>
              ) : (
                <AriaAvatar large />
              )}
              <h2>{phase === 'completed' ? 'Ready for your review' : 'Aria is working on it'}</h2>
              <p>
                {phase === 'completed'
                  ? 'The tasks are complete and ready for your review.'
                  : 'Aria is working through your approved plan. You can keep browsing.'}
              </p>
            </div>
            <div className="execution-summary" role="status">
              <span>
                {issue.run!.step} of {enabled.length} tasks complete
              </span>
              <strong>{Math.round((issue.run!.step / Math.max(enabled.length, 1)) * 100)}%</strong>
            </div>
            <div className="execution-progress">
              <i style={{ width: `${(issue.run!.step / Math.max(enabled.length, 1)) * 100}%` }} />
            </div>
            <div className="execution-tasks">
              {enabled.map((t, i) => (
                <div key={t.id} className={i < issue.run!.step ? 'done' : ''}>
                  {i < issue.run!.step ? (
                    <CheckCircle2 size={20} />
                  ) : i === issue.run!.step ? (
                    <LoaderCircle className="spin" size={20} />
                  ) : (
                    <Circle size={20} />
                  )}
                  <div>
                    <strong>{t.title}</strong>
                    <small>
                      {'Aria'} ·{' '}
                      {i < issue.run!.step
                        ? 'Completed'
                        : i === issue.run!.step
                          ? 'In progress'
                          : 'Queued'}
                    </small>
                  </div>
                </div>
              ))}
            </div>
            {phase === 'completed' && (
              <div className="result-card">
                <div>
                  <GitPullRequest size={19} />
                  <strong>Ready for a human review</strong>
                </div>
                <p>Review the completed tasks before marking this issue as done.</p>
                <button className="text-button" onClick={() => setShowSummary(!showSummary)}>
                  {showSummary ? 'Hide' : 'View'} task summary
                  <ChevronDown size={14} />
                </button>
                {showSummary && (
                  <ul>
                    {enabled.map((t) => (
                      <li key={t.id}>{t.title} — completed</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="modal-footer aria-modal-footer">
        <span>
          <ShieldCheck size={14} />
          {phase === 'completed' ? 'Review before closing the issue' : 'Your approval comes first'}
        </span>
        {phase === 'idle' ? (
          <button className="button primary" onClick={() => onStart(instructions)}>
            <Sparkles size={15} />
            Analyze & create plan
          </button>
        ) : phase === 'analyzing' ? (
          <button className="button" onClick={onClose}>
            Continue browsing
          </button>
        ) : phase === 'clarification' ? (
          <button
            className="button primary"
            disabled={answer === 'custom' && !custom.trim()}
            onClick={() =>
              onRunUpdate({
                phase: 'plan',
                answer:
                  `${answer === 'session' ? 'Remember filters for the current session.' : answer === 'persistent' ? 'Remember filters across browser sessions.' : ''} ${custom}`.trim(),
              })
            }
          >
            Confirm & review plan
          </button>
        ) : phase === 'plan' ? (
          <button className="button primary" disabled={!enabled.length} onClick={onApprove}>
            <Play size={14} />
            Approve & start {enabled.length} tasks
          </button>
        ) : phase === 'executing' ? (
          <button className="button" onClick={onClose}>
            Continue browsing
          </button>
        ) : (
          <button className="button primary" disabled={issue.status === 'Done'} onClick={onDone}>
            <CheckCheck size={15} />
            {issue.status === 'Done' ? 'Issue completed' : 'Mark issue as done'}
          </button>
        )}
      </div>
    </section>
  );
}
