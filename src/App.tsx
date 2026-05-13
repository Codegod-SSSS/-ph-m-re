/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Loader2, PlusCircle } from 'lucide-react';
import { Background } from './components/Background';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { Gallery, Photo } from './components/Gallery';
import { Lightbox } from './components/Lightbox';
import { UploadModal } from './components/UploadModal';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import { auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { useGallery } from './hooks/useGallery';
import { useAlbums } from './hooks/useAlbums';

function AppContent() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { albums, loading: albumsLoading } = useAlbums();
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { photos, loading: photosLoading } = useGallery(
    selectedAlbum && selectedAlbum !== 'favorites' ? selectedAlbum : null, 
    selectedAlbum === 'favorites' ? 'favorites' : null, 
    searchQuery
  );

  useEffect(() => {
    if (!selectedAlbum && albums.length > 0) {
      setSelectedAlbum(albums[0].id);
    }
  }, [albums, selectedAlbum]);

  const loading = albumsLoading || photosLoading;

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider);
  };

  const handlePrev = () => {
    if (!activePhoto) return;
    const idx = photos.findIndex(p => p.id === activePhoto.id);
    if (idx > 0) setActivePhoto(photos[idx - 1]);
  };

  const handleNext = () => {
    if (!activePhoto) return;
    const idx = photos.findIndex(p => p.id === activePhoto.id);
    if (idx < photos.length - 1) setActivePhoto(photos[idx + 1]);
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-primary">
        <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 bg-dark-primary">
        <Background />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 max-w-md w-full text-center space-y-8 relative z-10"
        >
          <div className="space-y-4">
            <h1 className="text-6xl font-serif italic font-light text-white tracking-[0.3em]">ÉPHÉMÈRE</h1>
            <p className="text-slate-400 font-light uppercase tracking-widest text-xs">Digital Arts Archive</p>
          </div>
          
          <button 
            onClick={handleLogin}
            className="w-full h-14 bg-white text-dark-primary font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-200 transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Connect with Google
          </button>
          
          <p className="text-xs text-slate-500 uppercase tracking-widest">Sign in to start your magical collection</p>
        </motion.div>
      </div>
    );
  }

  // Derive the active photo from the photos array to ensure it's always up-to-date
  const activePhotoData = activePhoto ? photos.find(p => p.id === activePhoto.id) || activePhoto : null;

  return (
    <div className="min-h-screen bg-dark-primary">
      <Background />
      <TopNav onUploadClick={() => setIsUploadOpen(true)} onSearch={setSearchQuery} />
      
      <div className="pt-20 lg:pl-64 flex flex-col min-h-screen">
        <Sidebar selectedAlbum={selectedAlbum} onSelectAlbum={setSelectedAlbum} />
        
        <main className="flex-1 p-6 md:p-12">
          {/* Hero Banner Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full h-[300px] md:h-[450px] mb-12 rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 group"
          >
            <img 
              src="/ephemere.png" 
              alt="ÉPHÉMÈRE Banner" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-primary/60 via-transparent to-transparent" />
            
            <div className="absolute inset-x-0 bottom-12 flex flex-col items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-4">
                  <div className="w-8 h-px bg-white/20" />
                  <span className="text-[10px] md:text-xs text-white/40 font-bold uppercase tracking-[0.6em] whitespace-nowrap">GALERIE D'ART NUMÉRIQUE</span>
                  <div className="w-8 h-px bg-white/20" />
                </div>
              </motion.div>
            </div>
          </motion.div>

          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-light italic serif text-white">
                {selectedAlbum === 'favorites' ? t.favorites : (selectedAlbum === null ? (user?.displayName ? `Les Archives de ${user.displayName.split(' ')[0]}` : "Vos Moments Enchantés") : (albums.find(a => a.id === selectedAlbum)?.title || selectedAlbum))}
              </h1>
              <p className="text-white/40 text-sm font-medium">Capturez la magie du temps</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent-purple text-white font-medium shadow-lg shadow-purple-500/20 hover:bg-accent-purple/90 active:scale-95 transition-all text-sm group"
                id="header-upload-btn"
              >
                <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>Upload Masterpiece</span>
              </button>
            </div>
          </header>

          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 className="w-8 h-8 text-accent-purple animate-spin" />
            </div>
          ) : (
            <Gallery photos={photos} onPhotoClick={setActivePhoto} />
          )}
        </main>
      </div>

      <Lightbox 
        photo={activePhotoData} 
        onClose={() => setActivePhoto(null)} 
        onPrev={handlePrev}
        onNext={handleNext}
      />
      
      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

