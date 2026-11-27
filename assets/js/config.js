/**
 * config.js - Central Configuration for HK COMPUTER (FE_Computer)
 *
 * Nguồn dữ liệu chi nhánh:
 * - Nguồn chính thức (Authoritative Source): API Backend `GET /api/branches` (nạp qua `branch-store.js`).
 * - `FALLBACK_BRANCHES`: Khớp 1:1 với 3 chi nhánh trọng điểm trong Flyway `V20` (`HN-THAIHA`, `HCM-QUAN10`, `DN-HAICHAU`).
 *   CHỈ dùng làm giá trị khởi tạo tức thời khi trang vừa mở (trước khi API phản hồi) hoặc khi máy chủ Backend tạm mất kết nối.
 */

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const defaultApiUrl = isLocalhost ? 'http://localhost:8080' : 'https://be-computer.onrender.com';

const LOCATION_STORAGE_KEY = 'hk_selected_location_v1';

const safeStorage = {
    get(key) {
        try {
            return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
        } catch (_) {
            return null;
        }
    },
    set(key, value) {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
        } catch (_) {}
    }
};

export const FALLBACK_BRANCHES = Object.freeze([
    Object.freeze({
        id: 1,
        code: 'HN-THAIHA',
        city: 'Hà Nội',
        district: 'Q. Đống Đa',
        name: 'HK COMPUTER - Thái Hà',
        address: '123 Thái Hà, P. Trung Liệt, Q. Đống Đa, Hà Nội',
        phone: '024 7300 6801',
        openingHours: '8:00 - 21:00',
        hours: '8:00 - 21:00',
        services: 'Showroom Chính · Sửa Laptop trong ngày · Bảo hành',
        active: true
    }),
    Object.freeze({
        id: 2,
        code: 'HCM-QUAN10',
        city: 'TP.HCM',
        district: 'Q. 10',
        name: 'HK COMPUTER - Quận 10',
        address: '456 Cách Mạng Tháng 8, P. 11, Q. 10, TP.HCM',
        phone: '028 7300 6804',
        openingHours: '8:00 - 21:00',
        hours: '8:00 - 21:00',
        services: 'Showroom Miền Nam · Build PC · Bảo hành 1 đổi 1',
        active: true
    }),
    Object.freeze({
        id: 3,
        code: 'DN-HAICHAU',
        city: 'Đà Nẵng',
        district: 'Q. Thanh Khê',
        name: 'HK COMPUTER - Hải Châu',
        address: '142 Hàm Nghi, P. Thạc Gián, Q. Thanh Khê, Đà Nẵng',
        phone: '0236 730 6807',
        openingHours: '8:00 - 20:30',
        hours: '8:00 - 20:30',
        services: 'Showroom Miền Trung · Sửa chữa Laptop & PC · Bảo hành',
        active: true
    })
]);

export const CONFIG = {
    BRAND_NAME: 'HK COMPUTER',
    HOTLINE: '1800 6889',
    OPEN_HOURS: '8:00 - 21:00 (T2 - CN)',
    API_BASE_URL: safeStorage.get('CUSTOM_API_BASE_URL') || defaultApiUrl,

    // Khởi tạo từ FALLBACK_BRANCHES và sẽ được branch-store.js ghi đè bằng dữ liệu sống từ GET /api/branches
    BRANCHES: FALLBACK_BRANCHES.map(b => ({ ...b })),
    BRANCH_SOURCE: 'FALLBACK', // 'FALLBACK' | 'API'

    getSelectedLocation() {
        try {
            const raw = safeStorage.get(LOCATION_STORAGE_KEY);
            if (!raw) return { city: '', branchId: null, branchName: '', label: 'Toàn quốc' };
            const parsed = JSON.parse(raw);
            return {
                city: parsed.city || '',
                branchId: parsed.branchId ? Number(parsed.branchId) : null,
                branchName: parsed.branchName || '',
                label: parsed.label || (parsed.branchName ? parsed.branchName.replace('HK COMPUTER - ', '') : (parsed.city || 'Toàn quốc'))
            };
        } catch (_) {
            return { city: '', branchId: null, branchName: '', label: 'Toàn quốc' };
        }
    },

    setSelectedLocation(loc) {
        const clean = {
            city: loc?.city || '',
            branchId: loc?.branchId ? Number(loc.branchId) : null,
            branchName: loc?.branchName || '',
            label: loc?.label || (loc?.branchName ? `${loc.city ? loc.city + ' · ' : ''}${loc.branchName.replace('HK COMPUTER - ', '')}` : (loc?.city || 'Toàn quốc'))
        };
        safeStorage.set(LOCATION_STORAGE_KEY, JSON.stringify(clean));
        if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
            window.dispatchEvent(new CustomEvent('hk:location-changed', { detail: clean }));
        }
        return clean;
    },

    ENDPOINTS: {
        AUTH: {
            LOGIN: '/api/account/login',
            REGISTER: '/api/account/register',
            LOGOUT: '/api/account/logout',
            REFRESH_TOKEN: '/api/account/refresh-token',
            SEARCH_EMAIL: '/api/account/gmail',
            SEND_OTP: '/api/account/send-code',
            CHECK_OTP: '/api/account/check-code',
            FORGOT_PASSWORD: '/api/account/forgot-password',
            SET_GOOGLE_PASSWORD: '/api/account/set-gg-password',
            CHECK_PASSWORD: '/api/account/check-password',
            ADMIN_LIST: '/api/account',
            ADMIN_ENABLE: (id) => `/api/account/${id}/enable`,
            USER_ADDRESS_MY: '/api/useraddresses/user',
            USER_ADDRESS_CREATE: '/api/useraddresses/create',
            USER_ADDRESS_UPDATE: (id) => `/api/useraddresses/${id}/update`,
            USER_ADDRESS_DELETE: (id) => `/api/useraddresses/${id}/delete`,
        },
        BRANCHES: {
            LIST: '/api/branches',
            ADMIN_ALL: '/api/branches/admin/all',
            CREATE: '/api/branches/create',
            UPDATE: (id) => `/api/branches/${id}/update`,
            DELETE: (id) => `/api/branches/${id}/delete`,
        },
        PRODUCTS: {
            LIST: '/api/products',
            CATALOG: '/api/products/catalog',
            SEARCH: '/api/products/search',
            DETAIL: (id) => `/api/products/${id}/detailproduct`,
            DETAIL_BY_SLUG: (slug) => `/api/products/slug/${encodeURIComponent(slug)}`,
            BY_BRAND: (brandId) => `/api/products/${brandId}/product_brands`,
            BY_CATEGORY: (catId) => `/api/products/${catId}/product_categories`,
            BY_CAT_AND_BRAND: (catId, brandId) => `/api/products/${catId}/${brandId}/product_categories_brands`,
            CREATE: '/api/products/create',
            UPDATE: (id) => `/api/products/${id}/update`,
            DELETE: (id) => `/api/products/${id}/delete`,
        },
        BRANDS: {
            LIST: '/api/brands',
            SEARCH: '/api/brands/search',
            CREATE: '/api/brands/create',
            UPDATE: (id) => `/api/brands/${id}/update`,
            DELETE: (id) => `/api/brands/${id}/delete`,
        },
        CATEGORIES: {
            LIST: '/api/categories',
            CREATE: '/api/categories/create',
            UPDATE: (id) => `/api/categories/${id}/update`,
            DELETE: (id) => `/api/categories/${id}/delete`,
        },
        INVENTORY: {
            LIST: '/api/inventory',
            CREATE: '/api/inventory/create',
            UPDATE_STOCK: (id) => `/api/inventory/${id}/soluong`,
            ADJUST_STOCK: (id) => `/api/inventory/${id}/adjust`,
            TRANSFER: '/api/inventory/transfer',
            SEARCH: '/api/inventory/search',
            USER_DETAIL: (productId) => `/api/inventory/${productId}/user`,
            PRODUCT_BRANCHES: (productId) => `/api/inventory/${productId}/branches`,
        },
        CART: {
            GET: '/api/cart/my-cart',
            ADD: '/api/cart/add',
            UPDATE: (productId, quality) => `/api/cart/${productId}/update?quality=${quality}`,
            REMOVE: (cartId) => `/api/cart/${cartId}`,
        },
        ORDERS: {
            LIST: '/api/orders',
            MY_ORDERS: '/api/orders/my-orders',
            DETAIL: (id) => `/api/orders/${id}`,
            CREATE: '/api/orders/create',
            CANCEL: (id) => `/api/orders/${id}/cancel`,
            UPDATE_ADDRESS: (id, addressId) => `/api/orders/${id}/update-address?address_id=${addressId}`,
            ADMIN_UPDATE_STATUS: (id, status) => `/api/orders/${id}/update-status?status=${status}`,
        },
        PAYMENT: {
            VNPAY_CREATE: (orderId) => `/api/payment/create-vnpay/${orderId}`,
            SEPAY_CREATE: (orderId) => `/api/payment/create-sepay/${orderId}`,
            SEPAY_WEBHOOK: '/api/payment/sepay-webhook',
            VERIFY: '/api/payment/verify',
            HISTORY: '/api/payment/order/history',
            LATEST: (orderId) => `/api/payment/order/${orderId}/latest`,
        },
        REVIEW: {
            LIST_BY_PRODUCT: (productId) => `/api/reviews/product/${productId}`,
            CREATE: '/api/reviews',
            CHECK: '/api/reviews/check',
        },
        WARRANTY: {
            LOOKUP: '/api/warranty/lookup',
            MY_CARDS: '/api/warranty/my-cards',
            MY_CLAIMS: '/api/warranty/my-claims',
            CREATE_CLAIM: '/api/warranty/claims',
            ADMIN_ALL: '/api/warranty/admin/all',
            ADMIN_UPDATE_STATUS: (id, status) => `/api/warranty/admin/${id}/status?status=${status}`,
        },
        REPAIRS: {
            CREATE: '/api/repairs',
            MY_BOOKINGS: '/api/repairs/my-bookings',
            ADMIN_ALL: '/api/repairs/admin/all',
            ADMIN_UPDATE_STATUS: (id, status) => `/api/repairs/admin/${id}/status?status=${status}`,
        },
        CHAT_AI: {
            SEND: '/api/chat',
        },
        ADMIN_DASHBOARD: {
            SUMMARY: '/api/admin/dashboard/summary',
        }
    },

    ROUTES: {
        HOME: 'index.html',
        LOGIN: 'dang-nhap.html',
        REGISTER: 'dang-ky.html',
        CART: 'cart.html',
        CHECKOUT: 'checkout.html',
        PROFILE: 'profile.html',
        ORDERS: 'order.html',
        WARRANTY: 'warranty.html',
        ADMIN_DASHBOARD: 'trangchu-admin.html',
        ADMIN_BRANCHES: 'admin-branches.html',
        ADMIN_WARRANTY: 'admin-warranty.html',
        ADMIN_REPAIRS: 'admin-repairs.html',
        ADMIN_LOGIN: 'dang-nhap-admin.html',
        PAYMENT_RESULT: 'payment-result.html',
    }
};
