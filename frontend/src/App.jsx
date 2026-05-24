import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { connectSocket, disconnectSocket } from './services/socket'

import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'

import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import TournamentsPublicPage from './pages/public/TournamentsPublicPage'
import TournamentDetailPage from './pages/public/TournamentDetailPage'
import NotFoundPage from './pages/public/NotFoundPage'

import UserDashboard from './pages/user/UserDashboard'
import UserTeams from './pages/user/UserTeams'
import UserRegistrations from './pages/user/UserRegistrations'
import UserProfile from './pages/user/UserProfile'
import UserPayments from './pages/user/UserPayments'

import OrganizerDashboard from './pages/organizer/OrganizerDashboard'
import OrganizerTournaments from './pages/organizer/OrganizerTournaments'
import CreateTournamentPage from './pages/organizer/CreateTournamentPage'
import TournamentManagePage from './pages/organizer/TournamentManagePage'
import OrganizerGrounds from './pages/organizer/OrganizerGrounds'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTournaments from './pages/admin/AdminTournaments'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'
import AdminPendingApprovals from './pages/admin/AdminPendingApprovals'

import DiscussionForum from './pages/shared/DiscussionForum'

import PrivateRoute from './components/PrivateRoute'
import RoleRoute from './components/RoleRoute'

function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      try { connectSocket() } catch (_) {}
    } else {
      disconnectSocket()
    }
    return () => { disconnectSocket() }
  }, [isAuthenticated])

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ─────────────────────────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tournaments" element={<TournamentsPublicPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ── Dashboard redirect ─────────────────────────────────────── */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            {user?.role === 'admin' ? <Navigate to="/admin" replace /> :
             user?.role === 'organizer' ? <Navigate to="/organizer" replace /> :
             <Navigate to="/user" replace />}
          </PrivateRoute>
        } />

        {/* ── User ──────────────────────────────────────────────────── */}
        <Route path="/user" element={<RoleRoute allowedRoles={['user']}><DashboardLayout /></RoleRoute>}>
          <Route index element={<UserDashboard />} />
          <Route path="teams" element={<UserTeams />} />
          <Route path="registrations" element={<UserRegistrations />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="payments" element={<UserPayments />} />
          <Route path="support" element={<DiscussionForum />} />
        </Route>

        {/* ── Organizer ─────────────────────────────────────────────── */}
        <Route path="/organizer" element={<RoleRoute allowedRoles={['organizer']}><DashboardLayout /></RoleRoute>}>
          <Route index element={<OrganizerDashboard />} />
          <Route path="tournaments" element={<OrganizerTournaments />} />
          <Route path="tournaments/create" element={<CreateTournamentPage />} />
          <Route path="tournaments/:id/manage" element={<TournamentManagePage />} />
          <Route path="grounds" element={<OrganizerGrounds />} />
          <Route path="support" element={<DiscussionForum />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* ── Admin ─────────────────────────────────────────────────── */}
        <Route path="/admin" element={<RoleRoute allowedRoles={['admin']}><DashboardLayout /></RoleRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="tournaments" element={<AdminTournaments />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="pending-approvals" element={<AdminPendingApprovals />} />
          <Route path="support" element={<DiscussionForum />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
