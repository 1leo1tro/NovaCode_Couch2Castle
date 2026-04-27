import { createContext, useContext, useState, useCallback } from 'react';

const BookmarkContext = createContext(null);

const STORAGE_KEY = 'c2c_bookmarks';

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState(load);

  const toggle = useCallback((id) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isBookmarked = useCallback((id) => bookmarks.includes(id), [bookmarks]);

  const removeStale = useCallback((validIds) => {
    setBookmarks((prev) => {
      const next = prev.filter((id) => validIds.includes(id));
      if (next.length === prev.length) return prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggle, isBookmarked, removeStale }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
};
