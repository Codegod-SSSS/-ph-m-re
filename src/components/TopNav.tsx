import { Search, Upload, Globe, User, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { Language } from '../lib/translations';
import { AccountSettingsModal } from './AccountSettingsModal';
import { auth } from '../lib/firebase';

export function TopNav({ onUploadClick, onSearch }: { onUploadClick: () => void, onSearch: (query: string) => void }) {
  const { t, language, setLanguage } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const user = auth.currentUser;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearch(val);
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'ko', label: '한국어' },
    { code: 'tw', label: 'Twi' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-20 px-6 flex items-center justify-between glass border-b border-white/5">
      <div className="flex items-center gap-3">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-lg"
        >
          <span className="font-serif italic text-white text-lg">É</span>
        </motion.div>
        <div className="text-lg font-serif italic tracking-[0.1em] text-white">
          ÉPHÉMÈRE
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent-blue transition-colors" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full h-10 pl-11 pr-4 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue/50 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={onUploadClick}
          className="btn-primary flex items-center gap-2 group relative"
        >
          <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          <span>{t.upload}</span>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-dark-primary border border-white/10 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {t.uploadPhotos}
          </span>
        </button>

        <div className="relative group/lang">
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
          >
            <span className="text-xs font-bold text-white">{language.toUpperCase()}</span>
            <Globe className="w-3 h-3 text-white/60" />
          </button>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-dark-primary border border-white/10 text-[10px] text-white rounded opacity-0 group-hover/lang:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            Language
          </span>

          <AnimatePresence>
            {isLangOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 glass-card border border-white/10 p-2"
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      language === lang.code 
                        ? 'bg-accent-purple text-white' 
                        : 'hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => setIsAccountOpen(true)}
          className="relative group p-0.5 rounded-full bg-gradient-to-tr from-accent-purple to-accent-blue p-[1px] hover:scale-105 active:scale-95 transition-all shadow-lg overflow-hidden flex items-center justify-center h-10 w-10"
          id="account-settings-btn"
        >
          <div className="w-full h-full rounded-full bg-dark-primary flex items-center justify-center overflow-hidden">
            {user?.photoURL ? (
               <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1.5 bg-dark-primary border border-white/10 text-[10px] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl tracking-wider uppercase font-bold">
            Compte
          </span>
        </button>
      </div>

      <AccountSettingsModal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
    </nav>
  );
}
