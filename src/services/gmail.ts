// Everything that reads or changes Gmail's DOM lives here, so selector
// changes on Gmail's side need fixing in one place.

import { getList, listChipAddress, parseListChip } from "./lists"

const SEL = {
  composeButton: ".T-I.T-I-KE.L3",
  composeWindow: ".AD, .M9, [data-compose-id]",
  sendButton: ".T-I.J-J5-Ji.aoO.v7.T-I-atl.L3",
  recipientInput: ".agP.aFw",
  recipientChips: ".afV[data-hovercard-id], div[peoplekit-id][data-hovercard-id]",
  subject: 'input[name="subject"]',
  body: 'div[role="textbox"][contenteditable="true"]',
  attachments: ".dL"
} as const

export { SEL as GMAIL_SELECTORS }

export type Draft = { recipients: string[]; subject: string; body: string }
export type AttachmentLink = { url: string; filename: string }

/** Finds the compose window that contains the element (our inline button) */
export function findComposeWindow(el: Element): HTMLElement | null {
  const direct = el.closest<HTMLElement>(SEL.composeWindow)
  if (direct) return direct

  // content-script UI is mounted next to the send button, possibly outside
  // the compose DOM subtree: fall back to what is rendered under the element
  const rect = el.getBoundingClientRect()
  for (const hit of document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)) {
    const w = hit.closest<HTMLElement>(SEL.composeWindow)
    if (w) return w
  }
  return null
}

export function findComposeWindows(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(SEL.composeWindow))
}

export async function openComposeWindow(): Promise<HTMLElement | null> {
  document.querySelector<HTMLElement>(SEL.composeButton)?.click()
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 100))
    const w = findComposeWindows()[0]
    if (w) return w
  }
  return null
}

/** Reads recipients (with imported lists expanded), subject and HTML body */
export async function readDraft(compose: HTMLElement): Promise<Draft> {
  const raw = Array.from(compose.querySelectorAll(SEL.recipientChips))
    .map((n) => n.getAttribute("data-hovercard-id") ?? "")
    .filter((e) => e.includes("@"))

  const recipients: string[] = []
  for (const address of raw) {
    const listId = parseListChip(address)
    if (!listId) {
      recipients.push(address)
      continue
    }
    const list = await getList(listId)
    if (list) recipients.push(...list.emails)
  }

  return {
    recipients: Array.from(new Set(recipients.map((r) => r.trim().toLowerCase()))),
    subject: compose.querySelector<HTMLInputElement>(SEL.subject)?.value ?? "",
    body: compose.querySelector<HTMLElement>(SEL.body)?.innerHTML ?? ""
  }
}

/** Attachments already uploaded to the draft */
export function readAttachmentLinks(compose: HTMLElement): AttachmentLink[] {
  const links: AttachmentLink[] = []
  for (const node of compose.querySelectorAll(SEL.attachments)) {
    if (!node.querySelector("input[name='attach']")) continue
    const link = node.querySelector<HTMLAnchorElement>("a")
    const name = link?.querySelector("div")?.textContent?.trim()
    if (link?.href && name) links.push({ url: link.href, filename: name })
  }
  return links
}

/** Adds a placeholder chip for an imported list to the "To" field */
export function addListChip(compose: HTMLElement, listId: string, count: number): boolean {
  const input = compose.querySelector<HTMLInputElement>(SEL.recipientInput)
  if (!input) return false

  const previous = document.activeElement as HTMLElement | null
  input.focus()
  input.value = listChipAddress(listId, count)
  input.dispatchEvent(new InputEvent("input", { bubbles: true }))
  input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter", code: "Enter" }))
  previous?.focus()
  return true
}
