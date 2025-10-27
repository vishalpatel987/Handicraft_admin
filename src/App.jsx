// File: admin/src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import EditProduct from "./pages/EditProduct";
import SidebarLayout from "./components/SidebarLayout";

import AdminForgotPassword from './pages/AdminForgotPassword';
import AdminOTPVerification from './pages/AdminOTPVerification';

import Categories from './pages/Categories';
import Subcategories from './pages/Subcategories';
import EditCategories from "./pages/EditCategories";
import EditCategoriesNew from './pages/EditCategoriesNew';
import ErrorBoundary from './components/ErrorBoundary';
import HeroCarousel from './pages/HeroCarousel';
import EditHeroCarousel from './pages/EditHeroCarousel';
import CouponManagement from './pages/CouponManagement';
import DataPage from './pages/DataPage';
import Settings from './pages/Settings';
import AdminProfile from './pages/AdminProfile';
import Users from './pages/Users';
import Blogs from './pages/Blogs';
import EditBlog from './pages/EditBlog';
import Announcements from './pages/Announcements';
import WishlistManagement from './pages/WishlistManagement';
import PaymentHistory from './pages/PaymentHistory';
import RefundManagement from './pages/RefundManagement';
import RevenueSettlement from './pages/RevenueSettlement';
import CustomerSupport from './pages/CustomerSupport';
import { SocketProvider } from './contexts/SocketContext';
import apiService from './services/api';

const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const adminLoggedIn = localStorage.getItem("admin_logged_in") === "true";
  return token && adminLoggedIn;
};

const ProtectedRoute = ({ children }) => {
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      console.log('Validating token...');
      console.log('Token exists:', !!localStorage.getItem('token'));
      console.log('Admin logged in:', localStorage.getItem('admin_logged_in'));
      
      if (!isAuthenticated()) {
        console.log('Not authenticated, redirecting to login');
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        console.log('Verifying token with backend...');
        const result = await apiService.verifyToken();
        console.log('Token verification successful:', result);
        setIsValid(true);
      } catch (error) {
        console.error('Token validation failed:', error);
        // Clear invalid tokens
        apiService.logout();
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Validating authentication...</p>
        </div>
      </div>
    );
  }

  return isValid ? <SidebarLayout>{children}</SidebarLayout> : <Navigate to="/admin/login" replace />;
};

const App = () => {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <Router>
          <Routes>
          {/* Public routes */}
          <Route path="/admin/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/admin/products/new" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
          <Route path="/admin/products/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/admin/categories/:categoryId/subcategories" element={<ProtectedRoute><Subcategories /></ProtectedRoute>} />
          <Route path="/admin/categories/edit/:id" element={<ProtectedRoute><EditCategoriesNew /></ProtectedRoute>} />
          <Route path="/admin/categories/edit/new" element={<ProtectedRoute><EditCategoriesNew /></ProtectedRoute>} />
       
        
          <Route path="/admin/hero-carousel" element={<ProtectedRoute><HeroCarousel /></ProtectedRoute>} />
          <Route path="/admin/hero-carousel/edit/:id" element={<ProtectedRoute><EditHeroCarousel /></ProtectedRoute>} />
          <Route path="/admin/hero-carousel/new" element={<ProtectedRoute><EditHeroCarousel /></ProtectedRoute>} />
      
          <Route path="/admin/coupons" element={<ProtectedRoute><CouponManagement /></ProtectedRoute>} />
          <Route path="/admin/blogs" element={<ProtectedRoute><Blogs /></ProtectedRoute>} />
          <Route path="/admin/blogs/new" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
          <Route path="/admin/blogs/edit/:id" element={<ProtectedRoute><EditBlog /></ProtectedRoute>} />
          <Route path="/admin/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
          <Route path="/admin/wishlist" element={<ProtectedRoute><WishlistManagement /></ProtectedRoute>} />
          <Route path="/admin/data" element={<ProtectedRoute><DataPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/admin/payment-history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
          <Route path="/admin/refund-management" element={<ProtectedRoute><RefundManagement /></ProtectedRoute>} />
          <Route path="/admin/revenue-settlement" element={<ProtectedRoute><RevenueSettlement /></ProtectedRoute>} />
          <Route path="/admin/customer-support" element={<ProtectedRoute><CustomerSupport /></ProtectedRoute>} />

          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin/verify-otp" element={<AdminOTPVerification />} />

          
          {/* Catch all route - redirect to admin dashboard */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </ErrorBoundary>
  );
};

export default App;