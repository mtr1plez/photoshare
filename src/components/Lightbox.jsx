import { useEffect, useRef, useState, useCallback } from 'react';
import '../styles/lightbox.css';

export default function Lightbox({ photos, currentIndex, onClose, onNavigate }) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const photo = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  // Navigate
  const goPrev = useCallback(() => {
    if (hasPrev && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        onNavigate(currentIndex - 1);
        setIsTransitioning(false);
      }, 150);
    }
  }, [hasPrev, isTransitioning, currentIndex, onNavigate]);

  const goNext = useCallback(() => {
    if (hasNext && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        onNavigate(currentIndex + 1);
        setIsTransitioning(false);
      }, 150);
    }
  }, [hasNext, isTransitioning, currentIndex, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          goPrev();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goPrev, goNext, onClose]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
  };

  const handleTouchMove = (e) => {
    if (touchStart === null) return;
    const delta = e.touches[0].clientX - touchStart;
    setTouchDelta(delta);
  };

  const handleTouchEnd = () => {
    if (touchStart === null) return;

    const threshold = 60;
    if (touchDelta > threshold) {
      goPrev();
    } else if (touchDelta < -threshold) {
      goNext();
    }

    setTouchStart(null);
    setTouchDelta(0);
  };

  // Click overlay to close (but not image)
  const handleOverlayClick = (e) => {
    if (e.target === containerRef.current || e.target === containerRef.current?.parentElement) {
      onClose();
    }
  };

  // Download
  const handleDownload = async () => {
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.title || 'photo';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  if (!photo) return null;

  return (
    <div className="lightbox-overlay" onClick={handleOverlayClick}>
      {/* Top controls */}
      <div className="lightbox-controls">
        <span className="lightbox-counter">
          {currentIndex + 1} / {photos.length}
        </span>
        <div className="lightbox-actions">
          <button className="lightbox-btn" onClick={handleDownload} title="Скачать">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button className="lightbox-btn" onClick={onClose} title="Закрыть">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation arrows (desktop) */}
      {hasPrev && (
        <div className="lightbox-nav lightbox-nav-prev">
          <button className="lightbox-nav-btn" onClick={goPrev} aria-label="Previous">
            ‹
          </button>
        </div>
      )}
      {hasNext && (
        <div className="lightbox-nav lightbox-nav-next">
          <button className="lightbox-nav-btn" onClick={goNext} aria-label="Next">
            ›
          </button>
        </div>
      )}

      {/* Image */}
      <div
        ref={containerRef}
        className="lightbox-image-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={photo.url}
          alt={photo.title || 'Photo'}
          className={`lightbox-image ${isTransitioning ? 'transitioning' : ''}`}
          style={{
            transform: touchDelta !== 0 ? `translateX(${touchDelta}px)` : undefined,
          }}
          draggable={false}
        />
      </div>

      {/* Bottom info */}
      {photo.title && (
        <div className="lightbox-info">
          <div className="lightbox-title">{photo.title}</div>
        </div>
      )}

      {/* Mobile swipe hint (shown once) */}
      <div className="lightbox-swipe-hint mobile-only">
        ← свайп для навигации →
      </div>
    </div>
  );
}
