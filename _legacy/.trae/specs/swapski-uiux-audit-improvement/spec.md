# Swapski - Full UI/UX Audit + Improvement Spec

## Overview
- **Summary**: Audit the entire Swapski SPA end-to-end (17 screens + 6 workspace tabs + 4 modals) and fix all identified issues: broken navigation, undefined renders, unreachable pages, inconsistent categories, layout/alignment bugs, responsive problems, accessibility failures, clutter, state sync bugs, broken interactions, and visual hierarchy problems. Preserve core functionality, branding (Swapski), and feature set — do NOT add new features or redesign identity, just polish to professional production quality.
- **Purpose**: Users currently experience broken task-tab buttons, dead code paths, unreachable pages (Discover, Wallet), cramped layouts, missing confirmations, and 18 high-severity issues. The audit's 87 findings represent a clear quality gap between "prototype" and "polished product" — close that gap.
- **Target Users**: Demo users (Maya/Leo/Sana/Rafael personas) + reviewers who will evaluate based on: navigation that works, clean visual hierarchy, responsive layout, consistent components, no dead space, confirmations on critical actions, no console errors, and end-to-end flows that complete cleanly.

## Goals
1. Eliminate ALL 18 HIGH-severity findings from the audit report (broken features, unreachable pages, undefined function calls, overflow, accessibility WCAG failures, dangerous 1-click actions).
2. Reduce 48 MEDIUM findings by 80% via layout/clutter/typography fixes.
3. Improve the 21 LOW findings where straightforward.
4. Every single route defined in `renderPrivateView` pageMap is reachable via sidebar + route hash, with consistent standardized names (no Saved/Favorites or Alerts/Notifications split labels).
5. Core user flows (Sign in → Marketplace → Request + Accept → Chat → Workspace 6 tabs → Deliver → AI review → Escrow release → Credits earned → Review → Completed task) complete end-to-end with 0 console errors, 0 dead clicks, 0 ambiguous state.
6. Remove duplicate rendering code for chat thread into a single shared `renderThread()` helper.
7. Improve visual polish across board: typography hierarchy, spacing, consistent chips/tags/eyebrows, scroll affordances, proper empty states, reduced clutter, removed repetitive text.
8. Accessibility: keyboard-accessible tabs/switches, proper role=switch, star-rating SR order, aria-labels, semantic HTML.

## Non-Goals
- Do NOT add new features beyond fixing broken ones. No new skill suggestions, new pages beyond the 3 hidden ones, no new user-facing toggles.
- Do NOT redesign Swapski's identity. Keep Inter font, cyan/purple/green brand palette, glassmorphism aesthetic, SWAP.png logo.
- Do NOT replace Bootstrap utility usage or rewrite CSS framework to Tailwind — incremental CSS fixes only, align to existing variables.
- Do NOT add any real backend API integration. Keep everything localStorage/mock/simulated.
- Do NOT change the messages ledger/escrow/wallet data-model invariants (balances derive from immutable ledger, no direct mutation).
- Do NOT add user profiles/features beyond the 4 seeded users.

## Background & Context
- Baseline Evidence: Subagent run "Swapski End-to-End UI Audit" produced `SWAPSKI-AUDIT-REPORT.json` (project root) with 87 findings across 17 screens. Top 20 prioritized.
- Prior session resolved bugs: handleClick guard order (upload "going back"), 4 const TDZ crashes (PROGRESS_PHASES, TASK_BRIEFS, AI_PERSONAE, REVIEW_TEMPLATES), DEMO_TOUR_STEPS TDZ (blank page). But close-workspace guard logic still blocks ALL buttons inside stop-propagation cards TODAY (user complained task tab buttons non-functional) — must be fixed in this effort.
- Architecture reference: `.trae/documents/swapski-technical-architecture.md` defines routes wallet/discover/wallet and data model. Those defined routes MUST be reachable now.
- Files in scope: `app.js` (~4600 lines, 39 render functions), `styles.css` (~2500 lines), `data.js` (seed state + lookup tables), `index.html` (shell + CDNs).

## Functional Requirements
- **FR-1**: Every route defined in architecture (landing, auth, onboarding, dashboard, marketplace, profile, requests, wallet, messages, tasks, settings, discover, favorites, notifications) is reachable via sidebar navigation, hash URL, and valid `normalizeRoute()` guard.
- **FR-2**: Route labels are consistent: sidebar = page title h1 = route key in state (Saved→Favorites, Alerts→Notifications, add Wallet + Discover). Dashboard route renamed to `overview` for clarity with sidebar.
- **FR-3**: `renderDiscover()` function is wired into pageMap, route normalization, and sidebar. All category filter icons use Bootstrap Icons 1.11.3-valid class names (no broken icons).
- **FR-4**: `renderWallet()` is wired into pageMap, route normalization, sidebar. No broken charts or missing sections.
- **FR-5**: `renderFavorites()` / saved-services no longer call undefined function `serviceCard()`. Replace with correct renderer (`renderServiceCard` or `compactService`).
- **FR-6**: Marketplace filter categories and create-service categories are the SAME source-of-truth single constant. 0 overlap mismatch; filtering by "Development" finds services created in category "Development".
- **FR-7**: handleClick guard order FIXED correctly: inside `data-stop-propagation` cards, clicks on elements that HAVE `data-action` or `data-route` are PASSED THROUGH (close-workspace, switch-workspace-tab, remove-delivery, ask-ai, upload-deliverables, view-escrow all work). Only non-action clicks INSIDE stop-propagation are blocked (to prevent backdrop close). Same for `<form>`: actual data-action buttons inside ANY form work.
- **FR-8**: Chat thread rendering extracted to a single shared helper `renderThread(requestId, opts)` used by Messages page, Workspace Chat tab, and any future conversation modal. Input bars have consistent behavior.
- **FR-9**: Workspace AI Assistant has working submit handler: `ai-assistant-form` id → handleSubmit branch → appends to `state.ui.aiAssistantChat[requestId]`, suggestion chips fill input via data-action.
- **FR-10**: Settings toggle switches use REAL `<input type="checkbox" role="switch">` with aria attributes, keyboard focusable, Space/Enter toggles work, CSS visual state bound to `:checked` pseudo-class.
- **FR-11**: Escrow release action (approveRequest) has 2-step confirmation: native confirm() or custom modal with "Release XX credits to Provider? This is irreversible" + cancel/confirm. No 1-click irreversible currency movement.
- **FR-12**: `renderModal()` guard: for any unhandled modal trigger state, showToast warning instead of blank invisible overlay. Explicit case for conversation modal or design decision + toast if not implemented.
- **FR-13**: 5-star rating CSS stops using `direction: rtl` — use `flex-direction: row-reverse` to preserve DOM/screen-reader star-1-first order while keeping visual right-to-left hover-sibling effect.
- **FR-14**: Tasks kanban at common resolutions 1280–1440px doesn't silently overflow with no affordance. Use `overflow-x: auto` with visible scroll indicator or fade masks + `min-width: 220px` per column.
- **FR-15**: Workspace 6 tabs at common modal widths don't silently hide Deliverables/Activity/Escrow. Add scroll visual affordance or wrap at widths < 1100px.
- **FR-16**: Messages layout conversation-list shrinks to 280px on desktop from 340px. Chat panel width expands accordingly, bubbles are more readable.
- **FR-17**: Profile layout restructuring: profile header (hero) full-width TOP row, below left=280px meta/skills rail, right=services/reviews 1fr. No squeezed sidebar-hero from before.
- **FR-18**: Landing hero preview cards stop using absolute positioning with fragile offsets. Use CSS grid `grid-template-areas` responsive. No overlap at tablet breakpoints 720-1200px.

## Non-Functional Requirements
- **NFR-1**: All screens render with ZERO uncaught console errors at load + during interaction. `browser_console_messages` returns empty `[]` after each route switch and action.
- **NFR-2**: Visual consistency metrics: ALL chips/tags/badges/eyebrows use same radius (12px) + same padding scale (8/10/14); all `<form>` labels use `.form-label` class + same spacing (8px before inputs, 16px between stacked inputs); card component `.glass-card` and `.glass-card-soft` have ONE border-width + ONE radius definition globally, no overrides.
- **NFR-3**: Responsive: breakpoints: <480px mobile, 768px tablet, 1280px default, 1600px wide. No horizontal scrollbars except deliberate kanban overflow with affordance.
- **NFR-4**: Accessibility (WCAG AA minimum):
  - All interactive elements 44x44 px hit area.
  - Focus styles visible (outline-2, 2px, cyan offset-2) on every button/input.
  - Color contrast for body text ≥ 4.5:1 against backgrounds.
  - Semantic `<nav>`, `<main>`, `<section>`, `<article>` usage (no `<div role=main>`).
  - No tabindex hacks; natural tab order matches visual order.
- **NFR-5**: Performance: `renderApp()` full re-render completes in < 100ms on warm load; no leaks from orphaned event listeners, all listeners on document delegation, no duplicate setState() on same interaction.
- **NFR-6**: Clutter removal: repetitive text/copy shrunk by 30%. Eyebrow duplicates removed. Duplicate hero CTAs consolidated. "Add to Chat" stray text at end of every page removed. Any stray duplicate buttons (e.g. multiple "Start a swap" or duplicated "Explore Marketplace") consolidated to one.
- **NFR-7**: Error/empty states: every list/map/column has a standardized `.empty-state` component render with icon + headline + copy + optional CTA when empty (no "No tasks in this column right now." without icon or structure).
- **NFR-8**: Code quality: `node --check app.js && node --check data.js` exit 0; GetDiagnostics empty array []; no TODO/FIXME comments added without reference; keep new code conforming to existing vanilla JS ES6 pattern (no imports/exports or modules); setState() used for all state mutations.

## Constraints
- **Technical**: Vanilla HTML/CSS/ES6. No React, no Tailwind, no bundler. Bootstrap 5 utilities + Bootstrap Icons 1.11.3 via CDN. localStorage persistence under `swapski-spa-state-v1`.
- **Business**: Preserve Swapski brand identity, route naming patterns from architecture doc, 4 demo users, core task lifecycle state machine (requested→accepted→in_progress→review→completed), escrow rules (approveRequest releases via ledger).
- **Dependencies**: Fixed CDN versions only. `bootstrap@5.3.8`, `bootstrap-icons@1.11.3`, Inter font from Google Fonts.

## Assumptions
- The `serviceCard` undefined function in renderFavorites (FR-5) is indeed a latent bug even if not currently triggered in current localStorage state — we must still fix it.
- User will approve spec + tasks before we implement.
- The Python http server on port 8000 will remain running during the entire verification phase so integrated browser can test.
- Bootstrap Icons 1.11.3 loaded via CDN has a known set; any `-fill` variants not in 1.11.3 need manual verification by checking `bi-*` availability against the 1.11 docs.

## Acceptance Criteria

### AC-1: All architecture-defined routes reachable + consistent naming
- **Type**: `rule`
- **Given**: Authenticated demo user Maya on Tasks page
- **When**: User clicks each sidebar nav link and also manually visits every architecture route via hash (`#/wallet`, `#/discover`, etc.)
- **Then**: Every route renders its correct component (sidebar icon + label + page title match). Sidebar has Wallet + Discover entries. Favorites sidebar label reads "Favorites" (not "Saved"). Notifications sidebar label reads "Notifications" (not "Alerts"). Sidebar "Overview" maps to route key consistently.
- **Pass Condition**: Count 12 successful private routes × 2 methods (sidebar click + hash URL) all render with matching titles; console error count = 0.
- **Evidence**: Screenshots of sidebar with all 12 links, snapshot showing Discover and Wallet sidebar refs visible, browser_console_messages empty.

### AC-2: renderDiscover wired + valid icons
- **Type**: `rule`
- **Given**: Fresh localStorage + demo login
- **When**: Navigate to Discover via sidebar
- **Then**: All 12 category tabs show ICONS (no blank squares due to wrong `bi-*` names). User filter works — checking category filters reduces card set. Empty state shows if no users match.
- **Pass Condition**: All Discover tab icons render (browser screenshot visually shows 12 glyphs no blanks). Bootstrap Icon names verified against 1.11.3 valid set.
- **Evidence**: 02-discover-icons.png screenshot; grep of app.js for `bi-grid-3x3-gap-fill | bi-braces-asterisk | bi-palette-fill | bi-brush-fill | bi-compass-fill | bi-megaphone-fill` returns 0 matches (replaced).

### AC-3: renderWallet wired
- **Type**: `rule`
- **Given**: Maya demo user with seeded ledger (earn + lock entries)
- **When**: Click Wallet sidebar link
- **Then**: Wallet page renders with: wallet-figure (available / earned / spent / escrow), ledger table rows, bar visualization, illustration. No undefined references.
- **Pass Condition**: Snapshot refs include at least 4 metric cards + 1 ledger table + page title "Wallet".
- **Evidence**: 03-wallet-rendered.png + snapshot showing ledger rows.

### AC-4: Favorites/Saved uses correct renderer
- **Type**: `rule`
- **Given**: Create 1 fake saved service entry in state for Maya user via evaluate
- **When**: Navigate to Favorites page
- **Then**: No "undefined is not a function" crash. Saved service cards render correctly with title/category/provider.
- **Pass Condition**: console 0 errors, cards with text appear below "Saved services" h1 after injected savedSvc entry.
- **Evidence**: Grep finds `serviceCard(` 0 occurrences in app.js final; code review shows `renderServiceCard` or `compactService` used instead.

### AC-5: Single source-of-truth category constant
- **Type**: `rule`
- **Given**: Create-service form opened + marketplace filter bar both rendered
- **When**: Compare the options in create-service `<select>` + the marketplace filter category tabs
- **Then**: Category sets are IDENTICAL lists rendered from ONE const. E.g. if "Development" is a filter option, it's also a select option in create-service with same exact capitalization.
- **Pass Condition**: One `const CATEGORIES` defined (used BOTH by getCategoryIcon AND renderCreateService form select). Extract and dedupe. No overlap mismatch possible.
- **Evidence**: Grep: `CATEGORIES` used ≥2 places; diff between create-service options text list vs marketplace filter text = empty.

### AC-6: handleClick correct guard order — ALL workspace buttons work
- **Type**: `rule`
- **Given**: Workspace modal open (6 tabs rendered)
- **When**: User clicks in series: Close, Overview, AI Assistant, Chat, Deliverables, Activity, Escrow tabs, Ask AI, Upload deliverables, View escrow, on Deliverables tab: remove-delivery trash icon, Save to Deliverables submit button
- **Then**: EVERY click does its expected action. Workspace DOES NOT close unexpectedly for non-close clicks. Save submit does NOT close workspace. Tab switches work. Close DOES close.
- **Pass Condition**: 13 clicks × expected result OK; no state.ui.showWorkspace changes on 11 non-close actions; console 0 errors.
- **Evidence**: Snapshot before/after each click showing state.ui.workspaceTab transitions + Save to Deliverables increments deliveries without close; browser_console_messages empty.

### AC-7: Shared renderThread DRY
- **Type**: `rule`
- **Given**: Messages page renders conversation + Workspace Chat tab renders same requestId conversation
- **When**: Compare HTML output for the message list
- **Then**: BOTH bubble lists are generated by ONE function `renderThread(requestId, {showTitle:false, wrap:true})`. Input bars look identical. A bug fix to bubble classes in one place applies to both surfaces.
- **Pass Condition**: Code search for renderThread function definition (one function only) + callsites ≥ 2 (messages.js renderConversationPanel + renderWorkspaceChat).
- **Evidence**: grep -n `renderThread` shows 1 definition + 2+ calls. No duplicate bubble render inline HTML strings.

### AC-8: Workspace AI Assistant working
- **Type**: `rule`
- **Given**: Workspace AI Assistant tab active
- **When**: Type a question + press Enter/Send, or click a suggestion chip
- **Then**: Input value added to `state.ui.aiAssistantChat[requestId]` list; render shows bubble; suggestion chip auto-fills input; simulated AI response bubble appears after ~1s (no real LLM — fake canned reply OK).
- **Pass Condition**: After 1 typed + 1 chip click, messages in aiAssistantChat.length >= 2; console 0 errors.
- **Evidence**: evaluate aiAssistantChat entry count >= 2, snapshot shows user bubble + AI reply bubble.

### AC-9: Settings switches keyboard/SR accessible
- **Type**: `rule`
- **Given**: Settings page with 4 toggles (smart notifications, weekly digest, public profile, reduced motion)
- **When**: Keyboard Tab from top → every switch receives focus in order; Space bar toggles one switch
- **Then**: Each toggle is real `<input type="checkbox" role="switch" aria-checked="true/false">`; state.preferences toggles correctly; visual state updates (on/off) through CSS `:checked` not just div.active.
- **Pass Condition**: 4 switches all = `<input type=checkbox role=switch>` in snapshot/evaluate query. Focus ring visible. `state.preferences.smartNotifications` flips after a programmatic Space press simulate.
- **Evidence**: evaluate Array.from(document.querySelectorAll('.switch input[type=checkbox]')).length = 4; Space simulation toggles preference correctly.

### AC-10: Approve request = double confirm
- **Type**: `rule`
- **Given**: Any task in "review" status with escrow locked (req_1 after submit delivery review triggers)
- **When**: User clicks Release escrow or system calls approveRequest via AI workflow
- **Then**: BEFORE ledger mutation, a confirmation UI shows "Release 95 credits to Maya Chen? Irreversible — are you sure?" with Cancel + Confirm. Clicking Cancel returns to state unchanged; Confirming proceeds.
- **Pass Condition**: ApproveRequest function top checks for explicit `opts.confirmed` flag OR shows confirm(). Cypress-like evaluate mock that calls approveRequest('req_1', {confirmed:false}) returns early without touching ledger entries. With confirmed:true, entries added.
- **Evidence**: Code inspect confirm dialog inside approveRequest; evaluate tests {confirmed:false} no-op then {confirmed:true} 2 ledger unshift entries; browser_click on cancel keeps state same.

### AC-11: Unhandled modal guard + conversation modal design decision
- **Type**: `rule`
- **Given**: Attempt to trigger modal states that are undefined (e.g. `state.ui.showSignIn = true`)
- **Then**: A showToast warning appears OR code handles, but NOT blank overlay. If conversation-as-modal decision made, implement renderModal conversation case; otherwise explicit guard toast. "Open conversation" action naming consistent with behavior (navigate to /messages or OPEN modal — one consistent pattern).
- **Pass Condition**: renderModal function returns empty string (not undefined) with a toast if unhandled state variables are truthy. No blank invisible overlays. 0 handleClick ambiguity between open-conversation = navigate vs modal.
- **Evidence**: renderModal has final `else` branch showing showToast("Modal not implemented") when unhandled; open-conversation action clearly navigates OR opens modal, code + naming consistent.

### AC-12: 5-star rating LTR accessible
- **Type**: `rule`
- **Given**: Submit delivery review modal with 5-star rating component
- **When**: Run VoiceOver-like evaluation: check star input DOM order, tabindex, and aria
- **Then**: DOM star 1 = leftmost visually; DOM star 5 = rightmost visually (flex-direction: row-reverse). CSS sibling hover/checked selectors still work. No `direction:rtl` on rating wrapper or star input container.
- **Pass Condition**: Grep for `.rating-input { direction: rtl }` returns 0 matches; `.rating-input { flex-direction: row-reverse }` present 1+; DOM order in evaluate matches visual order for SR.
- **Evidence**: Final styles.css grep; evaluate DOM order + visual order both Star 1 first in DOM = leftmost visually.

### AC-13: Tasks kanban scroll affordance + min widths
- **Type**: `rule`
- **Given**: Tasks page at 1440px viewport width
- **When**: Inspect kanban columns container
- **Then**: CSS has `overflow-x: auto` on task-grid wrapper; each column min-width 220px; visual scroll affordance (fade edges or always-thin scrollbar); last column "Completed" reachable by scrolling or visible arrow.
- **Pass Condition**: CSS `.task-grid` overflow-x set correctly; at 1440px horizontal scroll bar visible or fade mask present.
- **Evidence**: Screenshot 1440px shows overflow affordance; browser_scroll by 500px right moves Completed column into viewport correctly.

### AC-14: Workspace tabs scroll affordance
- **Type**: `rule`
- **Given**: Workspace overlay at 1200px inner width
- **When**: Check workspace-tabs div
- **Then**: 6 tabs fit OR if overflow: fade masks left/right edges + thin visible scrollbar OR wrap to two rows on narrow widths; user visibly can tell there's "more tabs to scroll". No `scrollbar display:none` without fade replacement.
- **Pass Condition**: All 6 tab labels visible in snapshot OR scroll/fade present; clicking on Escrow (6th tab) actually reaches it at 1200px.
- **Evidence**: Before/after: old snapshot 6th tab off-screen; new snapshot 6th tab reachable (scroll or wrap).

### AC-15: Messages layout, Profile layout, Landing hero responsive (3-in-1 rule)
- **Type**: `rule`
- **Given**: 1440px viewport, default theme
- **When**: View Messages, Profile, Landing hero
- **Then**: (1) Messages: list 280px, panel 1fr; (2) Profile: hero full-width top, meta/skills rail 280px left, services + reviews right column; (3) Landing: hero preview cards in grid 1440px clean, 720px tablet stacked no overlap, no bleed past hero-panel bounds.
- **Pass Condition**: Screenshot 1440px + 900px each page clean, no overflow, no overlap artifacts.
- **Evidence**: 04-messages-layout.png, 05-profile-layout.png, 06-landing-720px.png all without redlines.

### AC-16: Zero console errors rule
- **Type**: `rule`
- **Given**: Full end-to-end flow walkthrough (landing → launch demo → marketplace → request service → tasks → workspace all 6 tabs → submit deliverables → AI review → escrow → credits → rating → completed)
- **When**: After the full flow, check console messages + run node --check both files + GetDiagnostics
- **Then**: browser_console_messages = [] empty array; node --check exit code 0 both files; GetDiagnostics [].
- **Pass Condition**: Every tool returns empty/0.
- **Evidence**: Explicit tool call outputs pasted as evidence.

### AC-17: Visual hierarchy + typography (rubric)
- **Type**: `rubric`
- **Dimension**: Clarity of information hierarchy across the whole app
- **Scale**: 1-5
- **Anchors**: 1 = indistinguishable headlines from body, random sizes, no consistency; 3 = h1/h2/h3 clear, some stray repetitive text clutter remains; 5 = crisp 4-level hierarchy (eyebrow → h1 → h2 → h3 → body → caption → micro), eyebrow variants rare and semantic, badges/metrics distinct sizes, 0 repeated redundant copy, form labels 14px 600 consistently, no placeholder as label.
- **Pass Threshold**: >= 4
- **Evidence**: Before/after screenshots per page; reviewer subjective score with rationale.

### AC-18: Spacing + alignment consistency (rubric)
- **Type**: `rubric`
- **Dimension**: Consistent spacing scale across components
- **Scale**: 1-5
- **Anchors**: 1 = random 6/10/14/18/22/28 padding mixes; misaligned card grid; 3 = uses --space-stack sometimes; most cards aligned 16px; 5 = 100% spacing from 8-px scale (space-stack + 8/12/16/20/24/32), all chips/pills uniform radius and padding, every card header baseline aligned, no stray single-pixel gap between rows.
- **Pass Threshold**: >= 4
- **Evidence**: CSS diff showing --space-stack unified; grep for random px reveals consistent 8 increments; reviewer grid-line overlay score.

### AC-19: Accessibility + interaction quality (rubric)
- **Type**: `rubric`
- **Dimension**: Accessible by keyboard, clickable actions clear
- **Scale**: 1-5
- **Anchors**: 1 = Tabs broken, switches unselectable, no focus outlines; 3 = Most buttons reachable via Tab, some focus missing; 5 = Every interactive element focus-visible in Tab order, role=switch on toggles, aria-labels on icon-only theme-toggle, submit buttons always explicit type, confirm on destructive, empty states have semantic <h3> + icon + descriptive paragraph, 44px minimum hit areas all round.
- **Pass Threshold**: >= 4
- **Evidence**: Keyboard test of 16 interactive items; screen-reader-style DOM tree check; `getBoundingClientRect` width/height >= 44 for all sampled 16.

### AC-20: Clutter reduction + empty states (rubric)
- **Type**: `rubric`
- **Dimension**: Removal of duplicate CTAs, repetitive text, dead content; uniform empty states
- **Scale**: 1-5
- **Anchors**: 1 = Duplicate "Start a swap" + "Explore Marketplace" 3+ places; "Add to Chat" stray text present; empty kanban no icon; 3 = Some reduction done, most duplicates gone, 1-2 empty states still raw text only; 5 = 30% copy reduction measurable (char count compare landing + dashboard), 0 duplicate CTAs, ALL empty states render `.empty-state` with icon + headline + copy, no stray floating text nodes, FAQ clean no overflow ellipsis on visible summary text.
- **Pass Threshold**: >= 4
- **Evidence**: Pre/post character count diff; screenshot of empty state with icon; grep of "Add to Chat" = 0 in final DOM snapshot.

### AC-21: Responsiveness (rubric)
- **Type**: `rubric`
- **Dimension**: UI holds up across 3 breakpoint widths (375px, 768px, 1440px)
- **Scale**: 1-5
- **Anchors**: 1 = Horizontal scroll bars on every page, components broken; 3 = Usable but some overlaps at mobile; 5 = Every screen adapts cleanly, bottom nav on mobile, sidebar collapses, kanban wraps to vertical cards on < 768px, form inputs stack, modals fullscreen < 480px, no component clipped or unclickable due to overflow.
- **Pass Threshold**: >= 4
- **Evidence**: Screenshots for 3 widths per key 5 pages = 15 images; reviewer inspection.

### AC-22: Navigation usability + interaction dead-button elimination (rubric)
- **Type**: `rubric`
- **Dimension**: Nav works, all buttons functional state-aware
- **Scale**: 1-5
- **Anchors**: 1 = 4+ dead buttons, 3 unreachable pages, task tab buttons hidden by workspace overlay; 3 = Pages reachable, some state misalignment on disabled; 5 = Every route discoverable via sidebar, nav labels match page titles, 100% data-action buttons have defined handler (grep every button data-action = defined case), workspace Close/X always works, disabled form buttons have visible disabled styling with reason, CTA "Run AI check" correctly requires at least 1 delivery.
- **Pass Threshold**: >= 4
- **Evidence**: Full sweep: grep list of every data-action attribute vs switch/case/if handleClick handlers = 0 orphans; manual click test of 20 representative buttons; result list attached.

## Open Questions
- [ ] For conversation "modal" vs "page" (AC-11): prefer standardizing on full-page Messages navigation (simpler, consistent with current open-conversation code) rather than adding new modal template? Assumed YES in current spec unless user prefers modal.
- [ ] For AC-5 categories: should we use parent categories (Development, Design, Creative, Research, Strategy, Tutoring) OR skill categories (13 options)? Assumed: align to the service categories that seed data already uses (svc_1 Development, svc_2 Research, svc_3 Creative, svc_4 Design) as the single source, and build marketplace filter tabs around those 5 parent + "All".
- [ ] For FR-18 landing: keep preview cards as secondary illustrations (current approach) or strip them to simple content? Assumed: keep but grid-ify, make non-overlapping.
- [ ] Accept or edit the spec + tasks before implementation proceeds. Implementation will not start until explicit approval.
