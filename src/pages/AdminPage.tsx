
import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings, LogIn, LogOut, Package, MapPin,
  DollarSign, Power, RefreshCcw, Plus, Trash2, Tag,
  Edit2, X, Save, Image as ImageIcon, Phone, MessageCircle, Clock, Info, Palette, Type,
  Share2, ChevronRight, LayoutDashboard, Utensils, Star, Globe, Shield, User,
  AlertCircle, ShoppingBag, PlusCircle, Check, Percent, Truck, Building, Menu,
  Eye, EyeOff
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { supabase } from '../supabase';
import { Location, Product, RestaurantConfig, Category } from '../types';
import { Link } from 'react-router-dom';

const formatTime12h = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

export function AdminPage() {
  const { 
    locations, menuItems, categories, config, isAdmin, isLoading,
    isSuperAdmin, isLocalAdmin, managedLocationId,
    updateLocation, updateProduct, updateConfig, updateCategory, 
    deleteLocation, deleteProduct, deleteCategory, seedData 
  } = useRestaurant();
  
  const [activeTab, setActiveTab] = useState<'sedes' | 'menu'>('sedes');
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailLogin, setIsEmailLogin] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Filter components based on role
  const filteredLocations = isSuperAdmin 
    ? locations 
    : locations.filter(l => l.id === managedLocationId);

  const canEditMenuGlobals = isSuperAdmin;
  const currentManagedLoc = locations.find(l => l.id === managedLocationId);

  const toggleLocalAvailability = async (productId: string) => {
    if (!currentManagedLoc) return;
    const discontinued = currentManagedLoc.discontinuedProductIds || [];
    const isDiscontinued = discontinued.includes(productId);
    
    const newDiscontinued = isDiscontinued
      ? discontinued.filter(id => id !== productId)
      : [...discontinued, productId];
      
    await updateLocation({
      ...currentManagedLoc,
      discontinuedProductIds: newDiscontinued
    });
  };
  
  // Form States
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [isAddingLoc, setIsAddingLoc] = useState(false);
  const [isAddingProd, setIsAddingProd] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setAuthError(null);
      setIsLoggingIn(true);
      if (isEmailLogin) {
        if (!email || !password) {
          setAuthError('Por favor ingresa email y contraseña');
          setIsLoggingIn(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message?.includes('popup-closed-by-user')) {
        setAuthError('La ventana se cerró antes de completar el inicio de sesión.');
      } else if (error.message?.includes('cancelled-popup-request')) {
        setAuthError('Hay una solicitud de inicio de sesión ya en curso.');
      } else if (error.message?.includes('user-not-found') || error.message?.includes('invalid-login-credentials')) {
        setAuthError('Credenciales incorrectas. Verifica que el usuario esté registrado.');
      } else if (error.message?.includes('invalid-email')) {
        setAuthError('Email inválido.');
      } else {
        setAuthError('Error de autenticación: ' + (error.message || 'Desconocido'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-zinc-900 p-12 rounded-[40px] border border-zinc-800 space-y-8 shadow-2xl"
        >
          <div className="w-20 h-20 bg-zinc-800 rounded-[24px] flex items-center justify-center text-zinc-600 mx-auto">
            <Power className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">Panel Control</h1>
            <p className="text-zinc-500 text-sm">Inicia sesión con tu cuenta de administrador para gestionar Panda Express.</p>
          </div>
          {authError && (
             <p className="text-primary-vibrant text-xs font-bold bg-primary-vibrant/10 py-2 px-4 rounded-xl">{authError}</p>
          )}

          {isEmailLogin ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <input
                type="email"
                placeholder="Correo electrónico"
                className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  className="w-full bg-zinc-800 border border-zinc-700 p-4 pr-12 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCcw className="w-6 h-6 animate-spin" />
                ) : (
                  <LogIn className="w-6 h-6" />
                )}
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setIsEmailLogin(false)}
                className="w-full text-zinc-500 text-sm font-bold hover:text-white transition-colors"
                disabled={isLoggingIn}
              >
                O entrar con Google
              </button>
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 text-[10px] text-zinc-500 text-left space-y-1">
                <p className="font-bold text-zinc-400">Nota para Administradores:</p>
                <p>Para entrar con correo y contraseña, el usuario debe estar registrado manualmente en la consola de Firebase Authentication.</p>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => handleSignIn()}
                disabled={isLoggingIn}
                className="w-full bg-white text-black py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <RefreshCcw className="w-6 h-6 animate-spin" />
                ) : (
                  <LogIn className="w-6 h-6" />
                )}
                Entrar con Google
              </button>
              <button
                onClick={() => setIsEmailLogin(true)}
                className="w-full text-zinc-500 text-sm font-bold hover:text-white transition-colors"
                disabled={isLoggingIn}
              >
                O usar correo y contraseña
              </button>
            </div>
          )}
          <Link to="/" className="block text-zinc-600 hover:text-zinc-400 text-sm font-bold transition-colors">
            Volver a la vista pública
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Sidebar/Nav */}
      <nav className="fixed top-0 left-0 right-0 h-20 bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg">
            {config.logo ? (
              <img src={config.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Utensils className="w-6 h-6 text-zinc-800" />
            )}
          </div>
          <div>
            <h2 className="text-sm sm:text-xl font-black tracking-tight">Panel Admin Panda Express</h2>
            <Link to="/" className="text-[10px] text-zinc-500 hover:text-primary-vibrant uppercase font-bold tracking-widest transition-colors">
              Ver Sitio Público
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl border border-zinc-700 transition-all group"
            title="Ajustes de Marca"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          </button>
          <div className="hidden md:flex items-center gap-3 mr-4 p-2 bg-zinc-800/50 rounded-2xl border border-zinc-800">
             {user?.userMetadata?.avatar_url || user?.user_metadata?.avatar_url ? (
               <img src={user?.userMetadata?.avatar_url || user?.user_metadata?.avatar_url} className="w-8 h-8 rounded-xl border border-zinc-700" referrerPolicy="no-referrer" />
             ) : (
               <div className="w-8 h-8 rounded-xl border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                 <User className="w-4 h-4 text-zinc-500" />
               </div>
             )}
             <div className="text-left line-clamp-1 pr-2">
               <p className="text-[10px] font-black">{user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || ''}</p>
               <p className="text-[8px] text-zinc-500">{user?.email}</p>
             </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-3 bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 rounded-2xl border border-zinc-700 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </nav>

      <div className="pt-28 pb-12 px-6 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
           <button 
            onClick={() => setActiveTab('sedes')}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
              activeTab === 'sedes' ? 'bg-white text-black shadow-xl shadow-white/10 scale-105' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
            }`}
           >
             Sedes
           </button>
           <button 
            onClick={() => setActiveTab('menu')}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
              activeTab === 'menu' ? 'bg-white text-black shadow-xl shadow-white/10 scale-105' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
            }`}
           >
             Productos
           </button>
        </div>

        {/* Content */}
        {activeTab === 'sedes' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isSuperAdmin && (
              <button 
                onClick={() => setIsAddingLoc(true)}
                className="h-64 border-2 border-dashed border-zinc-800 rounded-[32px] flex flex-col items-center justify-center gap-4 text-zinc-600 hover:border-primary-vibrant hover:text-primary-vibrant transition-all group"
              >
                <Plus className="w-10 h-10 group-hover:scale-110 transition-transform" />
                <span className="font-black uppercase text-xs tracking-widest">Agregar Nueva Sede</span>
              </button>
            )}

            {isSuperAdmin && locations.length === 0 && (
               <button 
                onClick={seedData}
                className="h-64 bg-zinc-900 border border-zinc-800 rounded-[32px] flex flex-col items-center justify-center gap-4 text-zinc-400 hover:bg-zinc-800 transition-all"
               >
                 <RefreshCcw className="w-10 h-10" />
                 <span className="font-black uppercase text-xs tracking-widest">Cargar Sedes Demo</span>
               </button>
            )}

            {filteredLocations.map((loc) => (
              <motion.div 
                layoutId={loc.id}
                key={loc.id}
                className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 flex flex-col justify-between group overflow-hidden"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="relative">
                      <img 
                        src={loc.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80'} 
                        className="w-20 h-20 rounded-2xl object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all border border-zinc-800 shadow-xl" 
                      />
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${loc.isOpen ? 'bg-green-500' : 'bg-zinc-500'}`} />
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setEditingLoc(loc)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isSuperAdmin && (
                        <button onClick={() => deleteLocation(loc.id)} className="p-2 hover:bg-red-500/10 text-red-500/50 hover:text-red-500 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-black">{loc.name}</h3>
                      <div className="flex items-center gap-2 text-zinc-500 mt-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <p className="text-[10px] uppercase font-bold tracking-tight line-clamp-1">{loc.address}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/50">
                        <div className="flex items-center gap-1.5 mb-1 opacity-50">
                          <Clock className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Horario</span>
                        </div>
                        <p className="text-xs font-black text-zinc-300 leading-tight">
                          {formatTime12h(loc.openTime)} - {formatTime12h(loc.closeTime)}
                        </p>
                      </div>
                      <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/50">
                        <div className="flex items-center gap-1.5 mb-1 opacity-50">
                          <MessageCircle className="w-3 h-3" />
                          <span className="text-[8px] font-black uppercase tracking-widest">WhatsApp</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-300">+{loc.whatsapp}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-3 ml-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${loc.isOpen ? 'text-primary-vibrant' : 'text-zinc-600'}`}>
                      {loc.isOpen ? 'Sede Activa' : 'Sede Oculta'}
                    </span>
                  </div>
                  <button
                    onClick={() => updateLocation({ ...loc, isOpen: !loc.isOpen })}
                    className={`w-12 h-6 rounded-full relative transition-colors ${loc.isOpen ? 'bg-primary-vibrant' : 'bg-zinc-800'}`}
                  >
                    <motion.div 
                      animate={{ x: loc.isOpen ? 24 : 4 }}
                      className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
             <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-[32px]">
               <div>
                   <h3 className="text-lg font-black">{isSuperAdmin ? 'Catálogo Global' : 'Inventario de Sede'}</h3>
                   <p className="text-xs text-zinc-500">{menuItems.length} items disponibles</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-3">
                 {isSuperAdmin && (
                   <button 
                    onClick={() => setIsManageCatsOpen(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                   >
                     <Tag className="w-3 h-3" />
                     Categorías
                   </button>
                 )}
                 <button 
                  onClick={() => setIsAddingProd(true)}
                  className="bg-primary-vibrant hover:scale-105 active:scale-95 transition-transform text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                 >
                   <Plus className="w-3 h-3" />
                   Nuevo
                 </button>
               </div>
            </div>

            {categories.map(cat => (
              <div key={cat.id} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary-vibrant">{cat.name}</h4>
                  <div className="h-px bg-zinc-800 flex-1 opacity-50" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.filter(item => item.category === cat.name).map(item => {
                    const isDiscontinuedLocally = currentManagedLoc?.discontinuedProductIds?.includes(item.id);
                    const isCurrentlyAvailable = item.inStock && !isDiscontinuedLocally;

                    return (
                      <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-[28px] p-4 flex gap-4 hover:border-zinc-700 transition-colors group">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden relative bg-zinc-950">
                          <img src={item.image || 'https://picsum.photos/seed/food/400/300'} className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                          {(!item.inStock || isDiscontinuedLocally) && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-[8px] font-black uppercase bg-white text-black px-1.5 py-0.5 rounded">
                                {!item.inStock ? 'Sin Stock Global' : 'Inactivo en Sede'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <div className="flex justify-between items-start">
                              <h5 className="font-bold text-sm">{item.name}</h5>
                              <span className="text-primary-vibrant font-mono font-black text-sm">${item.price.toFixed(2)}</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 line-clamp-1 mt-1">{item.description}</p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                             <div className="flex gap-1">
                               {isSuperAdmin ? (
                                 <button
                                  onClick={() => updateProduct({ ...item, inStock: !item.inStock })}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    item.inStock ? 'bg-zinc-800 text-green-500/50 hover:text-green-500' : 'bg-red-500/10 text-red-500 shadow-lg'
                                  }`}
                                 >
                                   {item.inStock ? 'En Stock' : 'Agotado'}
                                 </button>
                               ) : (
                                 <button
                                  onClick={() => toggleLocalAvailability(item.id)}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    !isDiscontinuedLocally ? 'bg-zinc-800 text-green-500/50 hover:text-green-500' : 'bg-red-500/10 text-red-500 shadow-lg'
                                  }`}
                                 >
                                   {!isDiscontinuedLocally ? 'Disponible' : 'Inactivo'}
                                 </button>
                               )}
                             </div>
                             <div className="flex gap-2">
                               <button onClick={() => setEditingProd(item)} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500">
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               {isSuperAdmin && (
                                 <button onClick={() => deleteProduct(item.id)} className="p-2 hover:bg-red-500/10 text-red-500/30 hover:text-red-500 rounded-xl transition-all">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAddingLoc || editingLoc) && (
          <LocationForm 
            location={editingLoc || undefined} 
            isSuperAdmin={isSuperAdmin}
            onClose={() => { setEditingLoc(null); setIsAddingLoc(false); }}
            onSave={updateLocation}
          />
        )}
        {(isAddingProd || editingProd) && (
          <ProductForm 
            product={editingProd || undefined} 
            categories={categories}
            onClose={() => { setEditingProd(null); setIsAddingProd(false); }}
            onSave={updateProduct}
          />
        )}
        {isManageCatsOpen && (
          <CategoryModal 
            categories={categories}
            onClose={() => setIsManageCatsOpen(false)}
            onSave={updateCategory}
            onDelete={deleteCategory}
          />
        )}
        {isSettingsOpen && (
          <SettingsModal 
            config={config} 
            onClose={() => setIsSettingsOpen(false)} 
            onSave={updateConfig} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Subcomponents for forms
function LocationForm({ location, isSuperAdmin, onClose, onSave }: { location?: Location, isSuperAdmin: boolean, onClose: () => void, onSave: (l: Location) => void }) {
  const [data, setData] = useState<Location>({
    id: location?.id || `loc-${Date.now()}`,
    name: location?.name || '',
    whatsapp: location?.whatsapp || '',
    address: location?.address || '',
    image: location?.image || '',
    openTime: location?.openTime || '12:00',
    closeTime: location?.closeTime || '22:00',
    schedule: location?.schedule || 'Lunes a Domingo',
    isOpen: location?.isOpen ?? true,
    deliveryFee: location?.deliveryFee || 0,
    taxRate: location?.taxRate || 0,
    exchangeRate: location?.exchangeRate || 1,
    deliveryZones: location?.deliveryZones || [],
    latitude: location?.latitude || undefined,
    longitude: location?.longitude || undefined,
    adminEmail: location?.adminEmail || '',
    adminPassword: location?.adminPassword || '',
    discontinuedProductIds: location?.discontinuedProductIds || []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'info' | 'horario' | 'contacto' | 'finanzas'>('info');

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setData({ ...data, image: reader.result as string });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const scheduleOptions = [
    'Lunes a Domingo',
    'Lunes a Viernes',
    'Lunes a Sábado',
    'Martes a Domingo',
    'Fines de Semana',
    'Personalizado'
  ];

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Si es SuperAdmin y hay credenciales, sincronizar con Supabase Auth vía Backend
      if (isSuperAdmin && data.adminEmail && data.adminPassword) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const accessToken = session?.access_token;
        if (accessToken) {
          const response = await fetch('/api/admin/sync-admin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              email: data.adminEmail,
              password: data.adminPassword
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(`Error sincronizando usuario: ${errData.error || 'Desconocido'}`);
          }
        }
      }

      await onSave(data);
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-[40px] p-0 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header & Navigation */}
        <div className="bg-zinc-800/50 p-8 pb-4 border-b border-zinc-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black tracking-tight">{location ? 'Editar Sede' : 'Nueva Sede'}</h2>
            <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"><X /></button>
          </div>
          
          <div className="flex gap-2 p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800">
            {[
              { id: 'info', label: 'Info', icon: Info },
              { id: 'horario', label: 'Horario', icon: Clock },
              { id: 'contacto', label: 'Contacto', icon: Phone },
              { id: 'finanzas', label: 'Finanzas', icon: DollarSign }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFormTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeFormTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <AnimatePresence mode="wait">
            {activeFormTab === 'info' && (
              <motion.div
                key="info-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-zinc-950 p-6 rounded-[32px] border border-zinc-800 space-y-4">
                  <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Foto de la Sede</label>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden flex-shrink-0 relative">
                      {data.image ? (
                        <img src={data.image || 'https://picsum.photos/seed/food/400/300'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-primary-vibrant border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input type="file" id="loc-image-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      <button 
                        onClick={() => document.getElementById('loc-image-upload')?.click()}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Subir desde el dispositivo
                      </button>
                      <input 
                        type="text" 
                        className="w-full bg-zinc-900 border border-zinc-700 p-2.5 rounded-xl font-bold text-[9px] focus:ring-1 focus:ring-primary-vibrant outline-none text-zinc-400"
                        placeholder="O URL directa..."
                        value={data.image}
                        onChange={e => setData({...data, image: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Nombre</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                      placeholder="Ej: Valencia Norte"
                      value={data.name}
                      onChange={e => setData({...data, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Dirección</label>
                    <textarea 
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none h-24 resize-none"
                      placeholder="Dirección completa de la sede..."
                      value={data.address}
                      onChange={e => setData({...data, address: e.target.value})}
                    />
                  </div>
                </div>

                {isSuperAdmin && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Email del Administrador de Sede</label>
                      <input 
                        type="email" 
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        placeholder="ejemplo@admin.com"
                        value={data.adminEmail || ''}
                        onChange={e => setData({...data, adminEmail: e.target.value})}
                      />
                      <p className="text-[9px] text-zinc-600 ml-2">Este usuario podrá gestionar exclusivamente esta sede.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Contraseña de Acceso</label>
                      <input 
                        type="text" 
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        placeholder="Contraseña"
                        value={data.adminPassword || ''}
                        onChange={e => setData({...data, adminPassword: e.target.value})}
                      />
                      <p className="text-[9px] text-zinc-600 ml-2">Se recomienda usar una contraseña segura.</p>
                    </div>

                    <div className="mt-8 p-6 bg-zinc-800/30 rounded-3xl border border-zinc-700/30 space-y-4">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-primary-vibrant" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Enlace Directo de Menú</h4>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          readOnly
                          className="flex-1 bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-[10px] font-mono text-zinc-400 outline-none"
                          value={`${window.location.origin}/pedir?sede=${data.id}`}
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/pedir?sede=${data.id}`);
                            alert('¡Enlace copiado!');
                          }}
                          className="bg-primary-vibrant text-white px-4 rounded-xl font-bold text-[10px] uppercase transition-transform active:scale-90"
                        >
                          Copiar
                        </button>
                      </div>
                      <p className="text-[8px] text-zinc-500 italic">Comparte este enlace directamente con tus clientes para que entren directo a tu sede.</p>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeFormTab === 'horario' && (
              <motion.div
                key="horario-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Días de Atención</label>
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                    value={data.schedule}
                    onChange={e => setData({...data, schedule: e.target.value})}
                  >
                    {scheduleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Apertura</label>
                    <input 
                      type="time" 
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none transition-all"
                      value={data.openTime}
                      onChange={e => setData({...data, openTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Cierre</label>
                    <input 
                      type="time" 
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none transition-all"
                      value={data.closeTime}
                      onChange={e => setData({...data, closeTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="p-4 bg-zinc-800/20 rounded-2xl border border-zinc-800 flex items-start gap-4">
                   <Clock className="w-5 h-5 text-primary-vibrant mt-1" />
                   <p className="text-[10px] leading-relaxed text-zinc-500">
                     Este horario se usará para el <strong className="text-zinc-300">bloqueo automático</strong> de pedidos. Asegúrate de que las horas sean exactas.
                   </p>
                </div>
              </motion.div>
            )}

            {activeFormTab === 'contacto' && (
              <motion.div
                key="contacto-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">WhatsApp de Pedidos</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-zinc-500 font-bold">
                       <MessageCircle className="w-4 h-4" />
                       <span>+</span>
                    </div>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 pl-12 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                      placeholder="584241234567"
                      value={data.whatsapp}
                      onChange={e => setData({...data, whatsapp: e.target.value})}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-600 ml-2 italic">* Incluye código de país (ej: 58 para Venezuela)</p>
                </div>
              </motion.div>
            )}

            {activeFormTab === 'finanzas' && (
              <motion.div
                key="finanzas-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Impuesto (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                      value={isNaN(data.taxRate * 100) ? '' : (data.taxRate * 100).toFixed(1)}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setData({...data, taxRate: isNaN(val) ? 0 : val / 100});
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Delivery Base ($)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                      value={data.deliveryFee}
                      onChange={e => setData({...data, deliveryFee: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Tasa de Cambio (BS/USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                    value={data.exchangeRate}
                    onChange={e => setData({...data, exchangeRate: parseFloat(e.target.value) || 1})}
                  />
                </div>

                {/* Coordenadas de la sede */}
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Coordenadas de la Sede</label>
                    <span className="text-[8px] text-zinc-600">Para cálculo de distancias</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Latitud</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        placeholder="10.162000"
                        value={data.latitude || ''}
                        onChange={e => setData({...data, latitude: parseFloat(e.target.value) || undefined})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Longitud</label>
                      <input
                        type="number"
                        step="0.000001"
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                        placeholder="-68.007000"
                        value={data.longitude || ''}
                        onChange={e => setData({...data, longitude: parseFloat(e.target.value) || undefined})}
                      />
                    </div>
                  </div>
                  <p className="text-[8px] text-zinc-600 ml-2">
                    Ejemplo: Valencia centro ≈ 10.162, -68.007
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-800">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Zonas de Delivery</label>
                    <button 
                      onClick={() => {
                        const zones = data.deliveryZones || [];
                        setData({
                          ...data, 
                          deliveryZones: [...zones, { id: crypto.randomUUID(), name: 'Nueva Zona', fee: 0 }]
                        });
                      }}
                      className="text-[10px] font-black text-primary-vibrant uppercase flex items-center gap-1 hover:opacity-80"
                    >
                      <Plus className="w-3 h-3" /> Añadir Zona
                    </button>
                  </div>
                  
                  <div className="grid gap-2">
                    {(data.deliveryZones || []).map((zone, idx) => (
                      <div key={zone.id} className="flex gap-2 items-center bg-zinc-950 border border-zinc-800 p-2 rounded-xl">
                        <input 
                          className="flex-1 bg-transparent font-bold text-xs outline-none px-2"
                          value={zone.name}
                          onChange={e => {
                            const zones = [...data.deliveryZones];
                            zones[idx].name = e.target.value;
                            setData({...data, deliveryZones: zones});
                          }}
                        />
                        <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                          <span className="text-[10px] font-black text-zinc-500">$</span>
                          <input 
                            type="number"
                            step="0.1"
                            className="w-12 bg-transparent font-bold text-xs outline-none"
                            value={zone.fee}
                            onChange={e => {
                              const zones = [...data.deliveryZones];
                              zones[idx].fee = parseFloat(e.target.value) || 0;
                              setData({...data, deliveryZones: zones});
                            }}
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const zones = data.deliveryZones.filter((_, i) => i !== idx);
                            setData({...data, deliveryZones: zones});
                          }}
                          className="p-2 text-zinc-600 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 pt-0 mt-auto">
          <button 
            disabled={isSaving}
            onClick={handleSave}
            className="w-full bg-white text-black py-5 rounded-[24px] font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform shadow-xl shadow-white/5 disabled:opacity-50"
          >
            {isSaving ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CategoryModal({ categories, onClose, onSave, onDelete }: { categories: Category[], onClose: () => void, onSave: (c: Category) => Promise<void>, onDelete: (id: string) => Promise<void> }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (cat: Category) => {
    try {
      setIsSaving(true);
      await onSave(cat);
      setEditingId(null);
      setNewName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const id = `cat-${Date.now()}`;
    handleSave({
      id,
      name: newName,
      order: categories.length
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 shadow-2xl space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black tracking-tight">Gestionar Categorías</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"><X /></button>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
              placeholder="Nueva categoría..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAdd()}
            />
            <button 
              onClick={handleAdd}
              className="bg-primary-vibrant p-4 rounded-2xl text-white hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-zinc-950 border border-zinc-900 p-4 rounded-2xl flex items-center justify-between group">
                {editingId === cat.id ? (
                  <input 
                    autoFocus
                    className="flex-1 bg-zinc-900 border border-zinc-800 p-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                    value={cat.name}
                    onChange={e => onSave({ ...cat, name: e.target.value })}
                    onBlur={() => setEditingId(null)}
                    onKeyPress={e => e.key === 'Enter' && setEditingId(null)}
                  />
                ) : (
                  <span className="font-bold text-zinc-300">{cat.name}</span>
                )}
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingId(cat.id)}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if(confirm('¿Estás seguro de eliminar esta categoría? Los productos seguirán existiendo pero no se verán en el menú hasta que les cambies la categoría.')) {
                        onDelete(cat.id);
                      }
                    }}
                    className="p-2 text-zinc-500 hover:text-primary-vibrant hover:bg-primary-vibrant/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SettingsModal({ config, onClose, onSave }: { config: RestaurantConfig, onClose: () => void, onSave: (c: RestaurantConfig) => Promise<void> }) {
  const [data, setData] = useState<RestaurantConfig>({
    ...config,
    aboutUs: config.aboutUs || '',
    socialMedia: config.socialMedia || {},
    featuredProductIds: config.featuredProductIds || [],
    distancePricing: config.distancePricing || {
      ranges: [
        { maxDistance: 5, fee: 3.00 },
        { maxDistance: 10, fee: 5.00 },
        { maxDistance: 15, fee: 7.00 },
        { maxDistance: null, fee: 0.00 }
      ],
      maxDeliveryDistance: 20
    }
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { menuItems } = useRestaurant();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(data);
      onClose();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setData({ ...data, logo: reader.result as string });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const toggleFeaturedProduct = (id: string) => {
    const ids = data.featuredProductIds || [];
    if (ids.includes(id)) {
      setData({ ...data, featuredProductIds: ids.filter(i => i !== id) });
    } else {
      if (ids.length < 3) {
        setData({ ...data, featuredProductIds: [...ids, id] });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="relative w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary-vibrant" />
            Ajustes de Marca
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors"><X /></button>
        </div>

        <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pb-4 pr-1">
          {/* Logo */}
          <div className="bg-zinc-950 p-6 rounded-[32px] border border-zinc-800 space-y-4">
            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Logo</label>
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-white rounded-full border border-zinc-800 overflow-hidden flex-shrink-0 relative flex items-center justify-center shadow-inner">
                {data.logo ? (
                  <img src={data.logo || '/logo.png'} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-300" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary-vibrant border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                <button 
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Subir Logo
                </button>
                <input 
                  type="text" 
                  className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl font-bold text-[9px] focus:ring-1 focus:ring-primary-vibrant outline-none text-zinc-500"
                  placeholder="URL logo..."
                  value={data.logo}
                  onChange={e => setData({...data, logo: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* About us */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Sobre Nosotros</label>
            <textarea 
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary-vibrant outline-none h-24"
              placeholder="Descripción del restaurante..."
              value={data.aboutUs}
              onChange={e => setData({...data, aboutUs: e.target.value})}
            />
          </div>

          {/* Socials */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Redes Sociales (URLs)</label>
            {(['instagram', 'facebook', 'tiktok'] as const).map(platform => (
              <input 
                key={platform}
                type="text"
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl font-bold text-xs focus:ring-2 focus:ring-primary-vibrant outline-none capitalize"
                placeholder={`${platform} URL`}
                value={data.socialMedia?.[platform] || ''}
                onChange={e => setData({...data, socialMedia: {...data.socialMedia, [platform]: e.target.value}})}
              />
            ))}
          </div>

          {/* Tarifas por Distancia */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Tarifas por Distancia</label>
              <span className="text-[8px] text-zinc-600">Configuración global</span>
            </div>

            {/* Distancia máxima de delivery */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Distancia Máxima de Delivery (km)</label>
              <input
                type="number"
                step="1"
                className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                value={data.distancePricing?.maxDeliveryDistance || 20}
                onChange={e => setData({
                  ...data,
                  distancePricing: {
                    ...data.distancePricing,
                    maxDeliveryDistance: parseInt(e.target.value) || 20
                  }
                })}
              />
            </div>

            {/* Rangos de tarifas */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Rangos de Tarifas</label>
              <div className="space-y-2">
                {(data.distancePricing?.ranges || []).map((range, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-[10px] font-black text-zinc-500">Hasta</span>
                      <input
                        type="number"
                        step="1"
                        className="w-16 bg-transparent font-bold text-xs outline-none text-center"
                        placeholder="km"
                        value={range.maxDistance === null ? '' : range.maxDistance}
                        onChange={e => {
                          const ranges = [...(data.distancePricing?.ranges || [])];
                          ranges[idx].maxDistance = e.target.value === '' ? null : parseInt(e.target.value);
                          setData({
                            ...data,
                            distancePricing: { ...data.distancePricing!, ranges }
                          });
                        }}
                      />
                      <span className="text-[10px] font-black text-zinc-500">km →</span>
                    </div>
                    <div className="flex items-center gap-1 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800">
                      <span className="text-[10px] font-black text-zinc-500">$</span>
                      <input
                        type="number"
                        step="0.1"
                        className="w-16 bg-transparent font-bold text-xs outline-none"
                        value={range.fee}
                        onChange={e => {
                          const ranges = [...(data.distancePricing?.ranges || [])];
                          ranges[idx].fee = parseFloat(e.target.value) || 0;
                          setData({
                            ...data,
                            distancePricing: { ...data.distancePricing!, ranges }
                          });
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        const ranges = (data.distancePricing?.ranges || []).filter((_, i) => i !== idx);
                        setData({
                          ...data,
                          distancePricing: { ...data.distancePricing!, ranges }
                        });
                      }}
                      className="p-2 text-zinc-600 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const ranges = [...(data.distancePricing?.ranges || [])];
                  ranges.push({ maxDistance: null, fee: 0 });
                  setData({
                    ...data,
                    distancePricing: { ...data.distancePricing!, ranges }
                  });
                }}
                className="text-[10px] font-black text-primary-vibrant uppercase flex items-center gap-1 hover:opacity-80"
              >
                <Plus className="w-3 h-3" /> Añadir Rango
              </button>
            </div>
          </div>

          {/* Featured */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Platos Destacados (Máx 3)</label>
            <div className="grid grid-cols-2 gap-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleFeaturedProduct(item.id)}
                  className={`p-3 rounded-xl text-xs font-bold text-left border ${data.featuredProductIds?.includes(item.id) ? 'bg-primary-vibrant text-white border-primary-vibrant' : 'bg-zinc-950 text-zinc-400 border-zinc-800'} transition-all`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6">
          {error && <p className="text-red-500 text-xs mb-4 font-bold">{error}</p>}
          <button 
            disabled={isSaving}
            onClick={handleSave}
            className="w-full bg-white text-black py-5 rounded-[24px] font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform shadow-xl shadow-white/5 disabled:opacity-50"
          >
            {isSaving ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            {isSaving ? 'Aplicando...' : 'Aplicar Identidad'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProductForm({ product, categories, onClose, onSave }: { product?: Product, categories: Category[], onClose: () => void, onSave: (p: Product) => Promise<void> }) {
  const [data, setData] = useState<Product>(product || {
    id: `prod-${Date.now()}`,
    name: '',
    description: '',
    category: categories[0]?.name || '',
    price: 0,
    image: 'https://picsum.photos/seed/food/400/300',
    inStock: true
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(data);
      onClose();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setData({ ...data, image: reader.result as string });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-[40px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto space-y-8 custom-scrollbar">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black tracking-tight">{product ? 'Editar Plato' : 'Nuevo Plato'}</h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-500"><X /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div className="bg-zinc-950 p-4 rounded-3xl border border-zinc-800 flex flex-col items-center gap-4">
                <div className="w-full aspect-square bg-zinc-900 rounded-2xl overflow-hidden relative">
                   {data.image ? (
                     <img src={data.image || 'https://picsum.photos/seed/food/400/300'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-zinc-800">
                       <ImageIcon className="w-12 h-12" />
                     </div>
                   )}
                   {isUploading && (
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                       <div className="w-8 h-8 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin" />
                     </div>
                   )}
                </div>
                <div className="w-full space-y-2">
                  <input type="file" id="prod-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <button 
                    onClick={() => document.getElementById('prod-upload')?.click()}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCcw className="w-3 h-3" /> Subir desde el dispositivo
                  </button>
                  <input 
                    className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded-xl font-mono text-[9px] text-zinc-500 focus:ring-1 focus:ring-primary-vibrant outline-none"
                    placeholder="O URL directa..."
                    value={data.image}
                    onChange={e => setData({...data, image: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Categoría</label>
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                  value={data.category}
                  onChange={e => setData({...data, category: e.target.value})}
                >
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Nombre del Producto</label>
                <input 
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                  value={data.name}
                  onChange={e => setData({...data, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Precio ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none"
                  value={isNaN(data.price) ? "" : data.price}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setData({...data, price: isNaN(val) ? 0 : val});
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Descripción</label>
                <textarea 
                  className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none h-32 resize-none"
                  value={data.description}
                  onChange={e => setData({...data, description: e.target.value})}
                />
              </div>
           </div>
        </div>

        {error && <p className="text-red-500 text-xs mb-4 font-bold">{error}</p>}
        <button 
          disabled={isSaving}
          onClick={handleSave}
          className="w-full bg-white text-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
        >
          {isSaving ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? 'Guardando...' : 'Guardar Plato'}
        </button>
      </motion.div>
    </div>
  );
}
