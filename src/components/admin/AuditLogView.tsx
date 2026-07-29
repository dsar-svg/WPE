import { useEffect, useState } from 'react';
import { History, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AuditLogEntry } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { TableSkeleton } from '../ui/Skeleton';

export function AuditLogView() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      setLogs(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = search.trim()
    ? logs.filter(l =>
        l.user_email.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entity_type.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const actionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Creó';
      case 'update': return 'Editó';
      case 'delete': return 'Eliminó';
      default: return action;
    }
  };

  const entityLabel = (type: string) => {
    switch (type) {
      case 'product': return 'Producto';
      case 'location': return 'Sede';
      case 'category': return 'Categoría';
      case 'order': return 'Pedido';
      case 'config': return 'Configuración';
      case 'cashier': return 'Cajera';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Auditoría</h2>
          <p className="text-admin-muted text-sm">{filtered.length} registro(s)</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en auditoría..."
            className="w-full pl-10 pr-4 py-2.5 bg-admin-surface border border-admin-border rounded-xl text-sm text-admin-text placeholder:text-admin-muted focus:border-primary-vibrant/50 outline-none transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={History} title="Sin registros"
          description={search ? 'Ningún registro coincide con la búsqueda.' : 'Aún no hay actividad registrada en el panel.'} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-admin-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-admin-surface border-b border-admin-border">
                <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Fecha</th>
                <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Usuario</th>
                <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Acción</th>
                <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Entidad</th>
                <th className="text-left p-4 font-bold text-admin-muted uppercase tracking-[0.15em] text-[11px]">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border/50">
              {filtered.map(log => (
                <tr key={log.id} className="bg-admin-surface/30 hover:bg-admin-border/40 transition-colors">
                  <td className="p-4 text-[11px] text-admin-muted whitespace-nowrap">
                    {new Date(log.created_at).toLocaleDateString('es-VE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4"><span className="font-bold text-admin-text text-xs">{log.user_email}</span></td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                      log.action === 'delete' ? 'bg-red-500/10 text-red-400' :
                      log.action === 'create' ? 'bg-green-500/10 text-green-400' :
                      'bg-secondary-vibrant/10 text-secondary-vibrant'
                    }`}>{actionLabel(log.action)}</span>
                  </td>
                  <td className="p-4 text-xs text-admin-muted">{entityLabel(log.entity_type)}</td>
                  <td className="p-4 text-xs text-admin-muted max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details).slice(0, 100) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}