# Airletter

Chrome extension for Gmail: send a campaign from the compose window of your own Gmail, with recipients from the To field or a Google Sheet, now or on a schedule.

## Development

```bash
pnpm install
pnpm dev        # loads .env.development, builds to build/chrome-mv3-dev
```

Load `build/chrome-mv3-dev` in `chrome://extensions` (Developer mode → Load unpacked).

## Configuration

`PLASMO_PUBLIC_SITE_URL` is the website origin. The API lives under `/api` on it (the landing proxies to the Go backend), and the same origin is added to `host_permissions`.

- `.env.development` — local site, `http://localhost:3000`
- `.env.production` — create it with the production origin before `pnpm build` (see `.env.example`)

The backend must have `EXTENSION_ID` set to this extension's ID so that Google sign-in can return to `https://<id>.chromiumapp.org/callback`.

## Architecture

- `src/background` — the only place that holds auth tokens: sign-in (one-time code exchange), token refresh shared by concurrent requests, API calls
- `src/contents` — UI injected into Gmail: the Airletter button next to Send and the toolbar
- `src/services/gmail.ts` — all Gmail DOM selectors and reading of the draft
- `src/lib/messages.ts` — typed messages between content scripts and the background
