import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Plus, Search } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Table, Thead, Th, Tbody, Tr, Td, Badge, Button, LoadingSpinner, EmptyState } from '../../components/ui';

export default function VendorsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['vendors', page],
    queryFn: () => api.get('/purchasing/vendors', { params: { page, limit: 20 } }).then(r => r.data),
  });
  const vendors = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Vendors" description="Manage your supplier accounts">
        <Button size="sm"><Plus size={13} /> New Vendor</Button>
      </PageHeader>
      <Card>
        {isLoading ? <LoadingSpinner /> : vendors.length === 0 ? (
          <EmptyState icon={<Building2 size={32} />} title="No vendors yet" />
        ) : (
          <Table>
            <Thead>
              <Th>Code</Th><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>POs</Th><Th>Payment Terms</Th><Th>Status</Th>
            </Thead>
            <Tbody>
              {vendors.map((v: any) => (
                <Tr key={v.id}>
                  <Td><span className="font-mono text-xs text-muted-foreground">{v.code}</span></Td>
                  <Td className="font-medium">{v.name}</Td>
                  <Td className="text-muted-foreground text-xs">{v.email || '—'}</Td>
                  <Td className="text-muted-foreground text-xs">{v.phone || '—'}</Td>
                  <Td className="text-muted-foreground">{v._count?.purchaseOrders || 0}</Td>
                  <Td className="text-muted-foreground">{v.paymentTerms} days</Td>
                  <Td><Badge variant={v.isActive ? 'success' : 'muted'}>{v.isActive ? 'Active' : 'Inactive'}</Badge></Td>
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
