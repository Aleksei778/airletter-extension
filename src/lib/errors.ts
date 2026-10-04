import { toast } from "./bus"
import { siteLink } from "./config"
import { t } from "./i18n"
import { ExtensionError } from "./messages"

/** Shows a user-facing message for an error returned by the background */
export function showError(e: unknown) {
  const code = e instanceof ExtensionError ? e.code : "unknown"

  switch (code) {
    case "unauthorized":
    case "reauth_required":
      return toast({ kind: "error", text: t.errors[code], action: { label: t.errors.signIn, login: true } })
    case "no_subscription":
    case "paid_plan_required":
      return toast({
        kind: "error",
        text: t.errors[code],
        action: { label: t.errors.choosePlan, href: siteLink("/dashboard#upgrade") }
      })
    case "validation":
      // the backend explains what is wrong (in English); fall back to a generic hint
      return toast({ kind: "error", text: (e as ExtensionError).message || t.errors.validation })
    case "access_denied":
      return toast({ kind: "info", text: t.errors.access_denied })
    default:
      return toast({ kind: "error", text: t.errors[code] ?? t.errors.unknown })
  }
}
