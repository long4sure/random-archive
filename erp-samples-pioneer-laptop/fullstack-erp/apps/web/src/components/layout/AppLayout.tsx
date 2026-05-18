import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Users,
  TruckIcon, Building2, Receipt, BookOpen, UserCheck,
  DollarSign, Cog, GitBranch, ChevronDown, ChevronRight,
  LogOut, Bell, Search, Menu, X, Factory, BarChart3
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { label: string; href: string }[];
}

const navigation: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/dashboard' },
  {
    label: 'Inventory',
    icon: <Package size={16} />,
    children: [
      { label: 'Products', href: '/inventory/products' },
      { label: 'Warehouse', href: '/inventory/warehouse' },
    ],
  },
  {
    label: 'Sales & CRM',
    icon: <ShoppingCart size={16} />,
    children: [
      { label: 'Sale Orders', href: '/sales/orders' },
      { label: 'Customers', href: '/sales/customers' },
    ],
  },
  {
    label: 'Purchasing',
    icon: <TruckIcon size={16} />,
    children: [
      { label: 'Purchase Orders', href: '/purchasing/orders' },
      { label: 'Vendors', href: '/purchasing/vendors' },
    ],
  },
  {
    label: 'Finance',
    icon: <DollarSign size={16} />,
    children: [
      { label: 'Invoices', href: '/finance/invoices' },
      { label: 'Chart of Accounts', href: '/finance/accounts' },
    ],
  },
  {
    label: 'HR & Payroll',
    icon: <UserCheck size={16} />,
    children: [
      { label: 'Employees', href: '/hr/employees' },
      { label: 'Payroll Runs', href: '/hr/payroll' },
    ],
  },
  {
    label: 'Production',
    icon: <Factory size={16} />,
    children: [
      { label: 'Work Orders', href: '/production/work-orders' },
      { label: 'Bill of Materials', href: '/production/boms' },
    ],
  },
];

function SidebarItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);

  if (item.href) {
    return (
      <NavLink
        to={item.href}
        className={({ isActive }) =>
          cn('flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
            isActive
              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50')
        }
      >
        {item.icon}
        {item.label}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
      >
        {item.icon}
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div className="ml-6 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-3">
          {item.children?.map((child) => (
            <NavLink
              key={child.href}
              to={child.href}
              className={({ isActive }) =>
                cn('block px-2 py-1.5 rounded text-sm transition-colors',
                  isActive
                    ? 'text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground')
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0',
        sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border shrink-0">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <Factory size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sidebar-foreground font-semibold text-sm leading-none">ManufactureOS</p>
            <p className="text-sidebar-foreground/40 text-[10px] mt-0.5">ERP System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-0.5">
          {navigation.map((item) => (
            <SidebarItem key={item.label} item={item} />
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground text-xs font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-sidebar-foreground/40 text-[10px] truncate">{user?.role?.replace('_', ' ')}</p>
            </div>
            <button onClick={handleLogout} className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-1">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-12 border-b border-border bg-card flex items-center gap-3 px-4 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground transition-colors">
            <Menu size={16} />
          </button>
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 max-w-sm">
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input placeholder="Search..." className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={15} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
