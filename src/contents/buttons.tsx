import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";

import { ProfileButton } from "~src/components/ProfileButton";
import { SpreadsheetsButton } from "~src/components/SpreadsheetsButton";
import { WebsiteButton } from "~src/components/WebsiteButton";
import { SheetsModalWindow } from "~src/components/SheetsModalWindow";
import { gmailService } from "~src/services/gmail";
import { storageService } from "~src/services/storage";
import { generateShortId } from "~src/utils/helpers";

export const config: PlasmoCSConfig = {
    matches: ["https://mail.google.com/*"],
}

export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
    return new Promise<Element>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Anchor element not found"))
        }, 10000)

        const checkElement = () => {
            const anchor = document.querySelector(".zo") ||
              document.querySelector('[role="toolbar"]') ||
              document.querySelector('.btC')

            if (anchor) {
              clearTimeout(timeout)
              resolve(anchor as Element)
            } else {
                setTimeout(checkElement, 100)
            }
        }

        checkElement()
    })
}

export default function GmailButtons() {
    const [showSheets, setShowSheets] = useState(false)

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.source !== window) return
            if (event.data?.source !== "airletter") return

            if (event.data.type === "OPEN_SHEETS_MODAL") {
                console.log("Opening sheets modal") 
                setShowSheets(true)
            }
        }

        window.addEventListener("message", handler)
        return () => window.removeEventListener("message", handler)
    }, [])

    const handleSheetsSubmit = async (spreadsheetId: string, range: string) => {
        try {
            let composeWindows = await gmailService.findComposeWindows()
            
            if (composeWindows.length === 0) {
                console.log("No compose window found, opening new one")
                await gmailService.openComposeWindow()
                await new Promise(resolve => setTimeout(resolve, 500))
                composeWindows = await gmailService.findComposeWindows()
            }

            const composeWindow = composeWindows[0]
            if (!composeWindow) {
                console.error("Could not find or create compose window")
                return
            }

            const response = await chrome.runtime.sendMessage({
                type: 'GET_EMAILS',
                spreadsheetId: spreadsheetId,
                range: range,
            })

            if (!response.success) {
                toast.error("Try again please")
                return
            }

            const generatedId = await generateShortId();

            await gmailService.addEmailChip(
                generatedId,
                response.data.emails.length,
                composeWindow
            )

            await storageService.setParsedEmails({
                id: generatedId,
                spreadsheetId: spreadsheetId,
                emails: response.data.emails,
            })

            setShowSheets(false)
        } catch (error) {
            console.error("Error in handleSheetsSubmit:", error)
            toast.error("Try again please")
        }
    }

    return (
        <>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '8px',
                alignItems: 'center'
            }}>
                <ProfileButton />
                <SpreadsheetsButton />
                <WebsiteButton />
            </div>

            {showSheets && (
                <SheetsModalWindow
                    onSubmit={handleSheetsSubmit}
                    onClose={() => setShowSheets(false)}
                />
            )}
        </>
    )
}