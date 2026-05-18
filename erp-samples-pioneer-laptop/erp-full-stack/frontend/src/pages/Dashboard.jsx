import { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const peso = n => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 0 })

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}><span className="spinner" /></div>
  if (!data) return <div className="empty">Failed to load dashboard</div>

  const { metrics, lowStockItems, recentExpenses, expenseByCategory } = data
  const chartData = Object.entries(expenseByCategory || {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  const statusColor = { Paid: 'green', Pending: 'amber', Overdue: 'red' }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26 }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
          {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total expenses', value: peso(metrics.totalExpenses), color: 'var(--accent)' },
          { label: 'Pending payments', value: peso(metrics.pendingAmount), color: '#9b6000' },
          { label: 'Low stock items', value: metrics.lowStockCount, color: metrics.lowStockCount > 0 ? 'var(--accent)' : 'var(--accent2)' },
          { label: 'Inventory value', value: peso(metrics.inventoryValue), color: 'var(--info)' },
          { label: 'Suppliers', value: metrics.supplierCount },
          { label: 'Customers', value: metrics.customerCount },
        ].map(m => (
          <div key={m.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: m.color || 'var(--text)' }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Low stock */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Low stock alerts</h3>
          {lowStockItems.length === 0
            ? <div className="empty" style={{ padding: '20px 0' }}>All stock levels OK</div>
            : lowStockItems.map(item => {
              const pct = item.min_stock > 0 ? Math.round((item.stock / item.min_stock) * 100) : 100
              return (
                <div key={item.id || item.name} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: 'var(--accent)' }}>{item.stock} {item.unit}</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: 'var(--accent)', borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
        </div>

        {/* Recent expenses */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Recent expenses</h3>
          {recentExpenses.length === 0
            ? <div className="empty" style={{ padding: '20px 0' }}>No expenses yet</div>
            : recentExpenses.map((exp, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, marginBottom: 10, borderBottom: i < recentExpenses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{exp.description}</div>
                  <div style={{ color: 'var(--hint)', fontSize: 11 }}>{exp.date} · {exp.supplier || exp.category}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{peso(exp.amount)}</div>
                  <span className={`badge ${statusColor[exp.status] || 'gray'}`}>{exp.status}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Expense breakdown by category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--hint)' }} axisLine={false} tickLine={false} tickFormatter={v => '₱' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v)} />
              <Tooltip formatter={v => peso(v)} contentStyle={{ fontSize: 12, border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'none' }} />
              <Bar dataKey="value" fill="var(--accent)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
