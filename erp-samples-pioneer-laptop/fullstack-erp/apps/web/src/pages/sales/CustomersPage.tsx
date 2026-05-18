import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus, Search, Phone, Mail } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Table, Thead, Th, Tbody, Tr, Td, Badge, Button, LoadingSpinner, EmptyState } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search, page],
    queryFn: () => api.get('/sales/customers', { params: { search, page, limit: 20 } }).then(r => r.data),
  });

  const customers = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Customers" description="Manage your customer accounts and contacts">
        <Button size="sm"><Plus size={13} /> New Customer</Button>
      </PageHeader>

      <Card>
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search customers…" className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
          </div>
          {meta && <span className="text-muted-foreground text-xs ml-auto">{meta.total} customers</span>}
        </div>

        {isLoading ? <LoadingSpinner /> : customers.length === 0 ? (
          <EmptyState icon={<Users size={32} />} title="No customers found" />
        ) : (
          <Table>
            <Thead>
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Orders</Th>
              <Th>Credit Limit</Th>
              <Th>Payment Terms</Th>
              <Th>Status</Th>
            </Thead>
            <Tbody>
              {customers.map((c: any) => (
                <Tr key={c.id}>
                  <Td><span className="font-mono text-xs text-muted-foreground">{c.code}</span></Td>
                  <Td className="font-medium">{c.name}</Td>
                  <Td className="text-muted-foreground text-xs">{c.email || '—'}</Td>
                  <Td className="text-muted-foreground text-xs">{c.phone || '—'}</Td>
                  <Td className="text-muted-foreground">{c._count?.saleOrders || 0}</Td>
                  <Td>{formatCurrency(c.creditLimit)}</Td>
                  <Td className="text-muted-foreground">{c.paymentTerms} days</Td>
                  <Td><Badge variant={c.isActive ? 'success' : 'muted'}>{c.isActive ? 'Active' : 'Inactive'}</Badge></Td>
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
