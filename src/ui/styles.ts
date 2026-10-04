// Airletter UI styles, injected into each content-script shadow root and the
// popup. Kept as a string module: importing a .css file as text made Parcel
// register a phantom CSS file in web_accessible_resources.
export const styles = String.raw`
/* Airletter UI in Gmail and the popup. Same tokens as the landing:
   black and white, Unbounded for headings, Inter Tight for text.
   Loaded into each content-script shadow root via getStyle(). */

:host,
.al-root {
  --ink: #000;
  --paper: #fff;
  --mute: #8a8a8a;
  --line: #3a3a3a;
  --deep: #161616;
  --head: "Airletter Unbounded", "Unbounded", system-ui, sans-serif;
  --body: "Airletter Inter Tight", "Inter Tight", system-ui, -apple-system, sans-serif;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);

  font-family: var(--body);
  -webkit-font-smoothing: antialiased;

  /* Shadow DOM isolates selectors but not inheritance: Gmail sets
     white-space: nowrap, line-height, letter-spacing, text-align… on the
     containers we are mounted into, and without this reset text runs out
     of our panels in one line. */
  white-space: normal;
  line-height: 1.4;
  letter-spacing: normal;
  word-spacing: normal;
  text-align: left;
  text-indent: 0;
  text-transform: none;
  text-shadow: none;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  font-variant: normal;
  direction: ltr;
  visibility: visible;
  cursor: auto;
  user-select: text;
  overflow-wrap: break-word;
}

/* controls keep their label on one line */
.al-send,
.al-btn,
.al-toast button {
  white-space: nowrap;
}

* {
  box-sizing: border-box;
}

button {
  font: inherit;
  color: inherit;
}

:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: 3px;
}

/* ---- buttons ---- */

.al-send {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  margin-left: 12px;
  padding: 0 18px 0 14px;
  border: none;
  border-radius: 100px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--head);
  font-weight: 500;
  font-size: 13px;
  letter-spacing: -0.02em;
  cursor: pointer;
  transition: transform 0.25s var(--ease), opacity 0.2s;
}
.al-send:hover:not(:disabled) {
  transform: scale(1.04);
}
.al-send:disabled {
  opacity: 0.6;
  cursor: progress;
}
.al-send svg {
  width: 15px;
  height: 15px;
}

/* round companion of the Airletter pill: outlined, filled when active */
.al-round-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--paper);
  color: var(--ink);
  box-shadow: inset 0 0 0 1.5px var(--ink);
  cursor: pointer;
  transition: transform 0.25s var(--ease), background 0.2s, color 0.2s;
}
.al-round-btn:hover {
  transform: scale(1.06);
}
.al-round-btn:hover,
.al-round-btn[aria-expanded="true"],
.al-round-btn.is-set {
  background: var(--ink);
  color: var(--paper);
}
.al-round-btn svg {
  width: 17px;
  height: 17px;
}

.al-mark-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--ink);
  color: var(--paper);
  cursor: pointer;
  transition: transform 0.25s var(--ease);
}
.al-mark-btn:hover,
.al-mark-btn[aria-expanded="true"] {
  transform: scale(1.06);
}
.al-mark-btn svg {
  width: 17px;
  height: 17px;
}

/* pill button on dark panels */
.al-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 46px;
  padding: 0 22px;
  border: none;
  border-radius: 100px;
  background: var(--paper);
  color: var(--ink);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.25s var(--ease), opacity 0.2s;
}
.al-btn:hover:not(:disabled) {
  transform: scale(1.03);
}
.al-btn:disabled {
  opacity: 0.5;
  cursor: progress;
}
.al-btn-ghost {
  background: transparent;
  color: var(--paper);
  box-shadow: inset 0 0 0 1px var(--line);
}
.al-btn-ghost:hover:not(:disabled) {
  box-shadow: inset 0 0 0 1px var(--paper);
}
.al-link {
  border: none;
  background: none;
  padding: 0;
  color: var(--mute);
  font-size: 13px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.al-link:hover {
  color: var(--paper);
}

/* ---- dark panel (popovers, dialog, popup) ---- */

.al-panel {
  background: var(--ink);
  color: var(--paper);
  border-radius: 18px;
  box-shadow: 0 24px 60px -12px rgb(0 0 0 / 0.45);
}

.al-popover {
  position: absolute;
  z-index: 2147483000;
  width: 320px;
  padding: 22px;
  animation: al-rise 0.22s var(--ease);
}
.al-popover.up {
  bottom: calc(100% + 10px);
  right: 0;
}
.al-popover.down {
  top: calc(100% + 10px);
  right: 0;
}

.al-title {
  margin: 0;
  overflow-wrap: anywhere;
  font-family: var(--head);
  font-weight: 500;
  font-size: 18px;
  letter-spacing: -0.03em;
}
.al-display {
  margin: 0;
  /* long words like "отправлять" must break rather than overflow */
  overflow-wrap: anywhere;
  hyphens: auto;
  font-family: var(--head);
  font-weight: 700;
  font-size: 28px;
  line-height: 0.95;
  letter-spacing: -0.05em;
}
.al-text {
  margin: 0;
  color: var(--mute);
  font-size: 13px;
  line-height: 1.5;
}
.al-small {
  color: var(--mute);
  font-size: 12px;
}
.al-divider {
  height: 1px;
  margin: 18px 0;
  background: var(--line);
  border: none;
}

/* ---- form ---- */

.al-field {
  display: block;
  margin-top: 14px;
}
.al-label {
  display: block;
  margin-bottom: 6px;
  color: var(--mute);
  font-size: 12px;
}
.al-input {
  width: 100%;
  height: 42px;
  padding: 0 14px;
  border: none;
  border-radius: 12px;
  background: var(--deep);
  color: var(--paper);
  box-shadow: inset 0 0 0 1px var(--line);
  font: inherit;
  font-size: 14px;
  color-scheme: dark;
  outline: none;
  transition: box-shadow 0.2s;
}
.al-input:focus {
  box-shadow: inset 0 0 0 1px var(--paper);
}
.al-input::placeholder {
  color: #5c5c5c;
}
/* radio list: an outlined circle, filled with a dot when chosen */
.al-options {
  display: grid;
  gap: 2px;
  margin-top: 14px;
}
.al-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}
.al-option:hover {
  background: var(--deep);
}
.al-radio {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 2px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--line);
  transition: box-shadow 0.2s;
}
.al-option:hover .al-radio {
  box-shadow: inset 0 0 0 1.5px var(--mute);
}
.al-option[aria-checked="true"] .al-radio {
  box-shadow: inset 0 0 0 1.5px var(--paper), inset 0 0 0 4.5px var(--ink), inset 0 0 0 8px var(--paper);
}
.al-option-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
}
.al-option-hint {
  display: block;
  margin-top: 2px;
  color: var(--mute);
  font-size: 12px;
  line-height: 1.45;
}

.al-row {
  display: flex;
  gap: 10px;
}
.al-row > * {
  flex: 1;
}

/* ---- dialog ---- */

.al-overlay {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgb(0 0 0 / 0.45);
  backdrop-filter: blur(4px);
  animation: al-fade 0.2s ease-out;
}
.al-dialog {
  position: relative;
  width: 100%;
  max-width: 460px;
  padding: 36px;
  animation: al-rise 0.25s var(--ease);
}
.al-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--mute);
  cursor: pointer;
}
.al-close:hover {
  color: var(--paper);
  background: var(--deep);
}

/* ---- usage meter ---- */

.al-meter {
  height: 1px;
  margin-top: 8px;
  background: var(--line);
}
.al-meter > div {
  height: 1px;
  background: var(--paper);
}

/* ---- toasts ---- */

/* bottom-left like Gmail's own snackbars: compose windows open on the right */
.al-toasts {
  position: fixed;
  bottom: 24px;
  left: 24px;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  pointer-events: none;
}
.al-toast {
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: min(560px, 90vw);
  padding: 12px 14px 12px 18px;
  border-radius: 100px;
  background: var(--ink);
  color: var(--paper);
  font-size: 14px;
  box-shadow: 0 16px 40px -10px rgb(0 0 0 / 0.5);
  pointer-events: auto;
  animation: al-rise 0.25s var(--ease);
}
.al-toast .dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--paper);
}
.al-toast.error .dot {
  background: transparent;
  box-shadow: inset 0 0 0 1.5px var(--paper);
}
.al-toast button {
  flex: none;
  height: 30px;
  padding: 0 14px;
  border: none;
  border-radius: 100px;
  background: var(--paper);
  color: var(--ink);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.al-pulse {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: al-pulse 1s ease-in-out infinite;
}

@keyframes al-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes al-fade {
  from {
    opacity: 0;
  }
}
@keyframes al-pulse {
  50% {
    opacity: 0.3;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`
