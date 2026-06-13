import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, MapPin, Phone, Trash2, Plus, Minus, X, Search, ArrowRight, Navigation, AlertCircle } from 'lucide-react';
import { Product, CartItem, DeliveryType, CheckoutData, Location, AddressSuggestion } from '../../types';
import React, { useState, useEffect, useCallback } from 'react';
import { MapComponent } from './MapComponent';
import { useLanguage } from '../../context/LanguageContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { useDistanceCalculation } from '../../hooks/useDistanceCalculation';
import { DistanceService } from '../../lib/DistanceService';
import { OptimizedImage } from './OptimizedImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  location: Location;
  updateQuantity: (id: string, qty: number) => void;
  updateNotes: (id: string, notes: string) => void;
  removeItem: (id: string) => void;
  onCheckout: (data: CheckoutData) => void;
}

export function CartDrawer({
  isOpen, onClose, items, total, location, updateQuantity, updateNotes, onCheckout,
}: CartDrawerProps) {
  const { config } = useRestaurant();
  const { t, language } = useLanguage();
  const { searchAddress, calculateDistanceAndFee, clearSuggestions, suggestions, isLoading: isLoadingAddress, error: searchError } = useDistanceCalculation();

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('Delivery');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', reference: '', notes: '' });
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatedFee, setCalculatedFee] = useState<number>(0);
  const [isWithinRange, setIsWithinRange] = useState<boolean>(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({ name: '', phone: '', address: '' });
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (formData.address.length > 3) {
        await searchAddress(formData.address);
        setShowSuggestions(true);
        setAddressError(null);
      } else {
        clearSuggestions();
        setShowSuggestions(false);
        setAddressError(null);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [formData.address, searchAddress, clearSuggestions]);

  useEffect(() => {
    const autoGeocode = async () => {
      if (formData.address.length > 10 && !showSuggestions && deliveryType === 'Delivery') {
        try {
          const results = await DistanceService.geocodeAddress(formData.address);
          if (results.length > 0) {
            const firstResult = results[0];
            setDeliveryCoordinates({ lat: parseFloat(firstResult.lat), lng: parseFloat(firstResult.lon) });
            validateField('address', formData.address);
            setLocationSelected(true);
            setTimeout(() => setLocationSelected(false), 1000);
          }
        } catch (error) { console.log('Error en geocodificación automática:', error); }
      }
    };
    const timeoutId = setTimeout(autoGeocode, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.address, showSuggestions, deliveryType]);

  const validateField = useCallback((field: string, value: string) => {
    let error = '';
    switch (field) {
      case 'name': { error = value.length < 2 ? t('cart.error.nameMin') : ''; break; }
      case 'phone': { const phoneRegex = /^[0-9+\-\s()]{10,}$/; error = !phoneRegex.test(value) ? t('cart.error.phoneInvalid') : ''; break; }
      case 'address': { error = value.length < 5 ? t('cart.error.addressMin') : ''; break; }
    }
    setFormErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }, [t]);

  useEffect(() => {
    if (deliveryType === 'Delivery' && deliveryCoordinates && location.latitude && location.longitude) {
      const result = calculateDistanceAndFee(location.latitude, location.longitude, deliveryCoordinates.lat, deliveryCoordinates.lng, config.distancePricing?.ranges || [], config.distancePricing?.maxDeliveryDistance || 20);
      setCalculatedDistance(result.distance);
      setCalculatedFee(result.deliveryFee);
      setIsWithinRange(result.isWithinRange);
      setAddressError(result.isWithinRange ? null : t('cart.error.addressOutOfRange'));
    } else if (deliveryType === 'Delivery') {
      setCalculatedFee(config.deliveryFee ?? 0);
      setCalculatedDistance(null);
      setIsWithinRange(true);
    } else {
      setCalculatedFee(0);
      setCalculatedDistance(null);
      setIsWithinRange(true);
    }
  }, [deliveryType, deliveryCoordinates, location, config, calculateDistanceAndFee]);

  const subtotalWithTax = total * (1 + (config.taxRate ?? 0));
  const finalTotal = subtotalWithTax + calculatedFee;
  const totalVES = finalTotal * (config.exchangeRate ?? 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isNameValid = validateField('name', formData.name);
    const isPhoneValid = validateField('phone', formData.phone);
    const isAddressValid = deliveryType === 'Pick-up' || validateField('address', formData.address);
    if (!isNameValid || !isPhoneValid || !isAddressValid) return;
    if (deliveryType === 'Delivery' && !isWithinRange) { setAddressError(t('cart.error.addressOutOfRange')); return; }
    onCheckout({ ...formData, deliveryType, deliveryCoordinates: deliveryType === 'Delivery' ? deliveryCoordinates : undefined, calculatedDistance: deliveryType === 'Delivery' ? calculatedDistance : undefined, calculatedDeliveryFee: deliveryType === 'Delivery' ? calculatedFee : undefined });
  };

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setFormData({ ...formData, address: suggestion.display_name });
    validateField('address', suggestion.display_name);
    setDeliveryCoordinates({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
    setShowSuggestions(false);
    clearSuggestions();
    setLocationSelected(true);
    setTimeout(() => { setShowMapPreview(true); setTimeout(() => setLocationSelected(false), 1000); }, 500);
  };

  const handleMapLocationSelect = async (lat: number, lng: number) => {
    setDeliveryCoordinates({ lat, lng });
    setLocationSelected(true);
    setShowSuggestions(false);
    clearSuggestions();
    const coordsStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    setFormData({ ...formData, address: coordsStr });
    validateField('address', coordsStr);
    try {
      const results = await DistanceService.geocodeAddress(`${lat},${lng}`);
      if (results.length > 0) {
        const address = results[0].display_name;
        setDeliveryCoordinates({ lat, lng });
        setFormData(prev => ({ ...prev, address }));
        validateField('address', address);
      }
    } catch (error) { console.log('Error en geocodificación inversa:', error); }
    setTimeout(() => { setShowMapPreview(true); setTimeout(() => setLocationSelected(false), 1000); }, 500);
  };

  const handleGetUserLocation = async () => {
    setIsLocating(true);
    setAddressError(null);
    try {
      const userLocation = await DistanceService.getUserLocation();
      setDeliveryCoordinates(userLocation);
      setLocationSelected(true);
      const coordsStr = `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`;
      setFormData({ ...formData, address: coordsStr });
      validateField('address', coordsStr);
      setTimeout(() => setLocationSelected(false), 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('cart.error.unknown');
      setAddressError(message);
    } finally { setIsLocating(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/70 z-50 backdrop-blur-md" id="cart-overlay" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-dark-card rounded-t-[2rem] z-50 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
            id="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b-2 border-primary-vibrant/20 bg-dark-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 rounded-full blur-xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary-vibrant/15 rounded-full blur-lg -ml-12 -mb-12" />
              <div className="flex items-center justify-between relative z-10">
                <h2 className="font-display text-xl sm:text-2xl tracking-wider flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {step === 'cart' ? t('cart.title') : t('cart.checkout')}
                </h2>
                <button onClick={onClose} className="p-2 bg-white/10 hover:bg-primary-vibrant rounded-xl transition-all duration-300 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-vibrant" aria-label="Cerrar carrito">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 bg-dark-card scroll-smooth pb-32 sm:pb-40">
              {step === 'cart' ? (
                <>
                  {items.length === 0 ? (
                    <div className="py-24 text-center space-y-6">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }}
                        className="w-24 h-24 bg-primary-vibrant/10 rounded-2xl flex items-center justify-center mx-auto border border-primary-vibrant/20">
                        <ShoppingCart className="w-12 h-12 text-primary-vibrant" />
                      </motion.div>
                      <div className="space-y-2">
                        <p className="text-zinc-400 font-display uppercase text-sm tracking-[0.25em] leading-none">{t('cart.empty')}</p>
                        <p className="text-zinc-600 text-xs font-medium">{t('cart.emptyTagline')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          key={item.id} className="flex gap-3 bg-dark-card p-4 rounded-xl border border-white/10 group hover:border-primary-vibrant/20 transition-colors duration-300">
                          <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-white/10">
                            <OptimizedImage
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full p-1"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-sm text-white uppercase tracking-wider truncate">{item.name}</h3>
                              <p className="font-display text-secondary-vibrant text-sm tracking-wider">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1.5 bg-white/10 rounded-xl p-1 border border-white/10">
                                <motion.button whileTap={{ scale: 0.8 }}
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-11 h-11 bg-white/10 hover:bg-white/15 rounded-lg flex items-center justify-center text-zinc-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-vibrant focus:ring-offset-1 focus:ring-offset-dark"
                                  aria-label={`Decrease quantity of ${item.name}`}>
                                  <Minus className="w-4 h-4" />
                                </motion.button>
                                <span className="w-7 text-center font-bold text-sm text-white">{item.quantity}</span>
                                <motion.button whileTap={{ scale: 0.8 }}
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-11 h-11 bg-primary-vibrant text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary-vibrant/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-primary-vibrant"
                                  aria-label={`Increase quantity of ${item.name}`}>
                                  <Plus className="w-4 h-4" />
                                </motion.button>
                              </div>
                              <div className="flex-1 ml-3 relative">
                                <textarea 
                                  placeholder={t('cart.specialInstructions') + " (ej: sin picante)"}
                                  aria-label={t('cart.specialInstructions')}
                                  value={item.notes} onChange={(e) => updateNotes(item.id, e.target.value)}
                                  className="w-full text-xs bg-white/5 border border-white/5 rounded-lg px-3 py-2 focus:border-primary-vibrant/50 outline-none transition-colors duration-200 resize-none min-h-[32px] text-zinc-300 placeholder:text-zinc-600"
                                  rows={1} maxLength={100} />
                                {item.notes && <span className="absolute -bottom-4 right-0 text-[8px] text-zinc-600">{item.notes.length}/100</span>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <form id="checkout-form" className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-5 font-body">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4">
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"><User className="w-4 h-4" /></div>
                          <input required placeholder={t('cart.fullName')}
                            aria-describedby={formErrors.name ? 'name-error' : undefined}
                            aria-invalid={formErrors.name ? 'true' : 'false'}
                            className={`w-full pl-12 pr-4 py-4 bg-dark-surface border-2 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-500 ${
                              formErrors.name ? 'border-red-500/50' : 'border-white/10'
                            }`}
                            value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); validateField('name', e.target.value); }} />
                          {formErrors.name && <span id="name-error" className="absolute -bottom-5 left-0 text-[10px] text-red-400" role="alert">{formErrors.name}</span>}
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"><Phone className="w-4 h-4" /></div>
                          <input required type="tel" placeholder={t('cart.whatsapp')}
                            aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                            aria-invalid={formErrors.phone ? 'true' : 'false'}
                            className={`w-full pl-12 pr-4 py-4 bg-dark-surface border-2 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-500 ${
                              formErrors.phone ? 'border-red-500/50' : 'border-white/10'
                            }`}
                            value={formData.phone} onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); validateField('phone', e.target.value); }} />
                          {formErrors.phone && <span id="phone-error" className="absolute -bottom-5 left-0 text-[10px] text-red-400" role="alert">{formErrors.phone}</span>}
                        </div>

                        {deliveryType === 'Delivery' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                            {calculatedDistance !== null && (
                              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                className={`p-4 rounded-2xl border-2 ${
                                  isWithinRange ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                                }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${isWithinRange ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                      <Navigation className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-zinc-400">Distancia estimada</p>
                                      <p className="text-sm font-bold text-white">{calculatedDistance} km</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-medium text-zinc-500">Costo de envío</p>
                                    <p className="text-lg font-display text-secondary-vibrant tracking-wider">+${calculatedFee.toFixed(2)}</p>
                                  </div>
                                </div>
                                {!isWithinRange && (
                                  <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg mt-2">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                    <span className="text-xs font-medium text-red-300">Fuera de cobertura ({config.distancePricing?.maxDeliveryDistance || 20} km)</span>
                                  </div>
                                )}
                              </motion.div>
                            )}

                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button"
                              onClick={handleGetUserLocation} disabled={isLocating}
                                className="w-full py-4 bg-secondary-vibrant/10 border border-secondary-vibrant/30 rounded-[20px] text-[11px] font-bold uppercase tracking-[0.2em] text-secondary-vibrant hover:bg-secondary-vibrant/15 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50">
                              {isLocating ? (
                                <><div className="w-4 h-4 border-2 border-secondary-vibrant border-t-transparent rounded-full animate-spin" />{t('cart.locating') || 'Localizando...'}</>
                              ) : (
                                <><Navigation className="w-4 h-4" /> {t('cart.useLocation') || 'Usar mi ubicación actual'}</>
                              )}
                            </motion.button>

                            <div className="relative">
                              <div className="absolute left-4 top-4 text-zinc-400"><MapPin className="w-4 h-4" /></div>
                              <textarea required placeholder={t('cart.address') + " (escribe para buscar)"}
                                aria-describedby={formErrors.address ? 'address-error' : undefined}
                                aria-invalid={formErrors.address ? 'true' : 'false'}
                                className={`w-full pl-12 pr-4 py-4 bg-dark-surface border-2 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-500 min-h-[100px] resize-none ${
                                  formErrors.address ? 'border-red-500/50' : 'border-white/10'
                                }`}
                                value={formData.address} onChange={(e) => { setFormData({ ...formData, address: e.target.value }); validateField('address', e.target.value); }} />
                              {formErrors.address && <span id="address-error" className="absolute -bottom-5 left-0 text-[10px] text-red-400" role="alert">{formErrors.address}</span>}
                              {isLoadingAddress && (
                                <div className="absolute right-4 top-4 flex items-center gap-2 bg-primary-vibrant/10 px-3 py-1 rounded-full">
                                  <div className="w-3 h-3 border-2 border-primary-vibrant border-t-transparent rounded-full animate-spin" />
                                  <span className="text-[10px] font-medium text-primary-vibrant">Buscando...</span>
                                </div>
                              )}
                              {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-dark-surface border border-white/10 rounded-[20px] mt-2 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                  {suggestions.map(s => (
                                    <button key={s.place_id} type="button" onClick={() => handleAddressSelect(s)}
                                      className="block w-full text-left p-4 text-[11px] hover:bg-white/5 border-b border-white/5 font-medium truncate text-zinc-300 transition-colors duration-200">
                                      {s.display_name}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {showSuggestions && suggestions.length === 0 && !isLoadingAddress && formData.address.length > 3 && !searchError && (
                                <div className="absolute z-10 w-full bg-dark-surface border border-white/10 rounded-[20px] mt-2 shadow-2xl p-4">
                                  <p className="text-[11px] text-zinc-500 font-medium text-center">No se encontraron direcciones</p>
                                </div>
                              )}
                              {addressError && (
                                <div className="absolute -bottom-6 left-0 text-red-400 text-[10px] font-medium flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> {addressError}
                                </div>
                              )}
                            </div>

                            {deliveryType === 'Delivery' && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-3 p-4 bg-dark-surface rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-primary-vibrant" />
                                  <span className="text-xs font-bold text-zinc-300">Ubicación de entrega</span>
                                </div>
                                <div className="w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-white/10 relative z-0">
                                  <MapComponent
                                    center={deliveryCoordinates ? [deliveryCoordinates.lat, deliveryCoordinates.lng] : (location.latitude && location.longitude ? [location.latitude, location.longitude] : [10.162, -68.007])}
                                    zoom={deliveryCoordinates ? 16 : 13} onLocationSelect={handleMapLocationSelect}
                                    markerPosition={deliveryCoordinates ? [deliveryCoordinates.lat, deliveryCoordinates.lng] : undefined}
                                    style="modern" showPopup={false} isPreview={false} fixedCenterMarker={true} />
                                  {!deliveryCoordinates && (
                                    <div className="absolute inset-x-0 bottom-4 pointer-events-none flex justify-center z-[1000]">
                                      <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] px-4 py-2 rounded-full font-medium shadow-lg">
                                        Mueve el mapa para fijar tu ubicación
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {deliveryCoordinates && (
                                  <p className="text-[10px] text-zinc-600 text-center font-medium">
                                    Coordenadas: {deliveryCoordinates.lat.toFixed(5)}, {deliveryCoordinates.lng.toFixed(5)}
                                  </p>
                                )}
                              </motion.div>
                            )}

                            <div className="relative">
                              <input placeholder={t('cart.reference')}
                                className="w-full px-6 py-4 bg-dark-surface border-2 border-white/10 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-500"
                                value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <AnimatePresence>
              {isMapOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md p-6 flex items-center justify-center">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className={`bg-dark-card p-8 rounded-2xl w-full max-w-lg space-y-6 transition-all duration-500 ${
                      locationSelected ? 'border-2 border-green-500/30' : 'border border-white/5'
                    }`}>
                    <div className="flex flex-col items-center text-center space-y-2">
                      <h3 className="font-display text-xl tracking-wider text-white">{t('cart.mapTitle')}</h3>
                      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-zinc-500">{t('cart.mapTagline')}</p>
                      {locationSelected && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-[10px] font-medium text-green-400">Ubicación confirmada</span>
                        </motion.div>
                      )}
                    </div>
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <MapComponent center={location.latitude && location.longitude ? [location.latitude, location.longitude] : [10.162, -68.007]}
                        onLocationSelect={handleMapLocationSelect}
                        markerPosition={deliveryCoordinates ? [deliveryCoordinates.lat, deliveryCoordinates.lng] : undefined}
                        style="modern" showPopup={true} />
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} type="button" onClick={() => setIsMapOpen(false)}
                      className="w-full bg-white/5 text-white py-5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all duration-300 border border-white/5">
                      {t('cart.closeMap')}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 sm:p-6 bg-dark-card border-t-2 border-secondary-vibrant/30 space-y-4">
                <div className="p-5 bg-dark-surface text-white rounded-xl space-y-3 relative overflow-hidden border-2 border-primary-vibrant/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 rounded-full blur-2xl -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary-vibrant/15 rounded-full blur-xl -ml-12 -mb-12" />

                  {deliveryType === 'Delivery' && step === 'checkout' && (
                    <>
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                        <span>{t('cart.shipping')}</span>
                        <span className="text-secondary-vibrant">${calculatedFee.toFixed(2)}</span>
                      </div>
                      {calculatedDistance !== null && (
                        <div className="flex justify-between items-center text-[9px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                          <span>Distancia estimada</span>
                          <span className="text-zinc-300 font-bold">{calculatedDistance} km</span>
                        </div>
                      )}
                    </>
                  )}

                  {items.length > 0 && (
                    <div className="space-y-1.5 pb-3 border-b-2 border-primary-vibrant/20">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary-vibrant">Resumen del Pedido</p>
                      {items.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-[11px] text-zinc-300">
                          <span className="truncate flex-1">{item.quantity}x {item.name}</span>
                          <span className="font-medium text-white">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-end border-b-2 border-secondary-vibrant/20 pb-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-secondary-vibrant mb-0.5">{t('cart.orderTotal')}</span>
                      <span className="font-display text-2xl sm:text-3xl tracking-wider leading-none text-white">${finalTotal.toFixed(2)} <span className="text-[10px] text-zinc-400 ml-1 font-medium font-body">USD</span></span>
                      {(config.taxRate ?? 0) > 0 && (
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">{t('cart.includesTax')} ({((config.taxRate ?? 0) * 100).toFixed(1)}%)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-secondary-vibrant uppercase tracking-widest">{t('cart.inBolivares')}</span>
                      <span className="font-display text-lg sm:text-xl text-secondary-vibrant tracking-wider">
                        {totalVES.toLocaleString(language === 'es' ? 'es-VE' : 'en-US', { minimumFractionDigits: 2 })} <span className="text-[9px] font-body">Bs.</span>
                      </span>
                    </div>
                    <div className="bg-secondary-vibrant/10 px-3 py-1 rounded-full border border-secondary-vibrant/20">
                      <span className="text-[8px] text-secondary-vibrant font-bold uppercase">Tasa: {config.exchangeRate}</span>
                    </div>
                  </div>
                </div>

                {step === 'cart' ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep('checkout')}
                    className="w-full vibrant-gradient text-white py-5 sm:py-6 rounded-[20px] font-display uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(203,32,39,0.3)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(203,32,39,0.5)]">
                    {t('cart.continue')} <ArrowRight className="w-5 h-5" />
                  </motion.button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setStep('cart')}
                      className="w-full sm:flex-1 bg-white/5 text-zinc-400 py-5 sm:py-6 rounded-[20px] font-display uppercase tracking-widest text-xs sm:text-[11px] transition-all duration-300 hover:bg-white/10 border border-white/5">
                      {t('cart.back')}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} form="checkout-form" type="submit"
                      disabled={deliveryType === 'Delivery' && !isWithinRange}
                      className={`w-full sm:flex-[2] bg-[#25D366] text-white py-5 sm:py-6 rounded-[20px] font-display uppercase tracking-[0.2em] text-xs sm:text-[11px] shadow-[0_20px_50px_rgba(37,211,102,0.3)] transition-all duration-300 flex items-center justify-center gap-3 ${
                        deliveryType === 'Delivery' && !isWithinRange ? 'opacity-50 cursor-not-allowed' : ''
                      }`}>
                      {deliveryType === 'Delivery' && !isWithinRange ? t('cart.outOfCoverage') : t('cart.confirmWhatsApp')}
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
