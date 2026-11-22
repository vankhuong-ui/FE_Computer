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
        if (!authNavArea) return;

        if (user) {
            authNavArea.innerHTML = `
                <div class="user-menu-wrapper">
                    <span class="user-chip">
                        <span class="user-avatar-initial">${(user.accountname || user.gmail || 'U')[0].toUpperCase()}</span>
                        <span class="user-name">${user.accountname || user.gmail}</span>
                        ${this.isAdmin() ? '<span class="badge badge-info text-xs">Admin</span>' : ''}
                    </span>
                    <div class="user-dropdown-menu">
                        <a href="${CONFIG.ROUTES.PROFILE}" class="dropdown-item">Hồ sơ cá nhân</a>
                        <a href="${CONFIG.ROUTES.ORDERS}" class="dropdown-item">Đơn hàng của tôi</a>
                        <a href="${CONFIG.ROUTES.WARRANTY}" class="dropdown-item">Bảo hành điện tử</a>
                        ${this.isAdmin() ? `<a href="${CONFIG.ROUTES.ADMIN_DASHBOARD}" class="dropdown-item">Trang quản trị</a>` : ''}
                        <div class="dropdown-divider"></div>
                        <button type="button" id="btnLogout" class="dropdown-item text-danger">Đăng xuất</button>
                    </div>
                </div>
            `;

            document.getElementById('btnLogout')?.addEventListener('click', () => {
                this.logout();
            });
        } else {
            authNavArea.innerHTML = `
                <a href="${CONFIG.ROUTES.LOGIN}" class="btn btn-secondary btn-sm">Đăng nhập</a>
                <a href="${CONFIG.ROUTES.REGISTER}" class="btn btn-primary btn-sm">Đăng ký</a>
            `;
        }
    }
};
