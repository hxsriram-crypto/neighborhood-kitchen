import { useEffect, type ReactNode } from "react";
import { Heart, Home, MapPin, MessageCircle, Utensils, X } from "lucide-react";
import { useStore } from "./store";
import type { Screen } from "./types";
import { Avatar, Notice } from "./ui";
import { fmtNow } from "./domain";
import { ResetPanel } from "./ResetPanel";

const navItems: Screen[] = ["Discover", "Profile", "Cook application", "My cooking", "Offer editor", "Assistant", "Operator review", "Report queue"];

export function Shell({ children }: { children: ReactNode }) {
  const { nav, go, now, flash, clearFlash, storage } = useStore();
  const screen = nav.screen;
  useEffect(() => { document.title = "Neighborhood Kitchen — " + screen + " (prototype)"; }, [screen]);
  return (
    <div className="nk-shell min-h-[100dvh] bg-[#f5f5ed] text-[#263c32]">
      <header className="nk-top">
        <div className="nk-frame nk-toprow flex min-h-[74px] items-center justify-between gap-4 px-5">
          <button data-testid="button-home" onClick={() => go("Discover")} className="flex items-center gap-3 text-left" aria-label="Neighborhood Kitchen home">
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#365b4b] text-[#fff9e8]"><Utensils size={19} /></span>
            <span><span className="nk-display block text-[21px] leading-5 text-[#2d4839]">Neighborhood Kitchen</span><span className="text-[10px] tracking-wide text-[#819184]">HOME-COOKED MEALS, NEIGHBOR TO NEIGHBOR</span></span>
          </button>
          <div className="hidden items-center gap-1 nk-desktop-nav md:flex">
            {([{ screen: "Discover" as Screen, label: "Browse meals" }, { screen: "My cooking" as Screen, label: "For cooks" }, { screen: "Assistant" as Screen, label: "Meal helper" }]).map((item) => <button key={item.screen} data-testid={"nav-" + item.label} onClick={() => go(item.screen)} className={"rounded-full px-4 py-2 text-sm font-semibold " + (screen === item.screen ? "nk-navactive" : "text-[#637268] hover:bg-[#f0f2eb]")}>{item.label}</button>)}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-[#e6d7b5] bg-[#fcf6e8] px-3 py-1.5 text-[10px] font-bold tracking-wide text-[#79653c] sm:inline-flex">FICTIONAL DEMO</span>
            <button data-testid="button-profile" onClick={() => go("Profile")} className="rounded-full p-1" aria-label="Open profile"><Avatar initials="AL" bg="bg-[#f0dfc9]" /></button>
          </div>
        </div>
      </header>
      <main className="nk-frame pt-6">
        <Notice testid="banner-prototype"><strong>Interactive prototype · fictional Maplewood data only.</strong> Everything is saved only in this browser and is not shared. Demo sign-in and operator choices are simulations, not security. No real ordering, payment, calls or messages.</Notice>
        {storage !== "ok" && <Notice tone="red" testid="banner-storage"><strong>{storage === "corrupt" ? "Saved prototype data could not be read." : "Browser storage is unavailable."}</strong> {storage === "corrupt" ? "Fresh sample data is shown and nothing will be saved until you reset." : "You can still explore, but changes will not survive a reload."} <ResetPanel compact /></Notice>}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#77847a]"><MapPin size={14} /> Maplewood <span className="text-[#c4c9c0]">/</span> <span data-testid="text-clock">Demo kitchen time: UTC · {fmtNow(now)}</span></div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="screen-select">Jump to screen</label>
            <select id="screen-select" data-testid="select-screen" className="nk-input !w-auto !rounded-full !py-2 !text-xs" value={screen} onChange={(e) => go(e.target.value as Screen)}>{navItems.concat(screen === "Offer detail" ? ["Offer detail"] : []).map((s) => <option key={s}>{s}</option>)}</select>
          </div>
        </div>
        {children}
      </main>
      <nav className="nk-footer-nav nk-mobile-only hidden justify-around" aria-label="Primary navigation">
        {([["Browse", Home, "Discover"], ["For cooks", Utensils, "My cooking"], ["Meal helper", MessageCircle, "Assistant"], ["Profile", Heart, "Profile"]] as [string, typeof Home, Screen][]).map(([label, Icon, dest]) => <button key={label} onClick={() => go(dest)} className={"flex flex-col items-center gap-1 rounded-xl px-2 py-1 " + (screen === dest ? "text-[#315744]" : "text-[#7c897f]")}><Icon size={19} /><span>{label}</span></button>)}
      </nav>
      <footer className="nk-frame pb-7 pt-4 text-center text-[10px] leading-5 text-[#89948a]">Neighborhood Kitchen prototype · Fictional demo · Maplewood is fictional · Demo kitchen time is UTC · No live jurisdiction selected</footer>
      {flash && <div role="status" data-testid="flash" className="fixed bottom-20 left-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 md:bottom-6"><div className={"nk-notice !mb-0 flex items-start gap-3 shadow-lg " + flash.tone}><span className="flex-1">{flash.text}</span><button onClick={clearFlash} aria-label="Dismiss"><X size={15} /></button></div></div>}
    </div>
  );
}
