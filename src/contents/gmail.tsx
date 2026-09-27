import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo"
import React, { useEffect, useRef, useState } from "react"
import { MoreVertical } from "lucide-react"

import { AirletterButton } from "~src/components/AirletterButton"
import { GMAIL_SELECTORS } from "~src/utils/constants"
import { gmailService } from "~src/services/gmail"
import { findParentComposeWindow } from "~src/utils/helpers"
import { CampaignDropdown } from "~src/components/CampaignDropdown"
import { subscribe } from "~src/contents/message-bus"
import { toast } from "sonner";
import type { AttachmentDataToParse, EmailData, AttachmentDataParsed, CampaignData } from "~src/types";

export const config: PlasmoCSConfig = {
    matches: ["https://mail.google.com/*"],
    all_frames: true,
}

async function saveCampaignTime(v: boolean): Promise<void> {
    if (!v) {

    }
}

export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () => { 
    const anchors: Element[] = []

    const composeWindows = document.querySelectorAll(GMAIL_SELECTORS.COMPOSE_WINDOW)

    composeWindows.forEach((window) => {
        const sendButton = window.querySelector(GMAIL_SELECTORS.SEND_BUTTON)

        if (sendButton) {
            const anchor = sendButton.closest('.gU.Up')
            if (anchor) {
                anchor.setAttribute('data-airletter-compose-id', window.getAttribute('data-compose-id') || '')
                anchors.push(anchor)
            }
        }
    })
    
    return anchors.map(element => ({
        element,
        insertPosition: "afterend" as const
    }))
}

export default function AirletterInline() {
    const [showCampaign, setShowCampaign] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [showSheets, setShowSheets] = useState(false)
    const [isDotsHovered, setIsDotsHovered] = useState(false)

    useEffect(() => {
    subscribe((type) => {
        if (type === "OPEN_SHEETS_MODAL") {
        setShowSheets(true)
        }
    })
    }, [])

    useEffect(() => {
      const handler = (event: MessageEvent) => {
        if (event.source !== window) return
        if (event.data?.source !== "airletter") return

        if (event.data.type === "OPEN_SHEETS_MODAL") {
          setShowSheets(true)
        }
      }

      window.addEventListener("message", handler)
      return () => window.removeEventListener("message", handler)
    }, [])

    const handleClick = async () => {
        if (!containerRef.current) return

        let composeWindow = await findParentComposeWindow(containerRef.current)

        if (!composeWindow) {
            const allComposeWindows = document.querySelectorAll('.AD, .M9')

            for (const window of allComposeWindows) {
                if (window.contains(containerRef.current)) {
                    composeWindow = window as HTMLElement
                    break
                }
            }
        }

        if (!composeWindow) {
            const composeId = containerRef.current.closest('.gU.Up')?.getAttribute('data-airletter-compose-id')

            if (composeId) {
                composeWindow = document.querySelector(`[data-compose-id="${composeId}"]`)
            }
        }

        if (!composeWindow) {
            console.error("[Airletter] Compose window not found!")
            console.log("[Airletter] Container:", containerRef.current)
            console.log("[Airletter] All compose windows:", document.querySelectorAll('.AD, .M9'))
            toast.error("Cannot find compose window. Please try again.")

            return
        }

        const emailData: EmailData = await gmailService.getEmailDataFromGmailMessagesWindow(composeWindow)
        const attachments: AttachmentDataToParse[] = await gmailService.getFilesFromGmailMessageWindow(composeWindow)

        const files: AttachmentDataParsed[] = await Promise.all(
            attachments.map(async (attachment) => {
                const response = await chrome.runtime.sendMessage({
                    type: 'FETCH_ATTACHMENT',
                    attachmentUrl: attachment.url,
                });

                if (!response.success) {
                    throw new Error(`Failed to fetch attachment: ${response.error}`);
                }

                return {
                    filename: attachment.filename,
                    content: response.data,
                    mimetype: response.mimeType || 'application/octet-stream',
                    size: response.size || 0
                };
            })
        )

        const campaignData: CampaignData = {
            ...emailData,
            files
        }

        const response = await chrome.runtime.sendMessage({
            type: 'START_CAMPAIGN',
            campaignData: campaignData,
        })

        if (!response.success) {
            toast.error("Try again please.")
        }
    }

    return (
      <div
        ref={containerRef}
        style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}
      >
        <AirletterButton onClick={handleClick} />

        <button
          style={{
            padding: '8px',
            backgroundColor: isDotsHovered ? '#F3F4F6' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
          onClick={() => setShowCampaign(v => !v)}
          onMouseEnter={() => setIsDotsHovered(true)}
          onMouseLeave={() => setIsDotsHovered(false)}
          title="Schedule campaign"
        >
          <MoreVertical size={20} color="#4B5563" strokeWidth={2} />
        </button>

        <CampaignDropdown isVisible={showCampaign} />
      </div>
    )
}