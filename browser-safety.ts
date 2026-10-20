/** Browser preferences must never prevent access to a bank's direct link. */
export function readAccountPreference(): string | null {
  try {
    return window.localStorage.getItem("cady-pay-account");
  } catch {
    return null;
  }
}

export function saveAccountPreference(id: string): void {
  try {
    window.localStorage.setItem("cady-pay-account", id);
  } catch {
    // Private browsing, denied storage, or a full quota is not an application error.
  }
}

export function accountUrl(href: string, id: string, forSharing = false): URL {
  const url = new URL(href);
  url.search = "";
  url.searchParams.set("bank", id);
  url.hash = forSharing ? "account" : ["", "#top", "#accounts", "#account"].includes(url.hash) ? url.hash : "";
  return url;
}

/** An application safeguard; HTTP frame-ancestors remains the preferred control. */
export function isTopLevel(context: Pick<Window, "top" | "self"> = window): boolean {
  try {
    return context.top === context.self;
  } catch {
    return false;
  }
}
