import { useQuery } from '@tanstack/react-query';
import { GitBranch, Plus } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Table, Thead, Th, Tbody, Tr, Td, Badge, Button, LoadingSpinner, EmptyState } from '../../components/ui';

export default function BomsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['boms'],
    queryFn: () => api.get('/production/boms').then(r => r.data),
  });
  const boms = data?.data || [];

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Bill of Materials" description="Define product recipes and component requirements">
        <Button size="sm"><Plus size={13} /> New BOM</Button>
      </PageHeader>

      <Card>
        {isLoading ? <LoadingSpinner /> : boms.length === 0 ? (
          <EmptyState icon={<GitBranch size={32} />} title="No BOMs yet" description="Create a bill of materials to define what components go into each product" />
        ) : (
          <Table>
            <Thead>
              <Th>Reference</Th><Th>Finished Product</Th><Th>SKU</Th><Th>Qty Produced</Th><Th>Components</Th><Th>Type</Th><Th>Status</Th>
            </Thead>
            <Tbody>
              {boms.map((bom: any) => (
                <Tr key={bom.id}>
                  <Td><span className="font-mono text-xs text-primary">{bom.reference}</span></Td>
                  <Td className="font-medium">{bom.finishedProduct?.name}</Td>
                  <Td><span className="font-mono text-xs text-muted-foreground">{bom.finishedProduct?.sku}</span></Td>
                  <Td>{bom.quantity}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {bom.lines?.slice(0, 3).map((l: any) => (
                        <Badge key={l.id} variant="muted">{l.product?.name} ×{l.quantity}</Badge>
                      ))}
                      {bom.lines?.length > 3 && <Badge variant="muted">+{bom.lines.length - 3} more</Badge>}
                    </div>
                  </Td>
                  <Td><Badge variant="info">{bom.type}</Badge></Td>
                  <Td><Badge variant={bom.isActive ? 'success' : 'muted'}>{bom.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
