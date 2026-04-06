import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface StatusPanelProps {
  variant: 'success' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles = {
  success: {
    border: 'border-l-4 border-l-positive',
    bg: 'bg-positive/5',
    icon: CheckCircle,
    iconColor: 'text-positive',
    role: 'status' as const,
  },
  warning: {
    border: 'border-l-4 border-l-negative',
    bg: 'bg-negative/5',
    icon: AlertTriangle,
    iconColor: 'text-negative',
    role: 'alert' as const,
  },
  info: {
    border: 'border-l-4 border-l-navy-400',
    bg: 'bg-navy-50',
    icon: Info,
    iconColor: 'text-navy-600',
    role: 'status' as const,
  },
};

export function StatusPanel({ variant, title, children, onDismiss, className }: StatusPanelProps) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      role={styles.role}
      className={cn(
        'rounded-lg p-4',
        styles.border,
        styles.bg,
        className
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', styles.iconColor)} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          {title && (
            <p className="type-body-sm font-semibold mb-1">{title}</p>
          )}
          <div className="type-body-sm text-muted-foreground">{children}</div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
