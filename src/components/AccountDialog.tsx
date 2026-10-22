import React, { useEffect } from "react"

import { AccountCard } from "~src/components/AccountCard"
import { t } from "~src/lib/i18n"
import { CloseIcon } from "~src/ui/icons"

/** The account card as a centered dialog over a dimmed page, like the Sheets import */
export function AccountDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [onClose])

  return (
    <div className="al-root al-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="al-panel al-dialog" role="dialog" aria-modal="true" aria-label={t.account.button} style={{ maxWidth: 400 }}>
        <button type="button" className="al-close" onClick={onClose} aria-label={t.close}>
          <CloseIcon />
        </button>
        <AccountCard />
      </div>
    </div>
  )
}
