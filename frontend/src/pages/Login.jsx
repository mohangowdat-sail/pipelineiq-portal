import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate('/incidents')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at center, #1a1228 0%, #0F1117 70%)' }}>
      <div className="w-full max-w-sm">
        <div className="card border-border/80 p-8 shadow-2xl"
          style={{ background: 'radial-gradient(ellipse at top, #1e1830 0%, #1A1D27 60%)' }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-accent/20">
              <Zap size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">PipelineIQ</h1>
            <p className="text-text-muted text-sm mt-1">AI-native pipeline observability</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wide">Username</label>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Enter username" required autoFocus
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-xs font-medium mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter password" required
                className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/60 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-critical text-sm bg-critical/10 border border-critical/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-text-muted text-xs text-center">Demo credentials — any username / <span className="text-text-secondary font-mono">PipelineIQ2025</span></p>
            <div className="mt-2 grid grid-cols-3 gap-1">
              {['mohan','keerthana','owais','anis','jayasree','anosh'].map(u => (
                <button key={u} onClick={() => setUsername(u)}
                  className="text-xs text-text-muted hover:text-accent hover:bg-accent/10 rounded px-2 py-1 transition-colors font-mono">
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
