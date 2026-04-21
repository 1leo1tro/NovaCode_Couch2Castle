import { useEffect, useRef, useState } from 'react';
import '../styles/TagPicker.css';

const TAG_CATEGORIES = [
  {
    label: 'Education',
    tags: [
      'Near top-rated schools',
      'Elementary school nearby',
      'Middle school nearby',
      'High school nearby',
      'In great school district',
    ],
  },
  {
    label: 'Food & Shopping',
    tags: [
      'Near restaurants',
      'Grocery stores nearby',
      'Shopping centers',
      'Walkable to shops',
    ],
  },
  {
    label: 'Transit & Commute',
    tags: [
      'Near highway access',
      'Public transit nearby',
      'Commuter-friendly',
      'Walk to work',
    ],
  },
  {
    label: 'Recreation',
    tags: [
      'Near parks',
      'Dog park nearby',
      'Golf course',
      'Bike trails',
      'Near gym/fitness',
    ],
  },
  {
    label: 'Healthcare',
    tags: ['Near hospital', 'Medical facilities nearby'],
  },
  {
    label: 'Family & Lifestyle',
    tags: [
      'Near places of worship',
      'Near daycare/childcare',
      'Quiet neighborhood',
      'Family-friendly',
    ],
  },
];

const TagPicker = ({ selected = [], onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (tag) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else if (selected.length < 20) {
      onChange([...selected, tag]);
    }
  };

  return (
    <div className="tag-picker" ref={ref}>
      <button
        type="button"
        className={`tag-picker-trigger${open ? ' tag-picker-trigger--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>Neighborhood &amp; Lifestyle Tags</span>
        <span className="tag-picker-trigger-right">
          {selected.length > 0 && (
            <span className="tag-picker-count">{selected.length} selected</span>
          )}
          <span className="tag-picker-caret">{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {open && (
        <div className="tag-picker-popup">
          <div className="tag-picker-popup-inner">
            {TAG_CATEGORIES.map((cat) => (
              <div key={cat.label} className="tag-picker-category">
                <p className="tag-picker-category-label">{cat.label}</p>
                <div className="tag-picker-tags">
                  {cat.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-chip${selected.includes(tag) ? ' tag-chip--on' : ''}`}
                      onClick={() => toggle(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="tag-picker-popup-footer">
              <button
                type="button"
                className="tag-picker-clear"
                onClick={() => onChange([])}
              >
                Clear all
              </button>
              <button
                type="button"
                className="tag-picker-done"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="tag-picker-chips">
          {selected.map((tag) => (
            <span key={tag} className="tag-chip tag-chip--on tag-chip--sm">
              {tag}
              <button
                type="button"
                className="tag-chip-remove"
                onClick={() => toggle(tag)}
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagPicker;
