// Recipient lists imported from Google Sheets. The compose window only gets a
// placeholder chip "<n>-recipients-id_<id>@airletter.invalid"; the addresses
// are kept here and substituted when the campaign starts.

export const LIST_CHIP_DOMAIN = "airletter.invalid"
const PREFIX = "sheet_list:"
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export type RecipientList = { spreadsheet: string; emails: string[]; createdAt: number }

export function newListId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12)
}

export function listChipAddress(id: string, count: number): string {
  return `${count}-recipients-id_${id}@${LIST_CHIP_DOMAIN}`
}

/** Returns the list ID if the address is a list placeholder */
export function parseListChip(address: string): string | null {
  const m = address.match(/-recipients-id_([a-z0-9]+)@airletter\.invalid$/i)
  return m ? m[1] : null
}

export async function saveList(id: string, list: Omit<RecipientList, "createdAt">) {
  await chrome.storage.local.set({ [PREFIX + id]: { ...list, createdAt: Date.now() } })
  await pruneOldLists()
}

export async function getList(id: string): Promise<RecipientList | null> {
  return ((await chrome.storage.local.get(PREFIX + id))[PREFIX + id] as RecipientList | undefined) ?? null
}

async function pruneOldLists() {
  const all = await chrome.storage.local.get(null)
  const stale = Object.entries(all)
    .filter(([k, v]) => k.startsWith(PREFIX) && Date.now() - (v as RecipientList).createdAt > MAX_AGE_MS)
    .map(([k]) => k)
  if (stale.length) await chrome.storage.local.remove(stale)
}
