const fetch = require('node-fetch');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004';
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://identity-service:3001';

// Status mappings
const STATUS_NAMES = {
    0: 'Pending Payment',
    1: 'Confirmed',
    2: 'Processing',
    3: 'Packed',
    4: 'Shipped',
    5: 'Out for Delivery',
    6: 'Delivered',
    7: 'Cancelled',
    8: 'Returned',
    9: 'Refunded'
};

const STATUS_MESSAGES = {
    1: 'Your order has been confirmed and will be processed soon.',
    2: 'We are currently processing your order with care.',
    3: 'Your order has been packed and is ready for shipment.',
    4: 'Your order has been shipped! Track it using the tracking number provided.',
    5: 'Your order is out for delivery and will arrive today!',
    6: 'Your order has been successfully delivered. Thank you for your order!',
    7: 'Your order has been cancelled. Any payment will be refunded within 5-7 business days.'
};

// Fetch user details from identity service
async function getUserDetails(userId) {
    try {
        // Try to get patient details
        const response = await fetch(`${IDENTITY_SERVICE_URL}/api/identity/patients/${userId}`);
        if (response.ok) {
            const user = await response.json();
            return {
                email: user.email,
                phone: user.phone,
                name: user.fname ? `${user.fname} ${user.lname || ''}`.trim() : user.username
            };
        }

        // Fallback - return placeholder
        console.log('Could not fetch user details for userId:', userId);
        return {
            email: null,
            phone: null,
            name: 'Valued Customer'
        };
    } catch (error) {
        console.error('Error fetching user details:', error.message);
        return {
            email: null,
            phone: null,
            name: 'Valued Customer'
        };
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

// Build base order data for notifications
async function buildOrderData(order) {
    const item = await getItemDetails(order.item_id);
    const itemName = item ? item.item_title : `Item #${order.item_id}`;
    const itemPrice = item ? item.item_price : 0;
    const totalAmount = order.final_amount || (itemPrice * order.order_quantity);

    return {
        orderNumber: order.id,
        itemName,
        itemImage: item?.item_image,
        quantity: order.order_quantity,
        totalAmount: totalAmount.toFixed(2),
        trackingNumber: order.tracking_number,
        estimatedDelivery: order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString('en-IN', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        }) : null,
        trackingUrl: `${process.env.APP_URL || 'http://localhost'}/dashboard/patient/orders`,
        statusCode: order.order_status
    };
}

// Send order confirmation email and SMS
async function sendOrderConfirmation(order) {
    try {
        const user = await getUserDetails(order.user_id);
        const orderData = await buildOrderData(order);

        orderData.customerName = user.name;
        orderData.statusName = 'Confirmed';
        orderData.statusMessage = STATUS_MESSAGES[1];

        // Send email if email available
        if (user.email) {
            const emailResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/send-order-confirmation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: user.email, orderData })
            });

            if (emailResponse.ok) {
                const result = await emailResponse.json();
                console.log('Order confirmation email sent:', result.messageId);
                if (result.previewUrl) console.log('Preview URL:', result.previewUrl);
            }
        }

        // Send SMS if phone available
        if (user.phone) {
            const smsResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/send-order-sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: user.phone, orderData, statusCode: 1 })
            });

            if (smsResponse.ok) {
                const result = await smsResponse.json();
                console.log('Order confirmation SMS sent:', result.sid || 'mock');
            }
        }
    } catch (error) {
        console.error('Error sending order confirmation:', error);
        // Don't throw - notification failures shouldn't break order creation
    }
}

// Send status update email and SMS
async function sendStatusUpdate(order, statusName, statusMessage) {
    try {
        const user = await getUserDetails(order.user_id);
        const orderData = await buildOrderData(order);

        orderData.customerName = user.name;
        orderData.statusName = statusName || STATUS_NAMES[order.order_status];
        orderData.statusMessage = statusMessage || STATUS_MESSAGES[order.order_status];

        // Send email if email available
        if (user.email) {
            const emailResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/send-status-update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: user.email, orderData })
            });

            if (emailResponse.ok) {
                const result = await emailResponse.json();
                console.log('Status update email sent:', result.messageId);
                if (result.previewUrl) console.log('Preview URL:', result.previewUrl);
            }
        }

        // Send SMS if phone available
        if (user.phone) {
            const smsResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/send-order-sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: user.phone,
                    orderData,
                    statusCode: order.order_status
                })
            });

            if (smsResponse.ok) {
                const result = await smsResponse.json();
                console.log('Status update SMS sent:', result.sid || 'mock');
            }
        }
    } catch (error) {
        console.error('Error sending status update:', error);
    }
}

// Send cancellation email and SMS
async function sendCancellationEmail(order) {
    try {
        const user = await getUserDetails(order.user_id);
        const orderData = await buildOrderData(order);

        orderData.customerName = user.name;

        // Send email if email available
        if (user.email) {
            const emailResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/send-cancellation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: user.email, orderData })
            });

            if (emailResponse.ok) {
                const result = await emailResponse.json();
                console.log('Cancellation email sent:', result.messageId);
            }
        }

        // Send SMS if phone available
        if (user.phone) {
            const smsResponse = await fetch(`${NOTIFICATION_SERVICE_URL}/send-order-sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: user.phone, orderData, statusCode: 7 })
            });

            if (smsResponse.ok) {
                const result = await smsResponse.json();
                console.log('Cancellation SMS sent:', result.sid || 'mock');
            }
        }
    } catch (error) {
        console.error('Error sending cancellation notification:', error);
    }
}

// Get status name
function getStatusName(statusCode) {
    return STATUS_NAMES[statusCode] || 'Unknown';
}

// Get status message
function getStatusMessage(statusCode) {
    return STATUS_MESSAGES[statusCode] || 'Your order status has been updated.';
}

module.exports = {
    sendOrderConfirmation,
    sendStatusUpdate,
    sendCancellationEmail,
    getStatusName,
    getStatusMessage,
    getUserDetails,
    buildOrderData
};
