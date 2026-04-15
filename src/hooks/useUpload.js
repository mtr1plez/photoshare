import { useState, useCallback } from 'react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { PHOTOS_COLLECTION } from '../utils/constants';
import { optimizeImage } from '../utils/imageOptimize';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

function cloudinaryThumb(url, width = 600, height = 600) {
  return url.replace('/upload/', `/upload/c_fill,w_${width},h_${height},q_70,f_auto/`);
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [errors, setErrors] = useState([]);

  const uploadPhotos = useCallback(async (files, metadata = {}) => {
    setUploading(true);
    setErrors([]);

    const uploadPromises = Array.from(files).map(async (file, index) => {
      const fileId = `${Date.now()}_${index}`;
      setProgress((prev) => ({ ...prev, [fileId]: 0 }));

      try {
        const optimizedBlob = await optimizeImage(file);
        
        const formData = new FormData();
        formData.append('file', optimizedBlob, file.name.replace(/\.[^/.]+$/, '.webp'));
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', 'uniphoto');

        const response = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', UPLOAD_URL);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 90);
              setProgress((prev) => ({ ...prev, [fileId]: pct }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });

        const fullUrl = response.secure_url;
        const thumbUrl = cloudinaryThumb(fullUrl);
        const publicId = response.public_id;

        setProgress((prev) => ({ ...prev, [fileId]: 95 }));

        // Save metadata to Firestore
        const docRef = await addDoc(collection(db, PHOTOS_COLLECTION), {
          url: fullUrl,
          thumbnailUrl: thumbUrl,
          cloudinaryPublicId: publicId,
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
          createdAt: serverTimestamp(),
        });

        setProgress((prev) => ({ ...prev, [fileId]: 100 }));
        return { success: true, fileId, docId: docRef.id };
      } catch (err) {
        console.error(`Upload error for ${file.name}:`, err);
        setProgress((prev) => ({ ...prev, [fileId]: -1 }));
        setErrors((prev) => [...prev, { file: file.name, error: err.message }]);
        return { success: false, fileId, error: err.message };
      }
    });

    const results = await Promise.all(uploadPromises);
    setUploading(false);
    return results;
  }, []);

  const deletePhoto = useCallback(async (photo) => {
    try {
      // Note: Cloudinary image deletion requires a signed request (backend).
      // For now, we only delete the Firestore document.
      // The Cloudinary image will remain but become orphaned.
      // You can clean up orphaned images from Cloudinary dashboard.
      await deleteDoc(doc(db, PHOTOS_COLLECTION, photo.id));
      return true;
    } catch (err) {
      console.error('Delete error:', err);
      setErrors((prev) => [...prev, { error: err.message }]);
      return false;
    }
  }, []);

  const clearProgress = useCallback(() => {
    setProgress({});
    setErrors([]);
  }, []);

  return { uploadPhotos, deletePhoto, uploading, progress, errors, clearProgress };
}
