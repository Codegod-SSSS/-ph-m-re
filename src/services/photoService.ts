import { doc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';

export async function createAlbum(title: string, description: string = '') {
  if (!auth.currentUser) throw new Error("Authentication required");
  try {
    const docRef = await addDoc(collection(db, 'albums'), {
      title,
      description,
      ownerId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'albums');
  }
}

export async function deleteAlbum(albumId: string) {
  try {
    await deleteDoc(doc(db, 'albums', albumId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `albums/${albumId}`);
  }
}

export async function toggleFavorite(photoId: string, currentState: boolean) {
  try {
    const photoRef = doc(db, 'photos', photoId);
    await updateDoc(photoRef, { isFavorite: !currentState });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `photos/${photoId}`);
  }
}

export async function updatePhotoMetadata(photoId: string, data: { title?: string, description?: string, frameStyle?: string }) {
  try {
    const photoRef = doc(db, 'photos', photoId);
    await updateDoc(photoRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `photos/${photoId}`);
  }
}

export async function deletePhoto(photoId: string) {
  try {
    const photoRef = doc(db, 'photos', photoId);
    await deleteDoc(photoRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `photos/${photoId}`);
  }
}
