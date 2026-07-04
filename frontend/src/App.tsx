import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Playground from './pages/Playground'
import ApiKeys from './pages/ApiKeys'
import Models from './pages/Models'
import Analytics from './pages/Analytics'
import CostTracking from './pages/CostTracking'
import AuditLogs from './pages/AuditLogs'
import Settings from './pages/Settings'
import Register from './pages/Register'

/**
 * Router. Login/Register are unauthenticated pages; everything else
 * lives inside <Layout> which provides the sidebar + top bar.
 *
 * "Auth" is intentionally mock for the demo — the Login page just
 * navigates you to /dashboard. Real auth is Priority 3 backend work
 * and would sit on top of this same router unchanged.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/api-keys" element={<ApiKeys />} />
        <Route path="/models" element={<Models />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/cost-tracking" element={<CostTracking />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
