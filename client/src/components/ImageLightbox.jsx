import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import '../styles/ImageLightbox.css';

const ImageLightbox = ({ images, startIndex = 0, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="ilb-backdrop" onClick={onClose}>
      <button className="ilb-close" onClick={onClose}>✕</button>

      <div className="ilb-stage" onClick={e => e.stopPropagation()}>
        <AnimatePresence mode="wait">
          <motion.img
            key={idx}
            src={images[idx]}
            alt={`Photo ${idx + 1}`}
            referrerPolicy="no-referrer"
            className="ilb-img"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          />
        </AnimatePresence>

        {images.length > 1 && (
          <>
            <button className="ilb-nav ilb-nav--prev" onClick={prev}>&#8249;</button>
            <button className="ilb-nav ilb-nav--next" onClick={next}>&#8250;</button>
          </>
        )}

        <div className="ilb-counter">{idx + 1} / {images.length}</div>
      </div>

      {images.length > 1 && (
        <div className="ilb-strip" onClick={e => e.stopPropagation()}>
          {images.map((src, i) => (
            <button
              key={i}
              className={`ilb-strip-thumb${i === idx ? ' ilb-strip-thumb--active' : ''}`}
              onClick={() => setIdx(i)}
            >
              <img src={src} alt={`Thumb ${i + 1}`} referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageLightbox;
