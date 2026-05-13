import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Album {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: any;
}

export function useAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setAlbums([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'albums'),
      where('ownerId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Album[];
      
      // In-memory sort
      docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setAlbums(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'albums');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  return { albums, loading };
}
