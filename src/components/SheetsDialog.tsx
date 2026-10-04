import React, { useEffect, useRef, useState } from "react"

import { t } from "~src/lib/i18n"
import { CloseIcon } from "~src/ui/icons"

type Props = {
  onSubmit: (spreadsheet: string, range: string) => Promise<void>
  onClose: () => void
}

export function SheetsDialog({ onSubmit, onClose }: Props) {
  const [spreadsheet, setSpreadsheet] = useState("")
  const [sheet, setSheet] = useState("")
  const [range, setRange] = useState("A2:A")
  const [busy, setBusy] = useState(false)
  const first = useRef<HTMLInputElement>(null)

  useEffect(() => {
    first.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    // without a sheet name Google reads the first sheet
    const fullRange = sheet.trim() ? `'${sheet.trim().replace(/'/g, "''")}'!${range}` : range
    await onSubmit(spreadsheet.trim(), fullRange)
    setBusy(false)
  }

  return (
    <div className="al-root al-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="al-panel al-dialog" role="dialog" aria-modal="true" aria-label={t.sheets.title} onSubmit={submit}>
        <button type="button" className="al-close" onClick={onClose} aria-label={t.close}>
          <CloseIcon />
        </button>

        <h2 className="al-display" style={{ maxWidth: "12ch" }}>
          {t.sheets.title}
        </h2>
        <p className="al-text" style={{ marginTop: 14 }}>
          {t.sheets.text}
        </p>

        <label className="al-field" style={{ marginTop: 24 }}>
          <span className="al-label">{t.sheets.link}</span>
          <input
            ref={first}
            className="al-input"
            required
            value={spreadsheet}
            onChange={(e) => setSpreadsheet(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/…"
          />
        </label>

        <div className="al-row">
          <label className="al-field">
            <span className="al-label">{t.sheets.sheet}</span>
            <input className="al-input" value={sheet} onChange={(e) => setSheet(e.target.value)} placeholder="Sheet1" />
          </label>
          <label className="al-field">
            <span className="al-label">{t.sheets.range}</span>
            <input className="al-input" required value={range} onChange={(e) => setRange(e.target.value)} />
          </label>
        </div>

        <button className="al-btn" type="submit" disabled={busy} style={{ marginTop: 28 }}>
          {busy ? t.sheets.loading : t.sheets.submit}
        </button>
      </form>
    </div>
  )
}
