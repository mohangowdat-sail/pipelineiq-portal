import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Incidents from './pages/Incidents'
import Pipelines from './pages/Pipelines'
import PatternAnalysis from './pages/PatternAnalysis'
import Notifications from './pages/Notifications'
import Engineers from './pages/Engineers'
import ComingSoon from './pages/ComingSoon'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-bg">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/incidents" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="incidents" element={<Incidents />} />
            <Route path="pipelines" element={<Pipelines />} />
            <Route path="patterns" element={<PatternAnalysis />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="engineers" element={<Engineers />} />
            <Route path="coming-soon" element={<ComingSoon />} />
          </Route>
          <Route path="*" element={<Navigate to="/incidents" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
