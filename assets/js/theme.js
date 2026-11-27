/**
 * theme.js - Fixed Clean Light Retail Theme for HK COMPUTER
 */

export const theme = {
    getCurrent() {
        return 'light';
    },

    apply() {
        if (typeof document === 'undefined') return;
        document.documentElement.setAttribute('data-theme', 'light');
        try {
            localStorage.removeItem('hk_theme');
        } catch (_) {}
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.remove());
    },

    toggle() {
        this.apply();
        return 'light';
    },

    syncButtons() {
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => btn.remove());
    },

    init() {
        this.apply();
    }
};

theme.apply();
