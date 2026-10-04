import React from "react"

import { t } from "~src/lib/i18n"
import { PlaneMark } from "~src/ui/icons"

type Props = { busy: boolean; onClick: () => void }

/** Black pill next to Gmail's Send button */
export function AirletterButton({ busy, onClick }: Props) {
  return (
    <button className="al-send" onClick={onClick} disabled={busy} title={t.sendTitle}>
      {busy ? <span className="al-pulse" /> : <PlaneMark />}
      <span>{busy ? t.sending : t.send}</span>
    </button>
  )
}
