# Five-Minute Football

A mobile-first, text-dense weekly football digest. Reads like a newsletter, designed for 360–430px mobile screens.

## Features

- **Dense content**: Top 5 games, quick opinions, and what's next
- **Mobile-first**: Optimized for 360–430px viewport widths
- **PWA**: Works offline after first visit
- **Fast**: < 70KB total JS, sub-1.5s LCP target
- **Search**: Real-time filtering of games and opinions
- **Auto-draft**: Weekly automated draft generation via GitHub Actions

## Local Development

### Prerequisites

- Node.js 18+ (for running the draft generator)
- A local web server (Python, PHP, or any static server)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd min-football
   ```

2. **Serve the files**
   
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   
   Using PHP:
   ```bash
   php -S localhost:8000
   ```
   
   Using npx:
   ```bash
   npx serve
   ```

3. **Open in browser**
   
   Navigate to `http://localhost:8000`

   The app will automatically load `data/week_00.example.json` as fallback data.

### Testing PWA Features

1. Open the app in Chrome/Edge
2. Open DevTools > Application > Service Workers
3. Check "Offline"
4. Refresh the page — it should still load

## Draft Generator

### Manual Generation

Generate a draft for a specific week:

```bash
SEASON=2025 WEEK=1 SCOPE=cfb node scripts/generateDraft.mjs
```

This creates `data/cfb/week_01.json`.

**Environment variables:**
- `SEASON` - Year (default: current year)
- `WEEK` - Week number (default: 1)
- `SCOPE` - `cfb` or `nfl` (default: `cfb`)
- `CFBD_API_KEY` - Optional API key for real data fetching

### Using Real API Data

The generator currently uses stub data. To fetch real games:

1. Get a CFBD API key from [collegefootballdata.com](https://collegefootballdata.com/)
2. Set it as an environment variable:
   ```bash
   export CFBD_API_KEY=your_key_here
   ```
3. Uncomment the API fetch code in `scripts/generateDraft.mjs`
4. Run the generator

**Note**: The current implementation requires modifying the generator to uncomment API calls and implement team data mapping.

### Template-Based Content Generation

The generator creates:
- **recap_2s**: Two-sentence game recaps using templates
- **one_stat**: A single standout statistic
- **why_it_mattered**: Cause-and-effect explanation
- **quick_opinions**: 4–8 opinion paragraphs
- **whats_next**: Upcoming matches with hooks

Templates are deterministic and fast. No LLM or generative text.

## Weekly Automation

### GitHub Actions Workflow

The workflow (`.github/workflows/weekly_draft.yml`) runs every Sunday at 9:30 AM UTC.

**How it works:**
1. Calculates the current week number (assumes August 1 season start)
2. Runs `generateDraft.mjs` for each scope in the matrix (`cfb` initially)
3. If new data is generated, creates a branch and opens a PR
4. PR title: `Draft: Week X (SCOPE)`
5. Review and merge to publish

**Manual trigger:**
Go to Actions > Weekly Draft Generator > Run workflow
- Optionally set custom week/scope
- Useful for testing or catching up missed weeks

### Adding NFL Support

1. Update the matrix in `.github/workflows/weekly_draft.yml`:
   ```yaml
   matrix:
     scope: [cfb, nfl]
   ```
2. Modify `generateDraft.mjs` to handle NFL API endpoints
3. The workflow will automatically generate drafts for both scopes

## Overriding a Draft Manually

To manually create or edit a draft:

1. **Create the file directly:**
   ```bash
   mkdir -p data/cfb
   # Edit data/cfb/week_02.json
   ```

2. **Use the generator with custom data:**
   ```bash
   SEASON=2025 WEEK=2 SCOPE=cfb node scripts/generateDraft.mjs
   # Then edit the generated file
   ```

3. **Commit and push:**
   ```bash
   git add data/cfb/week_02.json
   git commit -m "Add manual draft for week 2"
   git push
   ```

## Project Structure

```
min-football/
├── index.html              # Main HTML (minimal, mobile-first)
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker (offline caching)
├── assets/
│   ├── app.js             # Main application logic
│   ├── state.js           # State management (scope/week/data)
│   └── render.js          # Idempotent rendering functions
├── data/
│   ├── week_00.example.json  # Example data (fallback)
│   └── cfb/
│       └── week_01.json      # Weekly drafts (generated)
├── scripts/
│   └── generateDraft.mjs     # Draft generator
├── .github/
│   └── workflows/
│       └── weekly_draft.yml  # Weekly automation
└── README.md
```

## Data Schema

```json
{
  "meta": {
    "season": 2025,
    "week": 1,
    "scope": "cfb",
    "generated_at": "2025-08-31T12:34:56Z",
    "sources": ["cfbd:v1 games/box; rankings/v1"]
  },
  "top_games": [
    {
      "home": {"name": "Team A", "abbr": "TA", "logo": "..."},
      "away": {"name": "Team B", "abbr": "TB", "logo": "..."},
      "final": "28–24",
      "recap_2s": "Two sentences...",
      "one_stat": "Stat description",
      "why_it_mattered": "Cause and effect.",
      "tags": ["upset", "late"],
      "ids": {"home_id": 123, "away_id": 456, "game_id": "..."}
    }
  ],
  "quick_opinions": ["Opinion 1...", "Opinion 2..."],
  "whats_next": [
    {"when": "Sat", "match": "Team A at Team B", "hook": "description"}
  ]
}
```

## Performance Targets

- **JS Bundle**: < 35KB per file, < 70KB total
- **LCP**: < 1.5s on mid-tier phone (Throttled 4x)
- **Lighthouse**: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90

## Browser Support

- Chrome/Edge (full PWA support)
- Firefox (core features)
- Safari (core features, limited PWA)
- Mobile browsers 360px+

## License

[Add your license here]

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Test on mobile viewport (360px)
5. Submit a PR

**Code guidelines:**
- Vanilla JS only (no frameworks)
- Keep spacing tight (no decorative borders/shadows)
- Mobile-first CSS
- Idempotent rendering functions
- Use document fragments for DOM manipulation

