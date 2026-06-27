
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
  isActive: boolean;
  isOpen: boolean;
  latitude?: number;
  longitude?: number;
  adminEmail?: string;
  adminPassword?: string;
  discontinuedProductIds?: string[];
}

export interface ProductChoice {
  name: string;
  priceAdjust?: number;
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
  code?: string;
  choices?: ProductChoice[];
  maxSelections?: number;
}

export interface CartItem extends Product {
  quantity: number;
  notes?: string;
  selectedChoices?: string[];
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
export type OrderStatus = 'exitoso' | 'cancelado';

export interface CheckoutData {
  name: string;
  phone: string;
  cedula?: string;
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
  selectedChoices?: string[];
}

export interface Cashier {
  id: string;
  name: string;
  email: string;
  employee_id?: string;
  location_id?: string;
  pin?: string;
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
  payment_method?: PaymentMethod;
  change_amount?: number;
  cashier_id?: string;
  created_at: string;
}

export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'QR' | 'Otro';

export interface POSCartItem {
  product: Product;
  quantity: number;
  notes?: string;
  selectedChoices?: string[];
}
