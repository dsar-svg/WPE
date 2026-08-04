import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, MapPin, Clock, MessageCircle, Power, RefreshCcw, Plus, Trash2, Tag, Edit2, Eye, EyeOff, Menu, X, Key, AlertTriangle, Printer, ChevronDown, ChevronRight, Truck, Store, Banknote, CreditCard, Smartphone, DollarSign, Loader2 } from 'lucide-react';
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
import { AuditLogView } from '../components/admin/AuditLogView';
import { DailyReportView } from '../components/admin/DailyReportView';
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
const [activeTab, setActiveTab] = useState<'dashboard' | 'sedes' | 'productos' | 'ajustes' | 'pedidos' | 'cajeras' | 'finanzas' | 'cortes' | 'audit_log' | 'daily_report'>('dashboard');

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
const [cortesFilterDate, setCortesFilterDate] = useState('');
const [cortesFilterCashier, setCortesFilterCashier] = useState('');
const [expandedCorteId, setExpandedCorteId] = useState<string | null>(null);
const [corteOrdersMap, setCorteOrdersMap] = useState<Record<string, any[]>>({});
const [corteOrdersLoadingId, setCorteOrdersLoadingId] = useState<string | null>(null);
const [showBsPrimary, setShowBsPrimary] = useState(false);

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
  if (activeTab === 'cajeras') fetchCashiers();
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

        {activeTab === 'cortes' && (() => {
          const uniqueCashiers = [...new Set(cortesData.map(c => c.cashier_name).filter(Boolean))];
          const filteredCortes = cortesData.filter(c => {
            if (cortesFilterDate && c.date !== cortesFilterDate) return false;
            if (cortesFilterCashier && c.cashier_name !== cortesFilterCashier) return false;
            return true;
          });
          const formatBs = (v: number) => v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          const handleExpandCorte = async (c: any) => {
            if (expandedCorteId === c.id) { setExpandedCorteId(null); return; }
            setExpandedCorteId(c.id);
            if (corteOrdersMap[c.id]) return;
            setCorteOrdersLoadingId(c.id);
            const { data } = await supabase.from('orders')
              .select('id, total, customer_name, delivery_type, payment_method, payment_currency, created_at')
              .eq('cashier_id', c.cashier_id)
              .eq('location_id', c.location_id)
              .eq('status', 'exitoso')
              .gte('created_at', c.from_date)
              .lte('created_at', c.closed_at)
              .order('created_at');
            setCorteOrdersMap(prev => ({ ...prev, [c.id]: data || [] }));
            setCorteOrdersLoadingId(null);
          };

          const handleCorteReprint = (c: any) => {
            const efectivoUsd = Number(c.total_efectivo_usd ?? 0);
            const efectivoBs = Number(c.total_efectivo_bs ?? 0);
            const tarjetaBs = Number(c.total_tarjeta_bs ?? 0);
            const pagomovilBs = Number(c.total_pagomovil_bs ?? 0);
            const locName = locations.find(l => l.id === c.location_id)?.name || '';
            const receiptHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Corte de Caja</title>
<style>
@media print { @page { size: 80mm auto; margin: 0; } body { margin: 0; padding: 0; } }
* { font-family: Arial, Helvetica, sans-serif !important; }
body { font-size: 10px; width: 270px; margin: 0 auto; padding: 8px 5px; color: #000; line-height: 1.2; }
.text-center { text-align: center; } .text-right { text-align: right; } .bold { font-weight: bold; }
.header-title { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
.header-sub { font-size: 9px; margin: 1px 0; }
.divider { border-top: 1px dashed #000; margin: 5px 0; }
table { width: 100%; border-collapse: collapse; } td { padding: 1.5px 0; font-size: 9px; } td.r { text-align: right; }
.total-row td { font-weight: bold; font-size: 10px; }
.section-title { font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
</style></head><body>
<div class="text-center">
  <div class="header-title">CORTE DE CAJA</div>
  <div class="header-sub bold">${locName}</div>
  <div class="header-sub">${new Date(c.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })} ${new Date(c.closed_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</div>
  <div class="header-sub">Cajero: ${c.cashier_name}</div>
</div>
<div class="divider"></div>
<table>
  <tr><td>Pedidos</td><td class="r bold">${c.order_count}</td></tr>
</table>
<div class="divider"></div>
<div class="section-title">M&Eacute;TODO DE PAGO</div>
<table>
  <tr><td>Efectivo $</td><td class="r">$${efectivoUsd.toFixed(2)}</td></tr>
  <tr><td>Efectivo Bs</td><td class="r">Bs ${formatBs(efectivoBs)}</td></tr>
  <tr><td>Tarjeta</td><td class="r">Bs ${formatBs(tarjetaBs)}</td></tr>
  <tr><td>Pago M&oacute;vil</td><td class="r">Bs ${formatBs(pagomovilBs)}</td></tr>
</table>
<div class="divider"></div>
<table>
  <tr class="total-row"><td>TOTAL</td><td class="r">$${Number(c.grand_total).toFixed(2)}</td></tr>
</table>
<div class="divider"></div>
<p class="text-center" style="font-size:8px">Cerrado: ${new Date(c.closed_at).toLocaleString('es-VE')}</p>
</body></html>`;
            const w = window.open('', '_blank', 'width=320,height=600');
            if (w) { w.document.write(receiptHtml); w.document.close(); setTimeout(() => { w.print(); w.close(); }, 400); }
          };

          return (
          <div>
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">Cortes de Caja</h2>
                  <p className="text-admin-text-muted text-sm">
                    {filteredCortes.length} de {cortesData.length} corte(s)
                  </p>
                </div>
                <button onClick={() => setShowBsPrimary(p => !p)}
                  className="self-start bg-admin-surface border border-admin-border rounded-xl px-4 py-2 text-xs font-bold text-admin-text hover:border-admin-primary transition-colors"
                >
                  {showBsPrimary ? 'Bs primario' : 'USD primario'}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                <input type="date" value={cortesFilterDate} onChange={e => setCortesFilterDate(e.target.value)}
                  className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2 text-sm font-bold text-admin-text outline-none"
                />
                <select value={cortesFilterCashier} onChange={e => setCortesFilterCashier(e.target.value)}
                  className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2 text-sm font-bold text-admin-text outline-none"
                >
                  <option value="">Todos los cajeros</option>
                  {uniqueCashiers.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                {isSuperAdmin && locations.length > 1 && (
                  <select value={cortesFilterLoc} onChange={e => setCortesFilterLoc(e.target.value)}
                    className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2 text-sm font-bold text-admin-text outline-none"
                  >
                    <option value="">Todas las sedes</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                )}
                {(cortesFilterDate || cortesFilterCashier || cortesFilterLoc) && (
                  <button onClick={() => { setCortesFilterDate(''); setCortesFilterCashier(''); setCortesFilterLoc(''); }}
                    className="bg-admin-surface border border-admin-border rounded-xl px-4 py-2 text-xs font-bold text-admin-text-muted hover:text-admin-text hover:border-admin-primary/50 transition-all"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
            {cortesLoading ? (
              <div className="text-center py-16 text-admin-muted text-sm animate-pulse">Cargando...</div>
            ) : filteredCortes.length === 0 ? (
              <div className="text-center py-16 text-admin-muted text-sm">No hay cortes registrados</div>
            ) : (
              <div className="space-y-3">
                {filteredCortes.map(c => {
                  const locName = locations.find(l => l.id === c.location_id)?.name;
                  const fromTime = c.from_date ? new Date(c.from_date).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : null;
                  const toTime = new Date(c.closed_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
                  const isExpanded = expandedCorteId === c.id;
                  const corteOrders = corteOrdersMap[c.id] || [];
                  const isLoadingOrders = corteOrdersLoadingId === c.id;
                  const efectivoUsd = Number(c.total_efectivo_usd ?? 0);
                  const efectivoBs = Number(c.total_efectivo_bs ?? 0);
                  const tarjetaBs = Number(c.total_tarjeta_bs ?? 0);
                  const pagomovilBs = Number(c.total_pagomovil_bs ?? 0);
                  const deliveryCount = corteOrders.filter(o => o.delivery_type === 'Delivery').length;
                  const pickupCount = corteOrders.filter(o => o.delivery_type === 'Pick-up').length;
                  const eUsdVal = efectivoUsd;
                  const eBsVal = efectivoBs;
                  const tBsVal = tarjetaBs;
                  const pmBsVal = pagomovilBs;

                  return (
                    <div key={c.id}
                      className={`bg-admin-surface border rounded-2xl transition-all ${isExpanded ? 'border-admin-primary/50 shadow-lg shadow-admin-primary/5' : 'border-admin-border hover:border-admin-border/50'}`}
                    >
                      <button onClick={() => handleExpandCorte(c)}
                        className="w-full text-left p-6"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-admin-text-muted flex-shrink-0">{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-admin-text">
                                  {new Date(c.closed_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                                {fromTime && <span className="text-[10px] text-admin-text-muted">{fromTime} — {toTime}</span>}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-admin-text-muted">
                                {isSuperAdmin && locName && <span className="font-bold text-admin-text">{locName}</span>}
                                <span>Cajero: <span className="font-bold text-admin-text">{c.cashier_name}</span></span>
                                <span>{c.order_count} pedido(s)</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-[10px] text-admin-text-muted uppercase tracking-widest font-bold">Efectivo</p>
                              {showBsPrimary ? (
                                <>
                                  <p className="font-black text-green-400 text-sm">{formatBs(eBsVal)} Bs</p>
                                  <p className="text-[10px] text-admin-text-muted">${eUsdVal.toFixed(2)}</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-black text-green-400 text-sm">${eUsdVal.toFixed(2)}</p>
                                  <p className="text-[10px] text-admin-text-muted">{formatBs(eBsVal)} Bs</p>
                                </>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-admin-text-muted uppercase tracking-widest font-bold">Tarjeta</p>
                              {showBsPrimary ? (
                                <>
                                  <p className="font-black text-blue-400 text-sm">{formatBs(tBsVal)} Bs</p>
                                  <p className="text-[10px] text-admin-text-muted">${(tBsVal / config.exchangeRate).toFixed(2)}</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-black text-blue-400 text-sm">${(tBsVal / config.exchangeRate).toFixed(2)}</p>
                                  <p className="text-[10px] text-admin-text-muted">{formatBs(tBsVal)} Bs</p>
                                </>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-admin-text-muted uppercase tracking-widest font-bold">P.Móvil</p>
                              {showBsPrimary ? (
                                <>
                                  <p className="font-black text-purple-400 text-sm">{formatBs(pmBsVal)} Bs</p>
                                  <p className="text-[10px] text-admin-text-muted">${(pmBsVal / config.exchangeRate).toFixed(2)}</p>
                                </>
                              ) : (
                                <>
                                  <p className="font-black text-purple-400 text-sm">${(pmBsVal / config.exchangeRate).toFixed(2)}</p>
                                  <p className="text-[10px] text-admin-text-muted">{formatBs(pmBsVal)} Bs</p>
                                </>
                              )}
                            </div>
                            <div className="w-px h-10 bg-admin-border" />
                            <div className="text-right min-w-[90px]">
                              <p className="text-[10px] text-admin-text-muted uppercase tracking-widest font-bold">Total</p>
                              <p className="font-black text-admin-text text-lg">${Number(c.grand_total).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-6 space-y-4 border-t border-admin-border pt-4">
                          <div className="flex items-center justify-between">
                            <div className="text-[11px] text-admin-text-muted font-bold">
                              {fromTime} — {toTime}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleCorteReprint(c); }}
                              className="p-2 bg-admin-surface border border-admin-border rounded-xl text-admin-text-muted hover:text-admin-text hover:border-admin-primary/50 transition-all"
                              title="Reimprimir"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>

                          {isLoadingOrders ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-admin-text-muted text-sm">
                              <Loader2 className="w-4 h-4 animate-spin" /> Cargando pedidos...
                            </div>
                          ) : corteOrders.length > 0 ? (
                            <>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-admin-surface border border-admin-border rounded-xl p-3 text-center">
                                  <p className="text-xl font-black text-admin-text">{corteOrders.length}</p>
                                  <p className="text-[9px] text-admin-text-muted uppercase tracking-widest font-bold">Pedidos</p>
                                </div>
                                <div className="bg-admin-surface border border-admin-border rounded-xl p-3 text-center">
                                  <Truck className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                  <p className="text-xl font-black text-admin-text">{deliveryCount}</p>
                                  <p className="text-[9px] text-admin-text-muted uppercase tracking-widest font-bold">Delivery</p>
                                </div>
                                <div className="bg-admin-surface border border-admin-border rounded-xl p-3 text-center">
                                  <Store className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                                  <p className="text-xl font-black text-admin-text">{pickupCount}</p>
                                  <p className="text-[9px] text-admin-text-muted uppercase tracking-widest font-bold">Local</p>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Método de pago</p>
                                {[
                                  { label: 'Efectivo $', usd: eUsdVal, bs: eUsdVal * config.exchangeRate, color: 'text-green-400', showAs: 'usd' as const },
                                  { label: 'Efectivo Bs', usd: null, bs: eBsVal, color: 'text-yellow-400', showAs: 'bs' as const },
                                  { label: 'Tarjeta', usd: tBsVal / config.exchangeRate, bs: tBsVal, color: 'text-blue-400', showAs: 'bs' as const },
                                  { label: 'P.Móvil', usd: pmBsVal / config.exchangeRate, bs: pmBsVal, color: 'text-purple-400', showAs: 'bs' as const },
                                ].filter(x => x.bs > 0 || (x.usd !== null && x.usd > 0)).map(({ label, usd, bs, color, showAs }) => (
                                  <div key={label} className="flex items-center justify-between bg-admin-surface border border-admin-border p-2.5 rounded-xl text-xs">
                                    <span className="text-admin-text-muted font-bold">{label}</span>
                                    <div className="text-right">
                                      {showAs === 'bs' ? (
                                        <>
                                          <span className={`font-black ${color}`}>${usd !== null ? usd.toFixed(2) : (bs / config.exchangeRate).toFixed(2)}</span>
                                          <span className={`font-bold ${color} text-[10px] ml-1`}>Bs {formatBs(bs)}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className={`font-black ${color}`}>${usd !== null ? usd.toFixed(2) : '0.00'}</span>
                                          <span className={`font-bold ${color} text-[10px] ml-1`}>Bs {formatBs(bs)}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="space-y-1 max-h-60 overflow-y-auto">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted sticky top-0 bg-admin-surface pb-1">Pedidos ({corteOrders.length})</p>
                                {corteOrders.map(o => (
                                  <div key={o.id} className="flex items-center justify-between text-[11px] text-admin-text-muted bg-admin-surface border border-admin-border p-2 rounded-lg gap-2">
                                    <span className="text-admin-text-muted w-12 flex-shrink-0">{new Date(o.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="truncate flex-1 font-bold text-admin-text">{o.customer_name}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${o.delivery_type === 'Delivery' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>{o.delivery_type === 'Delivery' ? 'DEL' : 'LOCAL'}</span>
                                    <span className="font-bold text-admin-text w-16 text-right">${o.total.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-4 text-admin-text-muted text-xs">Sin datos de pedidos</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })()}

        {activeTab === 'audit_log' && (
          <AuditLogView />
        )}

        {activeTab === 'daily_report' && (
          <DailyReportView orders={orders} locations={locations} config={config} />
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