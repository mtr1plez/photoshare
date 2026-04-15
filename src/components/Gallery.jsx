import { useEffect, useRef, useCallback } from 'react';
import PhotoCard from './PhotoCard';

export default function Gallery({ photos, loading, loadingMore, hasMore, loadMore }) {
  const sentinelRef = useRef(null);

  // Infinite scroll via Intersection Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.unobserve(sentinel);
  }, [hasMore, loadingMore, loadMore]);

  if (!loading && photos.length === 0) {
    return (
      <div className="gallery-empty">
        <div className="gallery-empty-icon">📷</div>
        <h3>Пока нет фотографий</h3>
        <p>Фотографии появятся здесь после загрузки</p>
      </div>
    );
  }

  return (
    <>
      <div className="gallery-grid">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={index}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="gallery-load-more">
          {loadingMore && <div className="gallery-spinner" />}
        </div>
      )}
    </>
  );
}
