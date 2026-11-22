/**
 * home.js - Modular Homepage Controller for HK COMPUTER
 * Handles: Live Product Catalog, 10-Branch Store Locator, and Repair Appointment Booking (POST /api/repairs)
 */

import { api } from './api.js';
import { auth } from './auth.js';
import { cart } from './cart.js';
import { CONFIG } from './config.js';
import { toast } from './toast.js';
import { initStoreLayout } from './layout.js?v=4';
import './chat-widget.js?v=4';

let currentPage = 0;
const pageSize = 10;
let selectedCategory = '';
let selectedBrand = '';
let searchQuery = '';
let selectedCity = 'Tất cả';

const productsGrid = document.getElementById('productsGrid');
const paginationBar = document.getElementById('paginationBar');
const categoryFilter = document.getElementById('categoryFilter');
const brandFilter = document.getElementById('brandFilter');
const searchInput = document.getElementById('searchInput');
const btnResetFilter = document.getElementById('btnResetFilter');
const catalogStatus = document.getElementById('catalogStatus');

const cityFilterPills = document.getElementById('cityFilterPills');
const branchListEl = document.getElementById('branchList');
const repairBranchSelect = document.getElementById('repairBranch');
const repairForm = document.getElementById('repairBookingForm');
const bookingReceipt = document.getElementById('bookingReceipt');

const formatVnd = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

// ==================== 1. CATALOG (LIVE BACKEND) ====================
async function loadFilters() {
    try {
        const [cats, brands] = await Promise.all([
            api.get(CONFIG.ENDPOINTS.CATEGORIES.LIST),
            api.get(CONFIG.ENDPOINTS.BRANDS.LIST)
        ]);
        if (Array.isArray(cats)) {
            categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>' +
                cats.map(c => `<option value="${c.id}">${c.nameCategories || c.name}</option>`).join('');
        }
        if (Array.isArray(brands)) {
            brandFilter.innerHTML = '<option value="">Tất cả thương hiệu</option>' +
                brands.map(b => `<option value="${b.id}">${b.nameBrands || b.name}</option>`).join('');
        }
    } catch (_) {}
}

async function loadProducts(page = 0) {
    currentPage = page;
    productsGrid.innerHTML = Array(5).fill(0).map(() => `
        <div class="card" style="height: 290px; display:flex; flex-direction:column; gap:12px;">
            <div style="flex:1; background: var(--surface-subtle); border-radius: var(--radius-sm);"></div>
            <div style="height:14px; width:75%; background: var(--surface-subtle); border-radius:4px;"></div>
            <div style="height:18px; width:45%; background: var(--surface-subtle); border-radius:4px;"></div>
        </div>
    `).join('');

    try {
        let endpoint = CONFIG.ENDPOINTS.PRODUCTS.LIST;
        const params = { page_no: page, page_size: pageSize, sortBy: 'id', sortDir: 'desc' };

        if (searchQuery) {
            endpoint = CONFIG.ENDPOINTS.PRODUCTS.SEARCH;
            params.nameProduct = searchQuery;
        } else if (selectedCategory && selectedBrand) {
            endpoint = CONFIG.ENDPOINTS.PRODUCTS.BY_CAT_AND_BRAND(selectedCategory, selectedBrand);
        } else if (selectedCategory) {
            endpoint = CONFIG.ENDPOINTS.PRODUCTS.BY_CATEGORY(selectedCategory);
        } else if (selectedBrand) {
            endpoint = CONFIG.ENDPOINTS.PRODUCTS.BY_BRAND(selectedBrand);
        }

        const res = await api.get(endpoint, params);
        const pageObj = res?.products || res;
        const items = pageObj?.content || (Array.isArray(pageObj) ? pageObj : []);
        const totalPages = pageObj?.totalPages || 0;
        const totalElements = pageObj?.totalElements ?? items.length;

        btnResetFilter.style.display = (selectedCategory || selectedBrand || searchQuery) ? 'inline-flex' : 'none';
        catalogStatus.textContent = `${totalElements} sản phẩm sẵn có`;

        if (!items.length) {
            productsGrid.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
                    <p style="color: var(--text-primary); font-weight: 600; margin-bottom: 6px;">Không tìm thấy sản phẩm phù hợp</p>
                    <p style="font-size: var(--text-xs); margin: 0 auto;">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác.</p>
                </div>
            `;
            paginationBar.innerHTML = '';
            return;
        }

        productsGrid.innerHTML = items.map(p => {
            const name = p.nameProduct || p.name || 'Sản phẩm';
            const img = p.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&q=80';
            const specs = p.specs || 'Bảo hành điện tử chính hãng';
            return `
                <article class="card product-card" style="padding: 16px;">
                    <a href="detailproductuser.html?id=${p.id}" class="product-image-box" style="margin-bottom: 12px;">
                        <img src="${img}" alt="${name}" loading="lazy" />
                    </a>
                    <div class="product-category-tag">SKU #${p.id}</div>
                    <a href="detailproductuser.html?id=${p.id}" class="product-title" title="${name}">${name}</a>
                    <div class="mono-spec" style="font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 12px;" title="${specs}">
                        ${specs}
                    </div>
                    <div class="product-card-footer" style="padding-top: 12px;">
                        <span class="product-price" style="font-size: var(--text-base); color: var(--brand-orange);">${formatVnd(p.price)}</span>
                        <button type="button" class="btn btn-primary btn-sm btn-add-cart"
                            data-id="${p.id}"
                            data-name="${name.replace(/"/g, '&quot;')}"
                            data-price="${p.price || 0}"
                            data-img="${img}">
                            + Giỏ
                        </button>
                    </div>
                </article>
            `;
        }).join('');

        productsGrid.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', () => {
                cart.addItem({
                    id: btn.dataset.id,
                    name: btn.dataset.name,
                    price: parseFloat(btn.dataset.price) || 0,
                    image: btn.dataset.img
                }, 1);
            });
        });

        paginationBar.innerHTML = totalPages > 1 ? Array.from({ length: totalPages }, (_, i) =>
            `<button type="button" class="btn btn-sm ${i === page ? 'btn-primary' : 'btn-secondary'}" data-page="${i}">${i + 1}</button>`
        ).join('') : '';
        paginationBar.querySelectorAll('button').forEach(b => b.addEventListener('click', () => loadProducts(Number(b.dataset.page))));
    } catch (err) {
        catalogStatus.textContent = 'Không thể kết nối máy chủ';
        productsGrid.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px 24px;">
                <p style="color: var(--text-primary); font-weight: 600; margin-bottom: 8px;">Chưa kết nối được Backend (${CONFIG.API_BASE_URL})</p>
                <button type="button" id="btnRetryCatalog" class="btn btn-secondary btn-sm">Thử tải lại</button>
            </div>
        `;
        document.getElementById('btnRetryCatalog')?.addEventListener('click', () => loadProducts(0));
    }
}

// ==================== 2. 10-BRANCH STORE LOCATOR ====================
function initBranches() {
    const cities = ['Tất cả', ...new Set(CONFIG.BRANCHES.map(b => b.city))];

    cityFilterPills.innerHTML = cities.map(city => {
        const count = city === 'Tất cả' ? CONFIG.BRANCHES.length : CONFIG.BRANCHES.filter(b => b.city === city).length;
        return `<button type="button" class="btn btn-sm ${city === selectedCity ? 'btn-primary' : 'btn-secondary'} city-pill" data-city="${city}">${city} (${count})</button>`;
    }).join('');

    cityFilterPills.querySelectorAll('.city-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCity = btn.dataset.city;
            initBranches();
        });
    });

    const filtered = selectedCity === 'Tất cả'
        ? CONFIG.BRANCHES
        : CONFIG.BRANCHES.filter(b => b.city === selectedCity);

    branchListEl.innerHTML = filtered.map(b => {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;
        return `
            <div class="branch-item">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:4px;">
                    <strong style="font-size: var(--text-sm); color: var(--text-primary);">${b.name}</strong>
                    <span class="badge badge-success">${b.city}</span>
                </div>
                <div style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: 4px;">${b.address}</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">
                    ${b.services} • <span class="tabular-nums">${b.hours}</span> • <span class="tabular-nums">${b.phone}</span>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button type="button" class="btn btn-secondary btn-sm btn-pick-branch" data-branch="${b.name} — ${b.address}">
                        Đặt lịch tại đây
                    </button>
                    <a href="${mapUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Chỉ đường Maps ↗</a>
                </div>
            </div>
        `;
    }).join('');

    branchListEl.querySelectorAll('.btn-pick-branch').forEach(btn => {
        btn.addEventListener('click', () => {
            repairBranchSelect.value = btn.dataset.branch;
            repairBranchSelect.focus();
            toast.info('Đã chọn chi nhánh tiếp nhận sửa chữa.');
        });
    });

    // Populate select dropdown once
    if (repairBranchSelect && repairBranchSelect.options.length <= 1) {
        repairBranchSelect.innerHTML = CONFIG.BRANCHES.map(b =>
            `<option value="${b.name} — ${b.address}">${b.name} (${b.city})</option>`
        ).join('');
    }
}

// ==================== 3. REPAIR BOOKING FORM (POST /api/repairs) ====================
function initRepairForm() {
    // Default appointment date = today
    const dateInput = document.getElementById('repairDate');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        dateInput.min = today.toISOString().split('T')[0];
        dateInput.value = today.toISOString().split('T')[0];
    }

    // Pre-fill logged-in user info
    const user = auth.getUser();
    if (user) {
        const nameInput = document.getElementById('repairName');
        const emailInput = document.getElementById('repairEmail');
        if (nameInput && !nameInput.value) nameInput.value = user.accountname || '';
        if (emailInput && !emailInput.value) emailInput.value = user.gmail || '';
    }

    repairForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSubmitRepair');
        btn.disabled = true;
        btn.textContent = 'Đang gửi lịch hẹn...';

        const payload = {
            customerName: document.getElementById('repairName').value.trim(),
            customerPhone: document.getElementById('repairPhone').value.trim(),
            customerEmail: document.getElementById('repairEmail').value.trim(),
            branchName: repairBranchSelect.value,
            deviceModel: document.getElementById('repairDevice').value.trim(),
            serviceType: document.getElementById('repairService').value,
            appointmentDate: document.getElementById('repairDate').value,
            appointmentTime: document.getElementById('repairTime').value,
            issueDescription: document.getElementById('repairIssue').value.trim()
        };

        try {
            const saved = await api.post(CONFIG.ENDPOINTS.REPAIRS.CREATE, payload);
            toast.success(`Đặt lịch sửa chữa thành công! Mã lịch hẹn #${saved.id}`);
            bookingReceipt.style.display = 'block';
            bookingReceipt.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <strong style="color: var(--brand-green);">✓ Đã xác nhận tiếp nhận lịch hẹn #${saved.id}</strong>
                    <span class="badge badge-warning">Chờ xác nhận</span>
                </div>
                <div style="font-size: var(--text-xs); color: var(--text-secondary);">
                    <div>Khách hàng: <b>${saved.customerName}</b> (${saved.customerPhone})</div>
                    <div>Thiết bị: <b>${saved.deviceModel}</b> — ${saved.serviceType}</div>
                    <div>Thời gian: <b class="tabular-nums">${saved.appointmentTime} ngày ${saved.appointmentDate}</b></div>
                    <div>Chi nhánh: ${saved.branchName}</div>
                </div>
            `;
            repairForm.reset();
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        } catch (err) {
            toast.error(err.message || 'Không thể đặt lịch sửa chữa. Vui lòng thử lại.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Xác nhận đặt lịch sửa chữa';
        }
    });
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initStoreLayout({ activeNav: 'home' });

    categoryFilter?.addEventListener('change', () => { selectedCategory = categoryFilter.value; searchQuery = ''; loadProducts(0); });
    brandFilter?.addEventListener('change', () => { selectedBrand = brandFilter.value; searchQuery = ''; loadProducts(0); });

    const runSearch = () => {
        searchQuery = searchInput.value.trim();
        loadProducts(0);
    };
    document.getElementById('btnSearch')?.addEventListener('click', runSearch);
    searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });

    btnResetFilter?.addEventListener('click', () => {
        selectedCategory = ''; selectedBrand = ''; searchQuery = '';
        categoryFilter.value = ''; brandFilter.value = ''; searchInput.value = '';
        loadProducts(0);
    });

    loadFilters();
    loadProducts(0);
    initBranches();
    initRepairForm();
});
