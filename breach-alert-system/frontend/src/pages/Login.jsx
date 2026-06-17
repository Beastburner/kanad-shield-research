import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ShieldAlert, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const demoAccounts = [
    { label: 'Admin', email: 'admin@breachalert.com', password: 'admin123' },
    { label: 'Legal', email: 'legal@lawfirm.com', password: 'legal123' },
    { label: 'Government', email: 'gov@ministry.gov', password: 'gov123' },
    { label: 'Test User', email: 'test@example.com', password: 'test123' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050816' }}>
      {/* BG orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#7C3AED,transparent)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle,#A855F7,transparent)', filter: 'blur(80px)' }} />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
            <ShieldAlert size={30} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-white">BreachAlert</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Legal & Government Ecosystem</p>
        </div>

        <div className="glass-card p-8 glow-purple">
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input type="email" className="input-field pl-10" placeholder="you@organization.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input type={showPass ? 'text' : 'password'} className="input-field pl-10 pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3 mt-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: '#64748B' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium" style={{ color: '#A78BFA' }}>Create one</Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-medium mb-3 text-center" style={{ color: '#475569' }}>DEMO ACCOUNTS</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(acc => (
                <button key={acc.label} onClick={() => setForm({ email: acc.email, password: acc.password })}
                  className="text-xs py-2 px-3 rounded-lg transition-all text-left"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#A78BFA' }}>
                  <div className="font-semibold">{acc.label}</div>
                  <div className="opacity-60 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
