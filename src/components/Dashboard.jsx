import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart,
  IndianRupee
} from 'lucide-react';
import apiService from '../services/api';
import config from '../config/config';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    featuredProducts: 0,
    bestSellers: 0,
    mostLoved: 0,
    totalOrders: 0,
    totalUsers: 0,
    activeUsers: 0,
    googleUsers: 0,
    regularUsers: 0
  });
  
  const [salesAnalytics, setSalesAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    statusBreakdown: {},
    paymentBreakdown: {},
    revenueBreakdown: { pending: 0, earned: 0, confirmed: 0, total: 0 },
    growth: { revenue: 0, orders: 0 }
  });
  
  const [stockSummary, setStockSummary] = useState({
    totalProducts: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
    totalStockValue: 0,
    lowStockAlerts: [],
    categoryBreakdown: {}
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [userDetails, setUserDetails] = useState({ registered: [], anonymous: [] });
  const [userAnalytics, setUserAnalytics] = useState({
    userStats: {
      totalUsers: 0,
      registeredUsers: 0,
      registeredButNotLoggedIn: 0,
      activeRegisteredUsers: 0,
      activeAnonymousUsers: 0
    },
    activityStats: {
      totalActivities: 0,
      activityCounts: {},
      registeredUserActivities: 0,
      anonymousUserActivities: 0
    },
    popularCategories: [],
    popularSubCategories: [],
    mostViewedProducts: [],
    userEngagement: {
      registeredUserEngagement: 0,
      anonymousUserEngagement: 0,
      totalEngagement: 0
    }
  });

  useEffect(() => {
    fetchStats();
    fetchSalesAnalytics();
    fetchStockSummary();
    fetchUserAnalytics();
  }, [selectedPeriod]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all products
      const allProducts = await apiService.getProducts();
      const featured = await apiService.getProductsBySection('featured');
      const bestSellers = await apiService.getProductsBySection('bestsellers');
      const mostLoved = await apiService.getProductsBySection('mostloved');
      const orders = await apiService.getOrders();
      
      // Fetch user statistics
      let userStats = { totalUsers: 0, activeUsers: 0, googleUsers: 0, regularUsers: 0 };
      try {
        const userStatsResponse = await apiService.getUserStats();
        userStats = userStatsResponse.data.stats;
      } catch (userError) {
        console.warn('Could not fetch user stats:', userError);
      }

      setStats({
        totalProducts: allProducts.data.length,
        featuredProducts: featured.data.length,
        bestSellers: bestSellers.data.length,
        mostLoved: mostLoved.data.length,
        totalOrders: orders.data.length,
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        googleUsers: userStats.googleUsers,
        regularUsers: userStats.regularUsers
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesAnalytics = async () => {
    try {
      const response = await apiService.getSalesAnalytics(selectedPeriod);
      setSalesAnalytics(response.data.analytics);
    } catch (err) {
      console.error('Error fetching sales analytics:', err);
    }
  };

  const fetchStockSummary = async () => {
    try {
      const response = await apiService.getStockSummary();
      setStockSummary(response.data.stockSummary);
    } catch (err) {
      console.error('Error fetching stock summary:', err);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      console.log('Fetching user analytics for period:', selectedPeriod);
      const response = await apiService.getUserAnalytics(selectedPeriod);
      console.log('User analytics response:', response.data);
      setUserAnalytics(response.data.analytics);
    } catch (err) {
      console.error('Error fetching user analytics:', err);
      console.error('Error details:', err.response?.data);
      // Set default values to prevent zero display
      setUserAnalytics({
        userStats: {
          totalUsers: 0,
          registeredUsers: 0,
          registeredButNotLoggedIn: 0,
          activeRegisteredUsers: 0,
          activeAnonymousUsers: 0
        },
        activityStats: {
          totalActivities: 0,
          activityCounts: {},
          registeredUserActivities: 0,
          anonymousUserActivities: 0
        },
        popularCategories: [],
        popularSubCategories: [],
        mostViewedProducts: [],
        userEngagement: {
          registeredUserEngagement: 0,
          anonymousUserEngagement: 0,
          totalEngagement: 0
        }
      });
    }
  };

  const fetchUserDetails = async (userType = 'all') => {
    try {
      console.log('🔍 Frontend: Fetching user details for type:', userType);
      const response = await apiService.getUserDetails(userType);
      console.log('🔍 Frontend: Received user details:', response.data);
      setUserDetails(response.data.users);
    } catch (err) {
      console.error('❌ Frontend: Error fetching user details:', err);
      console.error('❌ Error details:', err.response?.data || err.message);
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };


  const StatCard = ({ title, value, linkTo }) => (
    <Link 
      to={linkTo}
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
    >
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-3xl font-bold text-blue-600 mt-2">{value}</p>
    </Link>
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl text-red-600">{error}</div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Admin Dashboard</h1>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {['daily', 'monthly', 'yearly'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Overview Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="text-blue-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Sales Overview ({selectedPeriod})</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 cursor-pointer"
            onClick={() => setShowRevenueModal(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(salesAnalytics.totalRevenue)}</p>
              </div>
              <IndianRupee size={32} className="text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Orders</p>
                <p className="text-2xl font-bold">{salesAnalytics.totalOrders}</p>
              </div>
              <ShoppingCart size={32} className="text-green-200" />
            </div>
                </div>
               
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(salesAnalytics.averageOrderValue)}</p>
              </div>
              <Package size={32} className="text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
        <div>
                <p className="text-orange-100 text-sm">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users size={32} className="text-orange-200" />
        </div>
        </div>
      </div>

        {/* Sales Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Breakdown Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Breakdown</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-end justify-between h-48 space-x-2">
                {salesAnalytics.revenueBreakdown && Object.entries(salesAnalytics.revenueBreakdown).filter(([key]) => key !== 'total').map(([status, amount]) => {
                  const maxAmount = Math.max(...Object.values(salesAnalytics.revenueBreakdown).filter(val => typeof val === 'number'));
                  const height = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                  const colors = {
                    pending: 'bg-yellow-400',
                    earned: 'bg-blue-400', 
                    confirmed: 'bg-green-400'
                  };
                  return (
                    <div key={status} className="flex flex-col items-center flex-1">
                      <div className="text-xs text-gray-600 mb-2 text-center">
                        {formatCurrency(amount)}
                      </div>
                      <div 
                        className={`w-full rounded-t ${colors[status] || 'bg-gray-400'} transition-all duration-500 ease-in-out`}
                        style={{ height: `${height}%`, minHeight: amount > 0 ? '20px' : '0px' }}
                        title={`${status}: ${formatCurrency(amount)}`}
                      ></div>
                      <div className="text-xs text-gray-600 mt-2 text-center capitalize">
                        {status}
                      </div>
                    </div>
                  );
                })}
              </div>
              {salesAnalytics.totalRevenue === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No revenue data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Status Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Distribution</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-end justify-between h-48 space-x-2">
                {Object.entries(salesAnalytics.statusBreakdown).map(([status, count]) => {
                  const maxCount = Math.max(...Object.values(salesAnalytics.statusBreakdown));
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const colors = {
                    processing: 'bg-blue-400',
                    confirmed: 'bg-green-400',
                    manufacturing: 'bg-purple-400',
                    shipped: 'bg-orange-400',
                    delivered: 'bg-green-500',
                    cancelled: 'bg-red-400'
                  };
                  return (
                    <div key={status} className="flex flex-col items-center flex-1">
                      <div className="text-xs text-gray-600 mb-2 text-center">
                        {count}
                      </div>
                      <div 
                        className={`w-full rounded-t ${colors[status] || 'bg-gray-400'} transition-all duration-500 ease-in-out`}
                        style={{ height: `${height}%`, minHeight: count > 0 ? '20px' : '0px' }}
                        title={`${status}: ${count} orders`}
                      ></div>
                      <div className="text-xs text-gray-600 mt-2 text-center capitalize">
                        {status}
                      </div>
                    </div>
                  );
                })}
              </div>
              {salesAnalytics.totalOrders === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <PieChart size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No orders data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(salesAnalytics.statusBreakdown).map(([status, count]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 capitalize">{status}</p>
              <p className="text-xl font-bold text-gray-800">{count}</p>
          </div>
        ))}
      </div>
      </motion.div>

      {/* Stock Summary Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Package className="text-green-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Stock Summary</h2>
                </div>
               
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Link 
            to="/admin/products?stock=in_stock"
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">In Stock</p>
                <p className="text-2xl font-bold">{stockSummary.inStockProducts}</p>
              </div>
              <Package size={32} className="text-green-200" />
          </div>
          </Link>
          
          <Link 
            to="/admin/products?stock=out_of_stock"
            className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 cursor-pointer"
          >
                <div className="flex items-center justify-between">
                    <div>
                <p className="text-red-100 text-sm">Out of Stock</p>
                <p className="text-2xl font-bold">{stockSummary.outOfStockProducts}</p>
              </div>
              <AlertTriangle size={32} className="text-red-200" />
                    </div>
          </Link>
          
          <Link 
            to="/admin/products?stock=low_stock"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Low Stock</p>
                <p className="text-2xl font-bold">{stockSummary.lowStockProducts}</p>
                  </div>
              <AlertTriangle size={32} className="text-yellow-200" />
              </div>
          </Link>

          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stockSummary.totalStockValue)}</p>
              </div>
              <IndianRupee size={32} className="text-indigo-200" />
            </div>
              </div>
            </div>

        {/* Low Stock Alerts */}
        {stockSummary.lowStockAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="text-red-600" size={20} />
              <h3 className="text-lg font-semibold text-red-800">Low Stock Alerts</h3>
                  </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stockSummary.lowStockAlerts.slice(0, 6).map((product) => (
                <div key={product.id} className="bg-white rounded-lg p-3 border border-red-200">
                  <p className="font-medium text-gray-800 truncate">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.category}</p>
                  <p className="text-sm font-semibold text-red-600">Stock: {product.currentStock}</p>
          </div>
        ))}
      </div>
            {stockSummary.lowStockAlerts.length > 6 && (
              <p className="text-sm text-red-600 mt-2">
                +{stockSummary.lowStockAlerts.length - 6} more products with low stock
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Product Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts}
          linkTo="/admin/products"
        />
        <StatCard 
          title="Featured Products" 
          value={stats.featuredProducts}
          linkTo="/admin/products?section=featured"
        />
        <StatCard 
          title="Best Sellers" 
          value={stats.bestSellers}
          linkTo="/admin/products?section=bestsellers"
        />
        <StatCard 
          title="Most Loved" 
          value={stats.mostLoved}
          linkTo="/admin/products?section=mostloved"
        />
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Active Users" 
          value={stats.activeUsers}
          linkTo="/admin/users?filter=active"
        />
        <StatCard 
          title="Google Users" 
          value={stats.googleUsers}
          linkTo="/admin/users?filter=google"
        />
        <StatCard 
          title="Regular Users" 
          value={stats.regularUsers}
          linkTo="/admin/users?filter=regular"
        />
      </div>

      {/* User Analytics Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-purple-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">User Analytics ({selectedPeriod})</h2>
        </div>
        
        {/* User Engagement Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedUserType('all');
              setShowUserDetailsModal(true);
              fetchUserDetails('all');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Users</p>
                <p className="text-2xl font-bold">{userAnalytics.userStats.totalUsers}</p>
              </div>
              <Users size={32} className="text-blue-200" />
            </div>
      </div>

          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedUserType('registered');
              setShowUserDetailsModal(true);
              fetchUserDetails('registered');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Registered Users</p>
                <p className="text-2xl font-bold">{userAnalytics.userStats.registeredUsers}</p>
              </div>
              <Users size={32} className="text-green-200" />
            </div>
        </div>

          <div 
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedUserType('registered');
              setShowUserDetailsModal(true);
              fetchUserDetails('registered');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Active Registered</p>
                <p className="text-2xl font-bold">{userAnalytics.userStats.activeRegisteredUsers}</p>
              </div>
              <Users size={32} className="text-yellow-200" />
            </div>
          </div>
          
          <div 
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedUserType('anonymous');
              setShowUserDetailsModal(true);
              fetchUserDetails('anonymous');
            }}
          >
                <div className="flex items-center justify-between">
                    <div>
                <p className="text-orange-100 text-sm">Anonymous Users</p>
                <p className="text-2xl font-bold">{userAnalytics.userStats.activeAnonymousUsers}</p>
              </div>
              <Users size={32} className="text-orange-200" />
                    </div>
                  </div>
          
          <div 
            className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedUserType('registered');
              setShowUserDetailsModal(true);
              fetchUserDetails('registered');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Not Logged In</p>
                <p className="text-2xl font-bold">{userAnalytics.userStats.registeredButNotLoggedIn}</p>
              </div>
              <AlertTriangle size={32} className="text-red-200" />
            </div>
          </div>
        </div>

        {/* Activity Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Activities</span>
                <span className="font-bold text-blue-600">{userAnalytics.activityStats.totalActivities}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Add to Cart</span>
                <span className="font-bold text-green-600">{userAnalytics.activityStats.activityCounts.add_to_cart || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Category Visits</span>
                <span className="font-bold text-purple-600">{userAnalytics.activityStats.activityCounts.category_visit || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Product Views</span>
                <span className="font-bold text-orange-600">{userAnalytics.activityStats.activityCounts.product_view || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Engagement</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Registered Engagement</span>
                <span className="font-bold text-blue-600">{userAnalytics.userEngagement.registeredUserEngagement}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Anonymous Engagement</span>
                <span className="font-bold text-gray-600">{userAnalytics.userEngagement.anonymousUserEngagement}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Engagement</span>
                <span className="font-bold text-green-600">{userAnalytics.userEngagement.totalEngagement}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Popular Categories and Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Popular Categories</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {userAnalytics.popularCategories.map((category, index) => (
                <div key={category.categoryId} className="flex justify-between items-center">
                  <span className="text-gray-600">{index + 1}. {category.categoryName}</span>
                  <span className="font-bold text-blue-600">{category.visitCount} visits</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Popular Sub-Categories</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {userAnalytics.popularSubCategories.map((subCategory, index) => (
                <div key={subCategory.subCategoryId} className="flex justify-between items-center">
                  <span className="text-gray-600">{index + 1}. {subCategory.subCategoryName}</span>
                  <span className="font-bold text-purple-600">{subCategory.visitCount} visits</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Viewed Products</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {userAnalytics.mostViewedProducts.map((product, index) => (
                <div key={product.productId} className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-600 block truncate">{index + 1}. {product.productName}</span>
                    {product.category && (
                      <span className="text-xs text-gray-400">Category: {product.category}</span>
                    )}
                  </div>
                  <span className="font-bold text-green-600 ml-2">{product.viewCount} views</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/products/new" className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center">
            Add New Product
          </Link>
          <Link to="/admin/orders" className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-center">
            View Orders
          </Link>
          <Link to="/admin/users" className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors text-center">
            Manage Users
          </Link>
          <Link to="/admin/categories" className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors text-center">
            Manage Categories
          </Link>
        </div>
      </div>

      {/* Revenue Breakdown Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Revenue Breakdown</h2>
              <button
                onClick={() => setShowRevenueModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-800 text-sm font-medium">Pending Revenue</p>
                      <p className="text-yellow-900 text-xl font-bold">{formatCurrency(salesAnalytics.revenueBreakdown.pending)}</p>
                      <p className="text-yellow-700 text-xs">Orders Placed</p>
                    </div>
                    <div className="bg-yellow-200 p-2 rounded-lg">
                      <Package className="w-6 h-6 text-yellow-800" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-800 text-sm font-medium">Earned Revenue</p>
                      <p className="text-green-900 text-xl font-bold">{formatCurrency(salesAnalytics.revenueBreakdown.earned)}</p>
                      <p className="text-green-700 text-xs">Orders Delivered</p>
                    </div>
                    <div className="bg-green-200 p-2 rounded-lg">
                      <ShoppingCart className="w-6 h-6 text-green-800" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-800 text-sm font-medium">Confirmed Revenue</p>
                      <p className="text-blue-900 text-xl font-bold">{formatCurrency(salesAnalytics.revenueBreakdown.confirmed)}</p>
                      <p className="text-blue-700 text-xs">Admin Received</p>
                    </div>
                    <div className="bg-blue-200 p-2 rounded-lg">
                      <IndianRupee className="w-6 h-6 text-blue-800" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Revenue Status Explanation</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                    <span><strong>Pending:</strong> Orders placed but revenue not yet recognized</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                    <span><strong>Earned:</strong> Revenue recognized (Online: Payment completed, COD: Delivered)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                    <span><strong>Confirmed:</strong> Amount received in admin account</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Payment Method Rules:</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>• <strong>Online Payment:</strong> Revenue confirmed automatically when payment completed</div>
                    <div>• <strong>Cash on Delivery (COD):</strong> Revenue earned when delivered, confirmed manually by admin</div>
                    <div>• <strong>Revenue Amount:</strong> Full order amount (no deductions)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                User Details - {selectedUserType === 'all' ? 'All Users' : 
                               selectedUserType === 'registered' ? 'Registered Users' : 
                               'Anonymous Users'}
              </h2>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
                </div>

            <div className="space-y-6">
              {/* Registered Users */}
              {selectedUserType === 'all' || selectedUserType === 'registered' ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Registered Users</h3>
                  <div className="space-y-4">
                    {userDetails.registered.map((userGroup, index) => (
                      <div key={userGroup.user._id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-800">{userGroup.user.name}</h4>
                              {userGroup.user.googleId && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  Google Login
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{userGroup.user.email}</p>
                            <p className="text-xs text-gray-500">
                              Registered: {new Date(userGroup.user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-blue-600">{userGroup.totalActivities} activities</p>
                            <p className="text-xs text-gray-500">
                              Last activity: {new Date(userGroup.lastActivity).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700">Recent Activities:</h5>
                          {userGroup.activities.slice(0, 5).map((activity, actIndex) => (
                            <div key={actIndex} className="text-xs text-gray-600 bg-white p-2 rounded">
                              <span className="font-medium">{activity.type}</span>
                              {activity.productName && <span> - {activity.productName}</span>}
                              {activity.searchQuery && <span> - "{activity.searchQuery}"</span>}
                              {activity.category && activity.category.name && <span> - {activity.category.name}</span>}
                              <span className="text-gray-400 ml-2">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Anonymous Users */}
              {selectedUserType === 'all' || selectedUserType === 'anonymous' ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Anonymous Users</h3>
                  <div className="space-y-4">
                    {userDetails.anonymous.map((session, index) => (
                      <div key={session.sessionId} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-800">Anonymous Session</h4>
                            <p className="text-sm text-gray-600">Session ID: {session.sessionId}</p>
                            <p className="text-xs text-gray-500">
                              Started: {new Date(session.sessionStart).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-600">{session.totalActivities} activities</p>
                            <p className="text-xs text-gray-500">
                              Last activity: {new Date(session.lastActivity).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700">Recent Activities:</h5>
                          {session.activities.slice(0, 5).map((activity, actIndex) => (
                            <div key={actIndex} className="text-xs text-gray-600 bg-white p-2 rounded">
                              <span className="font-medium">{activity.type}</span>
                              {activity.productName && <span> - {activity.productName}</span>}
                              {activity.searchQuery && <span> - "{activity.searchQuery}"</span>}
                              {activity.category && activity.category.name && <span> - {activity.category.name}</span>}
                              <span className="text-gray-400 ml-2">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
              </div>
            ))}
          </div>
                </div>
              ) : null}
            </div>
          </div>
          </div>
        )}
    </div>
  );
};

export default Dashboard; 