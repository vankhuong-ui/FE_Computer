/**
 * auth.js - Customer Auth Popup Modal & Strict Customer/Admin Separation
 * - Header guest state: Avatar circle + "Xin chào, / Đăng nhập" (orange)
 * - 1 clean popup modal with instant Login <-> Register <-> OTP switching
 * - Strict separation: Admin accounts must log in via dang-nhap-admin.html
 */

import { api, setAccessToken } from './api.js';
import { CONFIG } from './config.js';
import { toast } from './toast.js';

function isAdminPortalPage() {
    const path = (window.location.pathname || '').toLowerCase();
    return path.includes('admin');
}

function mountCustomerAuthModal() {
    if (document.getElementById('hkAuthModal') || isAdminPortalPage()) return;

    const modal = document.createElement('div');
    modal.id = 'hkAuthModal';
    modal.className = 'hk-modal-backdrop';
    modal.innerHTML = `
        <div class="hk-modal-box hk-auth-modal-box" style="max-width: 410px; padding: 26px 24px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:16px;">
                <div>
                    <h3 id="hkAuthModalTitle" style="font-size: 1.25rem; margin: 0 0 4px;">Đăng nhập</h3>
                    <p id="hkAuthModalSub" style="font-size: 12.5px; color: var(--text-secondary); margin: 0;">Đăng nhập để thanh toán nhanh &amp; quản lý bảo hành điện tử</p>
                </div>
                <button type="button" id="btnCloseAuthModal" style="background:none; border:none; font-size:22px; cursor:pointer; color:var(--text-secondary); line-height:1;">×</button>
            </div>

            <!-- 1. LOGIN VIEW -->
            <div id="hkAuthLoginView">
                <form id="hkModalLoginForm">
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="hkLoginEmail">Email</label>
                        <input type="email" id="hkLoginEmail" class="input" style="height:42px;" required autocomplete="email" />
                    </div>
                    <div class="form-group" style="margin-bottom:14px;">
                        <label class="form-label" for="hkLoginPass">Mật khẩu</label>
                        <input type="password" id="hkLoginPass" class="input" style="height:42px;" required autocomplete="current-password" />
                    </div>
                    <button type="submit" id="btnHkLoginSubmit" class="btn btn-primary" style="width:100%; height:42px; font-size:14px; font-weight:700;">
                        Đăng nhập
                    </button>
                </form>

                <div style="display:flex; align-items:center; gap:10px; margin:14px 0; color:var(--text-muted); font-size:12px;">
                    <span style="flex:1; height:1px; background:var(--border);"></span>
                    <span>Hoặc</span>
                    <span style="flex:1; height:1px; background:var(--border);"></span>
                </div>

                <button type="button" id="btnHkGoogleLogin" class="btn btn-secondary" style="width:100%; height:40px; font-size:13px;">
                    <svg width="16" height="16" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.55 10.78l7.98-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>Tiếp tục với Google</span>
                </button>

                <div style="margin-top:16px; text-align:center; font-size:13px; color:var(--text-secondary);">
                    Chưa có tài khoản?
                    <button type="button" id="btnSwitchToRegister" style="background:none; border:none; color:#F59E0B; font-weight:700; cursor:pointer; padding:0 2px; font-size:13px;">Đăng ký ngay</button>
                </div>
            </div>

            <!-- 2. REGISTER VIEW -->
            <div id="hkAuthRegisterView" style="display:none;">
                <div style="padding:10px 12px; border-radius:8px; background:var(--brand-green-soft); border:1px solid var(--brand-green); font-size:12px; color:var(--brand-green); margin-bottom:14px; line-height:1.45;">
                    <b>Quyền lợi thành viên mới:</b> Tự động kích hoạt mã bảo hành điện tử ngay khi thanh toán &amp; nhận ưu đãi đơn đầu tiên.
                </div>

                <form id="hkModalRegisterForm">
                    <div class="form-group" style="margin-bottom:10px;">
                        <label class="form-label" for="hkRegName">Họ và tên</label>
                        <input type="text" id="hkRegName" class="input" style="height:40px;" required minlength="2" />
                    </div>
                    <div class="form-group" style="margin-bottom:10px;">
                        <label class="form-label" for="hkRegEmail">Email</label>
                        <input type="email" id="hkRegEmail" class="input" style="height:40px;" required autocomplete="email" />
                    </div>
                    <div class="form-group" style="margin-bottom:10px;">
                        <label class="form-label" for="hkRegPass">Mật khẩu</label>
                        <input type="password" id="hkRegPass" class="input" style="height:40px;" placeholder="Tối thiểu 6 ký tự" required minlength="6" autocomplete="new-password" />
                    </div>
                    <div class="form-group" style="margin-bottom:14px;">
                        <label class="form-label" for="hkRegConfirm">Nhập lại mật khẩu</label>
                        <input type="password" id="hkRegConfirm" class="input" style="height:40px;" required minlength="6" autocomplete="new-password" />
                    </div>
                    <button type="submit" id="btnHkRegSubmit" class="btn btn-primary" style="width:100%; height:42px; font-size:14px; font-weight:700;">
                        Đăng ký tài khoản
                    </button>
                </form>

                <div style="margin-top:16px; text-align:center; font-size:13px; color:var(--text-secondary);">
                    Đã có tài khoản?
                    <button type="button" id="btnSwitchToLogin" style="background:none; border:none; color:var(--brand-green); font-weight:700; cursor:pointer; padding:0 2px; font-size:13px;">Đăng nhập</button>
                </div>
            </div>

            <!-- 3. OTP VERIFY VIEW -->
            <div id="hkAuthOtpView" style="display:none;">
                <p id="hkOtpDesc" style="font-size:12.5px; color:var(--text-secondary); margin:0 0 12px;"></p>
                <form id="hkModalOtpForm">
                    <div class="form-group" style="margin-bottom:14px;">
                        <label class="form-label" for="hkOtpCode">Mã xác thực OTP (6 chữ số)</label>
                        <input type="text" id="hkOtpCode" class="input tabular-nums" style="height:44px; text-align:center; font-size:18px; letter-spacing:4px; font-weight:700;" maxlength="6" required />
                    </div>
                    <button type="submit" id="btnHkOtpSubmit" class="btn btn-primary" style="width:100%; height:42px; font-weight:700;">
                        Xác nhận &amp; Hoàn tất
                    </button>
                </form>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; font-size:12.5px;">
                    <button type="button" id="btnHkResendOtp" style="background:none; border:none; color:#288AD6; font-weight:600; cursor:pointer; padding:0;">Gửi lại mã OTP</button>
                    <button type="button" id="btnOtpBackToLogin" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:0;">Quay lại đăng nhập</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const loginView = document.getElementById('hkAuthLoginView');
    const regView = document.getElementById('hkAuthRegisterView');
    const otpView = document.getElementById('hkAuthOtpView');
    const titleEl = document.getElementById('hkAuthModalTitle');
    const subEl = document.getElementById('hkAuthModalSub');

    let pendingOtpEmail = '';

    const setMode = (mode) => {
        loginView.style.display = mode === 'login' ? 'block' : 'none';
        regView.style.display = mode === 'register' ? 'block' : 'none';
        otpView.style.display = mode === 'otp' ? 'block' : 'none';

        if (mode === 'register') {
            titleEl.textContent = 'Đăng ký tài khoản';
            subEl.textContent = 'Tạo tài khoản nhanh trong 30 giây để mua hàng & lưu bảo hành';
        } else if (mode === 'otp') {
            titleEl.textContent = 'Xác thực Email';
            subEl.textContent = 'Nhập mã OTP vừa gửi về hộp thư của bạn';
        } else {
            titleEl.textContent = 'Đăng nhập';
            subEl.textContent = 'Đăng nhập để thanh toán nhanh & quản lý bảo hành điện tử';
        }
    };

    const close = () => modal.classList.remove('active');
    document.getElementById('btnCloseAuthModal')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    document.getElementById('btnSwitchToRegister')?.addEventListener('click', () => setMode('register'));
    document.getElementById('btnSwitchToLogin')?.addEventListener('click', () => setMode('login'));
    document.getElementById('btnOtpBackToLogin')?.addEventListener('click', () => setMode('login'));

    document.getElementById('btnHkGoogleLogin')?.addEventListener('click', () => {
        window.location.href = `${CONFIG.API_BASE_URL}/oauth2/authorization/google`;
    });

    // Submit Login (Reject ADMIN accounts so Admin must use dang-nhap-admin.html)
    document.getElementById('hkModalLoginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const gmail = document.getElementById('hkLoginEmail').value.trim();
        const password = document.getElementById('hkLoginPass').value;
        const btn = document.getElementById('btnHkLoginSubmit');
        btn.disabled = true;
        btn.textContent = 'Đang đăng nhập...';

        try {
            const acc = await auth.login(gmail, password);
            const role = (acc?.role || acc?.authorities?.[0]?.authority || '').toUpperCase();
            if (role.includes('ADMIN')) {
                setAccessToken(null);
                sessionStorage.removeItem('accountInfo');
                try {
                    await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.LOGOUT}`, { method: 'POST', credentials: 'include' });
                } catch (_) {}
                toast.warning('Tài khoản Quản trị viên vui lòng đăng nhập tại cổng Quản trị riêng (dang-nhap-admin.html).');
                btn.disabled = false;
                btn.textContent = 'Đăng nhập';
                return;
            }
            toast.success(`Xin chào ${acc?.accountname || 'quý khách'}!`);
            close();
            auth.initHeaderNav();
            window.dispatchEvent(new CustomEvent('hk:auth-changed', { detail: acc }));
            if (window.location.pathname.includes('cart.html') || window.location.pathname.includes('checkout.html') || window.location.pathname.includes('order.html')) {
                window.location.reload();
            }
        } catch (err) {
            toast.error(err.message || 'Email hoặc mật khẩu không chính xác.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Đăng nhập';
        }
    });

    // Submit Register
    document.getElementById('hkModalRegisterForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const accountname = document.getElementById('hkRegName').value.trim();
        const gmail = document.getElementById('hkRegEmail').value.trim();
        const password = document.getElementById('hkRegPass').value;
        const confirmPassword = document.getElementById('hkRegConfirm').value;

        if (password !== confirmPassword) {
            toast.warning('Mật khẩu nhập lại không khớp.');
            return;
        }

        const btn = document.getElementById('btnHkRegSubmit');
        btn.disabled = true;
        btn.textContent = 'Đang tạo tài khoản...';

        try {
            await api.post(CONFIG.ENDPOINTS.AUTH.REGISTER, { accountname, gmail, password });
            pendingOtpEmail = gmail;
            sessionStorage.setItem('pendingVerifyGmail', gmail);
            api.post(`${CONFIG.ENDPOINTS.AUTH.SEND_OTP}?gmail=${encodeURIComponent(gmail)}`).catch(() => {});
            document.getElementById('hkOtpDesc').innerHTML = `Mã xác thực đã được gửi tới <b>${gmail}</b>.`;
            toast.success('Đăng ký thành công! Vui lòng nhập mã OTP gửi về email.');
            setMode('otp');
        } catch (err) {
            toast.error(err.message || 'Không thể đăng ký tài khoản.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Đăng ký tài khoản';
        }
    });

    // Submit OTP
    document.getElementById('hkModalOtpForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('hkOtpCode').value.trim();
        const btn = document.getElementById('btnHkOtpSubmit');
        btn.disabled = true;
        btn.textContent = 'Đang xác thực...';
        try {
            await api.post(`${CONFIG.ENDPOINTS.AUTH.CHECK_OTP}?gmail=${encodeURIComponent(pendingOtpEmail)}&code=${encodeURIComponent(code)}`);
            toast.success('Xác thực thành công! Hãy đăng nhập để nhận ưu đãi & mua hàng.');
            document.getElementById('hkLoginEmail').value = pendingOtpEmail;
            document.getElementById('hkLoginPass').value = '';
            setMode('login');
        } catch (err) {
            toast.error(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Xác nhận & Hoàn tất';
        }
    });

    document.getElementById('btnHkResendOtp')?.addEventListener('click', async () => {
        if (!pendingOtpEmail) return;
        try {
            await api.post(`${CONFIG.ENDPOINTS.AUTH.SEND_OTP}?gmail=${encodeURIComponent(pendingOtpEmail)}`);
            toast.info('Đã gửi lại mã OTP mới.');
        } catch (err) {
            toast.error(err.message || 'Không thể gửi lại mã OTP.');
        }
    });

    window.openHkAuthModal = (mode = 'login') => {
        setMode(mode);
        modal.classList.add('active');
    };
}

export const auth = {
    async login(gmail, password) {
        const response = await api.post(CONFIG.ENDPOINTS.AUTH.LOGIN, { gmail, password });

        if (response) {
            sessionStorage.setItem('accountInfo', JSON.stringify(response));
        }

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

    async register(accountData) {
        return await api.post(CONFIG.ENDPOINTS.AUTH.REGISTER, accountData);
    },

    async logout() {
        const wasAdminPage = isAdminPortalPage();
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
                window.location.href = wasAdminPage ? CONFIG.ROUTES.ADMIN_LOGIN : CONFIG.ROUTES.HOME;
            }, 500);
        }
    },

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

    openAuthModal(mode = 'login') {
        mountCustomerAuthModal();
        window.openHkAuthModal?.(mode);
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            toast.warning('Vui lòng đăng nhập để tiếp tục.');
            this.openAuthModal('login');
            return false;
        }
        return true;
    },

    requireAdmin(redirectUrl = CONFIG.ROUTES.ADMIN_LOGIN) {
        if (!this.isAuthenticated() || !this.isAdmin()) {
            toast.error('Truy cập bị từ chối: Yêu cầu đăng nhập tại cổng Quản trị viên.');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 700);
            return false;
        }
        return true;
    },

    initHeaderNav() {
        mountCustomerAuthModal();
        const user = this.getUser();
        const authNavArea = document.getElementById('authNavArea');
        const guestCartBtn = document.getElementById('headerCartBtn');
        if (!authNavArea) return;

        const cartCount = parseInt(localStorage.getItem('cartCount') || '0');
        const onAdminPage = isAdminPortalPage();

        // On customer storefront, treat ADMIN session as separated (do not expose Admin panel link in customer UI)
        if (user && (onAdminPage || !this.isAdmin())) {
            if (guestCartBtn) guestCartBtn.style.display = 'inline-flex';

            const displayName = user.accountname || user.gmail || 'Tài khoản';
            const initial = displayName[0].toUpperCase();

            authNavArea.innerHTML = `
                <div class="user-menu-wrapper" id="accountMenuWrapper">
                    <button type="button" class="account-bar-btn" id="accountBarBtn" aria-expanded="false" aria-haspopup="true">
                        <span class="user-avatar-initial">${initial}</span>
                        <span class="account-name-text" style="max-width: 110px; overflow: hidden; text-overflow: ellipsis;">${displayName}</span>
                        <span style="font-size: 10px; color: var(--text-muted);">▾</span>
                    </button>
                    <div class="user-dropdown-menu" id="accountDropdownMenu">
                        <div class="dropdown-user-header">
                            <div style="font-size: var(--text-xs); font-weight: 700; color: var(--text-primary);">${displayName}</div>
                            <div style="font-size: 11px; color: var(--text-secondary); word-break: break-all;">${user.gmail || ''}</div>
                        </div>
                        ${onAdminPage ? `
                            <a href="${CONFIG.ROUTES.ADMIN_DASHBOARD}" class="dropdown-item">
                                <span>Bảng điều khiển Admin</span>
                            </a>
                        ` : `
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
                            <a href="index.html#repair-center" class="dropdown-item">
                                <span>Đặt lịch sửa chữa</span>
                            </a>
                            <a href="setpassword.html" class="dropdown-item">
                                <span>Đổi mật khẩu</span>
                            </a>
                        `}
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
            if (guestCartBtn) guestCartBtn.style.display = 'inline-flex';
            authNavArea.innerHTML = `
                <button type="button" id="btnHeaderLoginTrigger" class="guest-login-trigger" aria-label="Đăng nhập hoặc đăng ký tài khoản">
                    <span class="guest-avatar-circle" aria-hidden="true">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="8" r="4.2"></circle>
                            <path d="M4.5 20.5c.8-4.2 3.8-6.5 7.5-6.5s6.7 2.3 7.5 6.5z"></path>
                        </svg>
                    </span>
                    <span class="guest-login-text">
                        <span class="guest-hello-line">Xin chào,</span>
                        <span class="guest-action-line">Đăng nhập</span>
                    </span>
                </button>
            `;

            document.getElementById('btnHeaderLoginTrigger')?.addEventListener('click', () => {
                if (onAdminPage) {
                    window.location.href = CONFIG.ROUTES.ADMIN_LOGIN;
                } else {
                    this.openAuthModal('login');
                }
            });
        }
    }
};
