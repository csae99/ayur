const cron = require('node-cron');
const { Order, OrderStatusHistory } = require('../models');
const { Op } = require('sequelize');
const { sendStatusUpdate, getStatusName, getStatusMessage } = require('../utils/notifications');

// Configuration
const DAYS_UNTIL_AUTO_DELIVERY = 5; // Days after shipping to auto-mark as delivered

// ============================================
// OPTION 1: Time-Based Auto-Delivery (ACTIVE)
// ============================================
const runAutoDeliveryJob = async () => {
    console.log('[AutoDelivery] Running auto-delivery check...');

    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DAYS_UNTIL_AUTO_DELIVERY);

        // Find shipped orders older than cutoff
        const ordersToDeliver = await Order.findAll({
            where: {
                order_status: 4, // Shipped
                shipped_date: { [Op.lte]: cutoffDate }
            }
        });

        for (const order of ordersToDeliver) {
            // Update status to Delivered
            await order.update({
                order_status: 6,
                delivered_date: new Date()
            });

            // Add to status history
            await OrderStatusHistory.create({
                order_id: order.id,
                status: 6,
                status_name: getStatusName(6),
                notes: 'Auto-marked as delivered (5 days after shipping)',
                created_by: null // System action
            });

            // Send delivery notification email
            sendStatusUpdate(order, 'Delivered', getStatusMessage(6)).catch(err =>
                console.error(`[AutoDelivery] Failed to send email for Order #${order.id}:`, err.message)
            );

            console.log(`[AutoDelivery] Order #${order.id} marked as Delivered`);
        }

        console.log(`[AutoDelivery] Completed. ${ordersToDeliver.length} orders updated.`);
    } catch (error) {
        console.error('[AutoDelivery] Job failed:', error);
    }
};

// Schedule: Run daily at midnight (server time)
cron.schedule('0 0 * * *', () => {
    runAutoDeliveryJob();
});

// Also run once on startup (after 10 seconds to let DB connect)
setTimeout(() => {
    console.log('[AutoDelivery] Running initial check on startup...');
    runAutoDeliveryJob();
}, 10000);

// ============================================
// OPTION 2: Courier Tracking API (FUTURE USE)
// ============================================
/*
const axios = require('axios');

// Courier API Configuration
const COURIER_API_KEY = process.env.COURIER_API_KEY || '';
const COURIER_API_URL = process.env.COURIER_API_URL || 'https://api.courier-service.com/track';

// Check tracking status from courier
const checkCourierStatus = async (trackingNumber) => {
    try {
        const response = await axios.get(`${COURIER_API_URL}/${trackingNumber}`, {
            headers: { 'Authorization': `Bearer ${COURIER_API_KEY}` }
        });
        // Expected response: { status: 'delivered' | 'in_transit' | 'out_for_delivery' | ... }
        return response.data.status;
    } catch (err) {
        console.error(`[CourierTracking] API error for ${trackingNumber}:`, err.message);
        return null;
    }
};

// Map courier status to our order status
const mapCourierStatus = (courierStatus) => {
    const statusMap = {
        'picked_up': 3,       // Packed
        'in_transit': 4,      // Shipped
        'out_for_delivery': 5,// Out for Delivery
        'delivered': 6        // Delivered
    };
    return statusMap[courierStatus] || null;
};

const runCourierTrackingJob = async () => {
    console.log('[CourierTracking] Running tracking check...');
    
    try {
        // Find orders that are shipped or out for delivery with tracking numbers
        const ordersToTrack = await Order.findAll({
            where: { 
                order_status: { [Op.in]: [4, 5] },
                tracking_number: { [Op.ne]: null }
            }
        });

        for (const order of ordersToTrack) {
            const courierStatus = await checkCourierStatus(order.tracking_number);
            if (!courierStatus) continue;
            
            const newStatus = mapCourierStatus(courierStatus);
            if (newStatus && newStatus > order.order_status) {
                const updates = { order_status: newStatus };
                if (newStatus === 6) updates.delivered_date = new Date();
                
                await order.update(updates);
                
                await OrderStatusHistory.create({
                    order_id: order.id,
                    status: newStatus,
                    status_name: getStatusName(newStatus),
                    notes: `Status updated via courier tracking (${courierStatus})`,
                    created_by: null
                });

                console.log(`[CourierTracking] Order #${order.id} updated to ${getStatusName(newStatus)}`);
                
                // Send notification for important statuses
                if (newStatus >= 5) {
                    sendStatusUpdate(order, getStatusName(newStatus), getStatusMessage(newStatus)).catch(console.error);
                }
            }
        }
        
        console.log(`[CourierTracking] Completed. Checked ${ordersToTrack.length} orders.`);
    } catch (error) {
        console.error('[CourierTracking] Job failed:', error);
    }
};

// Uncomment to enable courier tracking (runs every 6 hours)
// cron.schedule('0 0,6,12,18 * * *', runCourierTrackingJob);
*/

module.exports = { runAutoDeliveryJob };
