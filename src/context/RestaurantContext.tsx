import { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Location, Product, RestaurantConfig, Category, Order } from '../types';

interface RestaurantContextType {
  locations: Location[];
  menuItems: Product[];
  categories: Category[];
  config: RestaurantConfig;
  orders: Order[];
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLocalAdmin: boolean;
  managedLocationId: string | null;
  userEmail: string | null;
  selectedLocation: Location | null;
  setSelectedLocation: (loc: Location | null) => void;
  updateLocation: (loc: any) => Promise<void>;
  updateProduct: (prod: any) => Promise<void>;
  updateConfig: (config: any) => Promise<void>;
  updateCategory: (cat: any) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  createOrder: (order: Omit<Order, 'id' | 'created_at'>) => Promise<void>;
  fetchOrders: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const DEFAULT_CONFIG: RestaurantConfig = {
  id: 'main',
  name: 'Wallace Panda Express',
  logo: '',
  primaryColor: '#d92323',
  secondaryColor: '#ffc400',
  aboutUs: '',
  socialMedia: {},
  featuredProductIds: [],
  taxRate: 0.16,
  deliveryFee: 2.00,
  exchangeRate: 1.00,
  distancePricing: {
    ranges: [
      { maxDistance: 5, fee: 3.00 },
      { maxDistance: 10, fee: 5.00 },
      { maxDistance: 15, fee: 7.00 },
      { maxDistance: 20, fee: 9.00 },
    ],
    maxDeliveryDistance: 20,
  },
};

function computeIsOpen(row: any): boolean {
  if (!row.is_open) return false;
  if (!row.open_time || !row.close_time) return row.is_open;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = row.open_time.split(':').map(Number);
  const [ch, cm] = row.close_time.split(':').map(Number);
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  return close < open ? cur >= open || cur < close : cur >= open && cur < close;
}

function rowToLocation(row: any): Location {
  return {
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    schedule: row.schedule,
    address: row.address,
    image: row.image,
    openTime: row.open_time,
    closeTime: row.close_time,
    isOpen: computeIsOpen(row),
    latitude: row.latitude,
    longitude: row.longitude,
    adminEmail: row.admin_email,
    discontinuedProductIds: row.discontinued_product_ids || [],
  };
}

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    image: row.image,
    inStock: row.in_stock,
    order: row.sort_order,
  };
}

function rowToCategory(row: any): Category {
  return { id: row.id, name: row.name, order: row.sort_order };
}

function rowToOrder(row: any): Order {
  return {
    id: row.id,
    location_id: row.location_id,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    delivery_type: row.delivery_type as Order['delivery_type'],
    delivery_address: row.delivery_address,
    delivery_coordinates: row.delivery_coordinates,
    items: row.items,
    subtotal: row.subtotal,
    delivery_fee: row.delivery_fee,
    total: row.total,
    notes: row.notes || '',
    status: (row.status || 'pending') as Order['status'],
    created_at: row.created_at,
  };
}

function parsePgArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === 'string' && val.length > 0) {
    return val.replace(/[{}"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function rowToConfig(row: any): RestaurantConfig {
  const logoUrl = row.logo || '';
  return {
    id: 'main',
    name: row.name,
    logo: logoUrl.includes('wikipedia') ? '' : logoUrl,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    aboutUs: row.about_us,
    socialMedia: row.social_media || {},
    featuredProductIds: parsePgArray(row.featured_product_ids),
    taxRate: row.tax_rate,
    deliveryFee: row.delivery_fee,
    exchangeRate: row.exchange_rate,
    distancePricing: row.distance_pricing || DEFAULT_CONFIG.distancePricing,
  };
}

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [sessionReady, setSessionReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
      setSessionReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const locQuery = useQuery({
    queryKey: ['locations'],
    queryFn: async () => { const { data } = await supabase.from('locations').select('*'); return data || []; },
    staleTime: 3600000,
  });
  const menuQuery = useQuery({
    queryKey: ['menu_items'],
    queryFn: async () => { const { data } = await supabase.from('menu_items').select('*').order('sort_order', { ascending: true }); return data || []; },
    staleTime: 3600000,
  });
  const catQuery = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true }); return data || []; },
    staleTime: 3600000,
  });
  const configQuery = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const { data } = await supabase.from('config').select('*').limit(1).maybeSingle();
      return data || null;
    },
    staleTime: 3600000,
  });
  const adminsQuery = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const { data } = await supabase.from('admins').select('email');
      return new Set((data || []).map(a => a.email));
    },
    staleTime: 3600000,
  });

  const dataFetched = locQuery.isFetched && menuQuery.isFetched && catQuery.isFetched && configQuery.isFetched && adminsQuery.isFetched;
  const locationRows = locQuery.data || [];
  const menuItemRows = menuQuery.data || [];
  const categoryRows = catQuery.data || [];
  const configRow = configQuery.data || null;
  const adminEmails = adminsQuery.data || new Set<string>();

  const locations = useMemo(() => locationRows.map(rowToLocation), [locationRows]);
  const menuItems = useMemo(() => menuItemRows.map(rowToProduct), [menuItemRows]);
  const categories = useMemo(() => categoryRows.map(rowToCategory), [categoryRows]);
  const menuItemIds = useMemo(() => new Set(menuItems.map(m => m.id)), [menuItems]);
  const rawConfig = useMemo(() => configRow ? { ...DEFAULT_CONFIG, ...rowToConfig(configRow) } : DEFAULT_CONFIG, [configRow]);
  const config: RestaurantConfig = useMemo(() => ({
    ...rawConfig,
    featuredProductIds: rawConfig.featuredProductIds?.filter(id => menuItemIds.has(id)) || []
  }), [rawConfig, menuItemIds]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);
  const [managedLocationId, setManagedLocationId] = useState<string | null>(null);

  useEffect(() => {
    if (userEmail) {
      const isSuper = adminEmails.has(userEmail);
      const localLoc = locations.find(l => l.adminEmail === userEmail);
      setIsSuperAdmin(isSuper);
      setIsLocalAdmin(!!localLoc);
      setIsAdmin(isSuper || !!localLoc);
      setManagedLocationId(localLoc?.id || null);
    } else {
      setIsAdmin(false); setIsSuperAdmin(false); setIsLocalAdmin(false); setManagedLocationId(null);
    }
  }, [userEmail, locations, adminEmails]);

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
      return (data || []).map(rowToOrder);
    },
    staleTime: 30000,
    enabled: isAdmin,
  });
  const rawOrders = ordersQuery.data || [];
  const orders = useMemo(() => {
    if (isSuperAdmin) return rawOrders;
    if (isLocalAdmin && managedLocationId) return rawOrders.filter(o => o.location_id === managedLocationId);
    return rawOrders;
  }, [rawOrders, isSuperAdmin, isLocalAdmin, managedLocationId]);

  useEffect(() => {
    if (configRow !== null) {
      document.title = config.name;
      if (config.primaryColor) document.documentElement.style.setProperty('--color-primary-vibrant', config.primaryColor);
      if (config.secondaryColor) document.documentElement.style.setProperty('--color-secondary-vibrant', config.secondaryColor);
      const favicon = document.getElementById('favicon') as HTMLLinkElement;
      if (favicon && config.logo) favicon.href = config.logo;
    }
  }, [configRow, config.name, config.logo, config.primaryColor, config.secondaryColor]);

  useEffect(() => {
    if (dataFetched && locations.length > 0 && !selectedLocation) {
      const params = new URLSearchParams(window.location.search);
      const sedeId = params.get('sede') || params.get('location');
      if (sedeId) { const found = locations.find(l => l.id === sedeId); if (found) setSelectedLocation(found); }
    }
  }, [dataFetched, locations, selectedLocation]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    let isSuper = adminEmails.has(email);
    const localLoc = locations.find(l => l.adminEmail === email);
    if (!isSuper && !localLoc) {
      const fresh = await queryClient.fetchQuery({
        queryKey: ['admins'],
        queryFn: async () => {
          const { data } = await supabase.from('admins').select('email');
          return new Set((data || []).map(a => a.email));
        },
      });
      isSuper = fresh.has(email);
    }
    if (!isSuper && !localLoc) { await supabase.auth.signOut(); throw new Error('no_admin'); }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const invalidate = useCallback((key: string[]) => queryClient.invalidateQueries({ queryKey: key }), [queryClient]);

  const updateConfig = useCallback(async (newConfig: any) => {
    const dbRow: Record<string, any> = {};
    if (newConfig.name !== undefined) dbRow.name = newConfig.name;
    if (newConfig.logo !== undefined) dbRow.logo = newConfig.logo;
    if (newConfig.primaryColor !== undefined) dbRow.primary_color = newConfig.primaryColor;
    if (newConfig.secondaryColor !== undefined) dbRow.secondary_color = newConfig.secondaryColor;
    if (newConfig.aboutUs !== undefined) dbRow.about_us = newConfig.aboutUs;
    if (newConfig.socialMedia !== undefined) dbRow.social_media = newConfig.socialMedia;
    if (newConfig.featuredProductIds !== undefined) dbRow.featured_product_ids = newConfig.featuredProductIds;
    if (newConfig.taxRate !== undefined) dbRow.tax_rate = newConfig.taxRate;
    if (newConfig.deliveryFee !== undefined) dbRow.delivery_fee = newConfig.deliveryFee;
    if (newConfig.exchangeRate !== undefined) dbRow.exchange_rate = newConfig.exchangeRate;
    if (newConfig.distancePricing !== undefined) dbRow.distance_pricing = newConfig.distancePricing;
    const { error } = await supabase.from('config').update(dbRow).eq('id', 1);
    if (error) throw error;
    invalidate(['config']);
  }, [invalidate]);

  const updateCategory = useCallback(async (cat: any) => {
    try {
      const dbRow: Record<string, any> = {};
      if (cat.name !== undefined) dbRow.name = cat.name;
      if (cat.order !== undefined) dbRow.sort_order = cat.order;
      const id = cat._id || cat.id;
      if (id && typeof id === 'string' && id.startsWith('loc-')) {
        await supabase.from('categories').insert(dbRow);
      } else if (id) {
        await supabase.from('categories').update(dbRow).eq('id', id);
      } else {
        await supabase.from('categories').insert(dbRow);
      }
      invalidate(['categories']);
    } catch (error) { console.error('Error updating category:', error); }
  }, [invalidate]);

  const updateLocation = useCallback(async (loc: any) => {
    try {
      const dbRow: Record<string, any> = {};
      if (loc.name !== undefined) dbRow.name = loc.name;
      if (loc.whatsapp !== undefined) dbRow.whatsapp = loc.whatsapp;
      if (loc.schedule !== undefined) dbRow.schedule = loc.schedule;
      if (loc.address !== undefined) dbRow.address = loc.address;
      if (loc.image !== undefined) dbRow.image = loc.image;
      if (loc.openTime !== undefined) dbRow.open_time = loc.openTime;
      if (loc.closeTime !== undefined) dbRow.close_time = loc.closeTime;
      if (loc.isOpen !== undefined) dbRow.is_open = loc.isOpen;
      if (loc.latitude !== undefined) dbRow.latitude = loc.latitude;
      if (loc.longitude !== undefined) dbRow.longitude = loc.longitude;
      if (loc.adminEmail !== undefined) dbRow.admin_email = loc.adminEmail;
      if (loc.discontinuedProductIds !== undefined) dbRow.discontinued_product_ids = loc.discontinuedProductIds;
      const id = loc._id || loc.id;
      if (id && typeof id === 'string' && (id.startsWith('loc-') || id.startsWith('new-'))) {
        await supabase.from('locations').insert(dbRow);
      } else if (id) {
        await supabase.from('locations').update(dbRow).eq('id', id);
      } else {
        await supabase.from('locations').insert(dbRow);
      }
      invalidate(['locations']);
    } catch (error) { console.error('Error updating location:', error); }
  }, [invalidate]);

  const updateProduct = useCallback(async (prod: any) => {
    try {
      const dbRow: Record<string, any> = {};
      if (prod.name !== undefined) dbRow.name = prod.name;
      if (prod.description !== undefined) dbRow.description = prod.description;
      if (prod.price !== undefined) dbRow.price = prod.price;
      if (prod.category !== undefined) dbRow.category = prod.category;
      if (prod.image !== undefined) dbRow.image = prod.image;
      if (prod.inStock !== undefined) dbRow.in_stock = prod.inStock;
      if (prod.order !== undefined) dbRow.sort_order = prod.order;
      const id = prod._id || prod.id;
      if (id && typeof id === 'string' && (id.startsWith('prod-') || id.startsWith('new-'))) {
        await supabase.from('menu_items').insert(dbRow);
      } else if (id) {
        await supabase.from('menu_items').update(dbRow).eq('id', id);
      } else {
        await supabase.from('menu_items').insert(dbRow);
      }
      invalidate(['menu_items']);
    } catch (error) { console.error('Error updating product:', error); }
  }, [invalidate]);

  const deleteLocation = useCallback(async (id: string) => {
    try { await supabase.from('locations').delete().eq('id', id); invalidate(['locations']); }
    catch (error) { console.error('Error deleting location:', error); }
  }, [invalidate]);

  const deleteProduct = useCallback(async (id: string) => {
    try { await supabase.from('menu_items').delete().eq('id', id); invalidate(['menu_items']); }
    catch (error) { console.error('Error deleting product:', error); }
  }, [invalidate]);

  const deleteCategory = useCallback(async (id: string) => {
    try { await supabase.from('categories').delete().eq('id', id); invalidate(['categories']); }
    catch (error) { console.error('Error deleting category:', error); }
  }, [invalidate]);

  const createOrder = useCallback(async (order: Omit<Order, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase.from('orders').insert({
        location_id: order.location_id, customer_name: order.customer_name, customer_phone: order.customer_phone,
        delivery_type: order.delivery_type, delivery_address: order.delivery_address || null,
        delivery_coordinates: order.delivery_coordinates || null, items: order.items,
        subtotal: order.subtotal, delivery_fee: order.delivery_fee, total: order.total,
        notes: order.notes || '',
      });
      if (error) throw error;
      invalidate(['orders']);
    } catch (error) { console.error('Error creating order:', error); throw error; }
  }, [invalidate]);

  const deleteOrder = useCallback(async (id: string) => {
    try { await supabase.from('orders').delete().eq('id', id); invalidate(['orders']); }
    catch (error) { console.error('Error deleting order:', error); }
  }, [invalidate]);

  const updateOrderStatus = useCallback(async (id: string, status: Order['status']) => {
    try { await supabase.from('orders').update({ status }).eq('id', id); invalidate(['orders']); }
    catch (error) { console.error('Error updating order status:', error); }
  }, [invalidate]);

  const fetchOrders = useCallback(() => ordersQuery.refetch(), [ordersQuery]);

  const isLoading = !sessionReady || !dataFetched;

  const value = useMemo(() => ({
    locations, menuItems, categories, config, orders,
    isLoading, isAdmin, isSuperAdmin, isLocalAdmin, managedLocationId, userEmail,
    selectedLocation, setSelectedLocation,
    updateLocation, updateProduct, updateConfig, updateCategory,
    deleteLocation, deleteProduct, deleteCategory,
    createOrder, deleteOrder, updateOrderStatus, fetchOrders, signIn, signUp, signOut,
  }), [locations, menuItems, categories, config, orders, isLoading, isAdmin, isSuperAdmin, isLocalAdmin, managedLocationId, userEmail, selectedLocation, setSelectedLocation, updateLocation, updateProduct, updateConfig, updateCategory, deleteLocation, deleteProduct, deleteCategory, createOrder, deleteOrder, updateOrderStatus, fetchOrders, signIn, signUp, signOut]);

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error('useRestaurant must be used within a RestaurantProvider');
  return context;
};
