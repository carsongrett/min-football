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
const API_KEY = process.env.CFBD_API_KEY;

/**
 * Rank games by excitement and importance
 * @param {Array} games - Array of game objects
 * @returns {Array} Ranked and filtered games
 */
function rankGames(games) {
  // Filter to completed games only
  const completed = games.filter(g => g.completed && g.home_points !== null && g.away_points !== null);
  
  return completed
    .map(game => {
      let score = 0;
      const homeScore = game.home_points || 0;
      const awayScore = game.away_points || 0;
      const scoreDiff = Math.abs(homeScore - awayScore);
      const totalPoints = homeScore + awayScore;

      // One-score finish (very exciting)
      if (scoreDiff <= 8) score += 6;
      if (scoreDiff <= 3) score += 4;
      if (scoreDiff === 0) score += 3; // Ties

      // High-scoring shootout
      if (totalPoints > 70) score += 3;
      if (totalPoints > 80) score += 2;

      // Conference game gets small boost
      if (game.conference_game) score += 1;

      // Overtime games get extra points
      if (game.periods === 5) score += 4; // 1 OT
      if (game.periods > 5) score += 6;   // Multiple OTs

      game._rankScore = score;
      game._scoreDiff = scoreDiff;
      game._totalPoints = totalPoints;
      game._winner = homeScore > awayScore ? 'home' : 'away';
      return game;
    })
    .sort((a, b) => b._rankScore - a._rankScore)
    .slice(0, 5)
    .map(game => {
      // Keep internal data for recap generation
      return game;
    });
}

/**
 * Generate recap text from game data (template-based)
 * @param {Object} game - Game object
 * @returns {Object} Game with generated text fields
 */
function generateRecap(game) {
  const homeScore = game.home_points || 0;
  const awayScore = game.away_points || 0;
  const scoreDiff = game._scoreDiff;
  const totalPoints = game._totalPoints;
  const winner = game._winner;
  const wonTeam = winner === 'home' ? game.home_team : game.away_team;
  const lostTeam = winner === 'away' ? game.home_team : game.away_team;

  const isClose = scoreDiff <= 8;
  const isShootout = totalPoints > 70;
  const isOvertime = game.periods > 4;

  let sentence1 = '';
  if (isOvertime) {
    sentence1 = `${wonTeam} survived ${isShootout ? 'a back-and-forth shootout' : 'a tight contest'} that required overtime to decide.`;
  } else if (isClose) {
    sentence1 = isShootout 
      ? `In a high-scoring affair, ${wonTeam} edged ${lostTeam} by ${scoreDiff} point${scoreDiff !== 1 ? 's' : ''}.`
      : `${wonTeam} pulled out a narrow ${scoreDiff}-point victory over ${lostTeam}.`;
  } else {
    sentence1 = `${wonTeam} took control ${isShootout ? 'in the shootout' : 'early'} and maintained their lead throughout.`;
  }

  const sentence2 = isShootout
    ? `Both teams' offenses moved the ball effectively, but ${winner === 'home' ? wonTeam + ' managed to get more stops' : lostTeam + ' fell short on crucial drives'}.`
    : `The decisive moments came ${isClose ? 'late in the game' : 'when the winning team established momentum'}.`;

  game.recap_2s = `${sentence1} ${sentence2}`;
  
  if (isOvertime) {
    game.one_stat = `${game.periods} periods total`;
  } else if (isShootout) {
    game.one_stat = `Combined ${totalPoints} points`;
  } else if (isClose) {
    game.one_stat = `${scoreDiff}-point margin`;
  } else {
    game.one_stat = `${wonTeam} won by ${scoreDiff}`;
  }

  const whyOptions = [
    'Both teams showed resilience, but execution in key moments made the difference.',
    isShootout ? 'The high-scoring affair showcased explosive offenses struggling to get defensive stops.' : 'Defensive discipline and limiting mistakes proved critical in the outcome.',
    isClose ? 'A single big play or stop swung momentum in this tightly contested game.' : 'The winner established control and never let their opponent back in the game.'
  ];
  game.why_it_mattered = whyOptions[Math.floor(Math.random() * whyOptions.length)];

  return game;
}

/**
 * Fetch games from CFBD API or use stub
 */
async function fetchGames(season, week, scope) {
  if (!API_KEY) {
    console.warn('⚠️  No CFBD_API_KEY set. Using stub data.');
    return getStubGames();
  }

  try {
    console.log(`📡 Fetching games from CFBD API...`);
    
    // Fetch games for the week
    const gamesUrl = `https://api.collegefootballdata.com/games?year=${season}&week=${week}&seasonType=regular`;
    const gamesResponse = await fetch(gamesUrl, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });

    if (!gamesResponse.ok) {
      throw new Error(`API error: ${gamesResponse.status}`);
    }

    const games = await gamesResponse.json();
    console.log(`✓ Found ${games.length} games`);

    // Return games (box scores can be added later if needed)
    return games;
  } catch (error) {
    console.error('❌ API fetch failed:', error.message);
    console.warn('⚠️  Falling back to stub data.');
    return getStubGames();
  }
}

/**
 * Return stub data when API is unavailable
 */
function getStubGames() {
  return [
    {
      id: `2025-08-30-278-290`,
      home_team: 'Fresno State',
      away_team: 'Georgia Southern',
      home_points: 28,
      away_points: 24,
      completed: true
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
    final: `${game.home_points}–${game.away_points}`,
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

