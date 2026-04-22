import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BookmarkStar from './BookmarkStar';

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

const ListingCard = ({ listing, hasOpenHouse, onSelect, animStyle }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const images = listing.images || [];

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection(-1);
    setImgIndex(i => (i - 1 + images.length) % images.length);
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection(1);
    setImgIndex(i => (i + 1) % images.length);
  };

  return (
    <div className="property-card listing-card" style={animStyle}>
      <div className="property-card-link" style={{ textDecoration: 'none', cursor: 'pointer' }} onClick={() => onSelect?.(listing._id)}>
        <div className="property-card-image">
          {images.length > 0 ? (
            <>
              <div className="card-carousel-track">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.img
                    key={imgIndex}
                    src={images[imgIndex]}
                    alt={listing.address}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </AnimatePresence>
              </div>
              {images.length > 1 && (
                <>
                  <button className="card-carousel-btn card-carousel-btn--prev" onClick={prev}>&#8249;</button>
                  <button className="card-carousel-btn card-carousel-btn--next" onClick={next}>&#8250;</button>
                  <div className="card-carousel-dots">
                    {images.map((_, i) => (
                      <span key={i} className={`card-carousel-dot${i === imgIndex ? ' card-carousel-dot--active' : ''}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="listing-image-placeholder">No image</div>
          )}
          {listing.status && <span className="property-badge">{listing.status}</span>}
          {hasOpenHouse && <span className="property-badge property-badge--open-house">Open House</span>}
          <BookmarkStar listingId={listing._id} />
        </div>
        <div className="property-info listing-info">
          <p className="price">${listing.price.toLocaleString()}</p>
          <h3>{listing.address}</h3>
          <p className="location">ZIP: {listing.zipCode}</p>
          <p className="details">
            {listing.bedrooms != null && `${listing.bedrooms} bd`}
            {listing.bedrooms != null && listing.bathrooms != null && ' · '}
            {listing.bathrooms != null && `${listing.bathrooms} ba`}
            {(listing.bedrooms != null || listing.bathrooms != null) && ' · '}
            {listing.squareFeet} sqft
            {listing.status && ` · ${listing.status}`}
          </p>
          {listing.createdBy?.name && (
            <p className="details">Listed by {listing.createdBy.name}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingCard;
