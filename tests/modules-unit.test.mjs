import test from 'node:test';
import assert from 'node:assert/strict';

import { CONFIG, FALLBACK_BRANCHES } from '../assets/js/config.js';
import { handleResponse } from '../assets/js/api.js';
import { loadActiveBranches, getCachedBranches, resetBranchStoreForTest } from '../assets/js/branch-store.js';
import { formatVnd, escapeHtml, isValidVietnamPhone } from '../assets/js/utils.js';
import { splitCompareSpecs, createProductComparator } from '../assets/js/product-compare.js';
import { inferCategoryGroup, parseSpecTags } from '../assets/js/home.js';
import { formatChatMarkdown } from '../assets/js/chat-widget.js';

test('FALLBACK_BRANCHES matches backend 3 core branches 1:1 and documents fallback source', () => {
    resetBranchStoreForTest();
    assert.equal(FALLBACK_BRANCHES.length, 3);
    assert.deepEqual(
        FALLBACK_BRANCHES.map(b => b.code),
        ['HN-THAIHA', 'HCM-QUAN10', 'DN-HAICHAU']
    );
    assert.equal(CONFIG.BRANCH_SOURCE, 'FALLBACK');
});

test('branch-store switches CONFIG.BRANCH_SOURCE to API on success and keeps FALLBACK on failure', async () => {
    resetBranchStoreForTest();

    const failedResult = await loadActiveBranches({
        force: true,
        fetcher: async () => { throw new Error('Network offline'); }
    });
    assert.equal(CONFIG.BRANCH_SOURCE, 'FALLBACK');
    assert.equal(failedResult.length, 3);

    const livePayload = [
        { id: 1, code: 'HN-THAIHA', city: 'Hà Nội', name: 'HK COMPUTER - Thái Hà', openingHours: '8:00 - 21:00' },
        { id: 2, code: 'HCM-QUAN10', city: 'TP.HCM', name: 'HK COMPUTER - Quận 10', openingHours: '8:00 - 21:00' },
        { id: 3, code: 'DN-HAICHAU', city: 'Đà Nẵng', name: 'HK COMPUTER - Hải Châu', openingHours: '8:00 - 20:30' }
    ];
    const apiResult = await loadActiveBranches({
        force: true,
        fetcher: async () => livePayload
    });
    assert.equal(CONFIG.BRANCH_SOURCE, 'API');
    assert.equal(apiResult.length, 3);
    assert.equal(getCachedBranches()[2].hours, '8:00 - 20:30');
});

test('utils formatVnd, escapeHtml, and Vietnam phone validation work accurately', () => {
    assert.equal(formatVnd(15990000), '15.990.000₫');
    assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    assert.equal(isValidVietnamPhone('0912345678'), true);
    assert.equal(isValidVietnamPhone('84912345678'), false);
    assert.equal(isValidVietnamPhone('09123'), false);
});

test('home category group inference and product comparator enforce 3-item limit', () => {
    assert.equal(inferCategoryGroup({ nameCategories: 'Chuột Gaming không dây' }), 'ACCESSORY');
    assert.equal(inferCategoryGroup({ nameCategories: 'Màn hình đồ họa 27 inch' }), 'PC');
    assert.equal(inferCategoryGroup({ nameCategories: 'Laptop Văn Phòng' }), 'LAPTOP');
    assert.deepEqual(parseSpecTags('Core i5 | 16GB RAM | 512GB SSD | FHD', 'LAPTOP', ''), ['Core i5', '16GB RAM', '512GB SSD']);

    assert.deepEqual(splitCompareSpecs('Core i7 | 16GB RAM ; 512GB SSD'), ['Core i7', '16GB RAM', '512GB SSD']);

    const mockProducts = new Map([
        [1, { id: 1, name: 'Dell 7490', price: 6990000, specs: 'i5 | 8GB' }],
        [2, { id: 2, name: 'Dell 5500', price: 8490000, specs: 'i5 | 16GB' }],
        [3, { id: 3, name: 'Asus Vivobook', price: 14990000, specs: 'i5 | 16GB' }],
        [4, { id: 4, name: 'ThinkPad T14', price: 18990000, specs: 'i7 | 16GB' }]
    ]);
    const comparator = createProductComparator({ getProductById: (id) => mockProducts.get(id) });
    comparator.toggle(1);
    comparator.toggle(2);
    comparator.toggle(3);
    comparator.toggle(4); // Exceeds max 3
    assert.equal(comparator.getList().length, 3);
    assert.equal(comparator.isSelected(4), false);

    comparator.toggle(2); // Remove #2
    assert.equal(comparator.getList().length, 2);
    comparator.clear();
    assert.equal(comparator.getList().length, 0);
});

test('chat-widget formatChatMarkdown escapes XSS and whitelists internal store links only', () => {
    const xssInput = '<img src=x onerror=alert(1)> Xem **Dell 7490** [Mua ngay](detailproductuser.html?id=5) hoặc [Đặt sửa](index.html#repair-center) hoặc [Lừa đảo](javascript:alert(1))';
    const html = formatChatMarkdown(xssInput);

    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(html.includes('<strong>Dell 7490</strong>'));
    assert.ok(html.includes('<a href="detailproductuser.html?id=5" class="ai-action-link product-cta">Mua ngay &rarr;</a>'));
    assert.ok(html.includes('<a href="index.html#repair-center" class="ai-action-link">Đặt sửa &rarr;</a>'));
    assert.ok(!html.includes('javascript:alert'));
});

test('api handleResponse unwraps ApiResponse result (code 1000/1001) and throws structured error on 400/500', async () => {
    const okRes = new Response(JSON.stringify({ code: 1001, message: 'Get branches success', result: [{ id: 1, code: 'HN-THAIHA' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await handleResponse(okRes);
    assert.equal(data.length, 1);
    assert.equal(data[0].code, 'HN-THAIHA');

    const bizErrRes = new Response(JSON.stringify({ code: 999, message: 'Số lượng tồn kho không đủ' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
    });
    await assert.rejects(() => handleResponse(bizErrRes), {
        message: 'Số lượng tồn kho không đủ',
        status: 400
    });

    const sysErrRes = new Response(JSON.stringify({ code: 500, message: 'Hệ thống đang gặp sự cố tạm thời, vui lòng thử lại sau' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
    });
    await assert.rejects(() => handleResponse(sysErrRes), {
        status: 500
    });
});
