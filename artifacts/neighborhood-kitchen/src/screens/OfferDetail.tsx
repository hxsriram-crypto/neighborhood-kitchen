import { ArrowLeft, Sprout } from "lucide-react";
import { useStore } from "@/nk/store";
import { availability, canDiscloseContact, cookName, fmtDeadline, fmtLong, fmtDay, fmtStamp, fmtWindow, ingredientLine, money } from "@/nk/domain";
import { ALLERGENS } from "@/nk/types";
import { Avatar, Btn, MealArt, Notice } from "@/nk/ui";
import { ReportForm } from "@/nk/ReportForm";

export default function OfferDetail() {
  const { data, now, nav, go, signIn, setPhoneConsent } = useStore();
  const o = data.offers.find((x) => x.id === nav.offerId);
  if (!o) return <div className="max-w-xl"><Notice tone="red">This offer could not be found.</Notice><Btn variant="solid" onClick={() => go("Discover")}>Back to Discover</Btn></div>;
  const cook = data.cooks.find((c) => c.id === o.cookId);
  const av = availability(o, data.cooks, now);
  const live = av === "live";
  const reason = av === "expired" ? "deadline passed" : av === "closed" ? "offer closed" : av === "draft" ? "not published" : av === "consent-withdrawn" ? "cook consent withdrawn" : av === "moderated" ? "offer suspended" : "eligibility suspended";
  const contactOk = canDiscloseContact(o, data.cooks, now, data.signedIn, data.phoneConsent);
  const cross = o.crossContact === "none" ? "No known cross-contact reported by the cook." : o.crossContact === "known" ? (o.crossContactNote || "Cross-contact reported; details not supplied.") : "Unknown.";
  return <div className="max-w-5xl">
    <button data-testid="button-back" onClick={() => go("Discover")} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#627269]"><ArrowLeft size={16} /> Back to Discover</button>
    {av === "expired" && <Notice tone="red" testid="status-expired"><strong>Ordering deadline has passed.</strong> This direct link remains viewable, but this offer is no longer in discovery.</Notice>}
    {av === "closed" && <Notice tone="red" testid="status-closed"><strong>This offer is closed.</strong> The cook has closed this offer.</Notice>}
    {av === "consent-withdrawn" && <Notice tone="red" testid="status-consent-withdrawn"><strong>The cook has withdrawn contact consent.</strong> This offer is hidden from discovery and the sample contact route is unavailable.</Notice>}
    {(av === "ineligible" || av === "moderated") && <Notice tone="red" testid="status-ineligible"><strong>This offer is unavailable in this demo.</strong> {av === "moderated" ? "It is suspended pending operator review." : "The cook is not currently eligible."} It is hidden from discovery and contact is unavailable.</Notice>}
    {av === "draft" && <Notice tone="gold" testid="status-draft"><strong>Draft, not published.</strong> Only you can see this preview; neighbors cannot find it.</Notice>}
    <div className="nk-detail-grid mt-4 grid grid-cols-[1.4fr_.8fr] gap-5">
      <div className="nk-card overflow-hidden"><MealArt art={o.art} big /><div className="nk-content">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="nk-eyebrow">{o.cuisine} · Maplewood</p><h1 className="nk-heading" data-testid="text-offer-title">{o.title || "Untitled meal"}</h1></div><span className="text-2xl font-bold text-[#365b4b]">{money(o.price)}<small className="text-sm font-medium"> / portion</small></span></div>
        <p className="mt-3 leading-6 text-[#68776c]">{o.description}</p>
        <p className="mt-2 text-xs text-[#718076]" data-testid="text-offer-updated">Last updated {fmtStamp(o.updatedAt)} · offer v{o.version} · fictional local record</p>
        <div className="mt-5 flex items-center gap-3"><Avatar initials={cook?.initials ?? "?"} /><div><b className="text-sm">{cookName(data.cooks, o.cookId)}</b><p className="text-xs text-[#758278]">Residential cook · sample profile</p></div><button data-testid="link-cook-profile" className="ml-auto text-xs font-semibold text-[#486650]" onClick={() => go("Profile", { cookId: o.cookId })}>View profile</button></div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#f5f6ef] p-3"><p className="nk-eyebrow">Portion</p><p className="text-sm font-semibold">{o.portion}</p></div>
          <div className="rounded-xl bg-[#f5f6ef] p-3"><p className="nk-eyebrow">Cook-reported plan</p><p className="text-sm font-semibold">Planned for {fmtLong(o.pickupDate)}</p><p className="text-xs text-[#77847a]">{o.commitment ? "Same-day preparation commitment · cook-reported" : "Preparation not confirmed."}</p><p className="mt-1 text-xs text-[#77847a]">{o.preparationConfirmation ? "Statement " + o.preparationConfirmation.statementVersion + " · confirmed " + fmtStamp(o.preparationConfirmation.confirmedAt) : "No versioned confirmation recorded for this older sample."}</p></div>
          <div className="rounded-xl bg-[#f5f6ef] p-3"><p className="nk-eyebrow">Pickup</p><p className="text-sm font-semibold">{fmtDay(o.pickupDate)} · {fmtWindow(o)}</p><p className="text-xs text-[#77847a]">{o.condition === "Hot" ? "Hot at pickup" : "Chilled for pickup"} · UTC</p></div>
          <div className="rounded-xl bg-[#f5f6ef] p-3"><p className="nk-eyebrow">Contact/order by</p><p className="text-sm font-semibold" data-testid="text-deadline">{fmtDeadline(o)}</p><p className="text-xs text-[#77847a]">Demo kitchen time (UTC)</p></div>
        </div>
        <div className="mt-6"><h2 className="nk-display text-xl">Ingredients & sourcing</h2><ul className="mt-3 space-y-2">{o.ingredients.filter((i) => i.name.trim()).map((i, k) => <li key={k} className="flex gap-2 text-sm text-[#5f7064]"><Sprout size={15} className="mt-0.5 shrink-0 text-[#789174]" />{ingredientLine(i)}</li>)}</ul></div>
        <div className="mt-5 rounded-xl border border-[#e7e9e0] p-4"><p className="nk-eyebrow">Major allergen declarations · cook-reported</p><div className="grid gap-2 sm:grid-cols-3">{ALLERGENS.map((a) => { const d = o.allergens[a] ?? "unknown"; return <div key={a} className="rounded-lg bg-[#f7f8f2] px-3 py-2 text-xs"><b>{a}</b><span className="mt-1 block text-[#718076]">{d === "present" ? "Present in listed ingredients" : d === "absent" ? "Cook-declared not present · not a safety claim" : "Unknown · no declaration supplied"}</span></div>; })}</div></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-[#e7e9e0] p-4"><p className="nk-eyebrow">Other disclosed allergens · cook-reported</p><p className="whitespace-pre-wrap text-sm leading-5" data-testid="text-other-allergens">{o.otherAllergens?.trim() || "Unknown / not stated. No additional disclosure supplied in this fictional record."}</p></div><div className="rounded-xl border border-[#e7e9e0] p-4"><p className="nk-eyebrow">Kitchen cross-contact</p><p className="text-sm leading-5">{cross}</p></div></div>
        {o.tags.length > 0 && <p className="mt-3 text-xs text-[#718076]">Dietary tags (cook-declared, never proof of allergy safety): {o.tags.join(", ")}</p>}
        <div className="mt-3 rounded-xl bg-[#f7f5ec] p-4 text-sm"><b>Organic status is cook-reported.</b> Each ingredient above includes a sourcing and organic-status statement. Unknown or not stated does not mean absent or certified.</div>
        <div className="mt-3 rounded-xl border border-[#e7e9e0] p-4"><p className="nk-eyebrow">Handling instructions · cook-provided</p><p className="text-sm leading-5">{o.handling}</p></div>
        <p className="mt-5 border-t border-[#edf0e9] pt-4 text-xs leading-5 text-[#718076]">These disclosures are cook-reported and are not independent verification of food, nutrition or safety. Applicable local requirements still apply.</p>
      </div></div>
      <aside className="space-y-4">
        <div className="nk-card nk-content"><h2 className="nk-display text-xl">Coordinate directly</h2><p className="mt-2 text-sm leading-6 text-[#66756b]">Contact the cook to confirm availability and arrange your order outside Neighborhood Kitchen.</p>
          <div className="my-4"><Notice>Ordering, payment and exact pickup details happen directly with the cook, outside this demo.</Notice></div>
          {!live ? <><div className="rounded-xl bg-[#f5f6ef] p-3"><p className="nk-eyebrow">Contact route unavailable</p><p className="text-sm text-[#65746a]">This sample contact route is unavailable because the offer is not currently available.</p></div><button disabled aria-disabled="true" data-testid="button-contact-disabled" className="nk-button mt-4 w-full">Contact unavailable · {reason}</button></>
          : !data.signedIn ? <><div className="rounded-xl bg-[#f5f6ef] p-3"><p className="nk-eyebrow">Signed out</p><p className="text-sm text-[#65746a]">The fictional phone number stays hidden until you simulate a signed-in neighbor and consent.</p></div><Btn testid="button-signin-contact" className="mt-4 w-full" onClick={signIn}>Simulate signed-in neighbor</Btn></>
          : <>
            <label className="flex items-start gap-3 rounded-xl bg-[#f5f6ef] p-3 text-xs leading-5"><input data-testid="check-contact-consent" type="checkbox" className="mt-1 accent-[#365b4b]" checked={data.phoneConsent} onChange={(e) => setPhoneConsent(e.target.checked)} />I understand that contact details may be seen and retained by other participants, and that I arrange everything directly with the cook.</label>
            {contactOk ? <div className="mt-3 rounded-xl bg-[#f5f6ef] p-3" data-testid="panel-contact"><p className="nk-eyebrow">Sample contact route · fictional</p><p className="font-semibold">Phone · (555) 010-0194</p><p className="mt-1 text-xs leading-5 text-[#7b877e]">Demo only: in a live product you would contact the cook directly to confirm availability and arrange ordering, payment and pickup outside the platform. This number is plain text, not a link; no call or message happens.</p></div>
            : <button disabled data-testid="button-contact-needs-consent" className="nk-button mt-3 w-full">Give consent to reveal the sample route</button>}
          </>}
          <p className="mt-2 text-center text-[11px] text-[#78847b]">All contact actions are inert. No call, external link or message.</p>
          <div className="mt-3"><ReportForm targetType="offer" targetId={o.id} label={o.title || "Untitled meal"} /></div>
        </div>
        <div className="nk-card nk-content"><p className="nk-eyebrow">Offer boundaries</p><ul className="space-y-2 text-xs leading-5 text-[#68776c]"><li>{live ? "Published offer; confirm availability with the cook." : "Not currently available."}</li><li>No reservations, orders, inventory or payment in the app.</li><li>Public location is approximate; no home address is shown.</li></ul></div>
      </aside>
    </div></div>;
}
