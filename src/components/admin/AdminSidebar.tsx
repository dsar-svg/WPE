import { useMemo, useState } from 'react';
import {
  LayoutDashboard, MapPin, Utensils, Settings, ShoppingBag,
  LogOut, ChevronRight, User, Users, DollarSign, Calendar, Search, History, BarChart3
} from 'lucide-react';
import { RestaurantConfig } from '../../types';
import { BrandName } from '../ui/BrandName';

export type AdminPageTab = 'dashboard' | 'sedes' | 'productos' | 'ajustes' | 'pedidos' | 'cajeras' | 'finanzas' | 'cortes' | 'audit_log' | 'daily_report';

interface AdminSidebarProps {
  activeTab: AdminPageTab;
  onTabChange: (tab: AdminPageTab) => void;
  config: RestaurantConfig;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
  isSuperAdmin?: boolean;
  isOpen?: boolean;
}

const navItems: { id: AdminPageTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sedes', label: 'Sedes', icon: MapPin },
  { id: 'productos', label: 'Productos', icon: Utensils },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  { id: 'daily_report', label: 'Reporte Diario', icon: BarChart3 },
  { id: 'cortes', label: 'Cortes', icon: Calendar },
  { id: 'audit_log', label: 'Auditoría', icon: History },
  { id: 'cajeras', label: 'Cajeras', icon: Users },
  { id: 'finanzas', label: 'Finanzas', icon: DollarSign },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
];

export function AdminSidebar({
  activeTab,
  onTabChange,
  config,
  userEmail,
  onLogout,
  isSuperAdmin = true,
  isOpen = false,
}: AdminSidebarProps) {
  const [search, setSearch] = useState('');

  const visibleNavItems = useMemo(() => {
    let items = isSuperAdmin ? navItems : navItems.filter(item => item.id !== 'sedes' && item.id !== 'ajustes' && item.id !== 'cajeras' && item.id !== 'finanzas' && item.id !== 'audit_log');
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(item => item.label.toLowerCase().includes(q));
    }
    return items;
  }, [isSuperAdmin, search]);

  return (
    <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-admin-surface border-r border-admin-border z-50 flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="p-6 border-b border-admin-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shrink-0">
              {config.logo ? (
                <img src={config.logo} alt="Logo" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
              ) : (
                <Utensils className="w-5 h-5 text-admin-bg" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-admin-text truncate">
                {config.name ? <BrandName className="text-sm" /> : 'Panel Admin'}
              </h1>
              <p className="text-[9px] text-admin-text-muted uppercase tracking-widest font-bold">
                Administración
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-admin-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar sección..."
            className="w-full pl-9 pr-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-[11px] text-admin-text placeholder:text-admin-muted focus:border-primary-vibrant/50 outline-none transition-colors"
          />
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                isActive
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-admin-muted hover:text-admin-text hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-admin-border">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-xl border border-admin-border bg-admin-surface flex items-center justify-center">
            <User className="w-4 h-4 text-admin-muted" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black text-admin-text truncate">
              {userEmail?.split('@')[0] || 'Admin'}
            </p>
            <p className="text-[8px] text-admin-text-muted truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-admin-border hover:bg-red-500/10 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-admin-text-muted transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}