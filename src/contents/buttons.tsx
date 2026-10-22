import { styles as styleText } from "~src/ui/styles"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState } from "react"

import { AccountDialog } from "~src/components/AccountDialog"
import { SheetsDialog } from "~src/components/SheetsDialog"
import { Toasts } from "~src/components/Toasts"
import { emit, subscribe, toast } from "~src/lib/bus"
import { showError } from "~src/lib/errors"
import { locale, t } from "~src/lib/i18n"
import { ExtensionError, send } from "~src/lib/messages"
import {
  addListChip,
  findComposeButton,
  findComposeWindows,
  findToolbarAnchor,
  openComposeWindow
} from "~src/services/gmail"
import { newListId, saveList } from "~src/services/lists"
import { injectFonts } from "~src/ui/fonts"
import { ArrowIcon, PlaneMark, SheetIcon } from "~src/ui/icons"

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

/** Toolbar under Gmail's "Compose" button */
export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
  new Promise<{ element: Element; insertPosition: "afterend" }>((resolve, reject) => {
    const started = Date.now()
    const check = () => {
      const element = findToolbarAnchor()
      if (element) resolve({ element, insertPosition: "afterend" })
      else if (Date.now() - started > 15000) reject(new Error("Gmail compose button not found"))
      else setTimeout(check, 200)
    }
    check()
  })

export default function Toolbar() {
  const [showSheets, setShowSheets] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const width = useComposeWidth()
  // the sidebar collapsed to icons: so do we
  const compact = width > 0 && width < 120

  useEffect(() => subscribe((e) => e.type === "OPEN_SHEETS_MODAL" && setShowSheets(true)), [])

  const openSheets = async () => {
    // the backend refuses the import on the trial anyway; say so before the
    // user fills in the form. Unknown plan (signed out, offline): show the form.
    const plan = await send({ type: "ACCOUNT" }).then((a) => a.plan, () => undefined)
    if (plan === null) return showError(new ExtensionError("no_subscription", "no plan"))
    if (plan === "trial") return showError(new ExtensionError("paid_plan_required", "trial"))
    emit({ type: "OPEN_SHEETS_MODAL" })
  }

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
    <div
      className={`al-root al-toolbar${compact ? " compact" : ""}`}
      lang={locale}
      style={width && !compact ? { width } : undefined}>
      <button className="al-tool-btn" title={t.sheets.button} aria-label={t.sheets.button} onClick={openSheets}>
        <span className="al-tool-icon">
          <SheetIcon />
        </span>
        {!compact && <span className="al-tool-label">{t.sheets.short}</span>}
        {!compact && <ArrowIcon className="al-tool-arrow" />}
      </button>

      <button
        className="al-tool-btn dark"
        title={t.account.button}
        aria-label={t.account.button}
        aria-haspopup="dialog"
        onClick={() => setShowAccount(true)}>
        <span className="al-tool-icon">
          <PlaneMark />
        </span>
        {!compact && <span className="al-tool-label">{t.account.short}</span>}
        {!compact && <ArrowIcon className="al-tool-arrow" />}
      </button>

      {showAccount && <AccountDialog onClose={() => setShowAccount(false)} />}
      {showSheets && <SheetsDialog onSubmit={importSheet} onClose={() => setShowSheets(false)} />}
      <Toasts />
    </div>
  )
}

/** Width of Gmail's "Compose" button, followed as the sidebar expands and collapses */
function useComposeWidth() {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const button = findComposeButton()
    if (!button) return
    const observer = new ResizeObserver(() => setWidth(button.offsetWidth))
    observer.observe(button)
    return () => observer.disconnect()
  }, [])
  return width
}
