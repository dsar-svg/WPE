import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Clock, ArrowRight, UtensilsCrossed, ArrowLeft, Info } from "lucide-react";
import { Location } from "../../types";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

interface WelcomeScreenProps {
  onSelectLocation: (loc: Location) => void;
  locations: Location[];
  config: { name: string; logo: string };
}

const formatTime12h = (time: string) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

export function WelcomeScreen({ onSelectLocation, locations, config }: WelcomeScreenProps) {
  const { t, language } = useLanguage();

  const isLocationOpen = (loc: Location) => {
    if (!loc.openTime || !loc.closeTime) return true;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = loc.openTime.split(":").map(Number);
    const [closeH, closeM] = loc.closeTime.split(":").map(Number);
    const openInMinutes = openH * 60 + openM;
    const closeInMinutes = closeH * 60 + closeM;
    if (closeInMinutes < openInMinutes) {
      return currentTime >= openInMinutes || currentTime < closeInMinutes;
    }
    return currentTime >= openInMinutes && currentTime < closeInMinutes;
  };

  const visibleLocations = locations;

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col text-white font-body overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-72 bg-primary-vibrant/10 blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-0 w-full h-72 bg-secondary-vibrant/8 blur-[100px] -z-10" />

      {/* Top Header */}
      <div className="relative z-20 p-6 flex items-center justify-between max-w-lg mx-auto w-full">
        <Link to="/" className="group flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all duration-300 active:scale-95">
          <ArrowLeft className="w-4 h-4 text-primary-vibrant group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400">{t("nav.home")}</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col p-8 pt-0 text-center max-w-lg mx-auto w-full relative z-10 bg-gradient-to-b from-transparent via-primary-vibrant/[0.02] to-transparent">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="mt-12 mb-8 mx-auto relative">
          <div className="absolute inset-0 bg-primary-vibrant/20 rounded-full blur-3xl" />
          {config.logo ? (
            <img src={config.logo} alt={config.name} referrerPolicy="no-referrer"
              className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full border-2 border-white/10 shadow-2xl z-10" />
          ) : (
            <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full border-2 border-white/10 shadow-2xl z-10 bg-[#141414] flex items-center justify-center">
              <UtensilsCrossed className="w-14 h-14 text-primary-vibrant" />
            </div>
          )}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-4 mb-12">
          <div className="flex flex-col items-center">
            <span className="text-secondary-vibrant font-display text-sm tracking-[0.4em] uppercase mb-1 italic">
              {t("welcome.greeting")}
            </span>
            <h1 className="font-display text-5xl md:text-6xl tracking-wider uppercase text-white leading-none">
              {config.name}
            </h1>
            <div className="w-12 h-1 bg-primary-vibrant rounded-full mt-3" />
          </div>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.25em]">
            {t("welcome.selectLocation")}
          </p>
        </motion.div>

        <div className="flex flex-col gap-5">
          {visibleLocations.length === 0 ? (
            <div className="py-20 px-6 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-4 bg-white/[0.02]">
              <div className="w-20 h-20 bg-white/5 rounded-[20px] flex items-center justify-center transform rotate-12">
                <UtensilsCrossed className="w-10 h-10 text-zinc-700" />
              </div>
              <p className="text-zinc-600 text-sm font-bold uppercase tracking-[0.2em] max-w-[200px]">
                {t("welcome.noLocations")}
              </p>
            </div>
          ) : (
            visibleLocations.map((loc, index) => {
              const isOpenByTime = isLocationOpen(loc);
              return (
                <motion.button key={loc.id}
                  initial={{ x: index % 2 === 0 ? -40 : 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1, type: "spring", damping: 20 }}
                  onClick={() => isLocationOpen(loc) && onSelectLocation(loc)}
                  className={`group relative overflow-hidden rounded-2xl flex flex-col transition-all duration-500 text-left ${
                    isOpenByTime
                      ? "bg-[#141414] border border-white/5 hover:border-secondary-vibrant/30 hover:shadow-xl hover:shadow-secondary-vibrant/5 hover:-translate-y-1 cursor-pointer"
                      : "bg-white/[0.02] border border-white/5 cursor-not-allowed opacity-60"
                  }`}>
                  <div className="h-40 w-full relative overflow-hidden">
                    <img src={loc.image || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80"} alt={loc.name}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-transform duration-500 ${isOpenByTime ? "group-hover:scale-105" : ""}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.2em] ${
                        isOpenByTime ? "bg-secondary-vibrant text-dark" : "bg-zinc-800/90 text-zinc-400"
                      }`}>
                        {isOpenByTime ? t("locations.open") : t("locations.closed")}
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-6 right-6">
                      <h4 className="font-display text-2xl text-white uppercase tracking-wider group-hover:text-secondary-vibrant transition-colors duration-300">
                        {loc.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3.5 h-3.5 text-secondary-vibrant" />
                        <p className="text-zinc-300 text-[11px] font-bold uppercase tracking-[0.2em]">
                          {formatTime12h(loc.openTime)} - {formatTime12h(loc.closeTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <MapPin className="w-4 h-4 text-primary-vibrant flex-shrink-0 mt-0.5" />
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-tight line-clamp-1">{loc.address}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl group-hover:bg-primary-vibrant group-hover:text-white transition-all duration-300 border border-white/5">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>

        <div className="mt-16 pb-8 text-center">
          <Link to="/admin" className="text-[11px] text-zinc-700 font-bold uppercase tracking-[0.3em] hover:text-primary-vibrant transition-colors duration-300">
            {t("welcome.admin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
