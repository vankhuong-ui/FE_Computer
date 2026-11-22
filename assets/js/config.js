/**
 * config.js - Central Configuration for FE_Computer
 * Synchronized 1:1 with BE_Computer Spring Boot API
 */

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const defaultApiUrl = isLocalhost ? 'http://localhost:8080' : 'https://hoang89computer-be.onrender.com';

export const CONFIG = {
    // API Base URL - prioritizes localStorage override, then environment detection
    API_BASE_URL: localStorage.getItem('CUSTOM_API_BASE_URL') || defaultApiUrl,

    // Spring Boot Endpoints mapping 1:1 with backend controllers
    ENDPOINTS: {
        // AUTH (AccountController, UseradressController)
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
        // PRODUCT (ProductController, BrandsController, CategoriesController, InventoryController)
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
        // ORDER (CartController, OrderController, PaymentController)
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
        // REVIEW, SUPPORT, WARRANTY & AI CHAT
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
        CHAT_AI: {
            SEND: '/api/chat',
        }
    },

    // App routes
    ROUTES: {
        HOME: 'index.html',
        LEGACY_HOME: 'trangchu.html',
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
        ADMIN_LOGIN: 'dang-nhap-admin.html',
        PAYMENT_RESULT: 'payment-result.html',
    }
};
