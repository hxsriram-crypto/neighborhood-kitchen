import type { Offer, Screen } from "./types";

export interface NavOptions {
  offerId?: string;
  cookId?: string;
  editorId?: string;
  seed?: Partial<Offer>;
  mode?: string;
}
export interface Nav extends NavOptions {
  screen: Screen;
  editorKey: string;
  notFound?: boolean;
}

const paths: Partial<Record<Screen, string>> = {
  Discover: "/",
  Profile: "/profile",
  "Cook application": "/cook-application",
  "My cooking": "/my-cooking",
  Assistant: "/assistant",
  "Operator review": "/operator-review",
  "Report queue": "/report-queue",
};

// Read the raw pathname: Wouter's useLocation decodes URI escapes, which
// would cause IDs containing a literal "%" to be decoded twice.
export function relativeScreenPath(pathname: string, base: string): string {
  const prefix = base.replace(/\/$/, "");
  if (!prefix) return pathname;
  if (pathname === prefix) return "/";
  return pathname.startsWith(prefix + "/") ? pathname.slice(prefix.length) : "~" + pathname;
}

// Paths are relative to Wouter's base, never to the host root.
export function screenPath(screen: Screen, options: NavOptions = {}): string {
  if (screen === "Offer detail") return options.offerId ? "/meals/" + encodeURIComponent(options.offerId) : "/";
  if (screen === "Profile" && options.cookId) return "/cooks/" + encodeURIComponent(options.cookId);
  if (screen === "Offer editor") return options.editorId ? "/offers/" + encodeURIComponent(options.editorId) + "/edit" : "/offers/new";
  if (screen === "Assistant" && options.mode === "offer") return "/assistant/offer";
  return paths[screen] ?? "/";
}

export function parseScreenPath(path: string): Omit<Nav, "editorKey"> {
  const clean = path.length > 1 ? path.replace(/\/$/, "") : path;
  for (const [screen, url] of Object.entries(paths)) {
    if (clean === url) return { screen: screen as Screen };
  }
  if (clean === "/offers/new") return { screen: "Offer editor" };
  if (clean === "/assistant/offer") return { screen: "Assistant", mode: "offer" };
  const match = clean.match(/^\/(meals|cooks)\/([^/]+)$/) ?? clean.match(/^\/(offers)\/([^/]+)\/edit$/);
  if (match) {
    try {
      const id = decodeURIComponent(match[2]);
      if (match[1] === "meals") return { screen: "Offer detail", offerId: id };
      if (match[1] === "cooks") return { screen: "Profile", cookId: id };
      return { screen: "Offer editor", editorId: id };
    } catch {
      // Malformed escaped IDs should render not-found, not crash the app.
    }
  }
  return { screen: "Discover", notFound: true };
}
