# CC Studio — Project Issues

A local React + TypeScript prototype of project and issue management for CC Studio. Run `npm install` and `npm run dev`, then open the local URL Vite prints. `npm run build` creates the production bundle; `npm run check` checks TypeScript and unused declarations.

## Experience

Issues lives under **Manage**, alongside Aria activity and Integrations. The project selector keeps repository configuration and issue collections separate. Existing Build sections provide lightweight project context based on the supplied CC Studio screenshot.

- Board and list views, ownership tabs, search, status/priority filters, sorting, drag-and-drop, and a keyboard-accessible status menu.
- Issue creation and editing, essential properties, comments, and local persistence.
- GitHub/GitLab repository setup with an explicitly labeled demo connection.
- Fix with Aria: optional instructions → analysis → clarification when needed → task review and assignment → explicit approval → execution → human review.
- Tasks can be included/excluded and assigned to auto-selection, frontend, backend, or quality agents. No task executes before approval.
- Responsive layout, dialog focus trapping, Escape dismissal, `/` to search, a skip link, and reduced-motion support.

Roboto is used to match the supplied CC Studio screenshot. The established purple/lavender palette is extended with restrained semantic colors. A generated avatar gives Aria a small visual identity without introducing a chat interface.

## Important integration boundary

This is a **frontend prototype**, not a connected issue-management service. Repository syncing, planning, agent selection, and execution are simulated. It never reads an actual codebase, writes an external issue, creates a branch or pull request, or modifies repository files. Browser localStorage persists project state; it is not a shared database. No provider credentials are collected.

Before production integration:

1. Replace `loadProjects`, `updateProject`, and `updateIssue` in `src/App.tsx` with authenticated service calls and durable storage.
2. Add GitHub App/GitLab OAuth authorization server-side, repository access checks, webhook validation, idempotent event handling, and conflict resolution for two-way issue updates.
3. Replace `taskPlan` in `src/data.ts` with repository-aware planning. Persist clarification answers and approved task revisions.
4. Replace the demo execution timer with agent job events. Enforce the approval gate on the server, and stream task status to the existing UI.
5. Return real change summaries, test results, diffs, and pull-request links for human review. The completion screen currently labels all results as simulations.

## Validation performed

The production build and TypeScript checks pass. Browser checks covered issue creation, search, list view, approval of selected tasks only, agent assignment, execution completion, persistence after reload, required custom clarification, saved answers, project isolation, GitLab demo setup, column-aware creation, status changes, Escape dismissal, search shortcut, and mobile viewport/dialog bounds. No browser console errors were observed. Test-created data was removed after verification.

## Animation and asset provenance

GSAP handles initial workspace and dialog transitions. Motion is scoped and cleaned up with `gsap.matchMedia`, and respects the system reduced-motion preference. See the [official GSAP documentation](<https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/>).

The Aria avatar is saved at `public/assets/aria-avatar.png`. It was created using the built-in image-generation tool with transparency and copied into this project. Generation prompt:

> Use case: stylized-concept. Create a polished tiny AI assistant avatar for a premium developer productivity app named Aria. One single centered friendly floating 3D character: a softly rounded lavender-purple four-point star/pillow shape, with two small deep-indigo pill-shaped eyes, a tiny gentle smile, and a soft glossy clay material. Sophisticated and restrained, not childish, no hands, no legs, no accessories, no text, no letters, no surrounding objects. Primary hues #7055e8 and pale lilac #c4b5ff, with subtle bright specular highlight upper left. Front-facing with a very slight charming tilt. The character must be legible at 32px as well as 120px. Fill 80% of a square canvas. Isolated on genuinely transparent background, clean alpha edges. This is a UI mascot asset, not an app screen or logo. No cast shadow outside the character.

The local `.fig` reference was inspected through its archive metadata and embedded thumbnail; it did not contain a shareable file key for the Figma API. The two attached screenshots guided the implemented shell and Aria visual direction.
