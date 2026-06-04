
export interface RestaurantConfig {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  aboutUs?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  featuredProductIds?: string[];
  taxRate: number;
  deliveryFee: number;
  exchangeRate: number;
  deliveryZones: { id: string; name: string; fee: number; }[];
  distancePricing: {
    ranges: { maxDistance: number | null; fee: number; }[];
    maxDeliveryDistance: number;
  };
}

export interface Location {
  id: string;
  name: string;
  whatsapp: string;
  schedule: string;
  address: string;
  image: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  deliveryFee: number;
  taxRate: number;
  exchangeRate: number;
  deliveryZones: { id: string; name: string; fee: number; }[];
  latitude?: number; // Coordenada geográfica de la sede
  longitude?: number; // Coordenada geográfica de la sede
  adminEmail?: string; // Para vincular un admin a esta sede
  adminPassword?: string;
  discontinuedProductIds?: string[]; // Para que la sede oculte platos globales
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  inStock: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export type DeliveryType = 'Delivery' | 'Pick-up';

export interface AddressSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: string[];
}

export interface CheckoutData {
  name: string;
  phone: string;
  address?: string;
  reference?: string; // <-- New field
  selectedZone?: { id: string; name: string; fee: number; }; // <-- Added
  deliveryCoordinates?: { lat: number; lng: number }; // <-- Nueva coordenada de entrega
  calculatedDistance?: number; // <-- Distancia calculada en km
  calculatedDeliveryFee?: number; // <-- Tarifa calculada
  deliveryType: DeliveryType;
  notes: string;
}
