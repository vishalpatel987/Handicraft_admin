import axios from 'axios';
import config from '../config/config';

// Create axios instance with base URL from config
const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', token.substring(0, 20) + '...');
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      console.log('Token expired or invalid, clearing localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('admin_logged_in');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    
    if (error.response?.data?.error) {
      console.error('Server Error:', error.response.data.error);
    }
    return Promise.reject(error);
  }
);

// Helper function for file uploads
const uploadWithFiles = (url, formData) => {
  const token = localStorage.getItem('token');
  return axios.post(`${config.API_BASE_URL}${url}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': token ? `Bearer ${token}` : undefined
    }
  });
};

// Helper function for file updates
const updateWithFiles = (url, formData) => {
  const token = localStorage.getItem('token');
  return axios.put(`${config.API_BASE_URL}${url}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': token ? `Bearer ${token}` : undefined
    }
  });
};

// Hero Carousel endpoints
const heroCarouselEndpoints = {
  getCarouselItems: () => api.get('/api/hero-carousel'),
  getCarouselItem: (id) => api.get(`/api/hero-carousel/${id}`),
  getActiveCarouselItems: () => api.get('/api/hero-carousel/active'),
  createCarouselItem: (formData) => uploadWithFiles('/api/hero-carousel', formData),
  updateCarouselItem: (id, formData) => updateWithFiles(`/api/hero-carousel/${id}`, formData),
  deleteCarouselItem: (id) => api.delete(`/api/hero-carousel/${id}`),
  toggleCarouselActive: (id) => api.patch(`/api/hero-carousel/${id}/toggle-active`),
  updateCarouselOrder: (items) => api.post('/api/hero-carousel/update-order', items)
};

// Coupon endpoints
const couponEndpoints = {
  getCoupons: () => api.get('/api/coupons'),
  createCoupon: (data) => api.post('/api/coupons', data),
  updateCoupon: (id, data) => api.put(`/api/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/api/coupons/${id}`),
};

// User management endpoints
const userEndpoints = {
  getAllUsers: () => api.get('/api/admin/users'),
  getUserById: (id) => api.get(`/api/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  resetUserPassword: (id, data) => api.post(`/api/admin/users/${id}/reset-password`, data),
  getUserStats: () => api.get('/api/admin/users/stats'),
};

const apiService = {
  // Auth endpoints
  login: async (credentials) => {
    console.log('Attempting admin login with:', credentials.email);
    const response = await api.post('/api/admin/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('admin_logged_in', 'true');
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
      console.log('Admin login successful, token stored');
    }
    return response;
  },

  // Admin registration (only for first admin)
  registerAdmin: async (credentials) => {
    console.log('Attempting admin registration with:', credentials.email);
    const response = await api.post('/api/admin/auth/signup', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('admin_logged_in', 'true');
      localStorage.setItem('admin_user', JSON.stringify(response.data.admin));
      console.log('Admin registration successful, token stored');
    }
    return response;
  },
  
  // Check admin registration status
  checkAdminStatus: async () => {
    try {
      const response = await api.get('/api/admin/auth/status');
      return response.data;
    } catch (error) {
      console.error('Admin status check failed:', error);
      throw error;
    }
  },
  
  // Update admin credentials
  updateAdminCredentials: async (credentials) => {
    console.log('Attempting to update admin credentials');
    const response = await api.put('/api/admin/auth/update-credentials', credentials);
    if (response.data.user) {
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
    }
    return response;
  },
  
  // Token verification
  verifyToken: async () => {
    try {
      const response = await api.get('/api/admin/auth/verify');
      return response.data;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw error;
    }
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_user');
    console.log('Admin logged out, tokens cleared');
  },
  
  // Forgot Password
  forgotPassword: async (email) => {
    console.log('Attempting to send password reset link to:', email);
    const response = await api.post('/api/admin/auth/forgot-password', { email });
    return response;
  },
  
  // Verify OTP and Reset Password
  verifyOTPAndResetPassword: async (email, otp, newPassword) => {
    console.log('Attempting to verify OTP and reset password');
    const response = await api.post('/api/admin/auth/verify-otp-reset', { email, otp, newPassword });
    return response;
  },
  
  // Products endpoints
  getProducts: async () => {
    const response = await api.get('/api/shop');
    console.log('API getProducts response:', response.data);
    return response;
  },
  getFeaturedProducts: async () => {
    const response = await api.get('/api/shop/section/featured');
    console.log('API getFeaturedProducts response:', response.data);
    return response;
  },
  getBestSellerProducts: async () => {
    const response = await api.get('/api/shop/section/bestsellers');
    console.log('API getBestSellerProducts response:', response.data);
    return response;
  },
  getMostLovedProducts: async () => {
    const response = await api.get('/api/shop/section/mostloved');
    console.log('API getMostLovedProducts response:', response.data);
    return response;
  },
  getProductsBySection: async (section) => {
    const response = await api.get(`/api/shop/section/${section}`);
    console.log(`API getProductsBySection(${section}) response:`, response.data);
    return response;
  },
  getProduct: async (id) => {
    return api.get(`/api/shop/${id}`);
  },
  createProduct: async (formData) => {
    return uploadWithFiles('/api/shop/upload', formData);
  },
  updateProduct: async (id, formData) => {
    return updateWithFiles(`/api/shop/${id}`, formData);
  },
  updateProductSections: async (id, sections) => {
    return api.patch(`/api/shop/${id}/sections`, sections);
  },
  deleteProduct: async (id) => {
    return api.delete(`/api/shop/${id}`);
  },
  
  // Categories endpoints
  getCategories: (includeSubCategories = true) => 
    api.get(`/api/categories?includeSubCategories=${includeSubCategories}`),
  getCategoryHierarchy: () => api.get('/api/categories/hierarchy'),
  getMainCategories: () => api.get('/api/categories/main'),
  getSubCategories: (parentId) => api.get(`/api/categories/sub/${parentId}`),
  getCategory: (id) => api.get(`/api/categories/${id}`),
  createCategory: (formData) => {
    return formData instanceof FormData
      ? uploadWithFiles('/api/categories', formData)
      : api.post('/api/categories', formData);
  },
  updateCategory: (id, formData) => {
    return formData instanceof FormData
      ? updateWithFiles(`/api/categories/${id}`, formData)
      : api.put(`/api/categories/${id}`, formData);
  },
  deleteCategory: (id) => api.delete(`/api/categories/${id}`),
  
  // Orders endpoints
  getOrders: () => api.get('/api/orders/json'),
  getOrderById: (id) => api.get(`/api/orders/${id}`),
  updateOrder: (id, orderData) => api.put(`/api/orders/${id}`, orderData),
  updateOrderStatus: (id, orderStatus) => api.put(`/api/orders/${id}/status`, { orderStatus }),
  handleCancellationRequest: (id, action, rejectionReason) => api.put(`/api/orders/${id}/handle-cancellation`, { action, rejectionReason }),
  processRefund: (id) => api.post(`/api/orders/${id}/process-refund`),
  confirmCODReceipt: (id, confirmedAmount) => api.post(`/api/orders/${id}/confirm-cod`, { confirmedAmount }),
  getRevenueAnalytics: (period = 'monthly') => api.get(`/api/orders/analytics/revenue?period=${period}`),
  
  
  // Hero Carousel endpoints
  ...heroCarouselEndpoints,
  
  // Coupon endpoints
  ...couponEndpoints,
  
  // User management endpoints
  ...userEndpoints,
  
  // Settings endpoints
  getSettings: () => api.get('/api/settings'),
  getSetting: (key) => api.get(`/api/settings/${key}`),
  updateSetting: (key, data) => api.put(`/api/settings/${key}`, data),
  createSetting: (data) => api.post('/api/settings', data),
  deleteSetting: (key) => api.delete(`/api/settings/${key}`),
  
  // Review endpoints
  getProductReviews: async (productId) => {
    return api.get(`/api/reviews/product/${productId}`);
  },
  createReview: async (reviewData) => {
    return api.post('/api/reviews', reviewData);
  },
  updateReview: async (reviewId, reviewData) => {
    return api.put(`/api/reviews/${reviewId}`, reviewData);
  },
  deleteReview: async (reviewId) => {
    return api.delete(`/api/reviews/${reviewId}`);
  },

  // Analytics API methods
  getSalesAnalytics: async (period = 'monthly') => {
    return api.get(`/api/orders/analytics/sales?period=${period}`);
  },
  getRevenueAnalytics: async (period = 'monthly') => {
    return api.get(`/api/orders/analytics/revenue?period=${period}`);
  },
  getStockSummary: async () => {
    return api.get('/api/orders/analytics/stock');
  },
  confirmRevenue: async (orderId, adminReceivedAmount) => {
    return api.put(`/api/orders/${orderId}/confirm-revenue`, { adminReceivedAmount });
  },
  
  // User Analytics API methods
  getUserAnalytics: async (period = 'monthly') => {
    return api.get(`/api/user-activity/analytics?period=${period}`);
  },
  getUserActivityDetails: async (userId = null, sessionId = null, limit = 50) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (sessionId) params.append('sessionId', sessionId);
    params.append('limit', limit);
    return api.get(`/api/user-activity/details?${params.toString()}`);
  },
  getUserDetails: async (userType = 'all', limit = 50) => {
    const params = new URLSearchParams();
    params.append('userType', userType);
    params.append('limit', limit);
    return api.get(`/api/user-activity/users?${params.toString()}`);
  },
  
  // Blog API methods (Admin)
  getAdminBlogs: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/blogs/admin${queryString ? '?' + queryString : ''}`);
  },
  getBlogStats: async () => {
    return api.get('/api/blogs/admin/stats');
  },
  getAdminBlogById: async (id) => {
    return api.get(`/api/blogs/admin/${id}`);
  },
  createBlog: async (formData) => {
    return uploadWithFiles('/api/blogs/admin', formData);
  },
  updateBlog: async (id, formData) => {
    return updateWithFiles(`/api/blogs/admin/${id}`, formData);
  },
  deleteBlog: async (id) => {
    return api.delete(`/api/blogs/admin/${id}`);
  },
  toggleBlogStatus: async (id) => {
    return api.patch(`/api/blogs/admin/${id}/toggle-status`);
  },
  
  // Announcement API methods (Admin)
  getAdminAnnouncements: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/announcements/admin${queryString ? '?' + queryString : ''}`);
  },
  getAnnouncementStats: async () => {
    return api.get('/api/announcements/admin/stats');
  },
  getAdminAnnouncementById: async (id) => {
    return api.get(`/api/announcements/admin/${id}`);
  },
  createAnnouncement: async (data) => {
    return api.post('/api/announcements/admin', data);
  },
  updateAnnouncement: async (id, data) => {
    return api.put(`/api/announcements/admin/${id}`, data);
  },
  deleteAnnouncement: async (id) => {
    return api.delete(`/api/announcements/admin/${id}`);
  },
  toggleAnnouncementStatus: async (id) => {
    return api.patch(`/api/announcements/admin/${id}/toggle-status`);
  },

  // Wishlist Management
  getAllWishlists: async () => {
    return api.get('/api/wishlist/admin/all');
  },
  getWishlistAnalytics: async () => {
    return api.get('/api/wishlist/admin/analytics');
  },

  // COD Cancellation Management
  approveCODCancellation: async (orderId, action, rejectionReason = null) => {
    return api.put(`/api/orders/${orderId}/approve-cod-cancellation`, {
      action,
      rejectionReason
    });
  },

  // COD Refund Processing
  processCODRefund: async (orderId, refundAmount) => {
    return api.post(`/api/orders/${orderId}/refund`, {
      refundAmount
    });
  },

  // Support System APIs
  // Support Queries
  getSupportQueries: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/support/queries${queryString ? '?' + queryString : ''}`);
  },
  getSupportQueryById: async (id) => {
    return api.get(`/api/support/queries/${id}`);
  },
  addQueryResponse: async (id, responseData) => {
    return api.post(`/api/support/queries/${id}/response`, responseData);
  },
  updateQueryStatus: async (id, statusData) => {
    return api.put(`/api/support/queries/${id}/status`, statusData);
  },

  // Support Tickets
  getSupportTickets: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/support/tickets${queryString ? '?' + queryString : ''}`);
  },
  getSupportTicketById: async (id) => {
    return api.get(`/api/support/tickets/${id}`);
  },
  addTicketMessage: async (id, messageData) => {
    return api.post(`/api/support/tickets/${id}/message`, messageData);
  },
  updateTicketStatus: async (id, statusData) => {
    return api.put(`/api/support/tickets/${id}/status`, statusData);
  },

  // Chat Rooms
  getChatRooms: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/support/chat/rooms${queryString ? '?' + queryString : ''}`);
  },
  getChatRoomById: async (id) => {
    return api.get(`/api/support/chat/rooms/${id}`);
  },
  addChatMessage: async (id, messageData) => {
    return api.post(`/api/support/chat/rooms/${id}/message`, messageData);
  },
  joinChatRoom: async (id, participantData) => {
    return api.post(`/api/support/chat/rooms/${id}/join`, participantData);
  },

};

export default apiService; 