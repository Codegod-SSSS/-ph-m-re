import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Image as ImageIcon, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { db, storage, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateImageTags } from '../services/aiService';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result?.toString().split(',')[1];
      if (base64String) resolve(base64String);
      else reject('Failed to convert file to base64');
    };
    reader.onerror = error => reject(error);
  });
};

export function UploadModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!auth.currentUser || files.length === 0) return;
    setUploading(true);

    const uploadPromises = files.map(async (file) => {
      const storageRef = ref(storage, `photos/${auth.currentUser?.uid}/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(prev => ({ ...prev, [file.name]: p }));
          },
          (error) => reject(error),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Generate AI tags
            let tags: string[] = [];
            try {
              const base64 = await fileToBase64(file);
              tags = await generateImageTags(base64, file.type);
            } catch (err) {
              console.error("AI Tagging failed for", file.name, err);
            }

            try {
              await addDoc(collection(db, 'photos'), {
                url: downloadURL,
                userId: auth.currentUser?.uid,
                createdAt: serverTimestamp(),
                title: file.name.split('.')[0],
                description: '',
                frameStyle: 'none',
                isFavorite: false,
                tags: tags
              });
              resolve(downloadURL);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, 'photos');
              reject(error);
            }
          }
        );
      });
    });

    try {
      await Promise.all(uploadPromises);
      onClose();
      setFiles([]);
      setProgress({});
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-dark-primary/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg glass-card p-8 relative"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-semibold text-white mb-6">Upload Photos</h2>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-accent-purple/50 hover:bg-accent-purple/5 transition-all cursor-pointer group"
            >
              <div className="p-4 bg-white/5 rounded-full group-hover:bg-accent-purple/20 transition-colors">
                <Upload className="w-8 h-8 text-accent-purple" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">{t.dragDrop}</p>
                <p className="text-slate-500 text-sm">{t.orClick}</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                hidden 
                accept="image/*"
                onChange={onFileChange}
              />
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {files.map((file) => (
                  <div key={file.name} className="flex items-center gap-4 p-3 glass-card bg-white/5">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <ImageIcon className="w-4 h-4 text-accent-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{file.name}</p>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                          className="h-full bg-accent-purple"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress[file.name] || 0}%` }}
                        />
                      </div>
                    </div>
                    {progress[file.name] === 100 && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 glass-card hover:bg-white/10 text-white font-medium transition-all"
                disabled={uploading}
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="flex-1 py-3 bg-accent-purple hover:bg-accent-purple/80 text-white font-medium rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload {files.length > 0 ? `(${files.length})` : ''}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
