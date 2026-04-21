import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const ShowingNotificationsContext = createContext(null);

const IDS_KEY  = 'c2c_my_showings';
const SEEN_KEY = 'c2c_showings_seen'; // { [id]: { status, feedback } }

const loadIds  = () => { try { return JSON.parse(localStorage.getItem(IDS_KEY)  || '[]'); } catch { return []; } };
const loadSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch { return {}; } };

export const ShowingNotificationsProvider = ({ children }) => {
  const [unseenCount, setUnseenCount] = useState(0);

  const refresh = useCallback(async () => {
    const ids = loadIds();
    if (ids.length === 0) { setUnseenCount(0); return; }

    const seen = loadSeen();

    const results = await Promise.all(
      ids.map((id) => axios.get(`/api/showings/${id}`).then((r) => r.data.showing).catch(() => null))
    );

    let count = 0;
    results.filter(Boolean).forEach((s) => {
      const prev = seen[s._id];
      // New entry never stored in seen map → was just submitted, default seen state is pending/empty
      const prevStatus   = prev?.status   ?? 'pending';
      const prevFeedback = prev?.feedback ?? '';
      if (s.status !== prevStatus || (s.feedback || '') !== prevFeedback) {
        count++;
      }
    });

    setUnseenCount(count);
  }, []);

  const markAllSeen = useCallback(async () => {
    const ids = loadIds();
    if (ids.length === 0) { setUnseenCount(0); return; }

    const results = await Promise.all(
      ids.map((id) => axios.get(`/api/showings/${id}`).then((r) => r.data.showing).catch(() => null))
    );

    const seen = loadSeen();
    results.filter(Boolean).forEach((s) => {
      seen[s._id] = { status: s.status, feedback: s.feedback || '' };
    });
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    setUnseenCount(0);
  }, []);

  // Check on mount
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ShowingNotificationsContext.Provider value={{ unseenCount, refresh, markAllSeen }}>
      {children}
    </ShowingNotificationsContext.Provider>
  );
};

export const useShowingNotifications = () => {
  const ctx = useContext(ShowingNotificationsContext);
  if (!ctx) throw new Error('useShowingNotifications must be used within ShowingNotificationsProvider');
  return ctx;
};
