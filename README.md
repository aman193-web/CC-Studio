# CC Studio — Issues workspace

The active React/Vite application preserves the supplied CC Studio portal shell, Roboto typography, lavender palette, and the full-width Issues tab. This is a local design prototype; it has no GitLab API or production coding-agent backend.

## Run and verify

```sh
npm install
npm run dev
npm run check
npm test
npm run build
```

The model tests use Node's built-in TypeScript stripping (Node 22.18+ or Node 24). Deploy the repository root as Vite, with `npm run build` and output directory `dist`.

## Batch 1

- Epic, Story, Task, Bug, Feature, Improvement, Enhancement, and Design labels all use the same Issue model and detail page. Unknown existing labels are preserved. Epic and Story are mutually exclusive.
- `parentIssueId` is the only hierarchy relationship. Epic membership is derived from ancestors; cycles, self-parenting, invalid Story/Epic links, and cross-project links are rejected.
- Shared Epic, Story, label, source, status, and search filters serve List and Board. Search includes descriptions and ancestor names. List can group by Epic or Story with nested expandable rows, counts, and completion progress. Flat pagination survives detail navigation; grouped pagination keeps complete groups together.
- Board has only **To Do**, **AI Working**, and **Completed**. Status is read-only on cards and issue details. Dragging cannot invent an execution or verified completion. Clarification, planning, approval, and unverified legacy runs use secondary indicators.
- One right drawer offers a single Issue / Story / Epic work-type choice, priority, and preserved assignment information. Parent context is inherited when creating a child; no hierarchy selectors or label checklist are shown. **Create Issue** saves only. **Create & Plan with Aria** starts analysis without approving or executing.
- Issue details provide clickable ancestry, a compact work-type editor, child creation/linking/reassignment, and independent implementation tasks and subtasks. Existing assignments and completed work remain intact.
- `workItems` live outside `run.tasks`. Draft plan proposals stay in the run until approval. Stable work-item IDs reconcile approved work without duplicates. Child issues are never automatically copied into implementation tasks.
- GSAP handles drawer entry/dismissal, hierarchy and subtask expansion, labels, statuses, notices, view transitions, and newly opened issue content. Reduced motion is respected.

## Persistence and migration

Batch 1 uses **`cc-studio-issues-batch1`**. On first load it reads and migrates `cc-studio-issues-v2` if present, retaining the original key and a `cc-studio-issues-v2-before-batch1` backup. It preserves IDs, content, comments, attachments, assignment, relationships, history, and existing independent work.

Legacy Done maps to Completed. In-progress/review records become To Do unless a run supplies approved active execution or verification evidence. Previously executed plan tasks become permanent work items; unapproved tasks remain proposals. Migration is idempotent. Fresh sessions include sample Epic/Story relationships; existing sessions retain their existing issues without injecting new sample records.

List/Board preference continues using `cc-studio-issue-view`; group preference uses `cc-studio-group-by`.

## Aria and repository boundary

The existing deterministic Aria preview remains functional. Approved preview runs advance through tasks and record preview verification; they do not execute repository code. Every new run records `mode: 'preview'`. The model includes plan IDs, run IDs/history, work references, dependencies, typed event/artifact slots, and origin metadata for Batch 2. Label-aware generation and the two-panel execution experience are deferred to Batch 2.

The inherited GitLab connected presentation and in-app sample ticket viewer remain. No real issues, branches, commits, or merge requests are created. Branch UI now displays only an explicitly recorded run branch, rather than constructing a nonexistent branch name.

## Main files

- `src/data.ts`: unified types, existing sample data and preview task generator.
- `src/issueModel.ts`: hierarchy validation, migration, search, and work reconciliation.
- `src/IssueHierarchy.tsx`: shared work-type/label/status controls, child issues and motion helpers.
- `src/CreateIssue.tsx`: shared creation drawer.
- `src/IssueList.tsx`, `src/IssueBoard.tsx`: shared-data views.
- `src/WorkItems.tsx`, `src/IssueContext.tsx`: independent tasks, activity, attachments and comments.
- `src/App.tsx`, `src/AriaWorkflow.tsx`: retained shell and inline planning/execution.
- `tests/issue-model.test.mjs`: hierarchy, migration, preservation, and reconciliation checks.

## Verification

Model tests, TypeScript checks, and production build pass. Isolated browser sessions checked creation modes, dependent selectors, mutually exclusive labels, independent task/subtask persistence, parent linking/unlinking, invalid label-change protection, grouped deduplication, search/filter sharing, pagination return state, execution approval/status transitions, preserved assignment, and independent parent status. Desktop and 390 px mobile checks found no horizontal document overflow; reduced-motion and drawer Escape behavior passed. Browser test data was created in isolated contexts, leaving the user's saved issues unchanged.

## Preserved versions

- Current dev: http://127.0.0.1:5173/#issues
- V1 source: `versions/v1/`; frozen preview: `/v1/index.html` (unchanged).
- Pre-batch snapshot branch: `snapshots/current-2026-11-27`, commit `53fbdcc`.
- Batch work branch: `design/next-two-batches`.

The list uses a Label column in place of Created in; source remains on issue details. Existing labels are preserved when changing work type. Each new Aria run captures work type, description, labels, and existing work references as planning context; full label-aware generation remains part of Batch 2.

The issue table now shows Type (Issue / Story / Epic) derived from work type, rather than legacy labels. Existing labels remain stored.

Latest UI refinement: table has a dedicated Priority column with compact tinted High/Medium/Low pills; Awaiting verification is hidden in table rows. Toolbar is search plus Type, with status tabs; source, Epic, Story, label, and grouping controls are removed. Detail status badges have rounded corners and balanced padding. Issue data now lives in React state and resets to initial examples on browser reload, per user request; old stored issue data is left untouched and is no longer loaded or written. This supersedes earlier persistence and filter descriptions.
