import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, MapPin, Clock, MessageCircle, Power, RefreshCcw, Plus, Trash2, Tag, Edit2, Utensils, ShoppingBag, Eye, EyeOff, Trophy, TrendingDown, DollarSign } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Location, Product } from '../types';
import { Link } from 'react-router-dom';
import { LocationForm } from '../components/admin/LocationForm';
import { ProductForm } from '../components/admin/ProductForm';
import { CategoryModal } from '../components/admin/CategoryModal';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { SettingsPage } from '../components/admin/SettingsPage';
import { OrdersPage } from '../components/admin/OrdersPage';
const formatTime12h = (time: string) => { if (!time) return ''; const [hours, minutes] = time.split(':');
const h = parseInt(hours);
const ampm = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12; return `${h12}:${minutes} ${ampm}`;};
export function AdminPage() { const { locations, menuItems, categories, config, isAdmin, isLoading, isSuperAdmin, isLocalAdmin, managedLocationId, userEmail, updateLocation, updateProduct, updateConfig, updateCategory, deleteLocation, deleteProduct, deleteCategory, orders, signIn, signOut } = useRestaurant();
const [activeTab, setActiveTab] = useState<'dashboard' | 'sedes' | 'productos' | 'ajustes' | 'pedidos'>('dashboard');
const [authError, setAuthError] = useState<string | null>(null);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [isLoggingIn, setIsLoggingIn] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const filteredLocations = isSuperAdmin ? locations : locations.filter(l => l.id === managedLocationId);
const canEditMenuGlobals = isSuperAdmin; const currentManagedLoc = locations.find(l => l.id === managedLocationId);
const toggleLocalAvailability = async (productId: string) => { if (!currentManagedLoc) return; const discontinued = currentManagedLoc.discontinuedProductIds || []; const isDiscontinued = discontinued.includes(productId);
const newDiscontinued = isDiscontinued ? discontinued.filter(id => id !== productId) : [...discontinued, productId]; await updateLocation({ ...currentManagedLoc, discontinuedProductIds: newDiscontinued }); };
const [editingLoc, setEditingLoc] =
useState<Location | null>(null);
const [editingProd, setEditingProd] = useState<Product | null>(null);
const [isAddingLoc, setIsAddingLoc] = useState(false);
const [isAddingProd, setIsAddingProd] = useState(false);
const [isSettingsOpen, setIsSettingsOpen] = useState(false);
const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
const [activeProductCategory, setActiveProductCategory] = useState('Todos');

const productSales = orders.reduce((acc, order) => {
  order.items.forEach(item => {
    if (!acc[item.name]) acc[item.name] = 0;
    acc[item.name] += item.quantity;
  });
  return acc;
}, {} as Record<string, number>);
const topSelling = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);
const leastSelling = Object.entries(productSales).sort((a, b) => a[1] - b[1]).slice(0, 5);
const totalFacturado = orders.reduce((sum, o) => sum + o.total, 0);

const handleSignIn = async (e: React.FormEvent) => { e.preventDefault();
try { setAuthError(null);
setIsLoggingIn(true);
if (!email || !password) { setAuthError('Por favor ingresa email y contraseña');
setIsLoggingIn(false);
return; }
await signIn(email, password); }
catch (error: any) { console.error("Login error:", error);
if (error?.message === 'no_admin') { setAuthError('Esta cuenta no tiene permisos de administrador'); }
else { setAuthError('Credenciales incorrectas'); } }
finally { setIsLoggingIn(false); } }; if (isLoading) { return ( <div className="min-h-screen bg-zinc-950 flex items-center justify-center"> <div className="w-12 h-12 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin"></div> </div> ); }
if (!isAdmin) { return ( <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center"> <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}

className="max-w-md w-full bg-zinc-900 p-12 rounded-[40px] border border-zinc-800 space-y-8 shadow-2xl" > <div className="w-20 h-20 bg-zinc-800 rounded-[20px] flex items-center justify-center text-zinc-600 mx-auto"> <Power className="w-10 h-10" /> </div> <div className="space-y-2"> <h1 className="text-3xl font-black text-white">Panel Control</h1> <p className="text-zinc-500 text-sm">Inicia sesión con tu cuenta de administrador</p> </div> {authError && ( <p className="text-primary-vibrant text-xs font-bold bg-primary-vibrant/10 py-2 px-4 rounded-xl">{authError}</p> )} <form onSubmit={handleSignIn}

className="space-y-4"> <input type="email" placeholder="Correo electrónico" className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none text-white" value={email} onChange={(e) => setEmail(e.target.value)} required /> <div className="relative"> <input type={showPassword ? "text" : "password"} placeholder="Contraseña" className="w-full bg-zinc-800 border border-zinc-700 p-4 pr-12 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none text-white" value={password} onChange={(e) => setPassword(e.target.value)} required /> <button type="button" onClick={() => setShowPassword(!showPassword)}

className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" > {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />} </button> </div> <button type="submit" disabled={isLoggingIn}

className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50" > {isLoggingIn ? ( <RefreshCcw className="w-6 h-6 animate-spin" /> ) : ( <LogIn className="w-6 h-6" /> )} Iniciar Sesión </button> </form> <Link to="/" className="block text-zinc-600 hover:text-zinc-400 text-sm font-bold transition-colors"> Volver a la vista pública </Link> </motion.div> </div> ); }
return (
  <div className="min-h-screen bg-zinc-950 text-white font-sans flex">
    <AdminSidebar
      activeTab={activeTab}
      onTabChange={setActiveTab}
      config={config}
      userEmail={userEmail}
      onLogout={() => signOut()}
    />

    <main className="ml-64 flex-1 min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {activeTab === 'sedes' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black">Sedes</h2>
                <p className="text-zinc-500 text-sm">{filteredLocations.length} sede(s) registradas</p>
              </div>
              {isSuperAdmin && (
                <button onClick={() => setIsAddingLoc(true)}
                  className="bg-primary-vibrant hover:scale-105 active:scale-95 transition-transform text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary-vibrant/20"
                >
                  <Plus className="w-4 h-4" /> Nueva Sede
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLocations.map((loc) => (
                <motion.div layoutId={loc.id} key={loc.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 flex flex-col justify-between group overflow-hidden"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="relative">
                        <img src={loc.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80'}
                          className="w-20 h-20 rounded-2xl object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all border border-zinc-800 shadow-xl"
                        />
                        <div className={'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ' + (loc.isOpen ? 'bg-green-500' : 'bg-zinc-500')} />
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
                          <p className="text-[11px] uppercase font-bold tracking-tight line-clamp-1">{loc.address}</p>
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
                      <span className={'text-[11px] font-black uppercase tracking-widest ' + (loc.isOpen ? 'text-primary-vibrant' : 'text-zinc-600')}>
                        {loc.isOpen ? 'Sede Activa' : 'Sede Oculta'}
                      </span>
                    </div>
                    <button onClick={() => updateLocation({ ...loc, isOpen: !loc.isOpen })}
                      className={'w-12 h-6 rounded-full relative transition-colors ' + (loc.isOpen ? 'bg-primary-vibrant' : 'bg-zinc-800')}
                    >
                      <motion.div animate={{ x: loc.isOpen ? 24 : 4 }}
                        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-md"
                      />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'productos' && (
          <div className="space-y-12">
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-[32px]">
              <div>
                <h3 className="text-lg font-black">{isSuperAdmin ? 'Catálogo Global' : 'Inventario de Sede'}</h3>
                <p className="text-xs text-zinc-500">{menuItems.length} items disponibles</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {isSuperAdmin && (
                  <button onClick={() => setIsManageCatsOpen(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <Tag className="w-3 h-3" /> Categorías
                  </button>
                )}
                <button onClick={() => setIsAddingProd(true)}
                  className="bg-primary-vibrant hover:scale-105 active:scale-95 transition-transform text-white px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary-vibrant/20"
                >
                  <Plus className="w-3 h-3" /> Nuevo
                </button>
              </div>
            </div>
            <div className="flex gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto">
              <button
                onClick={() => setActiveProductCategory('Todos')}
                className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeProductCategory === 'Todos' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveProductCategory(cat.name)}
                  className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeProductCategory === cat.name ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {(activeProductCategory === 'Todos' ? categories : categories.filter(c => c.name === activeProductCategory)).map(cat => {
              const catItems = menuItems.filter(item => item.category === cat.name);
              if (catItems.length === 0) return null;
              return (
              <div key={cat.id} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary-vibrant">{cat.name}</h4>
                  <div className="h-px bg-zinc-800 flex-1 opacity-50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catItems.map(item => {
                    const isDiscontinuedLocally = currentManagedLoc?.discontinuedProductIds?.includes(item.id);
                    return (
                      <div key={item.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-[20px] p-4 flex gap-4 hover:border-zinc-700 transition-colors group"
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden relative bg-zinc-950">
                          <img src={item.image || 'https://picsum.photos/seed/food/400/300'}
                            className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer"
                          />
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
                              <span className="text-primary-vibrant font-mono font-black text-sm"></span>
                            </div>
                            <p className="text-[11px] text-zinc-500 line-clamp-1 mt-1">{item.description}</p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div className="flex gap-1">
                              {isSuperAdmin ? (
                                <button onClick={() => updateProduct({ ...item, inStock: !item.inStock })}
                                  className={'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ' + (item.inStock ? 'bg-zinc-800 text-green-500/50 hover:text-green-500' : 'bg-red-500/10 text-red-500 shadow-lg')}
                                >
                                  {item.inStock ? 'En Stock' : 'Agotado'}
                                </button>
                              ) : (
                                <button onClick={() => toggleLocalAvailability(item.id)}
                                  className={'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ' + (!isDiscontinuedLocally ? 'bg-zinc-800 text-green-500/50 hover:text-green-500' : 'bg-red-500/10 text-red-500 shadow-lg')}
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
              );
            })}
          </div>
        )}

        {activeTab === 'ajustes' && (
          <SettingsPage
            config={config}
            menuItems={menuItems}
            categories={categories}
            onSave={updateConfig}
          />
        )}

        {activeTab === 'pedidos' && (
          <OrdersPage />
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black">Dashboard</h2>
              <p className="text-zinc-500 text-sm">Resumen del restaurante</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8">
                <MapPin className="w-8 h-8 text-primary-vibrant mb-4" />
                <p className="text-3xl font-black">{locations.length}</p>
                <p className="text-zinc-500 text-sm mt-1">Sedes activas</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8">
                <Utensils className="w-8 h-8 text-secondary-vibrant mb-4" />
                <p className="text-3xl font-black">{menuItems.length}</p>
                <p className="text-zinc-500 text-sm mt-1">Productos en menú</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8">
                <ShoppingBag className="w-8 h-8 text-green-500 mb-4" />
                <p className="text-3xl font-black">{orders.length}</p>
                <p className="text-zinc-500 text-sm mt-1">Pedidos totales</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8">
                <DollarSign className="w-8 h-8 text-yellow-500 mb-4" />
                <p className="text-3xl font-black">${totalFacturado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-zinc-500 text-sm mt-1">Total facturado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <h3 className="text-lg font-black">Top 5 Más Vendidos</h3>
                </div>
                {topSelling.length === 0 ? (
                  <p className="text-zinc-600 text-sm">Sin datos de pedidos</p>
                ) : (
                  <div className="space-y-4">
                    {topSelling.map(([name, qty], i) => {
                      const maxQty = topSelling[0][1];
                      const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0;
                      return (
                        <div key={name} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-zinc-300">{i + 1}. {name}</span>
                            <span className="text-xs font-black text-primary-vibrant">{qty} uds</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-vibrant rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingDown className="w-6 h-6 text-red-500" />
                  <h3 className="text-lg font-black">Top 5 Menos Vendidos</h3>
                </div>
                {leastSelling.length === 0 ? (
                  <p className="text-zinc-600 text-sm">Sin datos de pedidos</p>
                ) : (
                  <div className="space-y-4">
                    {leastSelling.map(([name, qty], i) => {
                      const maxQty = topSelling[0]?.[1] || 1;
                      const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0;
                      return (
                        <div key={name} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-zinc-300">{i + 1}. {name}</span>
                            <span className="text-xs font-black text-red-500">{qty} uds</span>
                          </div>
                          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>

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
    </AnimatePresence>
  </div>
);}