# Absolute Advisor

Komal's private fleet and profit strategist for **Absolute Transportation** (North Haven, CT · Boston to New Jersey).

It knows all 50 vehicles on the roster (tracker nickname, plate, mileage, VIN, estimated annual pace, replacement priority). It thinks like an operator who has built a chauffeured-transportation company into the eight figures and bought fleets off dealer lots, and it can search the web live for prices, events, contracts and news.

Ask it anything, in plain English:

- "Should I swap out my Aviator for a new XTS?" It asks which Aviator (there are 8, from 144k to 231k miles), points out that the XTS ended production in 2019, and gives a verdict with the math.
- "Which cars are sitting too much and how do I make money with them this month?"
- "What's coming up in the next 60 days and how should I price it?"
- "Remember our JFK flat rate is $325." It saves that and uses it from then on.
- "The 21 Aviator is at 240,000 miles now" or "I sold the Malibu." It updates the roster itself.
- Attach a photo of a listing, an auction sheet PDF, or a spreadsheet of jobs, and ask about it.

Every visit opens with a personal greeting, followed by positive messages about peace, kindness and success. There are 311 of them, and they rotate every 40 seconds.

---

## Run it on a laptop (about 5 minutes, one time)

1. Install **Node.js** (the "LTS" version) from <https://nodejs.org>.
2. Get an **Anthropic API key**: <https://console.anthropic.com> → *API Keys* → *Create key*.
3. Double-click the start file:
   - Mac: **`start-mac.command`** (the first time, right-click → *Open* to get past the security prompt)
   - Windows: **`start-windows.bat`**
4. The first run creates a file called `.env` and opens it. Paste your key after `ANTHROPIC_API_KEY=`, save, and double-click the start file again.

The app opens at **http://localhost:3000**. After that, just double-click the start file whenever you want it.

> No key yet? The app still runs in **demo mode** and answers from the roster, so you can see how it works.

## Host it in the cloud (use it from a phone anywhere)

**Render (one click):** push this repo to GitHub, then in Render choose **New → Blueprint** and pick the repo. The included `render.yaml` sets everything up, including a small disk so the roster and memory survive restarts. When asked, enter:

- `ANTHROPIC_API_KEY`: your key
- `APP_PASSWORD`: a passcode (**required in the cloud**, so nobody else can use your key)

**Anywhere with Docker** (Railway, Fly.io, a VPS):

```bash
docker build -t absolute-advisor .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-... -e APP_PASSWORD=choose-one -v advisor-data:/data absolute-advisor
```

On a phone, open the site and use **Share → Add to Home Screen** so it works like an app.

## Using it

| Where | What it does |
|---|---|
| **Swap Advisor** chip | Ranks what to sell or replace first, what to buy, and when |
| **Idle Cars** chip | Finds underused vehicles and ways to make each one earn |
| **Today's Play** chip | One high-probability profit move you can start today |
| **Live Search** toggle | Tap to switch between live web search and *Fleet Only* (faster) |
| Paperclip | Attach photos, PDFs, CSV or text files |
| **Fleet** | The full roster, sorted by replacement priority. Tap a car for a verdict |
| **Playbook** / **Seasons** | A 90-day growth plan, and upcoming demand with pricing |
| **Notes** | Everything the Advisor has learned. Delete anything out of date |
| **New Chat** | Start fresh (conversations are kept for 8 hours otherwise) |

When the Advisor asks a follow-up question, it shows tap-to-answer buttons.

## Files

| File | Purpose |
|---|---|
| `public/index.html` | The whole app UI, a single self-contained page |
| `server.js` | Small Node server: streams answers from Claude with web search, memory and roster tools |
| `lib/prompt.js` | The Advisor's expertise, playbook and business context. Edit this to teach it more |
| `lib/fleet.js` | Roster analytics (annual pace, flags, replacement priority) |
| `data/fleet.json` | The roster (from the GPS tracker screenshots). Safe to edit by hand |
| `data/notes.json` | Memory, created automatically |

Settings (in `.env`): `MODEL` (default `claude-opus-5`), `EFFORT` (`high` by default; `medium` is faster and cheaper), `PORT`, `DATA_DIR`, `APP_PASSWORD`.

Refusal fallback is turned on (`server-side-fallback-2026-07-01`, `fallbacks: "default"`). If Claude declines a request, the API retries it on a recommended fallback model instead of returning nothing. Set `FALLBACKS=0` to turn it off.
