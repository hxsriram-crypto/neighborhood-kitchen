import { useState } from "react";
import { useStore } from "@/nk/store";
import { SignInGate } from "@/nk/Gates";
import { Btn, Field, Notice, PageTitle } from "@/nk/ui";
import type { Application } from "@/nk/types";
import { ME } from "@/nk/types";
import { fmtStamp } from "@/nk/domain";

export default function CookApplication() {
  const { data, saveApplication, restartApplication, go } = useStore();
  const me = data.cooks.find((c) => c.id === ME)!;
  const [a, setA] = useState<Application>(data.applications[ME]);
  const [err, setErr] = useState<string[]>([]);
  const set = (p: Partial<Application>) => setA({ ...a, ...p });
  const locked = me.status === "pending" || me.status === "approved";
  const submit = () => {
    const e: string[] = [];
    if (!a.name.trim()) e.push("Add your public name.");
    if (!a.residential) e.push("Confirm the residential preparation declaration.");
    if (!a.jurisdiction) e.push("Acknowledge the jurisdiction statement.");
    if (!a.disclosures) e.push("Agree to the disclosure policy.");
    setErr(e);
    if (!e.length) saveApplication({ ...a, updatedAt: new Date().toISOString(), submittedAt: new Date().toISOString() }, "pending");
  };
  const chk = (id: string, key: "residential" | "jurisdiction" | "disclosures", text: string) => <label className="mb-3 flex items-start gap-3 text-sm leading-5"><input data-testid={"check-" + id} id={id} type="checkbox" disabled={locked} className="mt-1 accent-[#365b4b]" checked={a[key]} onChange={(e) => set({ [key]: e.target.checked })} />{text}</label>;
  return <div className="max-w-3xl"><PageTitle eyebrow="A neighbor who cooks" title="Apply to offer meals." sub="Local application and review-state illustration only. No real application, jurisdiction rule or credential is submitted." />
    <SignInGate why="Sign in (simulated) to apply to cook. One identity covers both neighbor and cook roles."><div className="nk-card nk-content">
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
      <div className="flex flex-wrap gap-2"><Btn testid="button-save-application" disabled={locked} onClick={() => { setErr([]); saveApplication({ ...a, updatedAt: new Date().toISOString() }, me.status === "none" ? "draft" : me.status); }}>Save incomplete application</Btn><Btn testid="button-submit-application" variant="solid" disabled={locked} onClick={submit}>Submit sample application</Btn>{me.status === "approved" && <Btn variant="plain" testid="button-restart-application" onClick={() => { restartApplication(); setA({ ...a, residential: false, jurisdiction: false, disclosures: false, evidenceSample: false }); }}>Demo: restart as new applicant</Btn>}{me.status === "approved" && <Btn onClick={() => go("My cooking")}>Go to My cooking</Btn>}</div>
      <p className="mt-5 border-t border-[#edf0e9] pt-4 text-xs leading-5 text-[#7c887f]">Any public review badge must state exactly what was checked and when. No jurisdiction requirements are selected or implied.</p>
    </div></SignInGate></div>;
}
