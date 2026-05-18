import { useQuery } from '@tanstack/react-query';
import { Warehouse, MapPin, Plus } from 'lucide-react';
import api from '../../lib/api';
import { PageHeader, Card, CardHeader, CardTitle, CardContent, Badge, Button, LoadingSpinner, EmptyState } from '../../components/ui';

export default function WarehousePage() {
  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/inventory/warehouses').then(r => r.data.data),
  });

  return (
    <div className="p-6 animate-fade-in">
      <PageHeader title="Warehouse" description="Manage locations and stock zones">
        <Button size="sm"><Plus size={13} /> New Warehouse</Button>
      </PageHeader>

      {isLoading ? <LoadingSpinner /> : !warehouses?.length ? (
        <EmptyState icon={<Warehouse size={32} />} title="No warehouses yet" description="Create your first warehouse to track stock locations" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {warehouses.map((wh: any) => (
            <Card key={wh.id}>
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary"><Warehouse size={14} /></div>
                  <div>
                    <CardTitle>{wh.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">{wh.code}</p>
                  </div>
                </div>
                <Badge variant={wh.isActive ? 'success' : 'muted'}>{wh.isActive ? 'Active' : 'Inactive'}</Badge>
              </CardHeader>
              <CardContent>
                {wh.address && (
                  <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-3">
                    <MapPin size={12} className="mt-0.5 shrink-0" /><span>{wh.address}</span>
                  </div>
                )}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Locations ({wh.locations?.length || 0})</p>
                <div className="space-y-1">
                  {wh.locations?.slice(0, 5).map((loc: any) => (
                    <div key={loc.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{loc.name}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="muted">{loc.type}</Badge>
                        <span className="font-mono text-xs text-muted-foreground">{loc.code}</span>
                      </div>
                    </div>
                  ))}
                  {wh.locations?.length > 5 && <p className="text-xs text-muted-foreground">+{wh.locations.length - 5} more</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
