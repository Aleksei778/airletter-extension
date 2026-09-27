import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://mail.google.com/*"]
}

const listeners: Array<(type: string) => void> = []

export function subscribe(handler: (type: string) => void) {
  listeners.push(handler)
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return
  if (event.data?.source !== "airletter") return

  listeners.forEach((fn) => fn(event.data.type))
})
