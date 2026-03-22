import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/App.css';

const filterFields = [
  { name: 'minPrice', type: 'number', placeholder: 'Min $', min: '0' },
  { name: 'maxPrice', type: 'number', placeholder: 'Max $', min: '0' },
  { name: 'zipCode', type: 'text', placeholder: 'ZIP Code' },
  {
    name: 'status',
    type: 'select',
    options: [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending' },
      { value: 'sold', label: 'Sold' },
    ],
  },
  { name: 'minSquareFeet', type: 'number', placeholder: 'Min sqft', min: '0' },
  { name: 'maxSquareFeet', type: 'number', placeholder: 'Max sqft', min: '0' },
];

export default function ListingSearchBar({ filters, onFilterChange, placeholder }) {
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
    onFilterChange(name, value);
  };

  const activeFilterCount = filterFields
    .map((f) => filters[f.name])
    .filter(Boolean).length;

  return (
    <div className="listings-search" ref={ref}>
      <div className={`listings-search-row ${filtersOpen ? 'filters-open' : ''}`}>
        <form className="listings-search-bar" onSubmit={(e) => e.preventDefault()}>
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
                    value={filters[field.name] || ''}
                    onChange={handleChange}
                    min={field.min}
                    className="listings-filter-input"
                  />
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
