import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Star, Utensils, MapPin, Instagram, Facebook, Share2, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';
import { ProductModal } from '../components/ProductModal';
import { LocationModal } from '../components/LocationModal';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { Product, Location } from '../types';

export function LandingPage() {
  const { config, menuItems, isLoading, locations, setSelectedLocation: setGlobalSelectedLocation } = useRestaurant();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [locationIndex, setLocationIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  if (isLoading) return null;

  const featuredItems = config.featuredProductIds 
    ? menuItems.filter(item => config.featuredProductIds?.includes(item.id))
    : menuItems.slice(0, 3);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    
    // Use a small delay to allow the menu to close and layout to stabilize
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80; // Approximate height of the sticky navbar
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
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
    <div className="min-h-screen bg-white font-sans text-zinc-900 overflow-x-hidden pt-16 md:pt-0">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-zinc-100 px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={() => scrollToSection('top')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            {config.logo ? (
              <img src={config.logo || '/logo.png'} alt="" className="w-10 h-10 rounded-full border-2 border-primary-vibrant group-hover:rotate-12 transition-transform" />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-primary-vibrant bg-zinc-100 flex items-center justify-center">
                <Utensils className="w-5 h-5 text-primary-vibrant" />
              </div>
            )}
            <span className="font-black uppercase tracking-tighter text-lg hidden sm:block">{config.name}</span>
          </div>
          
          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            <Link 
              to="/menu" 
              className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-primary-vibrant transition-colors"
            >
              {t('nav.menu')}
            </Link>
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-primary-vibrant transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link 
              to="/pedir" 
              className="bg-primary-vibrant text-white px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary-vibrant/20 hover:scale-105 transition-transform"
            >
              {t('nav.orderNow')}
            </Link>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 bg-zinc-100 text-zinc-600 rounded-xl active:scale-90 transition-transform"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-zinc-100 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-6">
                <Link 
                  to="/menu" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between text-left"
                >
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-600">{t('nav.menu')}</span>
                  <ArrowRight className="w-4 h-4 text-primary-vibrant" />
                </Link>
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-600">{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-primary-vibrant" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section id="top" className="relative min-h-[90vh] flex items-center justify-center vibrant-gradient text-white p-6 overflow-hidden py-20">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
        
        <div className="absolute inset-0 bg-black/5" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center space-y-8"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {config.logo ? (
              <img src={config.logo} alt={config.name} className="w-40 h-40 md:w-56 md:h-56 mx-auto rounded-full border-8 border-white shadow-[0_0_50px_rgba(255,255,255,0.3)]" />
            ) : (
              <div className="w-40 h-40 md:w-56 md:h-56 mx-auto rounded-full border-8 border-white bg-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)]">
                <Utensils className="w-20 h-20 text-white" />
              </div>
            )}
          </motion.div>
          <div className="space-y-4">
            <h1 
              className="text-6xl md:text-8xl font-black tracking-tighter uppercase text-black"
              style={{ WebkitTextStroke: '3px white', paintOrder: 'stroke fill' }}
            >
              {config.name}
            </h1>
            <p 
              className="text-xl md:text-2xl font-black max-w-lg mx-auto text-white" 
              style={{ WebkitTextStroke: '1px black', textShadow: '0 4px 6px rgba(0,0,0,0.5)' }}
            >
              {t('hero.tagline')}
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Link 
              to="/pedir" 
              className="inline-flex items-center gap-3 bg-white text-primary-vibrant hover:bg-zinc-100 px-10 py-5 rounded-full font-black uppercase tracking-widest transition-all shadow-2xl group"
            >
              {t('hero.cta')} 
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Waves bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }} />
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6 max-w-5xl mx-auto text-center relative scroll-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="flex justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-12 h-2 bg-primary-vibrant rounded-full" />
            ))}
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">{t('about.title')}</h2>
          <p className="text-xl text-zinc-600 leading-relaxed font-medium italic">
            "{config.aboutUs || t('about.default')}"
          </p>
        </motion.div>
      </section>

      {/* highlights with brand colors */}
      <section id="featured" className="py-24 px-6 md:px-12 bg-zinc-900 text-white relative overflow-hidden scroll-mt-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-vibrant/20 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-vibrant/10 rounded-full blur-3xl -ml-32 -mb-32" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4">
              <span className="text-secondary-vibrant font-black uppercase tracking-[0.3em] text-sm">{t('featured.badge')}</span>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">{t('featured.title')}</h2>
            </div>
            <Link to="/menu" className="text-white hover:text-secondary-vibrant font-black uppercase tracking-widest text-sm flex items-center gap-2 group transition-colors">
              {t('featured.viewAll')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {featuredItems.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                onClick={() => setSelectedProduct(item)}
                className="bg-zinc-800 p-2 rounded-[40px] border border-zinc-700/50 hover:border-secondary-vibrant transition-colors group overflow-hidden cursor-pointer"
              >
                <div className="relative h-64 rounded-[32px] overflow-hidden">
                  <img src={item.image || 'https://picsum.photos/seed/food/400/300'} alt={language === 'es' ? item.name : t(`prod.${item.id}.name`)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                     <p className="text-xs font-bold text-zinc-300">{language === 'es' ? item.description : t(`prod.${item.id}.desc`)}</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-primary-vibrant text-white px-4 py-2 rounded-2xl font-black text-lg shadow-xl">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
                <div className="p-8 space-y-2">
                  <h3 className="font-black text-2xl uppercase tracking-tight">{item.name}</h3>
                  <div className="w-12 h-1 bg-secondary-vibrant rounded-full" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section id="locations" className="py-24 px-6 md:px-12 bg-white relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
               <span className="text-primary-vibrant font-black uppercase tracking-[0.3em] text-sm">{t('locations.badge')}</span>
               <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">{t('locations.title')}</h2>
            </div>
            
            {/* Carousel Controls */}
            <div className="flex gap-4">
              <button 
                onClick={() => setLocationIndex(prev => Math.max(0, prev - 1))}
                disabled={locationIndex === 0}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  locationIndex === 0 ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed' : 'bg-zinc-900 text-white hover:bg-primary-vibrant shadow-xl'
                }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setLocationIndex(prev => Math.min(locations.length - 1, prev + 1))}
                disabled={locationIndex >= locations.length - 1}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  locationIndex >= locations.length - 1 ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed' : 'bg-zinc-900 text-white hover:bg-primary-vibrant shadow-xl'
                }`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden p-4 -m-4">
              <motion.div 
                className="flex gap-8"
                animate={{ x: `calc(-${locationIndex * 320}px - ${locationIndex * 2}rem)` }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              >
                {locations.map((loc, i) => (
                  <motion.div 
                    key={loc.id} 
                    onClick={() => setSelectedLocation(loc)}
                    className="min-w-[300px] sm:min-w-[400px] bg-zinc-50 rounded-[48px] overflow-hidden shadow-2xl hover:shadow-primary-vibrant/10 transition-all flex flex-col border border-zinc-100 group cursor-pointer"
                  >
                    <div className="h-64 relative">
                      <img src={loc.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80'} alt={loc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      {!loc.isOpen && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-white text-black text-xs font-black uppercase px-6 py-2 rounded-full shadow-2xl">{t('locations.closedToday')}</span>
                        </div>
                      )}
                      <div className="absolute bottom-6 left-6 flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${loc.isOpen ? 'bg-green-500' : 'bg-zinc-400'}`} />
                        <span className="text-white font-black uppercase text-[10px] tracking-widest">{loc.isOpen ? t('locations.open') : t('locations.closed')}</span>
                      </div>
                    </div>
                    <div className="p-8 space-y-6 flex-1 flex flex-col">
                      <div className="space-y-2">
                        <h4 className="font-black text-2xl uppercase tracking-tight text-primary-vibrant">{loc.name}</h4>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-1" />
                          <p className="text-zinc-600 font-medium leading-relaxed">{loc.address}</p>
                        </div>
                      </div>
                      <div className="mt-auto pt-6 border-t border-zinc-200">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{loc.schedule}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews - Infinite Marquee */}
      <section id="reviews" className="py-24 bg-secondary-vibrant relative overflow-hidden scroll-mt-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/5 rounded-full blur-3xl -ml-48 -mb-48" />
        
        <div className="text-center mb-16 space-y-4 px-6 relative z-10">
          <span className="text-primary-vibrant font-black uppercase tracking-[0.3em] text-sm italic">{t('reviews.badge')}</span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black" style={{ WebkitTextStroke: '1px white' }}>{t('reviews.title')}</h2>
        </div>
        
        <div className="relative flex overflow-hidden">
          <motion.div 
            className="flex gap-8 px-4"
            animate={{ x: [0, -1000] }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear",
              repeatType: "loop"
            }}
          >
            {/* Double the reviews for seamless loop */}
            {[0, 1, 2, 3, 0, 1, 2, 3].map((idx, i) => (
              <div
                key={`${idx}-${i}`} 
                className="min-w-[320px] md:min-w-[400px] bg-white p-10 rounded-[56px] shadow-2xl space-y-6 relative group"
              >
                <div className="absolute top-8 right-10 text-secondary-vibrant/20">
                   <Utensils className="w-16 h-16 rotate-12" />
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, sIdx) => (
                    <Star key={sIdx} className="w-5 h-5 fill-primary-vibrant text-primary-vibrant" />
                  ))}
                </div>
                <p className="text-zinc-700 text-lg font-medium leading-relaxed italic z-10 relative">"{t(`rev.${idx}.body`)}"</p>
                <div className="flex items-center gap-4 pt-4 border-t border-zinc-100">
                  <div className="w-12 h-12 bg-primary-vibrant rounded-2xl flex items-center justify-center font-black text-lg text-white transform -rotate-3">
                    {t(`rev.${idx}.name`)[0]}
                  </div>
                  <span className="font-black text-sm uppercase tracking-widest">{t(`rev.${idx}.name`)}</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Socials */}
      <section id="socials" className="py-24 px-6 md:px-12 bg-zinc-950 text-white relative overflow-hidden scroll-mt-20">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center space-y-12">
          <div className="space-y-4">
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">{t('socials.title')}</h3>
            <p className="text-zinc-400 text-lg max-w-lg mx-auto">{t('socials.tagline')}</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6">
             {config.socialMedia && Object.entries(config.socialMedia).map(([platform, url]) => {
               if (!url) return null;
               const Icon = platform === 'instagram' ? Instagram : platform === 'facebook' ? Facebook : Share2;
               return (
                <motion.a 
                  key={platform} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  whileHover={{ scale: 1.05, rotate: platform === 'instagram' ? 5 : -5 }}
                  className="bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] hover:bg-primary-vibrant hover:border-primary-vibrant transition-all flex items-center gap-4 group"
                >
                  <Icon className="w-8 h-8 group-hover:scale-110 transition-transform text-secondary-vibrant group-hover:text-white" />
                  <span className="text-sm font-black uppercase tracking-[0.2em] leading-none">{platform}</span>
                </motion.a>
               );
             })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-zinc-900 text-white text-center p-6">
        <h2 className="text-3xl font-black uppercase tracking-widest mb-6">{t('cta.title')}</h2>
        <Link 
          to="/menu" 
          className="inline-flex items-center gap-2 bg-primary-vibrant text-white px-8 py-4 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-transform"
        >
          {t('cta.button')} <Utensils className="w-5 h-5" />
        </Link>
      </section>

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            showAddToCart={false}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedLocation && (
          <LocationModal 
            location={selectedLocation} 
            onClose={() => setSelectedLocation(null)} 
            onSelect={(loc) => {
              setGlobalSelectedLocation({ ...loc });
              navigate('/pedir');
            }}
          />
        )}
      </AnimatePresence>
      <PWAInstallPrompt />
    </div>
  );
}
