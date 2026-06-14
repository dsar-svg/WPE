
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
  latitude?: number;
  longitude?: number;
  adminEmail?: string;
  adminPassword?: string;
  discontinuedProductIds?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  inStock: boolean;
  order: number;
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

export interface AddressSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: string[];
}

export type DeliveryType = 'Delivery' | 'Pick-up';
export type OrderStatus = 'pending' | 'cancelled';

export interface CheckoutData {
  name: string;
  phone: string;
  address?: string;
  reference?: string;
  deliveryType?: DeliveryType;
  deliveryCoordinates?: { lat: number; lng: number };
  calculatedDistance?: number;
  calculatedDeliveryFee?: number;
  notes: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  location_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_type: DeliveryType;
  delivery_address?: string;
  delivery_coordinates?: { lat: number; lng: number };
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string;
  status: OrderStatus;
  created_at: string;
}
