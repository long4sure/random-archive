import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Plus, Search } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Table, Thead, Th, Tbody, Tr, Td, Badge, Button, LoadingSpinner, EmptyState, StatusBadge } from '../../components/ui';
import { formatCurrency } from '../../lib/utils';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, page],
    queryFn: () => api.get('/inventory/products', { params: { search, page, limit: 20 } }).then(r => r.data),
  });

  const products = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Products" description="Manage your product catalog and SKUs">
        <Button size="sm"><Plus size={13} /> New Product</Button>
      </PageHeader>

      <Card>
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or SKU…" className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
          </div>
          {meta && <span className="text-muted-foreground text-xs ml-auto">{meta.total} products</span>}
        </div>

        {isLoading ? <LoadingSpinner /> : products.length === 0 ? (
          <EmptyState icon={<Package size={32} />} title="No products found" description="Add your first product to get started" />
        ) : (
          <Table>
            <Thead>
              <Th>SKU</Th>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Type</Th>
              <Th>Cost Price</Th>
              <Th>Sale Price</Th>
              <Th>UoM</Th>
              <Th>Status</Th>
            </Thead>
            <Tbody>
              {products.map((p: any) => (
                <Tr key={p.id}>
                  <Td><span className="font-mono text-xs text-muted-foreground">{p.sku}</span></Td>
                  <Td className="font-medium">{p.name}</Td>
                  <Td className="text-muted-foreground">{p.category?.name || '—'}</Td>
                  <Td><Badge variant="muted">{p.type}</Badge></Td>
                  <Td>{p.costPrice > 0 ? formatCurrency(p.costPrice) : '—'}</Td>
                  <Td>{p.salePrice > 0 ? formatCurrency(p.salePrice) : '—'}</Td>
                  <Td className="text-muted-foreground">{p.uom?.abbreviation}</Td>
                  <Td><Badge variant={p.isActive ? 'success' : 'muted'}>{p.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}

        {/* Pagination */}
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
