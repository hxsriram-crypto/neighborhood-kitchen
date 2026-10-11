import type { ReactNode } from "react";
import { useStore } from "./store";
import { Btn, Notice } from "./ui";

export function SignInGate({ children, why }: { children: ReactNode; why: string }) {
  const { data, signIn } = useStore();
  if (data.signedIn) return <>{children}</>;
  return <div className="nk-card nk-content max-w-xl"><Notice>{why}</Notice><p className="mb-4 text-sm leading-6 text-[#66756b]">This is a simulated sign-in as the fictional neighbor and cook Alex Larkin. No account, password or personal data is involved.</p><Btn testid="button-signin" variant="solid" onClick={signIn}>Simulate signing in as Alex Larkin</Btn></div>;
}
export function OperatorGate({ children }: { children: ReactNode }) {
  const { data, setOperator } = useStore();
  if (data.operator) return <>{children}</>;
  return <div className="nk-card nk-content max-w-xl"><Notice tone="red"><b>Restricted demonstration view.</b> Switching to operator mode here is a simulation, not security: anyone using this prototype can do it.</Notice><Btn testid="button-operator-on" variant="solid" onClick={() => setOperator(true)}>Enter simulated operator mode</Btn></div>;
}
