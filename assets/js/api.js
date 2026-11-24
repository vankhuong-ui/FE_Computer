/**
 * api.js - Core Unified HTTP Client for Spring Boot BE
 * Handles:
 * - Credentials & CORS inclusion
 * - JWT Bearer token injection
 * - Automatic 401 refresh-token rotation
 * - Consistent ApiResponse<T> unwrapping
 */

import { CONFIG } from './config.js';
import { toast } from './toast.js';

let accessToken = sessionStorage.getItem('accessToken') || null;
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

export const setAccessToken = (token) => {
    accessToken = token;
    if (token) {
        sessionStorage.setItem('accessToken', token);
    } else {
        sessionStorage.removeItem('accessToken');
    }
};

export const getStoredAccessToken = () => accessToken;

/**
 * Request helper with auto-refresh mechanism
 */
export async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config = {
        ...options,
        headers,
        signal: options.signal || (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(25000) : undefined),
        credentials: 'include' // Required for HTTP-only refreshToken cookie
    };

    try {
        let response = await fetch(url, config);

        // Handle Token Expiration (401 Unauthorized)
        if (response.status === 401 && !options._retry && !endpoint.includes('/refresh-token') && !endpoint.includes('/login')) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    config.headers['Authorization'] = `Bearer ${token}`;
                    return fetch(url, config).then(handleResponse);
                });
            }

            options._retry = true;
            isRefreshing = true;

            try {
                const refreshRes = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
                    method: 'POST',
                    credentials: 'include'
                });

                if (refreshRes.ok) {
                    const refreshData = await refreshRes.json();
                    const newToken = refreshData?.data?.accessToken || refreshData?.result?.accessToken || refreshData?.accessToken;
                    if (newToken) {
                        setAccessToken(newToken);
                        processQueue(null, newToken);
                        config.headers['Authorization'] = `Bearer ${newToken}`;
                        return await fetch(url, config).then(handleResponse);
                    }
                }
                throw new Error('Session expired');
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                setAccessToken(null);
                sessionStorage.removeItem('accountInfo');
                // Redirect to login if user was in a protected route
                const path = window.location.pathname;
                if (path.includes('admin') || path.includes('profile') || path.includes('checkout') || path.includes('order')) {
                    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    setTimeout(() => {
                        window.location.href = CONFIG.ROUTES.LOGIN;
                    }, 1200);
                }
                throw refreshErr;
            } finally {
                isRefreshing = false;
            }
        }

        return await handleResponse(response);
    } catch (err) {
        console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, err);
        throw err;
    }
}

/**
 * Handle and parse Spring Boot ApiResponse<T>
 */
async function handleResponse(response) {
    let json = {};
    const text = await response.text();
    
    if (text) {
        try {
            json = JSON.parse(text);
        } catch (_) {
            json = { message: text };
        }
    }

    const appLevelError = json && typeof json === 'object' && typeof json.code === 'number'
        && ![1000, 1001, 200].includes(json.code);

    if (!response.ok || appLevelError) {
        let errorMsg = json?.message || json?.error || `Lỗi máy chủ (${response.status})`;
        const fieldErrors = json?.result || json?.data;
        if (errorMsg === 'List of error' && fieldErrors && typeof fieldErrors === 'object') {
            const firstMsg = Object.values(fieldErrors).find(v => typeof v === 'string' && v.trim());
            if (firstMsg) errorMsg = firstMsg;
        }
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = json;
        throw error;
    }

    // Spring Boot ApiResponse wrapper unpack: { status, message, data / result }
    if (json && typeof json === 'object') {
        if ('data' in json) return json.data;
        if ('result' in json) return json.result;
    }

    return json;
}

/**
 * HTTP Method shortcuts
 */
export const api = {
    get(endpoint, params = {}) {
        const queryString = new URLSearchParams(
            Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        ).toString();
        const fullUrl = queryString ? `${endpoint}?${queryString}` : endpoint;
        return request(fullUrl, { method: 'GET' });
    },

    post(endpoint, body = {}) {
        return request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },

    put(endpoint, body = {}) {
        return request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },

    patch(endpoint, body = {}) {
        return request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return request(endpoint, { method: 'DELETE' });
    }
};
