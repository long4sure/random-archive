import { useQuery } from '@tanstack/react-query';
import { BookOpen, Plus } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Table, Thead, Th, Tbody, Tr, Td, Badge, Button, LoadingSpinner, EmptyState } from '../../components/ui';

const TYPE_COLORS: Record<string, any> = {
  ASSET: 'info', LIABILITY: 'warning', EQUITY: 'default', REVENUE: 'success', EXPENSE: 'danger',
};

export default function AccountsPage() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/finance/accounts').then(r => r.data.data),
  });

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Chart of Accounts" description="General ledger account structure">
        <Button size="sm"><Plus size={13} /> New Account</Button>
      </PageHeader>

      <Card>
        {isLoading ? <LoadingSpinner /> : !accounts?.length ? (
          <EmptyState icon={<BookOpen size={32} />} title="No accounts yet" description="Set up your chart of accounts" />
        ) : (
          <Table>
            <Thead>
              <Th>Code</Th><Th>Account Name</Th><Th>Type</Th><Th>Normal Side</Th><Th>Status</Th>
            </Thead>
            <Tbody>
              {accounts.map((a: any) => (
                <Tr key={a.id}>
                  <Td><span className="font-mono text-sm font-medium">{a.code}</span></Td>
                  <Td className="font-medium">{a.name}</Td>
                  <Td><Badge variant={TYPE_COLORS[a.type] || 'muted'}>{a.type}</Badge></Td>
                  <Td className="text-muted-foreground">{a.normalSide}</Td>
                  <Td><Badge variant={a.isActive ? 'success' : 'muted'}>{a.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
