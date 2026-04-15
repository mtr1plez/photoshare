// Admin email whitelist — these accounts can access /admin
export const ADMIN_EMAILS = import.meta.env.VITE_ADMIN_EMAIL
  ? import.meta.env.VITE_ADMIN_EMAIL.split(',').map((email) => email.trim())
  : [];

// Firestore collection name
export const PHOTOS_COLLECTION = 'photos';

// Pagination
export const PHOTOS_PER_PAGE = 20;
