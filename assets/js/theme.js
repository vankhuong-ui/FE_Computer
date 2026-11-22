/**
 * theme.js - Persistent Light / Dark Theme Manager with Crisp SVG Icons
 */

const STORAGE_KEY = 'hk_theme';

const SUN_SVG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>`;
const MOON_SVG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>`;

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
            btn.innerHTML = isDark ? SUN_SVG : MOON_SVG;
        });
    },

    init() {
        this.apply(this.getCurrent());
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-theme-toggle]');
            if (btn) this.toggle();
        });
    }
};

theme.apply(theme.getCurrent());
