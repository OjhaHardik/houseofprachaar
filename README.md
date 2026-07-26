# House of Prachar — Portfolio

A static portfolio site built with plain HTML, CSS, and JavaScript — no build step, no framework, no dev server required. A full-screen "Enter" hero gives way to a categorized grid of client reels; clicking a card opens the reel on Instagram. Includes an `admin.html` dashboard for managing categories and reels, with a one-click **Publish** that pushes changes straight to the live site.

## Run it

There's nothing to install or build.

- **Just browsing the site:** double-click `index.html` — it opens directly in your browser and works. Any static file server works too (VS Code "Live Server", `npx serve`, etc.).
- **Editing content locally and wanting to see it live immediately:** run the included dev server instead — `node tools/dev-server.js` (defaults to port 5503) — see [Local development](#local-development) below. Live Server and friends can't do this part, since they can only serve files, not write them.

## Files

```
index.html          hero + portfolio (category tabs, hamburger menu on phones, reel grid)
admin.html          dashboard (passcode-gated)
data.json            the published content — what every visitor's browser fetches
css/tokens.css       color/font/spacing variables
css/style.css        site styles
css/admin.css        dashboard styles
js/seed-data.js      bundled fallback content, used only if data.json can't be fetched
js/utils.js          shared helpers: ratio/aspect-ratio tables, legacy data migration, image compression, escaping
js/storage.js        the admin's local draft: localStorage CRUD for categories/subcategories/items + import/export (window.HopStore)
js/github-publish.js publishes the draft to GitHub via its API (window.HopPublish)
js/main.js           hero, tabs, grid — fetches data.json for every visitor
js/admin.js          dashboard logic
tools/dev-server.js  optional local dev server — static files + a save-to-disk endpoint for the dashboard
assets/               favicon
```

## How content publishing works

This is a static site — GitHub Pages has no server, so nothing can auto-save dashboard edits on its own. Here's how it actually works:

- **`data.json`** is the single source of truth every visitor's browser fetches. This is what's "live."
- **The dashboard (`admin.html`) edits a draft** saved in your browser's `localStorage` — scoped to that specific browser + origin (protocol/host/port). Safe to experiment in; doesn't affect anything else until you save/publish it somewhere. The dashboard only auto-fills that draft from the published `data.json` the very first time a given browser+origin opens it — after that it's showing your saved draft, not necessarily what's live, until you resync (see "Load current live data" below).
- **Clicking "Publish to GitHub"** in the dashboard commits your draft as the new `data.json` straight to this repo, using GitHub's API from your browser. GitHub Pages detects the change and rebuilds automatically — live on **houseofprachar.com** within about a minute. Requires a GitHub token (see below) — this is the path for the real deployed site.

## Local development

While actively editing content and wanting to see changes on your own machine immediately — without a GitHub token, without waiting on a real publish — run the included dev server instead of Live Server/`npx serve`:

```
node tools/dev-server.js        # serves the site at http://127.0.0.1:5503
```

This does exactly what any static server does, plus one thing they can't: the dashboard's **"Save to local data.json"** button (in its own "Local development" panel, only shown when running on `localhost`/`127.0.0.1`) POSTs your draft to this server, which writes it straight to `data.json` on disk. Refresh the homepage tab and your edits are there — no GitHub involved. This button only appears/works when the site is served this way; on the real deployed site it's hidden, since GitHub Pages can't run this endpoint.

When you're done and ready to go live, use the dashboard's **"Publish to GitHub"** instead (see below) — that's the path that actually updates houseofprachar.com.

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

## Categories, subcategories & items

Each top-level **category** (shown as tabs along the top) holds any number of **subcategories** (shown as a left-hand sidebar) — a category with none yet shows nothing in the sidebar. Every subcategory has a **type**, set when you create it and fixed afterward: **Video** or **Photo**. That type decides which aspect ratios its items can use:

- **Video** — Horizontal (16:9) or Vertical (9:16). Horizontal items span two grid columns since they're wider; Vertical is the default card shape.
- **Photo** — 3:4, 4:5, Square (1:1), 5:4, or 4:3.

Each item has a title, an optional Link URL (Instagram, Google Drive, or a direct video link — opens in a new tab when clicked), an optional thumbnail (required for Photo items, since the image is the whole point), and one of its subcategory's ratios. The grid centers incomplete rows (e.g. 2 cards center as a pair instead of sitting left-aligned) and adapts from 3 columns (desktop) → 2 (tablet) → 1 (phone). The subcategory sidebar and category tabs both stay visible at every screen width — phones collapse the category picker into a hamburger menu instead of hiding it.

## Deploy to GitHub Pages (free)

Already set up for this repo — pushes to `main` go live at whatever domain/URL Pages is configured with (see repo Settings → Pages). For a fresh copy of this project:

1. Create a GitHub repo and push this project to it.
2. In the repo's **Settings → Pages**, set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Update the `OWNER`/`REPO` constants at the top of `js/github-publish.js` to match your new repo.
4. Save — the site goes live within a minute or two. No Actions workflow, no build step.

Every link in this project is a relative path, so it works the same whether opened as a local file, served from a subfolder, or hosted at a custom domain.
