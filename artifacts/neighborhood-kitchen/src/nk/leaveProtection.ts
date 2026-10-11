type EntryState = { nkIndex?: number; [key: string]: unknown } | null;

/** Track every mounted form independently so one registration cannot replace another. */
export function createUnsavedChangeRegistry() {
  const entries = new Map<symbol, () => boolean>();
  return {
    register(isDirty: () => boolean) {
      const key = Symbol();
      entries.set(key, isDirty);
      return () => { entries.delete(key); };
    },
    shouldWarn() {
      return [...entries.values()].some((isDirty) => isDirty());
    },
  };
}

/** Stop cancelled history traversals before Wouter can unmount the form. */
export function protectUnsavedNavigation(shouldWarn: () => boolean, askToDiscard: (leave: () => void) => void) {
  let currentState: EntryState = history.state;
  let currentUrl = window.location.href;
  let afterRestore: (() => void) | null = null;
  let allowedTraversal = false;
  let index = currentState?.nkIndex ?? 0;
  history.replaceState({ ...currentState, nkIndex: index }, "", currentUrl);
  currentState = history.state;

  const requestLeave = (leave: () => void) => {
    if (afterRestore) return;
    if (shouldWarn()) askToDiscard(leave);
    else leave();
  };
  const remember = () => {
    currentState = history.state;
    currentUrl = window.location.href;
    index = currentState?.nkIndex ?? index;
  };
  const onPop = (event: PopStateEvent) => {
    if (afterRestore) {
      // This is the return to the original entry, not another departure.
      event.stopImmediatePropagation();
      const restored = afterRestore;
      afterRestore = null;
      restored();
      return;
    }
    if (allowedTraversal || !shouldWarn()) {
      allowedTraversal = false;
      remember();
      return;
    }
    event.stopImmediatePropagation();
    const targetIndex = (event.state as EntryState)?.nkIndex;
    if (typeof targetIndex === "number" && targetIndex !== index) {
      const delta = targetIndex - index;
      // Return to the form before opening the asynchronous in-app dialog.
      // Only an explicit discard authorizes replaying this traversal.
      afterRestore = () => requestLeave(() => {
        allowedTraversal = true;
        history.go(delta);
      });
      history.go(-delta);
    } else {
      // Older prototype entries may predate our history indices. Keep the
      // form and restore its URL without assuming a traversal direction.
      const targetState = event.state as EntryState;
      const targetUrl = window.location.href;
      history.pushState(currentState, "", currentUrl);
      requestLeave(() => history.replaceState({ ...targetState, nkIndex: index }, "", targetUrl));
    }
  };
  const onUnload = (event: BeforeUnloadEvent) => {
    if (!shouldWarn()) return;
    event.preventDefault();
    // Reload/close warnings use browser-owned wording, not our message.
    event.returnValue = "";
  };
  window.addEventListener("popstate", onPop, true);
  window.addEventListener("pushState", remember);
  window.addEventListener("replaceState", remember);
  window.addEventListener("beforeunload", onUnload);
  return {
    requestLeave,
    nextIndex: () => index + 1,
    currentIndex: () => index,
    dispose: () => {
      window.removeEventListener("popstate", onPop, true);
      window.removeEventListener("pushState", remember);
      window.removeEventListener("replaceState", remember);
      window.removeEventListener("beforeunload", onUnload);
    },
  };
}
