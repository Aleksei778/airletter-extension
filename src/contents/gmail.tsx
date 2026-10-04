import { styles as styleText } from "~src/ui/styles"
import type { PlasmoCSConfig, PlasmoGetInlineAnchorList, PlasmoGetStyle } from "plasmo"
import React, { useRef, useState } from "react"

import { AirletterButton } from "~src/components/AirletterButton"
import { FormatPopover } from "~src/components/FormatPopover"
import { SchedulePopover } from "~src/components/SchedulePopover"
import { toast } from "~src/lib/bus"
import { siteLink } from "~src/lib/config"
import { showError } from "~src/lib/errors"
import { formatDateTime, locale, t } from "~src/lib/i18n"
import { send, type AttachmentPayload } from "~src/lib/messages"
import { buildBody, InlineTooLarge, type BodyMode } from "~src/services/body"
import { findComposeWindow, findSendRows, readAttachmentLinks, readDraft } from "~src/services/gmail"
import type { Schedule } from "~src/types"

export const config: PlasmoCSConfig = {
  matches: ["https://mail.google.com/*"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

// Gmail's own limit is 25 MB after base64 encoding
const MAX_ATTACHMENTS_BYTES = 18 * 1024 * 1024

/** One Airletter button next to "Send" in every compose window */
export const getInlineAnchorList: PlasmoGetInlineAnchorList = async () =>
  findSendRows().map((element) => ({ element, insertPosition: "afterend" as const }))

export default function ComposeActions() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  // the schedule belongs to this compose window only
  const [schedule, setSchedule] = useState<Schedule>({
    date: "",
    time: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })
  const [mode, setMode] = useState<BodyMode>("rich")

  const start = async () => {
    const el = containerRef.current && findComposeWindow(containerRef.current)
    if (!el) return toast({ kind: "error", text: t.compose.notFound })

    setBusy(true)
    try {
      const { signedIn } = await send({ type: "AUTH_STATUS" })
      if (!signedIn) await send({ type: "LOGIN" })

      const draft = await readDraft(el)
      if (draft.recipients.length === 0) return toast({ kind: "error", text: t.compose.noRecipients })
      if (!draft.subject.trim()) return toast({ kind: "error", text: t.compose.noSubject })
      if (Boolean(schedule.date) !== Boolean(schedule.time)) {
        return toast({ kind: "error", text: t.compose.halfSchedule })
      }

      const attachments: AttachmentPayload[] = []
      let total = 0
      for (const link of readAttachmentLinks(el)) {
        const file = await send({ type: "FETCH_ATTACHMENT", url: link.url })
        total += file.size
        if (total > MAX_ATTACHMENTS_BYTES) return toast({ kind: "error", text: t.compose.tooLarge })
        attachments.push({ filename: link.filename, mimetype: file.mimetype, content: file.content })
      }

      let body
      try {
        body = await buildBody(mode, draft, MAX_ATTACHMENTS_BYTES - total)
      } catch (e) {
        if (e instanceof InlineTooLarge) return toast({ kind: "error", text: t.compose.tooLarge })
        throw e
      }
      if (!body.body.trim()) return toast({ kind: "error", text: t.compose.emptyBody })

      const res = await send({
        type: "START_CAMPAIGN",
        campaign: {
          recipients: draft.recipients,
          subject: draft.subject,
          body: body.body,
          format: body.format,
          locale,
          attachments: [...attachments, ...body.inline],
          ...schedule
        }
      })

      const text = schedule.date
        ? t.compose.scheduled(res.total, formatDateTime(res.scheduledAt))
        : t.compose.started(res.total)
      toast({
        kind: "success",
        text: text + (res.skipped.length ? t.compose.skipped(res.skipped.length) : ""),
        action: { label: t.compose.progress, href: siteLink("/dashboard") }
      })
    } catch (e) {
      showError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div ref={containerRef} className="al-root" lang={locale} style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <AirletterButton busy={busy} onClick={start} />
      <FormatPopover value={mode} onChange={setMode} />
      <SchedulePopover value={schedule} onChange={setSchedule} />
    </div>
  )
}
