/**
 * Main application logic
 * Wires state, render, and DOM interactions
 */

(function() {
  'use strict';

  /**
   * Load JSON data from path
   */
  async function loadData(path) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      State.setData(data);
      return data;
    } catch (error) {
      console.warn(`Failed to load ${path}:`, error.message);
      return null;
    }
  }

  /**
   * Load fallback example data
   */
  async function loadFallback() {
    let data = await loadData('/data/week_00.example.json');
    
    // Also try fallback path in case structure is different
    if (!data) {
      data = await loadData('data/week_00.example.json');
    }
    
    if (data) {
      State.setData(data);
      return data;
    }
    return null;
  }

  /**
   * Render all sections with current data
   */
  function renderAll(data) {
    if (!data) {
      // Show "no draft" for all sections
      Render.renderTopGames([]);
      Render.renderOpinions([]);
      Render.renderWhatsNext([]);
      return;
    }

    Render.renderTopGames(data.top_games || []);
    Render.renderOpinions(data.quick_opinions || []);
    Render.renderWhatsNext(data.whats_next || []);
    Render.renderMeta(data.meta || {});
  }

  /**
   * Initialize and load current week data
   */
  async function initialize() {
    const scope = State.getCurrentScope();
    const week = State.getCurrentWeek();
    const path = State.dataPath(scope, week);

    let data = await loadData(path);

    // Fallback to example data if needed
    if (!data) {
      data = await loadFallback();
    }

    renderAll(data);
  }

  /**
   * Populate week selector
   */
  function populateWeekSelector() {
    const select = document.getElementById('week-select');
    if (!select) return;

    const currentWeek = State.resolveWeekNumber();
    
    for (let i = currentWeek; i >= 1; i--) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `Week ${i}`;
      select.appendChild(option);
    }

    // Add example option
    const exampleOption = document.createElement('option');
    exampleOption.value = 0;
    exampleOption.textContent = 'Example';
    select.appendChild(exampleOption);
  }

  /**
   * Handle scope change
   */
  async function handleScopeChange(event) {
    const scope = event.target.value;
    State.setScope(scope);

    await loadAndRender();
  }

  /**
   * Handle week change
   */
  async function handleWeekChange(event) {
    const week = event.target.value === 'current' ? 'current' : parseInt(event.target.value);
    State.setWeek(week);

    await loadAndRender();
  }

  /**
   * Handle search input
   */
  function handleSearch(event) {
    const term = event.target.value;
    State.setSearchTerm(term);

    // Debounce search for performance
    clearTimeout(handleSearch.timer);
    handleSearch.timer = setTimeout(() => {
      Render.applySearchFilter();
    }, 10);
  }

  /**
   * Load and render data based on current state
   */
  async function loadAndRender() {
    const scope = State.getCurrentScope();
    const week = State.getCurrentWeek();
    const path = State.dataPath(scope, week);

    let data = await loadData(path);

    // If no data and not week 0 (example), show no draft
    if (!data && week !== 0) {
      renderAll(null);
      return;
    }

    // For week 0, use example as fallback
    if (!data && week === 0) {
      data = await loadFallback();
    }

    renderAll(data);
  }

  /**
   * Main initialization
   */
  function init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered:', reg))
        .catch(err => console.error('SW registration failed:', err));
    }

    // Setup event listeners
    const scopeSelect = document.getElementById('scope-select');
    const weekSelect = document.getElementById('week-select');
    const searchInput = document.getElementById('search');

    if (scopeSelect) {
      scopeSelect.addEventListener('change', handleScopeChange);
    }

    if (weekSelect) {
      weekSelect.addEventListener('change', handleWeekChange);
      populateWeekSelector();
    }

    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    }

    // Initial load
    initialize();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

