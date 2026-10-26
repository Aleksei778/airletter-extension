import { styles as styleText } from "~src/ui/styles"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor, PlasmoGetStyle } from "plasmo"
import React, { useEffect, useState } from "react"

import { AccountDialog } from "~src/components/AccountDialog"
import { SheetsDialog } from "~src/components/SheetsDialog"
import { Toasts } from "~src/components/Toasts"
import { toast } from "~src/lib/bus"
import { showError } from "~src/lib/errors"
import { locale, t } from "~src/lib/i18n"
import { ExtensionError, send, type PickerEvent } from "~src/lib/messages"
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
  const [picking, setPicking] = useState(false)
  // spreadsheet chosen in Google Picker, waiting for its sheet and range
  const [picked, setPicked] = useState<{ id: string; name: string } | null>(null)
  const [showAccount, setShowAccount] = useState(false)
  const width = useComposeWidth()
  // the sidebar collapsed to icons: so do we
  const compact = width > 0 && width < 120

  // Airletter reads only spreadsheets chosen in Google Picker (drive.file), so
  // the button opens the Picker first; sheet and range are asked afterwards
  const pickSheet = async () => {
    if (picking) return
    // the backend refuses the import on the trial anyway; say so before
    // opening Google Drive. Unknown plan (signed out, offline): try anyway.
    const plan = await send({ type: "ACCOUNT" }).then((a) => a.plan, () => undefined)
    if (plan === null) return showError(new ExtensionError("no_subscription", "no plan"))
    if (plan === "trial") return showError(new ExtensionError("paid_plan_required", "trial"))

    setPicking(true)
    try {
      await send({ type: "PICK_SHEET" })
      toast({ kind: "info", text: t.sheets.picking })
      const event = await waitForPick()
      if (event.type === "SHEET_PICK_CANCELLED") return toast({ kind: "info", text: t.sheets.pickCancelled })
      setPicked({ id: event.id, name: event.name })
    } catch (e) {
      showError(e)
    } finally {
      setPicking(false)
    }
  }

  const importSheet = async (range: string) => {
    if (!picked) return
    try {
      const { emails } = await send({ type: "PARSE_SHEET", spreadsheet: picked.id, range })

      const compose = findComposeWindows()[0] ?? (await openComposeWindow())
      if (!compose) return toast({ kind: "error", text: t.compose.noCompose })

      const id = newListId()
      await saveList(id, { spreadsheet: picked.id, emails })
      addListChip(compose, id, emails.length)
      toast({ kind: "success", text: t.sheets.added(emails.length) })
      setPicked(null)
    } catch (e) {
      showError(e)
    }
  }

  return (
    <div
      className={`al-root al-toolbar${compact ? " compact" : ""}`}
      lang={locale}
      style={width && !compact ? { width } : undefined}>
      <button
        className="al-tool-btn"
        title={t.sheets.button}
        aria-label={t.sheets.button}
        onClick={pickSheet}
        disabled={picking}>
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
      {picked && <SheetsDialog fileName={picked.name} onSubmit={importSheet} onClose={() => setPicked(null)} />}
      <Toasts />
    </div>
  )
}

/** Resolves with the background's answer once the Google Picker window is done */
function waitForPick(): Promise<PickerEvent> {
  return new Promise((resolve) => {
    const listener = (msg: PickerEvent, sender: chrome.runtime.MessageSender) => {
      if (sender.id !== chrome.runtime.id) return
      if (msg?.type !== "SHEET_PICKED" && msg?.type !== "SHEET_PICK_CANCELLED") return
      chrome.runtime.onMessage.removeListener(listener)
      resolve(msg)
    }
    chrome.runtime.onMessage.addListener(listener)
  })
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
