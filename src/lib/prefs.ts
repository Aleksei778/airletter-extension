// Sender preferences remembered between compose windows (chrome.storage.local)

/** Pause between two emails of a campaign, in seconds; the backend accepts the same range */
export const PAUSE = { min: 3, max: 3600, default: 3 } as const

const PAUSE_KEY = "pref:pauseSeconds"

export function validPause(seconds: number): boolean {
  return (
    Number.isInteger(seconds) && seconds >= PAUSE.min && seconds <= PAUSE.max
  )
}

export async function loadPause(): Promise<number> {
  const stored = (await chrome.storage.local.get(PAUSE_KEY))[PAUSE_KEY]
  return typeof stored === "number" && validPause(stored)
    ? stored
    : PAUSE.default
}

export async function savePause(seconds: number) {
  if (validPause(seconds))
    await chrome.storage.local.set({ [PAUSE_KEY]: seconds })
}
