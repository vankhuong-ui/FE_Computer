/**
 * layout.js - Shared Header, Location/Branch Selector Modal, Footer & Quick Repair Modal
 * - TGDD-style Header Location Pill ("Xem tồn kho tại: Toàn quốc / Hà Nội · Thái Hà")
 * - Live Branch Directory loaded from GET /api/branches (with fallback to CONFIG.BRANCHES)
 * - Smart Repair Booking Modal: Name + Phone + Service Method (At Store / At Home)
 */

import { api } from './api.js';
import { theme } from './theme.js?v=6';
import { auth } from './auth.js?v=10';
import { cart } from './cart.js?v=7';
import { CONFIG } from './config.js';
import { toast } from './toast.js';

let liveBranches = [...CONFIG.BRANCHES];

async function fetchLiveBranches() {
    try {
        const res = await api.get(CONFIG.ENDPOINTS.BRANCHES.LIST);
        if (Array.isArray(res) && res.length > 0) {
            liveBranches = res;
            CONFIG.BRANCHES = res.map(b => ({
                ...b,
                hours: b.openingHours || b.hours || '8:00 - 21:00'
            }));
        }
    } catch (_) {
        // Fallback to default CONFIG.BRANCHES
    }
    return liveBranches;
}

function updateHeaderLocationPillLabel() {
    const loc = CONFIG.getSelectedLocation();
    const el = document.getElementById('headerLocationLabel');
    if (el) {
        el.textContent = loc.label || 'Toàn quốc';
    }
}

function mountLocationModal() {
    if (document.getElementById('hkLocationModal')) return;

    const modalEl = document.createElement('div');
    modalEl.id = 'hkLocationModal';
    modalEl.className = 'hk-modal-backdrop';
    modalEl.innerHTML = `
        <div class="hk-modal-box" style="max-width: 540px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px;">
                <div>
                    <h3 style="font-size: var(--text-lg); margin: 0 0 4px;">Chọn khu vực &amp; cơ sở xem tồn kho</h3>
                    <p style="font-size: var(--text-xs); margin: 0;">Hệ thống sẽ hiển thị số lượng máy và phụ kiện có sẵn tại cơ sở bạn chọn.</p>
                </div>
                <button type="button" id="btnCloseLocationModal" style="background:none; border:none; font-size:22px; cursor:pointer; color:var(--text-secondary);">×</button>
            </div>

            <div class="loc-city-tabs" id="locModalCityTabs"></div>
            <div class="loc-branch-list" id="locModalBranchList"></div>
        </div>
    `;
    document.body.appendChild(modalEl);

    let activeModalCity = CONFIG.getSelectedLocation().city || '';

    const close = () => modalEl.classList.remove('active');
    document.getElementById('btnCloseLocationModal')?.addEventListener('click', close);
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl) close(); });

    function renderLocationChoices() {
        const curLoc = CONFIG.getSelectedLocation();
        const cities = [...new Set(liveBranches.map(b => b.city).filter(Boolean))];
        const cityTabsEl = document.getElementById('locModalCityTabs');
        const branchListEl = document.getElementById('locModalBranchList');
        if (!cityTabsEl || !branchListEl) return;

        cityTabsEl.innerHTML = `
            <button type="button" class="loc-city-tab ${activeModalCity === '' ? 'active' : ''}" data-loc-city="">
                Toàn quốc (${liveBranches.length} cơ sở)
            </button>
            ${cities.map(c => {
                const count = liveBranches.filter(b => b.city === c).length;
                return `<button type="button" class="loc-city-tab ${activeModalCity === c ? 'active' : ''}" data-loc-city="${c}">${c} (${count})</button>`;
            }).join('')}
        `;

        cityTabsEl.querySelectorAll('[data-loc-city]').forEach(btn => {
            btn.addEventListener('click', () => {
                activeModalCity = btn.dataset.locCity || '';
                renderLocationChoices();
            });
        });

        const filteredBranches = activeModalCity
            ? liveBranches.filter(b => b.city === activeModalCity)
            : liveBranches;

        const nationwideActive = !curLoc.city && !curLoc.branchId;
        const cityWideActive = activeModalCity && curLoc.city === activeModalCity && !curLoc.branchId;

        let html = `
            <button type="button" class="loc-branch-card ${nationwideActive ? 'active' : ''}" data-pick-nationwide="1">
                <div>
                    <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Toàn quốc — Tất cả ${liveBranches.length} cơ sở HK COMPUTER</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Hiển thị tổng tồn kho trên toàn hệ thống và hỗ trợ giao tận nơi toàn quốc</div>
                </div>
                <span class="badge ${nationwideActive ? 'badge-success' : ''}">${nationwideActive ? 'Đang chọn' : 'Chọn'}</span>
            </button>
        `;

        if (activeModalCity) {
            html += `
                <button type="button" class="loc-branch-card ${cityWideActive ? 'active' : ''}" data-pick-city="${activeModalCity}">
                    <div>
                        <div style="font-weight: 700; font-size: 13px; color: var(--text-primary);">Tất cả cơ sở tại ${activeModalCity} (${filteredBranches.length} chi nhánh)</div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">Tổng hợp hàng sẵn có tại các cửa hàng khu vực ${activeModalCity}</div>
                    </div>
                    <span class="badge ${cityWideActive ? 'badge-success' : ''}">${cityWideActive ? 'Đang chọn' : 'Chọn khu vực'}</span>
                </button>
            `;
        }

        html += filteredBranches.map(b => {
            const isSel = Number(curLoc.branchId) === Number(b.id);
            const shortName = (b.name || '').replace('HK COMPUTER - ', '');
            return `
                <button type="button" class="loc-branch-card ${isSel ? 'active' : ''}"
                    data-pick-branch-id="${b.id}"
                    data-pick-branch-city="${b.city || ''}"
                    data-pick-branch-name="${(b.name || '').replace(/"/g, '&quot;')}"
                    data-pick-branch-label="${b.city} · ${shortName}">
                    <div style="min-width: 0; flex: 1;">
                        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                            <span style="font-weight: 700; font-size: 13px; color: var(--text-primary);">${b.name}</span>
                            <span class="badge badge-info">${b.city}</span>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">${b.address}</div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;" class="tabular-nums">
                            ${b.openingHours || b.hours || '8:00 - 21:00'} · ${b.phone || CONFIG.HOTLINE}
                        </div>
                    </div>
                    <span class="badge ${isSel ? 'badge-success' : ''}" style="flex-shrink:0;">${isSel ? 'Đang chọn' : 'Chọn cơ sở'}</span>
                </button>
            `;
        }).join('');

        branchListEl.innerHTML = html;

        branchListEl.querySelector('[data-pick-nationwide]')?.addEventListener('click', () => {
            CONFIG.setSelectedLocation({ city: '', branchId: null, branchName: '', label: 'Toàn quốc' });
            updateHeaderLocationPillLabel();
            close();
            toast.info('Đã chuyển sang xem tồn kho Toàn quốc.');
        });

        branchListEl.querySelector('[data-pick-city]')?.addEventListener('click', (e) => {
            const city = e.currentTarget.dataset.pickCity;
            CONFIG.setSelectedLocation({ city, branchId: null, branchName: '', label: `${city} (Tất cả)` });
            updateHeaderLocationPillLabel();
            close();
            toast.info(`Đang xem tồn kho tại khu vực ${city}.`);
        });

        branchListEl.querySelectorAll('[data-pick-branch-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const branchId = Number(btn.dataset.pickBranchId);
                const city = btn.dataset.pickBranchCity;
                const branchName = btn.dataset.pickBranchName;
                const label = btn.dataset.pickBranchLabel;
                CONFIG.setSelectedLocation({ city, branchId, branchName, label });
                updateHeaderLocationPillLabel();
                close();
                toast.success(`Đang xem tồn kho tại ${branchName}.`);
            });
        });
    }

    window.openHkLocationModal = async () => {
        activeModalCity = CONFIG.getSelectedLocation().city || '';
        modalEl.classList.add('active');
        await fetchLiveBranches();
        renderLocationChoices();
    };
}

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
                <div class="qr-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
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
                        ${liveBranches.map(b => `<option value="${b.name} — ${b.address}">${b.name} (${b.city})</option>`).join('')}
                    </select>
                </div>

                <div class="form-group" id="qrHomeAddrGroup" style="margin-bottom:12px; display:none;">
                    <label class="form-label" for="qrHomeAddress">Địa chỉ sửa tại nhà</label>
                    <input type="text" id="qrHomeAddress" class="input" />
                </div>

                <div class="qr-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
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

                <div class="qr-grid-2" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
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

        if (!document.getElementById('hkTopUtilityBar')) {
            const topBar = document.createElement('div');
            topBar.id = 'hkTopUtilityBar';
            topBar.className = 'top-utility-bar';
            topBar.innerHTML = `
                <div class="container top-utility-inner">
                    <div class="utility-group">
                        <span class="utility-item">
                            <span class="utility-dot"></span>
                            <a href="index.html#repair-center">Hệ thống chi nhánh toàn quốc · Mở cửa: ${CONFIG.OPEN_HOURS}</a>
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
                            Hệ thống phân phối Laptop, PC, Phụ kiện chính hãng và Trung tâm dịch vụ bảo hành, sửa chữa lấy liền trong ngày.
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

    mountLocationModal();
    mountQuickRepairModal();
    mountMobileBottomNav(activeNav);

    document.getElementById('btnHeaderLocation')?.addEventListener('click', () => {
        window.openHkLocationModal?.();
    });

    window.addEventListener('hk:location-changed', () => {
        updateHeaderLocationPillLabel();
    });

    const openQuickRepair = async () => {
        await fetchLiveBranches();
        const qrBranch = document.getElementById('qrBranch');
        if (qrBranch && liveBranches.length) {
            qrBranch.innerHTML = liveBranches.map(b => `<option value="${b.name} — ${b.address}">${b.name} (${b.city})</option>`).join('');
        }
        document.getElementById('hkQuickRepairModal')?.classList.add('active');
    };

    document.getElementById('btnHeaderQuickRepair')?.addEventListener('click', openQuickRepair);
    document.getElementById('btnMobileQuickRepair')?.addEventListener('click', openQuickRepair);

    fetchLiveBranches();
    theme.init();
    auth.initHeaderNav();
    cart.updateHeaderBadge();
    syncMobileCartBadge();
}

function syncMobileCartBadge() {
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

function mountMobileBottomNav(activeNav = '') {
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
