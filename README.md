# thehighlightreel.tv

The Highlight Reel is a sports highlights site: a marketing homepage, demo accounts, a favorites picker, and one continuous highlights feed. The newest clip plays inline. The rest open in a pop-up on the YouTube IFrame API (`youtube-nocookie`). Errors 101 and 150 show a friendly "Not available in your region" message. Clips from La Liga, Serie A, Ligue 1, the Bundesliga, and the Premier League are pre-checked in the viewer's region.

Live site: https://the-highlight-reel.vercel.app

## Accounts are a browser demo

Sign-up does not create a server account. Users, favorites, the region toggle, and the session are stored in `localStorage` on this browser. Passwords are hashed with Web Crypto SHA-256 and a per-user salt. Plaintext passwords are never stored. A real backend can replace `js/auth.js` later. The functions are `signUp`, `logIn`, `logOut`, `currentUser`, `updateUser`, `deleteUser`, `getFavorites`, and `setFavorites`.

## Page map

| Page | File | Who can open it |
| --- | --- | --- |
| Marketing homepage | `index.html` | Signed-in visitors are sent to the app |
| Sign up | `signup.html` | Name, email, password |
| Log in | `login.html` | Signed-in visitors are sent to the app |
| Favorites picker | `onboarding.html` | Signed-in users with no favorites yet. `?edit=1` reopens it from Settings |
| Highlights | `app.html` | Signed-in users. No favorites yet sends them to onboarding |
| Settings | `settings.html` | Signed-in users. Sign out returns to the homepage |

Shared files: `css/styles.css`, `js/auth.js`, `js/teams.js`, `js/highlights.js`, `js/search.js`, `js/player.js`, `js/picker.js`, `js/app.js`, `assets/logo.svg`, `assets/favicon.svg`.

There is no year-ago archive. Every list of clips is one feed, newest first.

Search matches the title, league, sport, teams, player names, and dates such as Sep 28, September 2026, 2026-09-28, yesterday, and last week. It also matches series names such as World Series, NBA Finals, Stanley Cup Final, Champions League, Ryder Cup, Monaco Grand Prix, US Open, and playoffs, and those names show up as you type. A clip is tagged with a series only when that name is in its verified title, or the title directly implies it.

## Run locally

Serve the folder over HTTP. Opening a page as `file://` makes YouTube embeds show Error 153.

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Testing URL params

Use these on the highlights page.

- `app.html?open=<videoId>` opens that clip in the pop-up. Example: `app.html?open=kxyWwqIswzk`
- `app.html?simulateBlock=<videoId>` treats that clip as region-blocked so you can check the fallback without a real geo-block. Separate multiple ids with commas. Example: `app.html?simulateBlock=tw16-vzKJXQ`

## Deploy

This is a static site. Upload the files to Vercel as-is. There is no build step and no `package.json`.
