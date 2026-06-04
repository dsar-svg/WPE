
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Clock, ArrowRight, UtensilsCrossed, ArrowLeft, Info } from 'lucide-react';
import { Location } from '../types';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface WelcomeScreenProps {
  onSelectLocation: (loc: Location) => void;
  locations: Location[];
  config: { name: string, logo: string };
}

const formatTime12h = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

export function WelcomeScreen({ onSelectLocation, locations, config }: WelcomeScreenProps) {
  const { t, language } = useLanguage();
  const isLocationOpen = (loc: Location) => {
    if (!loc.openTime || !loc.closeTime) return true;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [openH, openM] = loc.openTime.split(':').map(Number);
    const [closeH, closeM] = loc.closeTime.split(':').map(Number);
    
    const openInMinutes = openH * 60 + openM;
    const closeInMinutes = closeH * 60 + closeM;
    
    if (closeInMinutes < openInMinutes) {
      return currentTime >= openInMinutes || currentTime < closeInMinutes;
    }
    
    return currentTime >= openInMinutes && currentTime < closeInMinutes;
  };

  const visibleLocations = locations.filter(loc => loc.isOpen);

  return (
    <div className="min-h-screen bg-white flex flex-col text-zinc-900 font-sans overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 vibrant-gradient opacity-10 blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-secondary-vibrant/10 blur-3xl -z-10" />

      {/* Top Header with Back Button */}
      <div className="relative z-20 p-6 flex items-center justify-between max-w-lg mx-auto w-full">
        <Link 
          to="/" 
          className="group flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-zinc-100 shadow-lg hover:bg-white hover:border-primary-vibrant transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-primary-vibrant group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('nav.home')}</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col p-8 pt-0 text-center max-w-lg mx-auto w-full relative z-10">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-12 mb-8 mx-auto relative"
        >
          <div className="absolute inset-0 bg-primary-vibrant/20 rounded-full blur-xl animate-pulse" />
          {config.logo ? (
            <img
              src={config.logo}
              alt={config.name}
              className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full border-4 border-white shadow-2xl z-10"
            />
          ) : (
            <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full border-4 border-white shadow-2xl z-10 bg-zinc-100 flex items-center justify-center">
              <UtensilsCrossed className="w-14 h-14 text-primary-vibrant" />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-12"
        >
          <div className="flex flex-col items-center">
            <span className="text-secondary-vibrant font-black uppercase tracking-[0.3em] text-[10px] mb-1 italic">{t('welcome.greeting')}</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-zinc-900">
              {config.name}
            </h1>
            <div className="w-12 h-1.5 bg-primary-vibrant rounded-full mt-2" />
          </div>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{t('welcome.selectLocation')}</p>
        </motion.div>

        <div className="flex flex-col gap-6">
          {visibleLocations.length === 0 ? (
            <div className="py-20 px-6 border-2 border-dashed border-zinc-200 rounded-[40px] flex flex-col items-center gap-4 bg-zinc-50">
              <div className="w-20 h-20 bg-zinc-100 rounded-[24px] flex items-center justify-center transform rotate-12">
                <UtensilsCrossed className="w-10 h-10 text-zinc-300" />
              </div>
              <p className="text-zinc-400 text-sm font-bold uppercase tracking-widest max-w-[200px]">{t('welcome.noLocations')}</p>
            </div>
          ) : visibleLocations.map((loc, index) => {
            const isOpenByTime = isLocationOpen(loc);
            
            return (
              <motion.button
                key={loc.id}
                initial={{ x: index % 2 === 0 ? -50 : 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1, type: 'spring', damping: 20 }}
                onClick={() => isLocationOpen(loc) && onSelectLocation(loc)}
                className={`group relative overflow-hidden rounded-[40px] flex flex-col transition-all text-left shadow-xl ${
                  isOpenByTime 
                    ? 'bg-white border border-zinc-100 hover:shadow-primary-vibrant/20 hover:-translate-y-2 cursor-pointer' 
                    : 'bg-zinc-100/50 grayscale cursor-not-allowed opacity-70'
                }`}
              >
                <div className="h-44 w-full relative">
                  <img 
                    src={loc.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80'} 
                    className={`w-full h-full object-cover transition-transform duration-700 ${isOpenByTime ? 'group-hover:scale-110' : ''}`} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl ${
                      isOpenByTime ? 'bg-open-green text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {isOpenByTime ? t('locations.open') : t('locations.closed')}
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <h4 className="font-black text-2xl text-white uppercase tracking-tight group-hover:text-secondary-vibrant transition-colors">{loc.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5 text-secondary-vibrant" />
                      <p className="text-zinc-200 text-[10px] font-black uppercase tracking-widest">
                        {formatTime12h(loc.openTime)} - {formatTime12h(loc.closeTime)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <MapPin className="w-4 h-4 text-primary-vibrant flex-shrink-0 mt-0.5" />
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-tight line-clamp-1">{loc.address}</p>
                  </div>
                  <div className="bg-zinc-100 p-3 rounded-2xl group-hover:bg-primary-vibrant group-hover:text-white transition-all transform group-hover:rotate-12">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
        
        <div className="mt-16 pb-8 text-center">
          <Link 
            to="/admin" 
            className="text-[10px] text-zinc-300 font-black uppercase tracking-[0.3em] hover:text-primary-vibrant transition-colors"
          >
            {t('welcome.admin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
