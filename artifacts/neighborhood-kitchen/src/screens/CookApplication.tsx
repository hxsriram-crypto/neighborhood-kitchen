import { useEffect, useState } from "react";
import { useStore, useUnsavedChanges } from "@/nk/store";
import { SignInGate } from "@/nk/Gates";
import { Btn, Field, Notice, PageTitle } from "@/nk/ui";
import type { Application } from "@/nk/types";
import { ME } from "@/nk/types";
import { fmtStamp } from "@/nk/domain";
import type { RecoverableDraft } from "@/nk/storage";

export default function CookApplication() {
  const { data, saveApplication, restartApplication, go, recoverableDrafts, recoveryStorage, saveRecoverableDraft, removeRecoverableDraft, clearRecoverableDrafts } = useStore();
  const me = data.cooks.find((c) => c.id === ME)!;
  const [a, setA] = useState<Application>(data.applications[ME]);
  const [recoveryEnabled, setRecoveryEnabled] = useState(false);
  const [recoveryRestored, setRecoveryRestored] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const discardRecoverable = () => { if (recoveryEnabled) removeRecoverableDraft("application", ME, ME); };
  const { markSaved } = useUnsavedChanges(a, data.signedIn, false, discardRecoverable);
  const [err, setErr] = useState<string[]>([]);
  const set = (p: Partial<Application>) => setA({ ...a, ...p });
  const locked = me.status === "pending" || me.status === "approved";
  const pendingRecovery = recoverableDrafts.filter((draft): draft is Extract<RecoverableDraft, { kind: "application" }> =>
    draft.kind === "application" && draft.identity === ME && draft.id === ME && !recoveryRestored && !recoveryEnabled).find((draft) => {
    const { updatedAt: _recoveredAt, submittedAt: _recoveredSubmission, ...recoveredInput } = draft.value;
    const { updatedAt: _savedAt, submittedAt: _savedSubmission, ...savedInput } = data.applications[ME];
    return JSON.stringify(recoveredInput) !== JSON.stringify(savedInput);
  });

  useEffect(() => {
    if (!recoveryEnabled || !data.signedIn || pendingRecovery) return;
    const timer = window.setTimeout(() => {
      const value = { ...a, submittedAt: undefined };
      if (!saveRecoverableDraft({ kind: "application", identity: ME, id: ME, value })) {
        setRecoveryError("This browser could not save the recovery copy. The current edits remain in the form but may be lost if you leave.");
      } else setRecoveryError("");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [a, recoveryEnabled, data.signedIn, pendingRecovery, saveRecoverableDraft]);

  const discardRecovery = () => {
    if (removeRecoverableDraft("application", ME, ME)) {
      setRecoveryRestored(true);
      setRecoveryError("");
    } else setRecoveryError("The recovery copy could not be deleted from this browser.");
  };
  const toggleRecovery = (enabled: boolean) => {
    setRecoveryEnabled(enabled);
    setRecoveryError("");
    if (!enabled && !removeRecoverableDraft("application", ME, ME)) {
      setRecoveryError("Recovery was turned off for this editor, but this browser could not delete its saved copy.");
    }
  };
  const save = (status: typeof me.status, submitted = false) => {
    const next = { ...a, updatedAt: new Date().toISOString(), ...(submitted ? { submittedAt: new Date().toISOString() } : {}) };
    if (!saveApplication(next, status)) {
      setErr(["The application changed in this session but was not saved to browser storage. Its recovery copy was kept."]);
      return;
    }
    markSaved(next);
    setA(next);
    setRecoveryEnabled(false);
    setErr([]);
  };
  const submit = () => {
    const e: string[] = [];
    if (!a.name.trim()) e.push("Add your public name.");
    if (!a.residential) e.push("Confirm the residential preparation declaration.");
    if (!a.jurisdiction) e.push("Acknowledge the jurisdiction statement.");
    if (!a.disclosures) e.push("Agree to the disclosure policy.");
    setErr(e);
    if (!e.length) save("pending", true);
  };
  const chk = (id: string, key: "residential" | "jurisdiction" | "disclosures", text: string) => <label className="mb-3 flex items-start gap-3 text-sm leading-5"><input data-testid={"check-" + id} id={id} type="checkbox" disabled={locked} className="mt-1 accent-[#365b4b]" checked={a[key]} onChange={(e) => set({ [key]: e.target.checked })} />{text}</label>;
  return <div className="max-w-3xl"><PageTitle eyebrow="A neighbor who cooks" title="Apply to offer meals." sub="Local application and review-state illustration only. No real application, jurisdiction rule or credential is submitted." />
    <SignInGate why="Sign in (simulated) to apply to cook. One identity covers both neighbor and cook roles."><div className="nk-card nk-content">
      {recoveryStorage === "corrupt" && <Notice tone="red" testid="status-recovery-corrupt"><b>Interrupted draft recovery data could not be read.</b> It has not been restored. <Btn testid="button-clear-corrupt-recovery" onClick={() => { if (clearRecoverableDrafts()) setRecoveryError(""); else setRecoveryError("Unreadable recovery data could not be deleted."); }}>Delete unreadable recovery data</Btn></Notice>}
      {recoveryStorage === "unavailable" && <Notice tone="gold" testid="status-recovery-unavailable"><b>Browser-local recovery is unavailable.</b> Drafts cannot be protected against a crash in this browser.</Notice>}
      {recoveryError && <Notice tone="gold" testid="status-recovery-error">{recoveryError}</Notice>}
      {pendingRecovery && <Notice tone="gold" testid="panel-application-recovery"><b>Interrupted application draft found.</b> Choose whether to restore or delete it. Restoring only fills this form; nothing is submitted.
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#e5e9e0] bg-white/70 p-3"><span className="mr-auto text-sm">{pendingRecovery.value.name.trim() || "Unnamed application"} · expires {new Date(pendingRecovery.expiresAt).toLocaleDateString()}</span><Btn testid="button-restore-application" onClick={() => { setA({ ...pendingRecovery.value, submittedAt: undefined }); setRecoveryEnabled(true); setRecoveryRestored(true); setErr([]); }}>Restore draft</Btn><Btn testid="button-discard-application-recovery" variant="plain" onClick={discardRecovery}>Discard copy</Btn></div>
      </Notice>}
      <div className="mb-4 rounded-xl border border-[#e5e9e0] bg-white/70 p-3">
        <label className="flex items-start gap-2 text-sm font-semibold"><input data-testid="check-application-recovery" type="checkbox" className="mt-1 accent-[#365b4b]" checked={recoveryEnabled} disabled={recoveryStorage !== "ok" || (!recoveryEnabled && !!pendingRecovery)} onChange={(e) => toggleRecovery(e.target.checked)} />Recover this application draft after an interruption</label>
        <p className="mt-1 pl-6 text-xs text-[#718075]">Opt in for this draft. Use fictional demo values only—do not enter real names, contact details or personal data. The copy stays in this browser for up to 7 days; saving/submitting, discarding, reset or expiry removes it. Recovery does not submit the application.</p>
      </div>
      <p className="mb-3 text-sm" data-testid="text-app-status"><b>Status:</b> {me.status === "none" ? "Not started" : me.status}{a.submittedAt && me.status !== "none" ? " · submitted " + fmtStamp(a.submittedAt) : ""}</p>
      {me.status === "pending" && <Notice testid="status-pending"><b>Application submitted · pending review.</b> You cannot publish while review is pending. Switch to operator mode (Operator review) to approve it in this demo.</Notice>}
      {me.status === "approved" && <Notice tone="green"><b>Approved (demo).</b> You can create and publish offers.</Notice>}
      {me.status === "rejected" && <Notice tone="red"><b>Application rejected (demo).</b> An operator can reconsider; you may edit and resubmit below.</Notice>}
      {me.status === "suspended" && <Notice tone="red"><b>Eligibility suspended.</b> Your offers are hidden and publishing is unavailable until an operator reinstates you.</Notice>}
      <div className="mt-4 grid gap-x-5 sm:grid-cols-2">
        <Field label="Public name" id="app-name"><input id="app-name" data-testid="input-app-name" disabled={locked} className="nk-input" value={a.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Neighborhood" id="app-neighborhood"><select id="app-neighborhood" disabled className="nk-input" value={a.neighborhood}><option>Maplewood</option></select></Field>
        <Field label="Preparation setting" id="app-setting"><select id="app-setting" disabled className="nk-input"><option>My own residential kitchen</option></select></Field>
        <Field label="Permit agency · if applicable (fictional)" id="permit-agency"><input id="permit-agency" disabled={locked} className="nk-input" placeholder="Not selected for this demo" value={a.permitAgency} onChange={(e) => set({ permitAgency: e.target.value })} /></Field>
        <Field label="Permit / credential reference (fictional)" id="permit-number"><input id="permit-number" disabled={locked} className="nk-input" placeholder="Fictional placeholder only" value={a.permitNumber} onChange={(e) => set({ permitNumber: e.target.value })} /></Field>
        <Field label="Permit expiry · if applicable" id="permit-expiry"><input id="permit-expiry" type="date" disabled={locked} className="nk-input" value={a.permitExpiry} onChange={(e) => set({ permitExpiry: e.target.value })} /></Field>
      </div>
      <div className="mb-4 rounded-xl border border-dashed border-[#d8dfd4] bg-[#f8f8f2] p-4"><p className="nk-label">Private evidence · simulated</p><label className="flex items-start gap-3 text-sm leading-5"><input data-testid="check-evidence" type="checkbox" disabled={locked} className="mt-1 accent-[#365b4b]" checked={a.evidenceSample} onChange={(e) => set({ evidenceSample: e.target.checked })} /><span>Attach the sample document label <b>sample-permit-fictional.pdf</b><span className="block text-xs text-[#758278]">Simulated only: no file is chosen, read, uploaded or stored. Upload alone would not mean verification.</span></span></label></div>
      {chk("app-residential", "residential", "I prepare the meals I offer in my own home and am an individual resident, not a restaurant, caterer, reseller or commercial meal-preparation operation.")}
      {chk("app-jurisdiction", "jurisdiction", "I understand requirements depend on the applicable jurisdiction and no jurisdiction is selected in this demo.")}
      {chk("app-disclosures", "disclosures", "I agree to provide clear ingredients, sourcing, organic status, allergens, cross-contact, pickup and deadline disclosures.")}
      {err.length > 0 && <Notice tone="red" testid="errors-app"><b>Before submitting:</b><ul className="ml-4 list-disc">{err.map((x) => <li key={x}>{x}</li>)}</ul></Notice>}
      <div className="flex flex-wrap gap-2"><Btn testid="button-save-application" disabled={locked} onClick={() => { setErr([]); save(me.status === "none" ? "draft" : me.status); }}>Save incomplete application</Btn><Btn testid="button-submit-application" variant="solid" disabled={locked} onClick={submit}>Submit sample application</Btn>{me.status === "approved" && <Btn variant="plain" testid="button-restart-application" onClick={() => { restartApplication(); const next = { ...a, residential: false, jurisdiction: false, disclosures: false, evidenceSample: false, submittedAt: undefined }; markSaved(next); setA(next); }}>Demo: restart as new applicant</Btn>}{me.status === "approved" && <Btn onClick={() => go("My cooking")}>Go to My cooking</Btn>}</div>
      <p className="mt-5 border-t border-[#edf0e9] pt-4 text-xs leading-5 text-[#7c887f]">Any public review badge must state exactly what was checked and when. No jurisdiction requirements are selected or implied.</p>
    </div></SignInGate></div>;
}
