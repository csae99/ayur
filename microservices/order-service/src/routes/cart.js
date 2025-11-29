const express = require('express');
const router = express.Router();
const { Cart, CartItem } = require('../models/cart');
const verifyToken = require('../middleware/auth');

// Get user's cart
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        let cart = await Cart.findOne({
            where: { user_id: userId },
            include: [{ model: CartItem }]
        });

        if (!cart) {
            cart = await Cart.create({ user_id: userId });
            cart.dataValues.CartItems = [];
        }

        res.json(cart);
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add item to cart
router.post('/add', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { item_id, quantity } = req.body;

        let cart = await Cart.findOne({ where: { user_id: userId } });
        if (!cart) {
            cart = await Cart.create({ user_id: userId });
        }

        let cartItem = await CartItem.findOne({
            where: { cart_id: cart.id, item_id: item_id }
        });

        if (cartItem) {
            cartItem.quantity += quantity || 1;
            await cartItem.save();
        } else {
            await CartItem.create({
                cart_id: cart.id,
                item_id: item_id,
                quantity: quantity || 1
            });
        }

        res.json({ message: 'Item added to cart' });
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update item quantity
router.post('/update', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { item_id, quantity } = req.body;

        const cart = await Cart.findOne({ where: { user_id: userId } });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const cartItem = await CartItem.findOne({
            where: { cart_id: cart.id, item_id: item_id }
        });

        if (cartItem) {
            if (quantity > 0) {
                cartItem.quantity = quantity;
                await cartItem.save();
            } else {
                await cartItem.destroy();
            }
            res.json({ message: 'Cart updated' });
        } else {
            res.status(404).json({ message: 'Item not found in cart' });
        }
    } catch (err) {
        console.error('Error updating cart:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove item from cart
router.post('/remove', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { item_id } = req.body;

        const cart = await Cart.findOne({ where: { user_id: userId } });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        await CartItem.destroy({
            where: { cart_id: cart.id, item_id: item_id }
        });

        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error('Error removing from cart:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
