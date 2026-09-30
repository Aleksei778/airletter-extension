import React, { useCallback, useEffect, useState } from "react"

import { siteLink } from "~src/lib/config"
import { showError } from "~src/lib/errors"
import { t } from "~src/lib/i18n"
import { ExtensionError, send, type Account } from "~src/lib/messages"
import { ArrowIcon } from "~src/ui/icons"

type State = { kind: "loading" } | { kind: "signedOut" } | { kind: "ready"; account: Account }

/** Sign-in state, plan and today's usage; used in the Gmail toolbar and the popup */
export function AccountCard({ onError = showError }: { onError?: (e: unknown) => void }) {
  const [state, setState] = useState<State>({ kind: "loading" })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const { signedIn } = await send({ type: "AUTH_STATUS" })
      if (!signedIn) return setState({ kind: "signedOut" })
      setState({ kind: "ready", account: await send({ type: "ACCOUNT" }) })
    } catch (e) {
      if (e instanceof ExtensionError && e.code === "unauthorized") return setState({ kind: "signedOut" })
      setState({ kind: "signedOut" })
      onError(e)
    }
  }, [onError])

  useEffect(() => {
    load()
  }, [load])

  const run = (fn: () => Promise<unknown>) => async () => {
    setBusy(true)
    try {
      await fn()
      await load()
    } catch (e) {
      onError(e)
    } finally {
      setBusy(false)
    }
  }

  if (state.kind === "loading") {
    return <span className="al-pulse" style={{ color: "#fff" }} />
  }

  if (state.kind === "signedOut") {
    return (
      <div>
        <p className="al-display">{t.account.signInTitle}</p>
        <p className="al-text" style={{ marginTop: 12 }}>
          {t.account.signInText}
        </p>
        <button className="al-btn" style={{ marginTop: 22 }} disabled={busy} onClick={run(() => send({ type: "LOGIN" }))}>
          {t.account.signIn} <ArrowIcon />
        </button>
      </div>
    )
  }

  const a = state.account
  const usage = a.dailyLimit ? Math.min(a.sentToday / a.dailyLimit, 1) : 0

  return (
    <div>
      <p className="al-title">{a.firstName || a.email}</p>
      <p className="al-small" style={{ marginTop: 4 }}>
        {a.email}
      </p>

      <hr className="al-divider" />

      <p className="al-small">{t.account.plan}</p>
      <p style={{ margin: "4px 0 0", fontSize: 15 }}>
        {a.plan ? t.account.plans[a.plan] : t.account.noPlan}
        {a.planEndsAt && (
          <span className="al-small">
            {" "}
            · {t.account.until} {new Date(a.planEndsAt).toLocaleDateString()}
          </span>
        )}
      </p>

      {a.plan && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }} className="al-small">
            <span>{t.account.today}</span>
            <span>
              {a.sentToday} {t.account.of} {a.dailyLimit}
            </span>
          </div>
          <div className="al-meter">
            <div style={{ width: `${usage * 100}%` }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
        <a className="al-btn" href={siteLink("/dashboard")} target="_blank" rel="noopener">
          {t.account.dashboard} <ArrowIcon />
        </a>
        {!a.plan && (
          <a className="al-btn al-btn-ghost" href={siteLink("/dashboard#upgrade")} target="_blank" rel="noopener">
            {t.account.pricing}
          </a>
        )}
      </div>
      <button className="al-link" style={{ marginTop: 16 }} disabled={busy} onClick={run(() => send({ type: "LOGOUT" }))}>
        {t.account.signOut}
      </button>
    </div>
  )
}
