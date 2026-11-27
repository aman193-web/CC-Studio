# CC Studio — Aria Issues workspace

React, TypeScript, Vite and GSAP design prototype. The original CC Studio shell, Roboto typography, lavender palette and frozen V1 are preserved.

## Run

```sh
npm install
npm run dev
npm run check
npm test
npm run build
```

Use Node 22.18+ or Node 24 for the TypeScript model tests. Deploy the repository root as Vite (`npm run build`, output `dist`).

## Current interface

- Unified Issue / Story / Epic classification across list, board, details, creation and plans. Legacy labels remain in the data for compatibility, but are not shown as work classifications.
- Table columns: Issue, Status, Type, Priority, GitLab ticket, Aria. Search, Type and status are the only filters.
- Three primary statuses: To Do, AI Working and Completed. Planning and approval do not start execution.
- Aria is the only executor; no assignment controls.
- New work uses the existing right-side creation drawer. Issue details remain inside the full-width Issues tab.
- Issue details have resizable 60:40 panels: implementation on the left and read-only activity on the right. The right panel begins collapsed, opens on planning, respects an explicit collapse preference, and retains history. A keyboard-accessible divider supports arrow-key resizing. Mobile uses two tabs.
- All issue, task, plan, run, clarification, activity and panel-preference data is session-only React state. Internal navigation preserves it; browser refresh resets to initial examples. No browser persistence is read or written by the active app.

## Planning and execution

`Fix with Aria` begins planning immediately. The five-step wizard has been removed. Users can review expandable task hierarchies, edit proposed work, include/exclude scope with prerequisites, provide clarification, request a new plan version, and approve execution.

Issue plans use focused tasks; Story plans provide broader tasks and subtasks; Epic plans reuse child requirements and can propose new Stories. New work is materialized only on approval using the same Issue model and permanent WorkItems. Stable IDs preserve existing work. Partial approvals retain excluded scope for continuation. Approval is tied to the requirement snapshot, and overlapping execution is rejected. Changing stopped work requires new approval before resuming.

The activity feed groups details behind disclosures and retains separate attempts. It follows new activity only when near the bottom, otherwise showing Jump to latest. No chat or composer exists in that panel.

## Demonstration boundary

There is no Aria service or repository execution integration in this codebase. `src/ariaDemo.ts` is an isolated deterministic demonstration adapter, not an LLM or production executor. It uses issue text, work type and existing work to produce example plans. It cannot inspect a remote repository, infer real project architecture, run shell commands, modify code, execute tests, or create commits/MRs. Arbitrary natural-language plan revisions require future backend integration; the demo supports targeted instructions such as verification-only scope plus editable draft tasks.

All new runs carry `mode: 'preview'` and visible Demo run identification. Timed outcomes belong exclusively to the demo adapter. Completion denotes a simulated result, not real verified code. The collapsed Demonstration behavior control can exercise a verification blocker; Retry preserves completed work, and Stop retains the approved scope. Real execution must consume actual backend events rather than these demo ticks.

Repository artifacts are optional typed records. The Code changes section opens supplied HTTPS artifacts; it never constructs branch names, commit SHAs, merge requests, test results or file counts. The inherited connected GitLab presentation remains; missing ticket URLs show an honest unavailable state.

## Important files

- `src/ariaTypes.ts`: plans, groups, tasks, execution references, activity and workspace preference types.
- `src/ariaDemo.ts`: demo planning, exact approval, reconciliation, execution events, blockers, partial completion and retries.
- `src/AriaPlanPanel.tsx`: inline clarification, editable plan hierarchy, approvals, progress and results.
- `src/IssueDetailsWorkspace.tsx`: resizable workspace, independent scrolling and read-only activity.
- `src/AriaDisclosure.tsx`: native accessible disclosures with GSAP motion.
- `src/aria-workspace.css`: compact two-panel layout and responsive design.
- `src/issueModel.ts`: hierarchy, classification, legacy normalization and preservation.
- `src/WorkItems.tsx`, `src/IssueContext.tsx`: independent work, comments, attachments and history.
- `tests/aria-demo.test.mjs`, `tests/issue-model.test.mjs`: lifecycle, approval, dependencies, preservation and hierarchy checks.

## Preserved versions

- Current dev: http://127.0.0.1:5173/#issues
- Frozen V1: `versions/v1/`, `/v1/index.html` (unchanged).
- Original snapshot: `snapshots/current-2026-11-27` at `53fbdcc`.
- Refined pre-Batch-2 snapshot: `snapshots/pre-batch2-2026-11-27` at `c89c750`.
- Active branch: `design/next-two-batches`.
