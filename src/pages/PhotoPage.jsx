import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePhoto } from '../hooks/usePhotos';
import '../styles/photo.css';

export default function PhotoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { photo, loading, error } = usePhoto(id);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef(null);

  // Download photo
  const handleDownload = async () => {
    if (!photo) return;
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

  // Nav actions
  const goNext = useCallback(() => {
    if (photo?.nextId && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => navigate(`/photo/${photo.nextId}`), 150);
    }
  }, [photo, isTransitioning, navigate]);

  const goPrev = useCallback(() => {
    if (photo?.prevId && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => navigate(`/photo/${photo.prevId}`), 150);
    }
  }, [photo, isTransitioning, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  // Reset states on ID change
  useEffect(() => {
    setImgLoaded(false);
    setIsTransitioning(false);
  }, [id]);

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

  // Loading state
  if (loading) {
    return (
      <div className="photo-page">
        <div className="photo-page-bg" />
        <div className="photo-page-loading">
          <div className="gallery-spinner" style={{ width: 32, height: 32 }} />
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Error / not found
  if (error || !photo) {
    return (
      <div className="photo-page">
        <div className="photo-page-bg" />
        <div className="photo-page-error">
          <div className="photo-page-error-icon">
            {error === 'not-found' ? '🔍' : '⚠️'}
          </div>
          <h2>
            {error === 'not-found' ? 'Фото не найдено' : 'Ошибка загрузки'}
          </h2>
          <p>
            {error === 'not-found'
              ? 'Возможно, ссылка устарела или фото было удалено'
              : 'Попробуйте обновить страницу'}
          </p>
          <Link to="/" className="btn btn-secondary">
            ← На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="photo-page">
      <div className="photo-page-bg" />

      {/* Navigation arrows (desktop) */}
      {photo.prevId && (
        <div className="photo-nav photo-nav-prev" onClick={goPrev}>
          <button className="photo-nav-btn" aria-label="Previous">‹</button>
        </div>
      )}
      {photo.nextId && (
        <div className="photo-nav photo-nav-next" onClick={goNext}>
          <button className="photo-nav-btn" aria-label="Next">›</button>
        </div>
      )}

      <div className="photo-page-content">
        <div 
          ref={containerRef}
          className="photo-page-image-wrap"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {!imgLoaded && <div className="photo-page-skeleton" />}
          <img
            src={photo.url}
            alt={photo.title || 'Фото из учебника'}
            className={`photo-page-image ${imgLoaded ? 'loaded' : 'loading'} ${isTransitioning ? 'transitioning' : ''}`}
            onLoad={() => setImgLoaded(true)}
            style={{
              transform: touchDelta !== 0 ? `translateX(${touchDelta}px)` : undefined,
            }}
            draggable={false}
          />
        </div>

        {photo.title && (
          <div className="photo-page-info">
            <div className="photo-page-title">{photo.title}</div>
          </div>
        )}

        <div className="photo-page-actions">
          <button className="btn btn-primary" onClick={handleDownload}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Скачать
          </button>
        </div>
      </div>

      <Link to="/" className="photo-page-brand">
        <span className="photo-page-brand-icon">◈</span>
        UniPhoto
      </Link>
    </div>
  );
}
