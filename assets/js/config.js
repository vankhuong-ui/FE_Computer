/**
 * config.js - Central Configuration for HK COMPUTER (FE_Computer)
 * Synchronized 1:1 with BE_Computer Spring Boot API
 */

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultApiUrl = isLocalhost ? 'http://localhost:8080' : 'https://be-computer.onrender.com';

export const CONFIG = {
    BRAND_NAME: 'HK COMPUTER',
    HOTLINE: '1800 6889',
    OPEN_HOURS: '8:00 - 21:00 (T2 - CN)',
    API_BASE_URL: localStorage.getItem('CUSTOM_API_BASE_URL') || defaultApiUrl,

    // 10 Chi nhÃ¡nh Cá»­a hÃ ng & Trung tÃ¢m Sá»­a chá»¯a Laptop/PC
    BRANCHES: [
        { id: 1, city: 'HÃ  Ná»™i', name: 'HK COMPUTER â€” ThÃ¡i HÃ ', address: '123 ThÃ¡i HÃ , P. Trung Liá»‡t, Q. Äá»‘ng Äa, HÃ  Ná»™i', phone: '024 7300 6801', hours: '8:00 - 21:00', services: 'BÃ¡n hÃ ng â€¢ Sá»­a Laptop láº¥y ngay â€¢ Báº£o hÃ nh' },
        { id: 2, city: 'HÃ  Ná»™i', name: 'HK COMPUTER â€” Cáº§u Giáº¥y', address: '268 XuÃ¢n Thá»§y, P. Dá»‹ch Vá»ng Háº­u, Q. Cáº§u Giáº¥y, HÃ  Ná»™i', phone: '024 7300 6802', hours: '8:00 - 21:00', services: 'Sá»­a Laptop â€¢ Vá»‡ sinh â€¢ NÃ¢ng cáº¥p RAM/SSD' },
        { id: 3, city: 'HÃ  Ná»™i', name: 'HK COMPUTER â€” Hai BÃ  TrÆ°ng', address: '89 LÃª Thanh Nghá»‹, P. BÃ¡ch Khoa, Q. Hai BÃ  TrÆ°ng, HÃ  Ná»™i', phone: '024 7300 6803', hours: '8:00 - 21:00', services: 'Build PC Gaming â€¢ Sá»­a pháº§n cá»©ng chuyÃªn sÃ¢u' },
        { id: 4, city: 'TP.HCM', name: 'HK COMPUTER â€” Quáº­n 10', address: '456 CÃ¡ch Máº¡ng ThÃ¡ng 8, P. 11, Q. 10, TP.HCM', phone: '028 7300 6804', hours: '8:00 - 21:00', services: 'Showroom chÃ­nh â€¢ Báº£o hÃ nh 1 Ä‘á»•i 1' },
        { id: 5, city: 'TP.HCM', name: 'HK COMPUTER â€” BÃ¬nh Tháº¡nh', address: '175 XÃ´ Viáº¿t Nghá»‡ TÄ©nh, P. 17, Q. BÃ¬nh Tháº¡nh, TP.HCM', phone: '028 7300 6805', hours: '8:00 - 21:00', services: 'Sá»­a Laptop láº¥y ngay â€¢ CÃ i Ä‘áº·t pháº§n má»m' },
        { id: 6, city: 'TP.HCM', name: 'HK COMPUTER â€” Thá»§ Äá»©c', address: '312 VÃµ VÄƒn NgÃ¢n, P. BÃ¬nh Thá», TP. Thá»§ Äá»©c, TP.HCM', phone: '028 7300 6806', hours: '8:00 - 21:00', services: 'BÃ¡n Laptop Sinh viÃªn â€¢ NÃ¢ng cáº¥p linh kiá»‡n' },
        { id: 7, city: 'ÄÃ  Náºµng', name: 'HK COMPUTER â€” Háº£i ChÃ¢u', address: '142 HÃ m Nghi, P. Tháº¡c GiÃ¡n, Q. Thanh KhÃª, ÄÃ  Náºµng', phone: '0236 730 6807', hours: '8:00 - 20:30', services: 'BÃ¡n hÃ ng â€¢ Sá»­a chá»¯a Laptop & PC' },
        { id: 8, city: 'Háº£i PhÃ²ng', name: 'HK COMPUTER â€” NgÃ´ Quyá»n', address: '98 Láº¡ch Tray, Q. NgÃ´ Quyá»n, Háº£i PhÃ²ng', phone: '0225 730 6808', hours: '8:00 - 20:30', services: 'Sá»­a Laptop â€¢ Vá»‡ sinh â€¢ Tiáº¿p nháº­n Báº£o hÃ nh' },
        { id: 9, city: 'Cáº§n ThÆ¡', name: 'HK COMPUTER â€” Ninh Kiá»u', address: '215 ÄÆ°á»ng 3/2, P. HÆ°ng Lá»£i, Q. Ninh Kiá»u, Cáº§n ThÆ¡', phone: '0292 730 6809', hours: '8:00 - 20:30', services: 'Showroom Miá»n TÃ¢y â€¢ Sá»­a chá»¯a & Báº£o hÃ nh' },
        { id: 10, city: 'BÃ¬nh DÆ°Æ¡ng', name: 'HK COMPUTER â€” Thá»§ Dáº§u Má»™t', address: '405 Äáº¡i lá»™ BÃ¬nh DÆ°Æ¡ng, P. PhÃº CÆ°á»ng, TP. Thá»§ Dáº§u Má»™t', phone: '0274 730 6810', hours: '8:00 - 20:30', services: 'BÃ¡n Laptop/PC â€¢ Sá»­a chá»¯a láº¥y ngay' }
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
