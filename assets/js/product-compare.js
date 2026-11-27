/**
 * product-compare.js - Side-by-Side Laptop & PC Spec Comparison Bar & Modal
 */

import { formatVnd, escapeHtml } from './utils.js';
import { toast } from './toast.js';

export function splitCompareSpecs(rawSpecs) {
    return String(rawSpecs || '')
        .split(/[|;\n]+/)
        .map(s => s.trim())
        .filter(Boolean);
}

export function createProductComparator({ getProductById, onChange } = {}) {
    let compareList = [];

    function isSelected(productId) {
        return compareList.some(item => Number(item.id) === Number(productId));
    }

    function getList() {
        return [...compareList];
    }

    function toggle(productId) {
        const existingIdx = compareList.findIndex(item => Number(item.id) === Number(productId));
        if (existingIdx >= 0) {
            compareList.splice(existingIdx, 1);
        } else {
            if (compareList.length >= 3) {
                toast.warning('Chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc.');
                return compareList;
            }
            const prod = getProductById?.(Number(productId));
            if (!prod) return compareList;
            compareList.push(prod);
        }
        onChange?.(compareList);
        renderFloatingBar();
        return compareList;
    }

    function clear() {
        compareList = [];
        onChange?.(compareList);
        renderFloatingBar();
    }

    function renderFloatingBar() {
        if (typeof document === 'undefined') return;

        let bar = document.getElementById('hkCompareFloatingBar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'hkCompareFloatingBar';
            bar.className = 'compare-floating-bar';
            document.body.appendChild(bar);
        }

        if (!compareList.length) {
            bar.classList.remove('active');
            bar.innerHTML = '';
            return;
        }

        bar.classList.add('active');
        bar.innerHTML = `
            <div class="compare-slots">
                ${compareList.map(item => `
                    <div class="compare-slot">
                        <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" />
                        <span class="compare-slot-name">${escapeHtml(item.name)}</span>
                        <button type="button" class="compare-slot-remove" data-remove-compare="${item.id}" aria-label="Bỏ chọn">×</button>
                    </div>
                `).join('')}
            </div>
            <div style="display:flex; align-items:center; gap:8px; justify-content:flex-end; flex-shrink:0;">
                <button type="button" id="btnClearCompare" class="btn btn-outline btn-sm">Xóa hết</button>
                <button type="button" id="btnOpenCompareModal" class="btn btn-primary btn-sm" ${compareList.length < 2 ? 'disabled' : ''}>
                    So sánh ngay (${compareList.length}/3)
                </button>
            </div>
        `;

        bar.querySelectorAll('[data-remove-compare]').forEach(btn => {
            btn.addEventListener('click', () => toggle(Number(btn.dataset.removeCompare)));
        });
        document.getElementById('btnClearCompare')?.addEventListener('click', clear);
        document.getElementById('btnOpenCompareModal')?.addEventListener('click', openModal);
    }

    function openModal() {
        if (compareList.length < 2) {
            toast.info('Vui lòng chọn ít nhất 2 sản phẩm để so sánh.');
            return;
        }

        let modal = document.getElementById('hkCompareModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'hkCompareModal';
            modal.className = 'hk-modal-backdrop';
            document.body.appendChild(modal);
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
        }

        const parsedCols = compareList.map(p => ({ ...p, specLines: splitCompareSpecs(p.specs) }));
        const maxSpecRows = Math.max(3, ...parsedCols.map(c => c.specLines.length));

        modal.innerHTML = `
            <div class="hk-modal-box" style="max-width: 880px;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px;">
                    <div>
                        <h3 style="font-size: var(--text-lg); margin: 0 0 2px;">So sánh chi tiết cấu hình &amp; giá bán</h3>
                        <p style="font-size: 12px; color: var(--text-secondary); margin: 0;">Đặt cạnh nhau ${parsedCols.length} sản phẩm tại HK COMPUTER</p>
                    </div>
                    <button type="button" id="btnCloseCompareModal" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text-secondary);">×</button>
                </div>
                <div class="compare-table-wrap">
                    <table class="compare-table">
                        <tbody>
                            <tr>
                                <th>Sản phẩm</th>
                                ${parsedCols.map(c => `
                                    <td>
                                        <div style="display:flex; flex-direction:column; gap:8px;">
                                            <img src="${escapeHtml(c.img)}" alt="${escapeHtml(c.name)}" style="width:100%; height:110px; object-fit:contain; background:#fff; border-radius:6px;" />
                                            <a href="detailproductuser.html?id=${c.id}" style="font-weight:700; color:var(--text-primary); line-height:1.35;">${escapeHtml(c.name)}</a>
                                        </div>
                                    </td>
                                `).join('')}
                            </tr>
                            <tr>
                                <th>Giá ưu đãi</th>
                                ${parsedCols.map(c => `<td class="tabular-nums" style="font-size:15px; font-weight:800; color:#D0021C;">${formatVnd(c.price)}</td>`).join('')}
                            </tr>
                            <tr>
                                <th>Thương hiệu &amp; Loại</th>
                                ${parsedCols.map(c => `<td><strong>${escapeHtml(c.brandName)}</strong> · ${escapeHtml(c.catName)}</td>`).join('')}
                            </tr>
                            <tr>
                                <th>Tồn kho hệ thống</th>
                                ${parsedCols.map(c => `<td><span class="badge badge-success">${escapeHtml(c.stockSummaryLine)}</span></td>`).join('')}
                            </tr>
                            ${Array.from({ length: maxSpecRows }, (_, rIdx) => `
                                <tr>
                                    <th>Thông số #${rIdx + 1}</th>
                                    ${parsedCols.map(c => `<td>${escapeHtml(c.specLines[rIdx] || '—')}</td>`).join('')}
                                </tr>
                            `).join('')}
                            <tr>
                                <th>Chọn mua</th>
                                ${parsedCols.map(c => `
                                    <td>
                                        <a href="detailproductuser.html?id=${c.id}" class="btn btn-primary btn-sm" style="width:100%;">Xem &amp; Mua ngay</a>
                                    </td>
                                `).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        modal.classList.add('active');
        document.getElementById('btnCloseCompareModal')?.addEventListener('click', () => modal.classList.remove('active'));
    }

    return {
        isSelected,
        getList,
        toggle,
        clear,
        openModal
    };
}
