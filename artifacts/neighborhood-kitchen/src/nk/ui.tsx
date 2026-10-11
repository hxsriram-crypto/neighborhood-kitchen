import type { ReactNode } from "react";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import type { Cook, Offer } from "./types";
import { fmtDay, fmtDeadline, fmtWindow, money } from "./domain";

export const Avatar = ({ initials, bg = "bg-[#d9e5d5]" }: { initials: string; bg?: string }) => <span className={"inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full " + bg + " font-semibold text-[#365046]"}>{initials}</span>;
export const Badge = ({ children, className = "" }: { children: ReactNode; className?: string }) => <span className={"inline-flex items-center rounded-full border border-[#d7ded1] bg-[#f6f7f0] px-3 py-1 text-xs font-medium text-[#4d6457] " + className}>{children}</span>;
export function Btn({ children, onClick, variant = "soft", icon, disabled, className = "", testid, type = "button" }: { children: ReactNode; onClick?: () => void; variant?: "solid" | "soft" | "plain"; icon?: ReactNode; disabled?: boolean; className?: string; testid?: string; type?: "button" | "submit" }) {
  return <button type={type} data-testid={testid} disabled={disabled} onClick={onClick} className={"nk-button " + (variant === "solid" ? "nk-solid" : variant === "plain" ? "nk-plain" : "nk-soft") + " " + className}>{icon}{children}</button>;
}
export const PageTitle = ({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) => <div className="mb-6"><p className="nk-eyebrow">{eyebrow}</p><h1 className="nk-heading">{title}</h1>{sub && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68776c]">{sub}</p>}</div>;
export const Notice = ({ children, tone = "gold", testid }: { children: ReactNode; tone?: "gold" | "red" | "green"; testid?: string }) => <div data-testid={testid} className={"nk-notice " + tone}>{children}</div>;
export const MealArt = ({ art, big, children }: { art: Offer["art"]; big?: boolean; children?: ReactNode }) => <div className={"nk-meal-art " + (art === "sage" ? "nk-art-sage" : art === "blue" ? "nk-art-blue" : "") + (big ? " !min-h-[220px]" : "")}><span className={"nk-bowl" + (big ? " !h-[125px] !w-[190px]" : "")} />{children}</div>;
export const Field = ({ label, id, children, className = "" }: { label: string; id: string; children: ReactNode; className?: string }) => <div className={"nk-field " + className}><label className="nk-label" htmlFor={id}>{label}</label>{children}</div>;

export function OfferCard({ offer, cook, onOpen, note }: { offer: Offer; cook?: Cook; onOpen: () => void; note?: ReactNode }) {
  return <article className="nk-card overflow-hidden" data-testid={"card-offer-" + offer.id}>
    <MealArt art={offer.art}><span className="absolute left-3 top-3 z-10 rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold text-[#54705b]">{offer.cuisine || "Cuisine not set"}</span></MealArt>
    <div className="nk-content"><div className="flex items-start justify-between gap-2"><h3 className="nk-display text-[21px] leading-6">{offer.title || "Untitled meal"}</h3><span className="shrink-0 text-lg font-bold text-[#345845]">{money(offer.price)}</span></div>
      <div className="mt-3 flex items-center gap-2"><Avatar initials={cook?.initials ?? "?"} /><div><div className="text-sm font-semibold">{cook?.name ?? "Unknown"}</div><div className="text-xs text-[#829087]">Maplewood neighbor</div></div></div>
      <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#69766c]">{offer.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{offer.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
      <div className="mt-4 space-y-2 border-t border-[#edf0e9] pt-3 text-xs text-[#5f7064]"><div className="flex gap-2"><CalendarDays size={14} /><span><b className="font-semibold text-[#465d4d]">Pickup</b> · {fmtDay(offer.pickupDate)} · {fmtWindow(offer)}</span></div><div className="flex gap-2"><Clock3 size={14} /><span><b className="font-semibold text-[#465d4d]">Contact by</b> · {fmtDeadline(offer)}</span></div></div>
      {note}
      <button data-testid={"button-view-" + offer.id} onClick={onOpen} className="nk-button nk-soft mt-4 w-full">View meal details <ArrowRight size={15} /></button>
    </div></article>;
}
