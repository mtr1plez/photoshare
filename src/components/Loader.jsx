export default function Loader({ count = 8 }) {
  // Generate random heights for masonry skeleton effect
  const skeletons = Array.from({ length: count }, (_, i) => ({
    id: i,
    height: Math.floor(Math.random() * 150) + 180,
  }));

  return (
    <div className="gallery-grid">
      {skeletons.map((s) => (
        <div
          key={s.id}
          className="photo-skeleton"
          style={{ height: `${s.height}px` }}
        />
      ))}
    </div>
  );
}
