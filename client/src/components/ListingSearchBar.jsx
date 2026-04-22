import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import '../styles/App.css';

const formatWithCommas = (value) => {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
};

const fmt = (n) => n ? `$${Number(n).toLocaleString()}` : null;
const fmtSqft = (n) => n ? `${Number(n).toLocaleString()} sqft` : null;

const BEDS = ['Any', '1+', '2+', '3+', '4+', '5+'];
const BATHS = ['Any', '1+', '1.5+', '2+', '3+', '4+'];
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
];

export default function ListingSearchBar({ filters, onFilterChange, onSearch, onSelectListing, placeholder, alwaysOpen, animatedPlaceholders }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openPopover, setOpenPopover] = useState(null); // 'price' | 'sqft' | null
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchErrors, setSearchErrors] = useState([]);
  const errorIdRef = useRef(0);
  const ref = useRef(null);
  const debounceRef = useRef(null);
  const focusValueRef = useRef(null);
  const open = alwaysOpen || filtersOpen;

  // Typewriter animated placeholder
  const [typedText, setTypedText] = useState('');
  const [phIndex, setPhIndex] = useState(0);
  const typerRef = useRef(null);

  useEffect(() => {
    if (!animatedPlaceholders?.length) return;

    let cancelled = false;
    const phrase = animatedPlaceholders[phIndex];

    const schedule = (fn, ms) => {
      typerRef.current = setTimeout(() => { if (!cancelled) fn(); }, ms);
    };

    const typeOut = (i = 0) => {
      if (i <= phrase.length) {
        setTypedText(phrase.slice(0, i));
        schedule(() => typeOut(i + 1), 55);
      } else {
        schedule(() => deleteBack(phrase.length), 1400);
      }
    };

    const deleteBack = (i) => {
      if (i >= 0) {
        setTypedText(phrase.slice(0, i));
        schedule(() => deleteBack(i - 1), 30);
      } else {
        schedule(() => {
          setPhIndex(idx => (idx + 1) % animatedPlaceholders.length);
        }, 300);
      }
    };

    schedule(() => typeOut(0), 400);

    return () => {
      cancelled = true;
      clearTimeout(typerRef.current);
    };
  }, [phIndex, animatedPlaceholders]);

  useEffect(() => {
    if (alwaysOpen) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setFiltersOpen(false);
        setShowSuggestions(false);
        setOpenPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [alwaysOpen]);

  // Close popover on outside click
  useEffect(() => {
    if (!openPopover) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpenPopover(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPopover]);

  const fetchSuggestions = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q || q.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/listings/suggest?q=${encodeURIComponent(q)}`);
        setSuggestions(res.data.suggestions || []);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  }, []);

  const INVALID_PATTERN = /[`<>{}\[\]\\;|^*~]/;

  const pushError = () => {
    setSearchErrors(prev => {
      if (prev.length >= 3) return prev;
      const id = ++errorIdRef.current;
      setTimeout(() => {
        setSearchErrors(cur => cur.filter(e => e !== id));
      }, 3000);
      return [...prev, id];
    });
  };

  const handleKeywordChange = (e) => {
    const val = e.target.value;
    onFilterChange('keyword', val);
    fetchSuggestions(val);
  };

  const selectSuggestion = (suggestion) => {
    setSuggestions([]);
    setShowSuggestions(false);
    if (suggestion.type === 'address' && suggestion.id) {
      onSelectListing?.(suggestion.id);
    } else {
      onFilterChange('keyword', suggestion.label);
      onSearch?.();
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); selectSuggestion(suggestions[activeIndex]); }
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  const handleSelectChange = (name, value) => {
    onFilterChange(name, value);
    onSearch?.();
  };

  const clearAll = () => {
    ['keyword', 'minPrice', 'maxPrice', 'zipCode', 'minSquareFeet', 'maxSquareFeet', 'minBedrooms', 'minBathrooms']
      .forEach(k => onFilterChange(k, ''));
    onFilterChange('exactBedrooms', false);
    onFilterChange('exactBathrooms', false);
    onFilterChange('status', 'active');
    setOpenPopover(null);
    onSearch?.();
  };

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.zipCode ||
    filters.minSquareFeet || filters.maxSquareFeet || filters.minBedrooms || filters.minBathrooms ||
    (filters.status && filters.status !== 'active');

  // Price popover label
  const priceLabel = (() => {
    const mn = fmt(filters.minPrice);
    const mx = fmt(filters.maxPrice);
    if (mn && mx) return `${mn} – ${mx}`;
    if (mn) return `${mn}+`;
    if (mx) return `Under ${mx}`;
    return 'Any price';
  })();

  // Sqft popover label
  const sqftLabel = (() => {
    const mn = fmtSqft(filters.minSquareFeet);
    const mx = fmtSqft(filters.maxSquareFeet);
    if (mn && mx) return `${mn} – ${mx}`;
    if (mn) return `${mn}+`;
    if (mx) return `Under ${mx}`;
    return 'Any size';
  })();

  const isPriceActive = !!(filters.minPrice || filters.maxPrice);
  const isSqftActive = !!(filters.minSquareFeet || filters.maxSquareFeet);

  return (
    <div className="listings-search" ref={ref}>
      {/* Search bar */}
      <form
        className="listings-search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          if (INVALID_PATTERN.test(filters.keyword)) {
            pushError();
            return;
          }
          setSearchErrors([]);
          setShowSuggestions(false);
          onSearch?.();
        }}
      >
        <svg className="listings-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <div className="listings-search-input-wrap">
          <input
            type="text"
            name="keyword"
            placeholder={animatedPlaceholders?.length ? '' : (placeholder || 'Address, city, ZIP code, or keyword')}
            value={filters.keyword}
            onChange={handleKeywordChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length && setShowSuggestions(true)}
            className="listings-search-input"
            autoComplete="off"
          />
          {animatedPlaceholders?.length > 0 && !filters.keyword && (
            <span className="hero-search-placeholder hero-search-placeholder--visible" aria-hidden="true">
              {typedText}<span className="hero-search-cursor">|</span>
            </span>
          )}
          {filters.keyword && (
            <button
              type="button"
              className="listings-search-clear"
              aria-label="Clear search"
              onClick={() => {
                onFilterChange('keyword', '');
                setSuggestions([]);
                setShowSuggestions(false);
                onSearch?.();
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.ul
                className="listings-suggestions"
                initial={{ opacity: 0, scaleY: 0.85, y: -8, transformOrigin: 'top center' }}
                animate={{ opacity: 1, scaleY: 1, y: 0, transformOrigin: 'top center' }}
                exit={{ opacity: 0, scaleY: 0.85, y: -8, transformOrigin: 'top center' }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    className={`listings-suggestion-item${i === activeIndex ? ' listings-suggestion-item--active' : ''}`}
                    onMouseDown={() => selectSuggestion(s)}
                  >
                    {s.type === 'city' ? (
                      <svg className="listings-suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5"/>
                      </svg>
                    ) : (
                      <svg className="listings-suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                        <path d="M9 21V12h6v9"/>
                      </svg>
                    )}
                    {s.label}
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <button type="submit" className="listings-search-btn">Search</button>
      </form>

      {/* Invalid input popup */}
      <AnimatePresence>
        {searchErrors.length > 0 && (
          <motion.div
            className="search-invalid-popup"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <span className="search-invalid-popup__arrow" />
            {searchErrors.map((id) => (
              <div key={id} className="search-invalid-popup__line">
                Sorry, we didn't get that — please use letters, numbers, or spaces.
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter bar */}
      {open && (
        <div className="lsf-bar">

          {/* Status */}
          <div className="lsf-group">
            <span className="lsf-label">Status</span>
            <select
              className="lsf-select"
              value={filters.status || ''}
              onChange={e => handleSelectChange('status', e.target.value)}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="lsf-divider" />

          {/* Price — custom popover */}
          <div className="lsf-group lsf-group--popover">
            <span className="lsf-label">Price</span>
            <button
              type="button"
              className={`lsf-select lsf-popover-trigger${isPriceActive ? ' lsf-select--active' : ''}`}
              onClick={() => setOpenPopover(openPopover === 'price' ? null : 'price')}
            >
              {priceLabel}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10" style={{ marginLeft: 4, flexShrink: 0 }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {openPopover === 'price' && (
              <div className="lsf-popover">
                <p className="lsf-popover-title">Price range</p>
                <div className="lsf-popover-row">
                  <div className="lsf-popover-field">
                    <label>Min</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="No min"
                      value={formatWithCommas(filters.minPrice)}
                      onFocus={e => { focusValueRef.current = e.target.value; }}
                      onChange={e => onFilterChange('minPrice', e.target.value.replace(/\D/g, ''))}
                      onBlur={e => { if (e.target.value !== focusValueRef.current) onSearch?.(); }}
                      className="lsf-popover-input"
                      autoFocus
                    />
                  </div>
                  <span className="lsf-range-sep">–</span>
                  <div className="lsf-popover-field">
                    <label>Max</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="No max"
                      value={formatWithCommas(filters.maxPrice)}
                      onFocus={e => { focusValueRef.current = e.target.value; }}
                      onChange={e => onFilterChange('maxPrice', e.target.value.replace(/\D/g, ''))}
                      onBlur={e => { if (e.target.value !== focusValueRef.current) onSearch?.(); }}
                      className="lsf-popover-input"
                    />
                  </div>
                </div>
                <div className="lsf-popover-actions">
                  <button type="button" className="lsf-popover-clear" onClick={() => { onFilterChange('minPrice', ''); onFilterChange('maxPrice', ''); onSearch?.(); setOpenPopover(null); }}>Clear</button>
                  <button type="button" className="lsf-popover-apply" onClick={() => { onSearch?.(); setOpenPopover(null); }}>Apply</button>
                </div>
              </div>
            )}
          </div>

          <div className="lsf-divider" />

          {/* Beds & Baths — combined popover */}
          <div className="lsf-group lsf-group--popover">
            <button
              type="button"
              className={`lsf-select lsf-popover-trigger${(filters.minBedrooms || filters.minBathrooms) ? ' lsf-select--active' : ''}`}
              onClick={() => setOpenPopover(openPopover === 'bedbath' ? null : 'bedbath')}
            >
              {filters.minBedrooms || filters.minBathrooms
                ? [filters.minBedrooms && `${filters.minBedrooms}+ bd`, filters.minBathrooms && `${filters.minBathrooms}+ ba`].filter(Boolean).join(', ')
                : 'Beds & baths'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10" style={{ marginLeft: 4, flexShrink: 0 }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>

            {openPopover === 'bedbath' && (
              <div className="lsf-popover lsf-popover--bedbath">
                <p className="lsf-popover-title">Number of Bedrooms</p>
                <p className="lsf-popover-sub">Bedrooms</p>
                <div className="lsf-popover-pills">
                  {BEDS.map(label => {
                    const val = label === 'Any' ? '' : label.replace('+', '');
                    return (
                      <button
                        key={label}
                        type="button"
                        className={`lsf-ppill${filters.minBedrooms === val ? ' lsf-ppill--active' : ''}`}
                        onClick={() => onFilterChange('minBedrooms', val)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <label className="lsf-popover-exact">
                  <input
                    type="checkbox"
                    checked={!!filters.exactBedrooms}
                    onChange={e => onFilterChange('exactBedrooms', e.target.checked)}
                  />
                  Use exact match
                </label>

                <p className="lsf-popover-title" style={{ marginTop: '0.5rem' }}>Number of Bathrooms</p>
                <p className="lsf-popover-sub">Bathrooms</p>
                <div className="lsf-popover-pills">
                  {BATHS.map(label => {
                    const val = label === 'Any' ? '' : label.replace('+', '');
                    return (
                      <button
                        key={label}
                        type="button"
                        className={`lsf-ppill${filters.minBathrooms === val ? ' lsf-ppill--active' : ''}`}
                        onClick={() => onFilterChange('minBathrooms', val)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <label className="lsf-popover-exact">
                  <input
                    type="checkbox"
                    checked={!!filters.exactBathrooms}
                    onChange={e => onFilterChange('exactBathrooms', e.target.checked)}
                  />
                  Use exact match
                </label>

                <div className="lsf-popover-actions">
                  <button type="button" className="lsf-popover-clear" onClick={() => {
                    onFilterChange('minBedrooms', '');
                    onFilterChange('minBathrooms', '');
                    onFilterChange('exactBedrooms', false);
                    onFilterChange('exactBathrooms', false);
                    onSearch?.();
                    setOpenPopover(null);
                  }}>Clear</button>
                  <button type="button" className="lsf-popover-apply" onClick={() => { onSearch?.(); setOpenPopover(null); }}>Apply</button>
                </div>
              </div>
            )}
          </div>

          <div className="lsf-divider" />

          {/* Sq Ft — custom popover */}
          <div className="lsf-group lsf-group--popover">
            <span className="lsf-label">Sq Ft</span>
            <button
              type="button"
              className={`lsf-select lsf-popover-trigger${isSqftActive ? ' lsf-select--active' : ''}`}
              onClick={() => setOpenPopover(openPopover === 'sqft' ? null : 'sqft')}
            >
              {sqftLabel}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10" style={{ marginLeft: 4, flexShrink: 0 }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {openPopover === 'sqft' && (
              <div className="lsf-popover">
                <p className="lsf-popover-title">Square footage</p>
                <div className="lsf-popover-row">
                  <div className="lsf-popover-field">
                    <label>Min</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="No min"
                      value={formatWithCommas(filters.minSquareFeet)}
                      onFocus={e => { focusValueRef.current = e.target.value; }}
                      onChange={e => onFilterChange('minSquareFeet', e.target.value.replace(/\D/g, ''))}
                      onBlur={e => { if (e.target.value !== focusValueRef.current) onSearch?.(); }}
                      className="lsf-popover-input"
                      autoFocus
                    />
                  </div>
                  <span className="lsf-range-sep">–</span>
                  <div className="lsf-popover-field">
                    <label>Max</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="No max"
                      value={formatWithCommas(filters.maxSquareFeet)}
                      onFocus={e => { focusValueRef.current = e.target.value; }}
                      onChange={e => onFilterChange('maxSquareFeet', e.target.value.replace(/\D/g, ''))}
                      onBlur={e => { if (e.target.value !== focusValueRef.current) onSearch?.(); }}
                      className="lsf-popover-input"
                    />
                  </div>
                </div>
                <div className="lsf-popover-actions">
                  <button type="button" className="lsf-popover-clear" onClick={() => { onFilterChange('minSquareFeet', ''); onFilterChange('maxSquareFeet', ''); onSearch?.(); setOpenPopover(null); }}>Clear</button>
                  <button type="button" className="lsf-popover-apply" onClick={() => { onSearch?.(); setOpenPopover(null); }}>Apply</button>
                </div>
              </div>
            )}
          </div>

          <div className="lsf-divider" />

          {/* ZIP */}
          <div className="lsf-group">
            <span className="lsf-label">ZIP</span>
            <input
              type="text"
              placeholder="ZIP Code"
              value={filters.zipCode || ''}
              onFocus={e => { focusValueRef.current = e.target.value; }}
              onChange={(e) => onFilterChange('zipCode', e.target.value)}
              onBlur={e => { if (e.target.value !== focusValueRef.current) onSearch?.(); }}
              className="lsf-select"
              style={{ width: 76 }}
            />
          </div>

          {hasActiveFilters && (
            <>
              <div className="lsf-divider" />
              <button type="button" className="lsf-clear" onClick={clearAll}>Clear all</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
