import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Navigation,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Send,
  X,
} from 'lucide-react';
import { CartItem, DeliveryType, CheckoutData, Location, AddressSuggestion } from '../../types';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapComponent } from './MapComponent';
import { useLanguage } from '../../context/LanguageContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { useDistanceCalculation } from '../../hooks/useDistanceCalculation';
import { OptimizedImage } from './OptimizedImage';

type AddressStatus = 'idle' | 'searching' | 'valid' | 'invalid' | 'out_of_zone' | 'gps_pending';

interface CheckoutPageProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  items: CartItem[];
  total: number;
  location: Location;
  onCheckout: (data: CheckoutData) => void;
}

export function CheckoutPage({
  isOpen,
  onClose,
  onBack,
  items,
  total,
  location,
  onCheckout,
}: CheckoutPageProps) {
  const { config } = useRestaurant();
  const { t, language } = useLanguage();
  const {
    searchAddress,
    reverseGeocodeAddress,
    autoGeocode,
    calculateDistanceAndFee,
    getRoadDistanceCalc,
    autoGeolocate,
    saveLastAddress,
    loadLastAddress,
    clearSuggestions,
    suggestions,
    isLoading: isLoadingAddress,
  } = useDistanceCalculation();

  // ── State ─────────────────────────────────────────────────────────────
  const [deliveryType] = useState<DeliveryType>('Delivery');
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', reference: '' });
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatedFee, setCalculatedFee] = useState<number>(0);
  const [isWithinRange, setIsWithinRange] = useState<boolean>(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({ name: '', phone: '', address: '' });
  const [locationSelected, setLocationSelected] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addressStatus, setAddressStatus] = useState<AddressStatus>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mapCenterKey, setMapCenterKey] = useState(0);

  const addressStatusRef = useRef<AddressStatus>('idle');
  const addressInputRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { addressStatusRef.current = addressStatus; }, [addressStatus]);

  // ── Load last address on mount ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const last = loadLastAddress();
    if (last) {
      setFormData((p) => ({ ...p, address: last.address }));
      setDeliveryCoordinates({ lat: last.lat, lng: last.lng });
      setAddressStatus('valid');
    }
  }, [isOpen, loadLastAddress]);

  // ── Auto GPS geolocation when checkout opens (once) ──────────────────
  const gpsAttempted = useRef(false);
  useEffect(() => {
    if (!isOpen || gpsAttempted.current) return;
    if (deliveryCoordinates) { gpsAttempted.current = true; return; }
    gpsAttempted.current = true;
    (async () => {
      setAddressStatus('gps_pending');
      const loc = await autoGeolocate();
      if (loc) {
        setDeliveryCoordinates(loc);
        setMapCenterKey((k) => k + 1);
        const addr = await reverseGeocodeAddress(loc.lat, loc.lng);
        if (addr) {
          setFormData((p) => ({ ...p, address: addr }));
          setAddressStatus('valid');
          saveLastAddress(addr, loc.lat, loc.lng);
        }
      } else {
        setAddressStatus('idle');
      }
    })();
  }, [isOpen, deliveryCoordinates, autoGeolocate, reverseGeocodeAddress, saveLastAddress]);

  // Reset GPS attempt when checkout closes
  useEffect(() => {
    if (!isOpen) gpsAttempted.current = false;
  }, [isOpen]);

  // ── Address input debounce → autocomplete ────────────────────────────
  const handleAddressChange = useCallback(
    (value: string) => {
      setFormData((p) => ({ ...p, address: value }));
      setAddressStatus('searching');
      setAddressError(null);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.trim().length < 3) {
        clearSuggestions();
        setShowSuggestions(false);
        setAddressStatus('idle');
        return;
      }

      debounceRef.current = setTimeout(async () => {
        await searchAddress(value);
        setShowSuggestions(true);
      }, 400);
    },
    [searchAddress, clearSuggestions],
  );

  // ── Suggestion selected ──────────────────────────────────────────────
  const handleAddressSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      const addr = suggestion.display_name;
      const lat = parseFloat(suggestion.lat);
      const lng = parseFloat(suggestion.lon);
      setFormData((p) => ({ ...p, address: addr }));
      setDeliveryCoordinates({ lat, lng });
      setMapCenterKey((k) => k + 1);
      setShowSuggestions(false);
      clearSuggestions();
      setAddressStatus('valid');
      setLocationSelected(true);
      saveLastAddress(addr, lat, lng);
      setTimeout(() => setLocationSelected(false), 1000);
    },
    [clearSuggestions, saveLastAddress],
  );

  // ── Address blur → auto-geocode ──────────────────────────────────────
  const handleAddressBlur = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setShowSuggestions(false);

    const addr = formData.address.trim();
    if (addr.length < 5 || deliveryCoordinates) return;

    setAddressStatus('searching');
    const result = await autoGeocode(addr);
    if (result) {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      setFormData((p) => ({ ...p, address: result.display_name }));
      setDeliveryCoordinates({ lat, lng });
      setAddressStatus('valid');
      saveLastAddress(result.display_name, lat, lng);
    } else {
      setAddressStatus('invalid');
    }
  }, [formData.address, deliveryCoordinates, autoGeocode, saveLastAddress]);

  // ── Map click / drag-end ─────────────────────────────────────────────
  const handleMapLocationSelect = useCallback(
    async (lat: number, lng: number) => {
      setDeliveryCoordinates({ lat, lng });
      setMapCenterKey((k) => k + 1);
      setLocationSelected(true);
      setShowSuggestions(false);
      clearSuggestions();
      setAddressStatus('searching');
      const addr = await reverseGeocodeAddress(lat, lng);
      if (addr) {
        setFormData((p) => ({ ...p, address: addr }));
        setAddressStatus('valid');
        saveLastAddress(addr, lat, lng);
      } else {
        const coords = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setFormData((p) => ({ ...p, address: coords }));
        setAddressStatus('valid');
      }
      setTimeout(() => setLocationSelected(false), 1000);
    },
    [reverseGeocodeAddress, clearSuggestions, saveLastAddress],
  );

  const handleMapDragEnd = useCallback(
    async (lat: number, lng: number, addr: string | null) => {
      setDeliveryCoordinates({ lat, lng });
      if (addr) {
        setFormData((p) => ({ ...p, address: addr }));
        saveLastAddress(addr, lat, lng);
      }
      setAddressStatus('valid');
      setLocationSelected(true);
      setTimeout(() => setLocationSelected(false), 1000);
    },
    [saveLastAddress],
  );

  const handleMapOutOfBounds = useCallback(() => {
    setToastMessage('Fuera de Venezuela — el marcador se ha reposicionado');
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // ── GPS button ───────────────────────────────────────────────────────
  const handleGetUserLocation = useCallback(async () => {
    setIsLocating(true);
    setAddressError(null);
    setAddressStatus('gps_pending');
    try {
      const userLocation = await autoGeolocate();
      if (userLocation) {
        setDeliveryCoordinates(userLocation);
        setMapCenterKey((k) => k + 1);
        setLocationSelected(true);
        setAddressStatus('searching');
        const addr = await reverseGeocodeAddress(userLocation.lat, userLocation.lng);
        if (addr) {
          setFormData((p) => ({ ...p, address: addr }));
          saveLastAddress(addr, userLocation.lat, userLocation.lng);
        } else {
          setFormData((p) => ({ ...p, address: `${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}` }));
        }
        setAddressStatus('valid');
        setTimeout(() => setLocationSelected(false), 1500);
      } else {
        setAddressStatus('idle');
        setAddressError('No se pudo obtener la ubicación');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      setAddressError(msg);
      setAddressStatus('idle');
    } finally {
      setIsLocating(false);
    }
  }, [autoGeolocate, reverseGeocodeAddress, saveLastAddress]);

  // ── Distance / fee calculation ───────────────────────────────────────
  useEffect(() => {
    if (deliveryType !== 'Delivery' || !deliveryCoordinates || !location.latitude || !location.longitude) {
      setCalculatedFee(config.deliveryFee ?? 0);
      setCalculatedDistance(null);
      setIsWithinRange(true);
      return;
    }
    const ranges = config.distancePricing?.ranges ?? [];
    const maxDist = config.distancePricing?.maxDeliveryDistance ?? 20;

    const quick = calculateDistanceAndFee(
      location.latitude, location.longitude,
      deliveryCoordinates.lat, deliveryCoordinates.lng,
      ranges, maxDist,
    );
    setCalculatedDistance(quick.distance);
    setCalculatedFee(quick.deliveryFee);
    setIsWithinRange(quick.isWithinRange);

    if (!quick.isWithinRange) {
      setAddressError(t('cart.error.addressOutOfRange'));
      setAddressStatus('out_of_zone');
    } else {
      setAddressError(null);
      if (addressStatusRef.current !== 'searching' && addressStatusRef.current !== 'gps_pending') {
        setAddressStatus('valid');
      }
    }

    (async () => {
      try {
        const roadKm = await getRoadDistanceCalc(
          location.latitude, location.longitude,
          deliveryCoordinates.lat, deliveryCoordinates.lng,
        );
        setCalculatedDistance(roadKm);
        const roadFee = calculateDistanceAndFee(
          location.latitude, location.longitude,
          deliveryCoordinates.lat, deliveryCoordinates.lng,
          ranges, maxDist,
        ).deliveryFee;
        setCalculatedFee(roadFee);
        setIsWithinRange(roadKm <= maxDist);
        if (roadKm > maxDist) {
          setAddressError(t('cart.error.addressOutOfRange'));
          setAddressStatus('out_of_zone');
        }
      } catch {
        // keep Haversine result
      }
    })();
  }, [
    deliveryType, deliveryCoordinates, location, config,
    calculateDistanceAndFee, getRoadDistanceCalc, t,
  ]);

  // ── Validation ───────────────────────────────────────────────────────
  const validateField = useCallback(
    (field: string, value: string) => {
      let error = '';
      switch (field) {
        case 'name':
          error = value.length < 2 ? t('cart.error.nameMin') : '';
          break;
        case 'phone': {
          const re = /^[0-9+\-\s()]{10,}$/;
          error = !re.test(value) ? t('cart.error.phoneInvalid') : '';
          break;
        }
        case 'address':
          error = value.length < 5 ? t('cart.error.addressMin') : '';
          break;
      }
      setFormErrors((p) => ({ ...p, [field]: error }));
      return !error;
    },
    [t],
  );

  // ── Totals ───────────────────────────────────────────────────────────
  const subtotalWithTax = total * (1 + (config.taxRate ?? 0));
  const finalTotal = subtotalWithTax + calculatedFee;
  const totalVES = finalTotal * (config.exchangeRate ?? 1);

  // ── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nameOk = validateField('name', formData.name);
    const phoneOk = validateField('phone', formData.phone);
    const addressOk = validateField('address', formData.address);
    if (!nameOk || !phoneOk || !addressOk) return;
    if (!isWithinRange) {
      setAddressError(t('cart.error.addressOutOfRange'));
      return;
    }
    onCheckout({
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      reference: formData.reference,
      deliveryType,
      deliveryCoordinates: deliveryCoordinates ?? undefined,
      calculatedDistance: calculatedDistance ?? undefined,
      calculatedDeliveryFee: calculatedFee,
      notes: '',
    });
  };

  const statusDotClass =
    addressStatus === 'valid' ? 'valid'
    : addressStatus === 'out_of_zone' || addressStatus === 'invalid' ? 'invalid'
    : addressStatus === 'searching' || addressStatus === 'gps_pending' ? 'pending'
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 200 }}
          className="fixed inset-0 z-50 bg-dark-card overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-dark-card/95 backdrop-blur-md border-b border-white/10 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between max-w-lg mx-auto">
              <button
                onClick={onBack}
                className="p-2 bg-white/10 hover:bg-white/15 rounded-xl transition-all duration-300 text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-display text-lg tracking-wider text-white">{t('cart.checkout')}</h2>
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-primary-vibrant rounded-xl transition-all duration-300 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Map — 50% of viewport height */}
          <div className="w-full h-[50vh] relative">
            <MapComponent
              center={
                deliveryCoordinates
                  ? [deliveryCoordinates.lat, deliveryCoordinates.lng]
                  : location.latitude && location.longitude
                    ? [location.latitude, location.longitude]
                    : [10.162, -68.007]
              }
              centerKey={mapCenterKey}
              zoom={deliveryCoordinates ? 16 : 13}
              onLocationSelect={handleMapLocationSelect}
              onDragEnd={handleMapDragEnd}
              onOutOfBounds={handleMapOutOfBounds}
              markerColor={isWithinRange && addressStatus !== 'out_of_zone' ? 'red' : 'orange'}
            />
            {!deliveryCoordinates && (
              <div className="absolute inset-x-0 bottom-4 pointer-events-none flex justify-center z-[1000]">
                <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] px-4 py-2 rounded-full font-medium shadow-lg">
                  Mueve el mapa para fijar tu ubicación
                </span>
              </div>
            )}
            {locationSelected && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
                <div className="flex items-center gap-2 bg-green-500/90 px-3 py-1.5 rounded-full shadow-lg">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                  <span className="text-[10px] font-bold text-white">Ubicación confirmada</span>
                </div>
              </div>
            )}
          </div>

          {/* Form + Summary */}
          <form id="checkout-form" onSubmit={handleSubmit} className="max-w-lg mx-auto p-4 sm:p-6 space-y-5">
            {/* GPS button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={handleGetUserLocation}
              disabled={isLocating}
              className="w-full py-4 bg-secondary-vibrant/10 border border-secondary-vibrant/30 rounded-[20px] text-[11px] font-bold uppercase tracking-[0.2em] text-secondary-vibrant hover:bg-secondary-vibrant/15 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('cart.locating') || 'Localizando...'}
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" /> {t('cart.useLocation') || 'Usar mi ubicación actual'}
                </>
              )}
            </motion.button>

            {/* Address input */}
            <div className="relative">
              <div className="absolute left-4 top-4 text-zinc-400">
                <MapPin className="w-4 h-4" />
              </div>
              {statusDotClass && (
                <div className="absolute right-4 top-4">
                  <div className={`address-status-dot ${statusDotClass}`} />
                </div>
              )}
              <textarea
                ref={addressInputRef}
                required
                placeholder={t('cart.address') + ' (escribe para buscar)'}
                aria-describedby={formErrors.address ? 'address-error' : undefined}
                aria-invalid={formErrors.address ? 'true' : 'false'}
                className={`w-full pl-12 pr-10 py-4 bg-dark-surface border-2 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-500 min-h-[90px] resize-none ${
                  formErrors.address ? 'border-red-500/50' : 'border-white/10'
                }`}
                value={formData.address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onBlur={handleAddressBlur}
              />
              {(isLoadingAddress || addressStatus === 'gps_pending') && (
                <div className="absolute right-10 top-4 flex items-center gap-2 bg-primary-vibrant/10 px-3 py-1 rounded-full">
                  <Loader2 className="w-3 h-3 text-primary-vibrant animate-spin" />
                  <span className="text-[10px] font-medium text-primary-vibrant">
                    {addressStatus === 'gps_pending' ? 'GPS...' : 'Buscando...'}
                  </span>
                </div>
              )}
              {formErrors.address && (
                <span id="address-error" className="absolute -bottom-5 left-0 text-[10px] text-red-400" role="alert">
                  {formErrors.address}
                </span>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-dark-surface border border-white/10 rounded-[20px] mt-2 shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.place_id}
                      type="button"
                      onClick={() => handleAddressSelect(s)}
                      className="block w-full text-left p-4 text-[11px] hover:bg-white/5 border-b border-white/5 font-medium truncate text-zinc-300 transition-colors duration-200"
                    >
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
              {showSuggestions && suggestions.length === 0 && !isLoadingAddress && formData.address.length > 3 && (
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

            {/* Distance card */}
            {calculatedDistance !== null && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`p-4 rounded-2xl border-2 ${
                  isWithinRange ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
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

            {/* Name */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                <User className="w-4 h-4" />
              </div>
              <input
                required
                placeholder={t('cart.fullName')}
                aria-describedby={formErrors.name ? 'name-error' : undefined}
                aria-invalid={formErrors.name ? 'true' : 'false'}
                className={`w-full pl-12 pr-4 py-4 bg-dark-surface border-2 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-500 ${
                  formErrors.name ? 'border-red-500/50' : 'border-white/10'
                }`}
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  validateField('name', e.target.value);
                }}
              />
              {formErrors.name && (
                <span id="name-error" className="absolute -bottom-5 left-0 text-[10px] text-red-400" role="alert">
                  {formErrors.name}
                </span>
              )}
            </div>

            {/* Phone */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                required
                type="tel"
                inputMode="numeric"
                pattern="[0-9+\-\s()]*"
                placeholder={t('cart.whatsapp')}
                aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                aria-invalid={formErrors.phone ? 'true' : 'false'}
                className={`w-full pl-12 pr-4 py-4 bg-dark-surface border-2 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-500 ${
                  formErrors.phone ? 'border-red-500/50' : 'border-white/10'
                }`}
                value={formData.phone}
                onChange={(e) => {
                  const filtered = e.target.value.replace(/[^0-9+\-\s()]/g, '');
                  setFormData({ ...formData, phone: filtered });
                  validateField('phone', filtered);
                }}
              />
              {formErrors.phone && (
                <span id="phone-error" className="absolute -bottom-5 left-0 text-[10px] text-red-400" role="alert">
                  {formErrors.phone}
                </span>
              )}
            </div>

            {/* Reference */}
            <input
              placeholder={t('cart.reference')}
              className="w-full px-6 py-4 bg-dark-surface border-2 border-white/10 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-500"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />

            {/* Order summary (read-only) */}
            <div className="p-5 bg-dark-surface text-white rounded-2xl space-y-3 relative overflow-hidden border-2 border-primary-vibrant/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 rounded-full blur-2xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary-vibrant/15 rounded-full blur-xl -ml-12 -mb-12" />

              <div className="space-y-1.5 pb-3 border-b-2 border-primary-vibrant/20">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary-vibrant">Resumen del Pedido</p>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-[11px] text-zinc-300">
                    <span className="truncate flex-1">{item.quantity}x {item.name}</span>
                    <span className="font-medium text-white">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

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

              <div className="flex justify-between items-end border-b-2 border-secondary-vibrant/20 pb-3">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-secondary-vibrant mb-0.5">{t('cart.orderTotal')}</span>
                  <span className="font-display text-2xl sm:text-3xl tracking-wider leading-none text-white">
                    ${finalTotal.toFixed(2)} <span className="text-[10px] text-zinc-400 ml-1 font-medium font-body">USD</span>
                  </span>
                  {(config.taxRate ?? 0) > 0 && (
                    <span className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">
                      {t('cart.includesTax')} ({((config.taxRate ?? 0) * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-secondary-vibrant uppercase tracking-widest">{t('cart.inBolivares')}</span>
                  <span className="font-display text-lg sm:text-xl text-secondary-vibrant tracking-wider">
                    {totalVES.toLocaleString(language === 'es' ? 'es-VE' : 'en-US', { minimumFractionDigits: 2 })}{' '}
                    <span className="text-[9px] font-body">Bs.</span>
                  </span>
                </div>
                <div className="bg-secondary-vibrant/10 px-3 py-1 rounded-full border border-secondary-vibrant/20">
                  <span className="text-[8px] text-secondary-vibrant font-bold uppercase">Tasa: {config.exchangeRate}</span>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={!isWithinRange}
              className={`w-full bg-[#25D366] text-white py-5 sm:py-6 rounded-[20px] font-display uppercase tracking-[0.2em] text-xs sm:text-[11px] shadow-[0_20px_50px_rgba(37,211,102,0.3)] transition-all duration-300 flex items-center justify-center gap-3 ${
                !isWithinRange ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {!isWithinRange ? t('cart.outOfCoverage') : (
                <>
                  <Send className="w-4 h-4" />
                  {t('cart.confirmWhatsApp')}
                </>
              )}
            </motion.button>
          </form>

          {/* Toast */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4" />
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
