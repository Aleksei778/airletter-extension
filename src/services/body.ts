// Turns the compose body into what the backend sends: rich Gmail formatting,
// an HTML template pasted as code, or plain text.

import { send, type AttachmentPayload } from "~src/lib/messages"

import type { Draft } from "./gmail"

/** auto: HTML code if the body looks like it, Gmail formatting otherwise */
export type BodyMode = "auto" | "rich" | "code" | "text"

export type Body = { body: string; format: "html" | "text"; inline: AttachmentPayload[] }

/**
 * Pasted HTML templates show up in the compose box as text. They start with a
 * doctype or <html>, or are mostly markup: at least a few tags and the text
 * itself begins with one.
 */
export function looksLikeHtmlCode(text: string): boolean {
  const s = text.trim()
  if (/^<!doctype\s+html|^<html[\s>]/i.test(s)) return true
  if (!s.startsWith("<")) return false
  const tags = s.match(/<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>/gi) ?? []
  return tags.length >= 3 && /<\/[a-z][a-z0-9-]*>\s*$/i.test(s)
}

export function resolveMode(mode: BodyMode, draft: Draft): Exclude<BodyMode, "auto"> {
  if (mode !== "auto") return mode
  return looksLikeHtmlCode(draft.text) ? "code" : "rich"
}

/**
 * Builds the body for the chosen mode. Images pasted into the compose box
 * point at Gmail's own URLs that recipients cannot open, so in rich mode they
 * are downloaded and attached inline (cid:) instead. `budget` is how many
 * bytes the images may take together.
 */
export async function buildBody(mode: Exclude<BodyMode, "auto">, draft: Draft, budget: number): Promise<Body> {
  if (mode === "text") return { body: draft.text, format: "text", inline: [] }
  if (mode === "code") return { body: draft.text, format: "html", inline: [] }

  const doc = new DOMParser().parseFromString(`<body>${draft.html}</body>`, "text/html")
  const inline: AttachmentPayload[] = []
  let total = 0
  const seen = new Map<string, string>()

  for (const img of doc.querySelectorAll("img")) {
    const src = img.getAttribute("src") ?? ""
    if (!needsInlining(src)) continue

    let cid = seen.get(src)
    if (!cid) {
      const file = await loadImage(src)
      // an expired Gmail session answers with a login page, not the image
      if (!file.mimetype.startsWith("image/")) continue
      total += file.size
      if (total > budget) throw new InlineTooLarge()
      cid = `img-${inline.length + 1}@airletter`
      inline.push({
        filename: `image-${inline.length + 1}.${extension(file.mimetype)}`,
        mimetype: file.mimetype,
        content: file.content,
        content_id: cid
      })
      seen.set(src, cid)
    }
    img.setAttribute("src", `cid:${cid}`)
    // Gmail keeps the original URL in data-surl; it would leak into the email
    img.removeAttribute("data-surl")
  }

  return { body: doc.body.innerHTML, format: "html", inline }
}

export class InlineTooLarge extends Error {}

/** Images only Gmail (or this tab) can open; public https images stay links */
function needsInlining(src: string): boolean {
  if (src.startsWith("data:image/") || src.startsWith("blob:")) return true
  try {
    const u = new URL(src)
    return u.protocol === "https:" && /(^|\.)(mail\.google\.com|googleusercontent\.com)$/.test(u.hostname)
  } catch {
    return false
  }
}

type Loaded = { content: string; mimetype: string; size: number }

async function loadImage(src: string): Promise<Loaded> {
  if (src.startsWith("data:")) {
    const [, mimetype = "image/png", content = ""] = src.match(/^data:([^;,]+)?;base64,(.*)$/s) ?? []
    return { content, mimetype, size: Math.floor((content.length * 3) / 4) }
  }
  if (src.startsWith("blob:")) {
    // blob URLs belong to the Gmail tab, the background cannot open them
    const blob = await (await fetch(src)).blob()
    const bytes = new Uint8Array(await blob.arrayBuffer())
    return { content: toBase64(bytes), mimetype: blob.type || "image/png", size: bytes.length }
  }
  return send({ type: "FETCH_ATTACHMENT", url: src })
}

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function extension(mimetype: string): string {
  const sub = mimetype.split("/")[1]?.split("+")[0] ?? "png"
  return sub === "jpeg" ? "jpg" : sub
}
