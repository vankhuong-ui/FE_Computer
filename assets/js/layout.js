/**
 * layout.js - Shared Storefront Header & Footer Shell
 * Focused strictly on mounting Header/Footer and wiring sub-features:
 * - Branch synchronization: ./branch-store.js
 * - Location/branch selector modal: ./location-modal.js
 * - Quick repair booking modal: ./quick-repair-modal.js
 * - Mobile sticky bottom navigation: ./mobile-nav.js
 */

import { theme } from './theme.js?v=6';
import { auth } from './auth.js?v=10';
import { cart } from './cart.js?v=7';
import { CONFIG } from './config.js';
import { loadActiveBranches } from './branch-store.js';
import { mountLocationModal, updateHeaderLocationPillLabel } from './location-modal.js';
import { mountQuickRepairModal, openQuickRepairModal } from './quick-repair-modal.js';
import { mountMobileBottomNav, syncMobileCartBadge } from './mobile-nav.js';

export function initStoreLayout({ activeNav = 'home' } = {}) {
    const headerHost = document.getElementById('appHeader');
    if (headerHost) {
        headerHost.className = 'header';

        if (!document.getElementById('hkTopUtilityBar')) {
            const topBar = document.createElement('div');
            topBar.id = 'hkTopUtilityBar';
            topBar.className = 'top-utility-bar';
            topBar.innerHTML = `
                <div class="container top-utility-inner">
                    <div class="utility-group">
                        <span class="utility-item">
                            <span class="utility-dot"></span>
                            <a href="index.html#repair-center">Hệ thống 3 chi nhánh trọng điểm · Mở cửa: ${CONFIG.OPEN_HOURS}</a>
                        </span>
                    </div>
                    <div class="utility-group">
                        <span class="utility-item">Mua hàng &amp; Kỹ thuật: <a href="tel:18006889" style="font-weight: 700; color: #FFFFFF;">${CONFIG.HOTLINE}</a></span>
                        <span style="color: #475569;">|</span>
                        <span class="utility-item"><a href="warranty.html">Tra cứu bảo hành điện tử</a></span>
                    </div>
                </div>
            `;
            headerHost.parentNode?.insertBefore(topBar, headerHost);
        }

        const initialQ = new URLSearchParams(window.location.search).get('q') || '';
        const curLoc = CONFIG.getSelectedLocation();

        headerHost.innerHTML = `
            <div class="container header-inner">
                <a href="index.html" class="brand-logo" aria-label="HK COMPUTER" style="flex-shrink: 0;">
                    <span class="brand-text-col">
                        <span class="brand-title-line" style="font-size: 1.15rem; letter-spacing: -0.02em;">HK COMPUTER</span>
                        <span class="brand-sub-line">Laptop · PC · Phụ kiện</span>
                    </span>
                </a>

                <form id="headerSearchForm" class="header-search-form" role="search">
                    <span class="header-search-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </span>
                    <input type="search" id="headerSearchInput" class="header-search-input" placeholder="Tìm laptop, chuột, bàn phím, RAM, SSD..." value="${initialQ.replace(/"/g, '&quot;')}" />
                </form>

                <button type="button" id="btnHeaderLocation" class="header-location-pill" title="Chọn tỉnh/thành hoặc cơ sở để xem tồn kho">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span id="headerLocationLabel">${curLoc.label || 'Toàn quốc'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>

                <div class="header-actions">
                    <button type="button" id="btnHeaderQuickRepair" class="btn btn-accent btn-sm" style="height: 38px; border-radius: 999px; padding: 0 16px; font-weight: 600;">
                        Đặt lịch sửa chữa
                    </button>

                    <a href="cart.html" class="cart-icon-btn" style="width: 38px; height: 38px; border-radius: 10px;" id="headerCartBtn" aria-label="Giỏ hàng" title="Giỏ hàng của bạn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        <span class="cart-icon-badge" id="cartBadgeCount">0</span>
                    </a>

                    <div id="authNavArea"></div>
                </div>
            </div>
        `;

        document.getElementById('headerSearchForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const q = document.getElementById('headerSearchInput')?.value.trim() || '';
            const pageInput = document.getElementById('searchInput');
            if (pageInput) {
                pageInput.value = q;
                document.getElementById('btnSearch')?.click();
                document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.location.href = q ? `index.html?q=${encodeURIComponent(q)}#catalog` : 'index.html#catalog';
            }
        });
    }

    const footerHost = document.getElementById('appFooter');
    if (footerHost) {
        footerHost.className = 'footer';
        footerHost.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <div>
                        <a href="index.html" class="brand-logo" style="margin-bottom: 12px;">
                            <span class="brand-title-line" style="font-size: 1.05rem;">HK COMPUTER</span>
                        </a>
                        <p style="font-size: var(--text-xs); margin-bottom: 8px;">
                            Hệ thống phân phối Laptop, PC, Phụ kiện chính hãng và Trung tâm dịch vụ bảo hành, sửa chữa lấy liền tại Hà Nội, TP.HCM và Đà Nẵng.
                        </p>
                    </div>

                    <div>
                        <div class="footer-title">Dịch vụ kỹ thuật</div>
                        <ul class="footer-links">
                            <li><a href="index.html#repair-center">Sửa chữa mainboard &amp; phần cứng</a></li>
                            <li><a href="index.html#repair-center">Vệ sinh &amp; tra keo tản nhiệt</a></li>
                            <li><a href="index.html#repair-center">Nâng cấp RAM &amp; SSD NVMe</a></li>
                            <li><a href="index.html#repair-center">Cài đặt hệ điều hành &amp; phần mềm</a></li>
                        </ul>
                    </div>

                    <div>
                        <div class="footer-title">Chính sách &amp; Hỗ trợ</div>
                        <ul class="footer-links">
                            <li><a href="warranty.html">Tra cứu bảo hành điện tử</a></li>
                            <li><a href="order.html">Theo dõi &amp; thanh toán đơn hàng</a></li>
                            <li><a href="profile.html">Sổ địa chỉ &amp; lịch hẹn của tôi</a></li>
                            <li><a href="index.html#repair-center">Đặt lịch sửa chữa tận nơi</a></li>
                        </ul>
                    </div>

                    <div>
                        <div class="footer-title">Tổng đài trực tuyến</div>
                        <div class="tabular-nums" style="font-size: var(--text-base); font-weight: 800; color: var(--brand-orange); margin-bottom: 4px;">
                            <a href="tel:18006889">${CONFIG.HOTLINE}</a>
                        </div>
                        <div style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: 6px;">
                            Mở cửa: ${CONFIG.OPEN_HOURS}
                        </div>
                        <div class="mono-spec" style="font-size: 11px; color: var(--text-muted);">
                            Chuyển khoản VietQR · Thẻ ATM / VNPay
                        </div>
                    </div>
                </div>

                <div class="footer-bottom">
                    <span>© 2026 HK COMPUTER Service &amp; Technology. All rights reserved.</span>
                    <span class="mono-spec">Bảo hành điện tử chính hãng 12 – 36 tháng</span>
                </div>
            </div>
        `;
    }

    mountLocationModal();
    mountQuickRepairModal();
    mountMobileBottomNav(activeNav);

    document.getElementById('btnHeaderLocation')?.addEventListener('click', () => {
        window.openHkLocationModal?.();
    });

    window.addEventListener('hk:location-changed', () => {
        updateHeaderLocationPillLabel();
    });

    document.getElementById('btnHeaderQuickRepair')?.addEventListener('click', openQuickRepairModal);
    document.getElementById('btnMobileQuickRepair')?.addEventListener('click', openQuickRepairModal);

    loadActiveBranches();
    theme.init();
    auth.initHeaderNav();
    cart.updateHeaderBadge();
    syncMobileCartBadge();
}
