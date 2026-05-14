import React, { useState } from 'react';
import { LayoutGrid, Heart, Clock, Trash2, FolderOpen, ChevronRight, Plus, X, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '../context/LanguageContext';
import { useAlbums } from '../hooks/useAlbums';
import { useGallery } from '../hooks/useGallery';
import { createAlbum, deleteAlbum } from '../services/photoService';
import { ConfirmModal } from './ConfirmModal';

export function Sidebar({ selectedAlbum, onSelectAlbum }: { selectedAlbum: string | null, onSelectAlbum: (id: string | null) => void }) {
  const { t } = useTranslation();
  const { albums, loading } = useAlbums();
  const [isAddingAlbum, setIsAddingAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<string | null>(null);

  const { photos, loading: galleryLoading } = useGallery();

  const calculateStorage = () => {
    const bytes = photos.reduce((acc, photo) => acc + (photo.url?.length || 0), 0);
    const mb = bytes / (1024 * 1024);
    const limitMB = 50; 
    const percentage = Math.min(100, (mb / limitMB) * 100);
    return { percentage, formatted: mb.toFixed(1) };
  };

  const storage = calculateStorage();

  const handleAddAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumTitle.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createAlbum(newAlbumTitle.trim());
      setNewAlbumTitle('');
      setIsAddingAlbum(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!albumToDelete) return;
    try {
      if (selectedAlbum === albumToDelete) {
        onSelectAlbum(null);
      }
      await deleteAlbum(albumToDelete);
    } catch (err) {
      console.error(err);
    } finally {
      setAlbumToDelete(null);
    }
  };

  const navItems = [
    { id: 'all', label: t.albums, icon: LayoutGrid },
    { id: 'favorites', label: t.favorites, icon: Heart },
    { id: 'recent', label: t.recentlyAdded, icon: Clock },
    { id: 'trash', label: t.trash, icon: Trash2 },
  ];

  return (
    <aside className="fixed left-0 top-20 bottom-0 w-64 glass border-r border-white/5 p-6 hidden lg:block overflow-y-auto">
      <div className="space-y-6">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectAlbum(item.id === 'all' ? null : item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                (selectedAlbum === item.id || (item.id === 'all' && selectedAlbum === null))
                  ? 'sidebar-item-active shadow-lg shadow-accent-purple/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{t.albums}</h3>
            <button 
              onClick={() => setIsAddingAlbum(true)}
              className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <AnimatePresence>
            {isAddingAlbum && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddAlbum}
                className="px-2 mb-4 space-y-2 overflow-hidden"
              >
                <div className="relative">
                  <input 
                    autoFocus
                    value={newAlbumTitle}
                    onChange={(e) => setNewAlbumTitle(e.target.value)}
                    placeholder="Nom de l'album..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-accent-purple"
                  />
                  <button 
                    type="button"
                    onClick={() => setIsAddingAlbum(false)}
                    className="absolute right-2 top-1.5 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting || !newAlbumTitle.trim()}
                  className="w-full py-1.5 bg-accent-purple text-white text-[10px] font-bold uppercase tracking-wider rounded-lg disabled:opacity-50 hover:bg-accent-purple/90 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  <span>Créer</span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
          
          <div className="space-y-1">
            {loading ? (
              <div className="px-4 py-2">
                <div className="h-4 w-24 bg-white/5 animate-pulse rounded" />
              </div>
            ) : (
              albums.map((album) => (
                <div 
                  key={album.id}
                  className="group/album relative"
                >
                  <button
                    onClick={() => onSelectAlbum(album.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all group ${selectedAlbum === album.id ? 'text-white bg-white/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-4 h-4 opacity-40" />
                      <span className="text-sm font-medium">{album.title}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button 
                    onClick={() => setAlbumToDelete(album.id)}
                    className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-red-500 opacity-0 group-hover/album:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!albumToDelete}
        onClose={() => setAlbumToDelete(null)}
        onConfirm={handleDeleteAlbum}
        title="Supprimer l'Album"
        message="Êtes-vous sûr de vouloir supprimer cet album ? Les photos resteront dans votre archive globale mais l'album sera définitivement retiré."
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      <div className="mt-auto pt-8">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 space-y-3">
          <div className="flex justify-between items-center text-[10px] text-white/60 font-bold uppercase tracking-wider">
            <span>Stockage</span>
            <span>{storage.percentage.toFixed(0)}%</span>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${storage.percentage}%` }}
              className={`h-full ${storage.percentage > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-accent-purple to-accent-blue'}`}
            />
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed font-medium">
            {storage.formatted} MB utilisés sur 50 MB
          </p>
        </div>
      </div>
    </aside>
  );
}
