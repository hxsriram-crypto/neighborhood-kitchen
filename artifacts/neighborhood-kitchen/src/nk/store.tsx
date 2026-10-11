import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Application, CookStatus, Data, Offer, OfferStatus, Report, Screen } from "./types";
import { ME } from "./types";
import { load, resetStorage, save, type StorageStatus } from "./storage";
import { CUSTOMER_REMINDER, deadlineMs } from "./domain";
import { prepareOfferSave, publicationMessage, reviseOffer, withdrawOfferConsent } from "./publication";
import { useLocation, useRouter } from "wouter";
import { useHistoryState, usePathname } from "wouter/use-browser-location";
import { parseScreenPath, relativeScreenPath, screenPath, type Nav, type NavOptions } from "./navigation";
import { protectUnsavedNavigation } from "./leaveProtection";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export type { Nav } from "./navigation";
interface NavigationState { nkIndex?: number; nk?: { key: number; seed?: Partial<Offer> } }
export interface Flash { id: number; text: string; tone: "green" | "red" | "gold" }
interface Store {
  data: Data; now: number; storage: StorageStatus; nav: Nav; flash: Flash | null; clearFlash: () => void;
  go: (screen: Screen, o?: NavOptions) => void;
  registerUnsavedChanges: (isDirty: () => boolean) => () => void;
  signIn: () => void; signOut: () => void; setOperator: (v: boolean) => void; setPhoneConsent: (v: boolean) => void;
  upsertOffer: (o: Offer, msg: string, confirmed?: boolean) => string[]; closeOffer: (id: string) => void;
  withdrawContact: (id: string) => void;
  saveApplication: (a: Application, status: CookStatus) => void; restartApplication: () => void;
  submitReport: (r: Omit<Report, "id" | "createdAt" | "status">) => void;
  setCookStatus: (id: string, status: CookStatus, note: string) => void; setModerated: (offerId: string, v: boolean, note: string) => void;
  resolveReport: (id: string, note: string) => void; resetAll: () => void;
}
const Ctx = createContext<Store | null>(null);
export const useStore = () => { const c = useContext(Ctx); if (!c) throw new Error("StoreProvider missing"); return c; };

/** Compare against the last successful save, not simply whether input was touched. */
export function useUnsavedChanges<T>(value: T, enabled: boolean, initiallyUnsaved = false) {
  const { registerUnsavedChanges } = useStore();
  const snapshot = JSON.stringify(value);
  const baseline = useRef<string | null>(initiallyUnsaved ? null : snapshot);
  const dirty = useRef(false);
  useLayoutEffect(() => { dirty.current = enabled && snapshot !== baseline.current; });
  useLayoutEffect(() => registerUnsavedChanges(() => dirty.current), [registerUnsavedChanges]);
  return {
    markSaved: (savedValue: T = value) => {
      baseline.current = JSON.stringify(savedValue);
      // Clear synchronously so save-and-navigate does not ask to discard saved work.
      dirty.current = false;
    },
    markSavedFields: (patch: Partial<T>) => {
      // An immediate action may save one field without saving the other edits.
      if (baseline.current !== null) baseline.current = JSON.stringify({ ...JSON.parse(baseline.current), ...patch });
    },
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(() => load(Date.now()));
  const [data, setData] = useState<Data>(boot.data);
  const dataRef = useRef(data);
  const [storage, setStorage] = useState<StorageStatus>(boot.status);
  const storageRef = useRef(boot.status);
  const [now, setNow] = useState(Date.now());
  const [, navigate] = useLocation();
  const { base } = useRouter();
  const location = relativeScreenPath(usePathname(), base);
  const historyState = useHistoryState<NavigationState | null>();
  const navigationKey = useRef(Date.now());
  const unsaved = useRef<(() => boolean) | null>(null);
  const [leaveRequest, setLeaveRequest] = useState<{ leave: () => void } | null>(null);
  const protection = useRef<ReturnType<typeof protectUnsavedNavigation> | null>(null);
  const registerUnsavedChanges = useCallback((isDirty: () => boolean) => {
    unsaved.current = isDirty;
    return () => { if (unsaved.current === isDirty) unsaved.current = null; };
  }, []);
  useLayoutEffect(() => {
    const guard = protectUnsavedNavigation(
      () => unsaved.current?.() ?? false,
      (leave) => setLeaveRequest((current) => current ?? { leave }),
    );
    protection.current = guard;
    return () => { guard.dispose(); protection.current = null; };
  }, []);
  const nav: Nav = {
    ...parseScreenPath(location),
    seed: historyState?.nk?.seed,
    editorKey: location + ":" + (historyState?.nk?.key ?? 0),
  };
  const [flash, setFlash] = useState<Flash | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((text: string, tone: Flash["tone"] = "green") => {
    window.clearTimeout(flashTimer.current);
    setFlash({ id: Date.now(), text, tone });
    flashTimer.current = window.setTimeout(() => setFlash(null), 7000);
  }, []);

  const go = (screen: Screen, options: NavOptions = {}) => {
    const path = screenPath(screen, options);
    // Clicking the current tab must not create duplicate Back steps.
    if (path === location && !options.seed) return;
    protection.current?.requestLeave(() => {
      navigate(path, { state: { nkIndex: protection.current!.nextIndex(), nk: { key: ++navigationKey.current, seed: options.seed } } });
    });
  };

  useEffect(() => {
    setNow(Date.now());
    window.scrollTo({ top: 0 });
  }, [location, historyState]);

  const commit = useCallback((fn: (d: Data) => Data, msg: string) => {
    const next = fn(dataRef.current);
    dataRef.current = next; setData(next);
    let ok = false;
    if (storageRef.current === "ok") { ok = save(next); if (!ok) { storageRef.current = "unavailable"; setStorage("unavailable"); } }
    if (ok) notify(msg + " Saved in this browser only.");
    else notify(msg + " NOT saved: " + (storageRef.current === "corrupt" ? "stored data is unreadable; reset sample data to resume saving." : "browser storage is unavailable, so this lasts only until reload."), "gold");
  }, [notify]);

  // Clock: interval, focus/visibility, and a precise timer at the next deadline.
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 15000);
    const vis = () => { if (document.visibilityState === "visible") tick(); };
    window.addEventListener("focus", tick); document.addEventListener("visibilitychange", vis);
    return () => { window.clearInterval(id); window.removeEventListener("focus", tick); document.removeEventListener("visibilitychange", vis); };
  }, []);
  useEffect(() => {
    const t = Date.now();
    const next = data.offers.filter((o) => o.status === "published").map(deadlineMs).filter((d) => d > t).sort((a, b) => a - b)[0];
    if (!next) return;
    const id = window.setTimeout(() => setNow(Date.now()), Math.min(next - t + 50, 2147000000));
    return () => window.clearTimeout(id);
  }, [data.offers, now]);

  const audit = (d: Data, action: string, target: string, note: string, actor = "Operator (demo)"): Data => ({ ...d, audit: [{ id: "a" + Date.now().toString(36) + d.audit.length, at: new Date().toISOString(), actor, action, target, note }, ...d.audit] });

  const store: Store = {
    data, now, storage, nav, flash, clearFlash: () => setFlash(null),
    go, registerUnsavedChanges,
    signIn: () => commit((d) => ({ ...d, signedIn: true }), "Signed in as the simulated neighbor Alex Larkin (not real authentication)."),
    signOut: () => {
      protection.current?.requestLeave(() => commit((d) => ({ ...d, signedIn: false, phoneConsent: false }), "Signed out of the simulated identity."));
    },
    setOperator: (v) => commit((d) => ({ ...d, operator: v }), v ? "Simulated operator mode on (not security)." : "Simulated operator mode off."),
    setPhoneConsent: (v) => commit((d) => ({ ...d, phoneConsent: v }), v ? "Contact consent recorded." : "Contact consent withdrawn."),
    upsertOffer: (input, msg, confirmed = false) => {
      const current = dataRef.current;
      const previous = current.offers.find((x) => x.id === input.id);
      if (!current.signedIn || input.cookId !== ME || (previous && previous.cookId !== ME)) return ["Use the simulated cook identity to edit your own fictional offers."];
      const result = prepareOfferSave(input, previous, current.cooks.find((c) => c.id === ME), Date.now(), confirmed);
      if (!result.offer) return result.errors;
      const offer = result.offer;
      commit((d) => ({ ...d, offers: previous ? d.offers.map((x) => x.id === offer.id ? offer : x) : [...d.offers, offer] }), offer.status === "draft" ? msg : publicationMessage(msg));
      return [];
    },
    closeOffer: (id) => commit((d) => ({ ...d, offers: d.offers.map((o) => (o.id === id && o.cookId === ME && d.signedIn ? reviseOffer(o, { ...o, status: "closed" as OfferStatus }, Date.now()) : o)) }), "Offer closed. It is hidden from discovery and contact is blocked. " + CUSTOMER_REMINDER),
    withdrawContact: (id) => commit((d) => ({ ...d, offers: d.offers.map((o) => o.id === id && o.cookId === ME && d.signedIn ? withdrawOfferConsent(o, Date.now()) : o) }), "Cook contact consent withdrawn. The offer is hidden from discovery and its sample route is blocked immediately. " + CUSTOMER_REMINDER),
    saveApplication: (a, status) => commit((d) => audit({ ...d, applications: { ...d.applications, [ME]: a }, cooks: d.cooks.map((c) => (c.id === ME ? { ...c, name: a.name.trim() || c.name, status } : c)) }, status === "pending" ? "Application submitted" : "Application draft saved", "Alex Larkin", status === "pending" ? "Awaiting operator decision." : "Incomplete application saved.", "Alex Larkin (demo)"), status === "pending" ? "Application submitted and pending review." : "Application draft saved."),
    restartApplication: () => commit((d) => audit({ ...d, cooks: d.cooks.map((c) => (c.id === ME ? { ...c, status: "none" as CookStatus } : c)), applications: { ...d.applications, [ME]: { ...d.applications[ME], residential: false, jurisdiction: false, disclosures: false, evidenceSample: false, submittedAt: undefined } } }, "Restarted as new applicant", "Alex Larkin", "Demo shortcut to try application-to-approval.", "Alex Larkin (demo)"), "Restarted as a new applicant. Your offers are hidden until you are approved again."),
    submitReport: (r) => commit((d) => audit({ ...d, reports: [{ ...r, id: "r" + Date.now().toString(36), createdAt: new Date().toISOString(), status: "open" }, ...d.reports] }, "Report filed", r.targetLabel, r.reason, "Neighbor (demo)"), "Report saved to the operator queue."),
    setCookStatus: (id, status, note) => commit((d) => audit({ ...d, cooks: d.cooks.map((c) => (c.id === id ? { ...c, status } : c)) }, "Cook " + status, d.cooks.find((c) => c.id === id)?.name ?? id, note || "No reason entered."), "Cook marked " + status + ". Offers and contact update immediately."),
    setModerated: (id, v, note) => commit((d) => audit({ ...d, offers: d.offers.map((o) => (o.id === id ? reviseOffer(o, { ...o, moderated: v }, Date.now()) : o)) }, v ? "Offer suspended" : "Offer restored", d.offers.find((o) => o.id === id)?.title ?? id, note || "No reason entered."), v ? "Offer suspended and hidden." : "Offer restored."),
    resolveReport: (id, note) => commit((d) => audit({ ...d, reports: d.reports.map((r) => (r.id === id ? { ...r, status: "resolved" as const, resolution: note || "Resolved without note.", resolvedAt: new Date().toISOString() } : r)) }, "Report resolved", d.reports.find((r) => r.id === id)?.targetLabel ?? id, note || "No note."), "Report resolved."),
    resetAll: () => {
      protection.current?.requestLeave(() => {
        const r = resetStorage(Date.now());
        dataRef.current = r.data; setData(r.data); storageRef.current = r.status; setStorage(r.status);
        navigate("/", { replace: true, state: { nkIndex: protection.current!.currentIndex() } });
        notify(r.status === "ok" ? "Sample data reset. Stored again in this browser only." : "Sample data reset in memory, but browser storage is unavailable so nothing is saved.", r.status === "ok" ? "green" : "gold");
      });
    },
  };
  return <Ctx.Provider value={store}>{children}
    <AlertDialog open={!!leaveRequest} onOpenChange={(open) => { if (!open) setLeaveRequest(null); }}>
      <AlertDialogContent data-testid="dialog-unsaved-changes" className="max-w-[min(92vw,32rem)] rounded-xl bg-[#fffdf7] text-[#263c32]">
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>Your unsaved meal or application edits will be lost. Stay to keep editing, or discard them and leave this screen.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-stay-editing">Stay and keep editing</AlertDialogCancel>
          <AlertDialogAction data-testid="button-discard-leave" onClick={() => { const leave = leaveRequest?.leave; setLeaveRequest(null); leave?.(); }}>Discard and leave</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </Ctx.Provider>;
}
