import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  MapPin,
  Phone,
  Plus,
  Minus,
  X,
  ArrowRight,
  Navigation,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { CartItem, DeliveryType, CheckoutData, Location, AddressSuggestion } from '../../types';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapComponent } from './MapComponent';
import { useLanguage } from '../../context/LanguageContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { useDistanceCalculation } from '../../hooks/useDistanceCalculation';
import { fetchBcvRate, getRateSource } from '../../services/bcvRate';
import { OptimizedImage } from './OptimizedImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  location: Location;
  updateQuantity: (id: string, qty: number) => void;
  updateNotes: (id: string, notes: string) => void;
  removeFromCart: (id: string) => void;
  onCheckout: (data: CheckoutData) => void;
}

type AddressStatus = 'idle' | 'searching' | 'valid' | 'invalid' | 'out_of_zone' | 'gps_pending';

export function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  location,
  updateQuantity,
  updateNotes,
  removeFromCart,
  onCheckout,
}: CartDrawerProps) {
  const { config, updateConfig, findCustomer } = useRestaurant();
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
  const [step, setStep] = useState<'cart' | 'checkout' | 'payment'>('cart');
  const [deliveryType] = useState<DeliveryType>('Delivery');
  const [formData, setFormData] = useState({ name: '', phone: '', cedula: '', address: '', reference: '', notes: '' });
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [calculatedFee, setCalculatedFee] = useState<number>(0);
  const [isWithinRange, setIsWithinRange] = useState<boolean>(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState({ name: '', phone: '', cedula: '', address: '' });
  const [locationSelected, setLocationSelected] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [addressStatus, setAddressStatus] = useState<AddressStatus>('idle');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [mapCenterKey, setMapCenterKey] = useState(0);
    const [termsAccepted, setTermsAccepted] = useState(true);
    const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
    const [paymentPreviewUrl, setPaymentPreviewUrl] = useState<string | null>(null);

  // Keep ref in sync with state for use inside effects
  useEffect(() => { addressStatusRef.current = addressStatus; }, [addressStatus]);

  const addressInputRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressStatusRef = useRef<AddressStatus>('idle');

  // ── Load last address on mount ───────────────────────────────────────
  useEffect(() => {
    if (step !== 'checkout') return;
    const last = loadLastAddress();
    if (last) {
      setFormData((p) => ({ ...p, address: last.address }));
      setDeliveryCoordinates({ lat: last.lat, lng: last.lng });
      setAddressStatus('valid');

    }
  }, [step, loadLastAddress]);

  // ── Fetch BCV rate when cart opens (only if source is 'bcv') ─────────
  useEffect(() => {
    if (!isOpen || getRateSource() !== 'bcv') return;
    (async () => {
      try {
        const rate = await fetchBcvRate();
        if (rate !== null && rate !== config.exchangeRate) {
          await updateConfig({ exchangeRate: rate });
        }
        } catch { /* BCV rate fetch failed */ }
      })();
  }, [isOpen, updateConfig, config.exchangeRate]);

  // ── Auto GPS geolocation when checkout opens (once) ──────────────────
  const gpsAttempted = useRef(false);
  useEffect(() => {
    if (step !== 'checkout' || gpsAttempted.current) return;
    if (deliveryCoordinates) { gpsAttempted.current = true; return; }
    gpsAttempted.current = true;
    let aborted = false;
    (async () => {
      setAddressStatus('gps_pending');
      const loc = await autoGeolocate();
      if (aborted) return;
      if (loc) {
        setDeliveryCoordinates(loc);
        setMapCenterKey((k) => k + 1);
        const addr = await reverseGeocodeAddress(loc.lat, loc.lng);
        if (aborted) return;
        if (addr) {
          setFormData((p) => ({ ...p, address: addr }));
          setAddressStatus('valid');
          saveLastAddress(addr, loc.lat, loc.lng);
        }
      } else {
        setAddressStatus('idle');
      }
    })();
    return () => { aborted = true; };
  }, [step, deliveryCoordinates, autoGeolocate, reverseGeocodeAddress, saveLastAddress]);

  // ── Customer lookup by cédula ────────────────────────────────────────
  const cedulaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (cedulaTimerRef.current) clearTimeout(cedulaTimerRef.current);
    const cedula = formData.cedula;
    if (!cedula || cedula.length < 6) return;
    setIsLookingUpCustomer(true);
    cedulaTimerRef.current = setTimeout(async () => {
      try {
        const found = await findCustomer(cedula);
        if (found) {
          setFormData(p => ({ ...p, name: found.name, phone: found.phone }));
        }
      } catch { /* customer lookup failed */ }
      setIsLookingUpCustomer(false);
    }, 400);
    return () => { if (cedulaTimerRef.current) clearTimeout(cedulaTimerRef.current); };
  }, [formData.cedula, findCustomer]);

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
        await searchAddress(value, location.latitude, location.longitude);
        setShowSuggestions(true);
      }, 400);
    },
    [searchAddress, clearSuggestions, location.latitude, location.longitude],
  );

  // ── Suggestion selected ──────────────────────────────────────────────
  const handleAddressSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      // Cancel any pending blur timeout so the dropdown doesn't flicker
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);

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

    // Delay hiding suggestions so button clicks can register first
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
    }, 200);

    const addr = formData.address.trim();
    if (addr.length < 5 || deliveryCoordinates) return;

    setAddressStatus('searching');
    const result = await autoGeocode(addr, location.latitude, location.longitude);
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
  }, [formData.address, deliveryCoordinates, autoGeocode, saveLastAddress, location.latitude, location.longitude]);

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
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (deliveryType !== 'Delivery' || !deliveryCoordinates || !location.latitude || !location.longitude) {
      if (deliveryType !== 'Delivery') {
        setCalculatedFee(0);
        setCalculatedDistance(null);
        setIsWithinRange(true);
      } else {
        setCalculatedFee(config.deliveryFee ?? 0);
        setCalculatedDistance(null);
        setIsWithinRange(true);
      }
      return;
    }
    const ranges = config.distancePricing?.ranges ?? [];
    const maxDist = config.distancePricing?.maxDeliveryDistance ?? 20;

    // Quick Haversine check first
    const quick = calculateDistanceAndFee(
      location.latitude,
      location.longitude,
      deliveryCoordinates.lat,
      deliveryCoordinates.lng,
      ranges,
      maxDist,
    );
    setCalculatedDistance(quick.distance);
    setCalculatedFee(quick.deliveryFee);
    setIsWithinRange(quick.isWithinRange);

    if (!quick.isWithinRange) {
      setAddressError(tRef.current('cart.error.addressOutOfRange'));
      setAddressStatus('out_of_zone');
    } else {
      setAddressError(null);
      if (addressStatusRef.current !== 'searching' && addressStatusRef.current !== 'gps_pending') {
        setAddressStatus('valid');
      }
    }

    // Async road distance update with abort cleanup
    let aborted = false;
    (async () => {
      try {
        const roadKm = await getRoadDistanceCalc(
          location.latitude,
          location.longitude,
          deliveryCoordinates.lat,
          deliveryCoordinates.lng,
        );
        if (aborted) return;
        setCalculatedDistance(roadKm);
        const roadFee = calculateDistanceAndFee(
          location.latitude,
          location.longitude,
          deliveryCoordinates.lat,
          deliveryCoordinates.lng,
          ranges,
          maxDist,
        ).deliveryFee;
        setCalculatedFee(roadFee);
        setIsWithinRange(roadKm <= maxDist);
        if (roadKm > maxDist) {
          setAddressError(tRef.current('cart.error.addressOutOfRange'));
          setAddressStatus('out_of_zone');
        }
      } catch {
        // keep Haversine result
      }
    })();

    return () => { aborted = true; };
  }, [
    deliveryType,
    deliveryCoordinates,
    location,
    config,
    calculateDistanceAndFee,
    getRoadDistanceCalc,
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
  const finalTotal = total + calculatedFee;
  const totalVES = finalTotal * (config.exchangeRate ?? 1);

  // ── Submit ───────────────────────────────────────────────────────────
  const goToPayment = () => {
    const nameOk = validateField('name', formData.name);
    const phoneOk = validateField('phone', formData.phone);
    const cedulaOk = formData.cedula.length >= 7;
    if (!cedulaOk) setFormErrors(prev => ({ ...prev, cedula: 'Mínimo 7 dígitos' }));
    const addressOk = deliveryType === 'Pick-up' || validateField('address', formData.address);
    if (!nameOk || !phoneOk || !cedulaOk || !addressOk) return;
    if (deliveryType === 'Delivery') {
      if (!deliveryCoordinates) {
        setAddressError('Selecciona tu ubicación en el mapa');
        return;
      }
      if (!isWithinRange) {
        setAddressError(t('cart.error.addressOutOfRange'));
        return;
      }
    }
    setStep('payment');
  };

  const handleSubmit = async () => {
    const nameOk = validateField('name', formData.name);
    const phoneOk = validateField('phone', formData.phone);
    const cedulaOk = formData.cedula.length >= 7;
    if (!cedulaOk) setFormErrors(prev => ({ ...prev, cedula: 'Mínimo 7 dígitos' }));
    const addressOk = deliveryType === 'Pick-up' || validateField('address', formData.address);
    if (!nameOk || !phoneOk || !cedulaOk || !addressOk) return;
    if (!termsAccepted) return;
    if (deliveryType === 'Delivery') {
      if (!deliveryCoordinates) {
        setAddressError('Selecciona tu ubicación en el mapa');
        return;
      }
      if (!isWithinRange) {
        setAddressError(t('cart.error.addressOutOfRange'));
        return;
      }
      if (!paymentScreenshot) {
        setAddressError('Debe adjuntar un comprobante de pago móvil para pedidos a domicilio');
        return;
      }
    }
    let uploadedUrl: string | undefined;
    if (paymentScreenshot) {
      try {
        const { uploadImage } = await import('../../lib/uploadImage');
        uploadedUrl = await uploadImage(paymentScreenshot);
      } catch {
        setAddressError('Error al subir el comprobante. Intenta de nuevo.');
        return;
      }
    }
    onCheckout({
      ...formData,
      deliveryType,
      deliveryCoordinates: deliveryType === 'Delivery' ? deliveryCoordinates ?? undefined : undefined,
      calculatedDistance: deliveryType === 'Delivery' ? calculatedDistance ?? undefined : undefined,
      calculatedDeliveryFee: deliveryType === 'Delivery' ? calculatedFee : undefined,
      paymentScreenshot: uploadedUrl ? {
        filename: paymentScreenshot.name,
        previewUrl: paymentPreviewUrl || '',
        uploadedUrl
      } : undefined
    });
  };

  // ── Address status dot ───────────────────────────────────────────────
  const statusDotClass =
    addressStatus === 'valid'
      ? 'valid'
      : addressStatus === 'out_of_zone' || addressStatus === 'invalid'
        ? 'invalid'
        : addressStatus === 'searching' || addressStatus === 'gps_pending'
          ? 'pending'
          : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-50"
            id="cart-overlay"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 mx-auto bg-dark-card z-50 overflow-hidden flex flex-col h-full sm:max-h-[90vh] sm:rounded-t-[2rem] sm:max-w-lg"
            id="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b-2 border-primary-vibrant/20 bg-dark-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 rounded-full blur-xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary-vibrant/15 rounded-full blur-lg -ml-12 -mb-12" />
              <div className="flex items-center justify-between relative z-10">
                <h2 className="font-display text-xl sm:text-2xl tracking-wider flex items-center gap-3 text-white">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-vibrant to-secondary-vibrant rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {step === 'cart' ? t('cart.title') : step === 'checkout' ? t('cart.checkout') : 'Pago'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 bg-white/10 hover:bg-primary-vibrant rounded-xl transition-all duration-300 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-vibrant"
                  aria-label="Cerrar carrito"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              {/* Step indicators */}
              <div className="flex items-center gap-2 mt-4 relative z-10">
                {['Carrito', 'Envío', 'Pago'].map((label, i) => {
                  const isActive = (i === 0 && step === 'cart') || (i === 1 && step === 'checkout') || (i === 2 && step === 'payment');
                  const isDone = (i === 0 && (step === 'checkout' || step === 'payment')) || (i === 1 && step === 'payment');
                  return (
                    <div key={label} className="flex items-center gap-2 flex-1">
                      <div className={`flex items-center gap-2 ${!isActive && !isDone ? 'opacity-30' : ''}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                          isActive ? 'bg-primary-vibrant text-white shadow-lg shadow-primary-vibrant/30' :
                          isDone ? 'bg-green-500 text-white' : 'bg-white/10 text-zinc-500'
                        }`}>{isDone ? <span>✓</span> : i + 1}</div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          isActive ? 'text-white' : 'text-zinc-500'
                        }`}>{label}</span>
                      </div>
                      {i < 2 && <div className="flex-1 h-px bg-white/10 mx-1" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 bg-dark-card scroll-smooth pb-32 sm:pb-40">
              {step === 'cart' ? (
                <>
                  {items.length === 0 ? (
                    <div className="py-24 text-center space-y-6">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="w-24 h-24 bg-primary-vibrant/10 rounded-2xl flex items-center justify-center mx-auto border border-primary-vibrant/20"
                      >
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
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={item.id}
                          className="flex gap-3 bg-dark-card p-4 rounded-xl border border-white/10 group hover:border-primary-vibrant/20 transition-colors duration-300"
                        >
                          <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-white/10">
                            <OptimizedImage src={item.image} alt={item.name} className="w-full h-full p-1" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-bold text-sm text-white uppercase tracking-wider truncate">{item.name}</h3>
                              <p className="font-display text-secondary-vibrant text-sm tracking-wider">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            {item.selectedChoices && item.selectedChoices.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="text-[9px] font-bold bg-white/5 text-zinc-400 px-2 py-0.5 rounded-md border border-white/5">
                                  {item.selectedChoices.join(', ')}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1.5 bg-white/10 rounded-xl p-1 border border-white/10">
                                <motion.button
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-11 h-11 bg-white/10 hover:bg-white/15 rounded-lg flex items-center justify-center text-zinc-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-vibrant focus:ring-offset-1 focus:ring-offset-dark"
                                  aria-label={`Decrease quantity of ${item.name}`}
                                >
                                  <Minus className="w-4 h-4" />
                                </motion.button>
                                <span className="w-7 text-center font-bold text-sm text-white">{item.quantity}</span>
                                <motion.button
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-11 h-11 bg-primary-vibrant text-white rounded-lg flex items-center justify-center shadow-lg shadow-primary-vibrant/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-1 focus:ring-offset-primary-vibrant"
                                  aria-label={`Increase quantity of ${item.name}`}
                                >
                                  <Plus className="w-4 h-4" />
                                </motion.button>
                              </div>
                              <motion.button
                                whileTap={{ scale: 0.8 }}
                                onClick={() => removeFromCart(item.id)}
                                className="w-11 h-11 bg-white/5 hover:bg-red-500/10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors duration-200 border border-white/5 hover:border-red-500/20"
                                aria-label={`Remove ${item.name}`}
                              >
                                <X className="w-4 h-4" />
                              </motion.button>
                              <div className="flex-1 ml-3 relative">
                                <textarea
                                  placeholder={t('cart.specialInstructions') + ' (ej: sin picante)'}
                                  aria-label={t('cart.specialInstructions')}
                                  value={item.notes}
                                  onChange={(e) => updateNotes(item.id, e.target.value)}
                                  className="w-full text-xs bg-white/5 border border-white/5 rounded-lg px-3 py-2 focus:border-primary-vibrant/50 outline-none transition-colors duration-200 resize-none min-h-[32px] text-zinc-300 placeholder:text-zinc-600"
                                  rows={1}
                                  maxLength={100}
                                />
                                {item.notes && <span className="absolute -bottom-4 right-0 text-[8px] text-zinc-600">{item.notes.length}/100</span>}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              ) : step === 'checkout' ? (
                <form id="checkout-form" className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-5 font-body">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4">
                        {/* Cédula */}
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-bold">
                            V-
                          </div>
                          <input
                            required
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={8}
                            placeholder="Cédula de identidad (auto-buscar)"
                            aria-describedby={formErrors.cedula ? 'cedula-error' : undefined}
                            aria-invalid={formErrors.cedula ? 'true' : 'false'}
                            className={`w-full pl-12 pr-12 py-4 bg-dark-surface border-2 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-500 ${
                              formErrors.cedula ? 'border-red-500/50' : 'border-white/10'
                            }`}
                            value={formData.cedula}
                            onChange={(e) => {
                              const filtered = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
                              setFormData({ ...formData, cedula: filtered });
                              if (filtered.length < 7) {
                                setFormErrors(prev => ({ ...prev, cedula: 'Mínimo 7 dígitos' }));
                              } else {
                                setFormErrors(prev => ({ ...prev, cedula: '' }));
                              }
                            }}
                          />
                          {isLookingUpCustomer && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 text-primary-vibrant animate-spin" />
                            </div>
                          )}
                          {formErrors.cedula && (
                            <span id="cedula-error" className="absolute -bottom-5 left-0 text-[10px] text-red-400" role="alert">
                              {formErrors.cedula}
                            </span>
                          )}
                        </div>

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

                        {/* Delivery fields */}
                        {deliveryType === 'Delivery' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                            {/* GPS button */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
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

                            {/* Address input with status dot + autocomplete */}
                            <div className="relative">
                              <div className="absolute left-4 top-4 text-zinc-400">
                                <MapPin className="w-4 h-4" />
                              </div>

                              {/* Status dot */}
                              {statusDotClass && (
                                <div className="absolute right-4 top-4">
                                  <div className={`address-status-dot ${statusDotClass}`} title={
                                    addressStatus === 'valid' ? 'Dirección válida' :
                                    addressStatus === 'out_of_zone' ? 'Fuera de zona de entrega' :
                                    addressStatus === 'invalid' ? 'Dirección no encontrada' :
                                    'Buscando...'
                                  } />
                                </div>
                              )}

                              <textarea
                                ref={addressInputRef}
                                required
                                placeholder={t('cart.address') + ' (escribe para buscar)'}
                                aria-describedby={formErrors.address ? 'address-error' : undefined}
                                aria-invalid={formErrors.address ? 'true' : 'false'}
                                className={`w-full pl-12 pr-10 py-4 bg-dark-surface border-2 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-500 min-h-[100px] resize-none ${
                                  formErrors.address ? 'border-red-500/50' : 'border-white/10'
                                }`}
                                value={formData.address}
                                onChange={(e) => handleAddressChange(e.target.value)}
                                onBlur={handleAddressBlur}
                              />

                              {/* Loading spinner inside input */}
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

                              {/* Autocomplete dropdown */}
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

                              {/* No results — helpful message */}
                              {showSuggestions && suggestions.length === 0 && !isLoadingAddress && formData.address.length > 3 && (
                                <div className="absolute z-10 w-full bg-dark-surface border border-white/10 rounded-[20px] mt-2 shadow-2xl p-5">
                                  <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-10 h-10 bg-primary-vibrant/10 rounded-xl flex items-center justify-center">
                                      <MapPin className="w-5 h-5 text-primary-vibrant" />
                                    </div>
                                    <div>
                                      <p className="text-[11px] font-bold text-zinc-300 mb-1">No encontramos tu dirección</p>
                                      <p className="text-[10px] text-zinc-500">Arrastra el mapa para fijar tu ubicación exacta</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {addressError && (
                                <div className="absolute -bottom-6 left-0 text-red-400 text-[10px] font-medium flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> {addressError}
                                </div>
                              )}
                            </div>

                            {/* Reference */}
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-primary-vibrant" />
                                Referencia de entrega
                              </label>
                              <input
                                placeholder="Ej: frente al Mercado XYZ, al lado de la farmacia..."
                                className="w-full px-5 py-3.5 bg-dark-surface border-2 border-white/10 rounded-[20px] focus:border-primary-vibrant/50 outline-none transition-all duration-300 text-sm font-medium text-white placeholder:text-zinc-600"
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                              />
                            </div>

                            {/* Embedded map */}
                            {deliveryType === 'Delivery' && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-3 p-4 bg-dark-surface rounded-2xl border border-white/5"
                              >
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-primary-vibrant" />
                                  <span className="text-xs font-bold text-zinc-300">Ubicación de entrega</span>
                                </div>
                                <div className="w-full h-56 sm:h-64 rounded-xl overflow-hidden border border-white/10 relative z-0">
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
                                </div>
                                {deliveryCoordinates && (
                                  <p className="text-[10px] text-zinc-600 text-center font-medium">
                                    Coordenadas: {deliveryCoordinates.lat.toFixed(5)}, {deliveryCoordinates.lng.toFixed(5)}
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 pt-2">
                  {/* Order summary */}
                  <div className="p-5 bg-dark-surface text-white rounded-xl space-y-3 relative overflow-hidden border-2 border-primary-vibrant/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 rounded-full blur-2xl -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary-vibrant/15 rounded-full blur-xl -ml-12 -mb-12" />
                    {items.length > 0 && (
                      <div className="space-y-1.5 pb-3 border-b-2 border-primary-vibrant/20">
                        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary-vibrant">Resumen del Pedido</p>
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-[11px] text-zinc-300">
                            <span className="truncate flex-1">{item.quantity}x {item.name}
                              {item.selectedChoices && item.selectedChoices.length > 0 && (
                                <span className="text-zinc-500 font-normal"> — {item.selectedChoices.join(', ')}</span>
                              )}
                            </span>
                            <span className="font-medium text-white">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {deliveryType === 'Delivery' && (
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                        <span>{t('cart.shipping')}</span>
                        <span className="text-secondary-vibrant">${calculatedFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end border-b-2 border-secondary-vibrant/20 pb-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-secondary-vibrant mb-0.5">{t('cart.orderTotal')}</span>
                        <span className="font-display text-2xl sm:text-3xl tracking-wider leading-none text-white">
                          ${finalTotal.toFixed(2)} <span className="text-[10px] text-zinc-400 ml-1 font-medium font-body">USD</span>
                        </span>
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

                  {deliveryType === 'Delivery' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-primary-vibrant" />
                          Comprobante de Pago Móvil
                        </label>
                        <div className="p-4 bg-dark-surface border-2 border-white/10 rounded-[20px] space-y-3">
                          <div className="p-3 bg-primary-vibrant/10 rounded-lg border border-primary-vibrant/20">
                            <p className="text-[10px] font-bold text-primary-vibrant uppercase tracking-wider mb-2">Datos de Pago Móvil</p>
                            <div className="space-y-3 text-[10px] text-zinc-300 font-mono">
                              {(config.pagoMovil || []).map(pm => (
                                <div key={pm.id} className="border-b border-primary-vibrant/10 pb-2 last:border-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-primary-vibrant font-bold text-[11px]">{pm.bank}</p>
                                    <button
                                      type="button"
                                      onClick={() => { navigator.clipboard.writeText(pm.bank); }}
                                      className="text-zinc-500 hover:text-primary-vibrant transition-colors p-1"
                                      title="Copiar banco"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 mt-1">
                                    <p><span className="text-zinc-500">Teléfono:</span> {pm.phone}</p>
                                    <button
                                      type="button"
                                      onClick={() => { navigator.clipboard.writeText(pm.phone); }}
                                      className="text-zinc-500 hover:text-primary-vibrant transition-colors p-1"
                                      title="Copiar teléfono"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {pm.rifCedula && (
                                    <div className="flex items-center justify-between gap-2 mt-1">
                                      <p><span className="text-zinc-500">RIF/Cédula:</span> {pm.rifCedula}</p>
                                      <button
                                        type="button"
                                        onClick={() => { navigator.clipboard.writeText(pm.rifCedula!); }}
                                        className="text-zinc-500 hover:text-primary-vibrant transition-colors p-1"
                                        title="Copiar RIF/Cédula"
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  {pm.qrImage && (
                                    <img src={pm.qrImage} alt="QR" className="w-16 h-16 mt-2 rounded-lg border border-primary-vibrant/20" />
                                  )}
                                </div>
                              ))}
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <p className="font-bold text-white"><span className="text-zinc-500 font-normal">Monto a transferir:</span> ${finalTotal.toFixed(2)} USD</p>
                                <button
                                  type="button"
                                  onClick={() => { navigator.clipboard.writeText(`${finalTotal.toFixed(2)} USD`); }}
                                  className="text-zinc-500 hover:text-primary-vibrant transition-colors p-1"
                                  title="Copiar monto"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  setPaymentPreviewUrl(url);
                                  setPaymentScreenshot(file);
                                }
                              }}
                              className="hidden"
                              id="payment-screenshot"
                            />
                            <label
                              htmlFor="payment-screenshot"
                              className="flex flex-col items-center justify-center w-full p-4 bg-white/5 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-primary-vibrant/50 transition-colors duration-200"
                            >
                              {paymentPreviewUrl ? (
                                <div className="relative w-full">
                                  <img src={paymentPreviewUrl} alt="Capture de pago" className="w-full h-32 object-cover rounded-lg mb-2" />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPaymentPreviewUrl(null);
                                      setPaymentScreenshot(null);
                                    }}
                                    className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="w-12 h-12 bg-primary-vibrant/10 rounded-xl flex items-center justify-center mb-2">
                                    <svg className="w-6 h-6 text-primary-vibrant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 112.828 2.828L6 18h2a2 2 0 002-2zM14 6l3 3m-3-3V3m0 0l-3 3m3-3l3-3" />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[11px] font-medium text-zinc-300">
                                      <span className="text-primary-vibrant">Click para subir</span> captura de pago
                                    </p>
                                    <p className="text-[9px] text-zinc-500 mt-1">PNG, JPG (recomendado: 800x600)</p>
                                  </div>
                                </>
                              )}
                            </label>
                          </div>
                          {!paymentPreviewUrl && (
                            <div className="text-center py-2">
                              <p className="text-[9px] text-zinc-600 italic">
                                Adjunte captura de pantalla del comprobante de pago móvil
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <label className="flex items-center gap-2 justify-center cursor-pointer py-2">
                    <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-primary-vibrant focus:ring-primary-vibrant/50 accent-primary-vibrant" />
                    <span className="text-[10px] text-zinc-500">
                      Acepto los{' '}
                      <Link to="/legal" className="underline hover:text-white transition-colors">{t('legal.terms.title')}</Link>
                      {' '}&{' '}
                      <Link to="/legal#privacidad" className="underline hover:text-white transition-colors">{t('legal.privacy.title')}</Link>
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Full-screen map modal */}
            <AnimatePresence>
              {isMapOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] bg-black/70 p-6 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className={`bg-dark-card p-8 rounded-2xl w-full max-w-lg space-y-6 transition-all duration-500 ${
                      locationSelected ? 'border-2 border-green-500/30' : 'border border-white/5'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <h3 className="font-display text-xl tracking-wider text-white">{t('cart.mapTitle')}</h3>
                      <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-zinc-500">{t('cart.mapTagline')}</p>
                      {locationSelected && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20"
                        >
                          <CheckCircle2 className="w-3 h-3 text-green-400" />
                          <span className="text-[10px] font-medium text-green-400">Ubicación confirmada</span>
                        </motion.div>
                      )}
                    </div>
                    <div className="rounded-xl overflow-hidden border border-white/10">
                      <MapComponent
                        center={
                          location.latitude && location.longitude
                            ? [location.latitude, location.longitude]
                            : [10.162, -68.007]
                        }
                        centerKey={mapCenterKey}
                        onLocationSelect={handleMapLocationSelect}
                        onDragEnd={handleMapDragEnd}
                        onOutOfBounds={handleMapOutOfBounds}
                        markerColor="red"
                      />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setIsMapOpen(false)}
                      className="w-full bg-white/5 text-white py-5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all duration-300 border border-white/5"
                    >
                      {t('cart.closeMap')}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 sm:p-6 bg-dark-card border-t-2 border-secondary-vibrant/30 space-y-4">
                {step !== 'checkout' && (
                  <div className="p-5 bg-dark-surface text-white rounded-xl space-y-3 relative overflow-hidden border-2 border-primary-vibrant/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 rounded-full blur-2xl -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary-vibrant/15 rounded-full blur-xl -ml-12 -mb-12" />

                  {items.length > 0 && (
                    <div className="space-y-1.5 pb-3 border-b-2 border-primary-vibrant/20">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-primary-vibrant">Resumen del Pedido</p>
                      {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-[11px] text-zinc-300">
                          <span className="truncate flex-1">{item.quantity}x {item.name}
                            {item.selectedChoices && item.selectedChoices.length > 0 && (
                              <span className="text-zinc-500 font-normal"> — {item.selectedChoices.join(', ')}</span>
                            )}
                          </span>
                          <span className="font-medium text-white">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-end border-b-2 border-secondary-vibrant/20 pb-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-secondary-vibrant mb-0.5">{t('cart.orderTotal')}</span>
                      <span className="font-display text-2xl sm:text-3xl tracking-wider leading-none text-white">
                        ${finalTotal.toFixed(2)} <span className="text-[10px] text-zinc-400 ml-1 font-medium font-body">USD</span>
                      </span>
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
                )}

                {step === 'cart' ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep('checkout')}
                    className="w-full vibrant-gradient text-white py-5 sm:py-6 rounded-[20px] font-display uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(203,32,39,0.3)] transition-all duration-300 hover:shadow-[0_20px_60px_rgba(203,32,39,0.5)]"
                  >
                    {t('cart.continue')} <ArrowRight className="w-5 h-5" />
                  </motion.button>
                ) : step === 'checkout' ? (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStep('cart')}
                      className="w-full sm:flex-1 bg-white/5 text-zinc-400 py-5 sm:py-6 rounded-[20px] font-display uppercase tracking-widest text-xs sm:text-[11px] transition-all duration-300 hover:bg-white/10 border border-white/5"
                    >
                      {t('cart.back')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={goToPayment}
                      className="w-full sm:flex-[2] vibrant-gradient text-white py-5 sm:py-6 rounded-[20px] font-display uppercase tracking-[0.2em] text-xs sm:text-[11px] shadow-[0_20px_50px_rgba(203,32,39,0.3)] transition-all duration-300 flex items-center justify-center gap-3"
                    >
                      Continuar <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStep('checkout')}
                      className="w-full sm:flex-1 bg-white/5 text-zinc-400 py-5 sm:py-6 rounded-[20px] font-display uppercase tracking-widest text-xs sm:text-[11px] transition-all duration-300 hover:bg-white/10 border border-white/5"
                    >
                      {t('cart.back')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSubmit}
                      disabled={deliveryType === 'Delivery' && !isWithinRange}
                      className={`w-full sm:flex-[2] bg-[#25D366] text-white py-5 sm:py-6 rounded-[20px] font-display uppercase tracking-[0.2em] text-xs sm:text-[11px] shadow-[0_20px_50px_rgba(37,211,102,0.3)] transition-all duration-300 flex items-center justify-center gap-3 ${
                        deliveryType === 'Delivery' && !isWithinRange ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {deliveryType === 'Delivery' && !isWithinRange ? t('cart.outOfCoverage') : t('cart.confirmWhatsApp')}
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Toast notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.95 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4" />
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
