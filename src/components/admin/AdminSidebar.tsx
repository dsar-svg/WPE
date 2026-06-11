import { motion } from 'motion/react';
import {
  LayoutDashboard, MapPin, Utensils, Settings, ShoppingBag,
  LogOut, ChevronRight, User
} from 'lucide-react';
import { RestaurantConfig } from '../../types';

export type AdminPageTab = 'dashboard' | 'sedes' | 'productos' | 'ajustes' | 'pedidos';

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
}

const navItems: { id: AdminPageTab; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'sedes', label: 'Sedes', icon: MapPin },
  { id: 'productos', label: 'Productos', icon: Utensils },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingBag },
  { id: 'ajustes', label: 'Ajustes', icon: Settings },
];

export function AdminSidebar({
  activeTab,
  onTabChange,
  config,
  userEmail,
  userName,
  userAvatar,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shrink-0">
            {config.logo ? (
              <img src={config.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Utensils className="w-5 h-5 text-zinc-800" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white truncate">
              {config.name || 'Panel Admin'}
            </h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
              Administración
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                isActive
                  ? 'bg-white text-black shadow-lg shadow-white/10'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-xl border border-zinc-700 bg-zinc-800 flex items-center justify-center">
            <User className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black text-zinc-300 truncate">
              {userEmail?.split('@')[0] || 'Admin'}
            </p>
            <p className="text-[8px] text-zinc-600 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
