import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function PhotoCard({ photo, index }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  return (
    <Link
      ref={ref}
      to={`/photo/${photo.id}`}
      className="photo-card"
      style={{ animationDelay: `${(index % 8) * 60}ms` }}
    >
      {inView && (
        <>
          <img
            src={photo.thumbnailUrl || photo.url}
            alt={photo.title || 'Photo'}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            style={{
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
          {!loaded && (
            <div
              className="photo-skeleton"
              style={{ position: 'absolute', inset: 0, margin: 0 }}
            />
          )}
          <div className="photo-card-info">
            {photo.title && <div className="photo-card-title">{photo.title}</div>}
          </div>
        </>
      )}
      {!inView && (
        <div className="photo-skeleton" style={{ height: '250px', margin: 0 }} />
      )}
    </Link>
  );
}
