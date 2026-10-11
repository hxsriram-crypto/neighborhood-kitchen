import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, ChevronDown, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useStore } from "@/nk/store";
import { isLive, fmtDay, fmtDeadline, fmtWindow, money, sortOffers } from "@/nk/domain";
import { DIETARY_TAGS } from "@/nk/types";
import { Btn, Notice, OfferCard } from "@/nk/ui";

export default function Discover() {
  const { data, now, go } = useStore();
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(""); const [date, setDate] = useState(""); const [cuisine, setCuisine] = useState(""); const [tags, setTags] = useState<string[]>([]); const [showFilters, setShowFilters] = useState(false);
  useEffect(() => { const t = window.setTimeout(() => setLoading(false), 350); return () => window.clearTimeout(t); }, []);
  const live = useMemo(() => data.offers.filter((o) => isLive(o, data.cooks, now)).sort(sortOffers), [data.offers, data.cooks, now]);
  const cookN = (id: string) => data.cooks.find((c) => c.id === id);
  const dates = [...new Set(live.map((o) => o.pickupDate))]; const cuisines = [...new Set(live.map((o) => o.cuisine))];
  const q = query.trim().toLowerCase();
  const shown = live.filter((o) => (!q || (o.title + " " + o.description + " " + (cookN(o.cookId)?.name ?? "")).toLowerCase().includes(q)) && (!date || o.pickupDate === date) && (!cuisine || o.cuisine === cuisine) && tags.every((t) => o.tags.includes(t)));
  const filtered = !!(q || date || cuisine || tags.length);
  const clear = () => { setQuery(""); setDate(""); setCuisine(""); setTags([]); };
  const featured = live[0];
  return <>
    <section className="mb-6 grid items-center gap-5 md:grid-cols-[1.05fr_.95fr]">
      <div className="py-1">
        <p className="nk-eyebrow">Maplewood meal board · fictional sample</p>
        <h1 className="nk-display max-w-xl text-[39px] leading-[1.04] text-[#294236] md:text-[51px]">Find a home-cooked meal nearby.</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[#68776c]">Browse upcoming meals from residential cooks, compare sample prices and pickup windows, then open a dish to see its details.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3"><Btn testid="button-browse" variant="solid" icon={<Search size={15} />} onClick={() => document.getElementById("meal-listings")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Browse {live.length} sample meal{live.length === 1 ? "" : "s"}</Btn><button data-testid="link-offer-meal" onClick={() => go("Cook application")} className="rounded-full px-3 py-2 text-sm font-semibold text-[#587361] underline decoration-[#bdcdbd] underline-offset-4 hover:bg-[#eaf0e7]">Offer a meal as a cook <ArrowRight size={14} className="ml-1 inline" /></button></div>
      </div>
      <div className="nk-card overflow-hidden">
        <div className="flex items-center justify-between bg-[#e8eee4] px-4 py-3"><span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#647867]">A sample neighbor offer</span><span className="rounded-full border border-[#d7ded1] bg-[#f6f7f0] px-3 py-1 text-xs font-medium text-[#4d6457]">Fictional</span></div>
        {featured ? <button data-testid="button-featured" onClick={() => go("Offer detail", { offerId: featured.id })} className="grid w-full grid-cols-[105px_1fr] items-center gap-4 p-4 text-left hover:bg-[#fbfbf6]">
          <div className="nk-meal-art !min-h-[104px]"><span className="nk-bowl !h-[70px] !w-[100px]" /></div>
          <div><p className="text-xs text-[#7d8a7e]">{cookN(featured.cookId)?.name} · Maplewood</p><h2 className="nk-display mt-1 text-xl leading-6">{featured.title}</h2><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><b className="text-[#345845]">{money(featured.price)}<span className="text-xs font-normal"> / portion</span></b><span className="text-[#637268]"><b className="font-semibold">Pickup</b> · {fmtDay(featured.pickupDate)} · {fmtWindow(featured)} UTC</span></div><p data-testid="text-featured-cutoff" className="mt-2 text-xs text-[#637268]"><b className="font-semibold">Contact / order by</b> · {fmtDeadline(featured)}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#4d6e56]">View meal details <ArrowRight size={13} /></span></div>
        </button> : <p className="p-5 text-sm text-[#68776c]">No current offers. Cooks can publish one from My cooking.</p>}
      </div>
    </section>
    <section className="nk-card mb-6 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[170px] flex-1"><label className="nk-label" htmlFor="search">Find a meal or neighbor cook</label><div className="relative"><Search size={17} className="absolute left-3 top-3 text-[#859187]" /><input id="search" data-testid="input-search" className="nk-input pl-10" placeholder="Soup, hand pies, cook name…" value={query} onChange={(e) => setQuery(e.target.value)} /></div></div>
        <div className="nk-field !mb-0"><label className="nk-label" htmlFor="date">Pickup date</label><select className="nk-input" id="date" data-testid="select-date" value={date} onChange={(e) => setDate(e.target.value)}><option value="">Any upcoming date</option>{dates.map((d) => <option key={d} value={d}>{fmtDay(d)}</option>)}</select></div>
        <div className="nk-field !mb-0"><label className="nk-label" htmlFor="cuisine">Cuisine</label><select className="nk-input" id="cuisine" data-testid="select-cuisine" value={cuisine} onChange={(e) => setCuisine(e.target.value)}><option value="">Any cuisine</option>{cuisines.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        <button data-testid="button-dietary" aria-expanded={showFilters} className="nk-button nk-soft" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={15} /> Dietary tags{tags.length ? " (" + tags.length + ")" : ""} <ChevronDown size={14} /></button>
        {filtered && <Btn testid="button-clear-filters" variant="plain" onClick={clear}>Clear filters</Btn>}
      </div>
      {showFilters && <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf0e8] pt-3">{DIETARY_TAGS.map((t) => { const on = tags.includes(t); return <button key={t} data-testid={"tag-" + t} aria-pressed={on} onClick={() => setTags(on ? tags.filter((x) => x !== t) : [...tags, t])} className={"rounded-full border px-3 py-2 text-xs " + (on ? "border-[#547461] bg-[#e8efe5] text-[#315744]" : "border-[#e0e5dc] text-[#647268]")}>{on ? <Check size={12} className="mr-1 inline" /> : <Plus size={12} className="mr-1 inline" />}{t}</button>; })}<span className="self-center text-[11px] text-[#879188]">Tags are cook-declared and do not establish allergy safety.</span></div>}
    </section>
    <div id="meal-listings" className="mb-4 flex scroll-mt-5 items-end justify-between"><div><p className="nk-eyebrow">Browse neighbor offers</p><h2 className="nk-display text-2xl">Upcoming home-cooked meals</h2></div><span data-testid="text-count" className="text-xs text-[#78847b]">{loading ? "Loading…" : shown.length + " fictional offer" + (shown.length === 1 ? "" : "s")}</span></div>
    {live.some((offer) => !offer.publishedAt) && <p data-testid="text-legacy-ordering" className="mb-4 text-xs leading-5 text-[#68776c]">Earlier pickup first. For equal pickup times, newest first publication comes first; older saved samples with unknown publication times follow in stable sample-ID order. Editing or reopening does not reset publication time.</p>}
    {loading ? <div className="nk-cardgrid grid grid-cols-3 gap-4">{[1, 2, 3].map((n) => <div key={n} className="nk-card animate-pulse p-4"><div className="h-36 rounded-xl bg-[#e8ece3]" /><div className="mt-4 h-5 w-3/4 rounded bg-[#e8ece3]" /><div className="mt-3 h-4 w-1/2 rounded bg-[#edf0e9]" /><div className="mt-5 h-10 rounded-full bg-[#e8ece3]" /></div>)}</div>
    : shown.length ? <div className="nk-cardgrid grid grid-cols-3 gap-4">{shown.map((o) => <OfferCard key={o.id} offer={o} cook={cookN(o.cookId)} onOpen={() => go("Offer detail", { offerId: o.id })} />)}</div>
    : <div className="nk-card p-8 text-center" data-testid="empty-matches"><Notice><strong>No matches this time.</strong> {filtered ? "Try a different pickup date or clear a filter." : "There are no current offers."} Search only shows current sample offers whose ordering deadline has not passed.</Notice><div className="mt-4 flex justify-center gap-2">{filtered && <Btn variant="solid" onClick={clear}>Clear filters</Btn>}{filtered && dates.length > 0 && <Btn onClick={() => { setDate(""); }}>Try another date</Btn>}{!filtered && <Btn variant="solid" onClick={() => go("My cooking")}>Publish one as a cook</Btn>}</div></div>}
    <p className="mt-5 text-center text-[11px] leading-5 text-[#879188]">Fictional demo content · not a selected live jurisdiction · no live food activity or availability represented.</p>
  </>;
}
