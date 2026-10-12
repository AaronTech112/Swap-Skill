# Swapski UI/UX Audit + Improvement - Implementation Plan

## Task 1: Standardize routes, sidebar, pageMap, route normalization (Discover + Wallet added, labels deduped)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - In `normalizeRoute()` valid routes list, add: `discover`, `wallet`, fix dashboard→overview.
  - In `renderPrivateView()` pageMap, wire: `discover → renderDiscover`, `wallet → renderWallet`, `overview → renderDashboard` (backwards compat accept dashboard alias)
  - In sidebar links array in renderShell/renderPrivateView:
    - add `navLink('overview', 'Overview', 'bi-grid')`
    - add `navLink('marketplace', 'Marketplace', 'bi-shop')`
    - add NEW `navLink('discover', 'Discover', 'bi-people')`
    - add `navLink('requests', 'Requests', 'bi-bag')`
    - add `navLink('messages', 'Messages', 'bi-chat-dots')`
    - add `navLink('favorites', 'Favorites', 'bi-heart')` (WAS: "Saved")
    - add `navLink('tasks', 'Tasks', 'bi-kanban')`
    - add `navLink('notifications', 'Notifications', 'bi-bell')` (WAS: "Alerts")
    - add NEW `navLink('wallet', 'Wallet', 'bi-wallet2')`
    - add `navLink('profile', 'Profile', 'bi-person-circle')`
    - add `navLink('settings', 'Settings', 'bi-gear')`
  - Ensure route aliasing: old `#/dashboard` → redirects to `overview` so hardcoded bookmarks/hash still work
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `rule` TR-1.1: After boot, 12 sidebar links rendered; DOM text contains exactly 'Discover' + 'Wallet' + 'Favorites' (not Saved) + 'Notifications' (not Alerts). Click each → route state.ui.route changes correctly. Evidence: browser_snapshot + state.ui.route before/after each click.
  - `rule` TR-1.2: hash `#/discover` and `#/wallet` manually typed in address bar render respective pages without normalizeRoute redirecting to landing. Evidence: evaluate navigate('discover') + page title renders.
  - `rubric` TR-1.3: Navigation consistency; scale 1-5; anchors 1=3+ wrong names/missing pages, 3=all pages reachable but some name mismatch, 5=every label matches title exactly, route icons semantic, icon spacing + sizing consistent; threshold >=4; evidence screenshot sidebar 1440px clean.

## Task 2: Fix Discover reachability + Bootstrap Icon class names
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1 (Discover wired)
- **Description**:
  - Ensure `renderDiscover()` called correctly with state + no undefined references.
  - Replace ALL 7 wrong Bootstrap Icon class names used in Discover category tabs, plus any stray wrong `*-fill` variants used elsewhere that don't render in v1.11.3:
    - `bi-grid-3x3-gap-fill` → `bi-grid-3x3-gap` (or `bi-grid-3x3`)
    - `bi-braces-asterisk` → `bi-braces`
    - `bi-palette-fill` → `bi-palette`
    - `bi-brush-fill` → `bi-brush`
    - `bi-compass-fill` → `bi-compass`
    - `bi-megaphone-fill` → `bi-megaphone`
    - Plus any `bi-*-fill` icons that fail to render visually (verify via browser screenshot)
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `rule` TR-2.1: Grep for original 6 wrong icon names returns 0 matches. Evidence: grep -n output empty.
  - `rule` TR-2.2: All 12 Discover category tabs render icons (screenshot shows glyphs, no blank squares). Evidence: 02-discover-icons.png screenshot.
  - `rule` TR-2.3: Click 2 categories → user list filters + count changes correctly. Evidence: evaluate state.ui.discoverCategory before/after, array.length changes.

## Task 3: Fix renderFavorites undefined serviceCard call + add empty state
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - In renderFavorites function where `savedServices.map(serviceCard)` is called, replace with correct call to `renderServiceCard(service)` or `compactService(service, true)` matching landing/marketplace style.
  - Add an if/else guard for when `savedServices.length === 0` — render standardized `.empty-state` component with icon + "No favorites yet" + "Explore services in the Marketplace" CTA button with `data-route="marketplace"`.
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `rule` TR-3.1: After injecting one fake saved service entry, navigating to /favorites renders that service's card correctly with no console errors. Evidence: evaluate inject + console check + snapshot.
  - `rule` TR-3.2: With 0 saved services, shows .empty-state div with heading + bi-heart icon + "Explore services" CTA button (clicking navigates to marketplace). Evidence: snapshot empty state + evaluate click result.

## Task 4: Single source-of-truth CATEGORIES constant + sync marketplace filter + create-service form
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Define ONE `const CATEGORIES = [ {id, label, icon, color} ... ]` at top of app.js (with the 5 other lookup tables) based on seed data ACTUAL usage (svc_1=Development, svc_2=Research, svc_3=Creative, svc_4=Design). Add "All" special entry for filter.
  - Replace getCategoryIcon/filter-tabs hardcoded lists in renderMarketplace with a loop over CATEGORIES.
  - Replace create-service modal category select options in renderCreateService/renderModal with same CATEGORIES.map generation. So dropdown = filter = exact same strings.
  - Ensure each `service.category` in seed data matches a CATEGORIES[].id exactly; if not, update seed data.js to match.
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `rule` TR-4.1: CATEGORIES constant defined at top. `Object.values(CATEGORIES).map(c=>c.label)` equals EXACTLY the options visible in both: a) create-service select, b) marketplace filter tabs (minus 'All' header if present). Evidence: evaluate both DOM nodeLists + compare text, return true for ===.
  - `rubric` TR-4.2: Marketplace tab filter usability; scale 1-5; anchors 1=0 overlap impossible to filter, 3=usable but some mismatch, 5=create+filter same categories, no orphaned services; threshold >=4; evidence seed svc_1 'Development' correctly filters when tab clicked.

## Task 5: Correct handleClick guard order — pass through data-action buttons inside stop-propagation/forms
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Current guard logic incorrectly blocks close-workspace, switch-workspace-tab, ask-ai, upload-deliverables buttons because they are INSIDE the workspace card with `data-stop-propagation='true'` OR inside workspace delivery `<form>`.
  - NEW correct guard:
    ```js
    const isElement = event.target instanceof Element;
    if (!event || !isElement) return;
    const tgt = event.target;
    const inStopProp = !!tgt.closest("[data-stop-propagation='true']");
    const formEl = tgt.closest("form");
    const hasInnerAction = !!tgt.closest("[data-action], [data-route]");
    const isSubmitInput = (tgt.tagName === "BUTTON" && (tgt.type === "submit" || !tgt.type && !tgt.dataset.action));
    if (inStopProp && !hasInnerAction) {
      event.stopPropagation();
      return;
    }
    if (formEl && !hasInnerAction) {
      // Let submit event fire normally for form submit buttons; don't look for backdrop data-action
      return;
    }
    const target = tgt.closest("[data-action], [data-route], [data-request-id], [data-conversation-id]");
    if (!target) return;
    ```
  - Critical: If the click target or its ancestor HAS data-action → `hasInnerAction=true` → guard does NOT return → handleClick proceeds correctly to action switch.
  - Add null/event.target non-Element guard (TextNode clicks → instanceof Element check → return early).
- **Acceptance Criteria Addressed**: AC-6, AC-22
- **Test Requirements**:
  - `rule` TR-5.1: Workspace overlay opened; 13-click click sequence (Close / 6 tabs / Ask AI / Upload deliverables / View escrow / Remove delivery trash / Save submit) every click fires action. For 11 non-close clicks, state.ui.showWorkspace stays true. Close click sets false. Evidence: evaluate sequential state diffs per click + browser_console_messages empty.
  - `rule` TR-5.2: Save to Deliverables submit button → form submit fires → deliveries length increments. Workspace stays open (showWorkspace still true). Counter increments correctly. Evidence: count before/after browser_type + click sequence from earlier sessions applied fresh.
  - `rubric` TR-5.3: Task tab button functionality; scale 1-5; anchors 1=all buttons dead/overlay intercepts, 3=some work some don't, 5=100% functional, no "buttons not working" complaint reproducible; threshold >=5; evidence clicks 13/13 pass.

## Task 6: Extract shared renderThread(requestId, opts) DRY helper
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - Build one `function renderThread(requestId, { wrap=true, showHeader=false })` that:
    - Finds messages by requestId
    - Sorts by createdAt
    - Renders each bubble with correct author avatar + initials + name + time
    - System bubbles use `.system-bubble` class
    - Optionally shows input bar (chat send form) via opts includeInputBar
  - Replace all inline message rendering in: (1) renderMessages → conversationPanel, (2) renderWorkspaceChat, (3) any conversation modal if built.
  - Input bar also extracted into `renderComposer(placeholder, formId)`.
- **Acceptance Criteria Addressed**: AC-7, AC-22
- **Test Requirements**:
  - `rule` TR-6.1: Code grep renderThread finds 1 function definition + 2+ callsites. No duplicate message-bubble class raw HTML template strings outside renderThread. Evidence: grep -n output.
  - `rule` TR-6.2: For requestId='req_1', Messages page bubble count equals Workspace Chat tab bubble count (same thread, same helper). Count equality checked via evaluate querySelectorAll('.message-bubble').length. Evidence: numbers match exactly.
  - `rubric` TR-6.3: Chat UI consistency across surfaces; scale 1-5; threshold >=4; evidence screenshots messages vs workspace chat side-by-side bubble visual parity.

## Task 7: Wire Workspace AI Assistant submit handler + suggestion chips + fake AI replies
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Add form id `id="workspace-ai-assistant-form"` to renderWorkspaceAI output; match in handleSubmit with branch: aiAssistantForm → append user input text to `state.ui.aiAssistantChat[requestId] = state.ui.aiAssistantChat[requestId] || []` with role='user'.
  - Add data-action="ai-chip-suggestion" to suggestion chips; handleClick reads chip text, prefills form textarea.
  - After user submit, schedule setTimeout 900ms fake AI canned reply (role='ai', text = helpful tip pulled from TASK_BRIEFS or AI_PERSONAE + small comment).
  - Initialize aiAssistantChat[requestId] with greeting when workspace first opened (overview tab on open-workspace action, if key not in object).
- **Acceptance Criteria Addressed**: AC-8, AC-22
- **Test Requirements**:
  - `rule` TR-7.1: Click 1 suggestion chip → textarea value populated with chip text (evaluate). Evidence: values match.
  - `rule` TR-7.2: Type a message, submit, count bubbles = 1 user; then after 900ms wait, count bubbles += 1 ai. aiAssistantChat[requestId].length >= 2. Evidence: evaluate with setTimeout async pattern check, state.aiAssistantChat length.
  - `rubric` TR-7.3: AI Assistant UX; scale 1-5; threshold >=4; evidence screenshot of ai bubble + suggestion chips visible working input bar.

## Task 8: Settings switches as real `<input type=checkbox role=switch>` with keyboard/ARIA accessible
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Rewrite `switchControl(name, label, value)` helper (or wherever switches are rendered) to emit:
    ```html
    <label class="switch-control d-flex align-items-center justify-content-between w-100 py-3">
      <div>
        <div class="fw-semibold text-sm">${label}</div>
        <div class="muted small">${helperText[name]}</div>
      </div>
      <input type="checkbox" role="switch" data-setting="${name}" class="switch-input visually-hidden" ${value ? 'checked' : ''} aria-checked="${value ? 'true':'false'}">
      <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
    </label>
    ```
  - Rewrite CSS styles `.switch-input:checked + .switch-track` instead of `.switch.active > .track` to bind visual state to real element.
  - Add a handleChange branch for `data-setting` attribute. When checkbox changes, setState update `state.preferences[name] = event.target.checked`.
  - Add focus-visible ring to switch-track when sibling input:focus-visible.
- **Acceptance Criteria Addressed**: AC-9, AC-19
- **Test Requirements**:
  - `rule` TR-8.1: Array.from(document.querySelectorAll('.switch-control input[type="checkbox"][role="switch"]')).length === 4 (4 settings: smartNotifications, weeklyDigest, publicProfile, reducedMotion). Evidence: evaluate === 4.
  - `rule` TR-8.2: Setting preferences toggles correctly: `.click()` on one switch (or `dispatchEvent(new Event('change'))`) → state.preferences.X flips. Evidence: before/after evaluate state.preferences values differ.
  - `rubric` TR-8.3: Settings page polish; scale 1-5; threshold >=4; evidence settings screenshot with 4 cards, helper text, not empty space.

## Task 9: Escrow release approveRequest = 2-step confirmation + no 1-click irreversible
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Add explicit `opts.confirmed` guard to approveRequest(requestId, opts = {}). If opts.confirmed !== true → return early and showToast("Please confirm release first", "warning").
  - In the workspace Escrow tab release button click handler (action "release-escrow" or "approve-request") → before calling approveRequest, first show a native `window.confirm()` with template literal text:
    ```
    Release ${formatCredits(req.creditAmount)} credits to ${provider.name}?\n\nOnce released, the credits move from escrow to the provider's available balance and cannot be reversed.
    ```
  - If user clicks OK → call approveRequest(requestId, { confirmed: true }). If cancel → do nothing, showToast("Release cancelled", "info").
  - For AI workflow auto-approval: when scheduled via setTimeout, pass `{ confirmed: true, auto: true }` explicitly to the same function so it still runs; guard checks the confirmed flag not the UI source.
- **Acceptance Criteria Addressed**: AC-10, AC-22
- **Test Requirements**:
  - `rule` TR-9.1: Evaluate mock: call approveRequest('req_1', {confirmed:false}) → returns early, 0 new ledger entries (length same). Call approveRequest('req_1', {confirmed:true}) → +2 ledger unshift entries added, status=completed, req.status='completed'. Evidence: ledger length before/after.
  - `rule` TR-9.2: browser_evaluate that stubs window.confirm to return false; clicking Release button → showToast fires "Release cancelled" and no state changes. Stub confirm = true → state progresses. Evidence: toast snapshots + state.

## Task 10: renderModal unhandled guard + open-conversation behavior clarification
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - Add final `else` branch at bottom of renderModal switch/cases (after showTaskCompleted) that: if NO known modal state matched but at least ONE modal-trigger flag truthy → call showToast("That modal is not implemented yet", "warning"), return empty string ''. No undefined HTML, no blank invisible overlay.
  - Standardize conversation behavior: audit says "open-conversation navigates to /messages (page), not modal". Accept that as design decision; rename action if desired to semantic `navigate-messages`? No — keep existing action but add a comment + ensure no other code attempts conversation modal. Ensure handleClick "open-conversation" navigates to messages AND sets activeInboxRequestId.
  - Also fix the "Sign in" modal hole: renderModal + showSignIn guard, decide one behavior. Decision: auth always uses the /auth route pages, NOT modals. Add a showToast guard if anyone sets showSignIn flag.
- **Acceptance Criteria Addressed**: AC-11, AC-22
- **Test Requirements**:
  - `rule` TR-10.1: Inject undefined modal state: state.ui.showRandomModal = true. renderModal returns empty string AND a warning toast appears in toast-stack. Evidence: evaluate + snapshot toast-stack children.length.
  - `rule` TR-10.2: Click open-conversation Chat button on task card → state.ui.route === 'messages' and state.ui.activeInboxRequestId set to conversationId match. Evidence: evaluate state.route + id.

## Task 11: Star rating accessible (LTR DOM visual, flex-row-reverse not rtl)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - In styles.css, remove `direction: rtl` from `.rating-input` class. Replace with `display: flex; flex-direction: row-reverse; justify-content: flex-end;` which achieves SAME visual effect (star 5 DOM first → rightmost visually, hover sibling selector `input:hover ~ label` still works because CSS ~= subsequent DOM nodes, which visually are to the LEFT of hovered star → correct behavior).
  - Add `aria-label="Rating star ${n} of 5"` to each radio `<input>`. Set `tabindex="0"` properly. Ensure DOM order STARTS at 1 → ends at 5.
  - Visual test: hover star 2 → stars 1+2 filled visually. If broken because row-reverse + ~ selector, fix label order carefully (labels reversed in HTML DOM so row-reverse corrects visual).
- **Acceptance Criteria Addressed**: AC-12, AC-19
- **Test Requirements**:
  - `rule` TR-11.1: Grep styles.css rating-input { direction:rtl } → 0 matches. Grep `.rating-input { flex-direction: row-reverse }` → present. Evidence: grep outputs.
  - `rule` TR-11.2: VoiceOver inspection: evaluate const order = querySelectorAll('.rating-input input[type=radio]').map(x => x.value); return order.join(',') should be '1,2,3,4,5' always. Visual screenshot order should still show star1 leftmost, star5 rightmost (row-reverse achieves). Evidence: DOM order string + screenshot.

## Task 12: Tasks kanban horizontal scroll + workspace tabs scroll affordances + fade masks
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Tasks kanban .task-grid container: `overflow-x: auto; scrollbar-gutter: stable both-edges; padding-bottom: 8px;`. Each kanban column `.kanban-column` `min-width: 240px`. Add fade masks ::before/::after at 1440px only when content actually overflows.
  - Workspace tabs div `.workspace-tabs ::-webkit-scrollbar` should be 6px visible thin gray scrollbar (not hidden `display:none`). Also add linear-gradient fade masks with `mask-image: linear-gradient(to right, black, black calc(100% - 40px), transparent)` so right edge fades, letting user know more content is scrollable to the right.
  - Alternatively: `< 1100px` allow workspace tabs to wrap to 2 rows: `flex-wrap: wrap`.
- **Acceptance Criteria Addressed**: AC-13, AC-14, AC-21
- **Test Requirements**:
  - `rule` TR-12.1: Tasks at 1440px: `.task-grid.scrollWidth > .task-grid.clientWidth` (true = horizontal overflow available). browser_scroll 400px right moves Completed column into viewport (previously off-screen). Evidence: evaluate scrollWidth > clientWidth + snapshot after scroll shows all 5 columns seen at one time or another.
  - `rule` TR-12.2: Workspace tabs 6 labels ALL clickable at 1200px modal. Evaluate `querySelectorAll('.workspace-tab')` all have `getBoundingClientRect().width > 0` (no zero-width hidden ones, i.e. truly rendered in viewport or via scroll possible). Evidence: 6 elements non-zero visible.
  - `rubric` TR-12.3: Scroll visibility polish; scale 1-5; threshold >=4; evidence screenshots showing fade/scrollbar present in both.

## Task 13: Layouts responsive — Messages list 280px, Profile full-width hero, Landing hero grid preview cards
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Messages layout CSS: `.messages-layout { grid-template-columns: 280px 1fr; }` on desktop (shrink 60px from 340px). At 768px: switch to `1fr` list first then panel below (stack).
  - Profile layout: remove 340px sidebar hero squeeze. New structure: `profile-layout = grid-template-rows: auto auto; grid-template-areas: "hero hero" "sidebar main"; profile-hero = grid-area hero full width with avatar + headline + 4 badges row + offered/wanted chips; sidebar = 280px meta; main = 1fr services + reviews`.
  - Landing hero: Remove `position: absolute` from `.preview-card.primary` + `.preview-card.secondary`. Replace hero-panel inside grid with named areas: `hero-copy hero-copy, preview-primary preview-secondary` at 1440px; at 720-1200px stack `hero-copy, preview-primary, preview-secondary` 1 column.
- **Acceptance Criteria Addressed**: AC-15, AC-21
- **Test Requirements**:
  - `rule` TR-13.1: evaluate querySelector('.messages-layout').children first column width = ~280px at 1440px (within 10px). Evidence: getBoundingClientRect().width == ~280.
  - `rule` TR-13.2: Profile page hero (name + avatar + badges) rendered at TOP of page ABOVE service cards (not in left 340px rail). Evidence: screenshot layout.
  - `rule` TR-13.3: Landing @ 820px viewport (tablet) hero-preview cards have NO bounding-box overlap with each other or hero-copy text. All text readable. Evidence: boundingBox screenshot at 820px or evaluate boundingClientRects pairwise non-overlap (no intersection).
  - `rubric` TR-13.4: Layout beauty; scale 1-5; threshold >=4; evidence 3 screenshots per layout.

## Task 14: Visual polish pass — clutter removal, spacing, badges consistency, empty states, stray text, focus styles
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 13 (layouts fixed)
- **Description**:
  - Clutter removal: delete stray "Add to Chat" text node that appears at bottom of every page (likely floating renderApp leftover); delete duplicate consecutive eyebrow labels; delete duplicate CTAs (landing/dashboard areas showing two "Explore Marketplace" 300px apart).
  - Standardize empty states into a single helper `renderEmptyState({icon, title, body, actionLabel, actionRoute})` used across: Requests empty, Saved empty, Messages empty, Tasks column empty states, Notifications empty, Wallet empty ledger, Discover empty filters, Favorites empty.
  - Standardize focus-visible: `:focus-visible { outline: 2px solid var(--cyan); outline-offset: 2px; border-radius: 6px; }` applied to all buttons/inputs/links in styles.css reset.
  - Clean typography: Enforce `.eyebrow` always has same padding/uppercase. Badge `.status-chip` and `.badge-soft` uniform 12px radius. `.chip-toggle` / `.skill-chip` same height (34px) everywhere. Consistent radii.
  - Reduce dashboard repetitive copies by ~30%: combine "11-step experience" + demo progress ribbon only show once not duplicated on both dashboard side + header + tasks side.
- **Acceptance Criteria Addressed**: AC-17, AC-18, AC-20, AC-22
- **Test Requirements**:
  - `rule` TR-14.1: In final app snapshot DOM, "Add to Chat" stray floating text count 0 (not present anywhere). Evaluate `Array.from(document.body.querySelectorAll('text'))` or just textContent match. Evidence: match count = 0.
  - `rule` TR-14.2: renderEmptyState helper called >= 3 distinct places in codebase. Evidence: grep count.
  - `rubric` TR-14.3: Visual hierarchy (AC-17); scale 1-5; threshold >=4; evidence before/after screenshots reviewer scored.
  - `rubric` TR-14.4: Spacing consistency (AC-18); scale 1-5; threshold >=4; evidence CSS diff + screenshots.
  - `rubric` TR-14.5: Clutter reduction (AC-20); scale 1-5; threshold >=4; char count reduction dashboard + landing >= 30%.

## Task 15: Final syntax + full-flow QA — end-to-end user flow + console checks + diagnostics
- **Status**: `pending`
- **Priority**: high
- **Depends On**: ALL prior tasks (1-14)
- **Description**:
  - Run full end-to-end user flow manually in browser:
    1. Load landing fresh → browser_navigate clear storage → Launch demo (signin)
    2. Navigate Overview → Marketplace (filter categories) → open a service card → Request service
    3. Navigate Tasks → open workspace → switch between ALL 6 tabs (each works)
    4. On Deliverables tab: add link + attach file + add note → Save to Deliverables (workspace stays open!) → 1 more delivery
    5. Click trash remove → delivery removed, count down, workspace still open
    6. Click "Run AI check & Submit Task" → toast passes → status review
    7. scheduleAI review fires → approve request double confirm → completed
    8. Celebration screen appears → submit 5-star review
    9. Navigate Profile: review appears, completedSwaps++, ratings updated
    10. Navigate Wallet: balance correct
    11. Navigate Settings: toggle all 4 switches via keyboard Tab + Space
    12. Navigate Discover: switch 3 categories
  - After flow: run console_messages, node --check both, GetDiagnostics app.js.
- **Acceptance Criteria Addressed**: AC-16, AC-19, AC-21, AC-22
- **Test Requirements**:
  - `rule` TR-15.1: `browser_console_messages` returns [] (0 messages, no errors no warnings).
  - `rule` TR-15.2: `node --check app.js` exit 0; `node --check data.js` exit 0.
  - `rule` TR-15.3: `GetDiagnostics on app.js` empty array [].
  - `rule` TR-15.4: Full flow all 12 steps complete, all expected state changes observed (authenticated=true → status:review → status:completed → ratings array updated → wallet balances derived correct). Evidence: 12 bullets evaluation checklist with state.ui.route and state.requests[X].status after each step.
  - `rubric` TR-15.5: App overall polish final score; scale 1-5; threshold >=4; reviewer full walkthrough subjective.
  - `rubric` TR-15.6: Responsive breakpoints (AC-21); scale 1-5; threshold >=4; 3 widths 375/768/1440 screenshot inspections.
