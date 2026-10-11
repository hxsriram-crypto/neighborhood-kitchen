import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Application, CookStatus, Data, Offer, OfferStatus, Report, Screen } from "./types";
import { ME } from "./types";
import { load, resetStorage, save, type StorageStatus } from "./storage";
import { deadlineMs, validatePublish } from "./domain";

export interface Nav { screen: Screen; offerId?: string; cookId?: string; editorId?: string; editorKey: number; seed?: Partial<Offer>; mode?: string }
export interface Flash { id: number; text: string; tone: "green" | "red" | "gold" }
interface Store {
  data: Data; now: number; storage: StorageStatus; nav: Nav; flash: Flash | null; clearFlash: () => void;
  go: (screen: Screen, o?: { offerId?: string; cookId?: string; editorId?: string; seed?: Partial<Offer>; mode?: string }) => void;
  signIn: () => void; signOut: () => void; setOperator: (v: boolean) => void; setPhoneConsent: (v: boolean) => void;
  upsertOffer: (o: Offer, msg: string) => void; closeOffer: (id: string) => void; reopenOffer: (id: string) => string[];
  saveApplication: (a: Application, status: CookStatus) => void; restartApplication: () => void;
  submitReport: (r: Omit<Report, "id" | "createdAt" | "status">) => void;
  setCookStatus: (id: string, status: CookStatus, note: string) => void; setModerated: (offerId: string, v: boolean, note: string) => void;
  resolveReport: (id: string, note: string) => void; resetAll: () => void;
}
const Ctx = createContext<Store | null>(null);
export const useStore = () => { const c = useContext(Ctx); if (!c) throw new Error("StoreProvider missing"); return c; };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(() => load(Date.now()));
  const [data, setData] = useState<Data>(boot.data);
  const dataRef = useRef(data);
  const [storage, setStorage] = useState<StorageStatus>(boot.status);
  const storageRef = useRef(boot.status);
  const [now, setNow] = useState(Date.now());
  const [nav, setNav] = useState<Nav>({ screen: "Discover", editorKey: 0 });
  const [flash, setFlash] = useState<Flash | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  const notify = useCallback((text: string, tone: Flash["tone"] = "green") => {
    window.clearTimeout(flashTimer.current);
    setFlash({ id: Date.now(), text, tone });
    flashTimer.current = window.setTimeout(() => setFlash(null), 7000);
  }, []);

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
    go: (screen, o = {}) => { setNav((n) => ({ screen, offerId: o.offerId, cookId: o.cookId, editorId: o.editorId, seed: o.seed, mode: o.mode, editorKey: n.editorKey + 1 })); window.scrollTo({ top: 0 }); },
    signIn: () => commit((d) => ({ ...d, signedIn: true }), "Signed in as the simulated neighbor Alex Larkin (not real authentication)."),
    signOut: () => commit((d) => ({ ...d, signedIn: false, phoneConsent: false }), "Signed out of the simulated identity."),
    setOperator: (v) => commit((d) => ({ ...d, operator: v }), v ? "Simulated operator mode on (not security)." : "Simulated operator mode off."),
    setPhoneConsent: (v) => commit((d) => ({ ...d, phoneConsent: v }), v ? "Contact consent recorded." : "Contact consent withdrawn."),
    upsertOffer: (o, msg) => commit((d) => { const exists = d.offers.some((x) => x.id === o.id); return { ...d, offers: exists ? d.offers.map((x) => (x.id === o.id ? o : x)) : [...d.offers, o] }; }, msg),
    closeOffer: (id) => commit((d) => ({ ...d, offers: d.offers.map((o) => (o.id === id ? { ...o, status: "closed" as OfferStatus, version: o.version + 1, updatedAt: new Date().toISOString() } : o)) }), "Offer closed. It is hidden from discovery and contact is blocked."),
    reopenOffer: (id) => {
      const o = dataRef.current.offers.find((x) => x.id === id);
      if (!o) return ["Offer not found."];
      const errs = validatePublish(o, dataRef.current.cooks.find((c) => c.id === o.cookId), Date.now());
      if (errs.length) return errs;
      commit((d) => ({ ...d, offers: d.offers.map((x) => (x.id === id ? { ...x, status: "published" as OfferStatus, version: x.version + 1, updatedAt: new Date().toISOString() } : x)) }), "Offer reopened by you.");
      return [];
    },
    saveApplication: (a, status) => commit((d) => audit({ ...d, applications: { ...d.applications, [ME]: a }, cooks: d.cooks.map((c) => (c.id === ME ? { ...c, name: a.name.trim() || c.name, status } : c)) }, status === "pending" ? "Application submitted" : "Application draft saved", "Alex Larkin", status === "pending" ? "Awaiting operator decision." : "Incomplete application saved.", "Alex Larkin (demo)"), status === "pending" ? "Application submitted and pending review." : "Application draft saved."),
    restartApplication: () => commit((d) => audit({ ...d, cooks: d.cooks.map((c) => (c.id === ME ? { ...c, status: "none" as CookStatus } : c)), applications: { ...d.applications, [ME]: { ...d.applications[ME], residential: false, jurisdiction: false, disclosures: false, evidenceSample: false, submittedAt: undefined } } }, "Restarted as new applicant", "Alex Larkin", "Demo shortcut to try application-to-approval.", "Alex Larkin (demo)"), "Restarted as a new applicant. Your offers are hidden until you are approved again."),
    submitReport: (r) => commit((d) => audit({ ...d, reports: [{ ...r, id: "r" + Date.now().toString(36), createdAt: new Date().toISOString(), status: "open" }, ...d.reports] }, "Report filed", r.targetLabel, r.reason, "Neighbor (demo)"), "Report saved to the operator queue."),
    setCookStatus: (id, status, note) => commit((d) => audit({ ...d, cooks: d.cooks.map((c) => (c.id === id ? { ...c, status } : c)) }, "Cook " + status, d.cooks.find((c) => c.id === id)?.name ?? id, note || "No reason entered."), "Cook marked " + status + ". Offers and contact update immediately."),
    setModerated: (id, v, note) => commit((d) => audit({ ...d, offers: d.offers.map((o) => (o.id === id ? { ...o, moderated: v } : o)) }, v ? "Offer suspended" : "Offer restored", d.offers.find((o) => o.id === id)?.title ?? id, note || "No reason entered."), v ? "Offer suspended and hidden." : "Offer restored."),
    resolveReport: (id, note) => commit((d) => audit({ ...d, reports: d.reports.map((r) => (r.id === id ? { ...r, status: "resolved" as const, resolution: note || "Resolved without note.", resolvedAt: new Date().toISOString() } : r)) }, "Report resolved", d.reports.find((r) => r.id === id)?.targetLabel ?? id, note || "No note."), "Report resolved."),
    resetAll: () => {
      const r = resetStorage(Date.now());
      dataRef.current = r.data; setData(r.data); storageRef.current = r.status; setStorage(r.status);
      setNav((n) => ({ screen: "Discover", editorKey: n.editorKey + 1 }));
      notify(r.status === "ok" ? "Sample data reset. Stored again in this browser only." : "Sample data reset in memory, but browser storage is unavailable so nothing is saved.", r.status === "ok" ? "green" : "gold");
    },
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}
