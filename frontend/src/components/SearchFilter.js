import React from 'react';

function SearchFilter({ searchTerm, onSearchChange, filters = [], sortOptions = [], sortValue, onSortChange, resultCount, totalCount }) {
  return (
    <div className="search-filter-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button className="search-clear" onClick={() => onSearchChange('')}>&times;</button>
        )}
      </div>
      <div className="filter-controls">
        {filters.map((filter, i) => (
          <select
            key={i}
            className="filter-select"
            value={filter.value}
            onChange={e => filter.onChange(e.target.value)}
          >
            <option value="">{filter.label}</option>
            {filter.options.map(opt => (
              <option key={opt.value || opt} value={opt.value || opt}>
                {opt.label || opt}
              </option>
            ))}
          </select>
        ))}
        {sortOptions.length > 0 && (
          <select className="filter-select" value={sortValue} onChange={e => onSortChange(e.target.value)}>
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>
      {resultCount !== undefined && (
        <span className="result-count">
          {resultCount === totalCount ? `${totalCount} total` : `${resultCount} of ${totalCount}`}
        </span>
      )}
    </div>
  );
}

export default SearchFilter;
