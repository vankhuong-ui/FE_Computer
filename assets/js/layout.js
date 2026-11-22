/**
 * layout.js - Shared Minimalist Header & Footer Renderer for HK COMPUTER Storefront
 * Text-only brand wordmark ("HK COMPUTER"), Light/Dark theme switcher, Cart & Account menu.
 */

import { theme } from './theme.js';
import { auth } from './auth.js';
import { cart } from './cart.js';
import { CONFIG } from './config.js';

export function initStoreLayout({ activeNav = 'home' } = {}) {
    const headerHost = document.getElementById('appHeader');
    if (headerHost) {
        headerHost.className = 'header';
        headerHost.innerHTML = `
            <div class="container header-inner">
                <a href="index.html" class="brand-logo" aria-label="HK COMPUTER">
                    <span class="brand-hk">HK</span>
                    <span class="brand-computer">COMPUTER</span>
                </a>

                <nav aria-label="Điều hướng chính">
                    <ul class="nav-links">
                        <li><a href="index.html" class="nav-link ${activeNav === 'home' ? 'active' : ''}">Sản phẩm</a></li>
                        <li><a href="index.html#repair-center" class="nav-link ${activeNav === 'repair' ? 'active' : ''}">Cửa hàng & Sửa chữa</a></li>
                        <li><a href="warranty.html" class="nav-link ${activeNav === 'warranty' ? 'active' : ''}">Bảo hành</a></li>
                        <li><a href="order.html" class="nav-link ${activeNav === 'orders' ? 'active' : ''}">Đơn hàng</a></li>
                        <li><a href="support.html" class="nav-link ${activeNav === 'support' ? 'active' : ''}">Hỗ trợ</a></li>
                    </ul>
                </nav>

                <div class="header-actions" style="gap: 10px;">
                    <button type="button" class="theme-toggle-btn" data-theme-toggle aria-label="Chuyển giao diện Sáng/Tối" title="Chuyển giao diện Sáng/Tối">🌙</button>
                    <a href="cart.html" class="cart-btn" id="headerCartBtn">
                        <span>Giỏ hàng</span>
                        <span class="cart-badge" id="cartBadgeCount">0</span>
                    </a>
                    <div id="authNavArea"></div>
                </div>
            </div>
        `;
    }

    const footerHost = document.getElementById('appFooter');
    if (footerHost) {
        footerHost.className = 'footer';
        footerHost.innerHTML = `
            <div class="container">
                <div class="footer-grid">
                    <div>
                        <a href="index.html" class="brand-logo" style="margin-bottom: 10px;">
                            <span class="brand-hk">HK</span>
                            <span class="brand-computer">COMPUTER</span>
                        </a>
                        <p style="font-size: var(--text-xs); margin-bottom: 8px;">
                            Hệ thống bán lẻ Laptop, PC Gaming & Trung tâm Sửa chữa — Bảo hành điện tử chính hãng với ${CONFIG.BRANCHES.length} chi nhánh trên toàn quốc.
                        </p>
                        <div class="tabular-nums" style="font-size: var(--text-xs); color: var(--text-secondary);">
                            Giờ mở cửa: ${CONFIG.OPEN_HOURS}
                        </div>
                    </div>

                    <div>
                        <div class="footer-title">Dịch vụ & Trải nghiệm</div>
                        <ul class="footer-links">
                            <li><a href="index.html#repair-center">Hệ thống ${CONFIG.BRANCHES.length} chi nhánh & Đặt lịch sửa chữa</a></li>
                            <li><a href="warranty.html">Tra cứu bảo hành điện tử (1 đổi 1)</a></li>
                            <li><a href="order.html">Tra cứu & Thanh toán đơn hàng</a></li>
                            <li><a href="profile.html">Quản lý tài khoản & Sổ địa chỉ</a></li>
                            <li><a href="support.html">Hỗ trợ kỹ thuật trực tuyến</a></li>
                        </ul>
                    </div>

                    <div>
                        <div class="footer-title">Tổng đài & Thanh toán</div>
                        <ul class="footer-links">
                            <li>Hotline miễn phí: <a href="tel:18006889" class="tabular-nums" style="font-weight: 700; color: var(--brand-green);">${CONFIG.HOTLINE}</a></li>
                            <li>Thanh toán: VietQR SePay • VNPay • Tiền mặt</li>
                            <li><a href="dang-nhap-admin.html">Cổng Quản trị (Admin)</a></li>
                        </ul>
                    </div>
                </div>

                <div class="footer-bottom">
                    <span>© 2026 HK COMPUTER. Tối giản — Chính hãng — Tận tâm.</span>
                    <span>Bảo hành điện tử 12 – 36 tháng</span>
                </div>
            </div>
        `;
    }

    theme.init();
    auth.initHeaderNav();
    cart.updateHeaderBadge();
}
