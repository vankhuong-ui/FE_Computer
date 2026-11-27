/**
 * home-repair.js - Store Branch Directory & Repair Booking Center (#repair-center)
 */

import { api } from './api.js';
import { auth } from './auth.js?v=10';
import { CONFIG } from './config.js';
import { getCachedBranches } from './branch-store.js';
import { toast } from './toast.js';
import { escapeHtml } from './utils.js';

let selectedCity = CONFIG.BRANCHES[0]?.city || 'Hà Nội';
let currentBranches = getCachedBranches();

export function syncHomeRepairBranches(branches) {
    if (Array.isArray(branches) && branches.length > 0) {
        currentBranches = branches;
        if (!currentBranches.some(b => b.city === selectedCity)) {
            selectedCity = currentBranches[0].city;
        }
    }
    renderHomeBranches();
    populateRepairBranchSelect();
}

export function renderHomeBranches() {
    const cityFilterTabs = document.getElementById('cityFilterTabs');
    const branchListEl = document.getElementById('branchList');
    const repairBranchSelect = document.getElementById('repairBranch');
    if (!cityFilterTabs || !branchListEl) return;

    const cities = [...new Set(currentBranches.map(b => b.city).filter(Boolean))];

    cityFilterTabs.innerHTML = cities.map(city =>
        `<button type="button" class="city-tab ${city === selectedCity ? 'active' : ''}" data-city="${escapeHtml(city)}">${escapeHtml(city)}</button>`
    ).join('');

    cityFilterTabs.querySelectorAll('.city-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCity = btn.dataset.city;
            renderHomeBranches();
        });
    });

    const filtered = currentBranches.filter(b => b.city === selectedCity);

    branchListEl.innerHTML = filtered.map(b => {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;
        const hours = b.openingHours || b.hours || '8:00 - 21:00';
        return `
            <div class="store-card">
                <div class="store-card-head">
                    <div style="font-weight: 700; font-size: var(--text-sm); color: var(--text-primary);">${escapeHtml(b.name)}</div>
                    <span class="badge badge-success">Đang mở cửa</span>
                </div>
                <div class="store-meta-list">
                    <div class="store-meta-line">
                        <span>${escapeHtml(b.address)}</span>
                    </div>
                    <div class="store-meta-line tabular-nums">
                        <span>${escapeHtml(hours)} · ${escapeHtml(b.phone || CONFIG.HOTLINE)} · ${escapeHtml(b.services || 'Bán hàng · Sửa chữa · Bảo hành')}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    <a href="${mapUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Chỉ đường</a>
                    <button type="button" class="btn btn-sm btn-filter-by-branch" style="border: 1px solid #288AD6; color: #288AD6; background: rgba(40,138,214,0.06); font-weight: 600;"
                        data-branch-id="${b.id}"
                        data-branch-city="${escapeHtml(b.city)}"
                        data-branch-name="${escapeHtml(b.name || '')}">
                        Xem kho cơ sở này
                    </button>
                    <button type="button" class="btn btn-sm btn-pick-branch" style="background: var(--brand-green-soft); color: var(--brand-green); font-weight: 600;" data-branch="${escapeHtml(b.name)}">
                        Đặt lịch sửa tại đây
                    </button>
                </div>
            </div>
        `;
    }).join('');

    branchListEl.querySelectorAll('.btn-filter-by-branch').forEach(btn => {
        btn.addEventListener('click', () => {
            const branchId = Number(btn.dataset.branchId);
            const city = btn.dataset.branchCity;
            const branchName = btn.dataset.branchName;
            const shortName = branchName.replace('HK COMPUTER - ', '');
            CONFIG.setSelectedLocation({ city, branchId, branchName, label: `${city} · ${shortName}` });
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
        });
    });

    branchListEl.querySelectorAll('.btn-pick-branch').forEach(btn => {
        btn.addEventListener('click', () => {
            const storeRadio = document.querySelector('input[name="repairMethod"][value="AT_STORE"]');
            if (storeRadio) {
                storeRadio.checked = true;
                storeRadio.dispatchEvent(new Event('change'));
            }
            if (repairBranchSelect) repairBranchSelect.value = btn.dataset.branch;
            toast.info('Đã chọn chi nhánh tiếp nhận.');
            document.getElementById('repairName')?.focus();
        });
    });
}

function populateRepairBranchSelect() {
    const repairBranchSelect = document.getElementById('repairBranch');
    if (!repairBranchSelect) return;
    repairBranchSelect.innerHTML = currentBranches.map(b =>
        `<option value="${escapeHtml(b.name)}">${escapeHtml(b.name)} (${escapeHtml(b.city)})</option>`
    ).join('');
}

export function initHomeRepairCenter() {
    renderHomeBranches();
    populateRepairBranchSelect();

    const repairBranchSelect = document.getElementById('repairBranch');
    const repairBranchGroup = document.getElementById('repairBranchGroup');
    const repairHomeAddrGroup = document.getElementById('repairHomeAddrGroup');
    const repairHomeAddress = document.getElementById('repairHomeAddress');
    const repairForm = document.getElementById('repairBookingForm');
    const bookingReceipt = document.getElementById('bookingReceipt');

    document.querySelectorAll('input[name="repairMethod"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const isHome = radio.value === 'AT_HOME';
            if (repairBranchGroup) repairBranchGroup.style.display = isHome ? 'none' : 'flex';
            if (repairHomeAddrGroup) repairHomeAddrGroup.style.display = isHome ? 'flex' : 'none';
            if (repairHomeAddress) repairHomeAddress.required = isHome;

            document.querySelectorAll('[data-method-label]').forEach(lbl => {
                lbl.classList.toggle('active', lbl.dataset.methodLabel === radio.value);
            });
        });
    });

    const serviceSelect = document.getElementById('repairService');
    document.querySelectorAll('[data-pick-service]').forEach(card => {
        card.addEventListener('click', () => {
            const val = card.dataset.pickService;
            if (serviceSelect) serviceSelect.value = val;

            document.querySelectorAll('[data-pick-service]').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            toast.info(`Đã chọn dịch vụ: ${val}`);
            document.getElementById('repairName')?.focus();
        });
    });

    const dateInput = document.getElementById('repairDate');
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateInput) {
        dateInput.min = todayStr;
        dateInput.value = todayStr;
    }

    const user = auth.getUser();
    if (user?.accountname && document.getElementById('repairName')) {
        document.getElementById('repairName').value = user.accountname;
    }

    repairForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const method = document.querySelector('input[name="repairMethod"]:checked')?.value || 'AT_STORE';
        const name = document.getElementById('repairName').value.trim();
        const phone = document.getElementById('repairPhone').value.trim();
        const branch = repairBranchSelect?.value || '';
        const homeAddr = repairHomeAddress?.value.trim() || '';
        const device = document.getElementById('repairDevice').value.trim();
        const service = document.getElementById('repairService').value;
        const date = document.getElementById('repairDate').value;
        const time = document.getElementById('repairTime').value;
        const issue = document.getElementById('repairIssue').value.trim();

        if (!name || !phone || !device || !date) {
            toast.warning('Vui lòng điền đầy đủ thông tin lịch hẹn.');
            return;
        }
        if (method === 'AT_HOME' && !homeAddr) {
            toast.warning('Vui lòng nhập địa chỉ sửa tại nhà.');
            return;
        }

        const btnSubmit = document.getElementById('btnSubmitRepair');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Đang gửi...';
        }

        const curUser = auth.getUser();
        const payload = {
            customerName: name,
            customerPhone: phone,
            customerEmail: curUser?.gmail || null,
            serviceMethod: method,
            branchName: method === 'AT_STORE' ? branch : '',
            homeAddress: method === 'AT_HOME' ? homeAddr : null,
            deviceModel: device,
            serviceType: service,
            appointmentDate: date,
            appointmentTime: time,
            issueDescription: issue
        };

        try {
            const saved = await api.post(CONFIG.ENDPOINTS.REPAIRS.CREATE, payload);
            const code = `SC-${saved.id}`;
            const locationText = method === 'AT_HOME'
                ? `Tại nhà (${saved.homeAddress || homeAddr})`
                : `Cửa hàng (${saved.branchName || branch})`;

            if (bookingReceipt) {
                bookingReceipt.style.display = 'block';
                bookingReceipt.innerHTML = `
                    <div style="font-weight: 700; color: var(--brand-green); margin-bottom: 6px; font-size: var(--text-sm);">
                        ✓ ĐẶT LỊCH THÀNH CÔNG — MÃ PHIẾU: <span class="tabular-nums">#${escapeHtml(code)}</span>
                    </div>
                    <div style="color: var(--text-primary); line-height: 1.65; font-size: var(--text-xs);">
                        <div>• Khách hàng: <b>${escapeHtml(saved.customerName)}</b> (<span class="tabular-nums">${escapeHtml(saved.customerPhone)}</span>)</div>
                        <div>• Hình thức: <b>${escapeHtml(locationText)}</b></div>
                        <div>• Thiết bị &amp; Dịch vụ: <b>${escapeHtml(saved.deviceModel)}</b> — ${escapeHtml(saved.serviceType)}</div>
                        <div>• Thời gian hẹn: <b class="tabular-nums">${escapeHtml(saved.appointmentTime)} ngày ${escapeHtml(saved.appointmentDate)}</b></div>
                    </div>
                `;
            }

            toast.success(`Đã xác nhận lịch hẹn sửa chữa #${code}!`);
            repairForm.reset();
            if (dateInput) dateInput.value = todayStr;
            if (curUser?.accountname) document.getElementById('repairName').value = curUser.accountname;
        } catch (err) {
            toast.error(err.message || 'Không thể đặt lịch sửa chữa.');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Xác nhận đặt lịch sửa chữa';
            }
        }
    });
}
