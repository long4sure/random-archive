import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Receipt, Plus } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Table, Thead, Th, Tbody, Tr, Td, Button, StatusBadge, LoadingSpinner, EmptyState, Select, Badge } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PARTIAL_PAID', label: 'Partial Paid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
];

export default function InvoicesPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', status, page],
    queryFn: () => api.get('/finance/invoices', { params: { status, page, limit: 20 } }).then(r => r.data),
  });

  const invoices = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Invoices" description="Customer invoices and accounts receivable">
        <Button size="sm"><Plus size={13} /> New Invoice</Button>
      </PageHeader>

      <Card>
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <Select options={STATUS_OPTIONS} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="w-44 text-sm" />
          {meta && <span className="text-muted-foreground text-xs ml-auto">{meta.total} invoices</span>}
        </div>

        {isLoading ? <LoadingSpinner /> : invoices.length === 0 ? (
          <EmptyState icon={<Receipt size={32} />} title="No invoices found" />
        ) : (
          <Table>
            <Thead>
              <Th>Reference</Th><Th>Customer</Th><Th>Issue Date</Th><Th>Due Date</Th><Th>Total</Th><Th>Paid</Th><Th>Balance</Th><Th>Status</Th>
            </Thead>
            <Tbody>
              {invoices.map((inv: any) => {
                const balance = inv.totalAmount - inv.paidAmount;
                return (
                  <Tr key={inv.id}>
                    <Td><span className="font-mono text-xs text-primary">{inv.reference}</span></Td>
                    <Td className="font-medium">{inv.customer?.name}</Td>
                    <Td className="text-muted-foreground">{formatDate(inv.issueDate)}</Td>
                    <Td className="text-muted-foreground">{formatDate(inv.dueDate)}</Td>
                    <Td className="font-medium">{formatCurrency(inv.totalAmount)}</Td>
                    <Td className="text-green-600">{formatCurrency(inv.paidAmount)}</Td>
                    <Td className={balance > 0 ? 'text-red-500 font-medium' : 'text-muted-foreground'}>{formatCurrency(balance)}</Td>
                    <Td><StatusBadge status={inv.status} /></Td>
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
