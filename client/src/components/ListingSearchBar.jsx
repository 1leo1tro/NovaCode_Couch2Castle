import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/App.css';

const numericFields = new Set(['minPrice', 'maxPrice', 'minSquareFeet', 'maxSquareFeet']);
const commaFormattedFields = new Set(['minPrice', 'maxPrice']);

const formatWithCommas = (value) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
};

const filterFields = [
  { name: 'minPrice', type: 'text', placeholder: 'Min $', inputMode: 'numeric' },
  { name: 'maxPrice', type: 'text', placeholder: 'Max $', inputMode: 'numeric' },
  { name: 'zipCode', type: 'text', placeholder: 'ZIP Code' },
  {
    name: 'status',
    type: 'select',
    options: [
      { value: '', label: 'All Statuses' },
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending' },
      { value: 'sold', label: 'Sold' },
    ],
  },
];

export default function ListingSearchBar({ filters, onFilterChange, onSearch, placeholder }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (numericFields.has(name)) {
      const digits = value.replace(/\D/g, '');
      onFilterChange(name, digits);
    } else {
      onFilterChange(name, value);
    }
  };

  const activeFilterCount = filterFields
    .map((f) => filters[f.name])
    .filter(Boolean).length;

  return (
    <div className="listings-search" ref={ref}>
      <div className={`listings-search-row ${filtersOpen ? 'filters-open' : ''}`}>
        <form className="listings-search-bar" onSubmit={(e) => { e.preventDefault(); onSearch?.(); }}>
          <svg className="listings-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            name="keyword"
            placeholder={placeholder || 'Address, ZIP code, or keyword'}
            value={filters.keyword}
            onChange={handleChange}
            className="listings-search-input"
          />
          <button type="submit" className="listings-search-btn">
            Search
          </button>
          <button
            type="button"
            className={`listings-filters-btn ${filtersOpen ? 'active' : ''}`}
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="listings-filters-badge">{activeFilterCount}</span>
            )}
          </button>
        </form>
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              className="listings-filters-panel"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {filterFields.map((field) =>
                field.type === 'select' ? (
                  <select
                    key={field.name}
                    name={field.name}
                    value={filters[field.name] || ''}
                    onChange={handleChange}
                    className="listings-filter-select"
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    key={field.name}
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={commaFormattedFields.has(field.name)
                      ? formatWithCommas(filters[field.name] || '')
                      : (filters[field.name] || '')}
                    onChange={handleChange}
                    inputMode={field.inputMode}
                    className="listings-filter-input"
                  />
                )
              )}

              <div className="listings-filter-row">
                <input
                  type="number"
                  name="minSquareFeet"
                  placeholder="Min sqft"
                  value={filters.minSquareFeet || ''}
                  onChange={handleChange}
                  inputMode="numeric"
                  min="0"
                  className="listings-filter-input"
                />
                <input
                  type="number"
                  name="maxSquareFeet"
                  placeholder="Max sqft"
                  value={filters.maxSquareFeet || ''}
                  onChange={handleChange}
                  inputMode="numeric"
                  min="0"
                  className="listings-filter-input"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
