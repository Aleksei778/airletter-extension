import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"
import React, { useEffect, useState } from "react"

import { ProfileButton } from "~src/components/ProfileButton"
import { SheetsModalWindow } from "~src/components/SheetsModalWindow"
import { SpreadsheetsButton } from "~src/components/SpreadsheetsButton"
import { Toasts } from "~src/components/Toasts"
import { WebsiteButton } from "~src/components/WebsiteButton"
import { subscribe, toast } from "~src/lib/bus"
import { showError } from "~src/lib/errors"
import { send } from "~src/lib/messages"
import { addListChip, findComposeWindows, openComposeWindow } from "~src/services/gmail"
import { newListId, saveList } from "~src/services/lists"

export const config: PlasmoCSConfig = {
  matches: ["https://mail.google.com/*"]
}

/** Toolbar next to Gmail's search */
export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
  new Promise<Element>((resolve, reject) => {
    const started = Date.now()
    const check = () => {
      const anchor = document.querySelector(".zo") ?? document.querySelector('[role="toolbar"]') ?? document.querySelector(".btC")
      if (anchor) resolve(anchor)
      else if (Date.now() - started > 15000) reject(new Error("Gmail toolbar not found"))
      else setTimeout(check, 200)
    }
    check()
  })

export default function GmailToolbar() {
  const [showSheets, setShowSheets] = useState(false)

  useEffect(() => subscribe((e) => e.type === "OPEN_SHEETS_MODAL" && setShowSheets(true)), [])

  const importSheet = async (spreadsheet: string, range: string) => {
    try {
      const { emails } = await send({ type: "PARSE_SHEET", spreadsheet, range })

      const compose = findComposeWindows()[0] ?? (await openComposeWindow())
      if (!compose) {
        toast({ kind: "error", text: "Open a new email and try again." })
        return
      }

      const id = newListId()
      await saveList(id, { spreadsheet, emails })
      addListChip(compose, id, emails.length)
      toast({ kind: "success", text: `${emails.length} recipients added from the sheet.` })
      setShowSheets(false)
    } catch (e) {
      showError(e)
    }
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
        <ProfileButton />
        <SpreadsheetsButton />
        <WebsiteButton />
      </div>

      {showSheets && <SheetsModalWindow onSubmit={importSheet} onClose={() => setShowSheets(false)} />}
      <Toasts />
    </>
  )
}
