import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Clock, ArrowRight, UtensilsCrossed, ArrowLeft, AlertCircle } from "lucide-react";
import { Location } from "../../types";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { OptimizedImage } from "./OptimizedImage";
import { BrandName } from "./BrandName";

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
  const [closedToast, setClosedToast] = useState<string | null>(null);

  const handleLocationClick = useCallback((loc: Location) => {
    if (isLocationOpen(loc)) {
      onSelectLocation(loc);
    } else {
      setClosedToast(loc.name);
      setTimeout(() => setClosedToast(null), 3000);
    }
  }, [onSelectLocation]);

  const isLocationOpen = (loc: Location) => {
    if (!loc.isActive) return false;
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
    <div className="min-h-screen bg-dark flex flex-col text-white font-body overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-72 bg-primary-vibrant/15 blur-[40px] -z-10" />
      <div className="absolute bottom-0 right-0 w-full h-72 bg-secondary-vibrant/10 blur-[40px] -z-10" />

      {/* Top Header */}
      <div className="relative z-20 p-6 flex items-center justify-between max-w-lg mx-auto w-full">
        <Link to="/" className="group flex items-center gap-2 bg-primary-vibrant/10 px-4 py-2 rounded-full border border-primary-vibrant/20 hover:bg-primary-vibrant/20 hover:border-primary-vibrant/40 transition-all duration-300 active:scale-95">
          <ArrowLeft className="w-4 h-4 text-primary-vibrant group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary-vibrant group-hover:text-white transition-colors">{t("nav.home")}</span>
        </Link>
      </div>

      <div className="flex-1 flex flex-col p-8 pt-0 text-center max-w-lg mx-auto w-full relative z-10 bg-gradient-to-b from-transparent via-primary-vibrant/[0.03] to-transparent">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="mt-12 mb-8 mx-auto relative">
          <div className="absolute inset-0 bg-primary-vibrant/25 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-secondary-vibrant/15 rounded-full blur-3xl scale-110" />
          {config.logo ? (
            <img src={config.logo} alt={config.name} referrerPolicy="no-referrer"
              className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full border-2 border-secondary-vibrant/40 shadow-2xl shadow-secondary-vibrant/20 z-10" />
          ) : (
            <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full border-2 border-secondary-vibrant/40 shadow-2xl shadow-secondary-vibrant/20 z-10 bg-dark-card flex items-center justify-center">
              <UtensilsCrossed className="w-14 h-14 text-secondary-vibrant" />
            </div>
          )}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-4 mb-12">
          <div className="flex flex-col items-center">
            <span className="text-secondary-vibrant font-display text-sm tracking-[0.4em] uppercase mb-1 bg-secondary-vibrant/10 px-4 py-1.5 rounded-full border border-secondary-vibrant/20">
              {t("welcome.greeting")}
            </span>
            <h1 className="text-5xl md:text-6xl tracking-wider uppercase text-white leading-none mt-2">
              <BrandName className="text-5xl md:text-6xl uppercase" theme="dark" />
            </h1>
            <div className="flex gap-2 mt-3">
              <div className="w-12 h-2 bg-primary-vibrant rounded-full" />
              <div className="w-6 h-2 bg-secondary-vibrant rounded-full" />
            </div>
          </div>
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.25em]">
            {t("welcome.selectLocation")}
          </p>
        </motion.div>

        <div className="flex flex-col gap-5">
          {visibleLocations.length === 0 ? (
            <div className="py-20 px-6 border-2 border-dashed border-secondary-vibrant/20 rounded-2xl flex flex-col items-center gap-4 bg-secondary-vibrant/[0.03]">
              <div className="w-20 h-20 bg-secondary-vibrant/10 rounded-[20px] flex items-center justify-center transform rotate-12">
                <UtensilsCrossed className="w-10 h-10 text-secondary-vibrant" />
              </div>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.2em] max-w-[200px]">
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
                  onClick={() => handleLocationClick(loc)}
                  className={`group relative overflow-hidden rounded-2xl flex flex-col transition-all duration-500 text-left ${
                    isOpenByTime
                      ? "bg-dark-card border-2 border-secondary-vibrant/20 hover:border-secondary-vibrant/50 hover:shadow-xl hover:shadow-secondary-vibrant/10 hover:-translate-y-1 cursor-pointer"
                      : "bg-white/[0.02] border-2 border-white/5 cursor-not-allowed opacity-60"
                  }`}>
                  <div className="h-40 w-full relative overflow-hidden">
                    <OptimizedImage
                      src={loc.image}
                      alt={loc.name}
                      className={`w-full h-full ${isOpenByTime ? "" : ""}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/60 to-transparent" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-[0.2em] ${
                        isOpenByTime ? "bg-secondary-vibrant text-dark shadow-lg" : "bg-dark-surface text-zinc-400"
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
                  <div className="p-5 flex items-center justify-between border-t-2 border-primary-vibrant/20">
                    <div className="flex items-start gap-2 flex-1">
                      <MapPin className="w-4 h-4 text-primary-vibrant flex-shrink-0 mt-0.5" />
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-tight line-clamp-1">{loc.address}</p>
                    </div>
                    <div className="bg-primary-vibrant/10 p-3.5 rounded-xl group-hover:bg-gradient-to-r group-hover:from-primary-vibrant group-hover:to-secondary-vibrant group-hover:text-white transition-all duration-300 border border-primary-vibrant/20">
                      <ArrowRight className="w-5 h-5 text-primary-vibrant group-hover:text-white" />
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>


      </div>

      {/* Closed Location Toast */}
      <AnimatePresence>
        {closedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-6 right-6 z-[200] max-w-md mx-auto"
          >
            <div className="bg-dark-card border border-primary-vibrant/20 rounded-2xl p-4 flex items-center gap-3 shadow-2xl shadow-primary-vibrant/10">
              <div className="w-10 h-10 bg-primary-vibrant/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-primary-vibrant" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-bold">{closedToast}</p>
                <p className="text-zinc-400 text-xs">
                  {language === "es" ? "Cerrado en este momento" : "Currently closed"}
                </p>
              </div>
              <div className="px-3 py-1.5 bg-primary-vibrant/10 border border-primary-vibrant/20 rounded-lg">
                <span className="text-primary-vibrant text-[10px] font-bold uppercase tracking-wider">
                  {language === "es" ? "Cerrado" : "Closed"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
