import { ExtensionError, type Request, type Response, type ResponseData } from "~src/lib/messages"

import { account, fetchAttachment, parseSheet, startCampaign } from "./api"
import { isSignedIn, login, logout } from "./auth"

type Handlers = { [T in Request["type"]]: (req: Extract<Request, { type: T }>) => Promise<ResponseData[T]> }

const handlers: Handlers = {
  AUTH_STATUS: async () => ({ signedIn: await isSignedIn() }),
  LOGIN: async () => {
    await login()
    return { signedIn: true }
  },
  LOGOUT: async () => {
    await logout()
    return { signedIn: false }
  },
  ACCOUNT: () => account(),
  START_CAMPAIGN: (req) => startCampaign(req.campaign),
  PARSE_SHEET: (req) => parseSheet(req.spreadsheet, req.range),
  FETCH_ATTACHMENT: (req) => fetchAttachment(req.url)
}

chrome.runtime.onMessage.addListener((req: Request, sender, sendResponse) => {
  // accept messages only from this extension's own pages and content scripts
  if (sender.id !== chrome.runtime.id) return false

  const handler = handlers[req?.type] as ((r: Request) => Promise<unknown>) | undefined
  if (!handler) return false

  handler(req)
    .then((data) => sendResponse({ ok: true, data } as Response<typeof req.type>))
    .catch((e: unknown) => {
      const error =
        e instanceof ExtensionError
          ? { code: e.code, message: e.message }
          : { code: "unknown" as const, message: String(e) }
      if (error.code === "unknown" || error.code === "network") console.error("[Airletter]", req.type, e)
      sendResponse({ ok: false, error })
    })

  return true // keep the channel open for the async response
})

export {}
