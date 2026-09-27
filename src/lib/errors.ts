import { toast } from "./bus"
import { siteLink } from "./config"
import { ExtensionError } from "./messages"

/** Shows a user-facing message for an error returned by the background */
export function showError(e: unknown) {
  const code = e instanceof ExtensionError ? e.code : "unknown"
  const message = e instanceof ExtensionError ? e.message : ""

  switch (code) {
    case "unauthorized":
      return toast({ kind: "error", text: "Sign in to Airletter to send campaigns.", action: { label: "Sign in", login: true } })
    case "reauth_required":
      return toast({ kind: "error", text: "Gmail access was revoked. Sign in again to continue.", action: { label: "Sign in", login: true } })
    case "no_subscription":
      return toast({ kind: "error", text: "No active plan.", action: { label: "Choose a plan", href: siteLink("/pricing") } })
    case "missing_scopes":
      return toast({ kind: "error", text: "Allow Airletter to send email on your behalf when signing in." })
    case "access_denied":
      return toast({ kind: "info", text: "Sign-in cancelled." })
    case "validation":
      return toast({ kind: "error", text: message || "Check the email and try again." })
    case "network":
      return toast({ kind: "error", text: "No connection to Airletter. Try again." })
    default:
      return toast({ kind: "error", text: "Something went wrong. Try again." })
  }
}
