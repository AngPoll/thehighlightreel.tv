# thehighlightreel.tv

The Highlight Reel is a sports highlights website mock-up. It has a sport picker, a favorite-team dropdown, a featured YouTube video that plays inline, and a Most Recent grid of official league YouTube highlights that open in a pop-up player (the page underneath stays loaded). When YouTube's IFrame API reports errors 101 or 150, the page shows a friendly "Not available in your region" fallback. A background pre-check flags clips from geo-blocking leagues (La Liga, Serie A, Ligue 1, Bundesliga, Premier League).

Live site: https://the-highlight-reel.vercel.app

## Run locally

Serve the folder over HTTP. Opening `index.html` as a `file://` page makes YouTube embeds show Error 153.

```bash
npx serve .
```

or

```bash
python3 -m http.server
```

Then open the URL the command prints (for the Python server, http://localhost:8000).

## Deploy

This is a static site. It deploys to Vercel with no build step: the root `index.html` is the whole app.

## Testing URL params

- `?open=<videoId>` opens that clip in the pop-up player on load. Example: `?open=kxyWwqIswzk`
- `?simulateBlock=<videoId>` treats that clip as region-blocked so you can check the "Not available in your region" fallback without a real geo-block. Separate multiple ids with commas. Example: `?simulateBlock=tw16-vzKJXQ`
