// Typed protocol between content scripts / popup and the background worker.
// Only the background touches auth tokens; everything else asks it by message.

export type Account = {
  email: string
  firstName: string
  plan: "trial" | "standard" | "premium" | null
  planEndsAt: string | null
  dailyLimit: number
  sentToday: number
}

export type AttachmentPayload = {
  filename: string
  mimetype: string
  content: string // base64
  // set for images shown inside the body as <img src="cid:...">
  content_id?: string
}

export type CampaignPayload = {
  subject: string
  body: string
  // "html" (default): body is HTML; "text": body is sent as plain text
  format: "html" | "text"
  // language of the "Sent with Airletter" footer on the trial
  locale: "ru" | "en"
  recipients: string[]
  attachments: AttachmentPayload[]
  // empty = send now; otherwise local date/time in the given IANA timezone
  date: string
  time: string
  timezone: string
}

export type CampaignCreated = { id: number; total: number; skipped: string[]; scheduledAt: string }

export type Request =
  | { type: "AUTH_STATUS" }
  | { type: "LOGIN" }
  | { type: "LOGOUT" }
  | { type: "ACCOUNT" }
  | { type: "START_CAMPAIGN"; campaign: CampaignPayload }
  | { type: "PARSE_SHEET"; spreadsheet: string; range: string }
  | { type: "FETCH_ATTACHMENT"; url: string }

export type ResponseData = {
  AUTH_STATUS: { signedIn: boolean }
  LOGIN: { signedIn: true }
  LOGOUT: { signedIn: false }
  ACCOUNT: Account
  START_CAMPAIGN: CampaignCreated
  PARSE_SHEET: { emails: string[] }
  FETCH_ATTACHMENT: { content: string; mimetype: string; size: number }
}

/** Machine-readable error codes shown to the user as specific messages */
export type ErrorCode =
  | "unauthorized" // not signed in or session expired
  | "reauth_required" // Google access revoked
  | "no_subscription"
  | "paid_plan_required" // a feature the trial does not include
  | "validation"
  | "missing_scopes"
  | "access_denied"
  | "google_account_mismatch" // another Google account is bound to the user
  | "google_account_taken" // the Google account is bound to another user
  | "signin_failed" // the sign-in page could not be loaded
  | "network"
  | "unknown"

export type RemoteError = { code: ErrorCode; message: string }

export type Response<T extends Request["type"]> =
  | { ok: true; data: ResponseData[T] }
  | { ok: false; error: RemoteError }

export class ExtensionError extends Error {
  constructor(
    public code: ErrorCode,
    message: string
  ) {
    super(message)
  }
}

/** Sends a request to the background worker and unwraps the response */
export async function send<T extends Request["type"]>(
  request: Extract<Request, { type: T }>
): Promise<ResponseData[T]> {
  let res: Response<T> | undefined
  try {
    res = await chrome.runtime.sendMessage(request)
  } catch (e) {
    // the extension was reloaded or updated while Gmail stayed open
    throw new ExtensionError("unknown", String(e))
  }
  if (!res) throw new ExtensionError("unknown", "No response from background")
  if ("error" in res) throw new ExtensionError(res.error.code, res.error.message)
  return res.data
}
