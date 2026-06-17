import { useEffect, useState } from 'react'
import { assetsAPI, breachesAPI } from '../services/api'
import { Shield, Plus, Trash2, RefreshCw, Mail, Globe, Phone, AlertTriangle, CheckCircle } from 'lucide-react'

const ASSET_ICONS = { email: Mail, domain: Globe, phone: Phone }

export default function Assets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ asset_type: 'email', asset_value: '' })
  const [adding, setAdding] = useState(false)
  const [scanning, setScanning] = useState({})
  const [messages, setMessages] = useState({})
  const [addError, setAddError] = useState('')

  const load = () => {
    setLoading(true)
    assetsAPI.getAll().then(r => setAssets(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setAddError('')
    setAdding(true)
    try {
      await assetsAPI.add(form)
      setForm({ asset_type: 'email', asset_value: '' })
      load()
    } catch (err) {
      setAddError(err.response?.data?.detail || 'Failed to add asset.')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id) => {
    if (!confirm('Remove this asset from monitoring?')) return
    await assetsAPI.remove(id).catch(() => {})
    load()
  }

  const handleScan = async (id) => {
    setScanning(s => ({ ...s, [id]: true }))
    setMessages(m => ({ ...m, [id]: '' }))
    try {
      const res = await breachesAPI.scanAsset(id)
      setMessages(m => ({ ...m, [id]: res.data.message }))
      load()
    } catch {
      setMessages(m => ({ ...m, [id]: 'Scan failed.' }))
    } finally {
      setScanning(s => ({ ...s, [id]: false }))
    }
  }

  const placeholders = { email: 'user@organization.com', domain: 'example.com', phone: '+91-9876543210' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Monitored Assets</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Add emails, domains, or phone numbers to monitor for breaches.</p>
      </div>

      {/* Add asset form */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Plus size={16} style={{ color: '#7C3AED' }} /> Add New Asset
        </h3>
        {addError && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
            {addError}
          </div>
        )}
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <select className="input-field sm:w-44" value={form.asset_type} onChange={e => setForm({ ...form, asset_type: e.target.value })}>
            <option value="email">Email</option>
            <option value="domain">Domain</option>
            <option value="phone">Phone</option>
          </select>
          <input type="text" className="input-field flex-1" placeholder={placeholders[form.asset_type]}
            value={form.asset_value} onChange={e => setForm({ ...form, asset_value: e.target.value })} required />
          <button type="submit" className="btn-primary whitespace-nowrap" disabled={adding}>
            <Plus size={16} />{adding ? 'Adding...' : 'Add Asset'}
          </button>
        </form>
      </div>

      {/* Assets list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Shield size={48} style={{ color: '#7C3AED', opacity: 0.4, margin: '0 auto 12px' }} />
          <h3 className="text-white font-semibold">No assets monitored yet</h3>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Add your first asset above to begin monitoring.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map(asset => {
            const Icon = ASSET_ICONS[asset.asset_type] || Shield
            return (
              <div key={asset.id} className="glass-card p-5">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
                    <Icon size={18} style={{ color: '#A78BFA' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">{asset.asset_value}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }}>
                        {asset.asset_type}
                      </span>
                      <span className={`badge-${asset.status}`}>{asset.status}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#475569' }}>
                      Last checked: {asset.last_checked ? new Date(asset.last_checked).toLocaleString() : 'Never'}
                    </div>
                    {messages[asset.id] && (
                      <div className="text-xs mt-1 flex items-center gap-1" style={{ color: messages[asset.id].includes('new') ? '#F59E0B' : '#34D399' }}>
                        {messages[asset.id].includes('new breach') ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                        {messages[asset.id]}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleScan(asset.id)} disabled={scanning[asset.id]} className="btn-ghost text-sm px-4 py-2">
                      <RefreshCw size={14} className={scanning[asset.id] ? 'animate-spin' : ''} />
                      {scanning[asset.id] ? 'Scanning...' : 'Scan'}
                    </button>
                    <button onClick={() => handleRemove(asset.id)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
