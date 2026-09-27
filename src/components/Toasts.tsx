import React, { useEffect, useState } from "react"

import { subscribe, type Toast } from "~src/lib/bus"
import { send } from "~src/lib/messages"

type Item = Toast & { id: number }

const TTL_MS = 6000

/** Renders toasts emitted by any Airletter UI on the page */
export function Toasts() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(
    () =>
      subscribe((e) => {
        if (e.type !== "TOAST") return
        const item = { ...e.toast, id: Date.now() + Math.random() }
        setItems((prev) => [...prev.slice(-2), item])
        setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== item.id)), TTL_MS)
      }),
    []
  )

  const act = (item: Item) => {
    if (item.action?.href) window.open(item.action.href, "_blank")
    if (item.action?.login) send({ type: "LOGIN" }).catch(() => {})
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 2147483647, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 18px", borderRadius: 12, background: "#111", color: "#fff", fontSize: 14 }}>
          <span>{item.text}</span>
          {item.action && (
            <button onClick={() => act(item)} style={{ background: "none", border: "none", color: "#fff", textDecoration: "underline", cursor: "pointer" }}>
              {item.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
