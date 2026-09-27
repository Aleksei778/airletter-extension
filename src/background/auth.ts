import { API_URL } from "~src/lib/config"
import { ExtensionError, type ErrorCode } from "~src/lib/messages"

// Access token lives in session storage: kept in memory, gone when the
// browser closes and not readable by content scripts. The refresh token must
// survive restarts, so it goes to local storage. Only this worker reads them.
const ACCESS_KEY = "access_token"
const REFRESH_KEY = "refresh_token"

type TokenPair = { access_jwt_token: string; refresh_jwt_token: string }

async function saveTokens(pair: TokenPair) {
  await chrome.storage.session.set({ [ACCESS_KEY]: pair.access_jwt_token })
  await chrome.storage.local.set({ [REFRESH_KEY]: pair.refresh_jwt_token })
}

async function clearTokens() {
  await chrome.storage.session.remove(ACCESS_KEY)
  await chrome.storage.local.remove(REFRESH_KEY)
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await chrome.storage.session.get(ACCESS_KEY))[ACCESS_KEY] as string | undefined
}

async function getRefreshToken(): Promise<string | undefined> {
  return (await chrome.storage.local.get(REFRESH_KEY))[REFRESH_KEY] as string | undefined
}

export async function isSignedIn(): Promise<boolean> {
  return Boolean(await getRefreshToken())
}

/**
 * Google sign-in via the backend. The backend redirects to
 * https://<id>.chromiumapp.org/callback with a one-time code (never the JWTs),
 * which is exchanged for tokens. Our own `state` protects against a response
 * that we did not ask for.
 */
export async function login(): Promise<void> {
  const state = crypto.randomUUID()
  const url = `${API_URL}/auth/google/login?source=extension&state=${state}`

  let redirect: string | undefined
  try {
    redirect = await chrome.identity.launchWebAuthFlow({ url, interactive: true })
  } catch (e) {
    // the user closed the window
    throw new ExtensionError("access_denied", String(e))
  }
  if (!redirect) throw new ExtensionError("unknown", "No redirect from sign-in")

  const params = new URL(redirect).searchParams
  if (params.get("state") !== state) throw new ExtensionError("unknown", "State mismatch")

  const error = params.get("error")
  if (error) {
    const code: ErrorCode = error === "missing_scopes" || error === "access_denied" ? error : "unknown"
    throw new ExtensionError(code, error)
  }

  const res = await fetch(`${API_URL}/auth/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: params.get("code") })
  })
  if (!res.ok) throw new ExtensionError("unknown", `Code exchange failed: ${res.status}`)

  await saveTokens(await res.json())
}

export async function logout(): Promise<void> {
  const refresh = await getRefreshToken()
  await clearTokens()
  if (refresh) {
    // best effort: revoke the refresh token on the server
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refresh}` }
    }).catch(() => {})
  }
}

let refreshing: Promise<string | undefined> | null = null

/**
 * Gets a new access token. Concurrent callers share one request: the backend
 * rotates refresh tokens, so two parallel refreshes would sign the user out.
 */
export function refreshAccessToken(): Promise<string | undefined> {
  refreshing ??= (async () => {
    const refresh = await getRefreshToken()
    if (!refresh) return undefined

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refresh}` }
    })
    if (res.status === 401) {
      await clearTokens()
      return undefined
    }
    if (!res.ok) throw new ExtensionError("network", `Refresh failed: ${res.status}`)

    const pair: TokenPair = await res.json()
    await saveTokens(pair)
    return pair.access_jwt_token
  })().finally(() => {
    refreshing = null
  })

  return refreshing
}
