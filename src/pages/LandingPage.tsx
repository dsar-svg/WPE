import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { ArrowRight, Star, Utensils, ClipboardList, MapPin, Instagram, Facebook, Share2, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/ui/LanguageToggle';
import { ProductModal } from '../components/ui/ProductModal';
import { LocationModal } from '../components/ui/LocationModal';
import { PWAInstallPrompt } from '../components/ui/PWAInstallPrompt';
import { Product, Location } from '../types';

export function LandingPage() {
  const { config, menuItems, isLoading, locations, setSelectedLocation: setGlobalSelectedLocation } = useRestaurant();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [locationIndex, setLocationIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const marqueeControls = useAnimation();

  useEffect(() => {
    if (isMarqueePaused) { marqueeControls.stop(); }
    else { marqueeControls.start({ x: [0, -1000], transition: { duration: 20, repeat: Infinity, ease: "linear", repeatType: "loop" } }); }
  }, [isMarqueePaused, marqueeControls]);

  if (isLoading) return null;

  const featuredItems = config.featuredProductIds ? menuItems.filter(item => config.featuredProductIds?.includes(item.id)) : menuItems.slice(0, 3);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, 100);
  };

  const navLinks = [
    { label: t('nav.about'), id: 'about' },
    { label: t('nav.featured'), id: 'featured' },
    { label: t('nav.locations'), id: 'locations' },
    { label: t('nav.reviews'), id: 'reviews' },
    { label: t('nav.socials'), id: 'socials' },
  ];

  return (
    <div className="min-h-screen bg-white font-body text-zinc-900 overflow-x-hidden pt-16 md:pt-0">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-2xl border-b border-zinc-100 px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div onClick={() => scrollToSection('top')} className="flex items-center gap-3 cursor-pointer group">
            {config.logo ? (
              <img src={config.logo || '/logo.png'} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full border-2 border-primary-vibrant group-hover:rotate-12 transition-transform duration-500" />
            ) : (
              <div className="w-9 h-9 rounded-full border-2 border-primary-vibrant bg-primary-vibrant/10 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-primary-vibrant" />
              </div>
            )}
            <span className="font-display text-2xl tracking-wider text-dark hidden sm:block">{config.name}</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <Link to="/menu" className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400 hover:text-primary-vibrant transition-colors duration-300">
              {t('nav.menu')}
            </Link>
            {navLinks.map((link) => (
              <button key={link.id} onClick={() => scrollToSection(link.id)}
                className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-400 hover:text-primary-vibrant transition-colors duration-300">
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link to="/pedir" className="bg-primary-vibrant text-white px-6 py-2.5 rounded-full font-display text-sm tracking-wider shadow-lg shadow-primary-vibrant/30 hover:shadow-primary-vibrant/50 hover:scale-105 transition-all duration-300">
              {t('nav.orderNow')}
            </Link>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 bg-zinc-100 text-zinc-600 rounded-xl active:scale-90 transition-transform border border-zinc-200">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-zinc-100 shadow-2xl overflow-hidden">
              <div className="flex flex-col p-6 gap-6">
                <Link to="/menu" onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between text-left">
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-600">{t('nav.menu')}</span>
                  <ArrowRight className="w-4 h-4 text-primary-vibrant" />
                </Link>
                {navLinks.map((link) => (
                  <button key={link.id} onClick={() => scrollToSection(link.id)}
                    className="flex items-center justify-between text-left">
                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-600">{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-primary-vibrant" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section id="top" className="relative min-h-[90vh] flex items-center justify-center bg-dark text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-primary-vibrant/20" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-vibrant/15 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-vibrant/10 rounded-full blur-[100px] -ml-48 -mb-48" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center space-y-10 px-6 max-w-4xl mx-auto">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative inline-block">
            {config.logo ? (
              <img src={config.logo} alt={config.name} referrerPolicy="no-referrer"
                className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full border-2 border-white/10 shadow-2xl" />
            ) : (
              <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full border-2 border-white/10 bg-white/5 flex items-center justify-center">
                <Utensils className="w-16 h-16 text-white/60" />
              </div>
            )}
          </motion.div>

          <div className="space-y-6">
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-wider uppercase text-white">
              {config.name}
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-0.5 bg-primary-vibrant rounded-full" />
              <p className="text-base md:text-lg font-medium text-zinc-400 tracking-[0.15em] uppercase">
                {t('hero.tagline')}
              </p>
              <div className="w-12 h-0.5 bg-primary-vibrant rounded-full" />
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link to="/pedir" className="inline-flex items-center gap-3 bg-primary-vibrant text-white px-10 py-4 rounded-full font-display text-lg tracking-wider transition-all duration-300 group hover:shadow-[0_0_40px_rgba(203,32,39,0.4)]">
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* About */}
      <section id="about" className="py-28 px-6 max-w-6xl mx-auto relative scroll-mt-20">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="grid md:grid-cols-[1fr_2fr] gap-12 items-center">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="w-12 h-1 bg-primary-vibrant rounded-full" />
              <div className="w-6 h-1 bg-secondary-vibrant rounded-full" />
            </div>
            <h2 className="font-display text-5xl md:text-7xl uppercase tracking-wider leading-none text-dark">{t('about.title')}</h2>
          </div>
          <div className="space-y-6">
            <p className="text-xl md:text-2xl text-zinc-700 leading-relaxed font-light border-l-2 border-primary-vibrant pl-6">
              "{config.aboutUs || t('about.default')}"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-vibrant/10 rounded-full flex items-center justify-center">
                <Utensils className="w-5 h-5 text-primary-vibrant" />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-primary-vibrant via-secondary-vibrant to-primary-vibrant" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Featured */}
      <section id="featured" className="py-28 px-6 md:px-12 bg-zinc-50 relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-3">
              <span className="text-secondary-vibrant font-display text-lg tracking-[0.35em] uppercase">{t('featured.badge')}</span>
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase tracking-wider leading-none text-dark">{t('featured.title')}</h2>
            </div>
            <Link to="/menu" className="text-zinc-400 hover:text-primary-vibrant font-medium text-sm tracking-[0.2em] uppercase flex items-center gap-2 group transition-colors duration-300">
              {t('featured.viewAll')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }} viewport={{ once: true }}
                onClick={() => setSelectedProduct(item)}
                className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-zinc-100 hover:border-primary-vibrant/20 hover:shadow-xl transition-all duration-300">
                <div className="relative h-64 overflow-hidden">
                  <img src={item.image || 'https://picsum.photos/seed/food/400/300'}
                    alt={language === 'es' ? item.name : t(`prod.${item.id}.name`)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-display text-xl uppercase tracking-wider text-dark">{item.name}</h3>
                    <span className="font-display text-lg text-secondary-vibrant tracking-wider bg-secondary-vibrant/10 px-3 py-1 rounded-lg">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">{language === 'es' ? item.description : t(`prod.${item.id}.desc`)}</p>
                  <div className="w-6 h-0.5 bg-primary-vibrant rounded-full group-hover:w-12 transition-all duration-300" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section id="locations" className="py-28 px-6 md:px-12 relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <span className="text-primary-vibrant font-display text-lg tracking-[0.35em] uppercase">{t('locations.badge')}</span>
              <h2 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase tracking-wider leading-none text-dark">{t('locations.title')}</h2>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => setLocationIndex(prev => Math.max(0, prev - 1))} disabled={locationIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white text-zinc-700 hover:bg-primary-vibrant hover:text-white shadow-lg border border-zinc-200 flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setLocationIndex(prev => Math.min(locations.length - 1, prev + 1))} disabled={locationIndex >= locations.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white text-zinc-700 hover:bg-primary-vibrant hover:text-white shadow-lg border border-zinc-200 flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="overflow-hidden p-2 -m-2">
              <motion.div className="flex gap-6" animate={{ x: `calc(-${locationIndex * 340}px - ${locationIndex * 1.5}rem)` }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}>
                {locations.map((loc, i) => (
                  <motion.div key={loc.id} onClick={() => setSelectedLocation(loc)}
                    className="min-w-[300px] sm:min-w-[380px] bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col border border-zinc-100 group cursor-pointer">
                    <div className="h-48 relative overflow-hidden bg-zinc-100">
                      <img src={loc.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80'} alt={loc.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${loc.isOpen ? 'bg-green-400' : 'bg-zinc-400'}`} />
                        <span className="text-white text-xs font-bold uppercase tracking-[0.2em]">{loc.isOpen ? t('locations.open') : t('locations.closed')}</span>
                      </div>
                    </div>
                    <div className="p-6 space-y-4 flex-1 flex flex-col">
                      <div className="space-y-2">
                        <h4 className="font-display text-2xl uppercase tracking-wider text-dark">{loc.name}</h4>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                          <p className="text-zinc-500 text-sm">{loc.address}</p>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-zinc-100">
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{loc.schedule}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-28 bg-zinc-50 relative overflow-hidden scroll-mt-20">
        <div className="text-center mb-16 space-y-3 px-6">
          <span className="text-secondary-vibrant font-display text-lg tracking-[0.35em] uppercase italic">{t('reviews.badge')}</span>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl uppercase tracking-wider text-dark leading-none">{t('reviews.title')}</h2>
        </div>

        <div className="relative flex overflow-hidden" onMouseEnter={() => setIsMarqueePaused(true)} onMouseLeave={() => setIsMarqueePaused(false)}>
          <motion.div className="flex gap-5 px-4" animate={marqueeControls}>
            {[...Array(2)].map((_, setIdx) => (
              Array.from({ length: 8 }, (_, idx) => {
                const globalIdx = setIdx * 8 + idx;
                return (
                  <div key={`${setIdx}-${idx}`}
                    className="min-w-[300px] md:min-w-[360px] bg-white p-6 rounded-2xl space-y-4 border border-zinc-100 shadow-sm">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, sIdx) => (
                        <Star key={sIdx} className="w-4 h-4 fill-secondary-vibrant text-secondary-vibrant" />
                      ))}
                    </div>
                    <p className="text-zinc-600 text-sm leading-relaxed italic">"{t(`rev.${idx}.body`)}"</p>
                    <div className="flex items-center gap-3 pt-3 border-t border-zinc-100">
                      <div className="w-10 h-10 bg-secondary-vibrant/20 rounded-xl flex items-center justify-center font-display text-base text-secondary-vibrant">
                        {t(`rev.${idx}.name`)[0]}
                      </div>
                      <span className="font-medium text-sm text-zinc-700 uppercase tracking-[0.15em]">{t(`rev.${idx}.name`)}</span>
                    </div>
                  </div>
                );
              })
            ))}
          </motion.div>
        </div>
      </section>

      {/* Socials */}
      <section id="socials" className="py-28 px-6 md:px-12 relative overflow-hidden scroll-mt-20">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-10">
          <div className="space-y-3">
            <h3 className="font-display text-4xl md:text-5xl uppercase tracking-wider text-dark">{t('socials.title')}</h3>
            <p className="text-zinc-500 text-base max-w-md mx-auto">{t('socials.tagline')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {config.socialMedia && Object.entries(config.socialMedia).map(([platform, url]) => {
              if (!url) return null;
              const Icon = platform === 'instagram' ? Instagram : platform === 'facebook' ? Facebook : Share2;
              return (
                <motion.a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  className="bg-white text-zinc-700 border border-zinc-200 p-5 rounded-2xl hover:border-primary-vibrant/30 hover:shadow-lg transition-all duration-300 flex items-center gap-3 group">
                  <Icon className="w-5 h-5 text-primary-vibrant" />
                  <span className="font-medium text-sm uppercase tracking-[0.2em]">{platform}</span>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-dark text-white text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-vibrant/5 via-transparent to-secondary-vibrant/5" />
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-vibrant via-secondary-vibrant to-primary-vibrant" />
        <div className="relative z-10 space-y-6">
          <h2 className="font-display text-4xl md:text-5xl uppercase tracking-wider">{t('cta.title')}</h2>
          <Link to="/menu" className="inline-flex items-center gap-3 bg-primary-vibrant text-white px-8 py-4 rounded-full font-display text-base tracking-wider hover:shadow-[0_0_40px_rgba(203,32,39,0.4)] hover:scale-105 transition-all duration-300">
            {t('cta.button')}
            <ClipboardList className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} showAddToCart={false} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedLocation && (
          <LocationModal location={selectedLocation} onClose={() => setSelectedLocation(null)} onSelect={(loc) => {
            setGlobalSelectedLocation({ ...loc });
            navigate('/pedir');
          }} />
        )}
      </AnimatePresence>
      <PWAInstallPrompt />
    </div>
  );
}
