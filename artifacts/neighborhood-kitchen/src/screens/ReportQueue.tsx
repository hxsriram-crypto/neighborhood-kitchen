import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useStore } from "@/nk/store";
import { OperatorGate } from "@/nk/Gates";
import { Badge, Btn, Notice, PageTitle } from "@/nk/ui";
import { fmtStamp } from "@/nk/domain";
import { AuditLog } from "./OperatorReview";

export default function ReportQueue() {
  const { data, setModerated, setCookStatus, resolveReport, go } = useStore();
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const list = data.reports.filter((r) => filter === "all" || r.status === filter);
  return <div className="max-w-5xl"><PageTitle eyebrow="Restricted view · demonstration only" title="Reports to review" sub="Fictional incident triage. Reports filed in this browser appear here; no automated resolution." />
    <OperatorGate><Notice>DEMONSTRATION-ONLY, simulated and not security. No real reports, order IDs, private contact details or evidence are stored.</Notice>
      <div className="mb-4 flex flex-wrap gap-2">{(["open", "resolved", "all"] as const).map((f) => <button key={f} data-testid={"filter-reports-" + f} onClick={() => setFilter(f)} className={"nk-button " + (filter === f ? "nk-solid" : "nk-soft")}>{f[0].toUpperCase() + f.slice(1)} ({data.reports.filter((r) => f === "all" || r.status === f).length})</button>)}</div>
      {list.length === 0 ? <div className="nk-card p-8 text-center"><p className="nk-display text-xl">Nothing here.</p><p className="mt-2 text-sm text-[#68776c]">Report an offer or profile from Discover and it will appear in this queue.</p></div>
      : <div className="grid gap-4 md:grid-cols-2">{list.map((r) => { const offer = r.targetType === "offer" ? data.offers.find((o) => o.id === r.targetId) : undefined; const cookId = offer?.cookId ?? (r.targetType === "cook" ? r.targetId : ""); const cook = data.cooks.find((c) => c.id === cookId); return <div className="nk-card nk-content" key={r.id} data-testid={"report-" + r.id}>
        <div className="flex items-start justify-between gap-3"><div><p className="nk-eyebrow">{r.status === "open" ? "Open" : "Resolved"} · fictional report</p><h2 className="nk-display text-xl">{r.reason}</h2></div><ShieldAlert size={18} className="text-[#ab7655]" /></div>
        <p className="mt-2 text-sm text-[#738076]">{r.targetType === "offer" ? "Offer" : "Profile"} · {r.targetLabel}</p>
        {r.context && <p className="mt-2 rounded-lg bg-[#f5f6ef] p-3 text-sm text-[#4f6256]">“{r.context}”</p>}
        <p className="mt-3 text-xs text-[#79867c]">Filed {fmtStamp(r.createdAt)} · no order ID required</p>
        <div className="mt-2 flex gap-2">{offer?.moderated && <Badge>Offer suspended</Badge>}{cook && cook.status !== "approved" && <Badge>Cook {cook.status}</Badge>}</div>
        {r.status === "open" ? <><label className="nk-label mt-4" htmlFor={"note-" + r.id}>Resolution note</label><textarea id={"note-" + r.id} data-testid={"input-note-" + r.id} className="nk-input" rows={2} value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
          <div className="mt-3 flex flex-wrap gap-2"><Btn testid={"button-resolve-" + r.id} variant="solid" onClick={() => resolveReport(r.id, (notes[r.id] ?? "").trim())}>Resolve</Btn>
            {offer && (offer.moderated ? <Btn onClick={() => setModerated(offer.id, false, notes[r.id] ?? "")}>Restore offer</Btn> : <Btn testid={"button-suspend-offer-" + r.id} onClick={() => setModerated(offer.id, true, notes[r.id] ?? "")}>Suspend offer</Btn>)}
            {cook && cook.status === "approved" && <Btn variant="plain" onClick={() => setCookStatus(cook.id, "suspended", notes[r.id] ?? "")}>Suspend cook</Btn>}
            {offer && <Btn variant="plain" onClick={() => go("Offer detail", { offerId: offer.id })}>View offer</Btn>}</div></> : <p className="mt-3 text-sm text-[#48664e]">Resolved {r.resolvedAt ? fmtStamp(r.resolvedAt) : ""}: {r.resolution}</p>}
      </div>; })}</div>}
      <p className="mt-5 text-xs leading-5 text-[#879188]">The platform cannot identify all neighbors who arranged something outside it. No buyer tracing, refunds or dispute resolution are represented.</p><AuditLog /></OperatorGate></div>;
}
