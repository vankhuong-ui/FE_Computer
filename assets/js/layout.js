/**
 * layout.js - Shared Minimalist Header, Footer & Quick Repair Modal for HK COMPUTER
 * - Crisp SVG icons (zero emojis)
 * - No hardcoded branch count
 * - Smart Repair Booking Modal: Name + Phone + Service Method (At Store / At Home)
 */

import { api } from './api.js';
import { theme } from './theme.js?v=6';
import { auth } from './auth.js';
import { cart } from './cart.js?v=7';
import { CONFIG } from './config.js';
import { toast } from './toast.js';

function mountQuickRepairModal() {
    if (document.getElementById('hkQuickRepairModal')) return;

    const modalEl = document.createElement('div');
    modalEl.id = 'hkQuickRepairModal';
    modalEl.className = 'hk-modal-backdrop';
    modalEl.innerHTML = `
        <div class="hk-modal-box">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 12px; margin-bottom:14px;">
                <div>
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom: 4px;">
                        <h3 style="font-size: var(--text-lg); margin: 0;">Đặt lịch sửa chữa nhanh</h3>
                        <span class="badge badge-success">Giảm 20.000đ khi đặt lịch trước</span>
                    </div>
                    <p style="font-size: var(--text-xs);">Chọn mang máy tới cửa hàng hoặc kỹ thuật viên đến tận nhà</p>
                </div>
                <button type="button" id="btnCloseQuickRepair" style="background:none; border:none; font-size:22px; cursor:pointer; color:var(--text-secondary);">×</button>
            </div>

            <form id="quickRepairForm">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrName">Họ và tên</label>
                        <input type="text" id="qrName" class="input" required />
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrPhone">Số điện thoại</label>
                        <input type="tel" id="qrPhone" class="input tabular-nums" required />
                    </div>
                </div>

                <!-- Service Method Toggle -->
                <div class="form-group" style="margin-bottom:12px;">
                    <label class="form-label">Hình thức tiếp nhận</label>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <label class="method-pill active" data-qr-method="AT_STORE" style="display:flex; align-items:center; gap:8px; padding:10px 12px; border:1px solid var(--brand-green); background:var(--brand-green-soft); border-radius:var(--radius-sm); cursor:pointer; font-size:var(--text-xs); font-weight:600;">
                            <input type="radio" name="qrMethod" value="AT_STORE" checked style="accent-color:var(--brand-green);" />
                            <span>Mang tới cửa hàng</span>
                        </label>
                        <label class="method-pill" data-qr-method="AT_HOME" style="display:flex; align-items:center; gap:8px; padding:10px 12px; border:1px solid var(--border); background:var(--surface-subtle); border-radius:var(--radius-sm); cursor:pointer; font-size:var(--text-xs); font-weight:600;">
                            <input type="radio" name="qrMethod" value="AT_HOME" style="accent-color:var(--brand-green);" />
                            <span>Sửa tại nhà / Tận nơi</span>
                        </label>
                    </div>
                </div>

                <div class="form-group" id="qrBranchGroup" style="margin-bottom:12px;">
                    <label class="form-label" for="qrBranch">Chọn cửa hàng gần bạn</label>
                    <select id="qrBranch" class="select">
                        ${CONFIG.BRANCHES.map(b => `<option value="${b.name} — ${b.address}">${b.name} (${b.city})</option>`).join('')}
                    </select>
                </div>

                <div class="form-group" id="qrHomeAddrGroup" style="margin-bottom:12px; display:none;">
                    <label class="form-label" for="qrHomeAddress">Địa chỉ sửa tại nhà</label>
                    <input type="text" id="qrHomeAddress" class="input" />
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrDevice">Dòng máy</label>
                        <input type="text" id="qrDevice" class="input" required />
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrService">Dịch vụ</label>
                        <select id="qrService" class="select" required>
                            <option value="Kiểm tra lỗi tổng quát (Miễn phí)">Kiểm tra lỗi tổng quát — Miễn phí</option>
                            <option value="Vệ sinh & Tra keo tản nhiệt (150.000đ)">Vệ sinh &amp; Tra keo — 150.000đ</option>
                            <option value="Nâng cấp RAM / Ổ cứng SSD">Nâng cấp RAM / SSD — Miễn phí lắp</option>
                            <option value="Cài đặt Windows & Phần mềm (100.000đ)">Cài Windows &amp; Phần mềm — 100.000đ</option>
                            <option value="Thay Pin / Màn hình / Bàn phím">Thay Pin / Màn hình / Bàn phím</option>
                            <option value="Sửa phần cứng / Nguồn / Mainboard">Sửa phần cứng / Nguồn</option>
                        </select>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrDate">Ngày hẹn</label>
                        <input type="date" id="qrDate" class="input tabular-nums" required />
                    </div>
                    <div class="form-group" style="margin-bottom:12px;">
                        <label class="form-label" for="qrTime">Khung giờ</label>
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
                    <label class="form-label" for="qrIssue">Mô tả tình trạng máy (Tùy chọn)</label>
                    <textarea id="qrIssue" class="textarea" rows="2"></textarea>
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
    if (user?.accountname) document.getElementById('qrName').value = user.accountname;

    // Toggle At Store / At Home
    const branchGroup = document.getElementById('qrBranchGroup');
    const homeGroup = document.getElementById('qrHomeAddrGroup');
    const homeInput = document.getElementById('qrHomeAddress');

    modalEl.querySelectorAll('input[name="qrMethod"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const isHome = radio.value === 'AT_HOME';
            branchGroup.style.display = isHome ? 'none' : 'flex';
            homeGroup.style.display = isHome ? 'flex' : 'none';
            homeInput.required = isHome;

            modalEl.querySelectorAll('[data-qr-method]').forEach(lbl => {
                const active = lbl.dataset.qrMethod === radio.value;
                lbl.style.borderColor = active ? 'var(--brand-green)' : 'var(--border)';
                lbl.style.background = active ? 'var(--brand-green-soft)' : 'var(--surface-subtle)';
            });
        });
    });

    const close = () => modalEl.classList.remove('active');
    document.getElementById('btnCloseQuickRepair').addEventListener('click', close);
    document.getElementById('btnCancelQuickRepair').addEventListener('click', close);
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl) close(); });

    document.getElementById('quickRepairForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const method = modalEl.querySelector('input[name="qrMethod"]:checked')?.value || 'AT_STORE';
        const btn = document.getElementById('btnSubmitQuickRepair');
        btn.disabled = true;
        btn.textContent = 'Đang gửi...';

        try {
            const u = auth.getUser();
            const saved = await api.post(CONFIG.ENDPOINTS.REPAIRS.CREATE, {
                customerName: document.getElementById('qrName').value.trim(),
                customerPhone: document.getElementById('qrPhone').value.trim(),
                customerEmail: u?.gmail || null,
                serviceMethod: method,
                branchName: method === 'AT_STORE' ? document.getElementById('qrBranch').value : '',
                homeAddress: method === 'AT_HOME' ? homeInput.value.trim() : null,
                deviceModel: document.getElementById('qrDevice').value.trim(),
                serviceType: document.getElementById('qrService').value,
                appointmentDate: document.getElementById('qrDate').value,
                appointmentTime: document.getElementById('qrTime').value,
                issueDescription: document.getElementById('qrIssue').value.trim()
            });
            toast.success(`Đã tiếp nhận lịch hẹn #${saved.id}.`);
            document.getElementById('quickRepairForm').reset();
            dateEl.value = todayStr;
            branchGroup.style.display = 'flex';
            homeGroup.style.display = 'none';
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
                        <li><a href="index.html#repair-center" class="nav-link ${activeNav === 'repair' ? 'active' : ''}">Cửa hàng</a></li>
                        <li><a href="warranty.html" class="nav-link ${activeNav === 'warranty' ? 'active' : ''}">Bảo hành</a></li>
                        <li><a href="support.html" class="nav-link ${activeNav === 'support' ? 'active' : ''}">Hỗ trợ</a></li>
                    </ul>
                </nav>

                <div class="header-actions">
                    <button type="button" id="btnHeaderQuickRepair" class="btn btn-accent btn-sm">
                        Đặt lịch sửa chữa
                    </button>

                    <button type="button" class="theme-toggle-btn" data-theme-toggle aria-label="Chuyển giao diện Sáng/Tối"></button>

                    <a href="cart.html" class="cart-icon-btn" id="headerCartBtn" aria-label="Giỏ hàng" title="Giỏ hàng">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
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
                            Hệ thống bán lẻ Laptop, PC và trung tâm sửa chữa, bảo hành điện tử chính hãng.
                        </p>
                        <div class="tabular-nums" style="font-size: var(--text-xs); color: var(--text-secondary);">
                            Giờ mở cửa: ${CONFIG.OPEN_HOURS}
                        </div>
                    </div>

                    <div>
                        <div class="footer-title">Dịch vụ &amp; Trải nghiệm</div>
                        <ul class="footer-links">
                            <li><a href="index.html#repair-center">Hệ thống cửa hàng &amp; Đặt lịch sửa chữa</a></li>
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
                    <span>© 2026 HK COMPUTER.</span>
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
