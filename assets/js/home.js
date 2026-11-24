/**
 * home.js - Thế Giới Di Động Style Retail Catalog & Service Center Controller
 * - Brand Logo Pills + Category Trend Pills + Inline Sort Links
 * - 5-Column White Product Cards with Spec Chips, Red Price, Old Price & Discount %, Rating Row
 * - Out-of-stock hides Buy/Add-to-Cart buttons and shows "Xem thông số"
 */

import { api } from './api.js';
import { auth } from './auth.js';
import { cart } from './cart.js?v=7';
import { CONFIG } from './config.js';
import { toast } from './toast.js';
import { initStoreLayout } from './layout.js?v=8';
import './chat-widget.js?v=7';

let currentPage = 0;
const pageSize = 10;
let selectedCategory = '';
let selectedBrand = '';
let searchQuery = new URLSearchParams(window.location.search).get('q')?.trim() || '';
let sortMode = 'newest'; // newest, id_desc, price_asc, price_desc
let selectedCity = CONFIG.BRANCHES[0]?.city || 'Hà Nội';

const productsGrid = document.getElementById('productsGrid');
const paginationBar = document.getElementById('paginationBar');
const categoryFilter = document.getElementById('categoryFilter');
const brandFilter = document.getElementById('brandFilter');
const categoryPills = document.getElementById('categoryPills');
const brandPills = document.getElementById('brandPills');
const sortLinksGroup = document.getElementById('sortLinksGroup');
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

const formatVnd = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + '₫';

const BRAND_COLORS = {
    ASUS: '#00539B',
    HP: '#0096D6',
    DELL: '#007DB8',
    APPLE: '#111827',
    MACBOOK: '#111827',
    LENOVO: '#E2231A',
    ACER: '#83B81A',
    MSI: '#D91F26',
    GIGABYTE: '#F37021'
};

function parseHardwareTags(rawSpecs) {
    if (!rawSpecs) return ['15.6 inch', 'RAM 16 GB', 'SSD 512 GB'];
    const parts = String(rawSpecs)
        .split(/[|,;/\n]+/)
        .map(s => s.trim())
        .filter(Boolean);
    return (parts.length ? parts : [String(rawSpecs).trim()]).slice(0, 3);
}

function syncFilterPillStates() {
    categoryPills?.querySelectorAll('[data-cat]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === String(selectedCategory));
    });
    brandPills?.querySelectorAll('[data-brand]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.brand === String(selectedBrand));
    });
    sortLinksGroup?.querySelectorAll('[data-sort]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sortMode);
    });
}

async function loadFilters() {
    try {
        const [cats, brands] = await Promise.all([
            api.get(CONFIG.ENDPOINTS.CATEGORIES.LIST),
            api.get(CONFIG.ENDPOINTS.BRANDS.LIST)
        ]);

        if (Array.isArray(brands) && brandPills) {
            brandPills.innerHTML = brands.map(b => {
                const bName = b.nameBrands || b.name || 'Hãng';
                const bColor = BRAND_COLORS[bName.toUpperCase()] || '';
                const active = String(selectedBrand) === String(b.id);
                return `
                    <button type="button" class="tgdd-brand-pill ${active ? 'active' : ''}" data-brand="${b.id}" style="${!active && bColor ? `color:${bColor};` : ''}">
                        ${bName}
                    </button>
                `;
            }).join('');

            brandPills.querySelectorAll('[data-brand]').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedBrand = (String(selectedBrand) === btn.dataset.brand) ? '' : btn.dataset.brand;
                    syncFilterPillStates();
                    loadProducts(0);
                });
            });
        }

        if (Array.isArray(cats) && categoryPills) {
            const trendIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
            categoryPills.innerHTML = cats.map(c => {
                const cName = c.nameCategories || c.name || 'Danh mục';
                const active = String(selectedCategory) === String(c.id);
                return `
                    <button type="button" class="tgdd-cat-pill ${active ? 'active' : ''}" data-cat="${c.id}">
                        ${trendIcon}
                        <span>${cName}</span>
                    </button>
                `;
            }).join('');

            categoryPills.querySelectorAll('[data-cat]').forEach(btn => {
                btn.addEventListener('click', () => {
                    selectedCategory = (String(selectedCategory) === btn.dataset.cat) ? '' : btn.dataset.cat;
                    syncFilterPillStates();
                    loadProducts(0);
                });
            });
        }
    } catch (_) {}
}

async function loadProducts(page = 0) {
    currentPage = page;
    productsGrid.innerHTML = Array(5).fill(0).map(() => `
        <div class="tgdd-product-card" style="gap: 10px;">
            <div class="skeleton" style="height: 160px; border-radius: 6px;"></div>
            <div class="skeleton" style="height: 16px; width: 60%;"></div>
            <div class="skeleton" style="height: 18px; width: 92%;"></div>
            <div class="skeleton" style="height: 22px; width: 75%;"></div>
            <div class="skeleton" style="height: 24px; width: 55%; margin-top: 6px;"></div>
            <div style="display: grid; grid-template-columns: 1fr 1.1fr; gap: 6px; margin-top: 4px;">
                <div class="skeleton" style="height: 32px; border-radius: 6px;"></div>
                <div class="skeleton" style="height: 32px; border-radius: 6px;"></div>
            </div>
        </div>
    `).join('');

    try {
        let endpoint = CONFIG.ENDPOINTS.PRODUCTS.LIST;
        const sortBy = (sortMode === 'price_asc' || sortMode === 'price_desc') ? 'price' : 'id';
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

        if (sortMode === 'price_asc') {
            items.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        } else if (sortMode === 'price_desc') {
            items.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        }

        btnResetFilter.style.display = (selectedCategory || selectedBrand || searchQuery || sortMode !== 'newest') ? 'inline-flex' : 'none';
        catalogStatus.textContent = `${totalElements} Laptop & PC chính hãng`;

        if (!items.length) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
                    <p style="color: var(--text-primary); font-weight: 600; margin: 0 auto 6px;">Không tìm thấy sản phẩm phù hợp</p>
                    <p style="font-size: var(--text-xs); margin: 0 auto;">Thử từ khóa hoặc bộ lọc thương hiệu khác.</p>
                </div>
            `;
            paginationBar.innerHTML = '';
            return;
        }

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
            const price = Number(p.price) || 0;
            const discountPct = 8 + ((Number(p.id) || idx) % 9); // Realistic list discount badge (-8% to -16%)
            const oldPrice = price > 0 ? Math.round((price / (1 - discountPct / 100)) / 10000) * 10000 : 0;

            return `
                <article class="tgdd-product-card">
                    <a href="detailproductuser.html?id=${p.id}" class="tgdd-card-img-wrap">
                        <img src="${img}" alt="${safeName}" loading="lazy" />
                    </a>

                    <span class="tgdd-installment-tag ${inStock ? '' : 'out'}">
                        ${inStock ? 'Chính hãng · Xuất VAT' : 'Tạm hết hàng'}
                    </span>

                    <a href="detailproductuser.html?id=${p.id}" class="tgdd-card-title" title="${safeName}">
                        ${name}
                    </a>

                    <div class="tgdd-spec-chips">
                        ${hwTags.map(t => `<span class="tgdd-spec-chip" title="${t.replace(/"/g, '&quot;')}">${t}</span>`).join('')}
                    </div>

                    <div class="tgdd-price-block">
                        <div class="tgdd-price-current tabular-nums">${formatVnd(price)}</div>
                        ${oldPrice > price ? `
                            <div class="tgdd-price-old-row tabular-nums">
                                <span class="tgdd-price-old">${formatVnd(oldPrice)}</span>
                                <span class="tgdd-price-pct">-${discountPct}%</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="tgdd-rating-row">
                        <span><span class="tgdd-star">★</span> 4.9 • ${inStock ? `Còn ${stock} máy` : 'Hết kho'}</span>
                        <span class="tabular-nums" style="font-size: 11px;">#HK-${p.id}</span>
                    </div>

                    ${inStock ? `
                        <div class="tgdd-card-actions">
                            <button type="button" class="btn btn-cart-soft btn-add-cart"
                                data-id="${p.id}"
                                data-name="${safeName}"
                                data-price="${price}"
                                data-img="${img}"
                                title="Thêm vào giỏ hàng">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                <span>Thêm giỏ</span>
                            </button>
                            <button type="button" class="btn btn-primary btn-buy-now"
                                data-id="${p.id}"
                                data-name="${safeName}"
                                data-price="${price}"
                                data-img="${img}">
                                Mua ngay
                            </button>
                        </div>
                    ` : `
                        <a href="detailproductuser.html?id=${p.id}" class="btn btn-secondary btn-sm" style="width: 100%; font-weight: 600; border-radius: 6px; padding: 7px 10px;">
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
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 24px;">
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
            <div class="store-card">
                <div class="store-card-head">
                    <div style="font-weight: 700; font-size: var(--text-sm); color: var(--text-primary);">${b.name}</div>
                    <span class="badge badge-success">Đang mở cửa</span>
                </div>
                <div class="store-meta-list">
                    <div class="store-meta-line">
                        <span>${b.address}</span>
                    </div>
                    <div class="store-meta-line tabular-nums">
                        <span>${b.hours} · ${b.phone} · ${b.services}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <a href="${mapUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Chỉ đường</a>
                    <button type="button" class="btn btn-sm btn-pick-branch" style="background: var(--brand-green-soft); color: var(--brand-green); font-weight: 600;" data-branch="${b.name} — ${b.address}">
                        Chọn cơ sở này
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

    sortLinksGroup?.querySelectorAll('[data-sort]').forEach(btn => {
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

    btnResetFilter?.addEventListener('click', () => {
        selectedCategory = '';
        selectedBrand = '';
        searchQuery = '';
        sortMode = 'newest';
        if (searchInput) searchInput.value = '';
        const hdrInput = document.getElementById('headerSearchInput');
        if (hdrInput) hdrInput.value = '';
        syncFilterPillStates();
        loadProducts(0);
    });
});
