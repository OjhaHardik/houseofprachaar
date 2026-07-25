# House of Prachar — Portfolio

A static portfolio site built with plain HTML, CSS, and JavaScript — no build step, no framework, no dev server required. A full-screen "Enter" hero gives way to a categorized grid of client reels; clicking a card opens the reel on Instagram. Includes an `admin.html` dashboard for managing categories and reels, with a one-click **Publish** that pushes changes straight to the live site.

## Run it

There's nothing to install or build.

- **Easiest:** double-click `index.html` — it opens directly in your browser and works.
- **Or** serve the folder with any static file server if you prefer (e.g. the VS Code "Live Server" extension, or `npx serve`).

## Files

```
index.html          hero + portfolio (category tabs, hamburger menu on phones, reel grid)
admin.html          dashboard (passcode-gated)
data.json            the published content — what every visitor's browser fetches
css/tokens.css       color/font/spacing variables
css/style.css        site styles
css/admin.css        dashboard styles
js/seed-data.js      bundled fallback content, used only if data.json can't be fetched
js/utils.js          small helpers (placeholder gradients, image compression, escaping)
js/storage.js        the admin's local draft: localStorage CRUD + import/export (window.HopStore)
js/github-publish.js publishes the draft to GitHub via its API (window.HopPublish)
js/main.js           hero, tabs, grid — fetches data.json for every visitor
js/admin.js          dashboard logic
assets/               favicon
```

## How content publishing works

This is a static site — GitHub Pages has no server, so nothing can auto-save dashboard edits on its own. Here's how it actually works:

- **`data.json`** is the single source of truth every visitor's browser fetches. This is what's "live."
- **The dashboard (`admin.html`) edits a draft** saved in your browser's `localStorage` — safe to experiment in, doesn't affect the live site until you publish.
- **Clicking "Publish to GitHub"** in the dashboard commits your draft as the new `data.json` straight to this repo, using GitHub's API from your browser. GitHub Pages detects the change and rebuilds automatically — live on **houseofprachar.com** within about a minute.

### Setting up Publish (one-time)

1. In the dashboard's **Publish** panel, open "How do I get a token?"
2. Create a token at [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new):
   - Repository access → only this repo (`houseofprachaar`)
   - Permissions → Repository permissions → **Contents: Read and write**
3. Paste the token into the dashboard and click **Save token**. It's stored only in that browser's `localStorage` — never sent anywhere except `api.github.com`.
4. From then on, editing categories/reels and clicking **Publish to GitHub** takes them live.

The token grants write access to this one repo — don't share it, and you can revoke/regenerate it anytime from GitHub's token settings.

### Other Data panel tools

- **Load current live data** — overwrites your local draft with what's currently published (e.g. to start fresh on a new device, or discard local changes).
- **Export / Import JSON** — manual backup/restore of your draft.
- **Reset to seed** — wipes your draft back to the bundled placeholder content in `js/seed-data.js`.

The default admin passcode is `prachar2026` (change it from the dashboard's "Change passcode" panel — this is a client-side check only, not real security, since a static site has no server to authenticate against).

## Instagram reels

Clicking a reel card opens its Instagram URL in a new tab — no embedding, no scraping, just a direct link to the real post. Hovering shows a play-icon preview effect.

## Reel formats

Each reel has a grid orientation, set per-reel in the dashboard: Vertical (9:16), Square (1:1), Portrait (3:4), Horizontal (16:9), or Landscape (4:3). Horizontal and Landscape span two grid columns since they're wider. The grid centers incomplete rows (e.g. 2 cards center as a pair instead of sitting left-aligned) and adapts from 3 columns (desktop) → 2 (tablet) → 1 (phone, with a hamburger menu replacing the category tabs).

## Deploy to GitHub Pages (free)

Already set up for this repo — pushes to `main` go live at whatever domain/URL Pages is configured with (see repo Settings → Pages). For a fresh copy of this project:

1. Create a GitHub repo and push this project to it.
2. In the repo's **Settings → Pages**, set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Update the `OWNER`/`REPO` constants at the top of `js/github-publish.js` to match your new repo.
4. Save — the site goes live within a minute or two. No Actions workflow, no build step.

Every link in this project is a relative path, so it works the same whether opened as a local file, served from a subfolder, or hosted at a custom domain.
