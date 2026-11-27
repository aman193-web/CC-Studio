/** Session-only demonstration adapter. No repository calls or production execution. */
import type { Issue, Run } from './data';
import type { AriaEvent, AriaPlan, ProposedGroup, ProposedTask } from './ariaTypes';
import { ancestors, newIssueData, planningContext, uid, workTypeOf } from './issueModel.ts';
const taskDelay = (title: string, index = 0) =>
  5500 + Math.min(title.length * 35, 2000) + (index % 3) * 650;
const stamp = () => new Date().toISOString();
const event = (
  message: string,
  kind: AriaEvent['kind'] = 'analysis',
  details?: string[],
): AriaEvent => ({ id: uid(), at: stamp(), message, kind, details });
const append = (run: Run, entry: AriaEvent): Run => ({
  ...run,
  events: [...(run.events || []), entry],
});
const descendants = (issue: Issue, issues: Issue[]) =>
  issues.filter((i) => ancestors(i, issues).some((p) => p.id === issue.id));
export const scopeFingerprint = (issue: Issue, issues: Issue[]) =>
  JSON.stringify(
    [issue, ...descendants(issue, issues)].map((i) => [
      i.id,
      i.title,
      i.description,
      workTypeOf(i),
      i.parentIssueId,
      (i.workItems || []).map((w) => [
        w.id,
        w.title,
        w.description,
        w.status,
        w.subtasks.map((s) => [s.id, s.title, s.status]),
      ]),
    ]),
  );
const executionFingerprint = (issue: Issue, issues: Issue[]) =>
  JSON.stringify(
    [issue, ...descendants(issue, issues)].map((i) => [
      i.id,
      i.title,
      i.description,
      workTypeOf(i),
      i.parentIssueId,
      (i.workItems || []).map((w) => [
        w.id,
        w.title,
        w.description,
        w.subtasks.map((s) => [s.id, s.title]),
      ]),
    ]),
  );
export const planTasks = (plan?: AriaPlan) =>
  plan?.groups
    .filter((g) => g.enabled && !g.completed)
    .flatMap((g) => g.tasks.filter((t) => t.enabled && !t.completed)) || [];
const domainOf = (text: string) =>
  /password|auth|login|sign.in|session/.test(text)
    ? 'authentication'
    : /export|csv/.test(text)
      ? 'export'
      : /chart|analytics|dashboard|filter|report/.test(text)
        ? 'analytics'
        : /email|invit|notification/.test(text)
          ? 'notifications'
          : /dark|theme|appearance/.test(text)
            ? 'theme'
            : 'requirement';
function taskTitles(issue: Issue, instructions: string): string[] {
  const text = `${issue.title} ${issue.description} ${instructions}`.toLowerCase();
  const domain = domainOf(text),
    story = workTypeOf(issue) === 'Story';
  if (/only.*(test|verif)|verification only/i.test(instructions))
    return [`Verify ${issue.title.toLowerCase()}`];
  if (/typo|copy|alignment|spacing|rename|text size/.test(text))
    return [`Update ${issue.title.toLowerCase()}`, 'Check responsive layout and accessibility'];
  if (domain === 'authentication')
    return /recover|reset/.test(issue.title.toLowerCase())
      ? [
          'Implement reset token validation and expiry',
          'Build the password recovery interface',
          'Integrate recovery notifications',
          'Verify recovery and expired-token flows',
        ]
      : /session/.test(issue.title.toLowerCase())
        ? [
            'Implement session expiry and recovery',
            'Integrate token refresh behavior',
            'Verify expired and active sessions',
          ]
        : story
          ? [
              'Implement sign-in validation and feedback',
              'Integrate the authentication flow',
              'Verify credentials and session behavior',
            ]
          : [
              `Resolve ${issue.title.toLowerCase()}`,
              'Verify authentication and session regressions',
            ];
  if (domain === 'export')
    return [
      'Build export from the active filtered dataset',
      'Handle CSV formatting and export feedback',
      'Verify exported data and failure states',
    ];
  if (domain === 'analytics')
    return story
      ? [
          'Implement the requested analytics controls',
          'Connect controls to the relevant data flow',
          'Verify filtered results and empty states',
        ]
      : [`Update ${issue.title.toLowerCase()}`, 'Verify dashboard behavior and regressions'];
  if (domain === 'notifications')
    return [
      'Implement notification delivery and validation',
      'Add delivery feedback and recovery states',
      'Verify delivery and failure scenarios',
    ];
  if (domain === 'theme')
    return [
      'Add theme preferences and reusable color tokens',
      'Apply the theme to existing components',
      'Verify contrast and system preference changes',
    ];
  const segments = issue.description
    .split(/[\n;]/)
    .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
    .filter((s) => s.length > 12);
  if (story && segments.length > 1)
    return [
      ...segments.slice(0, 3).map((s) => s.slice(0, 90)),
      `Verify ${issue.title.toLowerCase()}`,
    ];
  return [
    `Implement ${issue.title.toLowerCase()}`,
    ...(story ? [`Integrate ${issue.title.toLowerCase()} with existing behavior`] : []),
    'Verify the expected outcome and edge cases',
  ];
}
function proposedTasks(issue: Issue, instructions: string): ProposedTask[] {
  if (issue.status === 'Completed') return [];
  if (issue.workItems?.length)
    return issue.workItems.map((w) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      subtasks: w.subtasks.map((s) => s.title),
      existingWorkId: w.id,
      completed: w.status === 'Completed',
      enabled: w.status !== 'Completed',
      dependencies: w.dependencies || [],
    }));
  const titles = taskTitles(issue, instructions);
  const ids = titles.map(() => uid());
  return titles.map((title, n) => ({
    id: ids[n],
    title,
    description:
      n === titles.length - 1
        ? `Check the expected outcome: ${issue.description || issue.title}`
        : `Implement this part of “${issue.title}” using existing components where possible.`,
    subtasks:
      workTypeOf(issue) === 'Story' && titles.length > 2
        ? [
            `Review existing behavior for ${title.toLowerCase()}`,
            n === titles.length - 1
              ? 'Cover success, failure, and regression cases'
              : 'Implement the change and handle edge cases',
          ]
        : [],
    completed: false,
    enabled: true,
    dependencies: n ? [ids[n - 1]] : [],
  }));
}
function epicStories(issue: Issue): string[] {
  const titleDomain = domainOf(issue.title.toLowerCase());
  const domain =
    titleDomain === 'requirement' ? domainOf(issue.description.toLowerCase()) : titleDomain;
  if (domain === 'authentication')
    return ['Login and signup', 'Password recovery', 'Session management'];
  if (domain === 'analytics') return ['Explore dashboard analytics', 'Export and share reports'];
  if (domain === 'notifications') return ['Notification delivery', 'Notification preferences'];
  const lines = issue.description
    .split(/[\n;]/)
    .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
    .filter((s) => s.length > 10);
  return lines.length > 1
    ? lines.slice(0, 3)
    : [`${issue.title}: core experience`, `${issue.title}: integration and reliability`];
}
export function buildDemoPlan(
  issue: Issue,
  issues: Issue[],
  instructions: string,
  version = 1,
): AriaPlan {
  const groups: ProposedGroup[] = [];
  const visit = (target: Issue) => {
    const children = issues.filter((i) => i.parentIssueId === target.id);
    const parent = ancestors(target, issues)
      .filter((p) => p.id !== issue.id)
      .at(-1);
    const context = parent
      ? { parentIssueId: parent.id, contextTitle: parent.title, contextType: workTypeOf(parent) }
      : {};
    // Existing child requirements own their implementation; never duplicate them on the parent.
    if (children.length) {
      if (target.workItems?.length)
        groups.push({
          ...context,
          id: `existing-${target.id}`,
          issueId: target.id,
          title: target.title,
          description: target.description,
          type: workTypeOf(target),
          completed: target.status === 'Completed',
          enabled: target.status !== 'Completed',
          tasks: proposedTasks(target, instructions),
        });
      children.forEach(visit);
      return;
    }
    groups.push({
      ...context,
      id: `existing-${target.id}`,
      issueId: target.id,
      title: target.title,
      description: target.description,
      type: workTypeOf(target),
      completed: target.status === 'Completed',
      enabled: target.status !== 'Completed',
      tasks: proposedTasks(target, instructions),
    });
  };
  if (
    workTypeOf(issue) === 'Epic' &&
    !issues.some((i) => i.parentIssueId === issue.id) &&
    !issue.workItems?.length
  ) {
    epicStories(issue).forEach((title) => {
      const draft = {
        ...newIssueData(0, title, ['Story']),
        description: `${title} within ${issue.title}. ${issue.description}`,
      };
      groups.push({
        id: uid(),
        parentIssueId: issue.id,
        title,
        description: draft.description,
        type: 'Story',
        completed: false,
        enabled: true,
        tasks: proposedTasks(draft, instructions),
      });
    });
  } else visit(issue);
  // Propose only explicitly requested missing Epic areas; existing descendants cover their own scope.
  if (workTypeOf(issue) === 'Epic' && issues.some((i) => i.parentIssueId === issue.id)) {
    const requested = issue.description.toLowerCase();
    const existingText = descendants(issue, issues)
      .map((i) => i.title)
      .join(' ')
      .toLowerCase();
    const candidates: [RegExp, string][] = [
      [/password.*recover|password.*reset|recover.*password/, 'Password recovery'],
      [/session|token refresh/, 'Session management'],
      [/export|csv/, 'Export and share reports'],
    ];
    for (const [pattern, title] of candidates)
      if (pattern.test(requested) && !pattern.test(existingText)) {
        const draft = {
          ...newIssueData(0, title, ['Story']),
          description: `${title}. ${issue.description}`,
        };
        groups.push({
          id: uid(),
          parentIssueId: issue.id,
          title,
          description: draft.description,
          type: 'Story',
          completed: false,
          enabled: true,
          tasks: proposedTasks(draft, instructions),
        });
      }
  }
  // Keep excluded draft requirements available when continuing a partial run.
  if (issue.run?.partial && issue.run.plan) {
    for (const old of issue.run.plan.groups) {
      const pending = old.tasks.filter((t) => !t.completed && (!old.enabled || !t.enabled));
      if (!pending.length) continue;
      const target = groups.find(
        (g) => (g.issueId === old.issueId && old.issueId != null) || g.title === old.title,
      );
      if (target) {
        const work = issues.find((i) => i.id === target.issueId)?.workItems || [];
        const mapId = (id: string) => {
          const previous = old.tasks.find((t) => t.id === id);
          return work.find((w) => w.title === previous?.title)?.id || id;
        };
        for (const task of pending)
          if (!target.tasks.some((t) => t.title === task.title))
            target.tasks.push({
              ...task,
              enabled: true,
              dependencies: task.dependencies.map(mapId),
            });
        target.enabled = true;
        target.completed = false;
      } else
        groups.push({
          ...old,
          enabled: true,
          completed: false,
          tasks: old.tasks.map((t) => ({ ...t, enabled: !t.completed })),
        });
    }
  }
  return {
    version,
    fingerprint: scopeFingerprint(issue, issues),
    groups,
    approach:
      workTypeOf(issue) === 'Epic'
        ? 'Deliver the objective through focused child requirements, reusing existing work before adding anything new.'
        : workTypeOf(issue) === 'Story'
          ? 'Turn the user outcome into ordered implementation and verification tasks.'
          : 'Keep the change focused on the requested behavior and verify the affected paths.',
    outcome: issue.description || issue.title,
    assumptions: [
      'Reuse the existing project architecture.',
      'Repository inspection and implementation require the live Aria integration.',
      ...(instructions ? [`Requested direction: ${instructions}`] : []),
    ],
    verification: [
      'Verify the stated acceptance criteria.',
      'Check affected behavior and relevant regressions.',
    ],
  };
}
export function beginDemo(issue: Issue, issues: Issue[], instructions = '', previous?: Run): Run {
  const run: Run = {
    id: uid(),
    planId: uid(),
    phase: 'analyzing',
    mode: 'preview',
    instructions,
    tasks: [],
    step: 0,
    startedAt: Date.now(),
    nextEventAt: Date.now() + 4500 + (workTypeOf(issue) === 'Epic' ? 2000 : 0),
    planningStage: 0,
    planningContext: planningContext(issue, issues),
    responses: previous?.responses || [],
    scenario: previous?.scenario || 'success',
    plan: buildDemoPlan(issue, issues, instructions, (previous?.plan?.version || 0) + 1),
    events: [],
  };
  return append(
    run,
    event(
      `Preparing the ${workTypeOf(issue).toLowerCase()} plan for “${issue.title}”.`,
      'analysis',
      [
        `Using the title, description, ${descendants(issue, issues).length} existing child requirements and ${(issue.workItems || []).length} existing tasks.`,
        'Your issue description and additional instructions guide the proposed scope.',
      ],
    ),
  );
}
function requiredQuestion(issue: Issue, run: Run) {
  if (run.responses?.length) return undefined;
  const text = `${issue.title} ${issue.description} ${run.instructions}`.toLowerCase();
  if (
    /auth|sign.in|login/.test(text) &&
    workTypeOf(issue) === 'Epic' &&
    !/password|google|microsoft|sso/.test(text)
  )
    return {
      question: 'Which sign-in methods should this include?',
      reason: 'The selected methods determine the implementation scope.',
      options: ['Email and password', 'Google Sign-In', 'Microsoft Sign-In', 'Single Sign-On'],
      multiple: true,
    };
  if (/filter.*persist|persist.*filter/.test(text) && !/session|device|account|browser/.test(text))
    return {
      question: 'Where should filter preferences be remembered?',
      reason: 'This determines how preferences are stored and restored.',
      options: [
        'This browser',
        'Across devices for the same account',
        'Only during the current session',
      ],
    };
  if (!issue.description.trim() && issue.title.trim().split(/\s+/).length < 4)
    return {
      question: 'What outcome should this work deliver?',
      reason: 'A little more context is needed to create a useful plan.',
      options: [],
    };
  return undefined;
}
export function answerDemo(
  issue: Issue,
  answer: string,
  issues: Issue[] = [issue],
): Run | undefined {
  if (!issue.run || issue.run.phase !== 'clarification' || !answer.trim()) return issue.run;
  return append(
    {
      ...issue.run,
      phase: 'analyzing',
      plan: buildDemoPlan(
        issue,
        issues,
        [issue.run.instructions, answer].filter(Boolean).join('\n'),
        issue.run.plan?.version || 1,
      ),
      responses: [...(issue.run.responses || []), answer],
      instructions: [issue.run.instructions, answer].filter(Boolean).join('\n'),
      clarification: { ...issue.run.clarification!, answer },
      nextEventAt: Date.now() + 3500,
      planningStage: 1,
    },
    event('Clarification received. Updating the plan.', 'analysis', [answer]),
  );
}
export function approvalError(issue: Issue, issues: Issue[]): string | null {
  const run = issue.run;
  if (!run?.plan || run.phase !== 'plan') return 'This plan is no longer awaiting approval.';
  if (run.plan.fingerprint !== scopeFingerprint(issue, issues))
    return 'The requirement or existing work changed. Request a refreshed plan before approving.';
  const selected = planTasks(run.plan);
  if (!selected.length) return 'Include at least one incomplete task.';
  const selectedIds = new Set(selected.map((t) => t.id));
  const completed = new Set(
    run.plan.groups.flatMap((g) => g.tasks.filter((t) => t.completed).map((t) => t.id)),
  );
  if (selected.some((t) => t.dependencies.some((id) => !selectedIds.has(id) && !completed.has(id))))
    return 'Include prerequisite tasks before dependent work.';
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const cycle = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const task = selected.find((t) => t.id === id);
    if (task?.dependencies.some((dep) => selectedIds.has(dep) && cycle(dep))) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  if (selected.some((t) => cycle(t.id)))
    return 'The plan contains a dependency cycle. Request a revised plan.';
  const ids = new Set(
    run.plan.groups
      .filter((g) => g.enabled)
      .map((g) => g.issueId)
      .filter(Boolean),
  );
  ids.add(issue.id);
  if (
    issues.some(
      (i) =>
        i.id !== issue.id &&
        ['executing', 'blocked'].includes(i.run?.phase || '') &&
        (ids.has(i.id) || i.run?.scope?.some((s) => ids.has(s.issueId))),
    )
  )
    return 'Related work is already executing. Finish or stop that run first.';
  return null;
}
export function approveDemo(issues: Issue[], id: number): Issue[] {
  const issue = issues.find((i) => i.id === id);
  if (!issue || approvalError(issue, issues)) return issues;
  let next: Issue[] = issues.map((i) => ({ ...i, workItems: [...(i.workItems || [])] }));
  let nextId = Math.max(...issues.map((i) => i.id)) + 1;
  const run = {
    ...issue.run!,
    plan: structuredClone(issue.run!.plan!),
    phase: 'executing' as const,
    approvedAt: stamp(),
    startedAt: Date.now(),
    nextEventAt: Date.now() + taskDelay(issue.title),
    scope: [] as NonNullable<Run['scope']>,
    step: 0,
  };
  for (const group of run.plan!.groups.filter((g) => g.enabled && !g.completed)) {
    const tasks = group.tasks.filter((t) => t.enabled && !t.completed);
    if (!tasks.length) continue;
    let target = next.find((i) => i.id === group.issueId);
    if (!target) {
      target = {
        ...newIssueData(nextId++, group.title, [group.type]),
        description: group.description,
        parentIssueId: group.parentIssueId ?? issue.id,
        origin: 'Generated by Aria',
      };
      next.push(target);
      group.issueId = target.id;
    }
    for (const task of tasks) {
      let work = target.workItems!.find((w) => w.id === task.existingWorkId);
      if (!work) {
        const workId = `${run.planId}-${task.id}`;
        work = {
          id: workId,
          parentWorkItemId: `issue-${target.id}`,
          title: task.title,
          description: task.description,
          status: 'To Do',
          origin: 'Generated by Aria',
          assignee: 'Aria',
          createdAt: stamp(),
          updatedAt: stamp(),
          runId: run.id,
          planId: run.planId,
          dependencies: task.dependencies.map((dependency) => {
            const prerequisite = run
              .plan!.groups.flatMap((g) => g.tasks)
              .find((t) => t.id === dependency);
            return prerequisite?.existingWorkId || `${run.planId}-${dependency}`;
          }),
          subtasks: task.subtasks.map((title, n) => ({
            id: `${workId}-sub-${n}`,
            parentWorkItemId: workId,
            title,
            description: '',
            status: 'To Do',
            origin: 'Generated by Aria',
            assignee: 'Aria',
            createdAt: stamp(),
            updatedAt: stamp(),
            subtasks: [],
          })),
        };
        target.workItems!.push(work);
      }
      if (work.status !== 'Completed')
        run.scope.push({ issueId: target.id, workItemId: work.id, title: work.title, done: false });
    }
  }
  // Execute prerequisites before dependants, even when existing work was stored in another order.
  const pending = [...run.scope],
    ordered: typeof run.scope = [];
  while (pending.length) {
    const index = pending.findIndex((item) => {
      const work = next
        .find((i) => i.id === item.issueId)
        ?.workItems?.find((w) => w.id === item.workItemId);
      return !work?.dependencies?.some((id) => pending.some((p) => p.workItemId === id));
    });
    if (index < 0) return issues;
    ordered.push(...pending.splice(index, 1));
  }
  run.scope = ordered;
  const first = run.scope[0];
  next = next.map((i) => ({
    ...i,
    status: i.id === id || i.id === first?.issueId ? 'AI Working' : i.status,
    workItems: i.workItems?.map((w) =>
      w.id === first?.workItemId
        ? {
            ...w,
            status: 'AI Working',
            subtasks: w.subtasks.map((s) =>
              s.status === 'Completed' ? s : { ...s, status: 'AI Working' },
            ),
          }
        : w,
    ),
  }));
  return next.map((i) =>
    i.id === id
      ? {
          ...i,
          approvedPlanId: run.planId,
          draftPlanId: undefined,
          run: append(
            { ...run, approvedSnapshot: executionFingerprint(i, next) },
            event(
              `Plan v${run.plan!.version} approved. Starting ${run.scope.length} tasks.`,
              'approval',
            ),
          ),
        }
      : i,
  );
}
export function controlDemo(issues: Issue[], id: number, action: 'retry' | 'cancel'): Issue[] {
  const issue = issues.find((i) => i.id === id);
  const run = issue?.run;
  if (!run || !['executing', 'blocked', 'cancelled'].includes(run.phase)) return issues;
  if (action === 'retry') {
    const conflict = issues.some(
      (i) =>
        i.id !== id &&
        ['executing', 'blocked'].includes(i.run?.phase || '') &&
        i.run?.scope?.some((s) => run.scope?.some((other) => other.issueId === s.issueId)),
    );
    const changed = run.approvedSnapshot !== executionFingerprint(issue!, issues);
    if (conflict || changed)
      return issues.map((i) =>
        i.id === id
          ? {
              ...i,
              run: append(
                {
                  ...run,
                  phase: 'blocked',
                  scopeChanged: true,
                  nextEventAt: undefined,
                  blocker: conflict
                    ? 'Related work is running. Prepare a new plan after it finishes.'
                    : 'The requirement changed after approval. Prepare a revised plan before continuing.',
                },
                event('The remaining scope needs a new approval.', 'error'),
              ),
            }
          : i,
      );
  }
  const cancel = action === 'cancel';
  const nextRun = append(
    {
      ...run,
      phase: cancel ? 'cancelled' : 'executing',
      blocker: undefined,
      retried: true,
      nextEventAt: cancel
        ? undefined
        : Date.now() + taskDelay(run.scope?.find((s) => !s.done)?.title || issue!.title),
    },
    event(
      cancel
        ? 'Execution stopped. Completed work is preserved.'
        : 'Resuming the remaining approved work.',
      cancel ? 'error' : 'execution',
    ),
  );
  return issues
    .map<Issue>((i) => ({
      ...i,
      status: i.id === id ? (cancel ? 'To Do' : 'AI Working') : i.status,
      run: i.id === id ? nextRun : i.run,
      workItems: i.workItems?.map((w) =>
        run.scope?.some((s) => s.workItemId === w.id) && w.status === 'AI Working'
          ? {
              ...w,
              status: 'To Do',
              subtasks: w.subtasks.map((s) =>
                s.status === 'Completed' ? s : { ...s, status: 'To Do' },
              ),
            }
          : w,
      ),
    }))
    .map((i) =>
      i.id !== id &&
      i.status === 'AI Working' &&
      !i.workItems?.some((w) => w.status === 'AI Working')
        ? { ...i, status: 'To Do' }
        : i,
    );
}
export function tickDemo(issues: Issue[], now = Date.now()): Issue[] {
  let next = issues;
  for (const original of issues) {
    const run = original.run;
    if (run?.mode !== 'preview' || !run.nextEventAt || now < run.nextEventAt) continue;
    if (run.phase === 'analyzing') {
      const stage = run.planningStage || 0;
      if (stage < 2) {
        const nextRun = append(
          { ...run, planningStage: stage + 1, nextEventAt: now + (stage === 0 ? 4000 : 4500) },
          event(
            stage === 0
              ? 'Organizing the scope and existing work.'
              : 'Writing the task breakdown and review criteria.',
            'analysis',
            [
              stage === 0
                ? 'Keeping existing requirements and completed work in the proposed scope.'
                : 'Preparing clear tasks, dependencies and verification steps for your approval.',
            ],
          ),
        );
        next = next.map((i) => (i.id === original.id ? { ...i, run: nextRun } : i));
        continue;
      }
      const question = requiredQuestion(original, run);
      const plan = run.plan || buildDemoPlan(original, issues, run.instructions, 1);
      const nextRun = append(
        {
          ...run,
          plan,
          phase: question ? 'clarification' : 'plan',
          clarification: question || run.clarification,
          nextEventAt: undefined,
        },
        event(
          question ? 'Waiting for your input.' : 'Implementation plan ready for approval.',
          'analysis',
          question
            ? [question.question]
            : plan.groups.map(
                (g) =>
                  `${g.issueId ? 'Existing' : 'Proposed'} ${g.type}: ${g.title} · ${g.tasks.length} tasks`,
              ),
        ),
      );
      next = next.map((i) => (i.id === original.id ? { ...i, run: nextRun } : i));
      continue;
    }
    if (run.phase !== 'executing' || !run.scope) continue;
    const current = run.scope.find((s) => !s.done);
    if (!current) continue;
    if (run.scenario === 'verification-blocker' && !run.retried && run.step >= 1) {
      const blocked = append(
        {
          ...run,
          phase: 'blocked',
          blocker: `Verification for “${current.title}” is paused. ${run.step} completed task(s) are preserved.`,
          nextEventAt: undefined,
        },
        event(`Verification interrupted: ${current.title}`, 'error', [
          'No production tests were run. Retry resumes only the remaining approved work.',
        ]),
      );
      next = next.map((i) => ({
        ...i,
        status: i.id === original.id || i.id === current.issueId ? 'To Do' : i.status,
        run: i.id === original.id ? blocked : i.run,
        workItems: i.workItems?.map((w) =>
          w.id === current.workItemId
            ? {
                ...w,
                status: 'To Do',
                subtasks: w.subtasks.map((s) =>
                  s.status === 'Completed' ? s : { ...s, status: 'To Do' },
                ),
              }
            : w,
        ),
      }));
      continue;
    }
    const scope = run.scope.map((s) =>
        s.workItemId === current.workItemId ? { ...s, done: true } : s,
      ),
      remaining = scope.find((s) => !s.done),
      finished = !remaining;
    next = next.map((i) => ({
      ...i,
      workItems: i.workItems?.map((w) =>
        w.id === current.workItemId
          ? {
              ...w,
              status: 'Completed',
              updatedAt: stamp(),
              subtasks: w.subtasks.map((s) => ({ ...s, status: 'Completed' })),
            }
          : w.id === remaining?.workItemId
            ? {
                ...w,
                status: 'AI Working',
                subtasks: w.subtasks.map((s) =>
                  s.status === 'Completed' ? s : { ...s, status: 'AI Working' },
                ),
              }
            : w,
      ),
    }));
    // Reconcile actual owned work bottom-up, without completing untouched children.
    const touched = new Set([original.id, ...scope.map((s) => s.issueId)]);
    scope.forEach((s) => {
      const child = next.find((i) => i.id === s.issueId);
      if (child) ancestors(child, next).forEach((p) => touched.add(p.id));
    });
    [...next]
      .sort((a, b) => ancestors(b, next).length - ancestors(a, next).length)
      .forEach((target) => {
        if (!touched.has(target.id)) return;
        const i = next.find((x) => x.id === target.id)!;
        const children = next.filter((c) => c.parentIssueId === i.id);
        const works = i.workItems || [];
        const complete =
          works.every((w) => w.status === 'Completed') &&
          children.every((c) => c.status === 'Completed') &&
          works.length + children.length > 0;
        const excluded = run.plan?.groups.some(
          (g) =>
            (g.issueId === i.id || i.id === original.id) &&
            !g.completed &&
            (!g.enabled || g.tasks.some((t) => !t.completed && !t.enabled)),
        );
        next = next.map((x) =>
          x.id === i.id
            ? {
                ...x,
                status:
                  complete && !excluded
                    ? 'Completed'
                    : remaining && (i.id === original.id || i.id === remaining.issueId)
                      ? 'AI Working'
                      : 'To Do',
              }
            : x,
        );
      });
    const partial = next.find((i) => i.id === original.id)?.status !== 'Completed';
    const nextRun = append(
      {
        ...run,
        scope,
        step: scope.filter((s) => s.done).length,
        phase: finished ? 'completed' : 'executing',
        verified: finished,
        partial: finished && partial,
        completedAt: finished ? stamp() : undefined,
        nextEventAt: finished
          ? undefined
          : now + taskDelay(remaining?.title || current.title, scope.filter((s) => s.done).length),
      },
      event(`Task complete: ${current.title}`, 'verification', [
        'This task has reached its final workflow state. Review the task summary for the approved scope.',
      ]),
    );
    next = next.map((i) =>
      i.id === original.id
        ? {
            ...i,
            run: finished
              ? append(
                  nextRun,
                  event(
                    partial
                      ? 'Approved workflow finished. Additional required work remains.'
                      : 'Approved workflow finished. All included work is complete.',
                    'execution',
                  ),
                )
              : nextRun,
          }
        : i,
    );
  }
  return next;
}
