/**
 * State management for scope, week, and data paths
 */

const State = {
  _scope: 'cfb',
  _week: 'current',
  _data: null,
  _searchTerm: '',

  getCurrentScope() {
    return this._scope;
  },

  getCurrentWeek() {
    return this._week;
  },

  setScope(scope) {
    if (scope === 'cfb' || scope === 'nfl') {
      this._scope = scope;
      return true;
    }
    return false;
  },

  setWeek(week) {
    this._week = week;
  },

  setSearchTerm(term) {
    this._searchTerm = term.toLowerCase();
  },

  getSearchTerm() {
    return this._searchTerm;
  },

  setData(data) {
    this._data = data;
  },

  getData() {
    return this._data;
  },

  /**
   * Infer current week number from date
   * Simplified: assume weeks start on Monday, season starts Aug 1
   * In production, this would use actual CFB/NFL schedules
   */
  resolveWeekNumber(date = new Date()) {
    const seasonStart = new Date(date.getFullYear(), 7, 1); // Aug 1
    const diffTime = date - seasonStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    return Math.max(1, Math.min(week, 17)); // Cap at week 17
  },

  /**
   * Generate data file path for given scope and week
   */
  dataPath(scope, week) {
    const weekNum = week === 'current' ? this.resolveWeekNumber() : week;
    const weekStr = String(weekNum).padStart(2, '0');
    return `/data/${scope}/week_${weekStr}.json`;
  },

  /**
   * Get current data path
   */
  getCurrentDataPath() {
    return this.dataPath(this._scope, this._week);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = State;
}

