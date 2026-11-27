/**
 * toast.js - Minimalist Notification Banner
 * Strictly follows taste-skill minimalist constraints:
 * - No loud neon colors or intrusive alert boxes
 * - Clean borders (1px solid), muted pastels, subtle slide-in animation
 */

class ToastService {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        if (typeof document === 'undefined') return;
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    show(message, type = 'info', duration = 3500) {
        if (typeof document === 'undefined') return;
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        
        // Minimal icon representation based on type
        const icons = {
            success: '✓',
            error: '✕',
            warning: '!',
            info: 'i'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || '•'}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close">×</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        const dismiss = () => {
            toast.classList.add('toast-exit');
            toast.addEventListener('animationend', () => toast.remove());
        };

        closeBtn.addEventListener('click', dismiss);

        this.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(dismiss, duration);
        }
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

export const toast = new ToastService();
