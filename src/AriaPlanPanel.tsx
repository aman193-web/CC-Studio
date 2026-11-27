import { AriaDisclosure } from './AriaDisclosure';
import { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  LoaderCircle,
  Pencil,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  GitBranch,
} from 'lucide-react';
import type { Issue, Run } from './data';
import type { AriaPlan, ProposedGroup, ProposedTask } from './ariaTypes';
import { AriaAvatar } from './AriaWorkflow';
import { useIssueMotion } from './IssueHierarchy';
import { planTasks } from './ariaDemo';
import { workTypeOf } from './issueModel';
export interface AriaControls {
  start: (instructions?: string) => void;
  update: (changes: Partial<Run>) => void;
  approve: () => void;
  answer: (text: string) => void;
  revise: (text: string) => void;
  control: (action: 'retry' | 'cancel') => void;
}
function TaskRow({
  task,
  onChange,
  locked,
  done,
  active,
}: {
  task: ProposedTask;
  onChange: (task: ProposedTask) => void;
  locked: boolean;
  done?: boolean;
  active?: boolean;
}) {
  const [edit, setEdit] = useState(false);
  return (
    <AriaDisclosure className={`ap-task ${done || task.completed ? 'is-done' : ''}`}>
      <summary>
        <ChevronDown size={14} />
        {locked || task.completed ? (
          <span className={active ? 'ap-active-dot' : ''}>
            {done || task.completed ? (
              <CheckCircle2 size={15} />
            ) : !active ? (
              <span className="ap-empty-dot" />
            ) : null}
          </span>
        ) : (
          <input
            type="checkbox"
            aria-label={`Include ${task.title}`}
            checked={task.enabled}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onChange({ ...task, enabled: e.target.checked })}
          />
        )}
        <span>{task.title}</span>
        {task.completed ? (
          <small>Previously completed</small>
        ) : task.existingWorkId ? (
          <small>Existing work</small>
        ) : !locked ? (
          <small>Proposed</small>
        ) : null}
      </summary>
      <div className="ap-task-body">
        {edit ? (
          <>
            <label>
              Task title
              <input
                aria-label="Proposed task title"
                value={task.title}
                onChange={(e) => onChange({ ...task, title: e.target.value })}
              />
            </label>
            <label>
              Description
              <textarea
                value={task.description}
                onChange={(e) => onChange({ ...task, description: e.target.value })}
              />
            </label>
            <button className="text-button" onClick={() => setEdit(false)}>
              Done editing
            </button>
          </>
        ) : (
          <>
            <p>{task.description}</p>
            {!locked && !task.existingWorkId && (
              <button className="text-button" onClick={() => setEdit(true)}>
                <Pencil size={12} /> Edit
              </button>
            )}
          </>
        )}
        {task.subtasks.length > 0 && (
          <ul>
            {task.subtasks.map((s, n) => (
              <li key={n}>{s}</li>
            ))}
          </ul>
        )}
        {!!task.dependencies.length && <small>Runs after the preceding prerequisite work.</small>}
      </div>
    </AriaDisclosure>
  );
}
function Group({
  group,
  onChange,
  locked,
  run,
}: {
  group: ProposedGroup;
  onChange: (group: ProposedGroup) => void;
  locked: boolean;
  run: Run;
}) {
  const [edit, setEdit] = useState(false);
  const changeTask = (task: ProposedTask) => {
    let tasks = group.tasks.map((t) => (t.id === task.id ? task : t));
    if (!task.enabled) {
      const excluded = new Set([task.id]);
      for (const t of tasks) if (t.dependencies.some((id) => excluded.has(id))) excluded.add(t.id);
      tasks = tasks.map((t) => (excluded.has(t.id) ? { ...t, enabled: false } : t));
    } else {
      const seen = new Set<string>();
      const include = (id: string) => {
        if (seen.has(id)) return;
        seen.add(id);
        const t = tasks.find((t) => t.id === id);
        if (t && !t.completed) {
          t.enabled = true;
          t.dependencies.forEach(include);
        }
      };
      tasks = tasks.map((t) => ({ ...t }));
      task.dependencies.forEach(include);
    }
    onChange({ ...group, tasks });
  };
  return (
    <AriaDisclosure className="ap-group" open>
      <summary>
        {group.contextTitle && (
          <span className="ap-parent-context">
            <span className={`cc-type ${group.contextType?.toLowerCase()}`}>
              {group.contextType}
            </span>
            {group.contextTitle}
          </span>
        )}
        <ChevronDown size={14} />
        {!locked && !group.completed && (
          <input
            type="checkbox"
            aria-label={`Include ${group.title}`}
            checked={group.enabled}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onChange({ ...group, enabled: e.target.checked })}
          />
        )}
        <span className={`cc-type ${group.type.toLowerCase()}`}>{group.type}</span>
        <strong>{group.title}</strong>
        <small>
          {group.completed
            ? 'Previously completed'
            : group.id.startsWith('existing-')
              ? 'Existing work'
              : locked
                ? 'Created by Aria'
                : 'Proposed by Aria'}
        </small>
      </summary>
      {!group.issueId && !locked && (
        <div className="ap-group-edit">
          {edit ? (
            <>
              <input
                aria-label="Proposed Story title"
                value={group.title}
                onChange={(e) => onChange({ ...group, title: e.target.value })}
              />
              <textarea
                aria-label="Proposed Story description"
                value={group.description}
                onChange={(e) => onChange({ ...group, description: e.target.value })}
              />
              <button className="text-button" onClick={() => setEdit(false)}>
                Done editing
              </button>
            </>
          ) : (
            <button className="text-button" onClick={() => setEdit(true)}>
              <Pencil size={12} /> Edit Story
            </button>
          )}
        </div>
      )}
      {group.tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          locked={locked || !group.enabled}
          onChange={changeTask}
          done={
            run.scope?.find(
              (s) =>
                s.workItemId === task.existingWorkId || s.workItemId === `${run.planId}-${task.id}`,
            )?.done
          }
          active={
            run.phase === 'executing' && run.scope?.find((s) => !s.done)?.title === task.title
          }
        />
      ))}
      {group.completed && !group.tasks.length && (
        <p className="ap-preserved">This completed requirement will be preserved.</p>
      )}
    </AriaDisclosure>
  );
}
export function CodeChangesPanel({ run }: { run: Run }) {
  const artifacts = run.artifacts?.filter((a) => /^https:\/\//.test(a.url)) || [];
  return (
    <AriaDisclosure className="ap-code">
      <summary>
        <GitBranch size={15} /> Code changes{' '}
        <span>
          {artifacts.length ? `${artifacts.length} artifacts` : 'No repository artifacts'}
        </span>
      </summary>
      {artifacts.length ? (
        artifacts.map((a) => (
          <AriaDisclosure key={a.id} className="ap-artifact">
            <summary>
              {a.provider || 'Repository'} · {a.reference || a.kind}
              {a.issueId && <span>Issue #{a.issueId}</span>}
            </summary>
            <dl>
              {a.repository && (
                <>
                  <dt>Repository</dt>
                  <dd>{a.repository}</dd>
                </>
              )}
              {a.targetBranch && (
                <>
                  <dt>Target branch</dt>
                  <dd>{a.targetBranch}</dd>
                </>
              )}
              {a.implementationBranch && (
                <>
                  <dt>Implementation branch</dt>
                  <dd>{a.implementationBranch}</dd>
                </>
              )}
              {a.sha && (
                <>
                  <dt>Commit</dt>
                  <dd>{a.sha.slice(0, 8)}</dd>
                </>
              )}
              {a.changedFileCount != null && (
                <>
                  <dt>Changed files</dt>
                  <dd>{a.changedFileCount}</dd>
                </>
              )}
              {a.verification && (
                <>
                  <dt>Verification</dt>
                  <dd>{a.verification}</dd>
                </>
              )}
            </dl>
            <a href={a.url} target="_blank" rel="noreferrer">
              {a.kind === 'merge-request'
                ? 'View Merge Request'
                : a.kind === 'pull-request'
                  ? 'View Pull Request'
                  : a.kind === 'commit'
                    ? 'View Commit'
                    : 'View Code Changes'}
            </a>
          </AriaDisclosure>
        ))
      ) : (
        <p>
          No code changes to show yet. Branches, commits and merge requests will appear here when
          available.
        </p>
      )}
    </AriaDisclosure>
  );
}
export function AriaPlanPanel({ issue, controls }: { issue: Issue; controls: AriaControls }) {
  const run = issue.run,
    phase = run?.phase || 'idle';
  const [instructions, setInstructions] = useState('');
  const [revision, setRevision] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const ref = useIssueMotion(phase + String(run?.plan?.version));
  const plan = run?.plan;
  const selected = planTasks(plan);
  const done = run?.scope?.filter((s) => s.done).length || 0,
    total = run?.scope?.length || 0;
  const setPlan = (next: AriaPlan) => controls.update({ plan: next });
  const completedPreserved =
    plan?.groups.reduce((n, g) => n + g.tasks.filter((t) => t.completed).length, 0) || 0;
  const running = phase === 'executing';
  return (
    <section
      ref={ref}
      className={`ap-panel${phase === 'idle' ? ' ap-idle' : ''}`}
      id="issue-aria-workflow"
      aria-label="Aria implementation"
    >
      <div className="ap-heading">
        <AriaAvatar small />
        <div>
          <span className="ap-eyebrow">YOUR CODING TEAMMATE</span>
          <h2>
            {phase === 'idle'
              ? 'Let Aria take it from here'
              : phase === 'analyzing'
                ? 'Aria is preparing a plan'
                : phase === 'clarification'
                  ? 'Aria needs your input'
                  : phase === 'plan'
                    ? 'Aria’s Proposed Plan'
                    : running
                      ? 'Implementing the approved plan'
                      : phase === 'blocked'
                        ? 'Aria needs your attention'
                        : phase === 'cancelled'
                          ? 'Execution stopped'
                          : run?.partial
                            ? 'Approved work complete'
                            : 'Work complete'}
          </h2>
        </div>
        {phase === 'idle' && issue.status !== 'Completed' && (
          <button className="button primary ap-start" onClick={() => controls.start(instructions)}>
            <Sparkles size={16} /> Fix with Aria
          </button>
        )}
      </div>
      {phase === 'idle' && (
        <>
          <p>
            Aria will review this {workTypeOf(issue).toLowerCase()} and prepare a focused plan. You
            approve before work starts.
          </p>
          {issue.status === 'Completed' ? (
            <p className="ap-preserved">
              <CheckCircle2 size={15} /> This issue is already complete.
            </p>
          ) : (
            <>
              <AriaDisclosure className="ap-instructions">
                <summary>
                  Additional instructions <span>Optional</span>
                </summary>
                <textarea
                  aria-label="Additional instructions"
                  placeholder="Anything Aria should keep in mind?"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </AriaDisclosure>
            </>
          )}
        </>
      )}
      {phase === 'analyzing' && (
        <div className="ap-preparing" role="status">
          <LoaderCircle size={18} className="spin" />
          <p>{run?.events?.at(-1)?.message || 'Preparing the implementation plan.'}</p>
        </div>
      )}
      {phase === 'clarification' && run?.clarification && (
        <div className="ap-question">
          <CircleHelp size={18} />
          <div>
            <h3>{run.clarification.question}</h3>
            <p>{run.clarification.reason}</p>
            <fieldset>
              <legend className="sr-only">Choose your answer</legend>
              {run.clarification.options.map((option) => (
                <label key={option}>
                  <input
                    type={run.clarification!.multiple ? 'checkbox' : 'radio'}
                    name="clarification"
                    checked={answers.includes(option)}
                    onChange={() =>
                      setAnswers(
                        run.clarification!.multiple
                          ? answers.includes(option)
                            ? answers.filter((a) => a !== option)
                            : [...answers, option]
                          : [option],
                      )
                    }
                  />
                  {option}
                </label>
              ))}
            </fieldset>
            <textarea
              aria-label="Custom clarification answer"
              placeholder="Or add your own answer…"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <button
              className="button primary"
              disabled={!answers.length && !custom.trim()}
              onClick={() => {
                controls.answer([...answers, custom.trim()].filter(Boolean).join('; '));
                setAnswers([]);
                setCustom('');
              }}
            >
              Continue Planning
            </button>
          </div>
        </div>
      )}
      {plan && ['plan', 'executing', 'blocked', 'cancelled', 'completed'].includes(phase) && (
        <>
          {phase === 'plan' && (
            <>
              <p>{plan.approach}</p>
              {!selected.length && (
                <p className="ap-preserved">
                  No incomplete work is included. Select the work to execute, or request changes to
                  the plan.
                </p>
              )}
              <div className="ap-plan-summary">
                <span>Plan v{plan.version}</span>
                <span>{selected.length} tasks</span>
                {plan.groups.some((g) => !g.issueId) && (
                  <span>
                    {plan.groups.filter((g) => !g.issueId && g.enabled).length} proposed Stories
                  </span>
                )}
                {completedPreserved > 0 && (
                  <span>{completedPreserved} completed tasks preserved</span>
                )}
              </div>
              <AriaDisclosure className="ap-notes">
                <summary>Outcome, assumptions & verification</summary>
                <p>{plan.outcome}</p>
                <ul>
                  {[...plan.assumptions, ...plan.verification].map((s, n) => (
                    <li key={n}>{s}</li>
                  ))}
                </ul>
              </AriaDisclosure>
            </>
          )}
          {phase !== 'plan' && (
            <div className="ap-progress">
              <div>
                <strong>
                  {done} of {total} approved tasks complete
                </strong>
                <span>{total ? Math.round((done / total) * 100) : 0}%</span>
              </div>
              <progress
                aria-label="Approved task completion"
                value={done}
                max={Math.max(1, total)}
              />
              <small>
                {run?.partial
                  ? 'Other required work remains.'
                  : 'Existing completed work is preserved.'}
              </small>
            </div>
          )}
          {phase === 'blocked' && (
            <div className="ap-blocker" role="alert">
              <h3>{run?.scopeChanged ? 'A new approval is needed' : 'Verification interrupted'}</h3>
              <p>{run?.blocker}</p>
              <div>
                <button
                  className="button primary"
                  onClick={() => (run?.scopeChanged ? controls.start() : controls.control('retry'))}
                >
                  <RotateCcw size={14} />{' '}
                  {run?.scopeChanged ? 'Prepare revised plan' : 'Retry remaining work'}
                </button>
                <button className="button" onClick={() => controls.control('cancel')}>
                  Cancel execution
                </button>
              </div>
            </div>
          )}
          {phase === 'cancelled' && (
            <div className="ap-blocker">
              <p>
                Completed work is saved for this session. Resume the remaining approved tasks when
                ready.
              </p>
              <button className="button primary" onClick={() => controls.control('retry')}>
                Continue execution
              </button>
            </div>
          )}
          <div className="ap-hierarchy">
            {plan.groups.map((group) => (
              <Group
                key={group.id}
                group={group}
                run={run!}
                locked={phase !== 'plan'}
                onChange={(next) =>
                  setPlan({
                    ...plan,
                    groups: plan.groups.map((g) => (g.id === next.id ? next : g)),
                  })
                }
              />
            ))}
          </div>
          {phase === 'plan' && (
            <>
              {revision && (
                <div className="ap-revision">
                  <label>
                    What should change?
                    <textarea
                      aria-label="Plan revision instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Describe the scope or approach to change…"
                    />
                  </label>
                  <button
                    className="button primary"
                    disabled={!instructions.trim()}
                    onClick={() => {
                      controls.revise(instructions);
                      setRevision(false);
                      setInstructions('');
                    }}
                  >
                    Update plan
                  </button>
                  <button className="text-button" onClick={() => setRevision(false)}>
                    Cancel
                  </button>
                </div>
              )}
              <div className="ap-actions">
                <button
                  className="button primary"
                  disabled={
                    !selected.length ||
                    selected.some((t) => !t.title.trim()) ||
                    plan.groups.some((g) => g.enabled && !g.title.trim())
                  }
                  onClick={controls.approve}
                >
                  <Play size={14} /> Approve & Execute
                </button>
                <button className="button" onClick={() => setRevision(!revision)}>
                  Request Changes
                </button>
                <small>
                  <ShieldCheck size={13} /> Approval applies to this plan only.
                </small>
              </div>
            </>
          )}
          {running && (
            <div className="ap-actions">
              <span className="ap-working">
                <span className="ap-active-dot" />
                {run?.scope?.find((s) => !s.done)?.title}
              </span>
              <button className="text-button" onClick={() => controls.control('cancel')}>
                <Square size={12} /> Stop execution
              </button>
            </div>
          )}
          {phase === 'completed' && (
            <>
              <div className="ap-result">
                <CheckCircle2 size={20} />
                <div>
                  <strong>
                    {run?.partial
                      ? 'The approved scope is complete.'
                      : 'All approved tasks have reached completion.'}
                  </strong>
                  <p>
                    {run?.partial
                      ? 'Excluded or incomplete requirements remain visible in the issue.'
                      : 'Review the implementation outline and retained activity.'}{' '}
                    No production code or tests were run.
                  </p>
                  {run?.completedAt && (
                    <small>
                      Finished{' '}
                      {new Date(run.completedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  )}
                </div>
              </div>
              <CodeChangesPanel run={run!} />
              {run?.partial && (
                <button className="button" onClick={() => controls.start()}>
                  Continue Remaining Work
                </button>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
