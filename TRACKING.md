# Tracking links (wt-source)

Every link we control carries `?wt-source=<channel>`. The game reads it once per visit
(`analytics.js`, kept for the browser session) and adds `src-<channel>` to every funnel event
sent to GoatCounter (`/event/word-traps/...`). No cookie is set.

## Values in use

| wt-source | Where it comes from |
| --- | --- |
| `seo` | Play buttons on the generated `/quiz/<slug>/` pages (with `wt-topic=<slug>`) |
| `share` | The link inside the "Challenge a friend" text and the score card message |
| `wordtraps` | Outbound link from Word Traps to our other site (house ad), so the other site can measure it |
| `direct` | No tag: typed address, bookmark, installed app |

Other channels (Instagram, newsletter, QR code, ...) are listed in `tracking-links.json`.

## Build the links

```bash
npm run links
npm run links -- quiz/french-false-friends-business/
```

The first prints the home page tagged for each channel; the second tags a given page.

## Rules

- Lowercase slug, letters, digits and `-` only (the analytics code slugifies anything else).
- Add a channel by editing `tracking-links.json`; nothing else to regenerate.
- `utm_source` is understood as a fallback when `wt-source` is absent.
