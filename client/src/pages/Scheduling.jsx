import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Showings.css';
import '../styles/Scheduling.css';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getWeekDates = (offset = 0) => {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
};

const toDateStr = (date) => date.toISOString().slice(0, 10); // YYYY-MM-DD

const to12Hour = (time) => {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

const EMPTY_OPEN_HOUSE = { listing: '', date: '', startTime: '', endTime: '', notes: '' };

const Scheduling = () => {
  const { isAuthenticated, token, user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);

  // Open houses state
  const [openHouses, setOpenHouses] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [ohLoading, setOhLoading] = useState(true);
  const [ohError, setOhError] = useState(null);
  const [showOhForm, setShowOhForm] = useState(false);
  const [ohForm, setOhForm] = useState(EMPTY_OPEN_HOUSE);
  const [ohSubmitting, setOhSubmitting] = useState(false);
  const [ohFormError, setOhFormError] = useState('');

  // Availability state
  const [slots, setSlots] = useState([]);
  const [savedSlots, setSavedSlots] = useState([]);
  const [avLoading, setAvLoading] = useState(true);
  const [avSaving, setAvSaving] = useState(false);
  const [avError, setAvError] = useState('');
  const [avSuccess, setAvSuccess] = useState('');
  const warnedOnce = useRef(false);

  const hasUnsavedChanges = slots.length > 0 &&
    JSON.stringify(slots) !== JSON.stringify(savedSlots);

  // Warn on browser close / refresh
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Intercept in-app navigation links when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) {
      warnedOnce.current = false;
      return;
    }
    const handler = (e) => {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      // Only intercept internal links that would leave the page
      if (anchor.getAttribute('href')?.startsWith('/')) {
        if (!warnedOnce.current) {
          e.preventDefault();
          warnedOnce.current = true;
          setAvError('You have unsaved availability changes. Navigate away again to leave without saving.');
        }
        // second click goes through naturally
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!token) return;
    fetchOpenHouses();
    fetchMyListings();
    fetchAvailability();
  }, [token]);

  const fetchOpenHouses = async () => {
    try {
      setOhLoading(true);
      setOhError(null);
      const res = await axios.get('/api/open-houses');
      setOpenHouses(res.data.openHouses || []);
    } catch (err) {
      setOhError(err.response?.data?.message || 'Failed to load open houses');
    } finally {
      setOhLoading(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      const res = await axios.get('/api/listings');
      const all = res.data.listings || [];
      const userId = user?._id || user?.id;
      setMyListings(
        all.filter(l => {
          const createdById = typeof l.createdBy === 'object' ? l.createdBy._id : l.createdBy;
          return String(createdById) === String(userId);
        })
      );
    } catch {
      setMyListings([]);
    }
  };

  const fetchAvailability = async () => {
    try {
      setAvLoading(true);
      const res = await axios.get('/api/agents/me/availability');
      // Strip any stale slots from the old dayOfWeek model (no date field)
      const fetched = (res.data.availabilitySlots || [])
        .filter(s => s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date));
      setSlots(fetched);
      setSavedSlots(fetched);
    } catch {
      setSlots([]);
    } finally {
      setAvLoading(false);
    }
  };

  const handleOhFormChange = (e) => {
    const { name, value } = e.target;
    setOhForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateOpenHouse = async (e) => {
    e.preventDefault();
    setOhFormError('');

    if (!ohForm.listing || !ohForm.date || !ohForm.startTime || !ohForm.endTime) {
      setOhFormError('Listing, date, start time, and end time are required.');
      return;
    }

    try {
      setOhSubmitting(true);
      await axios.post('/api/open-houses', {
        listing: ohForm.listing,
        date: new Date(`${ohForm.date}T00:00:00`).toISOString(),
        startTime: ohForm.startTime,
        endTime: ohForm.endTime,
        notes: ohForm.notes.trim() || undefined
      });
      setOhForm(EMPTY_OPEN_HOUSE);
      setShowOhForm(false);
      await fetchOpenHouses();
    } catch (err) {
      setOhFormError(err.response?.data?.message || err.response?.data?.error || 'Failed to create open house');
    } finally {
      setOhSubmitting(false);
    }
  };

  const handleDeleteOpenHouse = async (id) => {
    if (!window.confirm('Delete this open house event?')) return;
    try {
      await axios.delete(`/api/open-houses/${id}`);
      await fetchOpenHouses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete open house');
    }
  };

  // Availability slot management
  const addSlotForDay = (dateStr) => {
    const seen = new Set();
    for (const s of slots) {
      if (!s.startTime || !s.endTime) continue;
      if (s.endTime <= s.startTime) {
        setAvError(`Fix invalid time range before adding a new slot.`);
        return;
      }
      const key = `${s.date}-${s.startTime}-${s.endTime}`;
      if (seen.has(key)) {
        setAvError('Fix duplicate slots before adding a new one.');
        return;
      }
      seen.add(key);
    }
    setAvError('');
    setSlots(prev => [...prev, { date: dateStr, startTime: '', endTime: '' }]);
  };

  const removeSlot = (idx) => {
    setAvError('');
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx, field, value) => {
    setAvError('');
    warnedOnce.current = false;
    setSlots(prev => prev.map((slot, i) =>
      i === idx ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSaveAvailability = async () => {
    setAvError('');
    setAvSuccess('');

    // Drop slots with no valid date (old dayOfWeek model) or no times entered
    const filledSlots = slots.filter(s => s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && (s.startTime || s.endTime));

    // Error on partially filled slots (one time set, the other missing)
    for (const s of filledSlots) {
      if (!s.startTime || !s.endTime) {
        setAvError('All slots must have both a start and end time before saving.');
        return;
      }
    }

    for (const s of filledSlots) {
      if (s.endTime <= s.startTime) {
        setAvError(`End time must be after start time (${s.date}: ${to12Hour(s.startTime)} – ${to12Hour(s.endTime)}).`);
        return;
      }
    }

    const seen = new Set();
    for (const s of filledSlots) {
      const key = `${s.date}-${s.startTime}-${s.endTime}`;
      if (seen.has(key)) {
        setAvError('You have duplicate slots with the same date and time. Fix them before saving.');
        return;
      }
      seen.add(key);
    }

    setAvSaving(true);
    try {
      await axios.put('/api/agents/me/availability', { availabilitySlots: filledSlots });
      setSlots(filledSlots);
      setSavedSlots(filledSlots);
      warnedOnce.current = false;
      setAvSuccess('Availability saved successfully.');
    } catch (err) {
      setAvError(err.response?.data?.message || err.response?.data?.error || 'Failed to save availability');
    } finally {
      setAvSaving(false);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="sched-page">
        <div className="sched-wrap">
          <h1 className="sched-page-title">Access Denied</h1>
          <p className="sched-page-sub">You must be signed in as an agent to manage scheduling.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sched-page">
      <div className="sched-wrap">
        <h1 className="sched-page-title">Scheduling</h1>
        <p className="sched-page-sub">Open houses and weekly availability</p>

        {/* ── Open Houses ── */}
        <section className="sched-section">
          <div className="sched-section-header">
            <h2 className="sched-section-title">Open Houses</h2>
            <button
              className={`sched-btn-ghost${showOhForm ? ' sched-btn-ghost--cancel' : ''}`}
              onClick={() => { setShowOhForm(prev => !prev); setOhFormError(''); }}
            >
              {showOhForm ? 'Cancel' : '+ New'}
            </button>
          </div>

          {showOhForm && (
            <form className="sched-form" onSubmit={handleCreateOpenHouse}>
              {ohFormError && <p className="scheduling-form-error">{ohFormError}</p>}
              <label>
                Listing
                <select name="listing" value={ohForm.listing} onChange={handleOhFormChange} required>
                  <option value="">Select a listing</option>
                  {myListings.map(l => (
                    <option key={l._id} value={l._id}>{l.address}</option>
                  ))}
                </select>
              </label>
              <div className="sched-form-row">
                <label>
                  Date
                  <input type="date" name="date" value={ohForm.date} onChange={handleOhFormChange} required />
                </label>
                <label>
                  Notes
                  <input type="text" name="notes" value={ohForm.notes} onChange={handleOhFormChange} placeholder="Optional" />
                </label>
              </div>
              <div className="sched-form-row">
                <label>
                  Start Time
                  <input type="time" name="startTime" value={ohForm.startTime} onChange={handleOhFormChange} required />
                </label>
                <label>
                  End Time
                  <input type="time" name="endTime" value={ohForm.endTime} onChange={handleOhFormChange} required />
                </label>
              </div>
              <div className="sched-form-actions">
                <button type="submit" disabled={ohSubmitting} className="sched-btn-primary">
                  {ohSubmitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          )}

          {ohLoading && <p className="sched-empty">Loading...</p>}
          {ohError && <p className="scheduling-form-error">{ohError}</p>}

          {!ohLoading && !ohError && openHouses.length === 0 && (
            <div className="sched-empty">No open houses scheduled yet.</div>
          )}

          {!ohLoading && openHouses.length > 0 && (
            <div className="sched-oh-grid">
              {openHouses.map(oh => {
                const d = new Date(oh.date);
                return (
                  <div key={oh._id} className="sched-oh-card">
                    <div className="sched-oh-date-block">
                      <span className="sched-oh-date-month">
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="sched-oh-date-day">
                        {d.getUTCDate()}
                      </span>
                      <span className="sched-oh-date-dow">
                        {d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}
                      </span>
                    </div>
                    <div className="sched-oh-body">
                      <p className="sched-oh-address">{oh.listing?.address || 'Unknown listing'}</p>
                      <p className="sched-oh-time">{to12Hour(oh.startTime)} – {to12Hour(oh.endTime)}</p>
                      {oh.notes && <p className="sched-oh-notes">{oh.notes}</p>}
                    </div>
                    <div className="sched-oh-delete">
                      <button
                        className="sched-oh-delete-btn"
                        onClick={() => handleDeleteOpenHouse(oh._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Weekly Availability ── */}
        <section className="sched-section">
          <div className="sched-section-header">
            <h2 className="sched-section-title">Weekly Availability</h2>
            <div className="av-week-nav">
              <button
                className="av-week-nav-btn"
                onClick={() => setWeekOffset(o => Math.max(0, o - 1))}
                disabled={weekOffset === 0}
              >‹</button>
              <span className="av-week-nav-label">
                {(() => {
                  const dates = getWeekDates(weekOffset);
                  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return `${fmt(dates[0])} – ${fmt(dates[6])}`;
                })()}
              </span>
              <button
                className="av-week-nav-btn"
                onClick={() => setWeekOffset(o => o + 1)}
              >›</button>
            </div>
          </div>

          {avLoading && <p className="sched-empty">Loading...</p>}

          {!avLoading && (
            <>
              <div className="av-calendar-grid">
                {(() => {
                  const weekDates = getWeekDates(weekOffset);
                  return weekDates.map((date, colIdx) => {
                    const dateStr = toDateStr(date);
                    const isToday = toDateStr(new Date()) === dateStr;
                    const isPast = date < new Date(new Date().setHours(0,0,0,0));
                    const daySlots = slots
                      .map((s, i) => ({ ...s, globalIdx: i }))
                      .filter(s => s.date === dateStr);

                    return (
                      <div key={colIdx} className={`av-cal-col${isPast ? ' av-cal-col--past' : ''}`}>
                        <div className={`av-cal-col-header${isToday ? ' av-cal-col-header--today' : ''}`}>
                          <span className="av-cal-day-name">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]}</span>
                          <span className="av-cal-day-num">{date.getDate()}</span>
                        </div>
                        <div className="av-cal-col-body">
                          {daySlots.map(slot => (
                            <div key={slot.globalIdx} className="av-cal-slot">
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={e => updateSlot(slot.globalIdx, 'startTime', e.target.value)}
                              />
                              <span className="av-cal-sep">–</span>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={e => updateSlot(slot.globalIdx, 'endTime', e.target.value)}
                              />
                              <button
                                type="button"
                                className="av-cal-remove"
                                onClick={() => removeSlot(slot.globalIdx)}
                                title="Remove"
                              >×</button>
                            </div>
                          ))}
                          {!isPast && (
                            <button
                              type="button"
                              className="av-cal-add"
                              onClick={() => addSlotForDay(dateStr)}
                              title={`Add slot`}
                            >+</button>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="av-footer">
                {avError && <p className="av-msg-error">{avError}</p>}
                {avSuccess && <p className="av-msg-success">{avSuccess}</p>}
                {hasUnsavedChanges && !avError && (
                  <p className="av-msg-warn">Unsaved changes</p>
                )}
                <button
                  type="button"
                  className="sched-btn-primary sched-btn-save"
                  onClick={handleSaveAvailability}
                  disabled={avSaving}
                >
                  {avSaving ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Scheduling;
