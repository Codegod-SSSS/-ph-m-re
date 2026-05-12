import { motion, AnimatePresence } from 'motion/react';
import { Heart, Search, MoreHorizontal } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

export interface Photo {
  id: string;
  url: string;
  title: string;
  description?: string;
  isFavorite?: boolean;
  frameStyle?: string;
  tags?: string[];
}

const frameStyles: Record<string, string> = {
  none: '',
  minimal: 'p-4 bg-white shadow-xl',
  black: 'p-6 bg-black border-4 border-slate-800 shadow-2xl',
  gold: 'p-4 border-8 border-yellow-600 bg-amber-50 shadow-[0_0_30px_rgba(202,138,4,0.3)]',
  neon: 'p-1 bg-gradient-to-tr from-accent-purple via-accent-blue to-accent-purple shadow-[0_0_20px_rgba(124,58,237,0.5)]',
  vintage: 'p-4 bg-[#f4ece1] border-2 border-[#d9c5b2] sepia-[0.2]',
  polaroid: 'px-4 pt-4 pb-12 bg-white shadow-xl rounded-sm',
  glass: 'p-4 glass rounded-2xl border border-white/20',
};

export function Gallery({ photos, onPhotoClick }: { photos: Photo[], onPhotoClick: (photo: Photo) => void }) {
  const { t } = useTranslation();

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Search className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg">{t.noPhotos}</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      <AnimatePresence>
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="break-inside-avoid relative group"
            onClick={() => onPhotoClick(photo)}
          >
            <div className={`relative overflow-hidden cursor-pointer ${frameStyles[photo.frameStyle || 'none']}`}>
              <img 
                src={photo.url} 
                alt={photo.title}
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-sm line-clamp-1">{photo.title}</h3>
                    {photo.description && (
                      <p className="text-slate-300 text-xs line-clamp-1">{photo.description}</p>
                    )}
                  </div>
                  <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <Heart className={`w-4 h-4 ${photo.isFavorite ? 'fill-accent-purple text-accent-purple' : 'text-white'}`} />
                  </button>
                </div>
              </div>

              {/* Decorative glows */}
              <div className="absolute -inset-2 bg-accent-purple/0 group-hover:bg-accent-purple/5 blur-2xl transition-all duration-500 -z-10" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
