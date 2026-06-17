import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ShieldAlert, Mail, Lock, User, Building2, Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', full_name: '', password: '', organization: '', role: 'user' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#050816' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#7C3AED,transparent)', filter: 'blur(80px)' }} />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
            <ShieldAlert size={30} color="white" />
          </div>
          <h1 className="text-3xl font-bold text-white">BreachAlert</h1>
          <p className="text-sm mt-1" style={{ color: '#64748B' }}>Create your account</p>
        </div>

        <div className="glass-card p-8 glow-purple">
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#F87171' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input type="text" className="input-field pl-10" placeholder="Jane Smith"
                  value={form.full_name} onChange={set('full_name')} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input type="email" className="input-field pl-10" placeholder="you@organization.com"
                  value={form.email} onChange={set('email')} required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Organization</label>
              <div className="relative">
                <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input type="text" className="input-field pl-10" placeholder="Law Firm / Ministry"
                  value={form.organization} onChange={set('organization')} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Role</label>
              <select className="input-field" value={form.role} onChange={set('role')}>
                <option value="user">User</option>
                <option value="legal">Legal Professional</option>
                <option value="government">Government Official</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input type={showPass ? 'text' : 'password'} className="input-field pl-10 pr-10" placeholder="Min. 8 characters"
                  value={form.password} onChange={set('password')} required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-3 mt-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: '#64748B' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: '#A78BFA' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
