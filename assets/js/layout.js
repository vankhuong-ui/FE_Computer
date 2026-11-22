/**
 * layout.js - Shared Minimalist Header, Footer & Quick Repair Booking Modal for HK COMPUTER
 * - Text-only "HK COMPUTER" branding
 * - Quick "Đặt lịch sửa chữa" button + Modal accessible on every page
 * - Icon-only Cart button when guest; unified Account Bar dropdown when logged in
 * - Persistent Light/Dark Mode toggle
 */

import { api } from './api.js';
import { theme } from './theme.js';
import { auth } from './auth.js';
import { cart } from './cart.js';
import { CONFIG } from './config.js';
import { toast } from './toast.js';

function mountQuickRepairModal() {
    if (document.getElementById('hkQuickRepairModal')) return;

    const modalEl = document.createElement('div');
    modalEl.id = 'hkQuickRepairModal';
    modalEl.className = 'hk-modal-backdrop';
    modalEl.innerHTML = `
        <div class="hk-modal-box">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div>
                    <h3 style="font-size: var(--text-lg); margin-bottom: 2px;">Đặt lịch sửa chữa nhanh</h3>
                    <p style="font-size: var(--text-xs);">Chọn chi nhánh gần nhất trong 10 cơ sở HK COMPUTER</p>
                </div>
                <button type="button" id="btnCloseQuickRepair" style="background:none; border:none; font-size:22px; cursor:pointer; color:var(--text-secondary);">×</button>
            </div>

            <form id="quickRepairForm">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrName">Họ và tên *</label>
                        <input type="text" id="qrName" class="input" placeholder="Nguyễn Văn A" required />
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrPhone">Số điện thoại *</label>
                        <input type="tel" id="qrPhone" class="input tabular-nums" placeholder="09xxxxxxxx" required />
                    </div>
                </div>

                <div class="form-group" style="margin-bottom:12px;">
                    <label class="form-label" for="qrBranch">Chi nhánh tiếp nhận *</label>
                    <select id="qrBranch" class="select" required>
                        ${CONFIG.BRANCHES.map(b => `<option value="${b.name} — ${b.address}">${b.name} (${b.city})</option>`).join('')}
                    </select>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrDevice">Tên máy / Model *</label>
                        <input type="text" id="qrDevice" class="input" placeholder="VD: Dell XPS / MacBook" required />
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrService">Dịch vụ *</label>
                        <select id="qrService" class="select" required>
                            <option value="Vệ sinh máy & Tra keo tản nhiệt">Vệ sinh &amp; Tra keo tản nhiệt</option>
                            <option value="Nâng cấp RAM / Ổ cứng SSD">Nâng cấp RAM / SSD</option>
                            <option value="Sửa chữa phần cứng / Nguồn / Mainboard">Sửa phần cứng / Nguồn</option>
                            <option value="Thay Pin / Màn hình / Bàn phím">Thay Pin / Màn hình / Phím</option>
                            <option value="Cài đặt Windows / Phần mềm">Cài đặt Windows / Phần mềm</option>
                        </select>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrDate">Ngày hẹn *</label>
                        <input type="date" id="qrDate" class="input tabular-nums" required />
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrTime">Khung giờ *</label>
                        <select id="qrTime" class="select" required>
                            <option value="08:30 - 10:00">08:30 - 10:00</option>
                            <option value="10:00 - 11:30">10:00 - 11:30</option>
                            <option value="13:30 - 15:30">13:30 - 15:30</option>
                            <option value="15:30 - 17:30">15:30 - 17:30</option>
                            <option value="17:30 - 20:00">17:30 - 20:00</option>
                        </select>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom:14px;">
                    <label class="form-label" for="qrIssue">Mô tả lỗi (Tùy chọn)</label>
                    <textarea id="qrIssue" class="textarea" rows="2" placeholder="VD: Máy nóng nhanh, không lên nguồn..."></textarea>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button type="button" id="btnCancelQuickRepair" class="btn btn-secondary btn-sm">Đóng</button>
                    <button type="submit" id="btnSubmitQuickRepair" class="btn btn-accent btn-sm">Xác nhận đặt lịch</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modalEl);

    const todayStr = new Date().toISOString().split('T')[0];
    const dateEl = document.getElementById('qrDate');
    dateEl.min = todayStr;
    dateEl.value = todayStr;

    const user = auth.getUser();
    if (user?.accountname) {
        document.getElementById('qrName').value = user.accountname;
    }

    const close = () => modalEl.classList.remove('active');
    document.getElementById('btnCloseQuickRepair').addEventListener('click', close);
    document.getElementById('btnCancelQuickRepair').addEventListener('click', close);
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl) close(); });

    document.getElementById('quickRepairForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSubmitQuickRepair');
        btn.disabled = true;
        btn.textContent = 'Đang gửi...';
        try {
            const u = auth.getUser();
            const saved = await api.post(CONFIG.ENDPOINTS.REPAIRS.CREATE, {
                customerName: document.getElementById('qrName').value.trim(),
                customerPhone: document.getElementById('qrPhone').value.trim(),
                customerEmail: u?.gmail || null,
                branchName: document.getElementById('qrBranch').value,
                deviceModel: document.getElementById('qrDevice').value.trim(),
                serviceType: document.getElementById('qrService').value,
                appointmentDate: document.getElementById('qrDate').value,
                appointmentTime: document.getElementById('qrTime').value,
                issueDescription: document.getElementById('qrIssue').value.trim()
            });
            toast.success(`Đặt lịch sửa chữa thành công! Mã lịch hẹn #${saved.id}`);
            document.getElementById('quickRepairForm').reset();
            dateEl.value = todayStr;
            close();
        } catch (err) {
            toast.error(err.message || 'Không thể đặt lịch sửa chữa.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Xác nhận đặt lịch';
        }
    });
}

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
                        <li><a href="index.html#repair-center" class="nav-link ${activeNav === 'repair' ? 'active' : ''}">10 Cửa hàng</a></li>
                        <li><a href="warranty.html" class="nav-link ${activeNav === 'warranty' ? 'active' : ''}">Bảo hành</a></li>
                        <li><a href="support.html" class="nav-link ${activeNav === 'support' ? 'active' : ''}">Hỗ trợ</a></li>
                    </ul>
                </nav>

                <div class="header-actions">
                    <button type="button" id="btnHeaderQuickRepair" class="btn btn-accent btn-sm">
                        Đặt lịch sửa chữa
                    </button>

                    <button type="button" class="theme-toggle-btn" data-theme-toggle aria-label="Chuyển giao diện Sáng/Tối" title="Chuyển giao diện Sáng/Tối">🌙</button>

                    <a href="cart.html" class="cart-icon-btn" id="headerCartBtn" aria-label="Giỏ hàng" title="Giỏ hàng">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        <span class="cart-icon-badge" id="cartBadgeCount">0</span>
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
                            Hệ thống bán lẻ Laptop, PC &amp; Trung tâm Sửa chữa — Bảo hành điện tử chính hãng với ${CONFIG.BRANCHES.length} chi nhánh trên toàn quốc.
                        </p>
                        <div class="tabular-nums" style="font-size: var(--text-xs); color: var(--text-secondary);">
                            Giờ mở cửa: ${CONFIG.OPEN_HOURS}
                        </div>
                    </div>

                    <div>
                        <div class="footer-title">Dịch vụ &amp; Trải nghiệm</div>
                        <ul class="footer-links">
                            <li><a href="index.html#repair-center">Hệ thống ${CONFIG.BRANCHES.length} chi nhánh &amp; Đặt lịch sửa chữa</a></li>
                            <li><a href="warranty.html">Tra cứu bảo hành điện tử (1 đổi 1)</a></li>
                            <li><a href="order.html">Tra cứu &amp; Thanh toán đơn hàng</a></li>
                            <li><a href="profile.html">Quản lý tài khoản &amp; Sổ địa chỉ</a></li>
                        </ul>
                    </div>

                    <div>
                        <div class="footer-title">Tổng đài &amp; Thanh toán</div>
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

    mountQuickRepairModal();
    document.getElementById('btnHeaderQuickRepair')?.addEventListener('click', () => {
        document.getElementById('hkQuickRepairModal')?.classList.add('active');
    });

    theme.init();
    auth.initHeaderNav();
    cart.updateHeaderBadge();
}
