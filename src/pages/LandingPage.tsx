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
    <div className="min-h-screen bg-dark font-body text-zinc-900 overflow-x-hidden pt-16 md:pt-0">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-dark/90 backdrop-blur-2xl border-b border-white/5 px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div onClick={() => scrollToSection('top')} className="flex items-center gap-3 cursor-pointer group">
            {config.logo ? (
              <img src={config.logo || '/logo.png'} alt="" className="w-10 h-10 rounded-full border-2 border-primary-vibrant group-hover:rotate-12 transition-transform duration-500" />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-primary-vibrant bg-primary-vibrant/10 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-primary-vibrant" />
              </div>
            )}
            <span className="font-display text-2xl tracking-wider text-white hidden sm:block">{config.name}</span>
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
              className="lg:hidden p-2 bg-white/5 text-white rounded-xl active:scale-90 transition-transform border border-white/10">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-dark-card border-b border-white/5 shadow-2xl overflow-hidden">
              <div className="flex flex-col p-6 gap-6">
                <Link to="/menu" onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between text-left">
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-300">{t('nav.menu')}</span>
                  <ArrowRight className="w-4 h-4 text-primary-vibrant" />
                </Link>
                {navLinks.map((link) => (
                  <button key={link.id} onClick={() => scrollToSection(link.id)}
                    className="flex items-center justify-between text-left">
                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-300">{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-primary-vibrant" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section id="top" className="relative min-h-[100vh] flex items-center justify-center bg-dark text-white overflow-hidden grain-overlay">
        {/* Geometric decorations */}
        <div className="absolute top-20 left-[10%] w-32 h-32 border-2 border-primary-vibrant/30 rotate-45 animate-float" />
        <div className="absolute top-40 right-[15%] w-24 h-24 border-2 border-secondary-vibrant/20 rounded-full animate-float-delayed" />
        <div className="absolute bottom-32 left-[20%] w-48 h-48 border border-white/5 rounded-full" />
        <div className="absolute top-1/3 right-[8%] w-3 h-3 bg-primary-vibrant rounded-full animate-pulse-glow" />
        <div className="absolute bottom-1/4 left-[5%] w-2 h-2 bg-secondary-vibrant rounded-full animate-pulse" />
        {/* Red + Yellow accent stripes */}
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary-vibrant via-secondary-vibrant to-primary-vibrant" />
        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-secondary-vibrant via-primary-vibrant to-secondary-vibrant" />

        {/* Large gradient blobs - brighter */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-vibrant/20 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-vibrant/15 rounded-full blur-[100px] -ml-48 -mb-48" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[150px]" />

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center space-y-10 px-6">
          <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative inline-block">
            <div className="absolute inset-0 bg-primary-vibrant/30 rounded-full blur-3xl animate-pulse" />
            {config.logo ? (
              <img src={config.logo} alt={config.name}
                className="relative w-44 h-44 md:w-64 md:h-64 mx-auto rounded-full border-4 border-white/20 shadow-[0_0_80px_rgba(203,32,39,0.3)]" />
            ) : (
              <div className="relative w-44 h-44 md:w-64 md:h-64 mx-auto rounded-full border-4 border-white/20 bg-white/5 flex items-center justify-center shadow-[0_0_80px_rgba(203,32,39,0.3)]">
                <Utensils className="w-24 h-24 text-white/80" />
              </div>
            )}
          </motion.div>

          <div className="space-y-6">
            <h1 className="font-display text-[5rem] md:text-[9rem] lg:text-[11rem] leading-[0.85] tracking-wider uppercase text-white"
              style={{ textShadow: '0 0 60px rgba(203,32,39,0.5), 0 0 120px rgba(255,196,0,0.15), 0 4px 20px rgba(0,0,0,0.8)' }}>
              {config.name}
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-1 bg-primary-vibrant rounded-full" />
              <p className="text-lg md:text-2xl font-display tracking-[0.3em] uppercase text-secondary-vibrant">
                {t('hero.tagline')}
              </p>
              <div className="w-16 h-1 bg-primary-vibrant rounded-full" />
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/pedir" className="inline-flex items-center gap-4 bg-primary-vibrant text-white px-12 py-6 rounded-full font-display text-xl tracking-wider transition-all duration-300 group hover:shadow-[0_0_60px_rgba(203,32,39,0.5)] border-2 border-secondary-vibrant/30">
              {t('hero.cta')}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-white" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
      </section>

      {/* About */}
      <section id="about" className="py-32 px-6 max-w-6xl mx-auto relative scroll-mt-20">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="grid md:grid-cols-[1fr_2fr] gap-16 items-center">
          <div className="space-y-6">
            <div className="flex gap-2">
              <div className="w-16 h-1.5 bg-primary-vibrant rounded-full" />
              <div className="w-8 h-1.5 bg-secondary-vibrant rounded-full" />
              <div className="w-4 h-1.5 bg-primary-vibrant rounded-full" />
            </div>
            <h2 className="font-display text-6xl md:text-8xl uppercase tracking-wider leading-none text-white">{t('about.title')}</h2>
          </div>
          <div className="space-y-6">
            <p className="text-2xl md:text-3xl text-white leading-relaxed font-light italic border-l-4 border-secondary-vibrant pl-8">
              "{config.aboutUs || t('about.default')}"
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-vibrant rounded-full flex items-center justify-center">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-primary-vibrant via-secondary-vibrant to-primary-vibrant" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Featured */}
      <section id="featured" className="py-32 px-6 md:px-12 bg-dark text-white relative overflow-hidden scroll-mt-20 grain-overlay">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-vibrant/10 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-vibrant/8 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="space-y-4">
              <span className="text-secondary-vibrant font-display text-xl tracking-[0.4em] uppercase">{t('featured.badge')}</span>
              <h2 className="font-display text-5xl md:text-7xl lg:text-8xl uppercase tracking-wider leading-none">{t('featured.title')}</h2>
            </div>
            <Link to="/menu" className="text-zinc-400 hover:text-white font-display text-lg tracking-[0.2em] uppercase flex items-center gap-3 group transition-colors duration-300">
              {t('featured.viewAll')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredItems.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.6 }} viewport={{ once: true }}
                onClick={() => setSelectedProduct(item)}
                className="group cursor-pointer">
                <div className="relative rounded-[32px] overflow-hidden bg-dark-card border border-white/5 hover:border-secondary-vibrant/40 transition-all duration-500 card-hover-lift">
                  <div className="relative h-72 overflow-hidden">
                    <img src={item.image || 'https://picsum.photos/seed/food/400/300'}
                      alt={language === 'es' ? item.name : t(`prod.${item.id}.name`)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                    <div className="absolute top-5 right-5 bg-secondary-vibrant text-dark px-5 py-2.5 rounded-2xl font-display text-xl tracking-wider shadow-xl shadow-secondary-vibrant/30">
                      ${item.price.toFixed(2)}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-sm font-medium text-zinc-300 line-clamp-2">{language === 'es' ? item.description : t(`prod.${item.id}.desc`)}</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <h3 className="font-display text-2xl uppercase tracking-wider">{item.name}</h3>
                    <div className="w-8 h-1 bg-secondary-vibrant rounded-full group-hover:w-16 transition-all duration-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section id="locations" className="py-32 px-6 md:px-12 bg-white relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <span className="text-primary-vibrant font-display text-xl tracking-[0.4em] uppercase">{t('locations.badge')}</span>
              <h2 className="font-display text-5xl md:text-7xl lg:text-8xl uppercase tracking-wider leading-none">{t('locations.title')}</h2>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => setLocationIndex(prev => Math.max(0, prev - 1))} disabled={locationIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-dark text-white hover:bg-primary-vibrant shadow-2xl flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => setLocationIndex(prev => Math.min(locations.length - 1, prev + 1))} disabled={locationIndex >= locations.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-dark text-white hover:bg-primary-vibrant shadow-2xl flex items-center justify-center transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed">
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="overflow-hidden p-4 -m-4">
              <motion.div className="flex gap-8" animate={{ x: `calc(-${locationIndex * 340}px - ${locationIndex * 2}rem)` }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}>
                {locations.map((loc, i) => (
                  <motion.div key={loc.id} onClick={() => setSelectedLocation(loc)}
                    className="min-w-[300px] sm:min-w-[400px] bg-white rounded-[32px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col border border-zinc-100 group cursor-pointer card-hover-lift">
                    <div className="h-56 relative overflow-hidden">
                      <img src={loc.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80'} alt={loc.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-5 left-5 flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${loc.isOpen ? 'bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.6)]' : 'bg-zinc-500'} animate-pulse`} />
                        <span className="text-white font-display text-sm tracking-[0.3em] uppercase">{loc.isOpen ? t('locations.open') : t('locations.closed')}</span>
                      </div>
                    </div>
                    <div className="p-7 space-y-5 flex-1 flex flex-col">
                      <div className="space-y-3">
                        <h4 className="font-display text-3xl uppercase tracking-wider text-white group-hover:text-secondary-vibrant transition-colors duration-300">{loc.name}</h4>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-1" />
                          <p className="text-zinc-500 font-medium text-sm leading-relaxed">{loc.address}</p>
                        </div>
                      </div>
                      <div className="mt-auto pt-5 border-t border-zinc-100">
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.25em]">{loc.schedule}</p>
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
      <section id="reviews" className="py-32 bg-dark relative overflow-hidden scroll-mt-20 grain-overlay">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-vibrant/5 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-vibrant/5 rounded-full blur-[120px] -ml-48 -mb-48" />

        <div className="text-center mb-20 space-y-4 px-6 relative z-10">
          <span className="text-secondary-vibrant font-display text-xl tracking-[0.4em] uppercase italic">{t('reviews.badge')}</span>
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl uppercase tracking-wider text-white leading-none">{t('reviews.title')}</h2>
        </div>

        <div className="relative flex overflow-hidden" onMouseEnter={() => setIsMarqueePaused(true)} onMouseLeave={() => setIsMarqueePaused(false)}>
          <motion.div className="flex gap-6 px-4" animate={marqueeControls}>
            {[...Array(2)].map((_, setIdx) => (
              Array.from({ length: 8 }, (_, idx) => {
                const globalIdx = setIdx * 8 + idx;
                return (
                  <div key={`${setIdx}-${idx}`}
                    className="min-w-[320px] md:min-w-[380px] bg-dark-card p-8 rounded-[32px] space-y-5 relative border border-white/5 group hover:border-primary-vibrant/20 transition-colors duration-500">
                    <div className="absolute top-6 right-6 w-16 h-16 rounded-full bg-secondary-vibrant/10" />
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, sIdx) => (
                        <Star key={sIdx} className="w-4 h-4 fill-secondary-vibrant text-secondary-vibrant" />
                      ))}
                    </div>
                    <p className="text-zinc-300 text-base font-medium leading-relaxed italic z-10 relative">"{t(`rev.${idx}.body`)}"</p>
                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                      <div className="w-12 h-12 bg-secondary-vibrant rounded-2xl flex items-center justify-center font-display text-xl text-dark transform -rotate-6">
                        {t(`rev.${idx}.name`)[0]}
                      </div>
                      <span className="font-display text-sm uppercase tracking-[0.2em] text-zinc-400">{t(`rev.${idx}.name`)}</span>
                    </div>
                  </div>
                );
              })
            ))}
          </motion.div>
        </div>
      </section>

      {/* Socials */}
      <section id="socials" className="py-32 px-6 md:px-12 relative overflow-hidden scroll-mt-20 bg-white">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-14">
          <div className="space-y-4">
            <h3 className="font-display text-4xl md:text-6xl uppercase tracking-wider italic">{t('socials.title')}</h3>
            <p className="text-zinc-500 text-lg max-w-lg mx-auto">{t('socials.tagline')}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {config.socialMedia && Object.entries(config.socialMedia).map(([platform, url]) => {
              if (!url) return null;
              const Icon = platform === 'instagram' ? Instagram : platform === 'facebook' ? Facebook : Share2;
              return (
                <motion.a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                  whileHover={{ scale: 1.05, rotate: platform === 'instagram' ? 3 : -3 }}
                  className="bg-dark text-white border border-white/5 p-6 rounded-[24px] hover:bg-primary-vibrant hover:border-secondary-vibrant transition-all duration-300 flex items-center gap-4 group">
                  <Icon className="w-7 h-7 text-secondary-vibrant group-hover:text-white transition-colors duration-300" />
                  <span className="font-display text-sm uppercase tracking-[0.25em]">{platform}</span>
                </motion.a>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-dark text-white text-center p-6 relative overflow-hidden grain-overlay">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-vibrant/10 via-transparent to-secondary-vibrant/10" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-vibrant via-secondary-vibrant to-primary-vibrant" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-secondary-vibrant via-primary-vibrant to-secondary-vibrant" />
        <div className="relative z-10 space-y-8">
          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-wider">{t('cta.title')}</h2>
          <Link to="/menu" className="inline-flex items-center gap-3 bg-primary-vibrant text-white px-10 py-5 rounded-full font-display text-lg tracking-wider hover:shadow-[0_0_60px_rgba(203,32,39,0.5)] hover:scale-105 transition-all duration-300 border-2 border-secondary-vibrant/30">
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
