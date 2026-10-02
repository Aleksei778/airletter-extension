import React from "react"

import { t } from "~src/lib/i18n"
import type { BodyMode } from "~src/services/body"
import { CodeIcon } from "~src/ui/icons"
import { usePopover } from "~src/ui/usePopover"

type Props = {
  value: BodyMode
  onChange: (value: BodyMode) => void
  /** whether the current body looks like HTML code, asked when the popover opens */
  detectCode: () => boolean
}

const MODES: BodyMode[] = ["auto", "rich", "code", "text"]

/** "</>" button next to Airletter: how the body is sent */
export function FormatPopover({ value, onChange, detectCode }: Props) {
  const { ref, open, toggle } = usePopover<HTMLDivElement>()
  const showDetected = open && value === "auto" && detectCode()

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className={`al-round-btn ${value !== "auto" ? "is-set" : ""}`}
        aria-expanded={open}
        aria-label={t.format.button}
        title={`${t.format.button}: ${t.format.modes[value][0]}`}
        onClick={toggle}>
        <CodeIcon />
      </button>

      {open && (
        <div className="al-root al-panel al-popover up" role="dialog" aria-label={t.format.title}>
          <p className="al-title">{t.format.title}</p>

          <div className="al-options" role="radiogroup" aria-label={t.format.title}>
            {MODES.map((mode) => {
              const [label, hint] = t.format.modes[mode]
              return (
                <button
                  key={mode}
                  role="radio"
                  aria-checked={value === mode}
                  className="al-option"
                  onClick={() => onChange(mode)}>
                  <span className="al-radio" aria-hidden="true" />
                  <span>
                    <span className="al-option-label">{label}</span>
                    <span className="al-option-hint">{hint}</span>
                  </span>
                </button>
              )
            })}
          </div>

          {showDetected && (
            <>
              <hr className="al-divider" />
              <p className="al-text">{t.format.detected}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
