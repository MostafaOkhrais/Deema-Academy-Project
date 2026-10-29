# Design system — Deema Academy site

Source of truth for tokens: `src/styles/tokens.css`. The world is the academy's own post system (graph paper, navy grid, sky field) scaled to a page.

## Palette
| Role | Value |
|---|---|
| Navy (text and icon ink; dark-theme surfaces) | `#002147` |
| Sky (highlight bar, buttons, tags, closing field) | `#91C8E0` |
| Light blue wash (rows, inputs, emphasis surface) | `#E8F3F9` / `#E4F1F8` |
| White (graph-paper ground) | `#FFFFFF` |

Light theme fills are white and light blue only; navy appears only as text/icon colour. The brand black and grey are not used.

Surfaces are declared with `data-surface="paper|deep|sky"` (`deep` = light-blue wash in light theme, navy in dark); components read semantic tokens (`--bg --fg --fg-muted --row --grid --tag-bg --action-bg`). Dark theme re-points the same tokens.

## Type
Thmanyah Serif Display (Black for headings, Bold for row labels) and Thmanyah Sans for text. Scale: display 3–6rem, h2 2.25–4rem, h3 1.5–2rem, body 1.0625rem at 1.9 line-height.

## Shapes
Radii 16 / 28 / 36px; pills 999px. Elevation by border or fill only: no shadows, glass or gradients. 36px graph-paper grid on every surface.

## Components
Tag (sky pill), Button (sky pill, navy text; white on the sky surface), Row (grey rounded row with outlined number), Panel (sky-tinted, 2px sky border), Sheet (white form panel), line icons (24px, 2px stroke, round caps).

## Motion
One authored moment: a sky underline swipe on the hero word, and a page-wipe (`clip-path`) when switching tracks. Everything else is state feedback (hover, press). `prefers-reduced-motion` collapses durations.
