import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/useStore';
import SplashScreen from './components/SplashScreen';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import OnboardingFlow from './pages/onboarding/OnboardingFlow';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import CalendarPage from './pages/dashboard/CalendarPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import CustomersPage from './pages/dashboard/CustomersPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import DemoOne from './pages/DemoOne';
import LandingV2 from './pages/LandingV2';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      <SplashScreen onDone={() => setSplashDone(true)} />
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingV2 />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <OnboardingFlow />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CalendarPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/demo" element={<DemoOne />} />
          <Route path="/v2" element={<LandingV2 />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
    </>
  );
}
