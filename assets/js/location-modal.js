/**
 * location-modal.js - Header Location Pill & Multi-Branch Stock Selector Modal
 */

import { CONFIG } from './config.js';
import { getCachedBranches, loadActiveBranches } from './branch-store.js';
import { toast } from './toast.js';

export function updateHeaderLocationPillLabel() {
    const loc = CONFIG.getSelectedLocation();
    const el = document.getElementById('headerLocationLabel');
    if (el) {
        el.textContent = loc.label || 'Toàn quốc';
    }
}

export function mountLocationModal() {
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
        const liveBranches = getCachedBranches();
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
        await loadActiveBranches();
        renderLocationChoices();
    };
}
