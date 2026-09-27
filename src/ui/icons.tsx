import React from "react"

type P = { className?: string }
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }

/** Same drawing as the landing's logo and favicon */
export const PlaneMark = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M2 10.4 22 2 9.4 13.3Z" />
    <path d="M22 2 11 14.6 15.6 21.6Z" />
    <path d="M11 14.6 10.2 20.6 13.3 18.1Z" opacity="0.55" />
  </svg>
)

export const ClockIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const SheetIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...stroke}>
    <rect x="4" y="3.5" width="16" height="17" rx="2" />
    <path d="M4 9h16M4 14.5h16M10 9v11.5" />
  </svg>
)

export const CloseIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" width="16" height="16" className={className} aria-hidden="true" {...stroke}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const ArrowIcon = ({ className }: P) => (
  <svg viewBox="0 0 14 14" width="13" height="13" className={className} aria-hidden="true" {...stroke}>
    <path d="M3 11 11 3M5 3h6v6" />
  </svg>
)

export const GoogleIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={className} aria-hidden="true">
    <path d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.64 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.54 2.8 12 2.8 6.92 2.8 2.8 6.92 2.8 12s4.12 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.99 0-.6-.07-1.06-.15-1.51Z" />
  </svg>
)
