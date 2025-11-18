# API Setup Guide

## Overview

The draft generator is now ready to integrate with the College Football Data (CFBD) API. When you provide an API key, it will automatically fetch real game data.

## Setup Steps

### 1. Get Your API Key

1. Go to https://collegefootballdata.com/
2. Sign up for a free account
3. Navigate to your account settings to get your API key
4. Copy the key

### 2. Set the API Key

**Option A: Environment Variable (Recommended for local testing)**
```bash
# Windows PowerShell
$env:CFBD_API_KEY="your_key_here"

# Windows CMD
set CFBD_API_KEY=your_key_here

# Linux/Mac
export CFBD_API_KEY="your_key_here"
```

**Option B: GitHub Secrets (For GitHub Actions)**
1. Go to your repository on GitHub
2. Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `CFBD_API_KEY`
5. Value: your API key
6. Click "Add secret"

### 3. Test the Generator

Run the generator with your API key:
```bash
# Generate a draft for a specific week
SEASON=2025 WEEK=1 SCOPE=cfb node scripts/generateDraft.mjs

# Or use npm script (make sure to export CFBD_API_KEY first)
npm run generate
```

## What the API Fetches

The generator fetches:
- **Games**: All games for the specified week
- **Scores**: Final scores for completed games
- **Metadata**: Conference info, overtime periods, etc.

## How It Works

1. **Fetch Games**: Calls `/games` endpoint for the week
2. **Rank Games**: Applies scoring algorithm to find most exciting games
3. **Generate Recaps**: Creates template-based recaps from game data
4. **Output JSON**: Saves to `data/cfb/week_XX.json`

## Ranking Algorithm

Games are ranked by excitement score:
- ✅ Close games (≤8 point margin): +6 points
- ✅ Very close (≤3 point margin): +4 points
- ✅ Overtime games: +4–6 points
- ✅ High-scoring shootouts (70+ points): +3–5 points
- ✅ Conference games: +1 point

Top 5 games by score are included in the draft.

## Fallback Behavior

If the API is unavailable or no key is set, the generator:
- Shows a warning message
- Uses stub data from the function
- Still creates a valid JSON file

This ensures the GitHub Action won't fail even if the API is down.

## Weekly Automation

Once you add the API key to GitHub Secrets, the automated workflow will:
- Run every Sunday at 9:30 AM UTC
- Automatically fetch the latest games
- Create a PR with the new draft
- Ready for review and merge

## Troubleshooting

**"API error: 401"**
- Your API key is invalid or expired
- Check that you copied the full key
- Verify the key in your CFBD account

**"API error: 429"**
- Rate limit exceeded
- Free tier has limits (check CFBD documentation)
- Consider upgrading or reducing calls

**"No games found"**
- Week number may be incorrect for the season
- Games haven't been completed yet
- Check SEASON and WEEK environment variables

## Next Steps

1. ✅ Add your API key to GitHub Secrets
2. ✅ Test locally with `node scripts/generateDraft.mjs`
3. ✅ Review the generated JSON structure
4. ✅ Adjust templates in `generateRecap()` if needed
5. ✅ Merge your first automated PR when it appears on Sunday

## API Documentation

Full API docs: https://collegefootballdata.com/support/api

Key endpoints used:
- `GET /games` - List of games
- (Future) `GET /games/box` - Detailed box scores


