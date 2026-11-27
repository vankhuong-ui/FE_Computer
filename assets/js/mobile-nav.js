/**
 * mobile-nav.js - Sticky Mobile Bottom Navigation & Cart Badge Sync
 */

import { auth } from './auth.js?v=10';

export function syncMobileCartBadge() {
    const src = document.getElementById('cartBadgeCount');
    const dst = document.getElementById('mobileCartBadgeCount');
    if (!src || !dst) return;
    const sync = () => {
        const val = parseInt(src.textContent || '0', 10) || 0;
        dst.textContent = val > 99 ? '99+' : String(val);
        dst.style.display = val > 0 ? 'inline-flex' : 'none';
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(src, { childList: true, characterData: true, subtree: true, attributes: true });
}

export function mountMobileBottomNav(activeNav = '') {
    if (document.getElementById('hkMobileBottomNav')) return;
    document.body.classList.add('has-mobile-bottom-nav');

    const path = window.location.pathname.toLowerCase();
    const isHome = activeNav === 'home' || path.endsWith('index.html') || path === '/';
    const isCart = path.includes('cart') || path.includes('checkout');
    const isOrders = path.includes('order');
    const isWarranty = path.includes('warranty');
    const isAccount = path.includes('profile') || path.includes('dang-nhap');

    const nav = document.createElement('nav');
    nav.id = 'hkMobileBottomNav';
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Điều hướng di động');
    nav.innerHTML = `
        <a href="index.html" class="mobile-nav-item ${isHome ? 'active' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>Trang chủ</span>
        </a>
        <a href="cart.html" class="mobile-nav-item ${isCart ? 'active' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span class="mobile-nav-badge" id="mobileCartBadgeCount">0</span>
            <span>Giỏ hàng</span>
        </a>
        <button type="button" id="btnMobileQuickRepair" class="mobile-nav-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
            <span>Đặt sửa</span>
        </button>
        <a href="warranty.html" class="mobile-nav-item ${isWarranty ? 'active' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
            <span>Bảo hành</span>
        </a>
        <a href="${auth.isAuthenticated() ? (isOrders ? 'order.html' : 'profile.html') : 'dang-nhap.html'}" class="mobile-nav-item ${(isAccount || isOrders) ? 'active' : ''}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span>${auth.isAuthenticated() ? 'Tài khoản' : 'Đăng nhập'}</span>
        </a>
    `;
    document.body.appendChild(nav);
}
