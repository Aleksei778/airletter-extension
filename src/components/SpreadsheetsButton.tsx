import { Sheet } from "lucide-react"
import React from "react"

import { emit } from "~src/lib/bus"

export function SpreadsheetsButton() {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <button
      style={{
        padding: "10px",
        backgroundColor: isHovered ? "#EFF6FF" : "transparent",
        border: isHovered ? "1px solid #BFDBFE" : "1px solid transparent",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onClick={() => emit({ type: "OPEN_SHEETS_MODAL" })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Import recipients from Google Sheets">
      <Sheet size={20} color={isHovered ? "#2563EB" : "#4B5563"} strokeWidth={2} />
    </button>
  )
}
