import { motion } from "motion/react";
import { X, MapPin, Clock, MessageCircle, Navigation, Utensils } from "lucide-react";
import { Location } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

interface LocationModalProps { location: Location | null; onClose: () => void; onSelect?: (loc: Location) => void; }

export function LocationModal({ location, onClose, onSelect }: LocationModalProps) {
  const { t, language } = useLanguage();
  if (!location) return null;

  const handleDirections = () => {
    const query = encodeURIComponent(`${location.address} ${location.name}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${location.whatsapp}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl bg-dark-card rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh] border border-white/10"
        role="dialog" aria-modal="true" aria-label={location.name}>

        <button onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-6 right-6 z-20 w-12 h-12 bg-dark-surface/80 backdrop-blur-md rounded-2xl flex items-center justify-center text-white hover:bg-primary-vibrant hover:rotate-90 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-vibrant"
          aria-label="Cerrar">
          <X className="w-6 h-6" />
        </button>

        <div className="h-64 relative shrink-0 bg-dark-surface">
          <img src={location.image} alt={location.name} loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/seed/restaurant/400/300"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/40 to-transparent" />
          <div className="absolute bottom-8 left-8">
            <span className="text-secondary-vibrant font-black uppercase tracking-[0.3em] text-[11px]">
              {t("locations.badge")}
            </span>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">
              {location.name}
            </h2>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-8 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6">
            <div className="p-8 bg-dark-surface rounded-2xl border border-white/10 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-white/5 group-hover:text-primary-vibrant/10 transition-colors duration-500">
                <Clock className="w-24 h-24 rotate-12" />
              </div>
              <div className="flex items-center gap-3 text-primary-vibrant relative z-10">
                <Clock className="w-5 h-5" />
                <span className="font-black uppercase tracking-[0.2em] text-[11px]">
                  {t("menu.ready") || "Horario"}
                </span>
              </div>
              <div className="relative z-10 space-y-1">
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
                  {location.schedule}
                </p>
                <p className="text-white font-black text-3xl tracking-tighter">
                  {location.openTime} - {location.closeTime}
                </p>
              </div>
            </div>

            <div className="p-8 bg-dark-surface rounded-2xl border border-white/10 flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-white/5 group-hover:text-secondary-vibrant/10 transition-colors duration-500">
                <MapPin className="w-24 h-24 -rotate-12" />
              </div>
              <div className="flex items-center gap-3 text-secondary-vibrant relative z-10">
                <MapPin className="w-5 h-5" />
                <span className="font-black uppercase tracking-[0.2em] text-[11px]">
                  {t("locations.directions") || "Dirección"}
                </span>
              </div>
              <div className="relative z-10 space-y-1">
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
                  {location.address}
                </p>
                <p className="text-white font-black text-lg tracking-tight">
                  {location.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); handleDirections(); }}
              className="flex-1 bg-dark-surface text-white py-6 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-xl hover:bg-white/10 transition-all border border-white/10">
              <Navigation className="w-5 h-5" />
              {language === "es" ? "Cómo llegar" : "Get Directions"}
            </motion.button>

            {onSelect ? (
              <motion.button whileHover={location.isOpen ? { scale: 1.05 } : {}}
                whileTap={location.isOpen ? { scale: 0.95 } : {}}
                onClick={(e) => { e.stopPropagation(); if (!location.isOpen) return; onSelect(location); onClose(); }}
                disabled={!location.isOpen}
                className={`flex-1 py-6 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-xl transition-all ${
                  location.isOpen
                    ? "bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white shadow-primary-vibrant/30"
                    : "bg-dark-surface text-zinc-600 cursor-not-allowed border border-white/5"
                }`}>
                <Utensils className="w-5 h-5" />
                {location.isOpen ? (language === "es" ? "Pedir Ahora" : "Order Now") : t("locations.closed")}
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); handleWhatsApp(); }}
                className="flex-1 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant text-white py-6 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 shadow-xl shadow-primary-vibrant/30 transition-all">
                <MessageCircle className="w-5 h-5" />
                {language === "es" ? "Pedir Ahora" : "Order Now"}
              </motion.button>
            )}
          </div>
        </div>

        <div className="h-2 vibrant-gradient opacity-30" />
      </motion.div>
    </div>
  );
}
