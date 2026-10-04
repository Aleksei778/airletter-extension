// Site origin. The Go API is proxied under /api by the landing, so the
// extension, the website and the OAuth callback share one origin.
export const SITE_URL = (process.env.PLASMO_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")
export const API_URL = `${SITE_URL}/api`

export const siteLink = (path: string) => `${SITE_URL}${path}`
