import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Check } from "lucide-react";
import { useLanguage, Language } from "../../context/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "es", label: "ESP", flag: "🇪🇸" },
    { code: "en", label: "ENG", flag: "🇺🇸" },
    { code: "zh", label: "中文", flag: "🇨🇳" },
  ];

  const currentLang = languages.find((l) => l.code === language);

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-full right-0 mt-2 bg-dark-card rounded-[20px] shadow-2xl border border-white/10 overflow-hidden min-w-[140px] z-[200]">
            <div className="p-1.5 space-y-1">
              {languages.map((lang) => (
                <button key={lang.code} onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${
                    language === lang.code
                      ? "bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white"
                      : "hover:bg-white/10 text-zinc-400"
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span className="text-[11px] font-black uppercase tracking-widest">{lang.label}</span>
                  </div>
                  {language === lang.code && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
        className={`flex items-center gap-2 px-4 py-3 rounded-full transition-all border ${
          isOpen
            ? "bg-primary-vibrant text-white border-primary-vibrant"
            : "bg-white/5 text-zinc-400 border-white/10 hover:border-primary-vibrant/50 hover:text-white"
        }`}>
        <span className="text-base">{currentLang?.flag}</span>
        <span className="text-[11px] font-black uppercase tracking-widest hidden sm:inline">{currentLang?.label}</span>
        <Globe className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
