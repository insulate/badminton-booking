import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ROUTES } from './constants';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';

// Settings Pages
import VenueSettingsPage from './pages/admin/settings/VenueSettingsPage';
import OperatingHoursPage from './pages/admin/settings/OperatingHoursPage';
import BookingSettingsPage from './pages/admin/settings/BookingSettingsPage';
import PaymentSettingsPage from './pages/admin/settings/PaymentSettingsPage';
import GeneralSettingsPage from './pages/admin/settings/GeneralSettingsPage';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Redirect root to admin dashboard */}
        <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />

        {/* Protected Admin Routes */}
        <Route
          path={ROUTES.ADMIN.ROOT}
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />

          {/* Settings Routes */}
          <Route path="settings/venue" element={<VenueSettingsPage />} />
          <Route path="settings/operating" element={<OperatingHoursPage />} />
          <Route path="settings/booking" element={<BookingSettingsPage />} />
          <Route path="settings/payment" element={<PaymentSettingsPage />} />
          <Route path="settings/general" element={<GeneralSettingsPage />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
