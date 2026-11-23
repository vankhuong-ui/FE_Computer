/**
 * admin-layout.js - Shared Sidebar, Responsive Drawer & Topbar for HK COMPUTER Admin Portal
 * Unified SVG iconography (stroke-width 1.75), zero emojis
 */

import { theme } from './theme.js?v=6';
import { auth } from './auth.js';

const ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>',
    products: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
    categories: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    brands: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
    inventory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    orders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>',
    payments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>',
    repairs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>',
    warranty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>',
    support: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    accounts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    addresses: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
};

const MENU_GROUPS = [
    {
        label: 'Tổng quan',
        items: [
            { id: 'dashboard', href: 'trangchu-admin.html', label: 'Bảng điều khiển' }
        ]
    },
    {
        label: 'Danh mục & Kho',
        items: [
            { id: 'products', href: 'admin-product.html', label: 'Sản phẩm' },
            { id: 'categories', href: 'admin-category.html', label: 'Danh mục' },
            { id: 'brands', href: 'admin-brand.html', label: 'Thương hiệu' },
            { id: 'inventory', href: 'admin-inventory.html', label: 'Tồn kho' }
        ]
    },
    {
        label: 'Kinh doanh & Dịch vụ',
        items: [
            { id: 'orders', href: 'admin-orders.html', label: 'Đơn hàng' },
            { id: 'payments', href: 'admin-payment.html', label: 'Thanh toán' },
            { id: 'repairs', href: 'admin-repairs.html', label: 'Lịch hẹn sửa chữa' },
            { id: 'warranty', href: 'admin-warranty.html', label: 'Bảo hành điện tử' },
            { id: 'support', href: 'admin-support.html', label: 'Hỗ trợ khách hàng' }
        ]
    },
    {
        label: 'Người dùng',
        items: [
            { id: 'accounts', href: 'admin-account.html', label: 'Tài khoản' },
            { id: 'addresses', href: 'admin-address.html', label: 'Sổ địa chỉ' }
        ]
    }
];

export function initAdminLayout({ active = 'dashboard', title = 'Bảng điều khiển' } = {}) {
    const sidebarHost = document.getElementById('adminSidebar');
    if (sidebarHost) {
        sidebarHost.className = 'admin-sidebar';
        sidebarHost.innerHTML = `
            <a href="trangchu-admin.html" class="admin-brand">
                <span style="color: var(--brand-green); font-weight: 800;">HK</span>
                <span style="font-weight: 700;">COMPUTER</span>
                <span class="admin-brand-tag">Admin</span>
            </a>
            <ul class="admin-menu">
                ${MENU_GROUPS.map(g => `
                    <li class="admin-menu-section-label">${g.label}</li>
                    ${g.items.map(item => `
                        <li class="admin-menu-item">
                            <a href="${item.href}" class="${active === item.id ? 'active' : ''}">
                                ${ICONS[item.id] || ''}
                                <span>${item.label}</span>
                            </a>
                        </li>
                    `).join('')}
                `).join('')}
            </ul>
        `;
    }

    let backdrop = document.getElementById('adminSidebarBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'adminSidebarBackdrop';
        backdrop.className = 'admin-sidebar-backdrop';
        document.body.appendChild(backdrop);
    }

    const closeDrawer = () => {
        sidebarHost?.classList.remove('open');
        backdrop.classList.remove('open');
    };
    backdrop.addEventListener('click', closeDrawer);

    const todayText = new Date().toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const topbarHost = document.getElementById('adminTopbar');
    if (topbarHost) {
        topbarHost.className = 'admin-topbar';
        topbarHost.innerHTML = `
            <div class="admin-topbar-left">
                <button type="button" id="btnAdminMenuToggle" class="admin-menu-toggle" aria-label="Mở menu quản trị">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <div class="admin-topbar-title">${title}</div>
                <span class="admin-topbar-date tabular-nums">${todayText}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button type="button" class="theme-toggle-btn" data-theme-toggle aria-label="Chuyển giao diện Sáng/Tối"></button>
                <a href="index.html" class="btn btn-outline btn-sm">
                    <span>Cửa hàng</span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
                <div id="authNavArea"></div>
            </div>
        `;

        document.getElementById('btnAdminMenuToggle')?.addEventListener('click', () => {
            sidebarHost?.classList.toggle('open');
            backdrop.classList.toggle('open');
        });
    }

    theme.init();
    auth.initHeaderNav();
}
