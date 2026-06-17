import { useEffect, useState } from 'react'
import { analyticsAPI } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { BarChart3, TrendingUp, Database, Shield } from 'lucide-react'

const SEVERITY_COLORS = { critical: '#A855F7', high: '#EF4444', medium: '#F59E0B', low: '#10B981' }

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-xs border-0" style={{ border: '1px solid rgba(124,58,237,0.3)' }}>
        <p className="text-white font-semibold mb-1">{label || payload[0]?.payload?.month || payload[0]?.name}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#A78BFA' }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsAPI.getSummary().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const severityData = data ? Object.entries(data.breach_by_severity).map(([name, value]) => ({ name, value })) : []
  const pieData = severityData.filter(d => d.value > 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Breach intelligence overview for your monitored assets.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Assets', value: data?.total_assets || 0, color: '#7C3AED' },
          { label: 'Total Breaches', value: data?.total_breaches || 0, color: '#EF4444' },
          { label: 'Breached Assets', value: data?.breached_assets || 0, color: '#F59E0B' },
          { label: 'Unread Alerts', value: data?.active_alerts || 0, color: '#A855F7' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-5">
            <div className="text-3xl font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-xs" style={{ color: '#64748B' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Monthly trend line */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={16} style={{ color: '#7C3AED' }} />
          <h3 className="text-sm font-semibold text-white">Monthly Breach Detection Trend</h3>
        </div>
        {data?.monthly_trend?.some(m => m.breaches > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.monthly_trend}>
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="breaches" name="Breaches" stroke="#7C3AED" strokeWidth={2.5}
                dot={{ fill: '#7C3AED', r: 5, strokeWidth: 2, stroke: '#A855F7' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp size={40} style={{ color: '#7C3AED', opacity: 0.3 }} />
            <p className="text-sm mt-3" style={{ color: '#64748B' }}>No breach data yet. Add assets and run a scan.</p>
          </div>
        )}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Severity breakdown bar */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} style={{ color: '#7C3AED' }} />
            <h3 className="text-sm font-semibold text-white">Breaches by Severity</h3>
          </div>
          {severityData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={severityData}>
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Breaches" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#7C3AED'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield size={40} style={{ color: '#10B981', opacity: 0.3 }} />
              <p className="text-sm mt-3" style={{ color: '#64748B' }}>All clear — no breaches detected</p>
            </div>
          )}
        </div>

        {/* Severity pie */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database size={16} style={{ color: '#7C3AED' }} />
            <h3 className="text-sm font-semibold text-white">Severity Distribution</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.map(({ name, value }) => (
                  <div key={name} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: SEVERITY_COLORS[name] }} />
                    <span className="text-xs capitalize flex-1" style={{ color: '#94A3B8' }}>{name}</span>
                    <span className="text-xs font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield size={40} style={{ color: '#10B981', opacity: 0.3 }} />
              <p className="text-sm mt-3" style={{ color: '#64748B' }}>No breach data to show</p>
            </div>
          )}
        </div>
      </div>

      {/* Most exposed data types */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} style={{ color: '#7C3AED' }} />
          <h3 className="text-sm font-semibold text-white">Most Exposed Data Types</h3>
        </div>
        {data?.most_leaked_data_types?.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.most_leaked_data_types} layout="vertical">
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="type" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Count" fill="#7C3AED" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database size={40} style={{ color: '#7C3AED', opacity: 0.3 }} />
            <p className="text-sm mt-3" style={{ color: '#64748B' }}>No data type analysis available yet</p>
          </div>
        )}
      </div>

      {/* Recent detections table */}
      {data?.recent_breaches?.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Breach Detections</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Breach Name', 'Severity', 'Score', 'Records', 'Detected'].map(h => (
                    <th key={h} className="text-left pb-3 pr-4 text-xs font-medium" style={{ color: '#475569' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent_breaches.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-3 pr-4 text-white font-medium">{b.breach_name}</td>
                    <td className="py-3 pr-4"><span className={`badge-${b.severity}`}>{b.severity}</span></td>
                    <td className="py-3 pr-4" style={{ color: SEVERITY_COLORS[b.severity] }}>{b.severity_score?.toFixed(1)}</td>
                    <td className="py-3 pr-4" style={{ color: '#94A3B8' }}>{b.pwn_count ? `${(b.pwn_count / 1e6).toFixed(1)}M` : '—'}</td>
                    <td className="py-3" style={{ color: '#64748B' }}>{b.detected_at ? new Date(b.detected_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
