import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-admin-border rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Icon className="w-10 h-10 text-admin-muted" />
      </div>
      <h3 className="text-xl font-black text-admin-text-muted">{title}</h3>
      {description && <p className="text-admin-muted text-sm mt-2 max-w-sm mx-auto">{description}</p>}
      {action && (
        <button onClick={action.onClick}
          className="mt-6 px-6 py-3 bg-primary-vibrant text-white rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all">
          {action.label}
        </button>
      )}
    </div>
  );
}