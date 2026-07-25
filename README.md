# House of Prachar — Portfolio

A static portfolio site built with plain HTML, CSS, and JavaScript — no build step, no framework, no dev server required. A full-screen "Enter" hero gives way to a categorized grid of client reels, each playable in a lightbox via the official Instagram embed. Includes an `admin.html` dashboard for adding categories and reels.

## Run it

There's nothing to install or build.

- **Easiest:** double-click `index.html` — it opens directly in your browser and works.
- **Or** serve the folder with any static file server if you prefer (e.g. the VS Code "Live Server" extension, or `npx serve`) — useful mainly so a devtunnel/port-forward has something predictable to point at.

## Files

```
index.html      hero + portfolio (category tabs, reel grid, playback modal)
admin.html      dashboard (passcode-gated)
css/tokens.css  color/font/spacing variables
css/style.css   site styles (hero, tabs, grid, cards, modal)
css/admin.css   dashboard styles
js/seed-data.js default content (categories + reels)
js/utils.js     small helpers (placeholder gradients, escaping)
js/storage.js   localStorage CRUD + import/export (window.HopStore)
js/main.js      hero, tabs, grid, modal, Instagram embed logic
js/admin.js     dashboard logic
assets/         favicon
```

## Content model

Categories and reels live in `js/seed-data.js` (a plain `HOP_SEED` object), which seeds `localStorage` on first visit. All edits made through `admin.html` are saved to the browser's `localStorage` — **this is a static site with no server**, so those edits only affect the browser they were made in.

**To publish content changes to everyone:**
1. Open `admin.html` and make your edits.
2. Click **Export JSON** in the Data panel — this downloads the current `categories`/`reels` as a file.
3. Open the downloaded file, copy its contents, and paste them in as the value of `HOP_SEED` in `js/seed-data.js` (keep the `var HOP_SEED = ... ` wrapper).
4. Commit and push (or re-upload the file to your host) — everyone now sees the update.

The default admin passcode is `prachar2026` (change it from the dashboard's "Change passcode" panel — note this is a client-side check only, not real security, since a static site has no server to authenticate against).

## Instagram reels

Reels are embedded using Instagram's official `embed.js` widget (real playback, no scraping). In the dashboard, paste the reel's public URL, e.g. `https://www.instagram.com/reel/ABC123/`. If a reel fails to embed (private post, invalid URL, or the placeholder seed URLs), the modal falls back to a "Watch on Instagram" link.

## Deploy to GitHub Pages (free)

1. Create a GitHub repo and push this project to it (just these files — no build artifacts needed).
2. In the repo's **Settings → Pages**, set **Source** to "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Save — your site goes live at `https://<you>.github.io/<repo-name>/` within a minute or two. No Actions workflow, no build step.

Because every link in this project is a relative path (`css/style.css`, `admin.html`, etc.), it works the same whether it's opened as a local file, served from a subfolder, or hosted at a custom domain — no config to change.
