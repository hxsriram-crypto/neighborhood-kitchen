import { useState } from "react";
import { MessageCircle, Plus } from "lucide-react";
import { useStore } from "@/nk/store";
import { SignInGate } from "@/nk/Gates";
import { Badge, Btn, Notice, PageTitle } from "@/nk/ui";
import { availability, fmtDay, fmtDeadline, fmtStamp, fmtWindow, type Availability } from "@/nk/domain";
import { ME } from "@/nk/types";

const LABEL: Record<Availability, string> = { live: "Published · live", draft: "Draft", closed: "Closed", expired: "Expired", ineligible: "Hidden · not eligible", moderated: "Suspended by operator" };

export default function MyCooking() {
  const { data, now, go, closeOffer, reopenOffer } = useStore();
  const me = data.cooks.find((c) => c.id === ME)!;
  const [errs, setErrs] = useState<Record<string, string[]>>({});
  const mine = data.offers.filter((o) => o.cookId === ME).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return <div><PageTitle eyebrow="Cook workspace" title="My cooking" sub="For cooks: “We Sell What We Eat” is a community promise about care, not a nutrition or safety claim." />
    <SignInGate why="Sign in (simulated) to manage your offers.">
      <div className="mb-5 flex flex-wrap gap-2"><Btn testid="button-new-offer" variant="solid" icon={<Plus size={15} />} onClick={() => go("Offer editor")}>New upcoming offer</Btn><Btn testid="button-help-offer" icon={<MessageCircle size={15} />} onClick={() => go("Assistant", { mode: "offer" })}>Help me offer a meal</Btn><Btn onClick={() => go("Cook application")}>Application & eligibility</Btn></div>
      {me.status !== "approved" && <Notice tone="red" testid="status-not-eligible"><b>Cook status: {me.status === "none" ? "not applied" : me.status}.</b> Your offers are hidden from discovery, contact is blocked and publishing is unavailable. You can still save drafts. <button className="font-semibold underline" onClick={() => go("Cook application")}>Open application</button></Notice>}
      {mine.length === 0 ? <div className="nk-card p-8 text-center"><p className="nk-display text-xl">No offers yet.</p><p className="mt-2 text-sm text-[#68776c]">Start a draft, or ask the scripted helper to structure one.</p></div>
      : <div className="mt-4 grid gap-4 md:grid-cols-2">{mine.map((o) => { const av = availability(o, data.cooks, now); return <div key={o.id} className="nk-card nk-content" data-testid={"row-offer-" + o.id}>
        <div className="flex items-center justify-between"><Badge className={av === "live" ? "" : "!bg-[#f5f1e5] !text-[#806b41]"}>{LABEL[av]}</Badge><span className="text-xs text-[#879188]">v{o.version} · edited {fmtStamp(o.updatedAt)}</span></div>
        <h3 className="nk-display mt-3 text-2xl">{o.title || "Untitled draft"}</h3>
        <p className="mt-2 text-sm text-[#6b786e]">{o.pickupDate ? "Pickup " + fmtDay(o.pickupDate) + " · " + fmtWindow(o) : "Pickup not set"}</p>
        <p className="mt-1 text-xs text-[#7c897f]">{o.deadlineDate ? "Contact/order by " + fmtDeadline(o) : "Deadline not set"}</p>
        {av === "expired" && <p className="mt-2 text-xs text-[#806b41]">Deadline passed; absent from consumer discovery. Edit the deadline to extend explicitly.</p>}
        {errs[o.id]?.length ? <div className="mt-3"><Notice tone="red"><b>Cannot reopen yet:</b><ul className="ml-4 list-disc">{errs[o.id].map((x) => <li key={x}>{x}</li>)}</ul><button className="mt-1 font-semibold underline" onClick={() => go("Offer editor", { editorId: o.id })}>Fix in editor</button></Notice></div> : null}
        <div className="mt-4 flex flex-wrap gap-2"><Btn testid={"button-edit-" + o.id} onClick={() => go("Offer editor", { editorId: o.id })}>{o.status === "draft" ? "Continue draft" : "Edit offer"}</Btn><Btn variant="plain" onClick={() => go("Offer detail", { offerId: o.id })}>Preview</Btn>
          {o.status === "published" && <Btn testid={"button-close-" + o.id} variant="plain" onClick={() => closeOffer(o.id)}>Close early</Btn>}
          {o.status === "closed" && <Btn testid={"button-reopen-" + o.id} variant="solid" onClick={() => setErrs({ ...errs, [o.id]: reopenOffer(o.id) })}>Reopen offer</Btn>}</div></div>; })}</div>}
      <p className="mt-5 text-xs text-[#879188]">No order, payment, availability count, customer history or completion data is tracked here. Offers never reopen automatically.</p>
    </SignInGate></div>;
}
