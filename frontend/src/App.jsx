import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ROUTES } from './constants';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import PlayersPage from './pages/admin/PlayersPage';

// Settings Pages
import VenueSettingsPage from './pages/admin/settings/VenueSettingsPage';
import OperatingHoursPage from './pages/admin/settings/OperatingHoursPage';
import BookingSettingsPage from './pages/admin/settings/BookingSettingsPage';
import PaymentSettingsPage from './pages/admin/settings/PaymentSettingsPage';
import GeneralSettingsPage from './pages/admin/settings/GeneralSettingsPage';

// Courts Pages
import CourtsPage from './pages/admin/settings/courts/CourtsPage';
import CourtsAddPage from './pages/admin/settings/courts/CourtsAddPage';
import CourtsEditPage from './pages/admin/settings/courts/CourtsEditPage';

// TimeSlots Pages
import TimeSlotsPage from './pages/admin/settings/timeslots/TimeSlotsPage';

// Products Pages
import ProductsPage from './pages/admin/settings/products/ProductsPage';

// Categories Page
import CategoryManagementPage from './pages/admin/CategoryManagementPage';

// POS Page
import POSPage from './pages/admin/POSPage';

// Booking Pages
import BookingPage from './pages/admin/BookingPage';
import BookingsPage from './pages/admin/BookingsPage';

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
          <Route path="players" element={<PlayersPage />} />

          {/* Booking Routes */}
          <Route path="booking" element={<BookingPage />} />
          <Route path="bookings" element={<BookingsPage />} />

          {/* POS Route */}
          <Route path="pos" element={<POSPage />} />

          {/* Settings Routes */}
          <Route path="settings/venue" element={<VenueSettingsPage />} />
          <Route path="settings/operating" element={<OperatingHoursPage />} />
          <Route path="settings/booking" element={<BookingSettingsPage />} />
          <Route path="settings/payment" element={<PaymentSettingsPage />} />
          <Route path="settings/general" element={<GeneralSettingsPage />} />

          {/* Courts Routes */}
          <Route path="settings/courts" element={<CourtsPage />} />
          <Route path="settings/courts/add" element={<CourtsAddPage />} />
          <Route path="settings/courts/edit/:id" element={<CourtsEditPage />} />

          {/* TimeSlots Routes */}
          <Route path="settings/timeslots" element={<TimeSlotsPage />} />

          {/* Products Routes */}
          <Route path="settings/products" element={<ProductsPage />} />

          {/* Categories Routes */}
          <Route path="settings/categories" element={<CategoryManagementPage />} />
        </Route>

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to={ROUTES.ADMIN.DASHBOARD} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
