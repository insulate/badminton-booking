import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ROUTES } from './constants';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import PlayersPage from './pages/admin/PlayersPage';

// Auth Stores
import useAuthStore from './store/authStore';
import usePlayerAuthStore from './store/playerAuthStore';

// Customer Pages
import CustomerLayout from './components/customer/CustomerLayout';
import HomePage from './pages/customer/HomePage';
import RulesPage from './pages/customer/RulesPage';
import CustomerBookingPage from './pages/customer/CustomerBookingPage';
import CustomerLoginPage from './pages/customer/CustomerLoginPage';
import CustomerRegisterPage from './pages/customer/CustomerRegisterPage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import PaymentPage from './pages/customer/PaymentPage';

// Customer Protected Route
import CustomerProtectedRoute from './components/customer/CustomerProtectedRoute';

// Settings Pages
import VenueSettingsPage from './pages/admin/settings/VenueSettingsPage';
import OperatingHoursPage from './pages/admin/settings/OperatingHoursPage';
import BookingSettingsPage from './pages/admin/settings/BookingSettingsPage';
import PaymentSettingsPage from './pages/admin/settings/PaymentSettingsPage';
import GeneralSettingsPage from './pages/admin/settings/GeneralSettingsPage';
import FloorPlanSettingsPage from './pages/admin/settings/FloorPlanSettingsPage';

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

// Sales History Page
import SalesHistoryPage from './pages/admin/SalesHistoryPage';

// Booking Pages
import BookingPage from './pages/admin/BookingPage';
import BookingsPage from './pages/admin/BookingsPage';
import RecurringBookingsPage from './pages/admin/RecurringBookingsPage';

// Group Play Page
import GroupPlayPage from './pages/admin/GroupPlayPage';

// Reports Page
import ReportsPage from './pages/admin/ReportsPage';

// Attendance & Shift Pages
import AttendancePage from './pages/admin/AttendancePage';
import ShiftPage from './pages/admin/ShiftPage';

function App() {
  const { initAuth } = useAuthStore();
  const { initAuth: initPlayerAuth } = usePlayerAuthStore();

  useEffect(() => {
    initAuth();
    initPlayerAuth();
  }, [initAuth, initPlayerAuth]);

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
        {/* Customer Public Routes */}
        <Route element={<CustomerLayout />}>
          <Route path={ROUTES.CUSTOMER.HOME} element={<HomePage />} />
          <Route path={ROUTES.CUSTOMER.RULES} element={<RulesPage />} />
          <Route path={ROUTES.CUSTOMER.BOOKING} element={<CustomerBookingPage />} />
          <Route path={ROUTES.CUSTOMER.LOGIN} element={<CustomerLoginPage />} />
          <Route path={ROUTES.CUSTOMER.REGISTER} element={<CustomerRegisterPage />} />
          <Route path="/payment/:bookingId" element={<PaymentPage />} />

          {/* Customer Protected Routes */}
          <Route element={<CustomerProtectedRoute />}>
            <Route path={ROUTES.CUSTOMER.MY_BOOKINGS} element={<MyBookingsPage />} />
          </Route>
        </Route>

        {/* Admin Login (moved to /admin/login) */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

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

          {/* Attendance & Shift Routes */}
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="shifts" element={<ShiftPage />} />

          {/* Group Play Route */}
          <Route path="groupplay" element={<GroupPlayPage />} />

          {/* Booking Routes */}
          <Route path="booking" element={<BookingPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="recurring-bookings" element={<RecurringBookingsPage />} />

          {/* POS Route */}
          <Route path="pos" element={<POSPage />} />

          {/* Sales History Route */}
          <Route path="sales" element={<SalesHistoryPage />} />

          {/* Reports Route */}
          <Route path="reports" element={<ReportsPage />} />

          {/* Settings Routes */}
          <Route path="settings/venue" element={<VenueSettingsPage />} />
          <Route path="settings/operating" element={<OperatingHoursPage />} />
          <Route path="settings/booking" element={<BookingSettingsPage />} />
          <Route path="settings/payment" element={<PaymentSettingsPage />} />
          <Route path="settings/general" element={<GeneralSettingsPage />} />
          <Route path="settings/floor-plan" element={<FloorPlanSettingsPage />} />

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

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to={ROUTES.CUSTOMER.HOME} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
