import { usePhotos } from '../hooks/usePhotos';
import Gallery from '../components/Gallery';
import Loader from '../components/Loader';
import '../styles/gallery.css';

export default function HomePage() {
  const { photos, loading, loadingMore, hasMore, loadMore } = usePhotos();

  return (
    <div className="gallery-page">
      <div className="container">
        <div className="gallery-hero">
          <h1>UniPhoto</h1>
          <p>Фото из учебников</p>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <Gallery
            photos={photos}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            loadMore={loadMore}
          />
        )}
      </div>
    </div>
  );
}
