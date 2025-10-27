/**
 * Idempotent rendering functions for game data
 * Uses document fragments for performance
 */

const Render = {
  /**
   * Renders top games section
   * @param {Array} games - Array of game objects
   */
  renderTopGames(games) {
    const container = document.querySelector('#top-games .games');
    if (!container) return;

    container.innerHTML = '';

    if (!games || games.length === 0) {
      const note = document.createElement('div');
      note.className = 'no-draft';
      note.textContent = 'Draft not ready yet';
      container.appendChild(note);
      return;
    }

    const fragment = document.createDocumentFragment();
    const searchTerm = State.getSearchTerm();

    for (const game of games) {
      const gameEl = this._createGameElement(game);
      
      // Apply search filter if active
      if (searchTerm) {
        const searchText = this._getGameSearchText(game);
        if (!searchText.includes(searchTerm)) {
          gameEl.style.display = 'none';
        }
      }
      
      fragment.appendChild(gameEl);
    }

    container.appendChild(fragment);
  },

  /**
   * Creates a single game element
   * @private
   */
  _createGameElement(game) {
    const html = this._getGameHTML(game);
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    return temp.firstElementChild; // Return the .game div
  },

  /**
   * Get HTML for a single game
   * @private
   */
  _getGameHTML(game) {
    const home = game.home || {};
    const away = game.away || {};
    const homeLogo = home.logo ? `<img src="${home.logo}" alt="" class="game-logo">` : `<span>${home.abbr || home.name}</span>`;
    const awayLogo = away.logo ? `<img src="${away.logo}" alt="" class="game-logo">` : `<span>${away.abbr || away.name}</span>`;

    return `
      <div class="game">
        <div class="game-header">
          ${awayLogo} ${away.name || ''} at ${homeLogo} ${home.name || ''}
          <span class="game-final">${game.final || ''}</span>
        </div>
        <div class="game-recap">${game.recap_2s || ''}</div>
        ${game.one_stat ? `<div class="game-stat">${game.one_stat}</div>` : ''}
        ${game.why_it_mattered ? `<div class="game-why">${game.why_it_mattered}</div>` : ''}
      </div>
    `.trim();
  },

  /**
   * Extract searchable text from a game
   * @private
   */
  _getGameSearchText(game) {
    const parts = [
      game.home?.name || '',
      game.home?.abbr || '',
      game.away?.name || '',
      game.away?.abbr || '',
      game.recap_2s || '',
      game.one_stat || '',
      game.why_it_mattered || '',
      (game.tags || []).join(' ')
    ];
    return parts.join(' ').toLowerCase();
  },

  /**
   * Renders opinions section
   * @param {Array} opinions - Array of opinion strings
   */
  renderOpinions(opinions) {
    const container = document.querySelector('#quick-opinions .body');
    if (!container) return;

    container.innerHTML = '';

    if (!opinions || opinions.length === 0) {
      const note = document.createElement('div');
      note.className = 'no-draft';
      note.textContent = 'Draft not ready yet';
      container.appendChild(note);
      return;
    }

    const fragment = document.createDocumentFragment();
    const searchTerm = State.getSearchTerm();

    for (const opinion of opinions) {
      const opinionEl = document.createElement('div');
      opinionEl.className = 'opinion';
      opinionEl.textContent = opinion;
      
      if (searchTerm && !opinion.toLowerCase().includes(searchTerm)) {
        opinionEl.style.display = 'none';
      }
      
      fragment.appendChild(opinionEl);
    }

    container.appendChild(fragment);
  },

  /**
   * Renders "What's Next" section
   * @param {Array} nextItems - Array of next items
   */
  renderWhatsNext(nextItems) {
    const container = document.querySelector('#whats-next .body');
    if (!container) return;

    container.innerHTML = '';

    if (!nextItems || nextItems.length === 0) {
      const note = document.createElement('div');
      note.className = 'no-draft';
      note.textContent = 'Draft not ready yet';
      container.appendChild(note);
      return;
    }

    const fragment = document.createDocumentFragment();
    const searchTerm = State.getSearchTerm();

    for (const item of nextItems) {
      const nextEl = document.createElement('div');
      nextEl.className = 'next-match';
      nextEl.innerHTML = `<strong>${item.when}:</strong> ${item.match} — ${item.hook || ''}`;
      
      if (searchTerm && !nextEl.textContent.toLowerCase().includes(searchTerm)) {
        nextEl.style.display = 'none';
      }
      
      fragment.appendChild(nextEl);
    }

    container.appendChild(fragment);
  },

  /**
   * Renders meta information
   * @param {Object} meta - Meta object with generated_at, week, etc.
   */
  renderMeta(meta) {
    if (!meta) return;

    // Update document title
    const week = meta.week || '';
    document.title = `Five-Minute Football${week ? ` — Week ${week}` : ''}`;

    // Update updated text
    const updatedEl = document.querySelector('#updated');
    if (updatedEl && meta.generated_at) {
      const date = new Date(meta.generated_at);
      updatedEl.textContent = `Updated ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  },

  /**
   * Apply search filter to all sections
   */
  applySearchFilter() {
    const data = State.getData();
    if (!data) return;

    // Re-render all sections with filter applied
    this.renderTopGames(data.top_games);
    this.renderOpinions(data.quick_opinions);
    this.renderWhatsNext(data.whats_next);
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Render;
}

