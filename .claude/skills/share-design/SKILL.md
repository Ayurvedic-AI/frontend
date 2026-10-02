---
name: share-design
description: Produce a shareable client preview of the current mockup screens — a single-file build published as a private Artifact link, plus optional screenshots. Use when asked to share, demo, send, or show the design to the client/stakeholders.
---

# Share design

## 0. Default: run it live in the user's Chrome (Claude in Chrome)
```bash
bun dev --port 5199 --strictPort   # 5173/5174 are taken by other projects on this machine
```
Then with the Chrome tools: `tabs_context_mcp{createIfEmpty:true}` → navigate to
`http://localhost:5199/login` → sign in with any credentials → walk each screen, take
screenshots (`save_to_disk`) and leave the tab open for the user. Clear the demo session with
`sessionStorage.removeItem('school-erp:demo-session')` to get back to the login screen.
Use the Artifact link below only when the client must open it without your machine.

## 1. Build one file (hosted link)
```bash
bun run lint && bun run test && bun run build:preview   # → dist/index.html (hash routing)
```
`build:preview` sets `PREVIEW=1` (vite-plugin-singlefile inlines JS/CSS) and `VITE_ROUTER=hash`
so routes work from any URL (`…/#/login`, `…/#/dashboard`).

## 2. Publish as an Artifact
The Artifact tool wraps the file in its own `<html>/<head>/<body>`, so strip the document shell first:
```bash
mkdir -p "$SCRATCH" && node -e '
const fs=require("fs");let h=fs.readFileSync("dist/index.html","utf8");
const head=h.match(/<head>([\s\S]*)<\/head>/)[1].replace(/<meta[^>]*>/g,"");
const body=h.match(/<body>([\s\S]*)<\/body>/)[1];
fs.writeFileSync(process.argv[1], "<title>School ERP Mockup</title>\n"+head+"\n"+body);
' "$SCRATCH/school-erp-preview.html"
```
Then call the Artifact tool with that path (favicon 🎓, description "School ERP UI mockup — login
and dashboard"). Re-publish to the **same path** to keep the same link. Tell the user:
- the link, the screens included, and that any email/password signs in
- routes: `#/login`, `#/dashboard` (append to the artifact URL)

## 3. Screenshots (optional, for email/WhatsApp)
Run `bun dev`, open `http://localhost:5173/login` and `/dashboard` with the Chrome tools at 1280 px
and 375 px, save PNGs under the scratchpad and share paths.

## Notes
- Google Fonts is allowed by the Artifact CSP; everything else is inlined by the preview build.
- Never share `_reference/` content or the old brand.
