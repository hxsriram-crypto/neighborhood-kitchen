import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useStore, useUnsavedChanges } from "./store";
import { Btn, Notice } from "./ui";

const REASONS = ["Inaccurate allergen information", "Suspected illness", "Commercial operation concern", "Harassment", "Preparation information"];
export function ReportForm({ targetType, targetId, label }: { targetType: "offer" | "cook"; targetId: string; label: string }) {
  const { submitReport } = useStore();
  const [open, setOpen] = useState(false); const [reason, setReason] = useState(REASONS[0]); const [context, setContext] = useState(""); const [done, setDone] = useState(false);
  const { markSaved } = useUnsavedChanges({ reason, context }, true);
  return <div>
    <Btn testid={"button-report-" + targetType} variant="plain" className="w-full" icon={<ShieldAlert size={15} />} onClick={() => { setOpen(!open); setDone(false); }}>Report this {targetType === "offer" ? "offer" : "profile"}</Btn>
    {open && <div className="nk-card nk-content mt-3"><h3 className="font-semibold">Demo report</h3>
      <label className="nk-label mt-3" htmlFor={"reason-" + targetId}>What would you like reviewed?</label><select className="nk-input" id={"reason-" + targetId} data-testid="select-report-reason" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
      <label className="nk-label mt-3" htmlFor={"ctx-" + targetId}>Optional context (no order ID needed)</label><textarea id={"ctx-" + targetId} data-testid="input-report-context" className="nk-input" rows={3} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Optional context" />
      <Btn testid="button-submit-report" variant="solid" className="mt-3 w-full" onClick={() => { submitReport({ targetType, targetId, targetLabel: label, reason, context: context.trim() }); markSaved({ reason, context: "" }); setDone(true); setOpen(false); setContext(""); }}>Submit demo report</Btn></div>}
    {done && <div className="mt-3" data-testid="text-report-done"><Notice tone="green">Report saved locally and added to the operator queue. Fictional prototype only; no one was notified.</Notice></div>}
  </div>;
}
