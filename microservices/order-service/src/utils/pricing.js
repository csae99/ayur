/**
 * Pricing utility functions for order service
 */

/**
 * Calculate price breakdown for cart items
 * @param {Array} cartItems - Array of cart items with product details
 * @returns {Object} Price breakdown {subtotal, shipping, tax, total}
 */
function calculatePricing(cartItems) {
    const subtotal = cartItems.reduce((sum, item) => {
        const price = item.product?.item_price || 0;
        const quantity = item.quantity || 0;
        return sum + (price * quantity);
    }, 0);

    // Free shipping above ₹500, else ₹50 flat
    const shipping = subtotal >= 500 ? 0 : 50;

    // 5% GST
    const tax = subtotal * 0.05;

    const total = subtotal + shipping + tax;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100
    };
}

/**
 * Estimate delivery date (5 business days from now)
 * @returns {string} Formatted delivery date
 */
function estimateDelivery() {
    const today = new Date();
    const deliveryDate = new Date(today);

    // Add 5 business days
    let daysAdded = 0;
    while (daysAdded < 5) {
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        const dayOfWeek = deliveryDate.getDay();
        // Skip weekends
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            daysAdded++;
        }
    }

    return deliveryDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Get order status label
 * @param {number} status - Status code
 * @returns {string} Status label
 */
function getOrderStatusLabel(status) {
    const statuses = {
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
    return statuses[status] || 'Unknown';
}

module.exports = {
    calculatePricing,
    estimateDelivery,
    getOrderStatusLabel
};
