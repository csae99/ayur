// SMS Message Templates for Order Notifications

const SMS_TEMPLATES = {
    orderConfirmation: (data) =>
        `🌿 AYURVEDA ORDER CONFIRMED

Order #${data.orderNumber}
Item: ${data.itemName}
Amount: ₹${data.totalAmount}

Expected: ${data.estimatedDelivery || 'TBD'}

Track: ${data.trackingUrl}

Thank you for shopping with us!`,

    orderProcessing: (data) =>
        `📦 Order Update - PROCESSING

Your order #${data.orderNumber} is now being processed.

We're preparing your Ayurvedic products with care.

Track: ${data.trackingUrl}`,

    orderPacked: (data) =>
        `📦 Order Update - PACKED

Your order #${data.orderNumber} has been packed and is ready for shipment!

It will be handed over to our delivery partner soon.

Track: ${data.trackingUrl}`,

    orderShipped: (data) =>
        `🚚 ORDER SHIPPED!

Order #${data.orderNumber} is on its way!

Tracking: ${data.trackingNumber}
Expected: ${data.estimatedDelivery || '2-5 days'}

Track: ${data.trackingUrl}`,

    orderOutForDelivery: (data) =>
        `🏃 OUT FOR DELIVERY!

Order #${data.orderNumber} will arrive TODAY!

Please ensure someone is available to receive the package.

Track: ${data.trackingUrl}`,

    orderDelivered: (data) =>
        `✅ ORDER DELIVERED!

Your order #${data.orderNumber} has been delivered successfully.

We hope you enjoy your Ayurvedic products!

Rate your experience: ${data.trackingUrl}`,

    orderCancelled: (data) =>
        `❌ Order Cancelled

Your order #${data.orderNumber} has been cancelled.

Amount: ₹${data.totalAmount}
Refund will be processed within 5-7 business days.

Questions? Reply to this message.`
};

// Get SMS template based on status code
const getSMSTemplate = (statusCode, data) => {
    const templateMap = {
        1: 'orderConfirmation',
        2: 'orderProcessing',
        3: 'orderPacked',
        4: 'orderShipped',
        5: 'orderOutForDelivery',
        6: 'orderDelivered',
        7: 'orderCancelled'
    };

    const templateName = templateMap[statusCode];
    if (!templateName || !SMS_TEMPLATES[templateName]) {
        // Default status update
        return `📦 Order #${data.orderNumber} status updated to: ${data.statusName}. Track: ${data.trackingUrl}`;
    }

    return SMS_TEMPLATES[templateName](data);
};

module.exports = { SMS_TEMPLATES, getSMSTemplate };
