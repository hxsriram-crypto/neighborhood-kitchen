import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useStore } from "./store";
import { Btn, Notice } from "./ui";

export function ResetPanel({ compact }: { compact?: boolean }) {
  const { resetAll } = useStore();
  const [ask, setAsk] = useState(false);
  if (!ask) return <Btn testid="button-reset-ask" variant={compact ? "solid" : "soft"} icon={<RotateCcw size={14} />} onClick={() => setAsk(true)} className={compact ? "mt-2" : ""}>Reset sample data…</Btn>;
  return <div className="mt-3" data-testid="panel-reset-confirm"><Notice tone="red"><b>Reset all sample data?</b> This erases every offer, application, report, audit entry, sign-in choice and interrupted-draft recovery copy stored in this browser, then restores the fictional Maplewood records with fresh dates. Data lives only in this browser; it is not shared with anyone and cannot be recovered.</Notice><div className="flex flex-wrap gap-2"><Btn testid="button-reset-confirm" variant="solid" onClick={() => { resetAll(); setAsk(false); }}>Yes, reset sample data</Btn><Btn testid="button-reset-cancel" variant="plain" onClick={() => setAsk(false)}>Keep my data</Btn></div></div>;
}
