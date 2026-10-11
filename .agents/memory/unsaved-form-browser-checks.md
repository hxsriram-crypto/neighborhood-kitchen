---
name: Unsaved-form browser checks
description: Avoid confusing development hot updates with failed navigation protection.
---

Finish application code edits before a browser pass that checks whether unsaved form input survives cancelled navigation or reload.

**Why:** A shared-state hot update invalidated React Fast Refresh during a reload-cancellation check, resetting form input and making the apparent failure ambiguous. Hot updates are not normal user navigation and can bypass leave protection.

**How to apply:** Keep the app stable during those checks. If input disappears alongside hot-update messages, inspect the logs and repeat only the affected check once edits have stopped before concluding that navigation protection failed.

Use explicit in-app stay/discard buttons for screen transitions; reserve the browser-owned warning for reload and tab close.

**Why:** Native confirmation acceptance did not reliably lead to navigation during browser checks. The in-app confirmation made the decision observable and passed both ordinary-navigation and history-traversal checks.

**How to apply:** Preserve the explicit decision UI when extending protection to other prototype forms. Restore a cancelled history traversal before displaying an asynchronous dialog so the original form stays mounted.
