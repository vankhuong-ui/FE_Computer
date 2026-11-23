/**
 * auth.js - Authentication & Role Management
 * Synchronized with BE_Computer Spring Security & JWT
 */

import { api, setAccessToken } from './api.js';
import { CONFIG } from './config.js';
import { toast } from './toast.js';

export const auth = {
    /**
     * Login with email and password
     */
    async login(gmail, password) {
        const response = await api.post(CONFIG.ENDPOINTS.AUTH.LOGIN, { gmail, password });
        
        // Save account info in session
        if (response) {
            sessionStorage.setItem('accountInfo', JSON.stringify(response));
        }

        // Fetch fresh access token via refresh-token cookie
        try {
            const tokenRes = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
                method: 'POST',
                credentials: 'include'
            });
            if (tokenRes.ok) {
                const tokenData = await tokenRes.json();
                const token = tokenData?.data?.accessToken || tokenData?.result?.accessToken || tokenData?.accessToken;
                if (token) {
                    setAccessToken(token);
                }
            }
        } catch (e) {
            console.warn('Initial token refresh deferred:', e);
        }

        return response;
    },

    /**
     * Register a new account
     */
    async register(accountData) {
        return await api.post(CONFIG.ENDPOINTS.AUTH.REGISTER, accountData);
    },

    /**
     * Logout and clear all credentials
     */
    async logout() {
        try {
            await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.LOGOUT}`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.warn('Logout server notification failed:', e);
        } finally {
            setAccessToken(null);
            sessionStorage.removeItem('accountInfo');
            toast.info('Đã đăng xuất thành công.');
            setTimeout(() => {
                window.location.href = CONFIG.ROUTES.HOME;
            }, 600);
        }
    },

    /**
     * Get parsed account info from session
     */
    getUser() {
        const raw = sessionStorage.getItem('accountInfo');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (_) {
            return null;
        }
    },

    isAuthenticated() {
        return !!this.getUser();
    },

    isAdmin() {
        const user = this.getUser();
        if (!user) return false;
        const role = user.role || user.authorities?.[0]?.authority || '';
        return role.toUpperCase().includes('ADMIN');
    },

    /**
     * Guard page requiring user login
     */
    requireAuth(redirectUrl = CONFIG.ROUTES.LOGIN) {
        if (!this.isAuthenticated()) {
            toast.warning('Vui lòng đăng nhập để tiếp tục.');
            setTimeout(() => {
                window.location.href = `${redirectUrl}?redirect=${encodeURIComponent(window.location.href)}`;
            }, 600);
            return false;
        }
        return true;
    },

    /**
     * Guard page requiring ADMIN role
     */
    requireAdmin(redirectUrl = CONFIG.ROUTES.ADMIN_LOGIN) {
        if (!this.isAuthenticated() || !this.isAdmin()) {
            toast.error('Truy cập bị từ chối: Yêu cầu quyền Quản trị viên (ADMIN).');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 800);
            return false;
        }
        return true;
    },

    /**
     * Update navigation UI based on current auth state
     */
    initHeaderNav() {
        const user = this.getUser();
        const authNavArea = document.getElementById('authNavArea');
        const guestCartBtn = document.getElementById('headerCartBtn');
        if (!authNavArea) return;

        const cartCount = parseInt(localStorage.getItem('cartCount') || '0');

        if (user) {
            if (guestCartBtn) guestCartBtn.style.display = 'inline-flex';

            const displayName = user.accountname || user.gmail || 'Tài khoản';
            const initial = displayName[0].toUpperCase();

            authNavArea.innerHTML = `
                <div class="user-menu-wrapper" id="accountMenuWrapper">
                    <button type="button" class="account-bar-btn" id="accountBarBtn" aria-expanded="false" aria-haspopup="true">
                        <span class="user-avatar-initial">${initial}</span>
                        <span style="max-width: 110px; overflow: hidden; text-overflow: ellipsis;">${displayName}</span>
                        <span style="font-size: 10px; color: var(--text-muted);">▾</span>
                    </button>
                    <div class="user-dropdown-menu" id="accountDropdownMenu">
                        <div class="dropdown-user-header">
                            <div style="font-size: var(--text-xs); font-weight: 700; color: var(--text-primary);">${displayName}</div>
                            <div style="font-size: 11px; color: var(--text-secondary); word-break: break-all;">${user.gmail || ''}</div>
                        </div>
                        <a href="${CONFIG.ROUTES.PROFILE}" class="dropdown-item">
                            <span>Quản lý tài khoản cá nhân</span>
                        </a>
                        <a href="${CONFIG.ROUTES.ORDERS}" class="dropdown-item">
                            <span>Đơn hàng của tôi</span>
                        </a>
                        <a href="${CONFIG.ROUTES.CART}" class="dropdown-item">
                            <span>Giỏ hàng của tôi</span>
                            <span class="badge badge-warning tabular-nums" id="dropdownCartBadge">${cartCount}</span>
                        </a>
                        <a href="${CONFIG.ROUTES.WARRANTY}" class="dropdown-item">
                            <span>Bảo hành điện tử</span>
                        </a>
                        <a href="setpassword.html" class="dropdown-item">
                            <span>Đổi mật khẩu</span>
                        </a>
                        ${this.isAdmin() ? `
                            <div class="dropdown-divider"></div>
                            <a href="${CONFIG.ROUTES.ADMIN_DASHBOARD}" class="dropdown-item" style="color: var(--brand-green); font-weight: 700;">
                                <span>Trang quản trị Admin</span>
                            </a>
                        ` : ''}
                        <div class="dropdown-divider"></div>
                        <button type="button" id="btnLogout" class="dropdown-item text-danger">
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            `;

            const btn = document.getElementById('accountBarBtn');
            const menu = document.getElementById('accountDropdownMenu');
            const wrapper = document.getElementById('accountMenuWrapper');

            btn?.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = menu.classList.toggle('open');
                btn.setAttribute('aria-expanded', String(isOpen));
            });

            document.addEventListener('click', (e) => {
                if (wrapper && !wrapper.contains(e.target)) {
                    menu?.classList.remove('open');
                    btn?.setAttribute('aria-expanded', 'false');
                }
            });

            document.getElementById('btnLogout')?.addEventListener('click', () => {
                this.logout();
            });
        } else {
            // Chưa đăng nhập: hiển thị icon giỏ hàng gọn ở ngoài header
            if (guestCartBtn) guestCartBtn.style.display = 'inline-flex';

            authNavArea.innerHTML = `
                <a href="${CONFIG.ROUTES.LOGIN}" class="btn btn-secondary btn-sm">Đăng nhập</a>
                <a href="${CONFIG.ROUTES.REGISTER}" class="btn btn-primary btn-sm">Đăng ký</a>
            `;
        }
    }
};
