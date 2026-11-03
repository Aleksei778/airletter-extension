import { SITE_URL } from "~src/lib/config"
import { locale } from "~src/lib/i18n"
import type { PickerEvent } from "~src/lib/messages"

import { pickerCode } from "./api"

// Google Picker runs on the website in a popup window: with the drive.file
// scope, choosing a spreadsheet there is what lets Airletter read it. The page
// reports the choice back through externally_connectable, and we forward it
// to the Gmail tab that asked. Window -> tab pairs live in session storage,
// which outlives the service worker going to sleep while the user picks.

const STORAGE_KEY = "pickerWindows"
const SITE_ORIGIN = new URL(SITE_URL).origin

type Windows = Record<string, number>

async function windows(): Promise<Windows> {
  const stored = await chrome.storage.session.get(STORAGE_KEY)
  return (stored[STORAGE_KEY] as Windows | undefined) ?? {}
}

/** Returns the Gmail tab waiting for this window and forgets the pair */
async function takeTab(windowId: number): Promise<number | undefined> {
  const all = await windows()
  const tabId = all[windowId]
  if (tabId === undefined) return undefined
  delete all[windowId]
  await chrome.storage.session.set({ [STORAGE_KEY]: all })
  return tabId
}

export async function openPicker(tabId: number) {
  const { code } = await pickerCode()
  // the code goes in the fragment: it never reaches server logs or referrers
  const url = `${SITE_URL}/${locale}/sheets/pick#code=${encodeURIComponent(code)}`

  const win = await chrome.windows.create({ url, type: "popup", width: 1100, height: 760, focused: true })
  if (win?.id === undefined) throw new Error("Picker window was not opened")
  await chrome.storage.session.set({ [STORAGE_KEY]: { ...(await windows()), [win.id]: tabId } })
  return { opened: true as const }
}

function notify(tabId: number, event: PickerEvent) {
  chrome.tabs.sendMessage(tabId, event).catch(() => {
    // the Gmail tab was closed meanwhile
  })
}

chrome.runtime.onMessageExternal.addListener((msg: PickerEvent, sender) => {
  const windowId = sender.tab?.windowId
  if (sender.origin !== SITE_ORIGIN || windowId === undefined) return false
  if (msg?.type !== "SHEET_PICKED" && msg?.type !== "SHEET_PICK_CANCELLED") return false

  takeTab(windowId).then((tabId) => {
    if (tabId === undefined) return
    notify(tabId, msg.type === "SHEET_PICKED" ? { type: msg.type, id: String(msg.id), name: String(msg.name) } : msg)
    chrome.windows.remove(windowId).catch(() => {})
  })
  return false
})

// closing the window without choosing a file
chrome.windows.onRemoved.addListener((windowId) => {
  takeTab(windowId).then((tabId) => tabId !== undefined && notify(tabId, { type: "SHEET_PICK_CANCELLED" }))
})
