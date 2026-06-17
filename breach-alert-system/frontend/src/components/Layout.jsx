import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect, useState } from 'react'
import { alertsAPI } from '../services/api'
import {
  LayoutDashboard, Shield, Bell, BarChart3,
  Settings, LogOut, ShieldAlert, Menu, X
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assets', icon: Shield, label: 'Monitored Assets' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/notifications', icon: Settings, label: 'Notifications' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    alertsAPI.getUnreadCount().then(r => setUnread(r.data.count)).catch(() => {})
    const interval = setInterval(() => {
      alertsAPI.getUnreadCount().then(r => setUnread(r.data.count)).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  const roleColors = { admin: '#7C3AED', legal: '#3B82F6', government: '#10B981', user: '#94A3B8' }
  const roleColor = roleColors[user?.role] || '#94A3B8'

  return (
    <div className="flex min-h-screen" style={{ background: '#050816' }}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'rgba(10,12,28,0.98)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)' }}>
            <ShieldAlert size={20} color="white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight">BreachAlert</div>
            <div className="text-xs" style={{ color: '#7C3AED' }}>Legal & Gov Edition</div>
          </div>
          <button className="ml-auto lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="mx-4 my-4 p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: `linear-gradient(135deg,${roleColor},${roleColor}88)` }}>
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user?.full_name}</div>
              <div className="text-xs capitalize truncate" style={{ color: roleColor }}>{user?.role}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                  ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`
              }
              style={({ isActive }) => isActive ? {
                background: 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(168,85,247,0.1))',
                border: '1px solid rgba(124,58,237,0.3)', color: 'white'
              } : {}}>
              <Icon size={17} />
              <span>{label}</span>
              {label === 'Alerts' && unread > 0 && (
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 lg:hidden"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,12,28,0.98)' }}>
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} color="#7C3AED" />
            <span className="font-bold text-white text-sm">BreachAlert</span>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
