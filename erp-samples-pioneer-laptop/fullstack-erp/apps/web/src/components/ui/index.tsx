import { cn } from '../../lib/utils';

// ── Badge ──────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted'; className?: string; }
export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', {
      'bg-primary/10 text-primary': variant === 'default',
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': variant === 'warning',
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': variant === 'danger',
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': variant === 'info',
      'bg-muted text-muted-foreground': variant === 'muted',
    }, className)}>
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('bg-card border border-border rounded-xl', className)}>{children}</div>;
}
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4 border-b border-border flex items-center justify-between gap-3', className)}>{children}</div>;
}
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('font-semibold text-foreground text-sm', className)}>{children}</h3>;
}
export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

// ── Table ──────────────────────────────────────────────
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('overflow-x-auto', className)}><table className="w-full text-sm">{children}</table></div>;
}
export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-border"><tr>{children}</tr></thead>;
}
export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap', className)}>{children}</th>;
}
export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}
export function Tr({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <tr onClick={onClick} className={cn('hover:bg-muted/40 transition-colors', onClick && 'cursor-pointer', className)}>{children}</tr>;
}
export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 text-foreground', className)}>{children}</td>;
}

// ── Input ──────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-foreground">{label}</label>}
      <input className={cn('w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow', error && 'border-destructive', className)} {...props} />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

// ── Select ──────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: { value: string; label: string }[]; placeholder?: string; }
export function Select({ label, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-foreground">{label}</label>}
      <select className={cn('w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Button ──────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; loading?: boolean; }
export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button disabled={disabled || loading} className={cn('inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-colors disabled:opacity-60',
      { 'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary', 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border': variant === 'secondary', 'hover:bg-muted text-foreground': variant === 'ghost', 'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'danger' },
      { 'px-3 py-1.5 text-xs': size === 'sm', 'px-4 py-2 text-sm': size === 'md' },
      className)} {...props}>
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ── PageHeader ──────────────────────────────────────────────
export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground text-sm mt-0.5">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

// ── EmptyState ──────────────────────────────────────────────
export function EmptyState({ icon, title, description }: { icon?: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-muted-foreground/40 mb-3">{icon}</div>}
      <p className="text-foreground font-medium text-sm">{title}</p>
      {description && <p className="text-muted-foreground text-sm mt-1 max-w-xs">{description}</p>}
    </div>
  );
}

// ── LoadingSpinner ──────────────────────────────────────────────
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── KpiCard ──────────────────────────────────────────────
export function KpiCard({ title, value, sub, icon, trend }: { title: string; value: string | number; sub?: string; icon?: React.ReactNode; trend?: { value: number; label: string } }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-semibold text-foreground mt-1 leading-none">{value}</p>
            {sub && <p className="text-muted-foreground text-xs mt-1.5">{sub}</p>}
            {trend && (
              <p className={cn('text-xs mt-1.5 font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
                {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          {icon && <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── StatusBadge for common ERP statuses ──────────────────────────────────────────────
const statusMap: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  DRAFT: { label: 'Draft', variant: 'muted' },
  CONFIRMED: { label: 'Confirmed', variant: 'info' },
  IN_PROGRESS: { label: 'In Progress', variant: 'warning' },
  IN_PRODUCTION: { label: 'In Production', variant: 'warning' },
  DONE: { label: 'Done', variant: 'success' },
  DELIVERED: { label: 'Delivered', variant: 'success' },
  INVOICED: { label: 'Invoiced', variant: 'success' },
  PAID: { label: 'Paid', variant: 'success' },
  PARTIAL_PAID: { label: 'Partial Paid', variant: 'warning' },
  OVERDUE: { label: 'Overdue', variant: 'danger' },
  CANCELLED: { label: 'Cancelled', variant: 'danger' },
  SENT: { label: 'Sent', variant: 'info' },
  RECEIVED: { label: 'Received', variant: 'success' },
  ACTIVE: { label: 'Active', variant: 'success' },
  INACTIVE: { label: 'Inactive', variant: 'muted' },
  PENDING: { label: 'Pending', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  READY: { label: 'Ready', variant: 'success' },
};
export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] || { label: status, variant: 'muted' as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
