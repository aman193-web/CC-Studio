# CC Studio — Issues design prototype

The active portal follows the supplied SVG design and opens on **Features**. The **Issues** tab retains the interactive issue-management and Aria prototype.

- [Current design](http://127.0.0.1:5173/)
- [Preserved first design](http://127.0.0.1:5173/v1/index.html)
- [Version history and project memory](VERSION_HISTORY.md)

## Run

```sh
npm install
npm run dev
```

`npm run check` checks TypeScript and unused declarations. `npm run build` creates the production bundle, including the frozen first-version preview.

## Included

List and Kanban board views with shared status tabs, search, creation-source filtering, list pagination, inline status access, and issue creation/editing. Board cards move between statuses by drag-and-drop or a keyboard-accessible dropdown. The List / Board preference persists locally. Issue details have dedicated routes (`/#issues/42`) with a back button and browser-history support. New issues are created in a right sidebar that opens the resulting detail page after submission. The existing star mascot sits at the right of the status tabs, with gentle animation and reduced-motion support. The welcome banner has been removed and the header compacted. Every issue identifies **CC Studio** or **GitLab** as its origin and exposes a GitLab ticket link.

GitLab is shown as already connected. There is no provider selection, authorization, or reconnection flow. Ticket links open a clearly labeled design preview with a placeholder project path; the user explicitly requested design only.

**Fix with Aria** opens a focused workflow: optional instructions, simulated analysis, clarification, task/subtask review, assignment, approval, progress, and completion. State is saved locally with a separate storage key from version 1.

The original shell controls are retained visually. Features follows the supplied SVG layout with the existing Roboto font family; unrelated existing controls are outside this prototype's implementation scope. No real issues, repository changes, credentials, or deployments are created.

## Files

- `src/App.tsx`: retained shell, simplified Issues view, issue editor, ticket preview.
- `src/IssueBoard.tsx`: Kanban cards, status movement, and shared Aria buttons.
- `src/issues.css`: scoped Issues visual refresh and reduced-motion-aware animations.
- `src/AriaWorkflow.tsx`: task-focused Aria workflow and accessible dialogs.
- `src/data.ts`: sample issues and deterministic task plans.
- `src/styles.css`: reference shell and Issues styles.
- `src/workflow.css`: retained workflow styles.
- `versions/v1/`: source snapshot of the first design.
- `public/v1/`: frozen first design, served separately.

The generated Aria avatar is reused from version 1 at `public/assets/aria-avatar.png`. Its original generation prompt and provenance are preserved in `versions/v1/README.md`.

## Verification

TypeScript and production build pass. Browser checks verified the existing connected state, creation-source filtering, status filtering, pagination, sample GitLab ticket previews, new-issue origin, Aria planning/approval/completion, reload persistence, mobile viewport and dialog bounds, and the frozen first-version preview with its assets. No console errors were observed. Test-created issues were removed.

Latest verification: List / Board switching, persisted view preference, drag and dropdown status changes, shared filtering, ticket previews, Aria entry points, keyboard focus, reduced-motion behavior, and 1920 / 1024 / 390 px layouts passed. Test status changes were restored. Open `/#issues` to preview Issues directly.

Navigation refresh verification: dedicated detail routes/reload, browser Back and Forward, preserved search/view on return, inline editing, retained detail context after GitLab/Aria overlays, drawer validation and creation, keyboard focus, and mobile page/drawer bounds. Test issues and edits were restored after checks.

Aria and ticket actions render as in-tab pages, retaining the Studio shell, rather than dialogs or whole-portal pages. Verified analysis → approval → execution → completion, clarification, browser Back, desktop/mobile bounds, and the avatar’s status-row placement.
