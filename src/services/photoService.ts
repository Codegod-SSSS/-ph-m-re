import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

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
