import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Banknote, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  FileDown
} from 'lucide-react';
import apiService from '../services/api';
import { exportPaymentHistoryPDF } from '../utils/pdfExport';

function toIST(dateString) {
  return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Statistics
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    onlinePayments: 0,
    codPayments: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, searchTerm, paymentMethodFilter, statusFilter, dateRange, startDate, endDate]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch orders with payment information
      const response = await apiService.getOrders();
      if (response.data.success) {
        const orders = response.data.orders;
        
        // Transform orders into payment records
        const paymentRecords = [];
        
        orders.forEach(order => {
          // Online payment record
          if (order.paymentMethod === 'online' && order.paymentStatus) {
            paymentRecords.push({
              id: `${order._id}_online`,
              orderId: order._id,
              type: 'online',
              amount: order.totalAmount,
              status: order.paymentStatus,
              method: 'Online Payment',
              customerName: order.customerName,
              customerEmail: order.email,
              transactionId: order.razorpayPaymentId || order.transactionId,
              razorpayOrderId: order.razorpayOrderId,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              refundStatus: order.refundStatus,
              refundAmount: order.refundAmount,
              refundTransactionId: order.refundTransactionId,
              refundCompletedAt: order.refundCompletedAt,
              orderStatus: order.orderStatus,
              revenueStatus: order.revenueStatus,
              revenueAmount: order.revenueAmount
            });
          }
          
          // COD payment record (if delivered)
          if (order.paymentMethod === 'cod') {
            paymentRecords.push({
              id: `${order._id}_cod`,
              orderId: order._id,
              type: 'cod',
              amount: order.totalAmount,
              status: order.paymentStatus,
              method: 'Cash on Delivery',
              customerName: order.customerName,
              customerEmail: order.email,
              transactionId: null,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              refundStatus: order.refundStatus,
              refundAmount: order.refundAmount,
              refundTransactionId: order.refundTransactionId,
              refundCompletedAt: order.refundCompletedAt,
              orderStatus: order.orderStatus,
              revenueStatus: order.revenueStatus,
              revenueAmount: order.revenueAmount,
              upfrontAmount: order.upfrontAmount,
              remainingAmount: order.remainingAmount,
              codConfirmedAt: order.codConfirmedAt,
              codConfirmedBy: order.codConfirmedBy
            });
          }
        });
        
        // Sort by date (newest first)
        paymentRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setPayments(paymentRecords);
        calculateStats(paymentRecords);
      } else {
        setError('Failed to fetch payment history');
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('Failed to fetch payment history');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentRecords) => {
    const stats = {
      totalTransactions: paymentRecords.length,
      totalAmount: 0,
      onlinePayments: 0,
      codPayments: 0,
      successfulPayments: 0,
      failedPayments: 0,
      pendingPayments: 0
    };

    paymentRecords.forEach(payment => {
      stats.totalAmount += payment.amount;
      
      if (payment.type === 'online') {
        stats.onlinePayments++;
      } else if (payment.type === 'cod') {
        stats.codPayments++;
      }
      
      if (payment.status === 'completed') {
        stats.successfulPayments++;
      } else if (payment.status === 'failed') {
        stats.failedPayments++;
      } else {
        stats.pendingPayments++;
      }
    });

    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.transactionId && payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(payment => payment.type === paymentMethodFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'custom':
          if (startDate && endDate) {
            const customStart = new Date(startDate);
            const customEnd = new Date(endDate);
            customEnd.setHours(23, 59, 59, 999);
            filtered = filtered.filter(payment => {
              const paymentDate = new Date(payment.createdAt);
              return paymentDate >= customStart && paymentDate <= customEnd;
            });
          }
          break;
      }
      
      if (dateRange !== 'custom') {
        filtered = filtered.filter(payment => new Date(payment.createdAt) >= startDate);
      }
    }

    setFilteredPayments(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pending_upfront':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'pending_upfront':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPaymentMethodIcon = (type) => {
    return type === 'online' ? 
      <CreditCard className="h-4 w-4" /> : 
      <Banknote className="h-4 w-4" />;
  };

  const exportToCSV = () => {
    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Payment Method',
      'Amount',
      'Status',
      'Transaction ID',
      'Date',
      'Refund Status',
      'Refund Amount'
    ];

    const csvData = filteredPayments.map(payment => [
      payment.orderId,
      payment.customerName,
      payment.customerEmail,
      payment.method,
      payment.amount,
      payment.status,
      payment.transactionId || 'N/A',
      toIST(payment.createdAt),
      payment.refundStatus || 'none',
      payment.refundAmount || 0
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    try {
      const result = await exportPaymentHistoryPDF(filteredPayments, stats);
      if (result.success) {
        console.log('Payment history PDF exported successfully');
      } else {
        console.error('PDF export failed:', result.message);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600">View and manage all payment transactions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchPaymentHistory}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Online Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.onlinePayments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Banknote className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">COD Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.codPayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="online">Online Payment</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="pending_upfront">Pending Upfront</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getPaymentMethodIcon(payment.type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.method}
                        </div>
                        <div className="text-sm text-gray-500">
                          Order: {payment.orderId}
                        </div>
                        {payment.transactionId && (
                          <div className="text-xs text-gray-400">
                            TXN: {payment.transactionId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.customerEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{payment.amount.toLocaleString()}
                    </div>
                    {payment.type === 'cod' && payment.upfrontAmount > 0 && (
                      <div className="text-xs text-gray-500">
                        Upfront: ₹{payment.upfrontAmount}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status.replace('_', ' ')}</span>
                    </span>
                    {payment.refundStatus && payment.refundStatus !== 'none' && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Refund: {payment.refundStatus}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {toIST(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowDetailsModal(true);
                      }}
                      className="text-pink-600 hover:text-pink-900 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || paymentMethodFilter !== 'all' || statusFilter !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No payment transactions have been recorded yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Payment Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Payment Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Method</label>
                        <p className="text-sm text-gray-900">{selectedPayment.method}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Amount</label>
                        <p className="text-sm text-gray-900">₹{selectedPayment.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                          {getStatusIcon(selectedPayment.status)}
                          <span className="ml-1 capitalize">{selectedPayment.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                        <p className="text-sm text-gray-900">{selectedPayment.transactionId || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-sm text-gray-900">{selectedPayment.customerName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-sm text-gray-900">{selectedPayment.customerEmail}</p>
                      </div>
                    </div>
                  </div>

                  {/* COD Specific Information */}
                  {selectedPayment.type === 'cod' && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">COD Details</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Upfront Amount</label>
                          <p className="text-sm text-gray-900">₹{selectedPayment.upfrontAmount || 0}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Remaining Amount</label>
                          <p className="text-sm text-gray-900">₹{selectedPayment.remainingAmount || 0}</p>
                        </div>
                        {selectedPayment.codConfirmedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Confirmed At</label>
                            <p className="text-sm text-gray-900">{toIST(selectedPayment.codConfirmedAt)}</p>
                          </div>
                        )}
                        {selectedPayment.codConfirmedBy && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Confirmed By</label>
                            <p className="text-sm text-gray-900">{selectedPayment.codConfirmedBy}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Refund Information */}
                  {selectedPayment.refundStatus && selectedPayment.refundStatus !== 'none' && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Refund Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Refund Status</label>
                          <p className="text-sm text-gray-900 capitalize">{selectedPayment.refundStatus}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Refund Amount</label>
                          <p className="text-sm text-gray-900">₹{selectedPayment.refundAmount || 0}</p>
                        </div>
                        {selectedPayment.refundTransactionId && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Refund Transaction ID</label>
                            <p className="text-sm text-gray-900">{selectedPayment.refundTransactionId}</p>
                          </div>
                        )}
                        {selectedPayment.refundCompletedAt && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Refund Completed At</label>
                            <p className="text-sm text-gray-900">{toIST(selectedPayment.refundCompletedAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Revenue Information */}
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Revenue Status</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedPayment.revenueStatus}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Revenue Amount</label>
                        <p className="text-sm text-gray-900">₹{selectedPayment.revenueAmount || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Timestamps</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created At</label>
                        <p className="text-sm text-gray-900">{toIST(selectedPayment.createdAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Updated At</label>
                        <p className="text-sm text-gray-900">{toIST(selectedPayment.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentHistory;
