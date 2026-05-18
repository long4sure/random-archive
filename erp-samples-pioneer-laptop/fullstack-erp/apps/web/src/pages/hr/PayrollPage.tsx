import { useQuery } from '@tanstack/react-query';
import { DollarSign, Plus } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Table, Thead, Th, Tbody, Tr, Td, Button, StatusBadge, LoadingSpinner, EmptyState } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function PayrollPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn: () => api.get('/hr/payroll-runs').then(r => r.data),
  });
  const runs = data?.data || [];

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Payroll Runs" description="Process and manage employee payroll">
        <Button size="sm"><Plus size={13} /> New Payroll Run</Button>
      </PageHeader>
      <Card>
        {isLoading ? <LoadingSpinner /> : runs.length === 0 ? (
          <EmptyState icon={<DollarSign size={32} />} title="No payroll runs" description="Create your first payroll run for the period" />
        ) : (
          <Table>
            <Thead>
              <Th>Reference</Th><Th>Period</Th><Th>Start Date</Th><Th>End Date</Th><Th>Employees</Th><Th>Gross</Th><Th>Deductions</Th><Th>Net Pay</Th><Th>Status</Th>
            </Thead>
            <Tbody>
              {runs.map((r: any) => (
                <Tr key={r.id}>
                  <Td><span className="font-mono text-xs text-primary">{r.reference}</span></Td>
                  <Td className="font-medium">{r.period}</Td>
                  <Td className="text-muted-foreground">{formatDate(r.startDate)}</Td>
                  <Td className="text-muted-foreground">{formatDate(r.endDate)}</Td>
                  <Td className="text-muted-foreground">{r._count?.lines || 0}</Td>
                  <Td>{formatCurrency(r.totalGross)}</Td>
                  <Td className="text-red-500">−{formatCurrency(r.totalDeductions)}</Td>
                  <Td className="font-semibold text-green-600">{formatCurrency(r.totalNet)}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
