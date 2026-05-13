import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Camera, LogOut, Check, Loader2 } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { compressImage } from '../lib/imageCompression';
import { useTranslation } from '../context/LanguageContext';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const { t } = useTranslation();
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-dark-primary/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md glass-card p-8 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif italic text-white tracking-wide">Paramètres du Compte</h2>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-8">
              {/* Profile Picture */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-white/10 glass-card p-1 shadow-2xl shadow-purple-500/10">
                  {photoURL ? (
                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-full">
                      <User className="w-12 h-12 text-slate-500" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2.5 bg-accent-purple text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                  <Camera className="w-4 h-4" />
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

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleLogout}
                    className="flex-1 h-12 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all flex items-center justify-center gap-2 group"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 h-12 bg-accent-purple text-white rounded-xl shadow-lg shadow-purple-500/20 hover:bg-accent-purple/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : success ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      'Sauvegarder'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative background accent */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-purple/10 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-blue/10 blur-[100px] rounded-full" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
