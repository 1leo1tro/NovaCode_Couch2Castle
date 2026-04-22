import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../context/BookmarkContext';

const BookmarkStar = ({ listingId }) => {
  const { isAuthenticated, mockUser } = useAuth();
  const { isBookmarked, toggle } = useBookmarks();
  const signedIn = isAuthenticated() || !!mockUser;
  const saved = signedIn && isBookmarked(listingId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) return;
    toggle(listingId);
  };

  return (
    <div className={`bookmark-star-wrap${!signedIn ? ' bookmark-star-wrap--disabled' : ''}`}>
      <button
        className={`bookmark-star${saved ? ' bookmark-star--saved' : ''}${!signedIn ? ' bookmark-star--disabled' : ''}`}
        onClick={handleClick}
        aria-label={signedIn ? (saved ? 'Remove bookmark' : 'Bookmark this listing') : 'Sign in to save listings'}
        disabled={!signedIn}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill={saved ? 'currentColor' : 'none'}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
      {!signedIn && (
        <span className="bookmark-star-tooltip">Sign in to save listings</span>
      )}
    </div>
  );
};

export default BookmarkStar;
