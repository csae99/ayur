const express = require('express');
const router = express.Router();
const { Cart, CartItem } = require('../models/cart');
const { Order } = require('../models');
const Address = require('../models/address');
const verifyToken = require('../middleware/auth');
const { estimateDelivery } = require('../utils/pricing');
const { sendOrderConfirmation } = require('../utils/notifications');

// Create Payment Intent (Mock Stripe)
router.post('/payment-intent', verifyToken, async (req, res) => {
    try {
        const { amount, currency } = req.body;
        // In a real app, you would call Stripe API here.
        // For now, we return a mock client secret.
        res.json({
            clientSecret: 'mock_client_secret_' + Date.now(),
            amount: amount,
            currency: currency || 'inr'
        });
    } catch (err) {
        console.error('Error creating payment intent:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Place Order
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { address_id, payment_method, payment_id } = req.body;

        // 1. Get Cart
        const cart = await Cart.findOne({
            where: { user_id: userId },
            include: [{ model: CartItem }]
        });

        if (!cart || cart.CartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // 2. Validate Address
        const address = await Address.findOne({ where: { id: address_id, user_id: userId } });
        if (!address) {
            return res.status(400).json({ message: 'Invalid address' });
        }

        // 3. Create Orders (One per item for now, as per existing schema structure which seems to be item-based)
        // Note: The existing Order model seems to be per-item based on `item_id` and `order_quantity`.
        // A better design would be Order -> OrderItems, but to stick to existing pattern or minimal changes:
        // We will create multiple Order entries or refactor Order to have items.
        // Looking at `models/index.js`, Order has `item_id`. This implies one row per item order.
        // We will create multiple rows.

        // 3. Calculate estimated delivery
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 days from now

        // Handle Coupon
        const { coupon_code } = req.body;
        let discountPerItem = 0;
        let totalDiscount = 0;

        if (coupon_code) {
            const { Coupon } = require('../models');
            const coupon = await Coupon.findOne({ where: { code: coupon_code } });

            if (coupon && coupon.is_active) {
                // Calculate total cart value
                let cartTotal = 0;
                for (const item of cart.CartItems) {
                    // Fetch price (mock or real) - ideally should be from DB/Service
                    // For now assuming we trust the frontend or have price in CartItem (we don't)
                    // We need to fetch item details.
                    try {
                        const response = await fetch(`http://catalog-service:3002/items/${item.item_id}`);
                        const product = await response.json();
                        cartTotal += product.item_price * item.quantity;
                        item.price = product.item_price; // Store for later
                    } catch (e) {
                        console.error('Error fetching item price', e);
                    }
                }

                // Apply discount logic
                if (coupon.discount_type === 'percentage') {
                    totalDiscount = (cartTotal * coupon.discount_value) / 100;
                    if (coupon.max_discount && totalDiscount > coupon.max_discount) {
                        totalDiscount = coupon.max_discount;
                    }
                } else if (coupon.discount_type === 'fixed') {
                    totalDiscount = coupon.discount_value;
                }

                // Cap discount
                if (totalDiscount > cartTotal) totalDiscount = cartTotal;

                // Increment usage
                await coupon.increment('used_count');
            }
        }

        const orders = [];
        // Distribute discount proportionally if needed, or just store on first order?
        // Better: Store total discount on the order record(s). 
        // Since we are splitting into multiple orders, it's tricky.
        // Let's split discount proportionally based on item price.

        // Re-calculate total for distribution (in case we didn't fetch prices above)
        // If we didn't fetch prices above (no coupon), we need to fetch them now or just store 0.

        for (const item of cart.CartItems) {
            // Fetch price if not already fetched
            if (!item.price) {
                try {
                    const response = await fetch(`http://catalog-service:3002/items/${item.item_id}`);
                    const product = await response.json();
                    item.price = product.item_price;
                } catch (e) {
                    item.price = 0;
                }
            }

            // Simple proportional discount
            // This is a bit complex for a simple fix, let's simplify:
            // If there's a coupon, we'll apply it to the first order or split it?
            // Splitting is best.

            // Total Cart Value for distribution
            // We need the total cart value again if we didn't calculate it
            // Let's assume we did or do it now.
        }

        const totalCartValue = cart.CartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        for (const item of cart.CartItems) {
            const itemTotal = item.price * item.quantity;
            const itemShare = totalCartValue > 0 ? itemTotal / totalCartValue : 0;
            const itemDiscount = totalDiscount * itemShare;
            const finalAmount = itemTotal - itemDiscount;

            const order = await Order.create({
                user_id: userId,
                item_id: item.item_id,
                order_quantity: item.quantity,
                order_quantity: item.quantity,
                // If payment method is COD, confirm immediately (1). Else pending (0).
                order_status: (payment_method === 'cod') ? 1 : 0,
                razorpay_order_id: null,
                razorpay_payment_id: null,
                payment_method: payment_method, // Store explicit method
                address_id: address_id,
                estimated_delivery: deliveryDate,
                coupon_code: coupon_code || null,
                discount_amount: parseFloat(itemDiscount.toFixed(2)),
                final_amount: parseFloat(finalAmount.toFixed(2))
            });

            // Trigger notification
            sendOrderConfirmation(order).catch(err =>
                console.error(`Failed to send confirmation for order ${order.id}:`, err)
            );

            orders.push(order);
        }

        // 4. Clear Cart
        await CartItem.destroy({ where: { cart_id: cart.id } });

        res.json({ message: 'Order placed successfully', orderIds: orders.map(o => o.id) });

    } catch (err) {
        console.error('Error placing order:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get/Add Addresses
router.get('/addresses', verifyToken, async (req, res) => {
    try {
        const addresses = await Address.findAll({ where: { user_id: req.user.id } });
        res.json(addresses);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/addresses', verifyToken, async (req, res) => {
    try {
        const address = await Address.create({
            user_id: req.user.id,
            ...req.body
        });
        res.json(address);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
