// Events between the extension's UIs on the Gmail page (toolbar, inline
// compose buttons). They run as separate content-script bundles, so they talk
// through window.postMessage; the page can see these messages, which is fine:
// they only carry UI events, never tokens or user data.

export type Toast = {
  kind: "info" | "success" | "error"
  text: string
  action?: { label: string; href?: string; login?: boolean }
}

export type BusEvent = { type: "OPEN_SHEETS_MODAL" } | { type: "TOAST"; toast: Toast }

const SOURCE = "airletter"

export function emit(event: BusEvent) {
  window.postMessage({ source: SOURCE, ...event }, window.location.origin)
}

export function subscribe(handler: (event: BusEvent) => void): () => void {
  const listener = (e: MessageEvent) => {
    if (e.source !== window || e.data?.source !== SOURCE) return
    handler(e.data as BusEvent)
  }
  window.addEventListener("message", listener)
  return () => window.removeEventListener("message", listener)
}

export const toast = (t: Toast) => emit({ type: "TOAST", toast: t })
