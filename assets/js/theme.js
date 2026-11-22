/**
 * theme.js - Persistent Light / Dark Theme Manager for HK COMPUTER
 */

const STORAGE_KEY = 'hk_theme';

export const theme = {
    getCurrent() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') return saved;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    apply(mode) {
        const finalMode = mode === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', finalMode);
        localStorage.setItem(STORAGE_KEY, finalMode);
        this.syncButtons(finalMode);
        window.dispatchEvent(new CustomEvent('theme:changed', { detail: { theme: finalMode } }));
    },

    toggle() {
        const next = this.getCurrent() === 'dark' ? 'light' : 'dark';
        this.apply(next);
        return next;
    },

    syncButtons(mode) {
        document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
            const isDark = mode === 'dark';
            btn.setAttribute('aria-label', isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối');
            btn.setAttribute('title', isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối');
            btn.innerHTML = isDark ? '☀️' : '🌙';
        });
    },

    init() {
        const current = this.getCurrent();
        this.apply(current);
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-theme-toggle]');
            if (btn) {
                this.toggle();
            }
        });
    }
};

// Apply immediately upon module load to prevent flash
theme.apply(theme.getCurrent());
