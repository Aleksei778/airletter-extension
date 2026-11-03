import React, { useState } from "react"

import { formatDateTime, t } from "~src/lib/i18n"
import { TIMEZONES } from "~src/lib/timezones"
import type { Schedule } from "~src/types"
import { ClockIcon } from "~src/ui/icons"
import { usePopover } from "~src/ui/usePopover"

type Props = {
  value: Schedule
  onChange: (value: Schedule) => void
  // pause between emails, seconds
  pause: number
  onPauseChange: (seconds: number) => void
}

/** Clock button next to Airletter with a date/time/timezone popover and the pause between emails */
export function SchedulePopover({ value, onChange, pause, onPauseChange }: Props) {
  const { ref, open, toggle } = usePopover<HTMLDivElement>()
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const isSet = Boolean(value.date && value.time)
  const set = (patch: Partial<Schedule>) => onChange({ ...value, ...patch })

  const preview = isSet ? previewLocal(value) : null

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className={`al-round-btn ${isSet ? "is-set" : ""}`}
        aria-expanded={open}
        aria-label={t.schedule.button}
        title={isSet && preview ? t.schedule.at(preview) : t.schedule.button}
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

          <p className="al-text" style={{ marginTop: 14 }}>
            {preview ? t.schedule.at(preview) : t.schedule.now}
          </p>
          {(value.date || value.time) && (
            <button className="al-link" style={{ marginTop: 12 }} onClick={() => set({ date: "", time: "" })}>
              {t.schedule.clear}
            </button>
          )}

          <hr className="al-divider" />
          <PauseField seconds={pause} onChange={onPauseChange} />
        </div>
      )}
    </div>
  )
}

type Unit = "s" | "m"
const UNIT_SECONDS: Record<Unit, number> = { s: 1, m: 60 }

/** Pause between emails as a number and a unit; whole minutes are shown in minutes */
function PauseField({ seconds, onChange }: { seconds: number; onChange: (seconds: number) => void }) {
  const [unit, setUnit] = useState<Unit>(seconds >= 60 && seconds % 60 === 0 ? "m" : "s")
  // kept as typed, so the field can be cleared while editing
  const [amount, setAmount] = useState(Number.isNaN(seconds) ? "" : String(seconds / UNIT_SECONDS[unit]))

  const update = (nextAmount: string, nextUnit: Unit) => {
    setAmount(nextAmount)
    setUnit(nextUnit)
    const n = Number(nextAmount)
    onChange(nextAmount.trim() === "" || !Number.isFinite(n) ? NaN : Math.round(n * UNIT_SECONDS[nextUnit]))
  }

  return (
    <div className="al-field" style={{ marginTop: 0 }}>
      <span className="al-label">{t.schedule.pause}</span>
      <div className="al-row">
        <input
          className="al-input"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          aria-label={t.schedule.pause}
          value={amount}
          onChange={(e) => update(e.target.value, unit)}
        />
        <select className="al-input" value={unit} onChange={(e) => update(amount, e.target.value as Unit)}>
          <option value="s">{t.schedule.seconds}</option>
          <option value="m">{t.schedule.minutes}</option>
        </select>
      </div>
      <p className="al-small" style={{ margin: "6px 0 0" }}>
        {t.schedule.pauseRange}
      </p>
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
