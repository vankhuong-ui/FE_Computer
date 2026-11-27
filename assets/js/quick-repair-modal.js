/**
 * quick-repair-modal.js - Header & Mobile Quick Repair Booking Modal (AT_STORE / AT_HOME)
 */

import { api } from './api.js';
import { auth } from './auth.js?v=10';
import { CONFIG } from './config.js';
import { getCachedBranches, loadActiveBranches } from './branch-store.js';
import { toast } from './toast.js';

export function mountQuickRepairModal() {
    if (document.getElementById('hkQuickRepairModal')) return;

    const initialBranches = getCachedBranches();
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
                        ${initialBranches.map(b => `<option value="${b.name}">${b.name} (${b.city})</option>`).join('')}
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

export async function openQuickRepairModal() {
    const branches = await loadActiveBranches();
    const qrBranch = document.getElementById('qrBranch');
    if (qrBranch && branches.length) {
        qrBranch.innerHTML = branches.map(b => `<option value="${b.name}">${b.name} (${b.city})</option>`).join('');
    }
    document.getElementById('hkQuickRepairModal')?.classList.add('active');
}
