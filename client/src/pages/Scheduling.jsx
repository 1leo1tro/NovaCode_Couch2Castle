import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Showings.css';
import '../styles/Scheduling.css';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const EMPTY_OPEN_HOUSE = { listing: '', date: '', startTime: '', endTime: '', notes: '' };

const Scheduling = () => {
  const { isAuthenticated } = useAuth();

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
  const [avLoading, setAvLoading] = useState(true);
  const [avSaving, setAvSaving] = useState(false);
  const [avError, setAvError] = useState('');
  const [avSuccess, setAvSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) return;
    fetchOpenHouses();
    fetchMyListings();
    fetchAvailability();
  }, [isAuthenticated]);

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
      const res = await axios.get('/api/listings/mine');
      setMyListings(res.data.listings || []);
    } catch {
      setMyListings([]);
    }
  };

  const fetchAvailability = async () => {
    try {
      setAvLoading(true);
      const res = await axios.get('/api/agents/me/availability');
      setSlots(res.data.availabilitySlots || []);
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
  const addSlot = () => {
    setSlots(prev => [...prev, { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }]);
  };

  const removeSlot = (idx) => {
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx, field, value) => {
    setSlots(prev => prev.map((slot, i) =>
      i === idx ? { ...slot, [field]: field === 'dayOfWeek' ? Number(value) : value } : slot
    ));
  };

  const handleSaveAvailability = async () => {
    setAvError('');
    setAvSuccess('');
    setAvSaving(true);
    try {
      await axios.put('/api/agents/me/availability', { availabilitySlots: slots });
      setAvSuccess('Availability saved successfully.');
    } catch (err) {
      setAvError(err.response?.data?.message || err.response?.data?.error || 'Failed to save availability');
    } finally {
      setAvSaving(false);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="showings-page">
        <div className="showings-container">
          <h1>Access Denied</h1>
          <p>You must be signed in as an agent to manage scheduling.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="showings-page">
      <div className="showings-container">
        <div className="page-header">
          <h1>Scheduling</h1>
          <p className="page-subtitle">Manage open house events and your weekly availability</p>
        </div>

        {/* ── Open Houses ── */}
        <section className="scheduling-section">
          <div className="scheduling-section-header">
            <h2>Open Houses</h2>
            <button
              className="scheduling-add-btn"
              onClick={() => { setShowOhForm(prev => !prev); setOhFormError(''); }}
            >
              {showOhForm ? 'Cancel' : '+ New Open House'}
            </button>
          </div>

          {showOhForm && (
            <form className="scheduling-form" onSubmit={handleCreateOpenHouse}>
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

              <label>
                Date
                <input type="date" name="date" value={ohForm.date} onChange={handleOhFormChange} required />
              </label>

              <div className="scheduling-time-row">
                <label>
                  Start Time
                  <input type="time" name="startTime" value={ohForm.startTime} onChange={handleOhFormChange} required />
                </label>
                <label>
                  End Time
                  <input type="time" name="endTime" value={ohForm.endTime} onChange={handleOhFormChange} required />
                </label>
              </div>

              <label>
                Notes (optional)
                <input type="text" name="notes" value={ohForm.notes} onChange={handleOhFormChange} placeholder="e.g. Refreshments provided" />
              </label>

              <button type="submit" disabled={ohSubmitting} className="scheduling-submit-btn">
                {ohSubmitting ? 'Creating...' : 'Create Open House'}
              </button>
            </form>
          )}

          {ohLoading && <p className="scheduling-loading">Loading open houses...</p>}
          {ohError && <p className="scheduling-form-error">{ohError}</p>}

          {!ohLoading && !ohError && openHouses.length === 0 && (
            <p className="scheduling-empty">No open houses scheduled. Create one above.</p>
          )}

          {!ohLoading && openHouses.length > 0 && (
            <table className="scheduling-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {openHouses.map(oh => (
                  <tr key={oh._id}>
                    <td>{oh.listing?.address || '—'}</td>
                    <td>
                      {new Date(oh.date).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td>{oh.startTime} – {oh.endTime}</td>
                    <td>{oh.notes || '—'}</td>
                    <td>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteOpenHouse(oh._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ── Weekly Availability ── */}
        <section className="scheduling-section">
          <div className="scheduling-section-header">
            <h2>Weekly Availability</h2>
            <button className="scheduling-add-btn" onClick={addSlot}>+ Add Slot</button>
          </div>

          {avLoading && <p className="scheduling-loading">Loading availability...</p>}

          {!avLoading && (
            <>
              {slots.length === 0 && (
                <p className="scheduling-empty">No availability slots set. Add one above.</p>
              )}

              {slots.map((slot, idx) => (
                <div key={idx} className="availability-slot-row">
                  <select
                    value={slot.dayOfWeek}
                    onChange={e => updateSlot(idx, 'dayOfWeek', e.target.value)}
                  >
                    {DAY_NAMES.map((day, d) => (
                      <option key={d} value={d}>{day}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={e => updateSlot(idx, 'startTime', e.target.value)}
                  />
                  <span className="slot-dash">–</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={e => updateSlot(idx, 'endTime', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-action btn-delete"
                    onClick={() => removeSlot(idx)}
                  >
                    Remove
                  </button>
                </div>
              ))}

              {avError && <p className="scheduling-form-error">{avError}</p>}
              {avSuccess && <p className="scheduling-form-success">{avSuccess}</p>}

              <button
                type="button"
                className="scheduling-submit-btn"
                onClick={handleSaveAvailability}
                disabled={avSaving}
                style={{ marginTop: '1rem' }}
              >
                {avSaving ? 'Saving...' : 'Save Availability'}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Scheduling;
