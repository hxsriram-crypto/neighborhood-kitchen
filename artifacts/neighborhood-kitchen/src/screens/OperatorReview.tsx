import { useState } from "react";
import { useStore } from "@/nk/store";
import { OperatorGate } from "@/nk/Gates";
import { Avatar, Badge, Btn, Notice, PageTitle } from "@/nk/ui";
import { fmtStamp } from "@/nk/domain";
import type { CookStatus } from "@/nk/types";

export function AuditLog() {
  const { data } = useStore();
  return <div className="nk-card mt-5 overflow-hidden" data-testid="panel-audit"><div className="border-b border-[#edf0e9] p-5"><p className="nk-eyebrow">Audit log · this browser only</p><h2 className="nk-display text-2xl">Recent actions</h2></div><div className="divide-y divide-[#edf0e9]">{data.audit.slice(0, 25).map((a) => <div key={a.id} className="p-4 text-sm"><b>{a.action}</b> · {a.target}<p className="text-xs text-[#78847b]">{a.actor} · {fmtStamp(a.at)}</p><p className="mt-1 text-[#68776c]">{a.note}</p></div>)}</div></div>;
}

export default function OperatorReview() {
  const { data, setCookStatus, go, setOperator } = useStore();
  const [reason, setReason] = useState("");
  const act = (id: string, s: CookStatus) => { setCookStatus(id, s, reason.trim()); setReason(""); };
  return <div className="max-w-5xl"><PageTitle eyebrow="Restricted view · demonstration only" title="Cook review" sub="Operator-only illustration with fictional cases. Decisions change eligibility immediately in this browser." />
    <OperatorGate><Notice>DEMONSTRATION-ONLY operator screen, simulated and not security. This is not a live moderation or eligibility service.</Notice>
      <div className="nk-card p-5"><label className="nk-label" htmlFor="op-reason">Reason or note (recorded in the audit log)</label><input id="op-reason" data-testid="input-op-reason" className="nk-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Sample documents reviewed (fictional)" /></div>
      <div className="nk-card mt-5 overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0e9] p-5"><div><p className="nk-eyebrow">{data.cooks.length} fictional cooks</p><h2 className="nk-display text-2xl">Eligibility review</h2></div><Btn variant="plain" onClick={() => setOperator(false)}>Leave operator mode</Btn></div>
        <div className="divide-y divide-[#edf0e9]">{data.cooks.map((c) => { const a = data.applications[c.id]; return <div key={c.id} className="flex flex-wrap items-center gap-4 p-5" data-testid={"row-cook-" + c.id}><Avatar initials={c.initials} /><div className="min-w-[200px] flex-1"><p className="font-semibold">{c.name} <Badge className="ml-1">{c.status}</Badge></p>{a ? <p className="mt-1 text-xs text-[#78847b]">Residential declaration: {a.residential ? "yes" : "no"} · Evidence: {a.evidenceSample ? "sample-permit-fictional.pdf (simulated, no file)" : "none"} · Permit ref: {a.permitNumber || "none"}{a.submittedAt ? " · submitted " + fmtStamp(a.submittedAt) : ""}</p> : <p className="mt-1 text-xs text-[#78847b]">No application on file.</p>}</div>
          <div className="flex flex-wrap gap-2"><Btn testid={"button-approve-" + c.id} variant="solid" disabled={c.status === "approved" || c.status === "none" || c.status === "draft"} onClick={() => act(c.id, "approved")}>{c.status === "suspended" || c.status === "rejected" ? "Reinstate" : "Approve"}</Btn><Btn testid={"button-reject-" + c.id} disabled={c.status !== "pending"} onClick={() => act(c.id, "rejected")}>Reject</Btn><Btn testid={"button-suspend-" + c.id} variant="plain" disabled={c.status !== "approved"} onClick={() => act(c.id, "suspended")}>Suspend</Btn></div></div>; })}</div></div>
      <div className="mt-4"><Btn onClick={() => go("Report queue")}>Open report queue</Btn></div><AuditLog /></OperatorGate></div>;
}
