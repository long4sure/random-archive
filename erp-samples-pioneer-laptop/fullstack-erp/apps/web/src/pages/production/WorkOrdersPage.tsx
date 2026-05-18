import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Factory, Plus } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Table, Thead, Th, Tbody, Tr, Td, Button, StatusBadge, LoadingSpinner, EmptyState, Select } from '../../components/ui';
import { formatDate } from '../../lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function WorkOrdersPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', status, page],
    queryFn: () => api.get('/production/work-orders', { params: { status, page, limit: 20 } }).then(r => r.data),
  });

  const orders = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Work Orders" description="Production orders and manufacturing progress">
        <Button size="sm"><Plus size={13} /> New Work Order</Button>
      </PageHeader>

      <Card>
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <Select options={STATUS_OPTIONS} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-44 text-sm" />
          {meta && <span className="text-muted-foreground text-xs ml-auto">{meta.total} work orders</span>}
        </div>

        {isLoading ? <LoadingSpinner /> : orders.length === 0 ? (
          <EmptyState icon={<Factory size={32} />} title="No work orders" description="Create work orders to track production runs" />
        ) : (
          <Table>
            <Thead>
              <Th>Reference</Th><Th>Product</Th><Th>Work Center</Th><Th>Qty</Th><Th>Produced</Th><Th>Progress</Th><Th>Scheduled Start</Th><Th>Status</Th>
            </Thead>
            <Tbody>
              {orders.map((wo: any) => {
                const pct = wo.quantity > 0 ? Math.round((wo.producedQty / wo.quantity) * 100) : 0;
                return (
                  <Tr key={wo.id}>
                    <Td><span className="font-mono text-xs text-primary">{wo.reference}</span></Td>
                    <Td className="font-medium">{wo.bom?.finishedProduct?.name || '—'}</Td>
                    <Td className="text-muted-foreground">{wo.workCenter?.name || '—'}</Td>
                    <Td>{wo.quantity}</Td>
                    <Td>{wo.producedQty}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </Td>
                    <Td className="text-muted-foreground">{wo.scheduledStart ? formatDate(wo.scheduledStart) : '—'}</Td>
                    <Td><StatusBadge status={wo.status} /></Td>
                  </Tr>
                );
              })}
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
