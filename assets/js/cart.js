/**
 * cart.js - Minimalist Cart State Manager
 * Synchronizes with Spring Boot /api/cart (CartRequest: { productId, quality }) and localStorage
 */

import { api } from './api.js';
import { auth } from './auth.js';
import { CONFIG } from './config.js';
import { toast } from './toast.js';

class CartManager {
    constructor() {
        this.STORAGE_KEY = 'hk_cart_guest';
        this.items = this.loadLocal();
    }

    loadLocal() {
        try {
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
        } catch (_) {
            return [];
        }
    }

    saveLocal() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
        const total = this.getCount();
        localStorage.setItem('cartCount', total);
        this.emitUpdate();
    }

    emitUpdate() {
        window.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: this.getCount() } }));
        this.updateHeaderBadge();
    }

    getCount() {
        return this.items.reduce((sum, item) => sum + (item.quality || item.quantity || 1), 0);
    }

    async getCart() {
        if (auth.isAuthenticated()) {
            try {
                const serverCart = await api.get(CONFIG.ENDPOINTS.CART.GET);
                if (Array.isArray(serverCart)) {
                    this.items = serverCart;
                    this.saveLocal();
                    return this.items;
                }
            } catch (e) {
                console.warn('Could not sync cart from server, using local:', e);
            }
        }
        return this.items;
    }

    async addItem(product, quantity = 1) {
        const prodId = Number(product.id);
        if (auth.isAuthenticated()) {
            try {
                await api.post(CONFIG.ENDPOINTS.CART.ADD, {
                    productId: prodId,
                    quality: quantity
                });
                await this.getCart();
                toast.success(`Đã thêm "${product.name}" vào giỏ hàng.`);
                return;
            } catch (e) {
                toast.error(e.message || 'Không thể thêm vào giỏ hàng.');
                return;
            }
        }

        // Guest fallback
        const existing = this.items.find(item => Number(item.products?.id || item.id) === prodId);
        if (existing) {
            existing.quality = (existing.quality || existing.quantity || 1) + quantity;
        } else {
            this.items.push({
                id: Date.now(),
                products: {
                    id: prodId,
                    nameProduct: product.name,
                    price: product.price,
                    image: product.image || product.imageUrl || ''
                },
                quality: quantity
            });
        }
        this.saveLocal();
        toast.success(`Đã thêm "${product.name}" vào giỏ hàng.`);
    }

    buyNow(product, quantity = 1) {
        const buyItem = [{
            products: {
                id: Number(product.id),
                nameProduct: product.name,
                price: Number(product.price) || 0,
                image: product.image || product.imageUrl || ''
            },
            quality: Math.max(1, Number(quantity) || 1)
        }];
        sessionStorage.setItem('selectedCartItems', JSON.stringify(buyItem));
        if (!auth.requireAuth()) return;
        window.location.href = 'checkout.html';
    }

    async updateQuantity(productId, quality) {
        if (quality <= 0) {
            return;
        }
        if (auth.isAuthenticated()) {
            try {
                await api.put(CONFIG.ENDPOINTS.CART.UPDATE(productId, quality));
                await this.getCart();
                return;
            } catch (e) {
                toast.error(e.message || 'Không thể cập nhật số lượng.');
            }
        }
    }

    async removeItem(cartId) {
        if (auth.isAuthenticated()) {
            try {
                await api.delete(CONFIG.ENDPOINTS.CART.REMOVE(cartId));
                await this.getCart();
                toast.info('Đã xóa sản phẩm khỏi giỏ hàng.');
                return;
            } catch (e) {
                toast.error(e.message || 'Không thể xóa sản phẩm.');
            }
        }
        this.items = this.items.filter(i => i.id !== cartId);
        this.saveLocal();
    }

    updateHeaderBadge() {
        const count = parseInt(localStorage.getItem('cartCount') || this.getCount() || '0');
        document.querySelectorAll('#cartBadgeCount, #cartCount, #dropdownCartBadge').forEach(badge => {
            badge.textContent = count;
            if (badge.id === 'cartBadgeCount') {
                badge.style.display = count > 0 ? 'inline-flex' : 'none';
            }
        });
    }
}

export const cart = new CartManager();
