import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, MapPin, Clock, MessageCircle, Power, RefreshCcw, Plus, Trash2, Tag, Edit2, Eye, EyeOff, Menu, X, Key, AlertTriangle } from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { Product, Location, Cashier } from '../types';
import { Link } from 'react-router-dom';
import { LocationForm } from '../components/admin/LocationForm';
import { ProductForm } from '../components/admin/ProductForm';
import { CategoryModal } from '../components/admin/CategoryModal';
import { CashierForm } from '../components/admin/CashierForm';
import { FinanzasPage } from '../components/admin/FinanzasPage';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { SettingsPage } from '../components/admin/SettingsPage';
import { OrdersPage } from '../components/admin/OrdersPage';
import { DashboardView } from '../components/admin/DashboardView';
import { ReporteDiario } from '../components/admin/ReporteDiario';
import { AuditLogView } from '../components/admin/AuditLogView';
import { Pagination } from '../components/ui/Pagination';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { supabase } from '../lib/supabase';
import { useOrderNotification } from '../hooks/useOrderNotification';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
const formatTime12h = (time: string) => { if (!time) return ''; const [hours, minutes] = time.split(':');
const h = parseInt(hours);
const ampm = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12; return `${h12}:${minutes} ${ampm}`;};
export function AdminPage() { const { locations, menuItems, categories, config, isAdmin, isLoading, isSuperAdmin, managedLocationId, userEmail, updateLocation, updateProduct, updateConfig, updateCategory, deleteLocation, deleteProduct, deleteCategory, orders, fetchOrders, signIn, signOut, createLocationAdmin } = useRestaurant(); const isSedesHidden = !isSuperAdmin;
const [activeTab, setActiveTab] = useState<'dashboard' | 'reporte' | 'sedes' | 'productos' | 'ajustes' | 'pedidos' | 'cajeras' | 'finanzas' | 'cortes' | 'audit_log'>('dashboard');

useOrderNotification(() => {
  if (activeTab === 'pedidos') fetchOrders?.();
});
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
useEffect(() => {
  if (isSedesHidden && (activeTab === 'sedes' || activeTab === 'cajeras' || activeTab === 'finanzas')) setActiveTab('dashboard');
}, [isSedesHidden, activeTab]);

const [cortesData, setCortesData] = useState<any[]>([]);
const [cortesLoading, setCortesLoading] = useState(false);
const [cortesFilterLoc, setCortesFilterLoc] = useState('');

useEffect(() => {
  if (activeTab !== 'cortes') return;
  (async () => {
    setCortesLoading(true);
    let query = supabase.from('cortes').select('*').order('closed_at', { ascending: false }).limit(100);
    if (!isSuperAdmin && managedLocationId) {
      query = query.eq('location_id', managedLocationId);
    }
    if (cortesFilterLoc) {
      query = query.eq('location_id', cortesFilterLoc);
    }
    const { data } = await query;
    setCortesData(data || []);
    setCortesLoading(false);
  })();
}, [activeTab, cortesFilterLoc, isSuperAdmin, managedLocationId]);

const fetchCashiers = async () => {
  setCashiersLoading(true);
  const { data } = await supabase.from('admins').select('*').eq('role', 'cashier');
  if (data) setCashiers(data.map(r => ({ id: r.id, name: r.name, email: r.email, employee_id: r.employee_id, location_id: r.location_id, pin: r.pin })));
  setCashiersLoading(false);
};

useEffect(() => {
  if (activeTab === 'cajeras' || activeTab === 'reporte') fetchCashiers();
}, [activeTab]);

const handleDeleteCashier = async (id: string) => {
  await supabase.from('admins').delete().eq('id', id);
  setConfirmDeleteCashier(null);
  fetchCashiers();
};
const [authError, setAuthError] = useState<string | null>(null);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [isLoggingIn, setIsLoggingIn] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const filteredLocations = isSuperAdmin ? locations : locations.filter(l => l.id === managedLocationId);
const currentManagedLoc = locations.find(l => l.id === managedLocationId);

const toggleLocalAvailability = async (productId: string) => { if (!currentManagedLoc) return; const discontinued = currentManagedLoc.discontinuedProductIds || []; const isDiscontinued = discontinued.includes(productId);
const newDiscontinued = isDiscontinued ? discontinued.filter(id => id !== productId) : [...discontinued, productId]; await updateLocation({ ...currentManagedLoc, discontinuedProductIds: newDiscontinued }); };
const [editingLoc, setEditingLoc] =
useState<Location | null>(null);
const [editingProd, setEditingProd] = useState<Product | null>(null);
const [isAddingLoc, setIsAddingLoc] = useState(false);
const [isAddingProd, setIsAddingProd] = useState(false);
const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
const [cashiers, setCashiers] = useState<Cashier[]>([]);
const [cashiersLoading, setCashiersLoading] = useState(false);
const [editingCashier, setEditingCashier] = useState<Cashier | null>(null);
const [isAddingCashier, setIsAddingCashier] = useState(false);
const [confirmDeleteCashier, setConfirmDeleteCashier] = useState<string | null>(null);
const [showPin, setShowPin] = useState<string | null>(null);
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

const totalFacturado = orders.reduce((sum, o) => sum + (Number.isFinite(o.total) ? o.total : 0), 0);

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
    <main id="main-content" className="min-h-screen bg-admin-bg text-white font-sans flex overflow-x-hidden">
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
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
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

    <div className="flex-1 min-h-screen p-6 pt-20 lg:pt-10 lg:pl-80 overflow-hidden">
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
                        <div className={'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-admin-bg ' + (loc.isOpen ? 'bg-green-500' : loc.isActive ? 'bg-yellow-500' : 'bg-admin-muted')} />
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
                      <span className={'text-[11px] font-black uppercase tracking-widest ' + (loc.isActive ? 'text-primary-vibrant' : 'text-admin-muted')}>
                        {loc.isActive ? (loc.isOpen ? 'Sede Activa y Abierta' : 'Sede Activa (Cerrada por horario)') : 'Sede Inactiva'}
                      </span>
                    </div>
                    <button onClick={() => updateLocation({ ...loc, isActive: !loc.isActive })}
                      className={'w-12 h-6 rounded-full relative transition-colors ' + (loc.isActive ? 'bg-primary-vibrant' : 'bg-admin-border')}
                    >
                      <motion.div animate={{ x: loc.isActive ? 24 : 4 }}
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
                {isSuperAdmin && (
                <button onClick={() => setIsAddingProd(true)}
                  className="bg-primary-vibrant hover:scale-105 active:scale-95 transition-transform text-white px-4 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary-vibrant/20"
                >
                  <Plus className="w-3 h-3" /> Nuevo
                </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 p-1.5 bg-admin-surface border border-admin-border rounded-2xl overflow-x-auto no-scrollbar">
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
                              {isSuperAdmin && (
                              <button onClick={() => setEditingProd(item)} className="p-2 hover:bg-admin-border rounded-xl text-admin-muted">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              )}
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

        {activeTab === 'finanzas' && (
          <FinanzasPage
            config={config}
            onSave={updateConfig}
          />
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

        {activeTab === 'cortes' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black">Cortes de Caja</h2>
                <p className="text-admin-text-muted text-sm">
                  {cortesData.length} corte(s) registrados
                </p>
              </div>
              {isSuperAdmin && locations.length > 1 && (
                <select value={cortesFilterLoc} onChange={e => setCortesFilterLoc(e.target.value)}
                  className="bg-admin-surface border border-admin-border rounded-xl px-4 py-3 text-sm font-bold text-admin-text outline-none"
                >
                  <option value="">Todas las sedes</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              )}
            </div>
            {cortesLoading ? (
              <div className="text-center py-16 text-admin-muted text-sm animate-pulse">Cargando...</div>
            ) : cortesData.length === 0 ? (
              <div className="text-center py-16 text-admin-muted text-sm">No hay cortes registrados</div>
            ) : (
              <div className="space-y-3">
                {cortesData.map(c => {
                  const locName = locations.find(l => l.id === c.location_id)?.name;
                  const fromTime = c.from_date ? new Date(c.from_date).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : null;
                  const toTime = new Date(c.closed_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={c.id}
                      className="bg-admin-surface border border-admin-border rounded-2xl p-6 hover:border-admin-border/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">
                              {new Date(c.closed_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            {fromTime && <span className="text-[10px] text-zinc-600">{fromTime} — {toTime}</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                            {isSuperAdmin && locName && <span className="font-bold text-white">{locName}</span>}
                            <span>Cajero/a: <span className="font-bold text-zinc-300">{c.cashier_name}</span></span>
                            <span>{c.order_count} pedido(s)</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Efectivo</p>
                            <p className="font-black text-green-400 text-sm">${Number(c.total_efectivo_usd ?? 0).toFixed(2)}</p>
                            <p className="text-[10px] text-zinc-600">{Number(c.total_efectivo_bs ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Tarjeta</p>
                            <p className="font-black text-blue-400 text-sm">{Number(c.total_tarjeta_bs ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</p>
                            <p className="text-[10px] text-zinc-600">${Number(c.total_tarjeta ?? 0).toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">P.Móvil</p>
                            <p className="font-black text-purple-400 text-sm">{Number(c.total_pagomovil_bs ?? 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</p>
                            <p className="text-[10px] text-zinc-600">${Number(c.total_pagomovil ?? 0).toFixed(2)}</p>
                          </div>
                          <div className="w-px h-10 bg-zinc-800" />
                          <div className="text-right min-w-[90px]">
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Total</p>
                            <p className="font-black text-white text-lg">${Number(c.grand_total).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit_log' && (
          <AuditLogView />
        )}

        {activeTab === 'cajeras' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black">Cajeras</h2>
                <p className="text-admin-text-muted text-sm">{cashiers.length} cajera(s) registradas</p>
              </div>
              {isSuperAdmin && (
                <button onClick={() => setIsAddingCashier(true)}
                  className="bg-primary-vibrant hover:scale-105 active:scale-95 transition-transform text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-primary-vibrant/20"
                >
                  <Plus className="w-4 h-4" /> Nueva Cajera
                </button>
              )}
            </div>
            {cashiersLoading ? (
              <div className="text-center py-16 text-admin-muted text-sm animate-pulse">Cargando...</div>
            ) : cashiers.length === 0 ? (
              <div className="text-center py-16 text-admin-muted text-sm">No hay cajeras registradas</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cashiers.map(c => {
                  const locName = locations.find(l => l.id === c.location_id)?.name;
                  return (
                    <motion.div layoutId={c.id} key={c.id}
                      className="bg-admin-surface border border-admin-border rounded-2xl p-8 flex flex-col justify-between group overflow-hidden"
                    >
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center border border-admin-border shadow-xl">
                            <Key className="w-7 h-7 text-zinc-500" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingCashier(c)} className="p-2 hover:bg-admin-border rounded-xl text-admin-muted transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isSuperAdmin && (
                              <button onClick={() => setConfirmDeleteCashier(c.id)} className="p-2 hover:bg-red-500/10 text-red-500/50 hover:text-red-500 rounded-xl transition-all">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-2xl font-black">{c.name}</h3>
                            <p className="text-admin-text-muted text-xs mt-0.5">{c.email}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {c.employee_id && (
                              <div className="bg-admin-bg p-3 rounded-2xl border border-admin-border/50">
                                <div className="flex items-center gap-1.5 mb-1 opacity-50">
                                  <span className="text-[8px] font-black uppercase tracking-widest">ID</span>
                                </div>
                                <p className="text-xs font-black text-admin-text">{c.employee_id}</p>
                              </div>
                            )}
                            <div className="bg-admin-bg p-3 rounded-2xl border border-admin-border/50">
                              <div className="flex items-center gap-1.5 mb-1 opacity-50">
                                <span className="text-[8px] font-black uppercase tracking-widest">PIN</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-black text-admin-text">
                                  {showPin === c.id ? c.pin : '****'}
                                </span>
                                <button onClick={() => setShowPin(showPin === c.id ? null : c.id)}
                                  className="text-zinc-600 hover:text-white transition-all">
                                  {showPin === c.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                            {locName && (
                              <div className="bg-admin-bg p-3 rounded-2xl border border-admin-border/50 col-span-2">
                                <div className="flex items-center gap-1.5 mb-1 opacity-50">
                                  <MapPin className="w-3 h-3" />
                                  <span className="text-[8px] font-black uppercase tracking-widest">Sede</span>
                                </div>
                                <p className="text-xs font-black text-admin-text">{locName}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            orders={orders}
            locations={locations}
            menuItems={menuItems}
            totalFacturado={totalFacturado}
            config={config}
          />
        )}

        {activeTab === 'reporte' && (
          <ReporteDiario
            orders={orders}
            locations={locations}
            menuItems={menuItems}
            cashiers={cashiers}
          />
        )}
      </div>
    </div>

    <AnimatePresence>
      {(isAddingLoc || editingLoc) && (
        <LocationForm
          location={editingLoc || undefined}
          isSuperAdmin={isSuperAdmin}
          onClose={() => { setEditingLoc(null); setIsAddingLoc(false); }}
          onSave={updateLocation}
          createLocationAdmin={createLocationAdmin}
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
      {(isAddingCashier || editingCashier) && (
        <CashierForm
          cashier={editingCashier || undefined}
          onClose={() => { setEditingCashier(null); setIsAddingCashier(false); }}
          onSaved={fetchCashiers}
        />
      )}
      {confirmDeleteCashier && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setConfirmDeleteCashier(null)} />
          <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-primary-vibrant/10 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-primary-vibrant" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Eliminar Cajera</h3>
              <p className="text-zinc-400 text-sm">¿Estás seguro? No se podrá recuperar.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteCashier(null)}
                className="flex-1 py-3 rounded-2xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700 transition-colors">Cancelar</button>
              <button onClick={() => handleDeleteCashier(confirmDeleteCashier)}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">Eliminar</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </main>
);}

export default AdminPage;