# CC Studio project context

- The current task is a design prototype. The user has now requested the portal be updated to the supplied 1440 × 931 SVG, superseding the earlier screenshot-only shell constraint. The reference is `public/portal-reference.svg`. Match its header, assistant panel, colors, and Features layout; retain the added Issues tab and existing Roboto font family. Features is the initial view.
- GitLab is already connected. Do not introduce connection or authorization setup. Ticket links are sample interactions in this local prototype, but do not show internal design-preview, dummy-data, or local-storage explanations in the product UI.
- Keep Issues simple: a List / Board toggle with shared status and source filters, creation source (CC Studio or GitLab), a GitLab ticket link, and a focused Aria action. The Kanban board supports drag-and-drop and a keyboard-accessible status dropdown. Use the existing star character and subtle reduced-motion-aware animation to highlight Aria. Require review and approval of the plan before simulated execution.
- Issue details open as a dedicated page at `#issues/<id>` with a Back to issues button; keep the list/board view and filters when returning. New issue creation uses a right-side drawer, not a centered modal. Use a clear 28 px page title, 17–18 px section headings, 13–14 px body/item text, and 11–12 px labels.
- Version 1 is intentionally preserved and liked by the user. Do not overwrite or restyle it. Its source is in `versions/v1/`; the frozen preview is served from `public/v1/` at `/v1/index.html`.
- Version 2 is the active app in `src/`. It uses a separate localStorage key so the first version's saved state stays separate.
- See `VERSION_HISTORY.md` for version URLs and retained design decisions.

- Aria analysis/clarification/plan/execution/review and GitLab preview are in-tab pages within `.cc-workspace`, with back navigation, never popup dialogs or whole-portal replacements. New issue remains the right drawer. The Issues heading is compact without the Realtime Dashboard caption. The welcome banner is removed; the avatar sits at the far right of the status-tab row (not fixed to a screen corner).

- Aria owns all issues; do not expose assignee controls. Show compact activity, child tasks, branch, media, and comments. Aria action buttons use the softer lavender background with purple text (not saturated purple fill), with 14 px action labels. Keep typography increases subtle, at 0.5–1 px; preserve the existing portal shell typography.

- Aria workflow now stays inline within issue details, directly below “Let Aria take it from here”; no separate Aria route navigation. Board/list Aria actions open the detail page and scroll to this section. Keep headings, subheadings, and line spacing compact.

- The Issues tab (including issue details and Aria) uses the full workspace width with the left chat panel and its toggle hidden. Other tabs retain their previous assistant-panel preference.

## Batch 1 decisions (supersede conflicting v2 notes above)
- Work on `design/next-two-batches`; preserve `main`, `snapshots/current-2026-11-27`, and all v1 files.
- Unified issues support multi-label Epic/Story/Task/etc.; Epic and Story are mutually exclusive. `parentIssueId` is authoritative, with derived ancestor associations and validation in `issueModel.ts`.
- Primary statuses are exactly To Do, AI Working, Completed. Do not restore manual status moves or drag-to-execute. Planning, clarification and approval are secondary indicators. Preview execution is not production execution.
- Preserve issue/task assignment information; Batch 1 explicitly requests assignment fields, superseding the earlier Aria-only UI restriction.
- Keep independent `workItems` separate from draft `run.tasks`; reconcile stable IDs on approval and never duplicate child issues into tasks. Preserve completed work and history.
- State key is `cc-studio-issues-batch1`; migrate v2 safely without overwriting its original storage. Fresh sample hierarchy must never replace the user's existing data.
- Label-aware generation and the two-panel Aria execution experience belong to Batch 2. Run/event/artifact references are only a foundation in Batch 1.
- Run `npm run check`, `npm test`, and `npm run build`. Node 22.18+ supports the model tests. Use isolated browser contexts for destructive QA changes.

- Latest simplification: show one Issue / Story / Epic work-type control in creation and property editing, with no multi-label checklist or parent dropdowns. Preserve existing label metadata and hierarchy validation. New Aria runs capture planning context; full generation remains Batch 2. Table column is Label, not Created in; retain source on the detail page.

The issue table now shows Type (Issue / Story / Epic) derived from work type, rather than legacy labels. Existing labels remain stored.

Latest UI refinement: table has a dedicated Priority column with compact tinted High/Medium/Low pills; Awaiting verification is hidden in table rows. Toolbar is search plus Type, with status tabs; source, Epic, Story, label, and grouping controls are removed. Detail status badges have rounded corners and balanced padding. Issue data now lives in React state and resets to initial examples on browser reload, per user request; old stored issue data is left untouched and is no longer loaded or written. This supersedes earlier persistence and filter descriptions.

- Aria is the sole executor: remove all assignee controls and assignment text from issue creation, details, and tasks. This supersedes the Batch 1 assignment UI rule. Retain legacy assignment data internally for compatibility.

## Batch 2 (supersedes earlier conflicting implementation notes)
- Keep Issue / Story / Epic as the only visible work classifications everywhere. Preserve legacy metadata internally.
- Planning, clarification, approval, progress and results live in Issue Details. No stepper or separate execution page.
- `ariaDemo.ts` is a clearly labeled, isolated demonstration adapter. Do not imply live AI, repository inspection, tests or commits. Production events must remain separate.
- Draft work is created only on approval. Preserve IDs and completed work, reject stale/overlapping approvals, and retain excluded scope for continuation.
- The 60:40 workspace has a resizable, collapsible, read-only activity panel, independent scrolling, mobile tabs and session-only preferences. Never add a chat composer.
- Browser refresh resets all prototype state; do not restore persistent browser storage.
- Pre-Batch-2 refinement is preserved at `c89c750` on `snapshots/pre-batch2-2026-11-27`. Work continues on `design/next-two-batches`.

- Issue Details keeps its title, metadata and properties in a full-width header above the two-panel workspace. The idle Aria card uses a compact introduction with its action aligned right and expandable instructions below.

- Latest UI refinement: remove prototype/demo notices and scenario controls from product screens. The implementation remains a session-only simulation; preserve that boundary in documentation and do not invent repository artifacts. Planning uses paced scope/writing updates (about 13–15 seconds), tasks take about 6–9 seconds. Awaiting approval is a hover/focus hint, and approval actions stay visible while plans scroll.

- Layout comparison: retain the current inline layout and add a small Current / Split workspace toggle in Issue Details. Split is the default, with title/metadata/description and committed work on the left, and Aria proposals/actions/activity on the right. Only approval materializes draft tasks; after approval do not repeat the task tree in Aria. Use mobile Issue & tasks / Aria tabs. Layout selection is session-only and shared across issue navigation. The pre-split layout is preserved at 7cfffeb on snapshots/pre-split-workspace-2026-11-27.
