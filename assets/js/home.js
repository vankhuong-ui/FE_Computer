/**
 * home.js - Retail Homepage Controller for HK COMPUTER
 * - Interactive Category & Brand Filter Pills + Price Sort
 * - Hardware Spec-Tag Product Cards with live stock check
 * - Listed Service Rate Picker & Store Directory
 */

import { api } from './api.js';
import { auth } from './auth.js';
import { cart } from './cart.js?v=7';
import { CONFIG } from './config.js';
import { toast } from './toast.js';
import { initStoreLayout } from './layout.js?v=7';
import './chat-widget.js?v=7';

let currentPage = 0;
const pageSize = 10;
let selectedCategory = '';
let selectedBrand = '';
let searchQuery = new URLSearchParams(window.location.search).get('q')?.trim() || '';
let sortMode = 'newest'; // newest, price_asc, price_desc
let selectedCity = CONFIG.BRANCHES[0]?.city || 'Hà Nội';

const productsGrid = document.getElementById('productsGrid');
const paginationBar = document.getElementById('paginationBar');
const categoryFilter = document.getElementById('categoryFilter');
const brandFilter = document.getElementById('brandFilter');
const categoryPills = document.getElementById('categoryPills');
const brandPills = document.getElementById('brandPills');
const sortPills = document.getElementById('sortPills');
const searchInput = document.getElementById('searchInput');
const btnResetFilter = document.getElementById('btnResetFilter');
const catalogStatus = document.getElementById('catalogStatus');

const cityFilterTabs = document.getElementById('cityFilterTabs');
const branchListEl = document.getElementById('branchList');
const repairBranchSelect = document.getElementById('repairBranch');
const repairBranchGroup = document.getElementById('repairBranchGroup');
const repairHomeAddrGroup = document.getElementById('repairHomeAddrGroup');
const repairHomeAddress = document.getElementById('repairHomeAddress');
const repairForm = document.getElementById('repairBookingForm');
const bookingReceipt = document.getElementById('bookingReceipt');

const formatVnd = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

function parseHardwareTags(rawSpecs) {
    if (!rawSpecs) return ['Chính hãng', 'Bảo hành điện tử'];
    const parts = String(rawSpecs)
        .split(/[|,;/\n]+/)
        .map(s => s.trim())
        .filter(Boolean);
    return (parts.length ? parts : [String(rawSpecs).trim()]).slice(0, 3);
}

// ==================== 1. LIVE CATALOG & PILL FILTERS ====================
function syncFilterPillStates() {
    categoryPills?.querySelectorAll('[data-cat]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === String(selectedCategory));
    });
    brandPills?.querySelectorAll('[data-brand]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.brand === String(selectedBrand));
    });
    sortPills?.querySelectorAll('[data-sort]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sortMode);
    });
}

async function loadFilters() {
    try {
        const [cats, brands] = await Promise.all([
            api.get(CONFIG.ENDPOINTS.CATEGORIES.LIST),
            api.get(CONFIG.ENDPOINTS.BRANDS.LIST)
        ]);
        if (Array.isArray(cats)) {
            if (categoryFilter) {
                categoryFilter.innerHTML = '<option value="">Tất cả danh mục</option>' +
                    cats.map(c => `<option value="${c.id}">${c.nameCategories || c.name}</option>`).join('');
            }
            if (categoryPills) {
                categoryPills.innerHTML = `<button type="button" class="filter-pill ${!selectedCategory ? 'active' : ''}" data-cat="">Tất cả</button>` +
                    cats.map(c => `<button type="button" class="filter-pill ${String(selectedCategory) === String(c.id) ? 'active' : ''}" data-cat="${c.id}">${c.nameCategories || c.name}</button>`).join('');
                categoryPills.querySelectorAll('[data-cat]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        selectedCategory = btn.dataset.cat;
                        if (categoryFilter) categoryFilter.value = selectedCategory;
                        syncFilterPillStates();
                        loadProducts(0);
                    });
                });
            }
        }
        if (Array.isArray(brands)) {
            if (brandFilter) {
                brandFilter.innerHTML = '<option value="">Tất cả thương hiệu</option>' +
                    brands.map(b => `<option value="${b.id}">${b.nameBrands || b.name}</option>`).join('');
            }
            if (brandPills) {
                brandPills.innerHTML = `<button type="button" class="filter-pill brand-chip ${!selectedBrand ? 'active' : ''}" data-brand="">Tất cả hãng</button>` +
                    brands.map(b => `<button type="button" class="filter-pill brand-chip ${String(selectedBrand) === String(b.id) ? 'active' : ''}" data-brand="${b.id}">${b.nameBrands || b.name}</button>`).join('');
                brandPills.querySelectorAll('[data-brand]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        selectedBrand = btn.dataset.brand;
                        if (brandFilter) brandFilter.value = selectedBrand;
                        syncFilterPillStates();
                        loadProducts(0);
                    });
                });
            }
        }
    } catch (_) {}
}

async function loadProducts(page = 0) {
    currentPage = page;
    productsGrid.innerHTML = Array(4).fill(0).map(() => `
        <div class="card product-card" style="gap: 12px;">
            <div class="skeleton" style="aspect-ratio: 4/3; border-radius: var(--radius-sm);"></div>
            <div class="skeleton" style="height: 15px; width: 85%;"></div>
            <div class="skeleton" style="height: 22px; width: 100%;"></div>
            <div class="skeleton" style="height: 20px; width: 52%; margin-top: 4px;"></div>
            <div style="display: grid; grid-template-columns: 1fr 1.15fr; gap: 8px; margin-top: 4px;">
                <div class="skeleton" style="height: 34px; border-radius: var(--radius-sm);"></div>
                <div class="skeleton" style="height: 34px; border-radius: var(--radius-sm);"></div>
            </div>
        </div>
    `).join('');

    try {
        let endpoint = CONFIG.ENDPOINTS.PRODUCTS.LIST;
        const sortBy = sortMode === 'newest' ? 'id' : 'price';
        const sortDir = sortMode === 'price_asc' ? 'asc' : 'desc';
        const params = { page_no: page, page_size: pageSize, sortBy, sortDir };

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
        let items = [...(pageObj?.content || (Array.isArray(pageObj) ? pageObj : []))];
        const totalPages = pageObj?.totalPages || 0;
        const totalElements = pageObj?.totalElements ?? items.length;

        // Ensure client-side price sort also applies cleanly on filtered/search endpoints
        if (sortMode === 'price_asc') {
            items.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        } else if (sortMode === 'price_desc') {
            items.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        }

        btnResetFilter.style.display = (selectedCategory || selectedBrand || searchQuery || sortMode !== 'newest') ? 'inline-flex' : 'none';
        catalogStatus.textContent = `${totalElements} sản phẩm`;

        if (!items.length) {
            productsGrid.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
                    <p style="color: var(--text-primary); font-weight: 600; margin: 0 auto 6px;">Không tìm thấy sản phẩm phù hợp</p>
                    <p style="font-size: var(--text-xs); margin: 0 auto;">Thử từ khóa hoặc bộ lọc danh mục khác.</p>
                </div>
            `;
            paginationBar.innerHTML = '';
            return;
        }

        // Fetch live inventory for each visible product in parallel
        const invList = await Promise.all(
            items.map(p => api.get(CONFIG.ENDPOINTS.INVENTORY.USER_DETAIL(p.id)).catch(() => null))
        );

        productsGrid.innerHTML = items.map((p, idx) => {
            const name = p.nameProduct || p.name || 'Sản phẩm';
            const safeName = name.replace(/"/g, '&quot;');
            const img = p.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&q=80';
            const hwTags = parseHardwareTags(p.specs);
            const stock = invList[idx]?.soluong ?? 0;
            const inStock = stock > 0;
            return `
                <article class="card product-card">
                    <a href="detailproductuser.html?id=${p.id}" class="product-image-box">
                        <span class="product-stock-pill">
                            <span class="stock-dot ${inStock ? '' : 'out'}"></span>
                            ${inStock ? 'Sẵn hàng' : 'Hết hàng'}
                        </span>
                        <img src="${img}" alt="${safeName}" loading="lazy" />
                    </a>
                    <a href="detailproductuser.html?id=${p.id}" class="product-title" title="${safeName}">${name}</a>
                    <div class="hw-tags-row">
                        ${hwTags.map(t => `<span class="hw-tag" title="${t.replace(/"/g, '&quot;')}">${t}</span>`).join('')}
                    </div>
                    <div class="product-price-row">
                        <span class="product-price tabular-nums">${formatVnd(p.price)}</span>
                        <span class="product-vat-tag">Đã gồm VAT</span>
                    </div>
                    ${inStock ? `
                        <div class="product-card-actions">
                            <button type="button" class="btn btn-cart-soft btn-add-cart"
                                data-id="${p.id}"
                                data-name="${safeName}"
                                data-price="${p.price || 0}"
                                data-img="${img}"
                                title="Thêm vào giỏ hàng">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                <span>Thêm giỏ</span>
                            </button>
                            <button type="button" class="btn btn-primary btn-buy-now"
                                data-id="${p.id}"
                                data-name="${safeName}"
                                data-price="${p.price || 0}"
                                data-img="${img}">
                                Mua ngay
                            </button>
                        </div>
                    ` : `
                        <a href="detailproductuser.html?id=${p.id}" class="btn btn-secondary btn-sm" style="width: 100%; font-weight: 600;">
                            Xem thông số
                        </a>
                    `}
                </article>
            `;
        }).join('');

        productsGrid.querySelectorAll('.btn-buy-now').forEach(btn => {
            btn.addEventListener('click', () => {
                cart.buyNow({
                    id: btn.dataset.id,
                    name: btn.dataset.name,
                    price: parseFloat(btn.dataset.price) || 0,
                    image: btn.dataset.img
                }, 1);
            });
        });

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
        catalogStatus.textContent = 'Chưa kết nối máy chủ';
        productsGrid.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px 24px;">
                <p style="color: var(--text-primary); font-weight: 600; margin: 0 auto 8px;">Chưa kết nối được máy chủ dữ liệu</p>
                <button type="button" id="btnRetryCatalog" class="btn btn-secondary btn-sm">Tải lại</button>
            </div>
        `;
        document.getElementById('btnRetryCatalog')?.addEventListener('click', () => loadProducts(0));
    }
}

// ==================== 2. COMPACT STORE DIRECTORY & SERVICE RATE PICKER ====================
function renderBranches() {
    const cities = [...new Set(CONFIG.BRANCHES.map(b => b.city))];

    cityFilterTabs.innerHTML = cities.map(city =>
        `<button type="button" class="city-tab ${city === selectedCity ? 'active' : ''}" data-city="${city}">${city}</button>`
    ).join('');

    cityFilterTabs.querySelectorAll('.city-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCity = btn.dataset.city;
            renderBranches();
        });
    });

    const filtered = CONFIG.BRANCHES.filter(b => b.city === selectedCity);

    branchListEl.innerHTML = filtered.map(b => {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;
        return `
            <div class="store-row">
                <div style="flex: 1; min-width: 220px;">
                    <div style="font-weight: 600; font-size: var(--text-sm); color: var(--text-primary); margin-bottom: 4px;">
                        ${b.name}
                    </div>
                    <div style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: 4px;">
                        ${b.address}
                    </div>
                    <div style="font-size: 11px; color: var(--text-muted);" class="tabular-nums">
                        ${b.hours} · ${b.phone} · ${b.services}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; shrink: 0;">
                    <a href="${mapUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Chỉ đường</a>
                    <button type="button" class="btn btn-secondary btn-sm btn-pick-branch" data-branch="${b.name} — ${b.address}">
                        Chọn cơ sở
                    </button>
                </div>
            </div>
        `;
    }).join('');

    branchListEl.querySelectorAll('.btn-pick-branch').forEach(btn => {
        btn.addEventListener('click', () => {
            const storeRadio = document.querySelector('input[name="repairMethod"][value="AT_STORE"]');
            if (storeRadio) {
                storeRadio.checked = true;
                storeRadio.dispatchEvent(new Event('change'));
            }
            repairBranchSelect.value = btn.dataset.branch;
            repairBranchSelect.focus();
            toast.info('Đã chọn cơ sở tiếp nhận sửa chữa.');
        });
    });

    if (repairBranchSelect && repairBranchSelect.options.length === 0) {
        repairBranchSelect.innerHTML = CONFIG.BRANCHES.map(b =>
            `<option value="${b.name} — ${b.address}">${b.name} (${b.city})</option>`
        ).join('');
    }
}

// ==================== 3. SMART REPAIR BOOKING ====================
function initRepairForm() {
    const dateInput = document.getElementById('repairDate');
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }

    const user = auth.getUser();
    if (user?.accountname) {
        const nameInput = document.getElementById('repairName');
        if (nameInput && !nameInput.value) nameInput.value = user.accountname;
    }

    // Service rate cards click -> preselect service in booking form
    document.querySelectorAll('[data-pick-service]').forEach(card => {
        card.addEventListener('click', () => {
            const srvSelect = document.getElementById('repairService');
            if (srvSelect) {
                srvSelect.value = card.dataset.pickService;
                document.getElementById('repairDevice')?.focus();
                toast.info(`Đã chọn dịch vụ: ${card.dataset.pickService}`);
            }
        });
    });

    document.querySelectorAll('input[name="repairMethod"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const isHome = radio.value === 'AT_HOME';
            repairBranchGroup.style.display = isHome ? 'none' : 'flex';
            repairHomeAddrGroup.style.display = isHome ? 'flex' : 'none';
            repairHomeAddress.required = isHome;

            document.querySelectorAll('[data-method-opt]').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.methodOpt === radio.value);
            });
        });
    });

    repairForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const method = document.querySelector('input[name="repairMethod"]:checked')?.value || 'AT_STORE';
        const btn = document.getElementById('btnSubmitRepair');
        btn.disabled = true;
        btn.textContent = 'Đang gửi lịch hẹn...';

        const currentUser = auth.getUser();
        const payload = {
            customerName: document.getElementById('repairName').value.trim(),
            customerPhone: document.getElementById('repairPhone').value.trim(),
            customerEmail: currentUser?.gmail || null,
            serviceMethod: method,
            branchName: method === 'AT_STORE' ? repairBranchSelect.value : '',
            homeAddress: method === 'AT_HOME' ? repairHomeAddress.value.trim() : null,
            deviceModel: document.getElementById('repairDevice').value.trim(),
            serviceType: document.getElementById('repairService').value,
            appointmentDate: document.getElementById('repairDate').value,
            appointmentTime: document.getElementById('repairTime').value,
            issueDescription: document.getElementById('repairIssue').value.trim()
        };

        try {
            const saved = await api.post(CONFIG.ENDPOINTS.REPAIRS.CREATE, payload);
            toast.success(`Đã tiếp nhận lịch hẹn #${saved.id}.`);
            const methodLabel = saved.serviceMethod === 'AT_HOME' ? 'Kỹ thuật viên sửa tại nhà' : 'Mang tới cửa hàng';
            bookingReceipt.style.display = 'block';
            bookingReceipt.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <strong style="color: var(--brand-green);">Đã tiếp nhận lịch hẹn #${saved.id}</strong>
                    <span class="badge badge-info">${methodLabel}</span>
                </div>
                <div style="font-size: var(--text-xs); color: var(--text-secondary);">
                    <div>Khách hàng: <b>${saved.customerName}</b> (${saved.customerPhone})</div>
                    <div>Thiết bị: <b>${saved.deviceModel}</b> — ${saved.serviceType}</div>
                    <div>Thời gian: <b class="tabular-nums">${saved.appointmentTime} · ${saved.appointmentDate}</b></div>
                    <div>Địa điểm: ${saved.serviceMethod === 'AT_HOME' ? saved.homeAddress : saved.branchName}</div>
                </div>
            `;
            repairForm.reset();
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
            repairBranchGroup.style.display = 'flex';
            repairHomeAddrGroup.style.display = 'none';
            document.querySelectorAll('[data-method-opt]').forEach(opt => {
                opt.classList.toggle('active', opt.dataset.methodOpt === 'AT_STORE');
            });
        } catch (err) {
            toast.error(err.message || 'Không thể đặt lịch sửa chữa.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Xác nhận đặt lịch';
        }
    });
}

// ==================== 4. INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initStoreLayout({ activeNav: 'home' });
    renderBranches();
    initRepairForm();
    loadFilters();

    if (searchQuery && searchInput) {
        searchInput.value = searchQuery;
    }
    loadProducts(0);

    sortPills?.querySelectorAll('[data-sort]').forEach(btn => {
        btn.addEventListener('click', () => {
            sortMode = btn.dataset.sort;
            syncFilterPillStates();
            loadProducts(0);
        });
    });

    document.getElementById('btnSearch')?.addEventListener('click', () => {
        searchQuery = searchInput.value.trim();
        loadProducts(0);
    });

    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchQuery = searchInput.value.trim();
            loadProducts(0);
        }
    });

    btnResetFilter?.addEventListener('click', () => {
        selectedCategory = '';
        selectedBrand = '';
        searchQuery = '';
        sortMode = 'newest';
        if (categoryFilter) categoryFilter.value = '';
        if (brandFilter) brandFilter.value = '';
        if (searchInput) searchInput.value = '';
        syncFilterPillStates();
        loadProducts(0);
    });
});
