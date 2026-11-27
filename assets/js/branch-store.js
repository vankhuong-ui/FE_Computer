/**
 * branch-store.js - Unified Branch Source of Truth for FE_Computer
 *
 * Quy ước:
 * 1. Luôn ưu tiên gọi `GET /api/branches` làm nguồn dữ liệu chính (cập nhật `CONFIG.BRANCHES` và `CONFIG.BRANCH_SOURCE = 'API'`).
 * 2. Dùng cơ chế single-flight promise (`inflightPromise`) để Header, Catalog và Modal sửa chữa không gọi trùng API.
 * 3. Chỉ sử dụng `FALLBACK_BRANCHES` (3 cơ sở trọng điểm: HN-THAIHA, HCM-QUAN10, DN-HAICHAU) khi API chưa phản hồi hoặc lỗi mạng.
 */

import { api } from './api.js';
import { CONFIG, FALLBACK_BRANCHES } from './config.js';

let cachedBranches = FALLBACK_BRANCHES.map(normalizeBranch);
let hasLoadedFromApi = false;
let inflightPromise = null;

export function normalizeBranch(branch) {
    return {
        ...branch,
        hours: branch?.openingHours || branch?.hours || '8:00 - 21:00'
    };
}

export function getCachedBranches() {
    return cachedBranches;
}

export async function loadActiveBranches({ force = false, fetcher = null } = {}) {
    if (hasLoadedFromApi && !force) {
        return cachedBranches;
    }
    if (inflightPromise && !force) {
        return inflightPromise;
    }

    const requestFn = fetcher || (() => api.get(CONFIG.ENDPOINTS.BRANCHES.LIST));
    inflightPromise = (async () => {
        try {
            const res = await requestFn();
            if (Array.isArray(res) && res.length > 0) {
                cachedBranches = res.map(normalizeBranch);
                CONFIG.BRANCHES = cachedBranches;
                CONFIG.BRANCH_SOURCE = 'API';
                hasLoadedFromApi = true;
            }
        } catch (_) {
            if (!hasLoadedFromApi) {
                cachedBranches = FALLBACK_BRANCHES.map(normalizeBranch);
                CONFIG.BRANCHES = cachedBranches;
                CONFIG.BRANCH_SOURCE = 'FALLBACK';
            }
        } finally {
            inflightPromise = null;
        }
        return cachedBranches;
    })();

    return inflightPromise;
}

export function resetBranchStoreForTest() {
    cachedBranches = FALLBACK_BRANCHES.map(normalizeBranch);
    CONFIG.BRANCHES = cachedBranches;
    CONFIG.BRANCH_SOURCE = 'FALLBACK';
    hasLoadedFromApi = false;
    inflightPromise = null;
}
