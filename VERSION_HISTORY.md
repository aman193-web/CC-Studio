# CC Studio design versions

## Version 2 — existing Studio shell + Issues

Preview: [current design](http://127.0.0.1:5173/).

Source: `src/`. State key: `cc-studio-issues-v2`.

The user's revised direction is to retain the current CC Studio layout and add only an Issues tab. The portal shell was subsequently updated to the supplied 1440 × 931 SVG on November 27, 2026. The vector logo is extracted directly from that asset; header and panel dimensions, colors, card spacing, full suggestion text, and composer styling follow the SVG. Roboto remains the existing application font. Features now opens first, with Issues retained in the tab row. The SVG is retained at `public/portal-reference.svg`.

Issues now offers a List / Board toggle, status tabs, search, creation-source filtering, list pagination, and a shared Aria action. The four-column Kanban board supports dragging between statuses and an accessible status dropdown. View preference is saved separately in `cc-studio-issue-view`. The welcome banner has been removed; the existing star mascot now sits to the right of the status tabs, and the Issues header is compact without a project caption; button and card-entry motion respects reduced-motion settings. The surrounding SVG-based portal remains unchanged. Each issue shows where it originated and a GitLab ticket link. GitLab is already connected; there is no connection setup. Ticket links open a design preview instead of navigating to invented live tickets. Aria's planning, approval, and execution remain interactive simulations.

Issue navigation now uses dedicated detail pages at `/#issues/<id>` with browser history support and a Back to issues action. Creation uses a right-side drawer with pinned actions; submitting opens the new detail page. Typography gives the Issues title priority over the Aria banner and distinguishes section headings, item titles, body copy, and labels.

## Version 1 — standalone project-management workspace (preserved)

Preview: [first design](http://127.0.0.1:5173/v1/index.html).

Source snapshot: `versions/v1/`. Frozen build: `public/v1/`. State key: `cc-studio-projects-v1`.

The user liked this version and explicitly asked that it be kept separately. It has its own sidebar, project issue board/list, Aria activity rail, banner, and repository setup preview. It should remain unchanged while the new design evolves.

The snapshot includes source, dependencies/lockfile, build configuration, public assets, and original README. The frozen build can be opened on the same dev server without rebuilding or switching branches.

Aria actions and ticket previews now use dedicated in-tab pages at `/#issues/<id>/aria` and `/#issues/<id>/ticket`, retaining the Studio header, navigation, and assistant panel. All workflow stages remain inside Issues, with back/history support. New issue stays a right-side drawer.

## Batch 1 — hierarchy and independent work

Branch: `design/next-two-batches`. The pre-batch version is preserved on `snapshots/current-2026-11-27` at `53fbdcc`; `main` is unchanged.

Batch 1 supersedes the four-column board and manual status movement described above. It adds Epic/Story labels on the unified Issue model, validated parent links, grouped List and filtered three-column Board views, shared creation/editing, independent tasks/subtasks, and data-preserving migration. Primary statuses are To Do, AI Working, and Completed; execution alone controls AI Working. Details remain inline in Issues, with compact properties in the title/byline area and no chat sidebar.

Batch state uses `cc-studio-issues-batch1`, migrating from the original v2 key without overwriting it. Fresh sample data adds Epic/Story hierarchy around existing examples; existing sessions are not replaced with sample data. See README for migration and preview-execution boundaries. Batch 2 label-aware generation and read-only execution panel are not implemented in Batch 1.

Batch 1 refinement: creation and editing use a single Issue / Story / Epic choice, without label checklists or parent dropdowns. Existing metadata remains saved; new runs capture work-type context. The table replaces Created in with Label, avoiding duplicate labels under the title. Source stays in details.

The issue table now shows Type (Issue / Story / Epic) derived from work type, rather than legacy labels. Existing labels remain stored.

Latest UI refinement: table has a dedicated Priority column with compact tinted High/Medium/Low pills; Awaiting verification is hidden in table rows. Toolbar is search plus Type, with status tabs; source, Epic, Story, label, and grouping controls are removed. Detail status badges have rounded corners and balanced padding. Issue data now lives in React state and resets to initial examples on browser reload, per user request; old stored issue data is left untouched and is no longer loaded or written. This supersedes earlier persistence and filter descriptions.

UI consistency pass: shared Issues polish styles in `src/issue-polish.css` normalize small metadata text, badge sizes, table alignment, board spacing, detail property heights, and drawer gutters/radio controls. Verified list, board, details and drawer at 390, 768 and 1440 px without document overflow or runtime errors. Portal shell and frozen v1 remain unchanged.

## Batch 2 — inline Aria workspace

The refined pre-Batch-2 version is preserved at `c89c750` on `snapshots/pre-batch2-2026-11-27`.

Replaced the five-step wizard with direct planning and a compact two-panel Issue Details workspace. Added type-aware demonstration plans, proposed Stories/tasks/subtasks, clarification, scoped approval, task preservation, revision history, blockers/retry/stop, partial-run continuation and contextual result actions. The read-only activity feed supports grouped details, user-controlled auto-follow, resizing, collapse, mobile tabs and session-only state. Only Issue / Story / Epic appear as classifications. No assignees or removed filters were restored.

Execution is explicitly demonstrated, with no live Aria/repository backend. Code changes are shown only when actual artifact URLs are supplied. Full browser refresh resets to the initial data. V1 remains unchanged.

- Issue Details keeps its title, metadata and properties in a full-width header above the two-panel workspace. The idle Aria card uses a compact introduction with its action aligned right and expandable instructions below.

## Split workspace comparison — 27 November 2026

The Current / Split workspace toggle lets reviewers compare both layouts using the same issue data. Split puts issue context and committed tasks on the left, Aria planning and actions on the right. Approval moves tasks and subtasks into the left implementation section; progress remains on the right. The previous version is preserved at `7cfffeb` on `snapshots/pre-split-workspace-2026-11-27`.

- Refined the split option to 60:40, moved description under the title, compacted properties, and centered the larger Aria avatar in a full-width welcome. Added scoped GSAP motion with reduced-motion support; the Current layout remains available.

## In-place Aria actions and optional Auto mode — 27 November 2026

Compacted issue details and filled the Aria pane height. Left-side tasks are a content list; right-side Aria owns execution progress. List and Board Fix with Aria now start in place, with Review opening a right sidebar that expands into the shared issue workspace. Added an opt-in Auto mode for autonomous simulated planning and execution, editable table priorities, and subtle avatar reactions without hearts. Current/Split comparison and frozen versions remain available.
