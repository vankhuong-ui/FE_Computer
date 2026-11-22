/**
 * config.js - Central Configuration for HK COMPUTER (FE_Computer)
 * Synchronized 1:1 with BE_Computer Spring Boot API
 */

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultApiUrl = isLocalhost ? 'http://localhost:8080' : 'https://hoang89computer-be.onrender.com';

export const CONFIG = {
    BRAND_NAME: 'HK COMPUTER',
    HOTLINE: '1800 6889',
    OPEN_HOURS: '8:00 - 21:00 (T2 - CN)',
    API_BASE_URL: localStorage.getItem('CUSTOM_API_BASE_URL') || defaultApiUrl,

    // 10 Chi nhánh Cửa hàng & Trung tâm Sửa chữa Laptop/PC
    BRANCHES: [
        { id: 1, city: 'Hà Nội', name: 'HK COMPUTER — Thái Hà', address: '123 Thái Hà, P. Trung Liệt, Q. Đống Đa, Hà Nội', phone: '024 7300 6801', hours: '8:00 - 21:00', services: 'Bán hàng • Sửa Laptop lấy ngay • Bảo hành' },
        { id: 2, city: 'Hà Nội', name: 'HK COMPUTER — Cầu Giấy', address: '268 Xuân Thủy, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội', phone: '024 7300 6802', hours: '8:00 - 21:00', services: 'Sửa Laptop • Vệ sinh • Nâng cấp RAM/SSD' },
        { id: 3, city: 'Hà Nội', name: 'HK COMPUTER — Hai Bà Trưng', address: '89 Lê Thanh Nghị, P. Bách Khoa, Q. Hai Bà Trưng, Hà Nội', phone: '024 7300 6803', hours: '8:00 - 21:00', services: 'Build PC Gaming • Sửa phần cứng chuyên sâu' },
        { id: 4, city: 'TP.HCM', name: 'HK COMPUTER — Quận 10', address: '456 Cách Mạng Tháng 8, P. 11, Q. 10, TP.HCM', phone: '028 7300 6804', hours: '8:00 - 21:00', services: 'Showroom chính • Bảo hành 1 đổi 1' },
        { id: 5, city: 'TP.HCM', name: 'HK COMPUTER — Bình Thạnh', address: '175 Xô Viết Nghệ Tĩnh, P. 17, Q. Bình Thạnh, TP.HCM', phone: '028 7300 6805', hours: '8:00 - 21:00', services: 'Sửa Laptop lấy ngay • Cài đặt phần mềm' },
        { id: 6, city: 'TP.HCM', name: 'HK COMPUTER — Thủ Đức', address: '312 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM', phone: '028 7300 6806', hours: '8:00 - 21:00', services: 'Bán Laptop Sinh viên • Nâng cấp linh kiện' },
        { id: 7, city: 'Đà Nẵng', name: 'HK COMPUTER — Hải Châu', address: '142 Hàm Nghi, P. Thạc Gián, Q. Thanh Khê, Đà Nẵng', phone: '0236 730 6807', hours: '8:00 - 20:30', services: 'Bán hàng • Sửa chữa Laptop & PC' },
        { id: 8, city: 'Hải Phòng', name: 'HK COMPUTER — Ngô Quyền', address: '98 Lạch Tray, Q. Ngô Quyền, Hải Phòng', phone: '0225 730 6808', hours: '8:00 - 20:30', services: 'Sửa Laptop • Vệ sinh • Tiếp nhận Bảo hành' },
        { id: 9, city: 'Cần Thơ', name: 'HK COMPUTER — Ninh Kiều', address: '215 Đường 3/2, P. Hưng Lợi, Q. Ninh Kiều, Cần Thơ', phone: '0292 730 6809', hours: '8:00 - 20:30', services: 'Showroom Miền Tây • Sửa chữa & Bảo hành' },
        { id: 10, city: 'Bình Dương', name: 'HK COMPUTER — Thủ Dầu Một', address: '405 Đại lộ Bình Dương, P. Phú Cường, TP. Thủ Dầu Một', phone: '0274 730 6810', hours: '8:00 - 20:30', services: 'Bán Laptop/PC • Sửa chữa lấy ngay' }
    ],

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
            USER_ADDRESS_ADMIN: '/api/useraddresses',
        },
        PRODUCTS: {
            LIST: '/api/products',
            SEARCH: '/api/products/search',
            DETAIL: (id) => `/api/products/${id}/detailproduct`,
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
            SEARCH: '/api/inventory/search',
            USER_DETAIL: (productId) => `/api/inventory/${productId}/user`,
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
        SUPPORT: {
            MY_REQUESTS: '/api/support/my-requests',
            CREATE: '/api/support',
            ADMIN_ALL: '/api/support/admin/all',
            ADMIN_UPDATE_STATUS: (id, status) => `/api/support/admin/${id}/status?status=${status}`,
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
        SUPPORT: 'support.html',
        ADMIN_DASHBOARD: 'trangchu-admin.html',
        ADMIN_WARRANTY: 'admin-warranty.html',
        ADMIN_REPAIRS: 'admin-repairs.html',
        ADMIN_LOGIN: 'dang-nhap-admin.html',
        PAYMENT_RESULT: 'payment-result.html',
    }
};
