import { useEffect, useState } from 'react'
import { notificationsAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { Settings, Mail, Bell, Shield, Save, CheckCircle } from 'lucide-react'

function Toggle({ checked, onChange }) {
  return (
    <button onClick={() => onChange(!checked)}
      className="relative inline-flex w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0"
      style={{ background: checked ? 'linear-gradient(135deg,#7C3AED,#A855F7)' : 'rgba(255,255,255,0.1)' }}>
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300"
        style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
    </button>
  )
}

export default function Notifications() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    notificationsAPI.getPreferences().then(r => setPrefs(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const set = (key) => (val) => setPrefs(p => ({ ...p, [key]: val }))

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await notificationsAPI.updatePreferences(prefs)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Notification Settings</h1>
        <p className="text-sm mt-1" style={{ color: '#64748B' }}>Control how and when you receive breach alerts.</p>
      </div>

      {/* Profile card */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} style={{ color: '#7C3AED' }} />
          <h3 className="text-sm font-semibold text-white">Account Info</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', value: user?.full_name },
            { label: 'Email', value: user?.email },
            { label: 'Organization', value: user?.organization || '—' },
            { label: 'Role', value: user?.role, capitalize: true },
          ].map(({ label, value, capitalize }) => (
            <div key={label}>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>{label}</div>
              <div className="text-sm font-medium text-white" style={capitalize ? { textTransform: 'capitalize' } : {}}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification channels */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} style={{ color: '#7C3AED' }} />
          <h3 className="text-sm font-semibold text-white">Notification Channels</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <Mail size={16} style={{ color: '#60A5FA' }} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Email Alerts</div>
                <div className="text-xs" style={{ color: '#64748B' }}>Receive breach alerts via email at {user?.email}</div>
              </div>
            </div>
            <Toggle checked={prefs?.email_alerts ?? true} onChange={set('email_alerts')} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.12)' }}>
                <Bell size={16} style={{ color: '#A78BFA' }} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">In-App Alerts</div>
                <div className="text-xs" style={{ color: '#64748B' }}>Show alerts inside the dashboard</div>
              </div>
            </div>
            <Toggle checked={prefs?.in_app_alerts ?? true} onChange={set('in_app_alerts')} />
          </div>
        </div>
      </div>

      {/* Severity filter */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} style={{ color: '#7C3AED' }} />
          <h3 className="text-sm font-semibold text-white">Alert Severity Filters</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: '#64748B' }}>Choose which severity levels trigger notifications.</p>
        <div className="space-y-3">
          {[
            { key: 'alert_critical', label: 'Critical', color: '#A855F7', bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.2)', desc: 'Highest risk breaches — passwords, financial data' },
            { key: 'alert_high', label: 'High', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', desc: 'Significant breach with sensitive data exposed' },
            { key: 'alert_medium', label: 'Medium', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', desc: 'Moderate risk with personal data involved' },
            { key: 'alert_low', label: 'Low', color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', desc: 'Minor breach with non-sensitive data' },
          ].map(({ key, label, color, bg, border, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color }}>{label}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#64748B' }}>{desc}</div>
              </div>
              <Toggle checked={prefs?.[key] ?? true} onChange={set(key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-primary px-6 py-3">
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-sm animate-fade-in" style={{ color: '#34D399' }}>
            <CheckCircle size={16} /> Saved successfully
          </div>
        )}
      </div>
    </div>
  )
}
