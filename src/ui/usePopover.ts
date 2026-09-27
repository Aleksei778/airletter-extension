import { useEffect, useRef, useState } from "react"

/** Open/close state for a popover that closes on outside click or Escape.
 *  Works inside shadow DOM: the click target is checked via composedPath(). */
export function usePopover<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !e.composedPath().includes(ref.current)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown, true)
    document.addEventListener("keydown", onKey, true)
    return () => {
      document.removeEventListener("mousedown", onDown, true)
      document.removeEventListener("keydown", onKey, true)
    }
  }, [open])

  return { ref, open, setOpen, toggle: () => setOpen((v) => !v) }
}
