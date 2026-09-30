import { styles as styleText } from "~src/ui/styles"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState } from "react"

import { AccountCard } from "~src/components/AccountCard"
import { SheetsDialog } from "~src/components/SheetsDialog"
import { Toasts } from "~src/components/Toasts"
import { emit, subscribe, toast } from "~src/lib/bus"
import { showError } from "~src/lib/errors"
import { locale, t } from "~src/lib/i18n"
import { send } from "~src/lib/messages"
import { addListChip, findComposeWindows, findToolbarAnchor, openComposeWindow } from "~src/services/gmail"
import { newListId, saveList } from "~src/services/lists"
import { injectFonts } from "~src/ui/fonts"
import { PlaneMark, SheetIcon } from "~src/ui/icons"
import { usePopover } from "~src/ui/usePopover"

export const config: PlasmoCSConfig = {
  matches: ["https://mail.google.com/*"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

// the toolbar is mounted once per Gmail tab: declare the fonts for all Airletter UIs here
injectFonts()

/** Toolbar next to Gmail's search */
export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
  new Promise<Element>((resolve, reject) => {
    const started = Date.now()
    const check = () => {
      const anchor = findToolbarAnchor()
      if (anchor) resolve(anchor)
      else if (Date.now() - started > 15000) reject(new Error("Gmail toolbar not found"))
      else setTimeout(check, 200)
    }
    check()
  })

export default function Toolbar() {
  const [showSheets, setShowSheets] = useState(false)
  const account = usePopover<HTMLDivElement>()

  useEffect(() => subscribe((e) => e.type === "OPEN_SHEETS_MODAL" && setShowSheets(true)), [])

  const importSheet = async (spreadsheet: string, range: string) => {
    try {
      const { emails } = await send({ type: "PARSE_SHEET", spreadsheet, range })

      const compose = findComposeWindows()[0] ?? (await openComposeWindow())
      if (!compose) return toast({ kind: "error", text: t.compose.noCompose })

      const id = newListId()
      await saveList(id, { spreadsheet, emails })
      addListChip(compose, id, emails.length)
      toast({ kind: "success", text: t.sheets.added(emails.length) })
      setShowSheets(false)
    } catch (e) {
      showError(e)
    }
  }

  return (
    <div className="al-root" lang={locale} style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
      <button
        className="al-round-btn"
        title={t.sheets.button}
        aria-label={t.sheets.button}
        onClick={() => emit({ type: "OPEN_SHEETS_MODAL" })}>
        <SheetIcon />
      </button>

      <div ref={account.ref} style={{ position: "relative" }}>
        <button
          className="al-mark-btn"
          title={t.account.button}
          aria-label={t.account.button}
          aria-expanded={account.open}
          onClick={account.toggle}>
          <PlaneMark />
        </button>
        {account.open && (
          <div className="al-root al-panel al-popover down">
            <AccountCard />
          </div>
        )}
      </div>

      {showSheets && <SheetsDialog onSubmit={importSheet} onClose={() => setShowSheets(false)} />}
      <Toasts />
    </div>
  )
}
