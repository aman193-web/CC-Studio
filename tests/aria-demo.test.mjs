import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newIssueData } from '../src/issueModel.ts';
import {
  beginDemo,
  tickDemo,
  buildDemoPlan,
  approveDemo,
  approvalError,
  controlDemo,
  answerDemo,
  planTasks,
} from '../src/ariaDemo.ts';
const make = (
  id,
  title,
  type = 'Issue',
  description = 'Implement the expected behavior with accessible feedback.',
) => ({ ...newIssueData(id, title, type === 'Issue' ? [] : [type]), description });
const settlePlanning = (issues, id = 1) => {
  let next = issues;
  while (next.find((i) => i.id === id).run.phase === 'analyzing') {
    next = tickDemo(next, next.find((i) => i.id === id).run.nextEventAt);
  }
  return next;
};
const ready = (issues, id = 1) => {
  const i = issues.find((i) => i.id === id);
  return settlePlanning(
    issues.map((x) => (x.id === id ? { ...x, run: beginDemo(i, issues) } : x)),
    id,
  );
};
const finish = (issues, id = 1) => {
  let next = issues;
  for (let n = 0; n < 40 && next.find((i) => i.id === id).run.phase === 'executing'; n++)
    next = tickDemo(next, next.find((i) => i.id === id).run.nextEventAt);
  return next;
};
test('type-aware plans are distinct and remain draft until exact approval', () => {
  const issue = make(1, 'Fix login validation');
  const story = make(2, 'Password Recovery', 'Story');
  const epic = make(
    3,
    'User Authentication',
    'Epic',
    'Support email and password, recovery, and sessions.',
  );
  const ip = buildDemoPlan(issue, [issue], ''),
    sp = buildDemoPlan(story, [story], ''),
    ep = buildDemoPlan(epic, [epic], '');
  assert.equal(ip.groups.length, 1);
  assert.ok(sp.groups[0].tasks.length > ip.groups[0].tasks.length);
  assert.equal(ep.groups.length, 3);
  assert.ok(ep.groups.every((g) => g.type === 'Story' && !g.issueId));
  let state = ready([epic], 3);
  assert.equal(state.length, 1);
  assert.equal(state[0].workItems.length, 0);
  state = approveDemo(state, 3);
  assert.equal(state.length, 4);
  assert.ok(state.slice(1).every((i) => i.parentIssueId === 3));
  assert.equal(state.filter((i) => i.status === 'AI Working').length, 2);
  assert.deepEqual(approveDemo(state, 3), state);
  const complete = finish(state, 3);
  assert.equal(complete[0].status, 'Completed');
  assert.ok(complete.every((i) => i.status === 'Completed'));
  assert.equal(complete[0].run.verified, true);
  assert.equal(complete[0].run.mode, 'preview');
  assert.equal(complete[0].run.artifacts, undefined);
});
test('clarification waits for a response and resumes planning without execution', () => {
  const epic = make(1, 'User authentication', 'Epic', 'Provide reliable sign-in.');
  let state = ready([epic]);
  assert.equal(state[0].run.phase, 'clarification');
  const run = answerDemo(state[0], 'Email and password', state);
  state = settlePlanning([{ ...state[0], run }]);
  assert.equal(state[0].run.phase, 'plan');
  assert.equal(state[0].status, 'To Do');
  assert.deepEqual(state[0].run.responses, ['Email and password']);
});
test('approval refuses stale scope and overlapping executions', () => {
  const parent = make(1, 'Authentication', 'Epic', 'Email and password.'),
    child = { ...make(2, 'Login', 'Story'), parentIssueId: 1 };
  let state = ready([parent, child]);
  const changed = state.map((i) => (i.id === 2 ? { ...i, title: 'Changed scope' } : i));
  assert.match(approvalError(changed[0], changed), /changed/);
  state = approveDemo(state, 1);
  const childRun = state.map((i) =>
    i.id === 2 ? { ...i, run: { ...beginDemo(i, state), phase: 'plan' } } : i,
  );
  assert.match(approvalError(childRun[1], childRun), /already executing/);
});
test('partial approval preserves excluded work and continuation completes only remaining tasks', () => {
  let state = ready([make(1, 'Add CSV export')]);
  let run = state[0].run;
  run.plan.groups[0].tasks[2].enabled = false;
  state = approveDemo(state, 1);
  state = finish(state);
  assert.equal(state[0].status, 'To Do');
  assert.equal(state[0].run.partial, true);
  assert.equal(state[0].workItems.length, 2);
  const completed = structuredClone(state[0].workItems);
  state = ready(state);
  assert.equal(planTasks(state[0].run.plan).length, 1);
  assert.equal(approvalError(state[0], state), null);
  state = finish(approveDemo(state, 1));
  assert.equal(state[0].status, 'Completed');
  assert.equal(state[0].workItems.length, 3);
  assert.deepEqual(state[0].workItems.slice(0, 2), completed);
});
test('blocker retry and cancellation preserve completed work without duplicate tasks', () => {
  let state = ready([make(1, 'Add CSV export')]);
  state[0].run.scenario = 'verification-blocker';
  state = finish(approveDemo(state, 1));
  assert.equal(state[0].run.phase, 'blocked');
  assert.equal(state[0].run.step, 1);
  assert.equal(state[0].status, 'To Do');
  const completed = structuredClone(state[0].workItems[0]);
  state = controlDemo(state, 1, 'cancel');
  assert.equal(state[0].run.phase, 'cancelled');
  state = finish(controlDemo(state, 1, 'retry'));
  assert.equal(state[0].status, 'Completed');
  assert.equal(state[0].workItems.length, 3);
  assert.deepEqual(state[0].workItems[0], completed);
});
test('existing children and completed tasks are reused without parent duplicates', () => {
  const epic = make(1, 'Analytics', 'Epic'),
    child = { ...make(2, 'Dashboard export', 'Story'), parentIssueId: 1 },
    done = { ...make(3, 'Completed analytics', 'Story'), parentIssueId: 1, status: 'Completed' };
  let state = ready([epic, child, done]);
  assert.equal(state[0].run.plan.groups.length, 2);
  assert.equal(state[0].run.plan.groups.find((g) => g.issueId === 3).completed, true);
  state = finish(approveDemo(state, 1));
  assert.equal(state.length, 3);
  assert.equal(state[0].workItems.length, 0);
  assert.deepEqual(state[2], done);
});
test('restarting stopped work requires new approval when the requirement changes', () => {
  let state = approveDemo(ready([make(1, 'Add CSV export')]), 1);
  state = controlDemo(state, 1, 'cancel');
  state[0] = { ...state[0], description: 'Export only the active page, not every result.' };
  state = controlDemo(state, 1, 'retry');
  assert.equal(state[0].run.phase, 'blocked');
  assert.equal(state[0].run.scopeChanged, true);
  assert.equal(state[0].run.step, 0);
});
test('an Epic adds an explicitly missing requirement without duplicating an existing Story', () => {
  const epic = make(1, 'Authentication', 'Epic', 'Add login and password recovery.'),
    login = { ...make(2, 'Login', 'Story'), parentIssueId: 1 };
  const plan = buildDemoPlan(epic, [epic, login], '');
  assert.equal(plan.groups.length, 2);
  assert.equal(plan.groups.filter((g) => !g.issueId).length, 1);
  assert.equal(plan.groups.find((g) => !g.issueId).title, 'Password recovery');
});
test('excluding an entire proposed Story leaves the Epic incomplete and supports continuation', () => {
  let state = ready([
    make(1, 'Analytics', 'Epic', 'Explore dashboard analytics and export reports.'),
  ]);
  state[0].run.plan.groups[1].enabled = false;
  state = finish(approveDemo(state, 1));
  assert.equal(state[0].status, 'To Do');
  assert.equal(state.length, 2);
  state = ready(state);
  assert.equal(approvalError(state[0], state), null);
  state = finish(approveDemo(state, 1));
  assert.equal(state.length, 3);
  assert.equal(state[0].status, 'Completed');
});

test('planning and execution wait for paced updates', () => {
  const issue = make(1, 'Add CSV export');
  const run = beginDemo(issue, [issue]);
  let state = [{ ...issue, run }];
  assert.ok(run.nextEventAt - Date.now() >= 4000);
  assert.equal(tickDemo(state, run.nextEventAt - 1)[0].run.events.length, 1);
  state = tickDemo(state, run.nextEventAt);
  assert.equal(state[0].run.phase, 'analyzing');
  assert.equal(state[0].run.planningStage, 1);
  state = settlePlanning(state);
  state = approveDemo(state, 1);
  assert.ok(state[0].run.nextEventAt - Date.now() >= 5000);
  assert.equal(
    tickDemo(state, state[0].run.nextEventAt - 1)[0].run.scope.some((task) => task.done),
    false,
  );
});
