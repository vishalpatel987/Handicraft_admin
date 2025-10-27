import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HeartIcon, 
  UserIcon, 
  ShoppingBagIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import wishlistService from '../services/wishlistService';
import { toast } from 'react-hot-toast';

const WishlistManagement = () => {
  const [wishlists, setWishlists] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching wishlist data...');
      
      const [wishlistsData, analyticsData] = await Promise.all([
        wishlistService.getAllWishlists(),
        wishlistService.getWishlistAnalytics()
      ]);
      
      console.log('🔍 Wishlists data:', wishlistsData);
      console.log('🔍 Analytics data:', analyticsData);
      
      setWishlists(wishlistsData.wishlists || []);
      setAnalytics(analyticsData.analytics || {});
    } catch (error) {
      console.error('Error fetching wishlist data:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load wishlist data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-pink-100 border-l-pink-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <HeartIconSolid className="h-8 w-8 text-pink-600" />
          Wishlist Management
        </h1>
        <p className="text-gray-600 mt-2">Monitor and analyze user wishlists</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Wishlists</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.totalWishlists || 0}
              </p>
            </div>
            <div className="p-3 bg-pink-100 rounded-xl">
              <HeartIconSolid className="h-8 w-8 text-pink-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.totalProductsInWishlists || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Wishlists</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.activeWishlists || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <UserIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg per User</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.averageProductsPerWishlist || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'popular'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Most Wishlisted
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Wishlists
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Wishlists</span>
                <span className="font-semibold text-gray-900">{analytics?.totalWishlists || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Active Wishlists</span>
                <span className="font-semibold text-green-600">{analytics?.activeWishlists || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Empty Wishlists</span>
                <span className="font-semibold text-gray-400">{analytics?.emptyWishlists || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Total Products in Wishlists</span>
                <span className="font-semibold text-blue-600">{analytics?.totalProductsInWishlists || 0}</span>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
            <div className="flex items-center gap-2 mb-4">
              <ChartBarIcon className="h-6 w-6 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-pink-600">
                    {((analytics?.activeWishlists / analytics?.totalWishlists) * 100).toFixed(1)}%
                  </span> of users have active wishlists
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Average <span className="font-semibold text-blue-600">
                    {analytics?.averageProductsPerWishlist}
                  </span> products per wishlist
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-purple-600">
                    {analytics?.mostWishlisted?.length || 0}
                  </span> products in top wishlisted
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'popular' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Most Wishlisted Products</h3>
            <p className="text-sm text-gray-600 mt-1">Top 10 products users love</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wishlisted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics?.mostWishlisted?.map((item, index) => (
                  <tr key={item.product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-gray-400' : 
                          index === 2 ? 'text-orange-600' : 
                          'text-gray-600'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{item.product.price}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <HeartIconSolid className="h-4 w-4 text-pink-500" />
                        <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                        <span className="text-xs text-gray-500">times</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">User Wishlists</h3>
            <p className="text-sm text-gray-600 mt-1">All user wishlists</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wishlists.map((wishlist) => (
                  <tr key={wishlist._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-pink-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-pink-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {wishlist.user?.name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{wishlist.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800">
                        {wishlist.products.length} items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(wishlist.updatedAt).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistManagement;

