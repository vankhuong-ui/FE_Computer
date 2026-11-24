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

        // Insert top utility bar right above the sticky header once
        if (!document.getElementById('hkTopUtilityBar')) {
            const topBar = document.createElement('div');
            topBar.id = 'hkTopUtilityBar';
            topBar.className = 'top-utility-bar';
            topBar.innerHTML = `
                <div class="container top-utility-inner">
                    <div class="utility-group">
                        <span class="utility-item">
                            <span class="utility-dot"></span>
                            <a href="index.html#repair-center">Hệ thống 10 chi nhánh toàn quốc · Mở cửa: ${CONFIG.OPEN_HOURS}</a>
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
        headerHost.innerHTML = `
            <div class="container header-inner">
                <a href="index.html" class="brand-logo" aria-label="HK COMPUTER">
                    <span class="brand-chip-icon">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                    </span>
                    <span class="brand-text-col">
                        <span class="brand-title-line">HK COMPUTER</span>
                        <span class="brand-sub-line">Chính hãng &amp; Kỹ thuật</span>
                    </span>
                </a>

                <form id="headerSearchForm" class="header-search-form" role="search">
                    <span class="header-search-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </span>
                    <input type="search" id="headerSearchInput" class="header-search-input" placeholder="Tìm laptop, PC, linh kiện, mã máy..." value="${initialQ.replace(/"/g, '&quot;')}" />
                    <span class="header-search-kbd">Ctrl+K</span>
                </form>

                <nav aria-label="Điều hướng chính">
                    <ul class="nav-links">
                        <li><a href="index.html#catalog" class="nav-link ${activeNav === 'home' ? 'active' : ''}">Sản phẩm</a></li>
                        <li><a href="index.html#repair-center" class="nav-link ${activeNav === 'repair' ? 'active' : ''}">Sửa chữa</a></li>
                        <li><a href="warranty.html" class="nav-link ${activeNav === 'warranty' ? 'active' : ''}">Bảo hành</a></li>
                        <li><a href="support.html" class="nav-link ${activeNav === 'support' ? 'active' : ''}">Hỗ trợ</a></li>
                    </ul>
                </nav>

                <div class="header-actions">
                    <button type="button" id="btnHeaderQuickRepair" class="btn btn-accent btn-sm" style="height: 38px; border-radius: 10px; font-weight: 600;">
                        Đặt lịch sửa chữa
                    </button>

                    <button type="button" class="theme-toggle-btn" style="width: 38px; height: 38px; border-radius: 10px;" data-theme-toggle aria-label="Chuyển giao diện Sáng/Tối"></button>

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

        // Global Ctrl+K shortcut to focus header search input
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                document.getElementById('headerSearchInput')?.focus();
            }
        });

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
                            <span class="brand-chip-icon" style="width: 30px; height: 30px; border-radius: 8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>
                            </span>
                            <span class="brand-title-line" style="font-size: 1rem;">HK COMPUTER</span>
                        </a>
                        <p style="font-size: var(--text-xs); margin-bottom: 8px;">
                            Trung tâm dịch vụ bảo hành, sửa chữa phần cứng và phân phối Laptop &amp; PC chính hãng trên toàn quốc.
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
                            <li><a href="support.html">Gửi yêu cầu tư vấn kỹ thuật</a></li>
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

    mountQuickRepairModal();
    document.getElementById('btnHeaderQuickRepair')?.addEventListener('click', () => {
        document.getElementById('hkQuickRepairModal')?.classList.add('active');
    });

    theme.init();
    auth.initHeaderNav();
    cart.updateHeaderBadge();
}
