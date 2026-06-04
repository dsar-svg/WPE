
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../supabase';
import { Location, Product, RestaurantConfig, Category } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleSupabaseError(error: any, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error?.message || String(error),
    operationType,
    path
  };
  console.error('Supabase Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { INITIAL_LOCATIONS, INITIAL_MENU_ITEMS, CATEGORIES } from '../constants';

interface RestaurantContextType {
  locations: Location[];
  menuItems: Product[];
  categories: Category[];
  config: RestaurantConfig;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLocalAdmin: boolean;
  managedLocationId: string | null;
  selectedLocation: Location | null;
  setSelectedLocation: (loc: Location | null) => void;
  updateLocation: (loc: Location) => Promise<void>;
  updateProduct: (prod: Product) => Promise<void>;
  updateConfig: (config: RestaurantConfig) => Promise<void>;
  updateCategory: (cat: Category) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  seedData: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

const DEFAULT_CONFIG: RestaurantConfig = {
  id: 'main',
  name: 'Wallace Panda Express',
  logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Panda_Express_logo.svg/1024px-Panda_Express_logo.svg.png',
  primaryColor: '#d92323',
  secondaryColor: '#ffc400',
  aboutUs: '',
  socialMedia: {},
  featuredProductIds: [],
  taxRate: 0.16,
  deliveryFee: 2.00,
  exchangeRate: 1.00,
  deliveryZones: [],
  distancePricing: {
    ranges: [
      { maxDistance: 5, fee: 3.00 },
      { maxDistance: 10, fee: 5.00 },
      { maxDistance: 15, fee: 7.00 },
      { maxDistance: null, fee: 0.00 }
    ],
    maxDeliveryDistance: 20
  }
};

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [menuItems, setMenuItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [config, setConfig] = useState<RestaurantConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);
  const [managedLocationId, setManagedLocationId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const fetchData = async () => {
    try {
      // Fetch Config
      const { data: configData, error: configError } = await supabase
        .from('config')
        .select('*')
        .eq('id', 'main')
        .maybeSingle();

      if (configError) {
        console.error("Error fetching config:", configError);
      } else if (configData) {
        const newConfig = { ...DEFAULT_CONFIG, ...configData } as RestaurantConfig;
        setConfig(newConfig);
        document.documentElement.style.setProperty('--color-primary-vibrant', newConfig.primaryColor);
        document.documentElement.style.setProperty('--color-secondary-vibrant', newConfig.secondaryColor);
        if (newConfig.name) document.title = newConfig.name;
        const favicon = document.getElementById('favicon') as HTMLLinkElement;
        if (favicon && newConfig.logo) favicon.href = newConfig.logo;
      }

      // Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('order');
      if (catError) {
        console.error("Error fetching categories:", catError);
      } else if (catData) {
        setCategories(catData as Category[]);
      }

      // Fetch Locations
      const { data: locData, error: locError } = await supabase.from('locations').select('*');
      if (locError) {
        console.error("Error fetching locations:", locError);
      } else if (locData) {
        setLocations(locData as Location[]);
      }

      // Fetch Menu Items
      const { data: menuData, error: menuError } = await supabase.from('menu_items').select('*');
      if (menuError) {
        console.error("Error fetching menu items:", menuError);
      } else if (menuData) {
        setMenuItems(menuData as Product[]);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading && locations.length > 0 && !selectedLocation) {
      const params = new URLSearchParams(window.location.search);
      const sedeId = params.get('sede') || params.get('location');
      if (sedeId) {
        const found = locations.find(l => l.id === sedeId);
        if (found) {
          setSelectedLocation(found);
        }
      }
    }
  }, [isLoading, locations, selectedLocation]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      if (user) {
        try {
          const { data: adminData, error } = await supabase
            .from('admins')
            .select('*')
            .eq('uid', user.id)
            .maybeSingle();

          if (error) {
            console.error("Error fetching admin data:", error);
            // Continue without admin data
          }
          const isSuper = user.email === 'dariomedina2619@gmail.com' || !!adminData;
          const localLoc = locations.find(l => l.adminEmail === user.email);

          setIsSuperAdmin(isSuper);
          setIsLocalAdmin(!!localLoc);
          setIsAdmin(isSuper || !!localLoc);
          setManagedLocationId(localLoc?.id || null);

          if (isSuper) {
            seedData().catch(err => console.error("Error seeding:", err));
          }
        } catch (err) {
          console.error("Error in auth state change:", err);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsLocalAdmin(false);
          setManagedLocationId(null);
        }

        const isSuper = user.email === 'dariomedina2619@gmail.com' || !!adminData;
        const localLoc = locations.find(l => l.adminEmail === user.email);

        setIsSuperAdmin(isSuper);
        setIsLocalAdmin(!!localLoc);
        setIsAdmin(isSuper || !!localLoc);
        setManagedLocationId(localLoc?.id || null);

        if (isSuper) {
          seedData().catch(err => console.error("Error seeding:", err));
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsLocalAdmin(false);
        setManagedLocationId(null);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [locations]);

  const updateConfig = async (newConfig: RestaurantConfig) => {
    try {
      const { error } = await supabase.from('config').upsert({
        id: 'main',
        ...newConfig
      });
      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      console.error('Error updating config:', error);
      // Silently fail for now - user will see changes on refresh
    }
  };

  const updateCategory = async (cat: Category) => {
    try {
      const { error } = await supabase.from('categories').upsert({
        id: cat.id,
        ...cat
      });
      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      console.error('Error updating category:', error);
    }
  };

  const updateLocation = async (loc: Location) => {
    try {
      const { error } = await supabase.from('locations').upsert({
        id: loc.id,
        ...loc
      });
      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      console.error('Error updating location:', error);
    }
  };

  const updateProduct = async (prod: Product) => {
    try {
      const { error } = await supabase.from('menu_items').upsert({
        id: prod.id,
        ...prod
      });
      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      console.error('Error updating product:', error);
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      const { error } = await supabase.from('locations').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting location:', error);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting product:', error);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
    }
  };

  const seedData = async () => {
    try {
      const { data: cats } = await supabase.from('categories').select('*');
      if (!cats || cats.length === 0) {
        for (let i = 0; i < CATEGORIES.length; i++) {
          const name = CATEGORIES[i];
          const id = name.toLowerCase().replace(/\s+/g, '-');
          await supabase.from('categories').upsert({ id, name, order: i });
        }
      }

      const { data: locs } = await supabase.from('locations').select('*');
      if (!locs || locs.length === 0) {
        for (const loc of INITIAL_LOCATIONS) {
          await supabase.from('locations').upsert(loc);
        }
      }

      const { data: items } = await supabase.from('menu_items').select('*');
      if (!items || items.length === 0) {
        for (const item of INITIAL_MENU_ITEMS) {
          await supabase.from('menu_items').upsert(item);
        }
      }

      const { data: cfg } = await supabase.from('config').select('*').eq('id', 'main').maybeSingle();
      if (!cfg) {
        await updateConfig(config);
      }
    } catch (error: any) {
      console.error("Error seeding data:", error);
    }
  };

  return (
    <RestaurantContext.Provider value={{
      locations,
      menuItems,
      categories,
      config,
      isLoading,
      isAdmin,
      isSuperAdmin,
      isLocalAdmin,
      managedLocationId,
      updateLocation,
      updateProduct,
      updateConfig,
      updateCategory,
      deleteLocation,
      deleteProduct,
      deleteCategory,
      seedData,
      selectedLocation,
      setSelectedLocation
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) throw new Error('useRestaurant must be used within a RestaurantProvider');
  return context;
}
