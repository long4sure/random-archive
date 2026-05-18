import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Users, Package, TruckIcon, Factory, DollarSign, AlertTriangle, UserCheck } from 'lucide-react';
import api from '../lib/api';
import { KpiCard, Card, CardHeader, CardTitle, CardContent, Table, Thead, Th, Tbody, Tr, Td, StatusBadge, LoadingSpinner } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/utils';

export default function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => api.get('/dashboard/kpis').then(r => r.data.data),
  });
  const { data: recentOrders } = useQuery({
    queryKey: ['dashboard-orders'],
    queryFn: () => api.get('/dashboard/recent-orders').then(r => r.data.data),
  });
  const { data: revenueChart } = useQuery({
    queryKey: ['dashboard-revenue'],
    queryFn: () => api.get('/dashboard/revenue-chart').then(r => r.data.data),
  });

  if (kpisLoading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manufacturing operations overview</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(kpis?.monthRevenue || 0)}
          icon={<DollarSign size={16} />}
          trend={kpis?.revenueGrowth !== undefined ? { value: kpis.revenueGrowth, label: 'vs last month' } : undefined}
        />
        <KpiCard
          title="Active Orders"
          value={kpis?.activeOrders || 0}
          sub="Confirmed + in production"
          icon={<ShoppingCart size={16} />}
        />
        <KpiCard
          title="Open POs"
          value={kpis?.openPOs || 0}
          sub="Awaiting delivery"
          icon={<TruckIcon size={16} />}
        />
        <KpiCard
          title="Active Employees"
          value={kpis?.activeEmployees || 0}
          icon={<UserCheck size={16} />}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Products" value={kpis?.products || 0} icon={<Package size={16} />} />
        <KpiCard title="Customers" value={kpis?.customers || 0} icon={<Users size={16} />} />
        <KpiCard
          title="Work Orders"
          value={(kpis?.workOrders?.inProgress || 0) + (kpis?.workOrders?.confirmed || 0)}
          sub={`${kpis?.workOrders?.inProgress || 0} in progress`}
          icon={<Factory size={16} />}
        />
        {(kpis?.overdueInvoices || 0) > 0
          ? <KpiCard title="Overdue Invoices" value={kpis?.overdueInvoices} sub="Needs attention" icon={<AlertTriangle size={16} />} />
          : <KpiCard title="Vendors" value={kpis?.vendors || 0} icon={<TruckIcon size={16} />} />
        }
      </div>

      {/* Charts + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChart || []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(221 83% 53%)" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Work Order Status */}
        <Card>
          <CardHeader><CardTitle>Work Orders</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 mt-1">
              {[
                { label: 'Draft', value: kpis?.workOrders?.draft || 0, color: 'bg-muted-foreground/30' },
                { label: 'Confirmed', value: kpis?.workOrders?.confirmed || 0, color: 'bg-blue-500' },
                { label: 'In Progress', value: kpis?.workOrders?.inProgress || 0, color: 'bg-yellow-500' },
              ].map(item => {
                const total = (kpis?.workOrders?.draft || 0) + (kpis?.workOrders?.confirmed || 0) + (kpis?.workOrders?.inProgress || 0) || 1;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-foreground">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${Math.round((item.value / total) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alerts</p>
              {(kpis?.overdueInvoices || 0) > 0 && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle size={13} />
                  <span>{kpis.overdueInvoices} overdue invoice{kpis.overdueInvoices > 1 ? 's' : ''}</span>
                </div>
              )}
              {(kpis?.overdueInvoices || 0) === 0 && (
                <p className="text-xs text-muted-foreground">No alerts — all clear ✓</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sale Orders</CardTitle>
        </CardHeader>
        <Table>
          <Thead>
            <Th>Reference</Th>
            <Th>Customer</Th>
            <Th>Date</Th>
            <Th>Lines</Th>
            <Th>Total</Th>
            <Th>Status</Th>
          </Thead>
          <Tbody>
            {(recentOrders || []).map((order: any) => (
              <Tr key={order.id}>
                <Td><span className="font-mono text-xs text-primary">{order.reference}</span></Td>
                <Td className="font-medium">{order.customer?.name}</Td>
                <Td className="text-muted-foreground">{formatDate(order.orderDate)}</Td>
                <Td className="text-muted-foreground">{order.lines?.length || 0}</Td>
                <Td className="font-medium">{formatCurrency(order.totalAmount)}</Td>
                <Td><StatusBadge status={order.status} /></Td>
              </Tr>
            ))}
            {(!recentOrders || recentOrders.length === 0) && (
              <Tr><Td colSpan={6} className="text-center text-muted-foreground py-8">No orders yet</Td></Tr>
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
