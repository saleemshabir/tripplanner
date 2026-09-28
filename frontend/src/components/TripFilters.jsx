export default function TripFilters({ filters, onChange, onReset }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  const hasFilters =
    filters.search || filters.status || filters.companion || (filters.sort && filters.sort !== 'date');

  return (
    <div className="filters">
      <div className="filters__search">
        <span className="filters__search-icon" aria-hidden="true">⌕</span>
        <input
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search trips, places, people…"
          aria-label="Search trips"
        />
      </div>

      <div className="filters__row">
        <select value={filters.status} onChange={(e) => set('status', e.target.value)} aria-label="Filter by status">
          <option value="">All trips</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="past">Past</option>
        </select>

        <select value={filters.sort} onChange={(e) => set('sort', e.target.value)} aria-label="Sort trips">
          <option value="date">By date</option>
          <option value="budget">By budget</option>
          <option value="title">By title</option>
        </select>
      </div>

      <input
        className="filters__companion"
        value={filters.companion}
        onChange={(e) => set('companion', e.target.value)}
        placeholder="Filter by companion…"
        aria-label="Filter by travel companion"
      />

      {hasFilters && (
        <button className="filters__reset" onClick={onReset}>
          Clear filters
        </button>
      )}
    </div>
  );
}
