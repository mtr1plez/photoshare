import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { PHOTOS_COLLECTION, PHOTOS_PER_PAGE } from '../utils/constants';

export function usePhotos(realtime = false) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPhotos([]);
    setLastDoc(null);
    setHasMore(true);
    setLoading(true);
    setError(null);

    const photosRef = collection(db, PHOTOS_COLLECTION);
    const q = query(photosRef, orderBy('createdAt', 'desc'), limit(PHOTOS_PER_PAGE));

    if (realtime) {
      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setPhotos(data);
          setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
          setHasMore(snapshot.docs.length >= PHOTOS_PER_PAGE);
          setLoading(false);
        },
        (err) => {
          console.error('Firestore error:', err);
          setError(err.message);
          setLoading(false);
        }
      );
      return unsubscribe;
    } else {
      getDocs(q)
        .then((snapshot) => {
          const data = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          setPhotos(data);
          setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
          setHasMore(snapshot.docs.length >= PHOTOS_PER_PAGE);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Firestore error:', err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [realtime]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;

    setLoadingMore(true);
    try {
      const photosRef = collection(db, PHOTOS_COLLECTION);
      const q = query(
        photosRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PHOTOS_PER_PAGE)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setPhotos((prev) => [...prev, ...data]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length >= PHOTOS_PER_PAGE);
    } catch (err) {
      console.error('Load more error:', err);
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc]);

  return { photos, loading, loadingMore, hasMore, loadMore, error };
}

/**
 * Load a single photo by its Firestore document ID, plus next and prev IDs.
 */
export function usePhoto(id) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchPhotoData = async () => {
      try {
        const docRef = doc(db, PHOTOS_COLLECTION, id);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          if (isMounted) {
            setError('not-found');
            setLoading(false);
          }
          return;
        }

        const data = snap.data();
        const createdAt = data.createdAt;

        let nextId = null;
        let prevId = null;

        // "desc" order means:
        // NEXT photo in gallery = older (createdAt < current) -> startAfter
        // PREV photo in gallery = newer (createdAt > current) -> endBefore
        if (createdAt) {
          const photosRef = collection(db, PHOTOS_COLLECTION);
          
          const nextQ = query(photosRef, orderBy('createdAt', 'desc'), startAfter(createdAt), limit(1));
          const prevQ = query(photosRef, orderBy('createdAt', 'desc'), endBefore(createdAt), limitToLast(1));

          const [nextSnap, prevSnap] = await Promise.all([getDocs(nextQ), getDocs(prevQ)]);

          nextId = !nextSnap.empty ? nextSnap.docs[0].id : null;
          prevId = !prevSnap.empty ? prevSnap.docs[0].id : null;
        }

        if (isMounted) {
          setPhoto({ id: snap.id, nextId, prevId, ...data });
          setLoading(false);
        }
      } catch (err) {
        console.error('Photo load error:', err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchPhotoData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return { photo, loading, error };
}
