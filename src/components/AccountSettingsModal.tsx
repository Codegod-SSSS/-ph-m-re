import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Camera, LogOut, Check, Loader2, HardDrive } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { compressImage } from '../lib/imageCompression';
import { useTranslation } from '../context/LanguageContext';
import { useGallery } from '../hooks/useGallery';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const { t } = useTranslation();
  const user = auth.currentUser;
  const { photos } = useGallery();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storage = useMemo(() => {
    if (!photos || photos.length === 0) {
      return { 
        used: '0.0', 
        remaining: '50.0', 
        limit: 50, 
        percentage: 0,
        formattedUsed: '0 KB',
        formattedRemaining: '50.0 MB'
      };
    }

    const totalBytes = photos.reduce((acc, photo) => {
      // Prioritize stored size, then estimate from data URL length
      const photoSize = photo.size || (photo.url?.length ? Math.round((photo.url.length * 3) / 4 * 0.75) : 0);
      return acc + photoSize;
    }, 0);

    const mb = totalBytes / (1024 * 1024);
    const limitMB = 50; 
    const percentage = Math.min(100, (mb / limitMB) * 100);
    const remainingMB = Math.max(0, limitMB - mb);
    
    return { 
      used: mb.toFixed(2), 
      remaining: remainingMB.toFixed(2),
      limit: limitMB, 
      percentage,
      formattedUsed: mb >= 1 ? `${mb.toFixed(1)} MB` : `${(totalBytes / 1024).toFixed(0)} KB`,
      formattedRemaining: remainingMB >= 1 ? `${remainingMB.toFixed(1)} MB` : `${(remainingMB * 1024).toFixed(0)} KB`
    };
  }, [photos]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setLoading(true);
        // Compress profile pic more aggressively for speed (e.g. 400px)
        const compressed = await compressImage(file, 400, 200000); 
        setPhotoURL(compressed);
      } catch (err) {
        console.error("Profile pic compression failed", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setSuccess(false);

    try {
      // 1. Update Auth Profile
      await updateProfile(user, {
        displayName,
        photoURL
      });

      // 2. Sync to Firestore 'users' collection for better reliability
      try {
        await setDoc(doc(db, 'users', user.uid), {
          displayName,
          photoURL,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-end p-4 md:p-10 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 250 }}
            className="w-full max-w-[650px] h-[92vh] bg-[#0F1F35] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed At Top */}
            <div className="p-8 md:p-10 pb-8 bg-[#162744] border-b border-white/5 flex items-center justify-between shrink-0 z-30">
              <div className="space-y-2">
                <h2 className="text-4xl font-serif italic text-white tracking-tight uppercase">{t.settings}</h2>
                <div className="h-1 w-20 bg-gradient-to-r from-accent-purple to-accent-blue rounded-full" />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-4 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/10 group shadow-lg"
              >
                <X className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Content - Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
              <div className="flex flex-col items-center gap-10">
                {/* Profile Picture Section */}
                <div className="relative">
                  <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-white/10 glass-card p-1 shadow-[0_0_50px_rgba(168,85,247,0.2)] ring-8 ring-accent-purple/5">
                    {photoURL ? (
                      <img src={photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full bg-[#162744] flex items-center justify-center rounded-full">
                        <User className="w-20 h-20 text-slate-500/50" />
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info Section */}
                <div className="w-full text-center space-y-2">
                  <h3 className="text-4xl font-serif italic text-white tracking-tight">{displayName || 'Utilisateur'}</h3>
                  <div className="flex items-center justify-center gap-2 text-white/40 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>{t.activeSince} {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString(t.title === 'Galerie Lumina' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : t.recently}</span>
                  </div>
                </div>

                <div className="w-full h-px bg-white/5" />

                <div className="w-full space-y-8">
                  {/* Storage Usage Section */}
                  <div className="p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <HardDrive className="w-24 h-24 text-accent-purple" />
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] text-white/30 uppercase tracking-[0.3em] font-bold mb-1">{t.storageRemaining}</span>
                          <span className="text-2xl font-serif italic text-white">{storage.formattedRemaining} <span className="text-white/30 text-lg">{t.free}</span></span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-white/30 uppercase tracking-[0.1em] block mb-1">{t.used}</span>
                          <motion.span 
                            key={storage.percentage}
                            initial={{ opacity: 0.5, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-serif italic text-accent-purple block"
                          >
                            {storage.percentage < 0.1 && storage.percentage > 0 
                              ? storage.percentage.toFixed(2) 
                              : storage.percentage.toFixed(1)}%
                          </motion.span>
                        </div>
                      </div>
                      
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${storage.percentage}%` }}
                          className={`h-full rounded-full transition-all duration-1000 ${
                            storage.percentage > 90 ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 
                            storage.percentage > 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-accent-purple to-accent-blue shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-white/30 text-center italic tracking-wider">
                        {storage.percentage > 90 ? t.storageWarning : t.storageOptimized}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-4 pt-6">
                    <button 
                      onClick={handleLogout}
                      className="w-full h-16 bg-white/5 border border-white/10 text-white/60 rounded-2xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center gap-3 group font-bold tracking-widest uppercase text-[10px]"
                    >
                      <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      <span>{t.logoutSession}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative background accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent-purple/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-blue/5 blur-[120px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
