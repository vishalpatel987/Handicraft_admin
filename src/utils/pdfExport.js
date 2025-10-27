import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper function to format amounts properly for PDF
const formatAmount = (amount) => {
  const numAmount = Number(amount) || 0;
  // Simple formatting without special characters
  if (numAmount === 0) return '₹0';
  return `₹${numAmount.toString()}`;
};

// Helper function to add text with proper encoding
const addText = (pdf, text, x, y) => {
  // Convert to string and ensure proper encoding
  const textStr = String(text);
  pdf.text(textStr, x, y);
};

// PDF Export Utility Functions
export const exportToPDF = async (elementId, filename, title = 'Report') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found for PDF export');
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 20, 20);
    
    // Add date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, 30);
    
    // Add image
    pdf.addImage(imgData, 'PNG', 0, 40, imgWidth, imgHeight);
    heightLeft -= pageHeight - 50;

    // Add new pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save(filename);
    
    return { success: true, message: 'PDF exported successfully' };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, message: error.message };
  }
};

// Export revenue report as PDF
export const exportRevenueReportPDF = async (revenueData, stats, period = 'monthly') => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Revenue Report & Settlement', 20, 30);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Period: ${period.charAt(0).toUpperCase() + period.slice(1)}`, 20, 40);
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, 50);
    
    // Revenue Summary
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Revenue Summary', 20, 70);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    let yPosition = 85;
    
    // Revenue Summary - Direct text addition
    pdf.text('Total Revenue:', 20, yPosition);
    pdf.text('Rs ' + (stats.totalRevenue || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Net Revenue:', 20, yPosition);
    pdf.text('Rs ' + (stats.netRevenue || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Total Deductions:', 20, yPosition);
    pdf.text('Rs ' + (stats.totalDeductions || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Average Order Value:', 20, yPosition);
    pdf.text('Rs ' + (stats.averageOrderValue || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Total Orders:', 20, yPosition);
    pdf.text((stats.totalOrders || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    // Revenue Status Breakdown
    yPosition += 10;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Revenue Status Breakdown', 20, yPosition);
    
    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    // Revenue Status Breakdown - Direct text addition
    pdf.text('Pending:', 20, yPosition);
    pdf.text('Rs ' + (stats.pendingRevenue || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Earned:', 20, yPosition);
    pdf.text('Rs ' + (stats.earnedRevenue || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Confirmed:', 20, yPosition);
    pdf.text('Rs ' + (stats.confirmedRevenue || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Cancelled:', 20, yPosition);
    pdf.text('Rs ' + (stats.cancelledRevenue || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Refunded:', 20, yPosition);
    pdf.text('Rs ' + (stats.refundedRevenue || 0), 100, yPosition);
    yPosition += 8;
    
    // Payment Method Breakdown
    yPosition += 10;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Method Breakdown', 20, yPosition);
    
    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    // Payment Method Breakdown - Direct text addition
    pdf.text('Online Payments:', 20, yPosition);
    pdf.text('Rs ' + (stats.onlineRevenue || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Cash on Delivery:', 20, yPosition);
    pdf.text('Rs ' + (stats.codRevenue || 0), 100, yPosition);
    yPosition += 8;
    
    // Performance Metrics
    yPosition += 10;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Metrics', 20, yPosition);
    
    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const revenueEfficiency = stats.totalRevenue > 0 ? ((stats.netRevenue / stats.totalRevenue) * 100).toFixed(1) : 0;
    const confirmationRate = stats.totalRevenue > 0 ? ((stats.confirmedRevenue / stats.totalRevenue) * 100).toFixed(1) : 0;
    
    // Performance Metrics - Direct text addition
    pdf.text('Revenue Efficiency:', 20, yPosition);
    pdf.text(revenueEfficiency + '%', 100, yPosition);
    yPosition += 8;
    
    pdf.text('Confirmation Rate:', 20, yPosition);
    pdf.text(confirmationRate + '%', 100, yPosition);
    yPosition += 8;
    
    pdf.text('Average Order Value:', 20, yPosition);
    pdf.text('Rs ' + (stats.averageOrderValue || 0), 100, yPosition);
    yPosition += 8;
    
    // Footer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('This is a computer-generated report from Rikocraft Admin Panel.', 20, 280);
    
    // Save the PDF
    const filename = `revenue-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    return { success: true, message: 'Revenue report PDF exported successfully' };
  } catch (error) {
    console.error('Error generating revenue PDF:', error);
    return { success: false, message: error.message };
  }
};

// Export payment history as PDF
export const exportPaymentHistoryPDF = async (payments, stats) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment History Report', 20, 30);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, 40);
    
    // Summary Statistics
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary Statistics', 20, 60);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    let yPosition = 75;
    
    // Summary Statistics - Direct text addition
    pdf.text('Total Transactions:', 20, yPosition);
    pdf.text((stats.totalTransactions || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Total Amount:', 20, yPosition);
    pdf.text('Rs ' + (stats.totalAmount || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Online Payments:', 20, yPosition);
    pdf.text((stats.onlinePayments || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('COD Payments:', 20, yPosition);
    pdf.text((stats.codPayments || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Successful Payments:', 20, yPosition);
    pdf.text((stats.successfulPayments || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Failed Payments:', 20, yPosition);
    pdf.text((stats.failedPayments || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Pending Payments:', 20, yPosition);
    pdf.text((stats.pendingPayments || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    // Payment Details Table
    yPosition += 15;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Details', 20, yPosition);
    
    yPosition += 15;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    
    // Table headers
    pdf.text('Order ID', 20, yPosition);
    pdf.text('Customer', 60, yPosition);
    pdf.text('Method', 100, yPosition);
    pdf.text('Amount', 130, yPosition);
    pdf.text('Status', 160, yPosition);
    pdf.text('Date', 180, yPosition);
    
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    
    // Table data (limit to first 20 payments to fit on page)
    const limitedPayments = payments.slice(0, 20);
    
    limitedPayments.forEach((payment) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.text(payment.orderId, 20, yPosition);
      pdf.text(payment.customerName.substring(0, 12), 60, yPosition);
      pdf.text(payment.method.substring(0, 8), 100, yPosition);
      pdf.text('Rs ' + (payment.amount || 0), 130, yPosition);
      pdf.text(payment.status.substring(0, 8), 160, yPosition);
      pdf.text(new Date(payment.createdAt).toLocaleDateString('en-IN'), 180, yPosition);
      
      yPosition += 6;
    });
    
    if (payments.length > 20) {
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`... and ${payments.length - 20} more payments`, 20, yPosition);
    }
    
    // Footer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('This is a computer-generated report from Rikocraft Admin Panel.', 20, 280);
    
    // Save the PDF
    const filename = `payment-history-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    return { success: true, message: 'Payment history PDF exported successfully' };
  } catch (error) {
    console.error('Error generating payment history PDF:', error);
    return { success: false, message: error.message };
  }
};

// Export refund management as PDF
export const exportRefundManagementPDF = async (refunds, stats) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Refund Management Report', 20, 30);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, 40);
    
    // Summary Statistics
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary Statistics', 20, 60);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    let yPosition = 75;
    
    // Summary Statistics - Direct text addition
    pdf.text('Total Refunds:', 20, yPosition);
    pdf.text((stats.totalRefunds || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Total Refund Amount:', 20, yPosition);
    pdf.text('Rs ' + (stats.totalRefundAmount || 0), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Pending Refunds:', 20, yPosition);
    pdf.text((stats.pendingRefunds || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Processing Refunds:', 20, yPosition);
    pdf.text((stats.processingRefunds || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Completed Refunds:', 20, yPosition);
    pdf.text((stats.completedRefunds || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Failed Refunds:', 20, yPosition);
    pdf.text((stats.failedRefunds || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('Online Refunds:', 20, yPosition);
    pdf.text((stats.onlineRefunds || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    pdf.text('COD Refunds:', 20, yPosition);
    pdf.text((stats.codRefunds || 0).toString(), 100, yPosition);
    yPosition += 8;
    
    // Refund Details Table
    yPosition += 15;
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Refund Details', 20, yPosition);
    
    yPosition += 15;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    
    // Table headers
    pdf.text('Order ID', 20, yPosition);
    pdf.text('Customer', 50, yPosition);
    pdf.text('Amount', 80, yPosition);
    pdf.text('Status', 100, yPosition);
    pdf.text('Date', 130, yPosition);
    
    yPosition += 8;
    pdf.setFont('helvetica', 'normal');
    
    // Table data (limit to first 20 refunds to fit on page)
    const limitedRefunds = refunds.slice(0, 20);
    
    limitedRefunds.forEach((refund) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.text(refund.orderId, 20, yPosition);
      pdf.text(refund.customerName.substring(0, 12), 60, yPosition);
      pdf.text('Rs ' + (refund.refundAmount || 0), 100, yPosition);
      pdf.text(refund.refundStatus.substring(0, 10), 130, yPosition);
      pdf.text(new Date(refund.refundInitiatedAt || refund.createdAt).toLocaleDateString('en-IN'), 160, yPosition);
      
      yPosition += 6;
    });
    
    if (refunds.length > 20) {
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`... and ${refunds.length - 20} more refunds`, 20, yPosition);
    }
    
    // Footer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('This is a computer-generated report from Rikocraft Admin Panel.', 20, 280);
    
    // Save the PDF
    const filename = `refund-management-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    return { success: true, message: 'Refund management PDF exported successfully' };
  } catch (error) {
    console.error('Error generating refund management PDF:', error);
    return { success: false, message: error.message };
  }
};
