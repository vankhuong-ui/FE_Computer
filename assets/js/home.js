/**
 * home.js - Thế Giới Di Động Style Retail Catalog (Laptop · PC · Phụ kiện & Kho Đa Cơ Sở)
 * - Group Tabs: Tất cả · Laptop · PC & Màn hình · Phụ kiện & Linh kiện
 * - Location & Branch Stock Filter synchronized with Header Location Modal
 * - Dynamic Brand Pills, Category Pills & Price Range Presets by Group Type
 * - 5-Column White Product Cards with accurate unit ("máy" vs "sản phẩm") and real multi-branch stock
 */

import { api } from './api.js';
import { auth } from './auth.js?v=10';
import { cart } from './cart.js?v=7';
import { CONFIG } from './config.js';
import { toast } from './toast.js';
import { formatVnd } from './utils.js';
import { initStoreLayout } from './layout.js?v=11';
import './chat-widget.js?v=7';

let currentPage = 0;
const pageSize = 10;
let selectedGroup = 'ALL'; // ALL, LAPTOP, PC, ACCESSORY
let selectedCategory = '';
let selectedBrand = '';
let selectedPriceKey = '';
let inStockOnly = false;
let searchQuery = new URLSearchParams(window.location.search).get('q')?.trim() || '';
let sortMode = 'featured'; // featured, newest, price_asc, price_desc
let selectedCity = CONFIG.BRANCHES[0]?.city || 'Hà Nội';

let allCategories = [];
let allBrands = [];
let allBranches = [...CONFIG.BRANCHES];

const productsGrid = document.getElementById('productsGrid');
const paginationBar = document.getElementById('paginationBar');
const groupTypeTabs = document.getElementById('groupTypeTabs');
const categoryPills = document.getElementById('categoryPills');
const brandPills = document.getElementById('brandPills');
const priceRangePills = document.getElementById('priceRangePills');
const sortLinksGroup = document.getElementById('sortLinksGroup');
const searchInput = document.getElementById('searchInput');
const btnResetFilter = document.getElementById('btnResetFilter');
const catalogStatus = document.getElementById('catalogStatus');
const catalogLocationText = document.getElementById('catalogLocationText');
const chkInStockOnly = document.getElementById('chkInStockOnly');
const lblInStockOnly = document.getElementById('lblInStockOnly');
const txtInStockOnly = document.getElementById('txtInStockOnly');

const cityFilterTabs = document.getElementById('cityFilterTabs');
const branchListEl = document.getElementById('branchList');
const repairBranchSelect = document.getElementById('repairBranch');
const repairBranchGroup = document.getElementById('repairBranchGroup');
const repairHomeAddrGroup = document.getElementById('repairHomeAddrGroup');
const repairHomeAddress = document.getElementById('repairHomeAddress');
const repairForm = document.getElementById('repairBookingForm');
const bookingReceipt = document.getElementById('bookingReceipt');

const BRAND_COLORS = {
    ASUS: '#00539B',
    HP: '#0096D6',
    DELL: '#007DB8',
    APPLE: '#111827',
    MACBOOK: '#111827',
    LENOVO: '#E2231A',
    ACER: '#83B81A',
    MSI: '#D91F26',
    GIGABYTE: '#F37021',
    LOGITECH: '#00B8FC',
    KEYCHRON: '#EA580C',
    HYPERX: '#D91F26',
    KINGSTON: '#991B1B',
    SAMSUNG: '#1428A0',
    ANKER: '#0284C7'
};

const PRICE_PRESETS = {
    DEFAULT: [
        { key: '', label: 'Tất cả mức giá', min: null, max: null },
        { key: 'u15', label: 'Dưới 15 triệu', min: null, max: 15000000 },
        { key: '15_20', label: '15 - 20 triệu', min: 15000000, max: 20000000 },
        { key: '20_30', label: '20 - 30 triệu', min: 20000000, max: 30000000 },
        { key: 'a30', label: 'Trên 30 triệu', min: 30000000, max: null }
    ],
    ACCESSORY: [
        { key: '', label: 'Tất cả mức giá', min: null, max: null },
        { key: 'u500k', label: 'Dưới 500.000₫', min: null, max: 500000 },
        { key: '500k_1m', label: '500.000₫ - 1 triệu', min: 500000, max: 1000000 },
        { key: '1m_2m', label: '1 - 2 triệu', min: 1000000, max: 2000000 },
        { key: 'a2m', label: 'Trên 2 triệu', min: 2000000, max: null }
    ]
};

function inferCategoryGroup(cat) {
    if (cat?.groupType) return cat.groupType.toUpperCase();
    const name = (cat?.nameCategories || cat?.name || '').toLowerCase();
    if (/phụ kiện|chuột|bàn phím|tai nghe|balo|túi|sạc|cáp|hub|ram|ssd|ổ cứng|linh kiện/.test(name)) {
        return 'ACCESSORY';
    }
    if (/pc|máy bàn|workstation|màn hình|monitor|desktop/.test(name)) {
        return 'PC';
    }
    return 'LAPTOP';
}

function parseSpecTags(rawSpecs, groupType, categoryName) {
    if (rawSpecs && String(rawSpecs).trim()) {
        const parts = String(rawSpecs)
            .split(/[|,;/\n]+/)
            .map(s => s.trim())
            .filter(Boolean);
        if (parts.length) return parts.slice(0, 3);
    }
    if (groupType === 'ACCESSORY') {
        return [categoryName || 'Phụ kiện chính hãng', 'Bảo hành 12-36T', 'Đổi mới nếu lỗi'];
    }
    if (groupType === 'PC') {
        return ['PC / Màn hình', 'Linh kiện chính hãng', 'Bảo hành 36T'];
    }
    return ['Chính hãng 100%', 'RAM 16 GB', 'SSD 512 GB'];
}

function renderPricePills() {
    if (!priceRangePills) return;
    const list = selectedGroup === 'ACCESSORY' ? PRICE_PRESETS.ACCESSORY : PRICE_PRESETS.DEFAULT;
    if (!list.some(p => p.key === selectedPriceKey)) {
        selectedPriceKey = '';
    }
    priceRangePills.innerHTML = list.map(p => `
        <button type="button" class="tgdd-price-pill ${p.key === selectedPriceKey ? 'active' : ''}" data-price-key="${p.key}">
            ${p.label}
        </button>
    `).join('');

    priceRangePills.querySelectorAll('[data-price-key]').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedPriceKey = (selectedPriceKey === btn.dataset.priceKey) ? '' : btn.dataset.priceKey;
            renderPricePills();
            loadProducts(0);
        });
    });
}

function renderFilterPills() {
    const visibleCategories = allCategories.filter(c => {
        if (selectedGroup === 'ALL') return true;
        return inferCategoryGroup(c) === selectedGroup;
    });

    if (categoryPills) {
        const trendIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`;
        categoryPills.innerHTML = visibleCategories.map(c => {
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
                renderFilterPills();
                loadProducts(0);
            });
        });
    }

    if (brandPills) {
        const accessoryBrandSet = new Set(['LOGITECH', 'KEYCHRON', 'HYPERX', 'KINGSTON', 'SAMSUNG', 'ANKER']);
        const visibleBrands = allBrands.filter(b => {
            const upper = (b.nameBrands || b.name || '').toUpperCase();
            if (selectedGroup === 'ACCESSORY') {
                return accessoryBrandSet.has(upper) || !BRAND_COLORS[upper];
            }
            if (selectedGroup === 'LAPTOP') {
                return !accessoryBrandSet.has(upper);
            }
            return true;
        });

        brandPills.innerHTML = visibleBrands.map(b => {
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
                renderFilterPills();
                loadProducts(0);
            });
        });
    }
}

function syncLocationBarUI() {
    const loc = CONFIG.getSelectedLocation();
    if (catalogLocationText) {
        catalogLocationText.textContent = loc.label || 'Toàn quốc';
    }
    if (txtInStockOnly) {
        if (loc.branchName) {
            const shortBranch = loc.branchName.replace('HK COMPUTER - ', '');
            txtInStockOnly.textContent = `Chỉ hàng có sẵn tại ${shortBranch}`;
        } else if (loc.city) {
            txtInStockOnly.textContent = `Chỉ hàng có sẵn tại ${loc.city}`;
        } else {
            txtInStockOnly.textContent = 'Chỉ hiện sản phẩm còn hàng';
        }
    }
    if (lblInStockOnly) {
        lblInStockOnly.classList.toggle('active', inStockOnly);
    }
}

function syncGroupAndSortUI() {
    groupTypeTabs?.querySelectorAll('[data-group]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.group === selectedGroup);
    });
    sortLinksGroup?.querySelectorAll('[data-sort]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sortMode);
    });
}

async function loadFilters() {
    try {
        const [cats, brands, branches] = await Promise.all([
            api.get(CONFIG.ENDPOINTS.CATEGORIES.LIST).catch(() => []),
            api.get(CONFIG.ENDPOINTS.BRANDS.LIST).catch(() => []),
            api.get(CONFIG.ENDPOINTS.BRANCHES.LIST).catch(() => [])
        ]);

        if (Array.isArray(cats)) allCategories = cats;
        if (Array.isArray(brands)) allBrands = brands;
        if (Array.isArray(branches) && branches.length > 0) {
            allBranches = branches.map(b => ({
                ...b,
                hours: b.openingHours || b.hours || '8:00 - 21:00'
            }));
            CONFIG.BRANCHES = allBranches;
            if (!allBranches.some(b => b.city === selectedCity)) {
                selectedCity = allBranches[0].city;
            }
            renderBranches();
            populateRepairBranchSelect();
        }

        renderFilterPills();
        renderPricePills();
    } catch (_) {}
}

function getActivePriceRange() {
    const list = selectedGroup === 'ACCESSORY' ? PRICE_PRESETS.ACCESSORY : PRICE_PRESETS.DEFAULT;
    return list.find(p => p.key === selectedPriceKey) || { min: null, max: null };
}

function getGroupHeadingLabel() {
    if (selectedGroup === 'LAPTOP') return 'Laptop chính hãng';
    if (selectedGroup === 'PC') return 'PC & Màn hình chính hãng';
    if (selectedGroup === 'ACCESSORY') return 'Phụ kiện & Linh kiện chính hãng';
    return 'Laptop, PC & Phụ kiện chính hãng';
}

async function loadProducts(page = 0) {
    currentPage = page;
    syncLocationBarUI();
    syncGroupAndSortUI();

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

    const loc = CONFIG.getSelectedLocation();
    const priceRange = getActivePriceRange();

    try {
        const catalogParams = {
            page_no: page,
            page_size: pageSize,
            sort_mode: sortMode === 'id_desc' ? 'newest' : sortMode
        };
        if (selectedGroup && selectedGroup !== 'ALL') catalogParams.group_type = selectedGroup;
        if (selectedCategory) catalogParams.category_id = selectedCategory;
        if (selectedBrand) catalogParams.brand_id = selectedBrand;
        if (searchQuery) catalogParams.keyword = searchQuery;
        if (priceRange.min != null) catalogParams.min_price = priceRange.min;
        if (priceRange.max != null) catalogParams.max_price = priceRange.max;
        if (loc.branchId) catalogParams.branch_id = loc.branchId;
        else if (loc.city) catalogParams.city = loc.city;
        if (inStockOnly) catalogParams.in_stock_only = true;

        let res;
        let usedUnifiedCatalog = true;
        try {
            res = await api.get(CONFIG.ENDPOINTS.PRODUCTS.CATALOG, catalogParams);
        } catch (_) {
            usedUnifiedCatalog = false;
            res = await api.get(CONFIG.ENDPOINTS.PRODUCTS.LIST, {
                page_no: page,
                page_size: pageSize,
                sortBy: (sortMode === 'price_asc' || sortMode === 'price_desc') ? 'price' : 'id',
                sortDir: sortMode === 'price_asc' ? 'asc' : 'desc'
            });
        }

        const pageObj = res?.products || res;
        let items = [...(pageObj?.content || (Array.isArray(pageObj) ? pageObj : []))];
        const totalPages = pageObj?.totalPages || 0;
        const totalElements = pageObj?.totalElements ?? items.length;

        const hasActiveFilter = Boolean(
            selectedGroup !== 'ALL' ||
            selectedCategory ||
            selectedBrand ||
            selectedPriceKey ||
            inStockOnly ||
            searchQuery ||
            sortMode !== 'featured'
        );
        if (btnResetFilter) {
            btnResetFilter.style.display = hasActiveFilter ? 'inline-flex' : 'none';
        }

        const locSuffix = loc.branchName
            ? ` · ${loc.branchName.replace('HK COMPUTER - ', '')}`
            : (loc.city ? ` · Khu vực ${loc.city}` : '');
        catalogStatus.textContent = `${totalElements} ${getGroupHeadingLabel()}${locSuffix}`;

        if (!items.length) {
            productsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;">
                    <p style="color: var(--text-primary); font-weight: 600; margin: 0 auto 6px;">Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại</p>
                    <p style="font-size: var(--text-xs); margin: 0 auto 14px;">Bạn có thể tắt bộ lọc "Chỉ hàng còn tại đây", chọn Toàn quốc hoặc thử từ khóa khác.</p>
                    <button type="button" id="btnEmptyReset" class="btn btn-secondary btn-sm">Xem toàn bộ sản phẩm</button>
                </div>
            `;
            document.getElementById('btnEmptyReset')?.addEventListener('click', () => btnResetFilter?.click());
            paginationBar.innerHTML = '';
            return;
        }

        // Only call fallback per-product inventory if running against old backend without totalStock/locationStock
        let fallbackInvList = null;
        if (!usedUnifiedCatalog || items.some(p => p.locationStock === undefined && p.totalStock === undefined)) {
            fallbackInvList = await Promise.all(
                items.map(p => api.get(CONFIG.ENDPOINTS.INVENTORY.USER_DETAIL(p.id), {
                    branch_id: loc.branchId || undefined,
                    city: (!loc.branchId && loc.city) ? loc.city : undefined
                }).catch(() => null))
            );
        }

        productsGrid.innerHTML = items.map((p, idx) => {
            const name = p.nameProduct || p.name || 'Sản phẩm';
            const safeName = name.replace(/"/g, '&quot;');
            const img = p.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&q=80';
            const catObj = allCategories.find(c => Number(c.id) === Number(p.categoriesId));
            const groupType = (p.groupType || inferCategoryGroup(catObj) || 'LAPTOP').toUpperCase();
            const catName = p.categoriesName || catObj?.nameCategories || '';
            const hwTags = parseSpecTags(p.specs, groupType, catName);
            const unitLabel = groupType === 'ACCESSORY' ? 'sản phẩm' : 'máy';

            const fbInv = fallbackInvList ? fallbackInvList[idx] : null;
            const totalStock = p.totalStock ?? fbInv?.totalStock ?? fbInv?.soluong ?? 0;
            const locStock = p.locationStock ?? fbInv?.soluong ?? totalStock;
            const branchCount = p.availableBranchCount ?? fbInv?.availableBranchCount ?? (totalStock > 0 ? 1 : 0);

            const hasSelectedLocation = Boolean(loc.branchId || loc.city);
            const shortLocName = loc.branchName
                ? loc.branchName.replace('HK COMPUTER - ', '')
                : (loc.city || '');

            // Can buy if in stock at selected branch OR in stock nationwide
            const inStockHere = locStock > 0;
            const canBuy = hasSelectedLocation ? (inStockHere || totalStock > 0) : (totalStock > 0);

            let topBadgeText = 'Chính hãng · Xuất VAT';
            let topBadgeOut = false;
            let stockSummaryLine = '';

            if (hasSelectedLocation) {
                if (inStockHere) {
                    topBadgeText = `Sẵn ${locStock} ${unitLabel} tại ${shortLocName}`;
                    stockSummaryLine = `Còn ${locStock} ${unitLabel} tại ${shortLocName}`;
                } else if (totalStock > 0) {
                    topBadgeText = `Tạm hết tại ${shortLocName}`;
                    topBadgeOut = true;
                    stockSummaryLine = `Còn ${totalStock} ${unitLabel} ở ${branchCount} cơ sở khác`;
                } else {
                    topBadgeText = 'Tạm hết hàng';
                    topBadgeOut = true;
                    stockSummaryLine = 'Hết hàng toàn hệ thống';
                }
            } else {
                if (totalStock > 0) {
                    topBadgeText = groupType === 'ACCESSORY' ? 'Phụ kiện chính hãng' : 'Chính hãng · Xuất VAT';
                    stockSummaryLine = `Còn ${totalStock} ${unitLabel}${branchCount > 0 ? ` (${branchCount} cơ sở)` : ''}`;
                } else {
                    topBadgeText = 'Tạm hết hàng';
                    topBadgeOut = true;
                    stockSummaryLine = 'Tạm hết kho';
                }
            }

            const price = Number(p.price) || 0;
            const discountPct = 8 + ((Number(p.id) || idx) % 9);
            const oldPrice = price > 0 ? Math.round((price / (1 - discountPct / 100)) / 10000) * 10000 : 0;

            return `
                <article class="tgdd-product-card">
                    <a href="detailproductuser.html?id=${p.id}" class="tgdd-card-img-wrap">
                        <img src="${img}" alt="${safeName}" loading="lazy" />
                    </a>

                    <span class="tgdd-installment-tag ${topBadgeOut ? 'out' : ''}">
                        ${topBadgeText}
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
                        <span><span class="tgdd-star">★</span> 4.9 • ${stockSummaryLine}</span>
                    </div>

                    ${canBuy ? `
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
    if (!cityFilterTabs || !branchListEl) return;
    const cities = [...new Set(allBranches.map(b => b.city).filter(Boolean))];

    cityFilterTabs.innerHTML = cities.map(city =>
        `<button type="button" class="city-tab ${city === selectedCity ? 'active' : ''}" data-city="${city}">${city}</button>`
    ).join('');

    cityFilterTabs.querySelectorAll('.city-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCity = btn.dataset.city;
            renderBranches();
        });
    });

    const filtered = allBranches.filter(b => b.city === selectedCity);

    branchListEl.innerHTML = filtered.map(b => {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;
        const hours = b.openingHours || b.hours || '8:00 - 21:00';
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
                        <span>${hours} · ${b.phone || CONFIG.HOTLINE} · ${b.services || 'Bán hàng · Sửa chữa · Bảo hành'}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                    <a href="${mapUrl}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">Chỉ đường</a>
                    <button type="button" class="btn btn-sm btn-filter-by-branch" style="border: 1px solid #288AD6; color: #288AD6; background: rgba(40,138,214,0.06); font-weight: 600;"
                        data-branch-id="${b.id}"
                        data-branch-city="${b.city}"
                        data-branch-name="${(b.name || '').replace(/"/g, '&quot;')}">
                        Xem kho cơ sở này
                    </button>
                    <button type="button" class="btn btn-sm btn-pick-branch" style="background: var(--brand-green-soft); color: var(--brand-green); font-weight: 600;" data-branch="${b.name} — ${b.address}">
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
            repairBranchSelect.value = btn.dataset.branch;
            toast.info('Đã chọn chi nhánh tiếp nhận.');
            document.getElementById('repairName')?.focus();
        });
    });
}

function populateRepairBranchSelect() {
    if (!repairBranchSelect) return;
    repairBranchSelect.innerHTML = allBranches.map(b =>
        `<option value="${b.name} — ${b.address}">${b.name} (${b.city})</option>`
    ).join('');
}

function initServiceMethodToggle() {
    const radios = document.querySelectorAll('input[name="repairMethod"]');
    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            const isHome = radio.value === 'AT_HOME';
            repairBranchGroup.style.display = isHome ? 'none' : 'flex';
            repairHomeAddrGroup.style.display = isHome ? 'flex' : 'none';
            repairHomeAddress.required = isHome;

            document.querySelectorAll('[data-method-label]').forEach(lbl => {
                lbl.classList.toggle('active', lbl.dataset.methodLabel === radio.value);
            });
        });
    });
}

function initServiceRateCards() {
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
}

function initRepairForm() {
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
        const branch = repairBranchSelect.value;
        const homeAddr = repairHomeAddress.value.trim();
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

            bookingReceipt.style.display = 'block';
            bookingReceipt.innerHTML = `
                <div style="font-weight: 700; color: var(--brand-green); margin-bottom: 6px; font-size: var(--text-sm);">
                    ✓ ĐẶT LỊCH THÀNH CÔNG — MÃ PHIẾU: <span class="tabular-nums">#${code}</span>
                </div>
                <div style="color: var(--text-primary); line-height: 1.65; font-size: var(--text-xs);">
                    <div>• Khách hàng: <b>${saved.customerName}</b> (<span class="tabular-nums">${saved.customerPhone}</span>)</div>
                    <div>• Hình thức: <b>${locationText}</b></div>
                    <div>• Thiết bị &amp; Dịch vụ: <b>${saved.deviceModel}</b> — ${saved.serviceType}</div>
                    <div>• Thời gian hẹn: <b class="tabular-nums">${saved.appointmentTime} ngày ${saved.appointmentDate}</b></div>
                </div>
            `;

            toast.success(`Đã xác nhận lịch hẹn sửa chữa #${code}!`);
            repairForm.reset();
            dateInput.value = todayStr;
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

// ==================== 3. EVENT LISTENERS ====================
groupTypeTabs?.querySelectorAll('[data-group]').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedGroup = btn.dataset.group || 'ALL';
        selectedCategory = '';
        selectedBrand = '';
        selectedPriceKey = '';
        renderFilterPills();
        renderPricePills();
        loadProducts(0);
    });
});

document.getElementById('btnCatalogLocation')?.addEventListener('click', () => {
    window.openHkLocationModal?.();
});

chkInStockOnly?.addEventListener('change', () => {
    inStockOnly = chkInStockOnly.checked;
    loadProducts(0);
});

window.addEventListener('hk:location-changed', () => {
    loadProducts(0);
});

sortLinksGroup?.querySelectorAll('[data-sort]').forEach(btn => {
    btn.addEventListener('click', () => {
        sortMode = btn.dataset.sort || 'featured';
        loadProducts(0);
    });
});

document.getElementById('btnSearch')?.addEventListener('click', () => {
    searchQuery = searchInput.value.trim();
    const headerInput = document.getElementById('headerSearchInput');
    if (headerInput) headerInput.value = searchQuery;
    loadProducts(0);
});

searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchQuery = searchInput.value.trim();
        const headerInput = document.getElementById('headerSearchInput');
        if (headerInput) headerInput.value = searchQuery;
        loadProducts(0);
    }
});

btnResetFilter?.addEventListener('click', () => {
    selectedGroup = 'ALL';
    selectedCategory = '';
    selectedBrand = '';
    selectedPriceKey = '';
    inStockOnly = false;
    if (chkInStockOnly) chkInStockOnly.checked = false;
    searchQuery = '';
    if (searchInput) searchInput.value = '';
    const headerInput = document.getElementById('headerSearchInput');
    if (headerInput) headerInput.value = '';
    sortMode = 'featured';
    renderFilterPills();
    renderPricePills();
    loadProducts(0);
});

function initQuickSupportForm() {
    const form = document.getElementById('homeQuickSupportForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!auth.isAuthenticated()) {
            toast.warning('Vui lòng đăng nhập để gửi và theo dõi yêu cầu hỗ trợ.');
            setTimeout(() => {
                window.location.href = `${CONFIG.ROUTES.LOGIN}?redirect=${encodeURIComponent(window.location.href)}`;
            }, 700);
            return;
        }
        const subject = document.getElementById('qsSubject')?.value.trim();
        const message = document.getElementById('qsMessage')?.value.trim();
        if (!subject || !message) return;

        const btn = document.getElementById('btnSubmitQuickSupport');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Đang gửi...';
        }
        try {
            await api.post(CONFIG.ENDPOINTS.SUPPORT.CREATE, { subject, message });
            toast.success('Đã gửi yêu cầu hỗ trợ thành công! Bạn có thể theo dõi trong mục Tài khoản → Yêu cầu hỗ trợ.');
            form.reset();
        } catch (err) {
            toast.error(err.message || 'Không thể gửi yêu cầu hỗ trợ.');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Gửi hỗ trợ';
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initStoreLayout({ activeNav: 'home' });
    if (searchQuery && searchInput) searchInput.value = searchQuery;
    renderBranches();
    populateRepairBranchSelect();
    initServiceMethodToggle();
    initServiceRateCards();
    initRepairForm();
    initQuickSupportForm();
    loadFilters();
    loadProducts(0);
});
