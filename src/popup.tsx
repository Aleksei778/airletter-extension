import { styles as styleText } from "~src/ui/styles"
import React from "react"

import { AccountCard } from "~src/components/AccountCard"
import { t } from "~src/lib/i18n"
import { injectFonts } from "~src/ui/fonts"
import { PlaneMark } from "~src/ui/icons"

injectFonts()

// errors in the popup are shown inline by AccountCard's state; no toasts here
const ignore = (e: unknown) => console.error("[Airletter]", e)

export default function Popup() {
  return (
    <div className="al-root" style={{ width: 340, padding: 24, background: "#000", color: "#fff" }}>
      <style>{styleText + "body{margin:0;background:#000}"}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26 }}>
        <PlaneMark className="popup-mark" />
        <span style={{ fontFamily: "var(--head)", fontWeight: 500, fontSize: 15, letterSpacing: "-0.02em" }}>airletter</span>
      </div>

      <AccountCard onError={ignore} />

      <hr className="al-divider" style={{ margin: "22px 0 14px" }} />
      <a className="al-link" href="https://mail.google.com/" target="_blank" rel="noopener">
        {t.account.openGmail}
      </a>
      <style>{".popup-mark{width:18px;height:18px}"}</style>
    </div>
  )
}
