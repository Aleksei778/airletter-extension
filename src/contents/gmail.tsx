import { MoreVertical } from "lucide-react"
import type { PlasmoCSConfig, PlasmoGetInlineAnchorList } from "plasmo"
import React, { useRef, useState } from "react"

import { AirletterButton } from "~src/components/AirletterButton"
import { CampaignDropdown } from "~src/components/CampaignDropdown"
import { toast } from "~src/lib/bus"
import { showError } from "~src/lib/errors"
import { send, type AttachmentPayload } from "~src/lib/messages"
import { findComposeWindow, GMAIL_SELECTORS, readAttachmentLinks, readDraft } from "~src/services/gmail"
import type { Schedule } from "~src/types"

export const config: PlasmoCSConfig = {
  matches: ["https://mail.google.com/*"]
}

// Gmail's own limit is 25 MB after base64 encoding
const MAX_ATTACHMENTS_BYTES = 18 * 1024 * 1024

/** One Airletter button next to "Send" in every compose window */
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
  Array.from(document.querySelectorAll(GMAIL_SELECTORS.sendButton))
    .map((btn) => btn.closest(".gU.Up"))
    .filter((el): el is Element => Boolean(el))
    .map((element) => ({ element, insertPosition: "afterend" as const }))

export default function AirletterInline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const [isDotsHovered, setIsDotsHovered] = useState(false)
  // schedule belongs to this compose window only
  const [schedule, setSchedule] = useState<Schedule>({
    date: "",
    time: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })

  const start = async () => {
    const compose = containerRef.current && findComposeWindow(containerRef.current)
    if (!compose) {
      toast({ kind: "error", text: "Could not find the compose window. Try again." })
      return
    }

    try {
      const { signedIn } = await send({ type: "AUTH_STATUS" })
      if (!signedIn) await send({ type: "LOGIN" })

      const draft = await readDraft(compose)
      if (draft.recipients.length === 0) {
        toast({ kind: "error", text: "Add recipients to the To field or import a Google Sheet." })
        return
      }
      if (!draft.subject.trim()) {
        toast({ kind: "error", text: "Add a subject." })
        return
      }
      if ((schedule.date && !schedule.time) || (!schedule.date && schedule.time)) {
        toast({ kind: "error", text: "Set both date and time, or clear them to send now." })
        return
      }

      const attachments: AttachmentPayload[] = []
      let total = 0
      for (const link of readAttachmentLinks(compose)) {
        const file = await send({ type: "FETCH_ATTACHMENT", url: link.url })
        total += file.size
        attachments.push({ filename: link.filename, mimetype: file.mimetype, content: file.content })
      }
      if (total > MAX_ATTACHMENTS_BYTES) {
        toast({ kind: "error", text: "Attachments are larger than 18 MB." })
        return
      }

      const res = await send({
        type: "START_CAMPAIGN",
        campaign: { ...draft, attachments, ...schedule }
      })

      const skipped = res.skipped.length ? ` ${res.skipped.length} invalid addresses skipped.` : ""
      const when = schedule.date
        ? `Scheduled: ${res.total} emails on ${new Date(res.scheduledAt).toLocaleString()}.`
        : `Sending ${res.total} emails.`
      toast({ kind: "success", text: when + skipped })
    } catch (e) {
      showError(e)
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}>
      <AirletterButton onClick={start} />

      <button
        style={{
          padding: "8px",
          backgroundColor: isDotsHovered ? "#F3F4F6" : "transparent",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        onClick={() => setShowSchedule((v) => !v)}
        onMouseEnter={() => setIsDotsHovered(true)}
        onMouseLeave={() => setIsDotsHovered(false)}
        title="Schedule campaign">
        <MoreVertical size={20} color="#4B5563" strokeWidth={2} />
      </button>

      <CampaignDropdown isVisible={showSchedule} value={schedule} onChange={setSchedule} />
    </div>
  )
}
