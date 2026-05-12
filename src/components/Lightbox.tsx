import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Download, Share2, Heart, Edit3, Trash2, Frame, Play, Pause, FastForward, Settings2 } from 'lucide-react';
import { Photo } from './Gallery';
import { useTranslation } from '../context/LanguageContext';
import { toggleFavorite, deletePhoto, updatePhotoMetadata } from '../services/photoService';

const frameOptions = ['none', 'minimal', 'black', 'gold', 'neon', 'vintage', 'polaroid', 'glass'];
const transitionOptions = ['fade', 'slide', 'zoom'];

export function Lightbox({ photo, onClose, onPrev, onNext }: { 
  photo: Photo | null, 
  onClose: () => void,
  onPrev: () => void,
  onNext: () => void
}) {
  const { t } = useTranslation();
  const [showFrames, setShowFrames] = useState(false);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [slideshowDuration, setSlideshowDuration] = useState(3000);
  const [transitionType, setTransitionType] = useState('fade');
  const [showSlideshowControls, setShowSlideshowControls] = useState(false);
  const slideshowTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSlideshowActive && photo) {
      slideshowTimerRef.current = setTimeout(() => {
        onNext();
      }, slideshowDuration);
    } else {
      if (slideshowTimerRef.current) clearTimeout(slideshowTimerRef.current);
    }
    return () => {
      if (slideshowTimerRef.current) clearTimeout(slideshowTimerRef.current);
    };
  }, [isSlideshowActive, photo, slideshowDuration, onNext]);

  if (!photo) return null;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(photo.id, !!photo.isFavorite);
  };

  const handleDelete = async () => {
    if (window.confirm(t.deleteConfirm)) {
      await deletePhoto(photo.id);
      onClose();
    }
  };

  const handleFrameSelect = async (style: string) => {
    await updatePhotoMetadata(photo.id, { frameStyle: style });
    setShowFrames(false);
  };

  const getTransitionProps = () => {
    switch (transitionType) {
      case 'slide':
        return {
          initial: { x: 300, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -300, opacity: 0 }
        };
      case 'zoom':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1.2, opacity: 0 }
        };
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
      >
        <div className="absolute inset-0 bg-dark-primary/95 backdrop-blur-2xl" onClick={onClose} />
        
        <div className="relative w-full h-full flex flex-col md:flex-row gap-8">
          {/* Main Image View */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={photo.id + (photo.frameStyle || 'none')}
                {...getTransitionProps()}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                src={photo.url}
                alt={photo.title}
                className={`max-w-[90%] max-h-[90%] object-contain shadow-2xl transition-all duration-500`}
              />
            </AnimatePresence>

            {/* Navigation Controls */}
            {!isSlideshowActive && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); onPrev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 glass-card hover:bg-white/20 transition-all text-white rounded-full z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 glass-card hover:bg-white/20 transition-all text-white rounded-full z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Slideshow Progress Bar */}
            {isSlideshowActive && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  key={photo.id}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: slideshowDuration / 1000, ease: "linear" }}
                  className="h-full bg-accent-purple"
                />
              </div>
            )}
          </div>

          {/* Info Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-80 glass-card p-6 flex flex-col gap-6 relative overflow-visible"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{photo.title}</h2>
              <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400 text-sm">{photo.description || 'No description provided.'}</p>

            {/* Tags Display */}
            {photo.tags && photo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photo.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-slate-400 uppercase tracking-wider">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <button 
                onClick={() => setShowFrames(!showFrames)}
                className="w-full flex items-center gap-3 px-4 py-3 glass-card hover:bg-white/10 text-white transition-all text-sm font-medium"
              >
                <Frame className="w-4 h-4 text-accent-blue" />
                {t.applyFrame}: <span className="text-accent-blue ml-auto">{(t.frames as any)[photo.frameStyle || 'none']}</span>
              </button>

              <AnimatePresence>
                {showFrames && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-64 left-6 right-6 glass-card p-4 grid grid-cols-2 gap-2 z-20"
                  >
                    {frameOptions.map((f) => (
                      <button
                        key={f}
                        onClick={() => handleFrameSelect(f)}
                        className={`text-xs p-2 rounded-lg transition-all ${
                          photo.frameStyle === f ? 'bg-accent-purple text-white' : 'hover:bg-white/10 text-slate-400'
                        }`}
                      >
                        {(t.frames as any)[f]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Slideshow Controls */}
              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsSlideshowActive(!isSlideshowActive)}
                      className={`p-3 rounded-xl transition-all ${isSlideshowActive ? 'bg-accent-purple text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                      {isSlideshowActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <span className="text-sm font-medium text-white">Slideshow</span>
                  </div>
                  <button 
                    onClick={() => setShowSlideshowControls(!showSlideshowControls)}
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400"
                  >
                    <Settings2 className="w-5 h-5" />
                  </button>
                </div>

                <AnimatePresence>
                  {showSlideshowControls && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Duration: {slideshowDuration / 1000}s</label>
                        <input 
                          type="range" 
                          min="2000" 
                          max="10000" 
                          step="1000"
                          value={slideshowDuration}
                          onChange={(e) => setSlideshowDuration(Number(e.target.value))}
                          className="w-full accent-accent-purple"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Transition</label>
                        <div className="grid grid-cols-3 gap-1">
                          {transitionOptions.map(type => (
                            <button
                              key={type}
                              onClick={() => setTransitionType(type)}
                              className={`text-[10px] py-1 rounded transition-all uppercase font-bold tracking-tighter ${transitionType === type ? 'bg-accent-blue text-dark-primary' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href={photo.url} 
                  download 
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 glass-card hover:bg-white/10 text-xs font-medium text-white"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
                <button className="flex items-center justify-center gap-2 px-4 py-2 glass-card hover:bg-white/10 text-xs font-medium text-white">
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleFavorite}
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-accent-purple transition-all"
                  >
                    <Heart className={`w-5 h-5 ${photo.isFavorite ? 'fill-accent-purple text-accent-purple' : ''}`} />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
                    <Edit3 className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={handleDelete}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
