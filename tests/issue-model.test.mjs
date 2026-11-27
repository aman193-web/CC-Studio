import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ancestors,
  workTypeOf,
  workTypeChanges,
  planningContext,
  association,
  hasLabel,
  migrateIssues,
  newIssueData,
  parentError,
  reconcileApprovedWork,
  searchIssue,
  validateIssue,
} from '../src/issueModel.ts';
import { taskPlan } from '../src/data.ts';
const epic = { ...newIssueData(1, 'Authentication', ['Epic']), projectId: 'a' };
const story = { ...newIssueData(2, 'Sign in', ['Story', 'Bug']), projectId: 'a', parentIssueId: 1 };
const task = { ...newIssueData(3, 'Login form', ['Task']), projectId: 'a', parentIssueId: 2 };
const issues = [epic, story, task];
test('hierarchy derives the Epic from one parent chain and searches parent context', () => {
  assert.equal(association(task, issues, 'Epic').id, 1);
  assert.equal(association(task, issues, 'Story').id, 2);
  assert.deepEqual(
    ancestors(task, issues).map((i) => i.id),
    [1, 2],
  );
  assert.equal(searchIssue(task, issues, 'Authentication'), true);
  assert.equal(searchIssue(story, issues, 'Bug'), true);
  assert.equal(searchIssue(task, issues, '#3'), true);
  assert.equal(hasLabel(story, 'Bug'), true);
});
test('hierarchy rejects self-parenting, cycles, cross-project and invalid label combinations', () => {
  assert.match(parentError(task, 3, issues), /own parent/);
  assert.match(parentError(epic, 3, issues), /cycle/);
  assert.match(parentError(story, 3, issues), /cycle/);
  assert.match(parentError({ ...task, projectId: 'b' }, 1, issues), /same project/);
  assert.match(validateIssue({ ...epic, labels: ['Epic', 'Story'] }, issues), /either/);
  assert.match(
    validateIssue({ ...epic, labels: ['Task'], label: 'Task' }, issues),
    /child Stories/,
  );
  assert.equal(parentError({ ...story, parentIssueId: null }, null, issues), null);
  assert.equal(parentError(task, 1, issues), null);
});
test('migration preserves data and completes only supported legacy statuses', () => {
  const raw = [
    {
      ...task,
      status: 'Done',
      assignee: 'RK',
      notes: [{ id: 4, text: 'Keep me' }],
      media: [{ id: 5, name: 'proof', data: 'image' }],
    },
    { ...epic, status: 'In progress', parentIssueId: null },
    {
      ...story,
      status: 'In review',
      run: { phase: 'completed', tasks: taskPlan('Login'), step: 3, instructions: 'keep' },
    },
  ];
  const migrated = migrateIssues(raw);
  assert.deepEqual(
    migrated.map((i) => i.status),
    ['Completed', 'To Do', 'To Do'],
  );
  assert.equal(migrated[0].assignee, 'RK');
  assert.deepEqual(migrated[0].notes, raw[0].notes);
  assert.deepEqual(migrated[0].media, raw[0].media);
  assert.equal(migrated[2].workItems.length, 3);
  assert.equal(migrated[2].workItems[0].status, 'Completed');
  assert.equal(migrated[2].workItems[0].subtasks.length, 3);
  assert.deepEqual(migrateIssues(migrated), migrated);
});
test('draft plans stay separate and approval reconciles without duplicates', () => {
  const run = {
    id: 'r1',
    planId: 'p1',
    phase: 'plan',
    tasks: taskPlan('Export'),
    step: 0,
    instructions: '',
  };
  const migrated = migrateIssues([{ ...task, run }])[0];
  assert.equal(migrated.workItems.length, 0);
  const work = reconcileApprovedWork(migrated, run);
  assert.equal(work.length, 3);
  assert.equal(new Set(work.flatMap((w) => [w.id, ...w.subtasks.map((s) => s.id)])).size, 12);
  const existing = { ...work[0], status: 'Completed', assignee: 'Owner' };
  const again = reconcileApprovedWork(
    { ...migrated, workItems: [existing, ...work.slice(1)] },
    run,
  );
  assert.equal(again.length, 3);
  assert.deepEqual(again[0], existing);
});
test('legacy active runs retain lifecycle evidence and invalid imports are repaired', () => {
  const active = migrateIssues([
    {
      ...task,
      status: 'In progress',
      run: {
        phase: 'executing',
        startedAt: Date.now(),
        tasks: taskPlan('Login'),
        step: 1,
        instructions: '',
      },
    },
  ])[0];
  assert.equal(active.status, 'AI Working');
  assert.ok(active.run.approvedAt);
  const invalid = migrateIssues([{ ...epic, parentIssueId: 3 }, story, task]);
  assert.equal(invalid[0].parentIssueId, null);
  assert.equal(migrateIssues([task, task]).length, 1);
});

test('simple work type preserves existing labels and maintains valid parent context', () => {
  const changed = { ...story, ...workTypeChanges(story, 'Issue', issues) };
  assert.deepEqual(changed.labels, ['Bug']);
  assert.equal(changed.parentIssueId, 1);
  assert.equal(workTypeOf(changed), 'Issue');
  const promoted = { ...task, ...workTypeChanges(task, 'Story', issues) };
  assert.equal(promoted.parentIssueId, 1);
  assert.equal(validateIssue(promoted, issues), null);
  assert.equal(workTypeChanges(task, 'Epic', issues).parentIssueId, null);
  assert.match(
    validateIssue({ ...epic, ...workTypeChanges(epic, 'Issue', issues) }, issues),
    /child Stories/,
  );
  assert.equal(planningContext(story, issues).workType, 'Story');
  assert.deepEqual(planningContext(story, issues).childIssueIds, [3]);
  assert.deepEqual(planningContext(story, issues).labels, ['Story', 'Bug']);
});
