# zerowealth

Free Indian finance calculators (SIP, EMI, Lumpsum, FD, PPF, SWP, compound interest, inflation, retirement) — live at https://zerowealth.in.

Static site: open `index.html` (landing page) or `calculators.html` (calculator workspace) in a browser; no build step.

## YouTube data (Zero Wealth channel)

`data/youtube.js` holds the channel numbers and latest videos shown on the site (top-bar count, home-page "Zero Wealth on YouTube" section, the "Watch" card on each calculator). `yt.js` / `yt.css` render them.

It is refreshed once a day by the **Refresh YouTube data** GitHub Action (`.github/workflows/youtube-data.yml`, script `scripts/update-youtube.mjs`). You can also run it any time from the repo's **Actions** tab → *Refresh YouTube data* → *Run workflow*.

- Without an API key it reads the public channel page (subscribers, video count) and the public feed (latest 15 videos and views).
- For exact subscriber and **total view** counts, add a free YouTube Data API v3 key as a repository secret named `YOUTUBE_API_KEY` (Settings → Secrets and variables → Actions).
- If YouTube can't be reached, the previous numbers are kept.
- Videos are matched to calculators by their title (e.g. "FD" → FD calculator, "emergency fund" → Goal Planner); see `TOPICS` in `yt.js`.
