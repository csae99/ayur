const fetch = require('node-fetch');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004';

// Helper to get user email (you'd fetch from identity service in production)
async function getUserEmail(userId) {
    try {
        // For now, returning a placeholder
        // In production, you'd call identity-service to get user's email
        return `user${userId}@example.com`;
    } catch (error) {
        console.error('Error fetching user email:', error);
        return null;
    }
}

// Helper to get item details from catalog service
async function getItemDetails(itemId) {
    try {
        const response = await fetch(`http://catalog-service:3002/items/${itemId}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching item details:', error);
        return null;
    }
}

// Send order confirmation email
async function sendOrderConfirmation(order) {
    try {
        const userEmail = await getUserEmail(order.user_id);
        if (!userEmail) {
            console.log('No email found for user:', order.user_id);
            return;
        }

        const item = await getItemDetails(order.item_id);
        const itemName = item ? item.item_title : `Item #${order.item_id}`;
        const itemPrice = item ? item.item_price : 0;
        const totalAmount = itemPrice * order.order_quantity;

        const orderData = {
            customerName: `Customer`, // Would fetch from identity service
            orderNumber: order.id,
            itemName,
            quantity: order.order_quantity,
            totalAmount: totalAmount.toFixed(2),
            estimatedDelivery: order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            }) : 'TBD',
            trackingUrl: `http://localhost/dashboard/patient/orders`
        };

        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/send-order-confirmation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: userEmail,
                orderData
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Order confirmation sent:', result.messageId);
            console.log('Preview URL:', result.previewUrl);
        }
    } catch (error) {
        console.error('Error sending order confirmation:', error);
        // Don't throw - email failures shouldn't break order creation
    }
}

// Send status update email
async function sendStatusUpdate(order, statusName, statusMessage) {
    try {
        const userEmail = await getUserEmail(order.user_id);
        if (!userEmail) return;

        const item = await getItemDetails(order.item_id);
        const itemName = item ? item.item_title : `Item #${order.item_id}`;

        const orderData = {
            customerName: `Customer`,
            orderNumber: order.id,
            statusName,
            statusMessage,
            trackingNumber: order.tracking_number,
            estimatedDelivery: order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            }) : null,
            trackingUrl: `http://localhost/dashboard/patient/orders`
        };

        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/send-status-update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: userEmail,
                orderData
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Status update sent:', result.messageId);
            console.log('Preview URL:', result.previewUrl);
        }
    } catch (error) {
        console.error('Error sending status update:', error);
    }
}

// Send cancellation email
async function sendCancellationEmail(order) {
    try {
        const userEmail = await getUserEmail(order.user_id);
        if (!userEmail) return;

        const item = await getItemDetails(order.item_id);
        const itemName = item ? item.item_title : `Item #${order.item_id}`;
        const itemPrice = item ? item.item_price : 0;
        const totalAmount = itemPrice * order.order_quantity;

        const orderData = {
            customerName: `Customer`,
            orderNumber: order.id,
            itemName,
            totalAmount: totalAmount.toFixed(2)
        };

        const response = await fetch(`${NOTIFICATION_SERVICE_URL}/send-cancellation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: userEmail,
                orderData
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Cancellation email sent:', result.messageId);
            console.log('Preview URL:', result.previewUrl);
        }
    } catch (error) {
        console.error('Error sending cancellation email:', error);
    }
}

// Get status name
function getStatusName(statusCode) {
    const statuses = {
        0: 'Pending Payment',
        1: 'Confirmed',
        2: 'Processing',
        3: 'Packed',
        4: 'Shipped',
        5: 'Out for Delivery',
        6: 'Delivered',
        7: 'Cancelled'
    };
    return statuses[statusCode] || 'Unknown';
}

// Get status message
function getStatusMessage(statusCode) {
    const messages = {
        1: 'Your order has been confirmed and will be processed soon.',
        2: 'We are currently processing your order.',
        3: 'Your order has been packed and is ready for shipment.',
        4: 'Your order has been shipped! Track it using the tracking number above.',
        5: 'Your order is out for delivery and will arrive soon.',
        6: 'Your order has been successfully delivered. Thank you for your order!',
        7: 'Your order has been cancelled.'
    };
    return messages[statusCode] || 'Your order status has been updated.';
}

module.exports = {
    sendOrderConfirmation,
    sendStatusUpdate,
    sendCancellationEmail,
    getStatusName,
    getStatusMessage
};
