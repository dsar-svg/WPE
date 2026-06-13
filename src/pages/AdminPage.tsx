import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, MapPin, Clock, MessageCircle, Power, RefreshCcw, Plus, Trash2, Tag, Edit2, Utensils, ShoppingBag, Eye, EyeOff, Trophy, TrendingDown, DollarSign, Menu, X } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Location, Product } from '../types';
import { Link } from 'react-router-dom';
import { LocationForm } from '../components/admin/LocationForm';
import { ProductForm } from '../components/admin/ProductForm';
import { CategoryModal } from '../components/admin/CategoryModal';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { SettingsPage } from '../components/admin/SettingsPage';
import { OrdersPage } from '../components/admin/OrdersPage';
import { DashboardView } from '../components/admin/DashboardView';
import { Pagination } from '../components/ui/Pagination';
import { OptimizedImage } from '../components/ui/OptimizedImage';
const formatTime12h = (time: string) => { if (!time) return ''; const [hours, minutes] = time.split(':');
const h = parseInt(hours);
const ampm = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12; return `${h12}:${minutes} ${ampm}`;};
export function AdminPage() { const { locations, menuItems, categories, config, isAdmin, isLoading, isSuperAdmin, isLocalAdmin, managedLocationId, userEmail, updateLocation, updateProduct, updateConfig, updateCategory, deleteLocation, deleteProduct, deleteCategory, orders, signIn, signOut } = useRestaurant(); const isSedesHidden = !isSuperAdmin;
const [activeTab, setActiveTab] = useState<'dashboard' | 'sedes' | 'productos' | 'ajustes' | 'pedidos'>('dashboard');
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
useEffect(() => { if (isSedesHidden && activeTab === 'sedes') setActiveTab('dashboard'); }, [isSedesHidden, activeTab]);
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
const [productPage, setProductPage] = useState(1);
useEffect(() => { setProductPage(1); }, [activeProductCategory]);
const ITEMS_PER_PAGE = 10;

const allFilteredItems = useMemo(() => {
  if (activeProductCategory === 'Todos') return menuItems;
  return menuItems.filter(item => item.category === activeProductCategory);
}, [menuItems, activeProductCategory]);

const totalProductPages = Math.max(1, Math.ceil(allFilteredItems.length / ITEMS_PER_PAGE));
const paginatedProductItems = useMemo(() => {
  const start = (productPage - 1) * ITEMS_PER_PAGE;
  return allFilteredItems.slice(start, start + ITEMS_PER_PAGE);
}, [allFilteredItems, productPage]);

const groupedPaginatedItems = useMemo(() => {
  const groups: Record<string, Product[]> = {};
  paginatedProductItems.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });
  return groups;
}, [paginatedProductItems]);

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
finally { setIsLoggingIn(false); } }; if (isLoading) { return ( <div className="min-h-screen bg-admin-bg flex items-center justify-center"> <div className="w-12 h-12 border-4 border-primary-vibrant border-t-transparent rounded-full animate-spin"></div> </div> ); }
if (!isAdmin) { return ( <div className="min-h-screen bg-admin-bg flex flex-col items-center justify-center p-6 text-center"> <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}

className="max-w-md w-full bg-admin-surface p-12 rounded-2xl border border-admin-border space-y-8" > <div className="w-20 h-20 bg-admin-border rounded-[20px] flex items-center justify-center text-admin-muted mx-auto"> <Power className="w-10 h-10" /> </div> <div className="space-y-2"> <h1 className="text-3xl font-black text-admin-text">Panel Control</h1> <p className="text-admin-text-muted text-sm">Inicia sesión con tu cuenta de administrador</p> </div> {authError && ( <p className="text-primary-vibrant text-xs font-bold bg-primary-vibrant/10 py-2 px-4 rounded-xl">{authError}</p> )} <form onSubmit={handleSignIn}

className="space-y-4"> <input type="email" placeholder="Correo electrónico" className="w-full bg-admin-border border border-admin-border p-4 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none text-admin-text" value={email} onChange={(e) => setEmail(e.target.value)} required /> <div className="relative"> <input type={showPassword ? "text" : "password"} placeholder="Contraseña" className="w-full bg-admin-border border border-admin-border p-4 pr-12 rounded-2xl font-bold focus:ring-2 focus:ring-primary-vibrant outline-none text-admin-text" value={password} onChange={(e) => setPassword(e.target.value)} required /> <button type="button" onClick={() => setShowPassword(!showPassword)}

className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text transition-colors" > {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />} </button> </div> <button type="submit" disabled={isLoggingIn}

className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50" > {isLoggingIn ? ( <RefreshCcw className="w-6 h-6 animate-spin" /> ) : ( <LogIn className="w-6 h-6" /> )} Iniciar Sesión </button> </form> <Link to="/" className="block text-admin-muted hover:text-admin-text text-sm font-bold transition-colors"> Volver a la vista pública </Link> </motion.div> </div> ); }
return (
  <div className="min-h-screen bg-admin-bg text-white font-sans flex">
    {/* Mobile hamburger button */}
    <button
      onClick={toggleSidebar}
      className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-admin-surface border border-admin-border rounded-xl text-admin-text hover:bg-admin-border transition-colors"
      aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
    >
      {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>

    {/* Mobile overlay */}
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeSidebar}
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        />
      )}
    </AnimatePresence>

    <AdminSidebar
      activeTab={activeTab}
      onTabChange={(tab) => { setActiveTab(tab); closeSidebar(); }}
      config={config}
      userEmail={userEmail}
      onLogout={() => signOut()}
      isSuperAdmin={isSuperAdmin}
      isOpen={isSidebarOpen}
    />

    <main className="flex-1 min-h-screen p-4 pt-16 lg:pt-8 lg:pl-64">
      <div className="max-w-6xl mx-auto">
        {activeTab === 'sedes' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black">Sedes</h2>
                <p className="text-admin-text-muted text-sm">{filteredLocations.length} sede(s) registradas</p>
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
                  className="bg-admin-surface border border-admin-border rounded-2xl p-8 flex flex-col justify-between group overflow-hidden"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="relative">
                        <OptimizedImage
                          src={loc.image}
                          alt={loc.name}
                          className="w-20 h-20 rounded-2xl grayscale-[0.3] group-hover:grayscale-0 transition-all border border-admin-border shadow-xl"
                        />
                        <div className={'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-admin-bg ' + (loc.isOpen ? 'bg-green-500' : 'bg-admin-muted')} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingLoc(loc)} className="p-2 hover:bg-admin-border rounded-xl text-admin-muted transition-colors">
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
                        <div className="flex items-center gap-2 text-admin-text-muted mt-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <p className="text-[11px] uppercase font-bold tracking-tight line-clamp-1">{loc.address}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-admin-bg p-3 rounded-2xl border border-admin-border/50">
                          <div className="flex items-center gap-1.5 mb-1 opacity-50">
                            <Clock className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Horario</span>
                          </div>
                          <p className="text-xs font-black text-admin-text leading-tight">
                            {formatTime12h(loc.openTime)} - {formatTime12h(loc.closeTime)}
                          </p>
                        </div>
                        <div className="bg-admin-bg p-3 rounded-2xl border border-admin-border/50">
                          <div className="flex items-center gap-1.5 mb-1 opacity-50">
                            <MessageCircle className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">WhatsApp</span>
                          </div>
                          <p className="text-xs font-bold text-admin-text">+{loc.whatsapp}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center justify-between bg-admin-bg p-3 rounded-2xl border border-admin-border">
                    <div className="flex items-center gap-3 ml-2">
                      <span className={'text-[11px] font-black uppercase tracking-widest ' + (loc.isOpen ? 'text-primary-vibrant' : 'text-admin-muted')}>
                        {loc.isOpen ? 'Sede Activa' : 'Sede Oculta'}
                      </span>
                    </div>
                    <button onClick={() => updateLocation({ ...loc, isOpen: !loc.isOpen })}
                      className={'w-12 h-6 rounded-full relative transition-colors ' + (loc.isOpen ? 'bg-primary-vibrant' : 'bg-admin-border')}
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
            <div className="flex justify-between items-center bg-admin-surface border border-admin-border p-6 rounded-2xl">
              <div>
                <h3 className="text-lg font-black">{isSuperAdmin ? 'Catálogo Global' : 'Inventario de Sede'}</h3>
                <p className="text-xs text-admin-text-muted">{menuItems.length} items disponibles</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {isSuperAdmin && (
                  <button onClick={() => setIsManageCatsOpen(true)}
                    className="bg-admin-surface hover:bg-admin-border text-white px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
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
            <div className="flex gap-2 p-1.5 bg-admin-surface border border-admin-border rounded-2xl overflow-x-auto">
              <button
                onClick={() => setActiveProductCategory('Todos')}
                className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeProductCategory === 'Todos' ? 'bg-white text-black shadow-lg' : 'text-admin-muted hover:text-admin-text'
                }`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveProductCategory(cat.name)}
                  className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeProductCategory === cat.name ? 'bg-white text-black shadow-lg' : 'text-admin-muted hover:text-admin-text'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {allFilteredItems.length === 0 ? (
              <div className="text-center py-16 text-admin-muted text-sm">No hay productos en esta categoría</div>
            ) : (
              <>
              {Object.entries(groupedPaginatedItems).map(([catName, catItems]) => (
              <div key={catName} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary-vibrant">{catName}</h4>
                  <div className="h-px bg-admin-border flex-1 opacity-50" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catItems.map(item => {
                    const isDiscontinuedLocally = currentManagedLoc?.discontinuedProductIds?.includes(item.id);
                    return (
                      <div key={item.id}
                        className="bg-admin-surface border border-admin-border rounded-[20px] p-4 flex gap-4 hover:border-admin-border transition-colors group"
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden relative bg-admin-bg">
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full p-1 grayscale-[0.2] transition-transform duration-500 group-hover:scale-110"
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
                              <span className="text-primary-vibrant font-mono font-black text-sm">${item.price.toFixed(2)}</span>
                            </div>
                            <p className="text-[11px] text-admin-text-muted line-clamp-1 mt-1">{item.description}</p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div className="flex gap-1">
                              {isSuperAdmin ? (
                                <button onClick={() => updateProduct({ ...item, inStock: !item.inStock })}
                                  className={'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ' + (item.inStock ? 'bg-admin-border text-green-500/50 hover:text-green-500' : 'bg-red-500/10 text-red-500 shadow-lg')}
                                >
                                  {item.inStock ? 'En Stock' : 'Agotado'}
                                </button>
                              ) : (
                                <button onClick={() => toggleLocalAvailability(item.id)}
                                  className={'px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ' + (!isDiscontinuedLocally ? 'bg-admin-border text-green-500/50 hover:text-green-500' : 'bg-red-500/10 text-red-500 shadow-lg')}
                                >
                                  {!isDiscontinuedLocally ? 'Disponible' : 'Inactivo'}
                                </button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingProd(item)} className="p-2 hover:bg-admin-border rounded-xl text-admin-muted">
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
              <Pagination currentPage={productPage} totalPages={totalProductPages} onPageChange={setProductPage} />
              </>
            )}
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
          <DashboardView
            orders={orders}
            locations={locations}
            menuItems={menuItems}
            totalFacturado={totalFacturado}
          />
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