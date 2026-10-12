# debug-workspace-workflow-broken.md
- **Status:** [OPEN]
- **Created:** 2026-09-02
- **Symptom:** Swapski Demo Project Workspace WORK→SUBMIT→AI REVIEW→ESCROW→CREDITS→REVIEW→COMPLETE flow is broken/incomplete. Files can't be uploaded correctly, submissions get stuck, credits don't update, review/complete screens don't fire, state is lost when switching tabs or navigating.
- **Expected:** Full end-to-end demo task completion: Upload Work → Submit → AI Review → Escrow Release → Credits Updated → Review → Complete, all state persisted in localStorage.
- **Scope:** app.js renderModal workspace, workspace-tab handlers, workspace-submit-task, scheduleAIReview, approveRequest, Deliverables form upload, checklist state, Escrow tab ledger, TaskCompleted/review forms, localStorage persistence

## Hypotheses
1. **H1 (Form handler mismatch):** The "workspace-delivery-form" `<form>` tag is missing a name or id attribute, or the submit button `type="submit"` is outside the form, so handleSubmit never matches the `form.id === "workspace-delivery-form"` branch → files/links never save to request.deliveries.
2. **H2 (workspace-submit-task missing file + delivery validation):** The AI pre-submit check only validates `deliveries.length` but the actual user-uploaded files in deliveries are stored with wrong type/undefined fields, or the state mutation is done without `setState()` → status never becomes `review`.
3. **H3 (scheduleAIReview request re-check):** Inside the setTimeout, `request.status` might not be `review` anymore or `state.requests.find(r => r.id === requestId)` is stale because setState is async, so AI approval path is skipped silently.
4. **H4 (State lost in tab switches / navigation):** `state.ui.aiAssistantChat[requestId]`, `request.deliveries[]`, `request.checklist{}` are stored correctly but `renderApp` re-render clears draft or `renderWorkspace*` reads from `state` (old snapshot) instead of fresh `draft` → uploads/checklists disappear when you switch tabs.
5. **H5 (Task Completed modal never triggers):** openTaskCompleted is called, but setState is done silently or the modal is hidden because `ui.showTaskCompleted=true` but `showWorkspace` was not set to false, so workspace modal z-index overlaps TaskCompleted modal.

## Evidence Log
| # | Source | Finding | Status |
|---|--------|---------|--------|
| - | - | - | Pending |
