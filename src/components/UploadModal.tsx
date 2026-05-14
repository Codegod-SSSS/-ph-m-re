import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Image as ImageIcon, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { generateImageTags } from '../services/aiService';
import { compressImage } from '../lib/imageCompression';

export function UploadModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(f => f.size <= 4 * 1024 * 1024);
    if (validFiles.length < selectedFiles.length) {
      alert("Some files were skipped because they exceed 4MB.");
    }
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const getOrCreateDefaultAlbum = async () => {
    if (!auth.currentUser) return null;
    const q = query(collection(db, 'albums'), where('ownerId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return snapshot.docs[0].id;

    const docRef = await addDoc(collection(db, 'albums'), {
      title: 'Mon Archive',
      description: 'Album par défaut',
      ownerId: auth.currentUser.uid,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  };

  const handleUpload = async () => {
    if (!auth.currentUser || files.length === 0) return;
    setUploading(true);

    try {
      const albumId = await getOrCreateDefaultAlbum();
      if (!albumId) throw new Error("Could not find or create an album.");

      const uploadPromises = files.map(async (file) => {
        setProgress(prev => ({ ...prev, [file.name]: 10 }));
        
        // 1. Compression
        let url: string;
        try {
          url = await compressImage(file);
          setProgress(prev => ({ ...prev, [file.name]: 50 }));
        } catch (err) {
          console.error("Compression failed", err);
          throw err;
        }

        // 2. AI Tags
        let tags: string[] = [];
        try {
          tags = await generateImageTags(url.split(',')[1], file.type);
        } catch (err) {
          console.error("AI Tagging failed", err);
        }
        setProgress(prev => ({ ...prev, [file.name]: 80 }));

        // 3. Firestore Add
        try {
          await addDoc(collection(db, 'photos'), {
            url,
            userId: auth.currentUser?.uid,
            albumId,
            createdAt: serverTimestamp(),
            title: file.name.split('.')[0],
            description: '',
            frameStyle: 'none',
            isFavorite: false,
            tags: tags
          });
          setProgress(prev => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'photos');
        }
      });

      await Promise.all(uploadPromises);
      setTimeout(() => {
        onClose();
        setFiles([]);
        setProgress({});
      }, 500);
    } catch (error) {
      console.error(error);
      alert("Upload failed. Storage might be full or permissions missing.");
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
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-dark-primary/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg glass-card p-8 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-semibold text-white mb-6">Upload Photos</h2>

            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${
                isDragging 
                  ? 'border-accent-purple bg-accent-purple/10 scale-102' 
                  : 'border-white/10 hover:border-accent-purple/50 hover:bg-accent-purple/5'
              }`}
            >
              <div className={`p-4 rounded-full transition-colors ${
                isDragging ? 'bg-accent-purple/20' : 'bg-white/5 group-hover:bg-accent-purple/20'
              }`}>
                <Upload className={`w-8 h-8 transition-transform duration-300 ${
                  isDragging ? 'scale-110 text-accent-purple' : 'text-accent-purple group-hover:scale-110'
                }`} />
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
                    {progress[file.name] === 100 ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      !uploading && (
                        <button 
                          onClick={() => removeFile(file.name)}
                          className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-md transition-all group/remove relative"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-dark-primary border border-white/10 text-[10px] text-white rounded opacity-0 group-hover/remove:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                            Remove
                          </span>
                        </button>
                      )
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
