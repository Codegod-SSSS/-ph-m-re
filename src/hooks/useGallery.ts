import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Photo } from '../components/Gallery';

export function useGallery(albumId: string | null = null, filter: string | null = null, searchQuery: string = '') {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    let q = query(
      collection(db, 'photos'),
      where('userId', '==', auth.currentUser.uid)
    );

    if (albumId) {
      q = query(q, where('albumId', '==', albumId));
    }

    if (filter === 'favorites') {
      q = query(q, where('isFavorite', '==', true));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Photo[];

      // In-memory sorting by createdAt desc
      docs.sort((a, b) => {
        const timeA = (a.createdAt as any)?.toMillis?.() || 0;
        const timeB = (b.createdAt as any)?.toMillis?.() || 0;
        return timeB - timeA;
      });

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        docs = docs.filter(photo => 
          photo.title?.toLowerCase().includes(lowerQuery) ||
          photo.description?.toLowerCase().includes(lowerQuery) ||
          photo.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      }

      setPhotos(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'photos');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [albumId, filter, searchQuery, auth.currentUser]);

  return { photos, loading };
}
