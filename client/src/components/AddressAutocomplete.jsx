import { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/AddressAutocomplete.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const GEOCODE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

/**
 * AddressAutocomplete
 *
 * Props:
 *   value        {string}   - controlled input value
 *   onChange     {fn}       - called with { address, zipCode, coordinates: [lng, lat] }
 *                             when the user selects a verified result, or
 *                             { address: '', zipCode: '', coordinates: null } when they clear
 *   onRawChange  {fn}       - called with raw string as user types (optional)
 *   error        {string}   - validation error message to display
 *   verified     {boolean}  - whether the current value is geocoder-verified
 */
const AddressAutocomplete = ({ value, onChange, onRawChange, error, verified }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  // Sync external value changes (e.g. when EditListing prefills the address)
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (text) => {
    if (!MAPBOX_TOKEN || !text || text.length < 4) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const encoded = encodeURIComponent(text);
      const res = await fetch(
        `${GEOCODE_URL}/${encoded}.json?access_token=${MAPBOX_TOKEN}&country=us&types=address&autocomplete=true&limit=5`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    setShowDropdown(true);

    // Notify parent that the value is now unverified (user is typing)
    onChange({ address: '', zipCode: '', coordinates: null });
    if (onRawChange) onRawChange(text);

    // Debounce geocoding calls
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => search(text), 300);
  };

  const handleSelect = (feature) => {
    const address = feature.place_name;

    // Extract ZIP code from context
    const zipContext = feature.context?.find(c => c.id.startsWith('postcode'));
    const zipCode = zipContext?.text || '';

    const [lng, lat] = feature.geometry.coordinates;

    setQuery(address);
    setSuggestions([]);
    setShowDropdown(false);

    onChange({ address, zipCode, coordinates: [lng, lat] });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    onChange({ address: '', zipCode: '', coordinates: null });
    if (onRawChange) onRawChange('');
  };

  const noToken = !MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.YOUR_TOKEN_HERE';

  return (
    <div className="address-autocomplete" ref={wrapperRef}>
      {noToken && (
        <div className="address-autocomplete-no-token">
          Add VITE_MAPBOX_TOKEN to client/.env to enable address verification
        </div>
      )}
      <div className="address-autocomplete-input-wrap">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 4 && setShowDropdown(true)}
          placeholder="Start typing an address..."
          className={`address-autocomplete-input${error ? ' input-error' : ''}${verified ? ' input-verified' : ''}`}
          autoComplete="off"
          disabled={noToken}
        />
        {verified && (
          <span className="address-autocomplete-verified-badge" title="Address verified">✓</span>
        )}
        {query && !noToken && (
          <button
            type="button"
            className="address-autocomplete-clear"
            onClick={handleClear}
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <ul className="address-autocomplete-dropdown">
          {suggestions.map((feature) => (
            <li
              key={feature.id}
              className="address-autocomplete-option"
              onMouseDown={() => handleSelect(feature)}
            >
              <span className="address-autocomplete-option-main">
                {feature.text}
              </span>
              <span className="address-autocomplete-option-sub">
                {feature.place_name.replace(`${feature.text}, `, '')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && !loading && query.length >= 4 && suggestions.length === 0 && (
        <div className="address-autocomplete-empty">
          No matching US addresses found
        </div>
      )}

      {!verified && query.length > 0 && !showDropdown && (
        <span className="address-autocomplete-hint">
          Select an address from the dropdown to verify it
        </span>
      )}

      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default AddressAutocomplete;
