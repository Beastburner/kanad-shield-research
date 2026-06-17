import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { analyticsAPI, breachesAPI } from '../services/api'
import { Shield, AlertTriangle, Bell, Activity, RefreshCw, TrendingUp, Database } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const SEVERITY_COLORS = { critical: '#A855F7', high: '#EF4444', medium: '#F59E0B', low: '#10B981' }

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState('')

  const load = () => {
    setLoading(true)
    analyticsAPI.getSummary().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleScanAll = async () => {
    setScanning(true)
    setScanMsg('')
    try {
      const res = await breachesAPI.scanAll()
      setScanMsg(`✅ Scanned ${res.data.scanned} assets. ${res.data.total_new_breaches} new breach(es) found.`)
      load()
    } catch {
      setScanMsg('❌ Scan failed. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  const pieData = data ? Object.entries(data.breach_by_severity).filter(([,v]) => v > 0).map(([k, v]) => ({ name: k, value: v })) : []

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card p-3 text-xs">
          <p className="text-white font-semibold">{payload[0].payload.month || payload[0].name}</p>
          <p style={{ color: '#A78BFA' }}>{payload[0].value} breach{payload[0].value !== 1 ? 'es' : ''}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            {user?.organization || 'Your organization'} — Real-time breach monitoring active
          </p>
        </div>
        <button onClick={handleScanAll} disabled={scanning} className="btn-primary">
          <RefreshCw size={16} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Scanning...' : 'Scan All Assets'}
        </button>
      </div>

      {scanMsg && (
        <div className="p-4 rounded-xl text-sm font-medium"
          style={{ background: scanMsg.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${scanMsg.includes('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: scanMsg.includes('✅') ? '#34D399' : '#F87171' }}>
          {scanMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Monitored Assets', value: data?.total_assets || 0, icon: Shield, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
              { label: 'Total Breaches', value: data?.total_breaches || 0, icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
              { label: 'Active Alerts', value: data?.active_alerts || 0, icon: Bell, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
              { label: 'Critical Alerts', value: data?.critical_alerts || 0, icon: Activity, color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#64748B' }}>{label}</span>
                </div>
                <div className="text-3xl font-bold text-white">{value}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Monthly trend */}
            <div className="glass-card p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} style={{ color: '#7C3AED' }} />
                <h3 className="text-sm font-semibold text-white">Breach Detection Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data?.monthly_trend || []}>
                  <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="breaches" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Severity pie */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database size={16} style={{ color: '#7C3AED' }} />
                <h3 className="text-sm font-semibold text-white">By Severity</h3>
              </div>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#64748B'} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {pieData.map(({ name, value }) => (
                      <div key={name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: SEVERITY_COLORS[name] }} />
                          <span className="capitalize" style={{ color: '#94A3B8' }}>{name}</span>
                        </div>
                        <span className="font-semibold text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Shield size={32} style={{ color: '#10B981', opacity: 0.5 }} />
                  <p className="text-xs mt-2" style={{ color: '#64748B' }}>No breaches detected</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent breaches + data types */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Recent breaches */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Recent Detections</h3>
              {data?.recent_breaches?.length > 0 ? (
                <div className="space-y-3">
                  {data.recent_breaches.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{b.breach_name}</div>
                        <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                          {b.pwn_count ? `${(b.pwn_count / 1e6).toFixed(1)}M records` : 'Unknown size'}
                        </div>
                      </div>
                      <span className={`badge-${b.severity}`}>{b.severity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Shield size={36} style={{ color: '#10B981', opacity: 0.4 }} />
                  <p className="text-sm mt-2" style={{ color: '#64748B' }}>No breaches detected yet</p>
                  <p className="text-xs mt-1" style={{ color: '#475569' }}>Add assets and run a scan</p>
                </div>
              )}
            </div>

            {/* Data types bar chart */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Most Exposed Data Types</h3>
              {data?.most_leaked_data_types?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.most_leaked_data_types} layout="vertical">
                    <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="type" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#7C3AED" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Database size={36} style={{ color: '#7C3AED', opacity: 0.4 }} />
                  <p className="text-sm mt-2" style={{ color: '#64748B' }}>No data yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
