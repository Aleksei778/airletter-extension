// @font-face does not work inside shadow DOM, so the fonts are declared once
// on the Gmail document under private family names (no clash with the page).

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
const CYRILLIC = "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116"

const faces: [family: string, file: string, weight: number][] = [
  ["Airletter Unbounded", "unbounded", 500],
  ["Airletter Unbounded", "unbounded", 700],
  ["Airletter Inter Tight", "inter-tight", 400],
  ["Airletter Inter Tight", "inter-tight", 500]
]

export function injectFonts() {
  const id = "airletter-fonts"
  if (document.getElementById(id)) return

  const css = faces
    .flatMap(([family, file, weight]) =>
      [
        ["latin", LATIN],
        ["cyrillic", CYRILLIC]
      ].map(
        ([subset, range]) => `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;` +
          `src:url(${chrome.runtime.getURL(`assets/fonts/${file}-${subset}-${weight}-normal.woff2`)}) format("woff2");unicode-range:${range}}`
      )
    )
    .join("")

  const style = document.createElement("style")
  style.id = id
  style.textContent = css
  document.head.append(style)
}
