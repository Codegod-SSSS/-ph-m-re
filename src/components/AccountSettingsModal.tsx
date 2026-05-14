import React, { useState, useRef } from 'react';
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

  const calculateStorage = () => {
    const bytes = photos.reduce((acc, photo) => acc + (photo.url?.length || 0), 0);
    const mb = bytes / (1024 * 1024);
    // Adjusted limit for demo: 50MB
    const limitMB = 50; 
    const percentage = Math.min(100, (mb / limitMB) * 100);
    return { 
      used: mb.toFixed(1), 
      limit: limitMB, 
      percentage,
      formatted: mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
    };
  };

  const storage = calculateStorage();

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
                <h2 className="text-4xl font-serif italic text-white tracking-tight uppercase">Paramètres</h2>
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
              <div className="flex flex-col items-center gap-12">
                {/* Profile Picture Section */}
                <div className="relative group">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/10 glass-card p-1 shadow-2xl shadow-purple-500/20 ring-4 ring-accent-purple/20">
                    {photoURL ? (
                      <img src={photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-full">
                        <User className="w-16 h-16 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 p-3.5 bg-accent-purple text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all z-20 border-2 border-[#162744]"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    hidden 
                    onChange={handleImageChange}
                  />
                </div>

              <div className="w-full space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">Nom d'affichage</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple/50 transition-all text-white"
                    placeholder="Votre nom"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold ml-1">Email</label>
                  <input 
                    type="text" 
                    value={user?.email || ''}
                    disabled
                    className="w-full h-12 px-4 bg-white/3 border border-white/10 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>
                  {/* Storage Usage Section */}
                  <div className="p-6 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl space-y-5 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-purple/10 rounded-lg">
                          <HardDrive className="w-5 h-5 text-accent-purple" />
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-white tracking-wide">Espace Utilisé</span>
                          <span className="text-[10px] text-white/30 uppercase tracking-widest">{storage.formatted} de {storage.limit} MB</span>
                        </div>
                      </div>
                      <span className="text-2xl font-serif italic text-white/60">{storage.percentage.toFixed(0)}%</span>
                    </div>
                    
                    <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${storage.percentage}%` }}
                        className={`h-full rounded-full transition-all duration-1000 ${
                          storage.percentage > 90 ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 
                          storage.percentage > 70 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-accent-purple to-accent-blue shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                      onClick={handleLogout}
                      className="flex-1 h-16 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center gap-3 group font-bold tracking-wide uppercase text-xs"
                    >
                      <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      <span>Déconnexion</span>
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-[1.5] h-16 bg-accent-purple text-white rounded-2xl shadow-2xl shadow-purple-500/30 hover:bg-accent-purple/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 font-bold tracking-widest uppercase text-xs"
                    >
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : success ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        'Enregistrer les modifications'
                      )}
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
