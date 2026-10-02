---
version: 1
slug: "src-routes-protectedlayout-tsx"
primary_target: "src/routes/ProtectedLayout.tsx"
related_targets: ["src/index.css","src/features/navbar/components/TopHeader.tsx"]
---

# App shell + system world (all screens)

Scope: the whole frontend's visual world: tokens, top bar, login, dashboard, Patients, AI Summary. Mode: Operate.
Audience: solo vaidya, daylit clinic, mid-consultation. Job: read and act fast; Hindi/Marathi text must read as well as English.
User brief (binding): "Ayurvedic but modern": deep colour band at the top, that colour for buttons and the active page, a warm accent for highlights only, near-black text with stronger contrast, warm white page with white cards, red reserved for red flags. Chosen colour: verdigris teal + copper. Top nav, no sidebar (pinned earlier).

## Direction contract

Seed: be067c0d (direction, operate) · rounds: roll → bolder → safer → user steer "Ayurvedic but modern" → chosen: teal (copper and verdigris)

THESIS: A copper vessel and its patina: deep verdigris teal holds the shell and every action, a thin copper bar marks where you are. It refuses generic wellness green and grey SaaS with one blue accent.

OWN-WORLD: Deep teal band (#0E4F55) as the top bar; teal (#12676E) for buttons, links, focus and selection tints; copper (#B8662E) only as 3px bars (active nav, page titles, summary section heads); warm white page (#FBFAF7), white cards, warm hairlines; near-black ink (#17181F), labels a darker warm grey than before. Mukta for Latin and Devanagari together. Red stays red flags and errors only; amber stays warnings.

STORY: Within a second the vaidya knows which screen they are on (copper bar under the nav item), what the screen is (titled page header), and what needs attention (red, used nowhere else).

FIRST VIEWPORT: Teal band: brand, nav links in light text, active link underlined in copper, user menu right. Page header: short copper bar, title, one-line description, primary action right. Then the work area on white cards over a warm-white page.

SIGNATURE MOVE: The copper bar: a 3px copper rule that marks the current place (active nav item, page title, summary section heading) and nothing else.

RISK: Copper near warning amber: warnings keep the amber/orange tint pills and never use the copper bar shape. Mukta's Latin runs small: body text steps up to 15px.
