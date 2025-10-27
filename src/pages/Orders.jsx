import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { AnimatePresence, motion } from 'framer-motion';

function toIST(dateString) {
  return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [stateFilter, setStateFilter] = useState([]);
  const [showStateFilter, setShowStateFilter] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationAction, setCancellationAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [confirmingCOD, setConfirmingCOD] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [selectedOrderForRevenue, setSelectedOrderForRevenue] = useState(null);
  
  // Indian states list (same as checkout page)
  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh", 
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep",
    "Puducherry",
    "Andaman and Nicobar Islands"
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiService.getOrders();
      const ordersData = response.data.orders || [];
      
      
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
      setLoading(false);
    }
  };

  // Filter orders by multiple states
  const handleStateFilterChange = (selectedStates) => {
    setStateFilter(selectedStates);
    if (selectedStates.length === 0) {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => {
        const orderState = order.state || (order.address && order.address.state);
        return selectedStates.includes(orderState);
      });
      setFilteredOrders(filtered);
    }
  };

  // Filter orders by cancellation status
  const [cancellationFilter, setCancellationFilter] = useState('all');
  
  const handleCancellationFilterChange = (filter) => {
    setCancellationFilter(filter);
    if (filter === 'all') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => {
        if (filter === 'cancellation_requested') {
          return order.cancellationStatus === 'requested';
        } else if (filter === 'cancelled') {
          return order.cancellationStatus === 'approved';
        } else if (filter === 'cancellation_rejected') {
          return order.cancellationStatus === 'rejected';
        } else if (filter === 'no_cancellation') {
          return !order.cancellationRequested || order.cancellationStatus === 'none';
        }
        return true;
      });
      setFilteredOrders(filtered);
    }
  };

  const toggleStateFilter = (state) => {
    const newFilter = stateFilter.includes(state)
      ? stateFilter.filter(s => s !== state)
      : [...stateFilter, state];
    handleStateFilterChange(newFilter);
  };

  const clearAllFilters = () => {
    setStateFilter([]);
    setCancellationFilter('all');
    setFilteredOrders(orders);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      setError(null);
      setSuccess(null);
      
      // Find the order to check if it's cancelled
      const order = orders.find(o => o._id === orderId);
      if (order && order.cancellationStatus === 'approved') {
        setError('Cannot update status of cancelled orders. Order has been cancelled and cannot be modified.');
        setTimeout(() => setError(null), 5000);
        return;
      }
      
      await apiService.updateOrderStatus(orderId, newStatus);
      
      setSuccess(`Order status updated to ${newStatus} successfully!`);
      fetchOrders(); // Refresh orders list
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingOrder(null);
    }
  };


  const handleCancellationRequest = async (orderId, action) => {
    try {
      setUpdatingOrder(orderId);
      setError(null);
      setSuccess(null);
      
      const reasonForRejection = action === 'reject' ? rejectionReason : undefined;
      await apiService.handleCancellationRequest(orderId, action, reasonForRejection);
      
      setSuccess(`Cancellation request ${action}d successfully!`);
      
      // Close cancellation modal first
      setShowCancellationModal(false);
      setCancellationAction(null);
      setRejectionReason('');
      
      // Close order details modal after a short delay to ensure smooth transition
      setTimeout(() => {
        setSelectedOrder(null);
      }, 300);
      
      // Refresh orders list after modal is closed
      setTimeout(() => {
        fetchOrders();
      }, 500);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} cancellation request`);
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const openCancellationModal = (action) => {
    setCancellationAction(action);
    setShowCancellationModal(true);
    setRejectionReason('');
  };

  const processRefund = async (orderId) => {
    if (!window.confirm('Are you sure you want to process refund for this order? The amount will be refunded to customer\'s original payment method.')) {
      return;
    }

    try {
      setProcessingRefund(true);
      setError(null);
      setSuccess(null);

      const response = await apiService.processRefund(orderId);

      if (response.data.success) {
        const refundAmount = response.data.refundAmount || response.data.order.refundAmount || response.data.order.totalAmount;
        setSuccess(`✅ Refund processed successfully! Amount ₹${refundAmount} will be credited to customer within 5-7 business days. This amount has been deducted from total revenue.`);
        
        // Close order details modal after success
        setTimeout(() => {
          setSelectedOrder(null);
        }, 300);
        
        // Refresh orders list
        setTimeout(() => {
          fetchOrders();
        }, 500);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(response.data.message || 'Failed to process refund');
      }
    } catch (err) {
      console.error('Refund error:', err);
      setError(err.response?.data?.message || 'Failed to process refund. Please try again.');
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcessingRefund(false);
    }
  };

  // COD Cancellation handling
  const handleCODCancellationRequest = async (orderId, action) => {
    try {
      setUpdatingOrder(orderId);
      setError(null);
      setSuccess(null);
      
      const reasonForRejection = action === 'reject' ? rejectionReason : undefined;
      await apiService.approveCODCancellation(orderId, action, reasonForRejection);
      
      setSuccess(`COD cancellation request ${action}d successfully!`);
      
      // Close cancellation modal first
      setShowCancellationModal(false);
      setCancellationAction(null);
      setRejectionReason('');
      
      // Close order details modal after a short delay
      setTimeout(() => {
        setSelectedOrder(null);
      }, 300);
      
      // Refresh orders list after modal is closed
      setTimeout(() => {
        fetchOrders();
      }, 500);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} COD cancellation request`);
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const processCODRefund = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    const refundAmount = order.upfrontAmount || 0;
    if (refundAmount <= 0) {
      setError('No upfront amount to refund for this COD order');
      return;
    }

    if (!window.confirm(`Are you sure you want to process refund of ₹${refundAmount} for this COD order? This is the upfront amount paid by the customer.`)) {
      return;
    }

    try {
      setProcessingRefund(true);
      setError(null);
      setSuccess(null);

      const response = await apiService.processCODRefund(orderId, refundAmount);

      if (response.data.success) {
        setSuccess(`✅ COD refund processed successfully! Amount ₹${refundAmount} will be credited to customer within 5-7 business days.`);
        
        // Close order details modal after success
        setTimeout(() => {
          setSelectedOrder(null);
        }, 300);
        
        // Refresh orders list
        setTimeout(() => {
          fetchOrders();
        }, 500);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(response.data.message || 'Failed to process COD refund');
      }
    } catch (err) {
      console.error('COD Refund error:', err);
      setError(err.response?.data?.message || 'Failed to process COD refund. Please try again.');
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcessingRefund(false);
    }
  };

  const confirmCODReceipt = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    const defaultAmount = order.totalAmount;
    const amount = window.prompt(`Confirm COD payment receipt for Order #${orderId}\n\nEnter received amount:`, defaultAmount);
    
    if (amount === null) return; // User cancelled
    
    const confirmedAmount = parseFloat(amount);
    if (isNaN(confirmedAmount) || confirmedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setConfirmingCOD(true);
      setError(null);
      setSuccess(null);

      const response = await apiService.confirmCODReceipt(orderId, confirmedAmount);

      if (response.data.success) {
        setSuccess(`COD payment confirmed successfully! Amount ₹${confirmedAmount} added to revenue.`);
        await fetchOrders(); // Refresh orders list
      } else {
        setError(response.data.message || 'Failed to confirm COD payment');
      }
    } catch (error) {
      console.error('Error confirming COD payment:', error);
      setError(error.response?.data?.message || 'Error confirming COD payment');
    } finally {
      setConfirmingCOD(false);
    }
  };

  const handleConfirmRevenue = async () => {
    if (!selectedOrderForRevenue) {
      setError('No order selected for revenue confirmation');
      return;
    }

    setConfirmingCOD(true);
    try {
      const confirmedAmount = selectedOrderForRevenue.revenueAmount || selectedOrderForRevenue.totalAmount;
      await apiService.confirmCODReceipt(selectedOrderForRevenue._id, confirmedAmount);
      setSuccess('Revenue confirmed successfully');
      setShowRevenueModal(false);
      setSelectedOrderForRevenue(null);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm revenue');
    } finally {
      setConfirmingCOD(false);
    }
  };

  const statusColors = {
    processing: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    manufacturing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const paymentStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    pending_upfront: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-600 text-center p-4">
      Error: {error}
    </div>
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>

      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            {/* Cancellation Status Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Cancellation Status
              </label>
              <select
                value={cancellationFilter}
                onChange={(e) => handleCancellationFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Orders</option>
                <option value="no_cancellation">No Cancellation</option>
                <option value="cancellation_requested">Cancellation Requested</option>
                <option value="cancelled">Cancelled Orders</option>
                <option value="cancellation_rejected">Cancellation Rejected</option>
              </select>
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Filter by State
              </label>
              <button
                onClick={() => setShowStateFilter(!showStateFilter)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showStateFilter ? 'Hide' : 'Show'} States
              </button>
            </div>
            
            {showStateFilter && (
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {indianStates.map((state) => (
                    <label key={state} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={stateFilter.includes(state)}
                        onChange={() => toggleStateFilter(state)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{state}</span>
                    </label>
                  ))}
                </div>
                {(stateFilter.length > 0 || cancellationFilter !== 'all') && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {(stateFilter.length > 0 || cancellationFilter !== 'all') && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Active Filters: </span>
                {cancellationFilter !== 'all' && (
                  <span className="text-xs text-indigo-600 font-medium mr-2">
                    Cancellation: {cancellationFilter.replace('_', ' ')}
                  </span>
                )}
                {stateFilter.length > 0 && (
                  <span className="text-xs text-indigo-600 font-medium">
                    States: {stateFilter.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="w-full" style={{ minWidth: '900px' }}>
          <table className="w-full min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => {
                const firstItem = order.items && order.items[0];
                const orderName = firstItem?.name || firstItem?.type || firstItem?.text || 'Order';
                return (
                <tr key={order._id} className={`hover:bg-gray-50 ${
                  order.cancellationStatus === 'approved' ? 'bg-red-50 border-l-4 border-red-400' : 
                  order.cancellationStatus === 'requested' ? 'bg-orange-50 border-l-4 border-orange-400' : 
                  order.cancellationStatus === 'rejected' ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                }`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        {orderName}
                        {order.cancellationStatus === 'requested' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            ⏳ Cancel Request
                          </span>
                        )}
                        {order.cancellationStatus === 'approved' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            ❌ Cancelled
                          </span>
                        )}
                        {order.cancellationStatus === 'rejected' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            ❌ Cancel Rejected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order._id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{order.customerName}</div>
                    <div className="text-xs text-gray-400">{order.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {toIST(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{order.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.orderStatus}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      disabled={updatingOrder === order._id || order.cancellationStatus === 'approved'}
                      className={`text-sm rounded-full px-3 py-1 font-semibold ${statusColors[order.orderStatus]} ${(updatingOrder === order._id || order.cancellationStatus === 'approved') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={order.cancellationStatus === 'approved' ? 'Cannot change status of cancelled orders' : ''}
                    >
                      {Object.keys(statusColors).map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                          {updatingOrder === order._id && status === order.orderStatus ? ' (Updating...)' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.revenueStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.revenueStatus === 'earned' ? 'bg-green-100 text-green-800' :
                        order.revenueStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.revenueStatus || 'pending'}
                      </span>
                      {order.revenueStatus === 'earned' && order.paymentMethod === 'cod' && (
                        <button
                          onClick={() => {
                            setSelectedOrderForRevenue(order);
                            setShowRevenueModal(true);
                          }}
                          disabled={updatingOrder === order._id}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updatingOrder === order._id ? 'Confirming...' : 'Confirm Revenue'}
                        </button>
                      )}
                      {order.revenueAmount > 0 && (
                        <div className="text-xs text-gray-500">
                          ₹{order.revenueAmount}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusColors[order.paymentStatus]}`}>
                      {order.paymentStatus === 'pending_upfront' ? 'Upfront Paid' : order.paymentStatus}
                    </span>
                    {order.paymentMethod === 'cod' && order.upfrontAmount > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        ₹{order.upfrontAmount} upfront
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
      {selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <div
              className="relative w-full max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-6 border border-gray-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 z-10"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-1 text-indigo-700 text-center">
                  {selectedOrder.items?.[0]?.name || selectedOrder.items?.[0]?.type || selectedOrder.items?.[0]?.text || 'Order'}
                </h2>
                <div className="text-center text-xs text-gray-400">Order ID: {selectedOrder._id}</div>
              </div>
            <div className="space-y-3">
              {/* Customer Info */}
              <div className="border-b pb-3">
                <h4 className="font-medium mb-2 text-sm text-gray-700">Customer Information</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Name:</span> {selectedOrder.customerName}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.phone}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="border-b pb-3">
                <h4 className="font-medium mb-2 text-sm text-gray-700">Shipping Address</h4>
                <div className="text-sm">
                  <p>{selectedOrder.address.street}</p>
                  <p>{selectedOrder.address.city}, {selectedOrder.address.state}</p>
                  <p>{selectedOrder.address.pincode}, {selectedOrder.address.country}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2 text-sm text-gray-700">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="border rounded p-3 bg-gray-50">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-sm">{item.name || item.type || 'Item'}</span>
                        <span className="font-bold text-sm">₹{item.price}</span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>Quantity: {item.quantity}</p>
                        {item.color && <p>Color: {item.color}</p>}
                        {item.size && <p>Size: {item.size}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-b pb-3">
                <h4 className="font-medium mb-2 text-sm text-gray-700">Payment Information</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Method:</span> {selectedOrder.paymentMethod?.toUpperCase()}</p>
                  <p><span className="font-medium">Status:</span> {selectedOrder.paymentStatus}</p>
                </div>
                {selectedOrder.paymentMethod === 'cod' && selectedOrder.upfrontAmount > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-blue-800 text-sm font-medium">COD Payment Breakdown:</p>
                    <p className="text-blue-700 text-xs">✅ Upfront Paid: ₹{selectedOrder.upfrontAmount}</p>
                    <p className="text-blue-700 text-xs">💰 On Delivery: ₹{selectedOrder.remainingAmount}</p>
                  </div>
                )}
              </div>

              {/* Cancellation Information */}
              {selectedOrder.cancellationRequested && (
                <div className="border-b pb-3">
                  <h4 className="font-medium mb-2 text-sm text-red-600">Cancellation Details</h4>
                  <div className={`p-3 border rounded ${
                    selectedOrder.cancellationStatus === 'requested' ? 'bg-orange-50 border-orange-200' :
                    selectedOrder.cancellationStatus === 'approved' ? 'bg-red-50 border-red-200' :
                    selectedOrder.cancellationStatus === 'rejected' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <p className="text-sm"><strong>Status:</strong> 
                      <span className={`ml-1 ${
                        selectedOrder.cancellationStatus === 'requested' ? 'text-orange-700' :
                        selectedOrder.cancellationStatus === 'approved' ? 'text-red-700' :
                        selectedOrder.cancellationStatus === 'rejected' ? 'text-yellow-700' :
                        'text-gray-700'
                      }`}>
                        {selectedOrder.cancellationStatus === 'requested' ? 'Cancellation Requested' :
                         selectedOrder.cancellationStatus === 'approved' ? 'Cancelled' :
                         selectedOrder.cancellationStatus === 'rejected' ? 'Cancellation Rejected' :
                         'Unknown'}
                      </span>
                    </p>
                    {selectedOrder.cancellationReason && (
                      <p className="text-sm"><strong>Customer Reason:</strong> {selectedOrder.cancellationReason}</p>
                    )}
                    {selectedOrder.cancellationRequestedAt && (
                      <p className="text-sm"><strong>Requested On:</strong> {toIST(selectedOrder.cancellationRequestedAt)}</p>
                    )}
                    {selectedOrder.cancelledAt && (
                      <p className="text-sm"><strong>Cancelled On:</strong> {toIST(selectedOrder.cancelledAt)}</p>
                    )}
                    {selectedOrder.cancellationApprovedBy && (
                      <p className="text-sm"><strong>Processed By:</strong> {selectedOrder.cancellationApprovedBy}</p>
                    )}
                    {selectedOrder.cancellationRejectionReason && (
                      <p className="text-sm"><strong>Rejection Reason:</strong> {selectedOrder.cancellationRejectionReason}</p>
                    )}

                    {/* COD Confirmation for Delivered Orders */}
                    {selectedOrder.paymentMethod === 'cod' && 
                     selectedOrder.orderStatus === 'delivered' && 
                     selectedOrder.revenueStatus === 'earned' && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm font-semibold text-green-900 mb-2">💰 COD Payment Confirmation</p>
                        <p className="text-sm text-green-800 mb-3">
                          This COD order has been delivered. Please confirm payment receipt to add to revenue.
                        </p>
                        <button
                          onClick={() => confirmCODReceipt(selectedOrder._id)}
                          disabled={confirmingCOD}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {confirmingCOD ? 'Confirming...' : 'Confirm COD Payment'}
                        </button>
                      </div>
                    )}

                    {/* Refund Information for Online Payments and COD with Upfront Payment */}
                    {selectedOrder.cancellationStatus === 'approved' && 
                     ((selectedOrder.paymentMethod !== 'cod' && selectedOrder.paymentStatus === 'completed') ||
                      (selectedOrder.paymentMethod === 'cod' && selectedOrder.upfrontAmount > 0)) && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm font-semibold text-blue-900 mb-2">💰 Refund Information</p>
                        <div className="text-sm space-y-1">
                          <p><strong>Refund Amount:</strong> ₹{
                            selectedOrder.paymentMethod === 'cod' 
                              ? (selectedOrder.refundAmount || selectedOrder.upfrontAmount || 0)
                              : (selectedOrder.refundAmount || selectedOrder.totalAmount)
                          }</p>
                          <p><strong>Refund Status:</strong> 
                            <span className={`ml-1 font-semibold ${
                              selectedOrder.refundStatus === 'completed' ? 'text-green-600' :
                              selectedOrder.refundStatus === 'processing' ? 'text-blue-600' :
                              selectedOrder.refundStatus === 'pending' ? 'text-yellow-600' :
                              selectedOrder.refundStatus === 'failed' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {selectedOrder.refundStatus === 'completed' ? '✅ Completed' :
                               selectedOrder.refundStatus === 'processing' ? '⏳ Processing' :
                               selectedOrder.refundStatus === 'pending' ? '⏰ Pending' :
                               selectedOrder.refundStatus === 'failed' ? '❌ Failed' :
                               '⏰ Pending'}
                            </span>
                          </p>
                          {selectedOrder.refundTransactionId && (
                            <p className="text-xs"><strong>Refund ID:</strong> {selectedOrder.refundTransactionId}</p>
                          )}
                          {selectedOrder.refundCompletedAt && (
                            <p className="text-xs"><strong>Completed On:</strong> {toIST(selectedOrder.refundCompletedAt)}</p>
                          )}
                          {selectedOrder.refundFailedReason && (
                            <p className="text-xs text-red-600"><strong>Failure Reason:</strong> {selectedOrder.refundFailedReason}</p>
                          )}
                        </div>

                        {/* Refund Action Button - Only show for approved cancellations with pending refunds */}
                        {selectedOrder.cancellationStatus === 'approved' && 
                         selectedOrder.refundStatus === 'pending' && 
                         ((selectedOrder.paymentMethod !== 'cod' && selectedOrder.paymentStatus === 'completed') ||
                          (selectedOrder.paymentMethod === 'cod' && selectedOrder.upfrontAmount > 0)) && (
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                              <h4 className="text-sm font-semibold text-yellow-800">Refund Required</h4>
                            </div>
                            <p className="text-xs text-yellow-700 mb-3">
                              This order has been cancelled and requires a refund of ₹{
                                selectedOrder.paymentMethod === 'cod' 
                                  ? (selectedOrder.refundAmount || selectedOrder.upfrontAmount || 0)
                                  : (selectedOrder.refundAmount || selectedOrder.totalAmount)
                              } to the customer's original payment method.
                            </p>
                            <button
                              onClick={() => {
                                if (selectedOrder.paymentMethod === 'cod') {
                                  processCODRefund(selectedOrder._id);
                                } else {
                                  processRefund(selectedOrder._id);
                                }
                              }}
                              disabled={processingRefund}
                              className="w-full px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md"
                            >
                              {processingRefund ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  Processing Refund...
                                </>
                              ) : (
                                <>
                                  💳 Process Refund Now
                                </>
                              )}
                            </button>
                            <p className="text-xs text-gray-600 mt-2 text-center">
                              ⚠️ This will refund the money to customer's {selectedOrder.paymentMethod === 'cod' ? 'UPI/Card (upfront amount only)' : 'UPI/Card/Net Banking'} and deduct from total revenue.
                            </p>
                          </div>
                        )}
                        
                        {selectedOrder.refundStatus === 'failed' && (
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                if (selectedOrder.paymentMethod === 'cod') {
                                  processCODRefund(selectedOrder._id);
                                } else {
                                  processRefund(selectedOrder._id);
                                }
                              }}
                              disabled={processingRefund}
                              className="w-full px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                              {processingRefund ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  Retrying Refund...
                                </>
                              ) : (
                                <>
                                  🔄 Retry Refund
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Admin Actions for Cancellation Requests */}
                  {selectedOrder.cancellationStatus === 'requested' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <h5 className="font-medium text-blue-800 mb-2">Admin Actions</h5>
                      {selectedOrder.paymentMethod === 'cod' && selectedOrder.upfrontAmount > 0 && (
                        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-xs text-yellow-800">
                            <strong>COD Order:</strong> If approved, ₹{selectedOrder.upfrontAmount} upfront amount will need to be refunded.
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openCancellationModal('approve')}
                          disabled={updatingOrder === selectedOrder._id}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          ✅ Approve Cancellation
                        </button>
                        <button
                          onClick={() => openCancellationModal('reject')}
                          disabled={updatingOrder === selectedOrder._id}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          ❌ Reject Cancellation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-3 border-t">
                <p className="font-bold text-lg text-indigo-600">Total Amount: ₹{selectedOrder.totalAmount}</p>
              </div>
            </div>
            </div>
          </div>
      )}
      </AnimatePresence>

      {/* Admin Cancellation Action Modal */}
      <AnimatePresence>
        {showCancellationModal && selectedOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => {
              setShowCancellationModal(false);
              setCancellationAction(null);
              setRejectionReason('');
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${
                  cancellationAction === 'approve' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {cancellationAction === 'approve' ? (
                    <span className="text-green-600 text-xl">✅</span>
                  ) : (
                    <span className="text-red-600 text-xl">❌</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {cancellationAction === 'approve' ? 'Approve Cancellation' : 'Reject Cancellation'}
                </h3>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Order ID:</p>
                <p className="text-xs font-mono text-gray-900">{selectedOrder._id}</p>
                <p className="text-sm text-gray-600 mt-2">Customer: {selectedOrder.customerName}</p>
                <p className="text-sm text-gray-600">Reason: {selectedOrder.cancellationReason}</p>
              </div>

              {cancellationAction === 'reject' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting the cancellation request..."
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>
              )}

              <div className={`border rounded-lg p-3 mb-6 ${
                cancellationAction === 'approve' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm ${
                  cancellationAction === 'approve' ? 'text-green-800' : 'text-red-800'
                }`}>
                  <strong>
                    {cancellationAction === 'approve' 
                      ? 'This will cancel the order and restore product stock.' 
                      : 'This will reject the cancellation request and continue processing the order.'}
                  </strong>
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancellationModal(false);
                    setCancellationAction(null);
                    setRejectionReason('');
                  }}
                  disabled={updatingOrder === selectedOrder._id}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedOrder.paymentMethod === 'cod') {
                      handleCODCancellationRequest(selectedOrder._id, cancellationAction);
                    } else {
                      handleCancellationRequest(selectedOrder._id, cancellationAction);
                    }
                  }}
                  disabled={updatingOrder === selectedOrder._id || (cancellationAction === 'reject' && !rejectionReason.trim())}
                  className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    cancellationAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {updatingOrder === selectedOrder._id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </span>
                  ) : (
                    `${cancellationAction === 'approve' ? 'Approve' : 'Reject'} Cancellation`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Revenue Confirmation Modal */}
      <AnimatePresence>
        {showRevenueModal && selectedOrderForRevenue && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
            onClick={() => setShowRevenueModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Confirm COD Revenue</h3>
                  <button
                    onClick={() => setShowRevenueModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
                    <p className="text-sm text-gray-600">Order ID: #{selectedOrderForRevenue._id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm text-gray-600">Customer: {selectedOrderForRevenue.customerName}</p>
                    <p className="text-sm text-gray-600">Total Amount: ₹{selectedOrderForRevenue.totalAmount}</p>
                    <p className="text-sm text-gray-600">Revenue Amount: ₹{selectedOrderForRevenue.revenueAmount || selectedOrderForRevenue.totalAmount}</p>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-green-800">
                        This will confirm that you have received the COD payment and add the amount to your revenue.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowRevenueModal(false)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirmRevenue}
                      disabled={confirmingCOD}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {confirmingCOD ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Confirming...
                        </span>
                      ) : (
                        'Confirm Revenue'
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;