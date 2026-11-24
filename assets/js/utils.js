/**
 * utils.js - Shared Frontend Utilities (HK COMPUTER)
 * Reuses cached Intl formatters to avoid per-render instantiation overhead.
 */

const VND_CURRENCY_FORMATTER = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
});

const VND_PLAIN_FORMATTER = new Intl.NumberFormat('vi-VN');

const HTML_ESCAPE_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

export function formatPrice(amount) {
    return VND_CURRENCY_FORMATTER.format(Number(amount) || 0);
}

export function formatVnd(amount) {
    return `${VND_PLAIN_FORMATTER.format(Math.round(Number(amount) || 0))}₫`;
}

export function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    const d = new Date(dateInput);
    return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('vi-VN');
}

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}

export function isValidVietnamPhone(phone) {
    return /^0\d{9}$/.test(String(phone ?? '').trim());
}

export function debounce(fn, delayMs = 300) {
    let timerId = null;
    return function debounced(...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => fn.apply(this, args), delayMs);
    };
}
