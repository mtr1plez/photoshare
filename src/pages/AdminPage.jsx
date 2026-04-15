import { useState, useRef, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PHOTOS_COLLECTION } from '../utils/constants';
import { usePhotos } from '../hooks/usePhotos';
import { useUpload } from '../hooks/useUpload';
import { useAuth } from '../hooks/useAuth';
import '../styles/admin.css';

export default function AdminPage() {
  const { user } = useAuth();
  const { photos, loading } = usePhotos(true); // realtime
  const { uploadPhotos, deletePhoto, uploading, progress, clearProgress } = useUpload();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Copy QR link to clipboard
  const copyLink = async (photoId) => {
    const link = `${window.location.origin}/photo/${photoId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(photoId);
      showToast('📋 Ссылка скопирована!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(photoId);
      showToast('📋 Ссылка скопирована!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Handle file selection
  const handleFiles = useCallback((files) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setSelectedFiles((prev) => [...prev, ...imageFiles]);

    // Create previews
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [
          ...prev,
          { name: file.name, url: e.target.result },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // Remove preview
  const removePreview = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const results = await uploadPhotos(selectedFiles, {});

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (successCount > 0) {
      showToast(`✅ Загружено ${successCount} фото${failCount > 0 ? `, ${failCount} ошибок` : ''}`);
    } else {
      showToast('❌ Ошибка загрузки', 'error');
    }

    // Clear
    setSelectedFiles([]);
    setPreviews([]);
    clearProgress();
  };

  // Edit title
  const handleEditTitle = async (photo) => {
    const newTitle = window.prompt('Новое название фото:', photo.title || '');
    if (newTitle === null || newTitle === photo.title) return;

    try {
      await updateDoc(doc(db, PHOTOS_COLLECTION, photo.id), { title: newTitle });
      showToast('✏️ Название обновлено');
    } catch (err) {
      console.error('Update error:', err);
      showToast('❌ Ошибка переименования', 'error');
    }
  };

  // Delete
  const handleDelete = async (photo) => {
    if (!window.confirm(`Удалить "${photo.title}"?`)) return;

    const success = await deletePhoto(photo);
    if (success) {
      showToast('🗑 Фото удалено');
    } else {
      showToast('❌ Ошибка удаления', 'error');
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        {/* Header */}
        <div className="admin-header">
          <h1>Управление фото</h1>
          <div className="admin-header-actions">
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
              {user?.email}
            </span>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="upload-zone-input"
            onChange={(e) => handleFiles(e.target.files)}
            style={{ display: 'none' }}
          />
          <div className="upload-zone-icon">📁</div>
          <p className="upload-zone-text">
            Перетащите фотографии сюда или нажмите для выбора
          </p>
          <p className="upload-zone-hint">
            Поддерживаются JPG, PNG, WebP. Автоматическая оптимизация.
          </p>
        </div>

        {/* Preview Grid */}
        {previews.length > 0 && (
          <>
            <div className="upload-preview-grid">
              {previews.map((preview, index) => (
                <div key={preview.name + index} className="upload-preview-item">
                  <img src={preview.url} alt={preview.name} />
                  {!uploading && (
                    <div className="upload-preview-overlay">
                      <button
                        className="upload-preview-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePreview(index);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {uploading && progress[`${Object.keys(progress)[index]}`] !== undefined && (
                    <>
                      <div className="upload-progress-bar">
                        <div
                          className="upload-progress-fill"
                          style={{
                            width: `${Math.max(0, progress[Object.keys(progress)[index]] || 0)}%`,
                          }}
                        />
                      </div>
                      {progress[Object.keys(progress)[index]] === 100 && (
                        <div className="upload-status done">✓</div>
                      )}
                      {progress[Object.keys(progress)[index]] === -1 && (
                        <div className="upload-status error">✕</div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Form */}
            <div className="upload-form">
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0}
                >
                  {uploading ? (
                    <>
                      <span className="gallery-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      Загрузка...
                    </>
                  ) : (
                    `Загрузить ${selectedFiles.length} фото`
                  )}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedFiles([]);
                    setPreviews([]);
                    clearProgress();
                  }}
                  disabled={uploading}
                >
                  Очистить
                </button>
              </div>
            </div>
          </>
        )}

        {/* Existing Photos */}
        <div className="admin-photos-header">
          <h2>Загруженные фото</h2>
          <span className="admin-photos-count">
            {loading ? '...' : `${photos.length} фото`}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <div className="gallery-spinner" />
          </div>
        ) : photos.length === 0 ? (
          <div className="gallery-empty">
            <div className="gallery-empty-icon">🖼</div>
            <h3>Нет загруженных фото</h3>
            <p>Перетащите фотографии в зону выше для загрузки</p>
          </div>
        ) : (
          <div className="admin-photo-grid">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="admin-photo-card"
                style={{ animationDelay: `${(index % 12) * 40}ms` }}
              >
                <div className="admin-photo-thumb">
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.title || 'Photo'}
                    loading="lazy"
                  />
                </div>
                <div className="admin-photo-meta">
                  <div className="admin-photo-name">{photo.title || 'Без названия'}</div>
                  <div className="admin-photo-link">
                    /photo/{photo.id}
                  </div>
                </div>
                <div className="admin-photo-actions">
                  <button
                    className="admin-photo-edit"
                    onClick={() => handleEditTitle(photo)}
                    title="Переименовать"
                  >
                    ✏️
                  </button>
                  <button
                    className={`admin-photo-copy ${copiedId === photo.id ? 'copied' : ''}`}
                    onClick={() => copyLink(photo.id)}
                    title="Копировать ссылку для QR"
                  >
                    {copiedId === photo.id ? '✓' : '📋'}
                  </button>
                  <button
                    className="admin-photo-delete"
                    onClick={() => handleDelete(photo)}
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.message}</div>
        </div>
      )}
    </div>
  );
}
