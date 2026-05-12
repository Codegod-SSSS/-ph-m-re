import { LayoutGrid, Heart, Clock, Trash2, FolderOpen, ChevronRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from '../context/LanguageContext';

export function Sidebar({ selectedAlbum, onSelectAlbum }: { selectedAlbum: string | null, onSelectAlbum: (id: string | null) => void }) {
  const { t } = useTranslation();

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
            <button className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-1">
            {/* Mock Albums for UI development */}
            {['Voyage 2024', 'Famille', 'Nature Noir', 'Urbain'].map((album) => (
              <button
                key={album}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-4 h-4 opacity-40" />
                  <span className="text-sm font-medium">{album}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 space-y-3">
          <div className="flex justify-between items-center text-[10px] text-white/60 font-bold uppercase tracking-wider">
            <span>Stockage</span>
            <span>74%</span>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '74%' }}
              className="h-full bg-gradient-to-r from-accent-purple to-accent-blue"
            />
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">Libérez de l'espace pour vos moments magiques.</p>
        </div>
      </div>
    </aside>
  );
}
