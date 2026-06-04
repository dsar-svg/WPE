
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, MapPin, Phone, Trash2, Plus, Minus, X, Search, ArrowRight, Navigation, AlertCircle } from 'lucide-react';
import { Product, CartItem, DeliveryType, CheckoutData, Location, AddressSuggestion } from '../types';
import React, { useState, useEffect } from 'react';
import { MapComponent } from './MapComponent';
import { useLanguage } from '../context/LanguageContext';
import { useRestaurant } from '../context/RestaurantContext';
import { useDistanceCalculation } from '../hooks/useDistanceCalculation';
import { DistanceService } from '../services/DistanceService';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  location: Location;
  updateQuantity: (id: string, qty: number) => void;
  updateNotes: (id: string, notes: string) => void;
  onCheckout: (data: CheckoutData) => void;
}

// La interfaz AddressSuggestion ahora está importada desde types.ts

export function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  location,
  updateQuantity,
  updateNotes,
  onCheckout,
}: CartDrawerProps) {
  const { config } = useRestaurant();
  const { t, language } = useLanguage();
  const { searchAddress, calculateDistanceAndFee, clearSuggestions, suggestions, isLoading: isLoadingAddress } = useDistanceCalculation();

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('Pick-up');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    reference: '',
    notes: '',
  });
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatedFee, setCalculatedFee] = useState<number>(0);
  const [isWithinRange, setIsWithinRange] = useState<boolean>(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Search logic con Nominatim
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

  // Calcular tarifa basada en distancia
  useEffect(() => {
    if (deliveryType === 'Delivery' && deliveryCoordinates && location.latitude && location.longitude) {
      const result = calculateDistanceAndFee(
        location.latitude,
        location.longitude,
        deliveryCoordinates.lat,
        deliveryCoordinates.lng,
        config.distancePricing?.ranges || [],
        config.distancePricing?.maxDeliveryDistance || 20
      );

      setCalculatedDistance(result.distance);
      setCalculatedFee(result.deliveryFee);
      setIsWithinRange(result.isWithinRange);
      setAddressError(result.isWithinRange ? null : 'Dirección fuera del área de cobertura');
    } else if (deliveryType === 'Delivery') {
      setCalculatedFee(location.deliveryFee ?? config.deliveryFee ?? 0);
      setCalculatedDistance(null);
      setIsWithinRange(true);
    } else {
      setCalculatedFee(0);
      setCalculatedDistance(null);
      setIsWithinRange(true);
    }
  }, [deliveryType, deliveryCoordinates, location, config, calculateDistanceAndFee]);

  const subtotalWithTax = total * (1 + (location.taxRate ?? config.taxRate ?? 0));
  const finalTotal = subtotalWithTax + calculatedFee;
  const totalVES = finalTotal * (location.exchangeRate ?? config.exchangeRate ?? 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (deliveryType === 'Delivery' && !isWithinRange) {
      setAddressError('La dirección está fuera del área de cobertura');
      return;
    }

    onCheckout({
      ...formData,
      deliveryType,
      deliveryCoordinates: deliveryType === 'Delivery' ? deliveryCoordinates : undefined,
      calculatedDistance: deliveryType === 'Delivery' ? calculatedDistance : undefined,
      calculatedDeliveryFee: deliveryType === 'Delivery' ? calculatedFee : undefined,
    });
  };

  // Manejar selección de dirección desde sugerencias
  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setFormData({ ...formData, address: suggestion.display_name });
    setDeliveryCoordinates({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon)
    });
    setShowSuggestions(false);
    clearSuggestions();
  };

  // Manejar selección de ubicación desde mapa
  const handleMapLocationSelect = (lat: number, lng: number) => {
    setDeliveryCoordinates({ lat, lng });
    setFormData({ ...formData, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    setIsMapOpen(false);
  };

  // Obtener ubicación del usuario
  const handleGetUserLocation = async () => {
    try {
      const userLocation = await DistanceService.getUserLocation();
      if (userLocation) {
        setDeliveryCoordinates(userLocation);
        // Intentar obtener dirección aproximada
        const suggestions = await DistanceService.geocodeAddress(
          `${userLocation.lat},${userLocation.lng}`
        );
        if (suggestions.length > 0) {
          setFormData({ ...formData, address: suggestions[0].display_name });
        } else {
          setFormData({ ...formData, address: `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` });
        }
      }
    } catch (error) {
      setAddressError('No se pudo obtener la ubicación actual');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            id="cart-overlay"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white rounded-t-3xl z-50 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
            id="cart-drawer"
          >
            <div className="p-6 border-b flex justify-between items-center vibrant-gradient text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-12 -mt-12" />
              <h2 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3 relative z-10">
                <ShoppingCart className="w-6 h-6" />
                {step === 'cart' ? t('cart.title') : t('cart.checkout')}
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50 scroll-smooth pb-40">
              {step === 'cart' ? (
                <>
                  {items.length === 0 ? (
                    <div className="py-24 text-center space-y-6">
                      <motion.div 
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-24 h-24 bg-white rounded-[40px] shadow-xl flex items-center justify-center mx-auto text-zinc-200"
                      >
                        <ShoppingCart className="w-12 h-12" />
                      </motion.div>
                      <div className="space-y-2">
                        <p className="text-zinc-600 font-black uppercase text-sm tracking-widest leading-none">{t('cart.empty')}</p>
                        <p className="text-zinc-400 text-xs font-medium italic">{t('cart.emptyTagline')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map((item) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={item.id} 
                          className="flex gap-4 bg-white p-4 rounded-[32px] border border-zinc-100 shadow-xl shadow-zinc-200/50 group"
                        >
                          <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden shadow-inner border border-zinc-50">
                            <img
                              src={item.image || 'https://picsum.photos/seed/food/400/300'}
                              alt={t(`prod.${item.id}.name`)}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-black text-sm text-zinc-800 uppercase tracking-tight truncate">{t(`prod.${item.id}.name`)}</h3>
                              <p className="font-black text-primary-vibrant text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2 bg-zinc-100 rounded-xl p-1 shadow-inner">
                                <motion.button
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-6 h-6 bg-white hover:bg-zinc-50 rounded-lg flex items-center justify-center text-zinc-600 shadow-sm transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </motion.button>
                                <span className="w-6 text-center font-black text-xs">{item.quantity}</span>
                                <motion.button
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-6 h-6 bg-primary-vibrant text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary-vibrant/20 transition-all"
                                >
                                  <Plus className="w-3 h-3" />
                                </motion.button>
                              </div>
                              <div className="flex-1 ml-4 relative">
                                <input
                                  type="text"
                                  placeholder={t('cart.specialInstructions')}
                                  value={item.notes}
                                  onChange={(e) => updateNotes(item.id, e.target.value)}
                                  className="w-full text-[10px] bg-transparent border-b border-zinc-200 focus:border-secondary-vibrant outline-none py-1 italic text-zinc-500 placeholder:text-zinc-300 transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <form id="checkout-form" className="space-y-8" onSubmit={handleSubmit}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 font-sans"
                  >
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block px-2">{t('cart.deliveryMethod')}</label>
                      <div className="flex bg-zinc-200/50 p-1.5 rounded-[24px] gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('Pick-up')}
                          className={`flex-1 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${
                            deliveryType === 'Pick-up' 
                              ? 'bg-white shadow-xl text-primary-vibrant scale-[1.02]' 
                              : 'text-zinc-400'
                          }`}
                        >
                          {t('cart.pickup')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryType('Delivery')}
                          className={`flex-1 py-3 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all ${
                            deliveryType === 'Delivery' 
                              ? 'bg-primary-vibrant shadow-xl text-white scale-[1.02]' 
                              : 'text-zinc-400'
                          }`}
                        >
                          {t('cart.delivery')}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-4">
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                             <User className="w-4 h-4" />
                          </div>
                          <input
                            required
                            placeholder={t('cart.fullName')}
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-[24px] focus:border-secondary-vibrant outline-none transition-all text-sm font-medium shadow-xl shadow-zinc-200/50"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                             <Phone className="w-4 h-4" />
                          </div>
                          <input
                            required
                            type="tel"
                            placeholder={t('cart.whatsapp')}
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-[24px] focus:border-secondary-vibrant outline-none transition-all text-sm font-medium shadow-xl shadow-zinc-200/50"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                         {deliveryType === 'Delivery' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-4"
                          >
                            {/* Información de distancia y tarifa */}
                            {calculatedDistance !== null && (
                              <div className={`p-4 rounded-[20px] border-2 ${isWithinRange ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Navigation className="w-4 h-4 text-zinc-600" />
                                    <span className="text-xs font-black text-zinc-800">
                                      Distancia: <strong>{calculatedDistance} km</strong>
                                    </span>
                                  </div>
                                  <span className="text-xs font-black text-primary-vibrant">
                                    +${calculatedFee.toFixed(2)}
                                  </span>
                                </div>
                                {!isWithinRange && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <AlertCircle className="w-3 h-3 text-red-500" />
                                    <span className="text-[10px] text-red-600 font-medium">
                                      Fuera del área de cobertura máxima
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Botón para obtener ubicación actual */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={handleGetUserLocation}
                              className="w-full py-4 bg-blue-50 border border-blue-200 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                            >
                              <Navigation className="w-4 h-4" /> Usar mi ubicación actual
                            </motion.button>

                            <div className="relative">
                              <div className="absolute left-4 top-4 text-zinc-400">
                                 <MapPin className="w-4 h-4" />
                              </div>
                              <textarea
                                required
                                placeholder={t('cart.address') + " (escribe para buscar)"}
                                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-[24px] focus:border-secondary-vibrant outline-none transition-all text-sm font-medium shadow-xl shadow-zinc-200/50 min-h-[100px] resize-none"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              />
                              {isLoadingAddress && (
                                <div className="absolute right-4 top-4">
                                  <div className="w-4 h-4 border-2 border-primary-vibrant border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                              {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-zinc-100 rounded-[24px] mt-2 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                                  {suggestions.map(s => (
                                    <button
                                      key={s.place_id}
                                      type="button"
                                      onClick={() => handleAddressSelect(s)}
                                      className="block w-full text-left p-4 text-[11px] hover:bg-zinc-50 border-b border-zinc-50 font-medium truncate"
                                    >
                                      {s.display_name}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {addressError && (
                                <div className="absolute -bottom-6 left-0 text-red-500 text-[10px] font-medium flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> {addressError}
                                </div>
                              )}
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => setIsMapOpen(true)}
                              className="w-full py-4 bg-zinc-100 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                            >
                              <Search className="w-4 h-4" /> {t('cart.mapSelect')}
                            </motion.button>

                            <div className="relative">
                              <input
                                placeholder={t('cart.reference')}
                                className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-[24px] focus:border-secondary-vibrant outline-none transition-all text-sm font-medium shadow-xl shadow-zinc-200/50"
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </form>
              )}
            </div>

            <AnimatePresence>
              {isMapOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md p-6 flex items-center justify-center"
                >
                  <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white p-8 rounded-[40px] w-full max-w-lg space-y-6 shadow-2xl"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                       <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900">{t('cart.mapTitle')}</h3>
                       <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400">{t('cart.mapTagline')}</p>
                    </div>
                    <div className="rounded-[32px] overflow-hidden border-4 border-zinc-50 shadow-inner">
                      <MapComponent
                        center={location.latitude && location.longitude ? [location.latitude, location.longitude] : [10.162, -68.007]}
                        onLocationSelect={handleMapLocationSelect}
                        markerPosition={deliveryCoordinates ? [deliveryCoordinates.lat, deliveryCoordinates.lng] : undefined}
                      />
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      type="button" 
                      onClick={() => setIsMapOpen(false)} 
                      className="w-full bg-zinc-900 text-white py-5 rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      {t('cart.closeMap')}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {items.length > 0 && (
              <div className="p-6 bg-white border-t border-zinc-100 space-y-4">
                <div className="p-6 bg-zinc-950 text-white rounded-[40px] shadow-2xl space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 rounded-full blur-2xl -mr-16 -mt-16" />
                  
                  {deliveryType === 'Delivery' && step === 'checkout' && (
                    <>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <span>{t('cart.shipping')}</span>
                        <span className="text-white">${calculatedFee.toFixed(2)}</span>
                      </div>
                      {calculatedDistance !== null && (
                        <div className="flex justify-between items-center text-[8px] font-medium uppercase tracking-widest text-zinc-400">
                          <span>Distancia estimada</span>
                          <span className="text-white">{calculatedDistance} km</span>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex justify-between items-end border-b border-white/10 pb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">{t('cart.orderTotal')}</span>
                      <span className="text-3xl font-black tracking-tighter leading-none">${finalTotal.toFixed(2)} <span className="text-xs text-zinc-500 ml-1 italic font-medium">USD</span></span>
                      {(location.taxRate ?? config.taxRate ?? 0) > 0 && (
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest">{t('cart.includesTax')} ({((location.taxRate ?? config.taxRate ?? 0) * 100).toFixed(1)}%)</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-secondary-vibrant uppercase tracking-widest">{t('cart.inBolivares')}</span>
                       <span className="text-xl font-black text-white tracking-tight">
                         {totalVES.toLocaleString(language === 'es' ? 'es-VE' : 'en-US', { minimumFractionDigits: 2 })} <span className="text-[10px]">Bs.</span>
                       </span>
                    </div>
                    <div className="bg-white/5 px-3 py-1 rounded-full">
                       <span className="text-[8px] opacity-40 font-black uppercase">Tasa: {location.exchangeRate ?? config.exchangeRate}</span>
                    </div>
                  </div>
                </div>

                {step === 'cart' ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep('checkout')}
                    className="w-full vibrant-gradient text-white py-6 rounded-[28px] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(203,32,39,0.3)] transition-all"
                  >
                    {t('cart.continue')} <ArrowRight className="w-5 h-5" />
                  </motion.button>
                ) : (
                  <div className="flex gap-4">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStep('cart')}
                      className="flex-1 bg-zinc-100 text-zinc-600 py-6 rounded-[28px] font-black uppercase tracking-widest text-[11px] transition-all"
                    >
                      {t('cart.back')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      form="checkout-form"
                      type="submit"
                      disabled={deliveryType === 'Delivery' && !isWithinRange}
                      className={`flex-[2] bg-[#25D366] text-white py-6 rounded-[28px] font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_40px_rgba(37,211,102,0.3)] transition-all flex items-center justify-center gap-3 ${
                        deliveryType === 'Delivery' && !isWithinRange ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {deliveryType === 'Delivery' && !isWithinRange ? 'Fuera de cobertura' : t('cart.confirmWhatsApp')}
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
