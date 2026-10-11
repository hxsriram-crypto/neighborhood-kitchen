import { useStore } from "@/nk/store";
import { Avatar, Badge, Btn, Notice, PageTitle, OfferCard } from "@/nk/ui";
import { isLive, sortOffers } from "@/nk/domain";
import { ReportForm } from "@/nk/ReportForm";
import { ResetPanel } from "@/nk/ResetPanel";

export default function Profile() {
  const { data, now, nav, go, signIn, signOut, setPhoneConsent, setOperator, storage } = useStore();
  const cook = nav.cookId ? data.cooks.find((c) => c.id === nav.cookId) : undefined;
  if (cook) {
    const offers = data.offers.filter((o) => o.cookId === cook.id && isLive(o, data.cooks, now)).sort(sortOffers);
    return <div className="max-w-4xl"><PageTitle eyebrow="Neighbor profile" title="A familiar face, a good meal." sub="A fictional profile shown to illustrate neighborhood discovery." />
      {cook.status !== "approved" && <Notice tone="red" testid="status-cook-ineligible"><b>This cook is not currently eligible</b> ({cook.status}). Their offers are hidden and contact is unavailable.</Notice>}
      <div className="grid gap-5 md:grid-cols-[.72fr_1.28fr]"><div className="nk-card nk-content text-center"><div className="flex justify-center"><Avatar initials={cook.initials} bg="bg-[#f0dfc9]" /></div><h2 className="nk-display mt-3 text-2xl" data-testid="text-cook-name">{cook.name}</h2><p className="mt-1 text-sm text-[#748177]">Maplewood neighbor</p><div className="my-4"><Badge>Sample cook profile</Badge></div><p className="text-sm leading-6 text-[#69766c]">“{cook.bio}”</p></div>
        <div className="nk-card nk-content"><h3 className="nk-display text-xl">About the cook</h3><p className="mt-2 text-sm leading-6 text-[#68776c]">The profile shares a public name and approximate neighborhood only. Exact pickup arrangements are handled directly after contact.</p><div className="mt-5 border-t border-[#edf0e9] pt-4"><p className="nk-eyebrow">Review information</p><p className="text-sm leading-6">This screen does not claim a real credential check. No private documents or home address appear in the demo.</p></div><div className="mt-5"><ReportForm targetType="cook" targetId={cook.id} label={cook.name + " (profile)"} /></div></div></div>
      <h3 className="nk-display mb-3 mt-8 text-2xl">Current offers</h3>{offers.length ? <div className="nk-cardgrid grid grid-cols-3 gap-4">{offers.map((o) => <OfferCard key={o.id} offer={o} cook={cook} onOpen={() => go("Offer detail", { offerId: o.id })} />)}</div> : <Notice>No current offers from this cook.</Notice>}
      <div className="mt-5"><Btn variant="plain" onClick={() => go("Profile")}>Back to my profile</Btn></div></div>;
  }
  const me = data.cooks.find((c) => c.id === "me")!;
  return <div className="max-w-4xl"><PageTitle eyebrow="Your simulated identity" title="Neighbor and cook, one account." sub="The same fictional person can browse meals and offer them. This is a simulation, not real authentication." />
    <div className="grid gap-5 md:grid-cols-[.72fr_1.28fr]">
      <div className="nk-card nk-content text-center"><div className="flex justify-center"><Avatar initials="AL" bg="bg-[#f0dfc9]" /></div><h2 className="nk-display mt-3 text-2xl">Alex Larkin</h2><p className="mt-1 text-sm text-[#748177]">Maplewood neighbor · fictional</p><div className="my-4 flex justify-center gap-2"><Badge data-testid="badge-signin">{data.signedIn ? "Signed in (simulated)" : "Signed out"}</Badge><Badge>Cook: {me.status}</Badge></div>
        {data.signedIn ? <Btn testid="button-signout" onClick={signOut}>Sign out</Btn> : <Btn testid="button-signin" variant="solid" onClick={signIn}>Simulate sign-in</Btn>}</div>
      <div className="nk-card nk-content"><h3 className="nk-display text-xl">Contact consent</h3><label className="mt-3 flex items-start gap-3 text-sm leading-5"><input data-testid="check-profile-consent" type="checkbox" className="mt-1 accent-[#365b4b]" disabled={!data.signedIn} checked={data.phoneConsent} onChange={(e) => setPhoneConsent(e.target.checked)} />I understand contact details may be seen and retained by other participants. Required before the fictional phone route is shown.</label>{!data.signedIn && <p className="mt-2 text-xs text-[#7c887f]">Sign in first.</p>}
        <div className="mt-5 flex flex-wrap gap-2"><Btn onClick={() => go("My cooking")}>My cooking</Btn><Btn onClick={() => go("Cook application")}>Cook application</Btn><Btn onClick={() => go("Profile", { cookId: "me" })}>View my public cook profile</Btn></div></div>
    </div>
    <div className="nk-card nk-content mt-5"><h3 className="nk-display text-xl">Prototype tools</h3><p className="mt-2 text-sm leading-6 text-[#68776c]">Storage: {storage === "ok" ? "saving to this browser only." : storage === "corrupt" ? "stored data unreadable; reset to resume saving." : "unavailable; nothing is saved."} Nothing is shared, uploaded or sent anywhere.</p>
      <div className="mt-3 flex flex-wrap gap-2"><Btn onClick={() => go("Operator review")}>Operator review (simulated)</Btn><Btn onClick={() => go("Report queue")}>Report queue (simulated)</Btn>{data.operator && <Btn variant="plain" onClick={() => setOperator(false)}>Leave operator mode</Btn>}</div><ResetPanel /></div></div>;
}
