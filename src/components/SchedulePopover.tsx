import React from "react"

import { formatDateTime, t } from "~src/lib/i18n"
import { TIMEZONES } from "~src/lib/timezones"
import type { Schedule } from "~src/types"
import { ClockIcon } from "~src/ui/icons"
import { usePopover } from "~src/ui/usePopover"

type Props = { value: Schedule; onChange: (value: Schedule) => void }

/** Clock button next to Airletter with a date/time/timezone popover */
export function SchedulePopover({ value, onChange }: Props) {
  const { ref, open, toggle } = usePopover<HTMLDivElement>()
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const isSet = Boolean(value.date && value.time)
  const set = (patch: Partial<Schedule>) => onChange({ ...value, ...patch })

  const preview = isSet ? previewLocal(value) : null

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className={`al-icon-btn ${isSet ? "is-set" : ""}`}
        aria-expanded={open}
        aria-label={t.schedule.button}
        title={t.schedule.button}
        onClick={toggle}>
        <ClockIcon />
      </button>

      {open && (
        <div className="al-root al-panel al-popover up" role="dialog" aria-label={t.schedule.title}>
          <p className="al-title">{t.schedule.title}</p>

          <div className="al-row">
            <label className="al-field">
              <span className="al-label">{t.schedule.date}</span>
              <input className="al-input" type="date" value={value.date} onChange={(e) => set({ date: e.target.value })} />
            </label>
            <label className="al-field">
              <span className="al-label">{t.schedule.time}</span>
              <input className="al-input" type="time" value={value.time} onChange={(e) => set({ time: e.target.value })} />
            </label>
          </div>

          <label className="al-field">
            <span className="al-label">{t.schedule.timezone}</span>
            <select className="al-input" value={value.timezone} onChange={(e) => set({ timezone: e.target.value })}>
              <option value={userTz}>
                {userTz} ({t.schedule.yours})
              </option>
              {TIMEZONES.filter((tz) => tz.value !== userTz).map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </label>

          <hr className="al-divider" />
          <p className="al-text">{preview ? t.schedule.at(preview) : t.schedule.now}</p>
          {(value.date || value.time) && (
            <button className="al-link" style={{ marginTop: 12 }} onClick={() => set({ date: "", time: "" })}>
              {t.schedule.clear}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Shows the chosen moment in the user's own timezone */
function previewLocal(s: Schedule): string | null {
  // wall time in the chosen timezone -> absolute instant
  const guess = new Date(`${s.date}T${s.time}:00Z`)
  if (Number.isNaN(guess.getTime())) return null
  const inTz = new Date(guess.toLocaleString("en-US", { timeZone: s.timezone }))
  const inUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }))
  const instant = new Date(guess.getTime() - (inTz.getTime() - inUtc.getTime()))
  return formatDateTime(instant)
}
