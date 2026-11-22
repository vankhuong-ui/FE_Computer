/**
 * admin-layout.js - Shared Minimalist Sidebar & Topbar for HK COMPUTER Admin Portal
 */

import { theme } from './theme.js';
import { auth } from './auth.js';

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
                <span class="badge badge-info" style="margin-left: auto;">Admin</span>
            </a>
            <ul class="admin-menu">
                ${MENU_GROUPS.map(g => `
                    <li class="admin-menu-section-label">${g.label}</li>
                    ${g.items.map(item => `
                        <li class="admin-menu-item">
                            <a href="${item.href}" class="${active === item.id ? 'active' : ''}">${item.label}</a>
                        </li>
                    `).join('')}
                `).join('')}
            </ul>
        `;
    }

    const topbarHost = document.getElementById('adminTopbar');
    if (topbarHost) {
        topbarHost.className = 'admin-topbar';
        topbarHost.innerHTML = `
            <div style="font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-primary);">
                ${title}
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button type="button" class="theme-toggle-btn" data-theme-toggle aria-label="Chuyển giao diện Sáng/Tối">🌙</button>
                <a href="index.html" class="btn btn-outline btn-sm">Xem cửa hàng</a>
                <div id="authNavArea"></div>
            </div>
        `;
    }

    theme.init();
    auth.initHeaderNav();
}
