import React, { useEffect, useState } from "react"

import { subscribe, type Toast } from "~src/lib/bus"
import { showError } from "~src/lib/errors"
import { send } from "~src/lib/messages"

type Item = Toast & { id: number }

const TTL_MS = 7000

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
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    if (item.action?.href) window.open(item.action.href, "_blank", "noopener")
    if (item.action?.login) send({ type: "LOGIN" }).catch(showError)
  }

  return (
    <div className="al-root al-toasts" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`al-toast ${item.kind}`}>
          <span className="dot" />
          <span>{item.text}</span>
          {item.action && <button onClick={() => act(item)}>{item.action.label}</button>}
        </div>
      ))}
    </div>
  )
}
