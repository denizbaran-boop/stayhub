import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import CreateListingPage from './pages/CreateListingPage';
import EditListingPage from './pages/EditListingPage';
import GuestDashboard from './pages/GuestDashboard';
import HostDashboard from './pages/HostDashboard';
import SearchResultsPage from './pages/SearchResultsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CheckoutPage from './pages/CheckoutPage';
import PublicProfilePage from './pages/PublicProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminRevenuePage from './pages/AdminRevenuePage';
import HostPayoutsPage from './pages/HostPayoutsPage';
import HostEarningsPage from './pages/HostEarningsPage';
import InboxPage from './pages/InboxPage';
import ManageAvailabilityPage from './pages/ManageAvailabilityPage';
import MapSearchPage from './pages/MapSearchPage';
import FeaturedPage from './pages/FeaturedPage';
import SettingsPage from './pages/SettingsPage';
import WishlistsPage from './pages/WishlistsPage';
import WishlistDetailPage from './pages/WishlistDetailPage';
import SeasonalPricingPage from './pages/SeasonalPricingPage';
import MyDisputesPage from './pages/MyDisputesPage';
import AdminDisputesPage from './pages/AdminDisputesPage';
import HostOccupancyPage from './pages/HostOccupancyPage';
import HostReviewsPage from './pages/HostReviewsPage';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/map-search" element={<MapSearchPage />} />
        <Route path="/featured" element={<FeaturedPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route path="/users/:id" element={<PublicProfilePage />} />

        <Route
          path="/create-listing"
          element={
            <ProtectedRoute requiredRole="host">
              <CreateListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-listing/:id"
          element={
            <ProtectedRoute requiredRole="host">
              <EditListingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/guest"
          element={
            <ProtectedRoute>
              <GuestDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/host"
          element={
            <ProtectedRoute requiredRole="host">
              <HostDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/host/payouts"
          element={
            <ProtectedRoute requiredRole="host">
              <HostPayoutsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/host/earnings"
          element={
            <ProtectedRoute requiredRole="host">
              <HostEarningsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/host/properties/:propertyId/availability"
          element={
            <ProtectedRoute requiredRole="host">
              <ManageAvailabilityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/:bookingId"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <InboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inbox/:conversationId"
          element={
            <ProtectedRoute>
              <InboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/revenue"
          element={
            <AdminRoute>
              <AdminRevenuePage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <AdminRoute>
              <AdminDisputesPage />
            </AdminRoute>
          }
        />

        <Route
          path="/wishlists"
          element={
            <ProtectedRoute>
              <WishlistsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlists/:id"
          element={
            <ProtectedRoute>
              <WishlistDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/disputes"
          element={
            <ProtectedRoute>
              <MyDisputesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/host/properties/:propertyId/seasonal-pricing"
          element={
            <ProtectedRoute requiredRole="host">
              <SeasonalPricingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/host/occupancy"
          element={
            <ProtectedRoute requiredRole="host">
              <HostOccupancyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/host/reviews"
          element={
            <ProtectedRoute requiredRole="host">
              <HostReviewsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
