import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import CreateProject from './pages/CreateProject';
import ProjectDetails from './pages/ProjectDetails';
import AddSite from './pages/AddSite';
import SiteDetails from './pages/SiteDetails';
import GisMapPage from './pages/GisMapPage';
import EnvironmentalDataPage from './pages/EnvironmentalDataPage';
import HealthStatusPage from './pages/HealthStatusPage';
import SolarAnalysisPage from './pages/SolarAnalysisPage';
import WindAnalysisPage from './pages/WindAnalysisPage';
import SiteSuitabilityPage from './pages/SiteSuitabilityPage';
import SiteScorePage from './pages/SiteScorePage';
import EnergyForecastPage from './pages/EnergyForecastPage';
import DeploymentOptimizationPage from './pages/DeploymentOptimizationPage';
import RecommendationPage from './pages/RecommendationPage';
import ReportsPage from './pages/ReportsPage';
import SiteComparisonPage from './pages/SiteComparisonPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminDataSourcesPage from './pages/AdminDataSourcesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

// Role Specific Dashboards
import PlannerDashboard from './pages/dashboards/PlannerDashboard';
import GisDashboard from './pages/dashboards/GisDashboard';
import ManagerDashboard from './pages/dashboards/ManagerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

import { checkSystemHealth } from './services/api';

// ── Authenticated Main Layout with Sidebar ───────────────────────────────────
function MainLayout({ children, systemHealth }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Navbar systemHealth={systemHealth} />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
      <Footer />
    </div>
  );
}

// ── Auth Pages Standalone Layout (No Sidebar) ────────────────────────────────
function AuthPageLayout({ children, systemHealth }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Navbar systemHealth={systemHealth} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex items-center justify-center">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// ── App Inner Router & Context Consumer ──────────────────────────────────────
function AppRoutes({ systemHealth }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-semibold text-slate-700">Verifying Platform Session...</span>
        </div>
      </div>
    );
  }


  return (
    <Routes>
      {/* Root Route: Unauthenticated -> Public Landing Page; Authenticated -> Dashboard */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <MainLayout systemHealth={systemHealth}>
              <DashboardPage />
            </MainLayout>
          ) : (
            <LandingPage />
          )
        }
      />

      {/* Auth Public Pages (No Sidebar) */}
      <Route
        path="/login"
        element={
          <AuthPageLayout systemHealth={systemHealth}>
            <LoginPage />
          </AuthPageLayout>
        }
      />
      <Route
        path="/register"
        element={
          <AuthPageLayout systemHealth={systemHealth}>
            <RegisterPage />
          </AuthPageLayout>
        }
      />
      <Route
        path="/unauthorized"
        element={
          <AuthPageLayout systemHealth={systemHealth}>
            <UnauthorizedPage />
          </AuthPageLayout>
        }
      />

      {/* Protected Application Routes (Inside MainLayout with Navbar + Sidebar) */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <ProjectsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/new"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <CreateProject />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <ProjectDetails />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sites"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <ProjectsPage showSitesMode />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sites/new"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <AddSite />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sites/:id"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <SiteDetails />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['GIS_ANALYST', 'ENERGY_PLANNER', 'ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <GisMapPage />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/environmental-data"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <EnvironmentalDataPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/solar-analysis"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <SolarAnalysisPage />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/wind-analysis"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <WindAnalysisPage />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/suitability"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <SiteSuitabilityPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/scoring"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <SiteScorePage />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/forecast"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <EnergyForecastPage />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/optimization"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <DeploymentOptimizationPage />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/recommendations"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ENERGY_PLANNER', 'PROJECT_MANAGER', 'ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <RecommendationPage />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <ReportsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/comparison"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <SiteComparisonPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <NotificationsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout systemHealth={systemHealth}>
              <ProfilePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Exclusive Routes */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <AdminUsersPage />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/data-sources"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <AdminDataSourcesPage />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/health"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['ADMINISTRATOR']}>
              <MainLayout systemHealth={systemHealth}>
                <HealthStatusPage />
              </MainLayout>
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* Role Specific Perspective Hubs */}
      <Route path="/dashboard/planner" element={<ProtectedRoute><MainLayout systemHealth={systemHealth}><PlannerDashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/dashboard/gis" element={<ProtectedRoute><MainLayout systemHealth={systemHealth}><GisDashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/dashboard/manager" element={<ProtectedRoute><MainLayout systemHealth={systemHealth}><ManagerDashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/dashboard/admin" element={<ProtectedRoute><MainLayout systemHealth={systemHealth}><AdminDashboard /></MainLayout></ProtectedRoute>} />

      {/* 404 Fallback */}
      <Route path="*" element={<AuthPageLayout systemHealth={systemHealth}><NotFoundPage /></AuthPageLayout>} />
    </Routes>
  );
}

export default function App() {
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    async function loadHealth() {
      const data = await checkSystemHealth();
      setSystemHealth(data);
    }
    loadHealth();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <AppRoutes systemHealth={systemHealth} />
      </Router>
    </AuthProvider>
  );
}
