#!/usr/bin/env node
/**
 * Weekly draft generator
 * Fetches game data, ranks top games, and generates JSON draft
 */

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SEASON = parseInt(process.env.SEASON) || new Date().getFullYear();
const WEEK = parseInt(process.env.WEEK) || 1;
const SCOPE = process.env.SCOPE || 'cfb';

/**
 * Rank games by excitement and importance
 * @param {Array} games - Array of game objects
 * @returns {Array} Ranked and filtered games
 */
function rankGames(games) {
  return games
    .map(game => {
      let score = 0;

      // Upset factor (bigger spread = more exciting)
      const spread = Math.abs(parseFloat(game.spread) || 0);
      if (game.upset) score += spread * 2;

      // One-score finish
      const scoreDiff = Math.abs((game.home_score || 0) - (game.away_score || 0));
      if (scoreDiff <= 8) score += 5;
      if (scoreDiff <= 3) score += 3;

      // Ranked matchup
      if (game.ranked_vs_ranked) score += 4;
      if (game.ranked_vs_unranked && game.upset) score += 6;

      // OT games
      if (game.overtime) score += 3;

      // Lead changes in 4Q
      if (game.lead_changes_4q) score += (game.lead_changes_4q || 0) * 2;

      game._rankScore = score;
      return game;
    })
    .sort((a, b) => b._rankScore - a._rankScore)
    .slice(0, 5)
    .map(game => {
      // Remove internal scoring
      delete game._rankScore;
      return game;
    });
}

/**
 * Generate recap text from game data (template-based)
 * @param {Object} game - Game object
 * @returns {Object} Game with generated text fields
 */
function generateRecap(game) {
  const isClose = Math.abs(game.home_score - game.away_score) <= 8;
  const isUpset = game.upset;
  const winner = game.winner;

  // Simple template-based generation
  const templates = [
    `${winner} overcame ${isUpset ? 'an early deficit' : 'a slow start'} to secure the win.`,
    `The game came down to ${game.turnovers > 0 ? 'turnovers' : 'red-zone efficiency'} in the final quarter.`,
    `Both teams traded scores throughout, but ${winner} pulled away ${game.lead_changes_4q ? 'in the final minutes' : 'midway through the fourth quarter'}.`
  ];

  game.recap_2s = templates.join(' ');
  
  // Generate one stat
  if (game.turnovers > 2) {
    game.one_stat = `Turnover margin ${game.winner === game.home_team ? '+' : '-'}${game.turnovers}`;
  } else if (game.lead_changes_4q) {
    game.one_stat = `${game.lead_changes_4q} lead changes in the 4th quarter`;
  } else {
    game.one_stat = `${game.total_yards > 600 ? 'Combined ' + game.total_yards + ' total yards' : 'Red zone efficiency: ' + (game.redzone_efficiency || 'N/A')}`;
  }

  // Why it mattered
  const reasons = [];
  if (game.defense_stops > 3) reasons.push('Defensive stops on critical downs decided the outcome');
  if (game.special_teams_plays) reasons.push('Special teams execution swung field position');
  if (game.fourth_quarter_comeback) reasons.push('A late rally showcased the winning team\'s resilience');
  
  game.why_it_mattered = reasons.join('. ') || 'Clutch plays in critical moments proved the difference';

  return game;
}

/**
 * Fetch games from API (stub implementation)
 * In production, this would use CFBD API
 */
async function fetchGames(season, week, scope) {
  // Stub: return sample data
  // In production, replace with actual API call:
  // const apiKey = process.env.CFBD_API_KEY;
  // const response = await fetch(`https://api.collegefootballdata.com/games?year=${season}&week=${week}&seasonType=regular`);
  
  console.warn('⚠️  Using stub data. Set CFBD_API_KEY to fetch real data.');
  
  // Sample stub data structure
  return [
    {
      id: `2025-08-30-278-290`,
      home_team: 'Fresno State',
      away_team: 'Georgia Southern',
      home_score: 28,
      away_score: 24,
      completed: true,
      upset: true,
      spread: 14,
      turnovers: 3,
      lead_changes_4q: 0,
      ranked_vs_unranked: true
    }
  ];
}

/**
 * Map API data to our schema
 */
function mapToSchema(game, teamData) {
  return {
    home: {
      name: game.home_team,
      abbr: teamData[game.home_team]?.abbr || game.home_team.substring(0, 4).toUpperCase(),
      logo: teamData[game.home_team]?.logo || ''
    },
    away: {
      name: game.away_team,
      abbr: teamData[game.away_team]?.abbr || game.away_team.substring(0, 4).toUpperCase(),
      logo: teamData[game.away_team]?.logo || ''
    },
    final: `${game.home_score}–${game.away_score}`,
    recap_2s: game.recap_2s || '',
    one_stat: game.one_stat || '',
    why_it_mattered: game.why_it_mattered || '',
    tags: game.tags || [],
    ids: {
      home_id: game.home_id || 0,
      away_id: game.away_id || 0,
      game_id: game.id || ''
    }
  };
}

/**
 * Generate opinions (stub)
 */
function generateOpinions(games) {
  return [
    'Defensive coordinators are winning the early-season chess matches with aggressive third-down schemes.',
    'Quarterback efficiency on first and second down remains the strongest predictor of offensive success.',
    'Red-zone execution separated close games this week; teams that settled for field goals early paid the price later.',
    'Turnover margin continues to be the most reliable indicator of game outcomes, with a +2 swing worth roughly 10 points.'
  ];
}

/**
 * Generate "What's Next" (stub)
 */
function generateWhatsNext(week) {
  return [
    { when: 'Fri', match: 'TBD', hook: 'Friday night spotlight' },
    { when: 'Sat', match: 'TBD', hook: 'Weekend showcase' }
  ];
}

/**
 * Main generator function
 */
async function generateDraft() {
  console.log(`Generating draft for ${SCOPE.toUpperCase()} Week ${WEEK}, ${SEASON}...`);

  // Fetch games
  const games = await fetchGames(SEASON, WEEK, SCOPE);
  if (!games || games.length === 0) {
    console.error('❌ No games found');
    process.exit(1);
  }

  // Rank games
  const ranked = rankGames(games);
  
  // Generate content for each game
  const processedGames = ranked.map(game => {
    const withRecap = generateRecap(game);
    return mapToSchema(withRecap, {});
  });

  // Generate opinions and what's next
  const opinions = generateOpinions(ranked);
  const whatsNext = generateWhatsNext(WEEK);

  // Assemble final data
  const draft = {
    meta: {
      season: SEASON,
      week: WEEK,
      scope: SCOPE,
      generated_at: new Date().toISOString(),
      sources: [`cfbd:v1 games/box; rankings/v1`]
    },
    top_games: processedGames,
    quick_opinions: opinions,
    whats_next: whatsNext
  };

  // Write to file
  const weekStr = String(WEEK).padStart(2, '0');
  const outputPath = join(__dirname, '..', 'data', SCOPE, `week_${weekStr}.json`);
  
  // Ensure directory exists
  mkdirSync(join(__dirname, '..', 'data', SCOPE), { recursive: true });
  
  writeFileSync(outputPath, JSON.stringify(draft, null, 2));
  console.log(`✅ Draft saved to ${outputPath}`);
}

// Run generator
generateDraft().catch(err => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});

