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
