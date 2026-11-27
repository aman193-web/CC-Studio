import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { gsap } from 'gsap';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import type { Issue, WorkItem } from './data';
import { AriaPlanPanel } from './AriaPlanPanel';
import type { AriaControls } from './AriaPlanPanel';
import { ActivityPanel } from './IssueDetailsWorkspace';
import { AriaDisclosure } from './AriaDisclosure';
import { IssueContext } from './IssueContext';
import { StatusBadge } from './IssueHierarchy';
import { ancestors, workTypeOf } from './issueModel';

function CommittedTask({ task }: { task: WorkItem }) {
  return (
    <AriaDisclosure className={`sw-task ${task.status === 'Completed' ? 'is-complete' : ''}`}>
      <summary>
        <ChevronDown size={14} />
        <span className="sw-task-name">
          {task.title}
          <small>
            {task.subtasks.length
              ? `${task.subtasks.filter((s) => s.status === 'Completed').length}/${task.subtasks.length} subtasks complete`
              : 'Implementation task'}
          </small>
        </span>
        <StatusBadge issue={task} />
      </summary>
      <div className="sw-task-body">
        {task.description && <p>{task.description}</p>}
        {task.subtasks.map((subtask) => (
          <div className="sw-subtask" key={subtask.id}>
            <span className={subtask.status === 'Completed' ? 'done' : ''}>
              {subtask.status === 'Completed' ? <CheckCircle2 size={14} /> : <i />}
            </span>
            <span>{subtask.title}</span>
            <small>
              {subtask.status === 'AI Working'
                ? 'Working'
                : subtask.status === 'Completed'
                  ? 'Done'
                  : 'To do'}
            </small>
          </div>
        ))}
      </div>
    </AriaDisclosure>
  );
}

export function SplitIssueWorkspace({
  issue,
  issues,
  header,
  controls,
  onOpen,
  onChange,
}: {
  issue: Issue;
  issues: Issue[];
  header: ReactNode;
  controls: AriaControls;
  onOpen: (id: number) => void;
  onChange: (changes: Partial<Issue>) => void;
}) {
  const [mobileTab, setMobileTab] = useState<'issue' | 'aria'>(issue.run ? 'aria' : 'issue');
  const tasks = useRef<HTMLElement>(null);
  const descendants = issues.filter((item) =>
    ancestors(item, issues).some((parent) => parent.id === issue.id),
  );
  const groups = [issue, ...descendants].filter((item) => item.workItems?.length);
  const work = groups.flatMap((item) => item.workItems || []);
  const completed = work.filter((item) => item.status === 'Completed').length;
  const taskMotion = useRef<HTMLDivElement>(null);
  const workspace = useRef<HTMLDivElement>(null);
  const workKey = work.map((item) => item.id).join(',');
  const phase = issue.run?.phase;
  const lastRun = useRef(issue.run?.id);
  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.from(
          '.sw-issue-scroll .cc-detail-kicker, .sw-issue-scroll h1, .sw-issue-scroll .cc-description-section, .sw-issue-scroll .cc-header-properties',
          {
            opacity: 0,
            y: 8,
            stagger: 0.055,
            duration: 0.4,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          },
        );
      }, workspace);
      return () => context.revert();
    });
    return () => mm.revert();
  }, [issue.id]);
  useLayoutEffect(() => {
    if (!workKey) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        gsap.from('.sw-task', {
          opacity: 0,
          x: 12,
          stagger: 0.07,
          duration: 0.35,
          ease: 'power2.out',
          clearProps: 'opacity,transform',
        });
      }, taskMotion);
      return () => context.revert();
    });
    return () => mm.revert();
  }, [workKey]);
  useLayoutEffect(() => {
    if (phase && phase !== 'idle') return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const button = workspace.current?.querySelector<HTMLButtonElement>('.sw-start-row .ap-start');
      let enter: () => void, leave: () => void;
      const context = gsap.context(() => {
        gsap.from(
          '.sw-ai .ap-idle .ap-heading, .sw-ai .ap-idle > p, .sw-ai .ap-instructions, .sw-start-row',
          {
            opacity: 0,
            y: 10,
            stagger: 0.08,
            duration: 0.45,
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          },
        );
        gsap.to('.sw-ai .ap-idle .aria-avatar img', {
          y: -6,
          rotation: 3,
          duration: 2.4,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
        });
        enter = () => {
          if (button) gsap.to(button, { y: -2, duration: 0.18, overwrite: 'auto' });
        };
        leave = () => {
          if (button) gsap.to(button, { y: 0, duration: 0.22, overwrite: 'auto' });
        };
      }, workspace);
      button?.addEventListener('pointerenter', enter!);
      button?.addEventListener('pointerleave', leave!);
      button?.addEventListener('focus', enter!);
      button?.addEventListener('blur', leave!);
      return () => {
        button?.removeEventListener('pointerenter', enter!);
        button?.removeEventListener('pointerleave', leave!);
        button?.removeEventListener('focus', enter!);
        button?.removeEventListener('blur', leave!);
        if (button) gsap.killTweensOf(button);
        context.revert();
        button?.style.removeProperty('transform');
      };
    });
    return () => mm.revert();
  }, [phase]);

  useEffect(() => {
    if (issue.run?.id && issue.run.id !== lastRun.current) setMobileTab('aria');
    lastRun.current = issue.run?.id;
  }, [issue.run?.id]);
  const viewTasks = () => {
    setMobileTab('issue');
    requestAnimationFrame(() => {
      tasks.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'instant'
          : 'smooth',
        block: 'start',
      });
      tasks.current?.focus({ preventScroll: true });
    });
  };
  return (
    <div ref={workspace} className={`sw-workspace sw-tab-${mobileTab}`}>
      <div className="sw-mobile-tabs" role="group" aria-label="Workspace panel">
        <button aria-pressed={mobileTab === 'issue'} onClick={() => setMobileTab('issue')}>
          <FileText size={14} /> Issue & tasks {work.length > 0 && <span>{work.length}</span>}
        </button>
        <button aria-pressed={mobileTab === 'aria'} onClick={() => setMobileTab('aria')}>
          <Sparkles size={14} /> Aria {phase === 'plan' && <i />}
        </button>
      </div>
      <section className="sw-issue" aria-label="Issue and approved tasks">
        <div className="sw-panel-heading">
          <span>
            <FileText size={14} /> Issue details
          </span>
        </div>
        <div className="sw-issue-scroll">
          {header}
          <div className="sw-issue-content">
            <section ref={tasks} tabIndex={-1} className="sw-committed" aria-label="Issue tasks">
              <div className="sw-section-heading">
                <h2>
                  <ListChecks size={17} /> Implementation tasks
                </h2>
                <span>{work.length ? `${completed}/${work.length} complete` : 'No tasks yet'}</span>
              </div>
              {work.length ? (
                <div ref={taskMotion}>
                  <progress
                    aria-label="Issue task completion"
                    value={completed}
                    max={work.length}
                  />
                  {groups.map((group) => (
                    <div className="sw-task-group" key={group.id}>
                      {group.id !== issue.id && (
                        <button className="sw-group-link" onClick={() => onOpen(group.id)}>
                          <span>{workTypeOf(group)}</span>
                          {group.title}
                          <ChevronRight size={13} />
                        </button>
                      )}
                      {group.workItems?.map((task) => (
                        <CommittedTask key={task.id} task={task} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sw-tasks-empty">
                  <ListChecks size={22} />
                  <div>
                    <strong>From plan to progress</strong>
                    <p>Approve Aria’s plan to add tasks and subtasks here.</p>
                  </div>
                </div>
              )}
            </section>
            {descendants.length > 0 && (
              <AriaDisclosure className="sw-related">
                <summary>
                  <ChevronDown size={14} /> Related issues <span>{descendants.length}</span>
                </summary>
                {descendants.map((child) => (
                  <button key={child.id} onClick={() => onOpen(child.id)}>
                    <span>{workTypeOf(child)}</span>
                    {child.title}
                    <ChevronRight size={13} />
                  </button>
                ))}
              </AriaDisclosure>
            )}
            <IssueContext issue={issue} onChange={onChange} showTasks={false} />
          </div>
        </div>
      </section>
      <aside className="sw-ai" aria-label="Aria planning and execution">
        <div className="sw-panel-heading">
          <span>
            <Sparkles size={15} /> Aria workspace
          </span>
          <small>
            {phase === 'executing'
              ? 'Working'
              : phase === 'plan'
                ? 'Plan ready'
                : phase === 'clarification'
                  ? 'Needs input'
                  : phase === 'completed'
                    ? 'Complete'
                    : 'Ready to help'}
          </small>
        </div>
        <div className="sw-ai-scroll">
          <AriaPlanPanel issue={issue} controls={controls} tasksOnLeft onViewTasks={viewTasks} />
          {issue.run && (
            <AriaDisclosure className="sw-activity" open>
              <summary>
                <ChevronDown size={14} /> Activity{' '}
                <span>{issue.run.events?.length || 0} updates</span>
              </summary>
              <ActivityPanel issue={issue} compact />
            </AriaDisclosure>
          )}
        </div>
      </aside>
    </div>
  );
}
