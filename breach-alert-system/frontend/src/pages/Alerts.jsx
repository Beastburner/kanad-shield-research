import { useEffect, useState } from 'react'
import { alertsAPI, breachesAPI } from '../services/api'
import { Bell, CheckCheck, X, ChevronDown, ChevronUp, ShieldAlert, Info, Scale, AlertTriangle } from 'lucide-react'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})
  const [recommendations, setRecommendations] = useState({})
  const [legal, setLegal] = useState({})
  const [filter, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    alertsAPI.getAll().then(r => setAlerts(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleMarkRead = async (id) => {
    await alertsAPI.update(id, { status: 'read' }).catch(() => {})
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'read' } : a))
  }

  const handleDismiss = async (id) => {
    await alertsAPI.dismiss(id).catch(() => {})
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'dismissed' } : a))
  }

  const handleMarkAllRead = async () => {
    await alertsAPI.markAllRead().catch(() => {})
    setAlerts(prev => prev.map(a => ({ ...a, status: a.status === 'unread' ? 'read' : a.status })))
  }

  const toggleExpand = async (alert) => {
    const id = alert.id
    setExpanded(e => ({ ...e, [id]: !e[id] }))
    if (!recommendations[id] && alert.breach?.id) {
      const res = await breachesAPI.getRecommendations(alert.breach.id).catch(() => ({ data: [] }))
      setRecommendations(r => ({ ...r, [id]: res.data }))
    }
    if (!legal[id] && alert.breach?.id) {
      const res = await breachesAPI.getLegal(alert.breach.id).catch(() => ({ data: null }))
      setLegal(l => ({ ...l, [id]: res.data }))
    }
  }

  const filtered = alerts.filter(a => filter === 'all' ? true : a.status === filter)
  const unread = alerts.filter(a => a.status === 'unread').length

  const severityBorder = { critical: '#A855F7', high: '#EF4444', medium: '#F59E0B', low: '#10B981' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            {unread > 0 ? `${unread} unread alert${unread > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="btn-ghost text-sm">
            <CheckCheck size={15} /> Mark All Read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'unread', 'read', 'dismissed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
            style={filter === f
              ? { background: 'rgba(124,58,237,0.2)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.4)' }
              : { background: 'rgba(255,255,255,0.04)', color: '#64748B', border: '1px solid rgba(255,255,255,0.06)' }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Bell size={48} style={{ color: '#7C3AED', opacity: 0.4, margin: '0 auto 12px' }} />
          <h3 className="text-white font-semibold">No alerts</h3>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>
            {filter === 'unread' ? 'No unread alerts. You\'re all caught up!' : 'No alerts in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const sev = alert.breach?.severity
            const borderColor = severityBorder[sev] || '#475569'
            const isExpanded = expanded[alert.id]
            const recs = recommendations[alert.id] || []
            const legalIntel = legal[alert.id]

            return (
              <div key={alert.id} className="glass-card overflow-hidden transition-all"
                style={{ borderLeft: `3px solid ${alert.status === 'dismissed' ? '#374151' : borderColor}`, opacity: alert.status === 'dismissed' ? 0.5 : 1 }}>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${borderColor}18`, border: `1px solid ${borderColor}40` }}>
                      <ShieldAlert size={16} style={{ color: borderColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{alert.title}</span>
                        {sev && <span className={`badge-${sev}`}>{sev}</span>}
                        {alert.status === 'unread' && (
                          <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>{alert.message}</p>
                      <p className="text-xs mt-1" style={{ color: '#475569' }}>
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleExpand(alert)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {alert.status === 'unread' && (
                        <button onClick={() => handleMarkRead(alert.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399' }}>
                          <CheckCheck size={14} />
                        </button>
                      )}
                      {alert.status !== 'dismissed' && (
                        <button onClick={() => handleDismiss(alert.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ background: 'rgba(239,68,68,0.08)', color: '#F87171' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded: breach details + recommendations */}
                {isExpanded && alert.breach && (
                  <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Breach info */}
                    <div className="pt-4 grid sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-xs mb-1" style={{ color: '#64748B' }}>Breach Source</div>
                        <div className="text-sm font-semibold text-white">{alert.breach.breach_name}</div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-xs mb-1" style={{ color: '#64748B' }}>Records Exposed</div>
                        <div className="text-sm font-semibold text-white">
                          {alert.breach.pwn_count ? `${(alert.breach.pwn_count / 1e6).toFixed(1)}M` : 'Unknown'}
                        </div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-xs mb-1" style={{ color: '#64748B' }}>Severity Score</div>
                        <div className="text-sm font-semibold" style={{ color: borderColor }}>
                          {alert.breach.severity_score?.toFixed(1)} / 10
                        </div>
                      </div>
                    </div>

                    {/* Detection source / feed */}
                    {alert.breach.source && (
                      <div className="text-xs" style={{ color: '#64748B' }}>
                        Detected via: <span style={{ color: '#94A3B8' }}>{alert.breach.source}</span>
                      </div>
                    )}

                    {/* Data classes */}
                    {alert.breach.data_classes && (
                      <div>
                        <div className="text-xs font-medium mb-2" style={{ color: '#64748B' }}>EXPOSED DATA TYPES</div>
                        <div className="flex flex-wrap gap-2">
                          {JSON.parse(alert.breach.data_classes).map(dc => (
                            <span key={dc} className="text-xs px-3 py-1 rounded-full"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                              {dc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {recs.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-2 flex items-center gap-1" style={{ color: '#64748B' }}>
                          <Info size={12} /> RECOMMENDED ACTIONS
                        </div>
                        <div className="space-y-2">
                          {recs.map((rec, i) => (
                            <div key={i} className="flex gap-3 p-3 rounded-xl"
                              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                style={{ background: 'rgba(124,58,237,0.3)', color: '#A78BFA' }}>{i + 1}</span>
                              <div>
                                <div className="text-sm font-semibold text-white">{rec.action}</div>
                                {rec.description && <div className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{rec.description}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legal & compliance intelligence (PS Req #7) */}
                    {legalIntel && (
                      <div>
                        <div className="text-xs font-medium mb-2 flex items-center gap-1" style={{ color: '#64748B' }}>
                          <Scale size={12} /> LEGAL &amp; COMPLIANCE INTELLIGENCE
                        </div>

                        {legalIntel.reporting_mandatory && (
                          <div className="flex gap-2 p-3 rounded-xl mb-3 items-start"
                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <AlertTriangle size={14} style={{ color: '#F87171', marginTop: 2, flexShrink: 0 }} />
                            <span className="text-xs" style={{ color: '#FCA5A5' }}>
                              High-severity breach — statutory reporting to CERT-In and the Data Protection Board is mandatory.
                            </span>
                          </div>
                        )}

                        <div className="space-y-2">
                          {legalIntel.applicable_laws?.map((law, i) => (
                            <div key={i} className="p-3 rounded-xl"
                              style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)' }}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold" style={{ color: '#38BDF8' }}>{law.section}</span>
                                <span className="text-sm font-semibold text-white">{law.title}</span>
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{law.law}</div>
                              <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{law.summary}</div>
                            </div>
                          ))}
                        </div>

                        {legalIntel.advisories?.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="text-xs font-medium" style={{ color: '#64748B' }}>REQUIRED REPORTING</div>
                            {legalIntel.advisories.map((adv, i) => (
                              <div key={i} className="p-3 rounded-xl"
                                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-white">{adv.authority}</span>
                                  <span className="text-xs font-semibold" style={{ color: '#FBBF24' }}>{adv.deadline}</span>
                                </div>
                                <div className="text-xs mt-1" style={{ color: '#94A3B8' }}>{adv.action}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {legalIntel.disclaimer && (
                          <p className="text-xs mt-3" style={{ color: '#475569', fontStyle: 'italic' }}>{legalIntel.disclaimer}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
