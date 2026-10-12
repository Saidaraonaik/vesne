import { useEffect } from 'react'
import { Button } from '@mui/material'
import { Link as RouterLink, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useApp } from '../app/app-context.ts'
import { EmptyState } from '../components/common/EmptyState.tsx'
import { AppShell } from '../components/layout/AppShell.tsx'
import { homePath } from '../data/demoUsers.ts'
import { AdminDashboard } from '../features/admin/AdminDashboard.tsx'
import { ClientsPage } from '../features/admin/ClientsPage.tsx'
import { ExecutorsPage } from '../features/admin/ExecutorsPage.tsx'
import { AdminMapPage } from '../features/admin/MapPage.tsx'
import { ProjectDetailPage } from '../features/admin/ProjectDetailPage.tsx'
import { ProjectsPage } from '../features/admin/ProjectsPage.tsx'
import { AdminReportsPage } from '../features/admin/ReportsPage.tsx'
import { SettingsPage } from '../features/admin/SettingsPage.tsx'
import { TaskDetailPage } from '../features/admin/TaskDetailPage.tsx'
import { TasksPage } from '../features/admin/TasksPage.tsx'
import { VerificationPage } from '../features/admin/VerificationPage.tsx'
import { LoginPage } from '../features/auth/LoginPage.tsx'
import { LandingPage } from '../features/landing/LandingPage.tsx'
import { ClientDashboard } from '../features/client/ClientDashboard.tsx'
import { ClientMapPage } from '../features/client/ClientMapPage.tsx'
import { ClientProjectDetailPage } from '../features/client/ClientProjectDetailPage.tsx'
import { ClientProjectsPage } from '../features/client/ClientProjectsPage.tsx'
import { ClientReportsPage } from '../features/client/ClientReportsPage.tsx'
import { GalleryPage } from '../features/client/GalleryPage.tsx'
import { ExecutorDashboard } from '../features/executor/ExecutorDashboard.tsx'
import { MyTasksPage } from '../features/executor/MyTasksPage.tsx'
import { SubmissionHistoryPage } from '../features/executor/SubmissionHistoryPage.tsx'
import { TaskExecutionPage } from '../features/executor/TaskExecutionPage.tsx'
import { ProfilePage } from '../features/profile/ProfilePage.tsx'
import type { Role } from '../types/models.ts'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Guard({ role }: { role: Role }) {
  const { session } = useApp()
  if (!session) return <Navigate to="/login" replace />
  if (session.role !== role) return <Navigate to={homePath(session.role)} replace />
  return <Outlet />
}

function ExecutionRoute() {
  const { taskId } = useParams()
  return <TaskExecutionPage key={taskId} />
}

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route path="/admin" element={<Guard role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="tasks/:taskId" element={<TaskDetailPage />} />
            <Route path="executors" element={<ExecutorsPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="verification" element={<VerificationPage />} />
            <Route path="verification/:submissionId" element={<VerificationPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="map" element={<AdminMapPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/executor" element={<Guard role="executor" />}>
            <Route index element={<ExecutorDashboard />} />
            <Route path="tasks" element={<MyTasksPage />} />
            <Route path="tasks/:taskId" element={<ExecutionRoute />} />
            <Route path="submissions" element={<SubmissionHistoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="/client" element={<Guard role="client" />}>
            <Route index element={<ClientDashboard />} />
            <Route path="projects" element={<ClientProjectsPage />} />
            <Route path="projects/:projectId" element={<ClientProjectDetailPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="map" element={<ClientMapPage />} />
            <Route path="reports" element={<ClientReportsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <EmptyState
              title="Page not found"
              body="This demo route does not exist."
              action={<Button component={RouterLink} to="/">Go to Vesne</Button>}
            />
          }
        />
      </Routes>
    </>
  )
}
