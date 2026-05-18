import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Plus } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Table, Thead, Th, Tbody, Tr, Td, Button, StatusBadge, LoadingSpinner, EmptyState, Select } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PRODUCTION', label: 'In Production' },
  { value: 'READY', label: 'Ready' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'INVOICED', label: 'Invoiced' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function SaleOrdersPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['sale-orders', status, page],
    queryFn: () => api.get('/sales/orders', { params: { status, page, limit: 20 } }).then(r => r.data),
  });

  const orders = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Sale Orders" description="Track customer orders through the fulfillment pipeline">
        <Button size="sm"><Plus size={13} /> New Order</Button>
      </PageHeader>

      <Card>
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="w-44 text-sm"
          />
          {meta && <span className="text-muted-foreground text-xs ml-auto">{meta.total} orders</span>}
        </div>

        {isLoading ? <LoadingSpinner /> : orders.length === 0 ? (
          <EmptyState icon={<ShoppingCart size={32} />} title="No orders found" description="Create your first sale order" />
        ) : (
          <Table>
            <Thead>
              <Th>Reference</Th>
              <Th>Customer</Th>
              <Th>Order Date</Th>
              <Th>Delivery Date</Th>
              <Th>Items</Th>
              <Th>Total</Th>
              <Th>Status</Th>
            </Thead>
            <Tbody>
              {orders.map((o: any) => (
                <Tr key={o.id}>
                  <Td><span className="font-mono text-xs text-primary">{o.reference}</span></Td>
                  <Td className="font-medium">{o.customer?.name}</Td>
                  <Td className="text-muted-foreground">{formatDate(o.orderDate)}</Td>
                  <Td className="text-muted-foreground">{o.deliveryDate ? formatDate(o.deliveryDate) : '—'}</Td>
                  <Td className="text-muted-foreground">{o.lines?.length || 0}</Td>
                  <Td className="font-medium">{formatCurrency(o.totalAmount)}</Td>
                  <Td><StatusBadge status={o.status} /></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={!meta.hasPrev} onClick={() => setPage(p => p - 1)}>Prev</Button>
              <Button size="sm" variant="secondary" disabled={!meta.hasNext} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
