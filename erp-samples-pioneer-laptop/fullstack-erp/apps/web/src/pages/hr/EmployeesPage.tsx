import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserCheck, Plus, Search } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, Table, Thead, Th, Tbody, Tr, Td, Badge, Button, StatusBadge, LoadingSpinner, EmptyState } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, page],
    queryFn: () => api.get('/hr/employees', { params: { search, page, limit: 20 } }).then(r => r.data),
  });

  const employees = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Employees" description="Manage workforce and employee records">
        <Button size="sm"><Plus size={13} /> New Employee</Button>
      </PageHeader>

      <Card>
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-1.5 flex-1 max-w-xs">
            <Search size={13} className="text-muted-foreground shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search employees…" className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground" />
          </div>
          {meta && <span className="text-muted-foreground text-xs ml-auto">{meta.total} employees</span>}
        </div>

        {isLoading ? <LoadingSpinner /> : employees.length === 0 ? (
          <EmptyState icon={<UserCheck size={32} />} title="No employees found" />
        ) : (
          <Table>
            <Thead>
              <Th>ID</Th><Th>Name</Th><Th>Position</Th><Th>Department</Th><Th>Type</Th><Th>Hire Date</Th><Th>Salary</Th><Th>Status</Th>
            </Thead>
            <Tbody>
              {employees.map((e: any) => (
                <Tr key={e.id}>
                  <Td><span className="font-mono text-xs text-muted-foreground">{e.employeeId}</span></Td>
                  <Td className="font-medium">{e.firstName} {e.lastName}</Td>
                  <Td className="text-muted-foreground">{e.position}</Td>
                  <Td className="text-muted-foreground">{e.department?.name || '—'}</Td>
                  <Td><Badge variant="muted">{e.employmentType?.replace('_', ' ')}</Badge></Td>
                  <Td className="text-muted-foreground">{formatDate(e.hireDate)}</Td>
                  <Td className="font-medium">{formatCurrency(e.baseSalary)}</Td>
                  <Td><StatusBadge status={e.status} /></Td>
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
