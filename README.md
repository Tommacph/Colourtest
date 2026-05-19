# Colour Study — Porter's Paints

An immersive colour perception study. Shows a Porter's Paint colour full-screen and asks 9 emotional questions per colour. Responses are stored in a local SQLite database.

---

## Quick start

### Prerequisites
- [Node.js](https://nodejs.org) version 18 or higher

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
node server.js
```

### 3. Open the site
Visit **http://localhost:3000** in your browser.

---

## Project structure

```
colour-study/
├── public/
│   └── index.html      ← The entire frontend (one file)
├── data/
│   └── responses.db    ← SQLite database (auto-created on first run)
├── server.js           ← Node.js server + API
├── package.json
└── README.md
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/response` | Save a single response (called automatically by the frontend) |
| `GET`  | `/api/stats` | JSON: response counts per colour |
| `GET`  | `/api/export` | Download all responses as a CSV file |

### Export your data
While the server is running, open:
```
http://localhost:3000/api/export
```
This downloads a CSV with all responses including: colour name, RGB, question, answer, timestamp, and session ID.

Or query the database directly:
```bash
sqlite3 data/responses.db "SELECT colour, question, answer, timestamp FROM responses LIMIT 20;"
```

---

## How it works

- **Colour selection** — Colours with the fewest total responses are shown first, keeping distribution even across all 405 colours.
- **Session IDs** — Each browser gets a persistent anonymous ID stored in localStorage.
- **Offline mode** — If the server isn't running, responses are saved to localStorage and will also attempt to sync to the server on each answer.
- **Keyboard shortcuts** — `←` / `A` = left answer, `→` / `D` = right answer, `Space` = neutral.

---

## Deploying publicly (optional)

To collect responses from other people, deploy to any Node.js host:

- **Railway** — `railway up` after linking the project
- **Render** — Connect your GitHub repo, set start command to `node server.js`
- **Fly.io** — `fly launch` then `fly deploy`
- **VPS** — Copy files, run `npm install`, use `pm2 start server.js`

For a public deployment, consider replacing SQLite with a hosted database (e.g. Turso, PlanetScale, or Supabase) and updating the `insertStmt` calls in `server.js`.

---

## Editing the questions

Open `public/index.html` and find the `QUESTIONS` array near the top of the `<script>` block:

```js
const QUESTIONS = [
  { text: "Warm or Cool?",   left: "Warm",   right: "Cool" },
  // ...
];
```

Each question has a `text`, a `left` answer, and a `right` answer. Neutral is always offered as the middle option.
