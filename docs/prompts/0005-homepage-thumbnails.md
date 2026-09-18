# 0005 - homepage thumbnails do not fit their frames

Source: Slack thread https://playsetllc.slack.com/archives/C0C3RTXCCEL/p1789767834190729?thread_ts=1789750827.102799
Date: 2026-09-18
Requester: Justin Massion (owner)

## Prompt (verbatim)

The homepage is all screwed up and the thumbnails also aren't fitting in the right space. It looks like there's a mobile thumbnail in a wide space, which doesn't look

## Response

Model: Fable 5.1 (shared code: `DeviceFrame`, `BrandArt`; hub layout).

Root causes, from Justin's full-page capture (dark mode, wide monitor) and a Playwright reproduction at 1920 / 3840:

1. **A phone layout in a landscape frame.** `src/styles/global.css` sets `iframe { max-width: 100% }`. `DeviceFrame` asked its iframe for 1280 px, the rule shrank it to the card's width (about 350 px), the page inside laid itself out as a phone, and the CSS transform (`350 / 1280`) then scaled that phone down into the left quarter of the frame. Every staff / site card showed a phone-width page in a wide box.
2. **Session bar cut off.** The floating session bar lived inside the ink band (`.hub-top { overflow: hidden }`) and hung 30 px below it, so its lower part was clipped; when the role selects wrapped to two lines (Justin's capture) most of the bar vanished.
3. **Invisible previews in dark mode.** A dark page in a dark card with no frame edge; the idle state was a lone icon in an empty box, and cards that never became live (out of view, over the six-frame cap, inside another frame, or in a full-page capture) looked broken.
4. The intro copy cut mid-sentence and the sliced "Build & test" eyebrow in the capture are artefacts of `position: sticky` group heads in a stitched full-page screenshot; the heads are no longer sticky, so captures match what the screen shows.

What changed:

- **`DeviceFrame`** (`src/components/organism/DeviceFrame/*`): new `viewport { width, height }`, `aspect`, `caption` and `edge` props (old `device` / `width` / `height` / `fit` unchanged; the canvas and simulator keep working). The iframe is laid out at the viewport size (`max-width: none`) and transform-scaled to the container; the stage carries `aspect-ratio`, so it has the right height before the first measurement and crops at the bottom instead of letterboxing; a hairline + soft inner shadow (`edge`) makes the frame read on any surface, light or dark.
- **Hub previews** (`src/modules/hub/HubPage.tsx`, `hub.css`): every desktop preview renders its home page at 1280 x 800 and fills a 16:10 box edge to edge; the client app keeps the phone frame, now fully inside the card and cropped only at the bottom, scaled with `--scale` at 2560 / 3840. While a frame is not live a **window wireframe in the card's hue** (`BrandArt variant="window"`, new) fills the same box with the surface glyph on a raised mark. The six-frame cap favours the cards highest on the page (document order) instead of insertion order.
- **Session bar** rendered after the band and pulled up over its edge, so nothing can clip it; group heads not sticky; intro copy column 34ch.
- Card grids: three columns for the audience groups (3 + feature / 6 cards, every card in a group the same size), four for the build band, `--scale` grows the whole thing at 2560 and 3840.

Checked in Chromium at 1440, 1920, 2560 and 3840 in light and dark for all three directions (clearsky, boardgame, courthouse), frames booted; `npm run qa:responsive -- --codes=HUB-01` 14 cells, 0 failing; `npm run build` green; screenshots refreshed (`docs/screenshots/HUB-01/`). Branch `mod/hubfix`, pushed; no merge to main, no PR.
