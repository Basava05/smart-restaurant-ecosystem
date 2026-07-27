import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ToastContainer from './components/ui/Toast';

// Layouts
import CustomerLayout from './components/layout/CustomerLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import KDSLayout from './components/layout/KDSLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Customer pages
import HomePage from './pages/customer/HomePage';
import RestaurantsPage from './pages/customer/RestaurantsPage';
import MenuPage from './pages/customer/MenuPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import ProfilePage from './pages/customer/ProfilePage';

// Owner pages
import OwnerDashboard from './pages/owner/OwnerDashboard';
import MenuManagementPage from './pages/owner/MenuManagementPage';
import AnalyticsPage from './pages/owner/AnalyticsPage';
import OrdersPage from './pages/owner/OrdersPage';
import KDSPage from './pages/owner/KDSPage';

// Kitchen pages
// using KDSPage from owner/KDSPage

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Dev pages
import StyleGuidePage from './pages/dev/StyleGuidePage';

/**
 * ProtectedRoute — redirects to login if not authenticated,
 * or to home if role doesn't match.
 */
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* ── Auth ────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ── Dev (internal) ─────────────── */}
        <Route path="/dev/styleguide" element={<StyleGuidePage />} />

        {/* ── Customer (public) ──────────── */}
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/restaurant/:restaurantId" element={<MenuPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          {/* Legacy route redirect */}
          <Route path="/customer-welcome" element={<Navigate to="/restaurants" replace />} />
        </Route>

        {/* ── Owner Dashboard ────────────── */}
        <Route
          element={
            <ProtectedRoute roles={['owner', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          <Route path="/owner/menu" element={<MenuManagementPage />} />
          <Route path="/owner/orders" element={<OrdersPage />} />
          <Route path="/owner/analytics" element={<AnalyticsPage />} />
        </Route>

        {/* ── Kitchen Display ────────────── */}
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={['chef', 'owner', 'admin']}>
              <KDSLayout>
                <KDSPage />
              </KDSLayout>
            </ProtectedRoute>
          }
        />

        {/* ── Admin Panel ────────────────── */}
        <Route
          element={
            <ProtectedRoute roles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* ── Catch-all redirect ───────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
