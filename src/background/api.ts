import { API_URL } from "~src/lib/config"
import {
  ExtensionError,
  type Account,
  type CampaignCreated,
  type CampaignPayload,
  type ErrorCode
} from "~src/lib/messages"

import { getAccessToken, refreshAccessToken } from "./auth"

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const call = (token: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers }
    })

  let token = (await getAccessToken()) ?? (await refreshAccessToken())
  if (!token) throw new ExtensionError("unauthorized", "Not signed in")

  let res: globalThis.Response
  try {
    res = await call(token)
    if (res.status === 401) {
      token = await refreshAccessToken()
      if (!token) throw new ExtensionError("unauthorized", "Session expired")
      res = await call(token)
    }
  } catch (e) {
    if (e instanceof ExtensionError) throw e
    throw new ExtensionError("network", String(e))
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ExtensionError(errorCode(res.status, body.code), body.error ?? res.statusText)
  }
  return res.json()
}

function errorCode(status: number, code?: string): ErrorCode {
  if (code === "reauth_required" || code === "no_subscription" || code === "paid_plan_required") return code
  if (status === 401) return "unauthorized"
  if (status === 402) return "no_subscription"
  if (status === 400 || status === 413 || status === 422) return "validation"
  return "unknown"
}

type MeResponse = { email: string; first_name: string }
type SubscriptionResponse = {
  plan: Account["plan"]
  end_at: string | null
  daily_limit: number
  sent_today: number
}

export async function account(): Promise<Account> {
  const [me, sub] = await Promise.all([
    request<MeResponse>("/me"),
    request<SubscriptionResponse>("/subscription/current")
  ])
  return {
    email: me.email,
    firstName: me.first_name,
    plan: sub.plan,
    planEndsAt: sub.end_at,
    dailyLimit: sub.daily_limit,
    sentToday: sub.sent_today
  }
}

type CreateCampaignResponse = {
  campaign: { id: number; scheduled_at: string; stats: { total: number } }
  skipped: string[]
}

export async function startCampaign(c: CampaignPayload): Promise<CampaignCreated> {
  const res = await request<CreateCampaignResponse>("/campaigns", {
    method: "POST",
    body: JSON.stringify(c)
  })
  return {
    id: res.campaign.id,
    total: res.campaign.stats.total,
    skipped: res.skipped,
    scheduledAt: res.campaign.scheduled_at
  }
}

export function parseSheet(spreadsheet: string, range: string) {
  return request<{ emails: string[] }>("/sheets/parse", {
    method: "POST",
    // the backend accepts either an ID or a full spreadsheet URL
    body: JSON.stringify({ spreadsheet_id: spreadsheet, range })
  })
}

/** Downloads an attachment of the open draft with the user's Gmail cookies */
export async function fetchAttachment(url: string) {
  const u = new URL(url)
  if (u.protocol !== "https:" || !/(^|\.)(google\.com|googleusercontent\.com)$/.test(u.hostname)) {
    throw new ExtensionError("validation", "Unexpected attachment host")
  }

  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) throw new ExtensionError("network", `Attachment download failed: ${res.status}`)

  const blob = await res.blob()
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return { content: btoa(binary), mimetype: blob.type || "application/octet-stream", size: bytes.length }
}
