/**
 * chat-widget.js - Upgraded Modern AI Advisor Chat UI for HK COMPUTER
 * Features:
 * - Pulsing online assistant header + Reset Conversation button
 * - Interactive Quick Prompt Chips for 1-tap product/branch/warranty/repair queries
 * - Animated 3-dot Typing Indicator while waiting for Groq AI
 * - Safe XSS-escaped Markdown formatting with styled Product CTA & Service Action Pills
 * - Session-scoped Redis conversation memory (`sessionId`) + Mobile 360px+ safe-area layout
 */

import { api } from './api.js';
import { CONFIG } from './config.js';

const QUICK_PROMPTS = [
    'Laptop Dell dưới 15 triệu',
    'Dell Latitude 7490 ở Hà Nội còn không?',
    'Chính sách bảo hành điện tử',
    'Hướng dẫn đặt lịch sửa máy'
];

const WELCOME_MESSAGE = 'Xin chào! Mình là trợ lý AI của **HK COMPUTER** (3 chi nhánh: Hà Nội · TP.HCM · Đà Nẵng). Bạn cần chọn máy theo ngân sách, kiểm tra tồn kho theo chi nhánh, tra cứu bảo hành hay đặt lịch sửa chữa?';

export function formatChatMarkdown(text) {
    const safe = String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const withLinks = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => {
        const cleanHref = href.trim();
        const isProduct = /^detailproductuser\.html\?(id=\d+|slug=[a-z0-9-]+)$/i.test(cleanHref);
        const isAllowed =
            isProduct ||
            /^(checkout\.html|cart\.html|warranty\.html|order\.html|index\.html(#repair-center)?)$/i.test(cleanHref) ||
            /^https:\/\/vankhuongdev\.id\.vn\/[a-z0-9\-._~:/?#=&]*$/i.test(cleanHref);
        if (!isAllowed) {
            return label;
        }
        const extraCls = isProduct ? ' product-cta' : '';
        return `<a href="${cleanHref}" class="ai-action-link${extraCls}">${label} &rarr;</a>`;
    });

    return withLinks.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

class GeminiChatWidget {
    constructor() {
        this.isOpen = false;
        this.isSending = false;
        this.messages = [this.createMessage('assistant', WELCOME_MESSAGE)];
        this.render();
    }

    createMessage(role, text) {
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return { role, text, time };
    }

    getSessionId(forceNew = false) {
        let sessionId = !forceNew ? sessionStorage.getItem('hk_chat_session_id') : null;
        if (!sessionId) {
            sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
            sessionStorage.setItem('hk_chat_session_id', sessionId);
        }
        return sessionId;
    }

    render() {
        if (document.getElementById('gemini-chat-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'gemini-chat-widget';
        widget.innerHTML = `
            <style>
                .ai-fab {
                    position: fixed;
                    bottom: 22px;
                    right: 22px;
                    height: 50px;
                    padding: 0 16px;
                    background: linear-gradient(135deg, #007A3D 0%, #00A854 100%);
                    color: #FFFFFF;
                    border: 1px solid rgba(255, 255, 255, 0.22);
                    border-radius: 9999px;
                    display: inline-flex;
                    align-items: center;
                    gap: 9px;
                    font-family: var(--font-sans);
                    font-size: 13.5px;
                    font-weight: 700;
                    cursor: pointer;
                    z-index: 1000;
                    box-shadow: 0 10px 28px rgba(0, 139, 69, 0.36);
                    transition: transform 180ms ease, box-shadow 180ms ease;
                }
                .ai-fab:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 14px 32px rgba(0, 139, 69, 0.45);
                }
                .ai-fab-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #86EFAC;
                    box-shadow: 0 0 0 3px rgba(134, 239, 172, 0.32);
                }
                .ai-panel {
                    display: none;
                    position: fixed;
                    bottom: 82px;
                    right: 22px;
                    width: 392px;
                    max-width: calc(100vw - 28px);
                    height: 550px;
                    max-height: calc(100dvh - 110px);
                    background: var(--surface, #FFFFFF);
                    color: var(--text-primary, #0F172A);
                    border: 1px solid var(--border, #E2E8F0);
                    border-radius: 18px;
                    box-shadow: 0 22px 50px rgba(15, 23, 42, 0.24);
                    z-index: 1001;
                    flex-direction: column;
                    overflow: hidden;
                    animation: aiPanelIn 180ms ease-out;
                }
                @keyframes aiPanelIn {
                    from { opacity: 0; transform: translateY(10px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .ai-panel-header {
                    padding: 13px 15px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    background: linear-gradient(135deg, #006B35 0%, #008B45 100%);
                    color: #FFFFFF;
                }
                .ai-header-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                }
                .ai-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.16);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .ai-panel-title {
                    font-size: 13.5px;
                    font-weight: 700;
                    line-height: 1.25;
                }
                .ai-panel-sub {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.86);
                    margin-top: 2px;
                }
                .ai-online-pulse {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #4ADE80;
                    display: inline-block;
                }
                .ai-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .ai-icon-btn {
                    width: 30px;
                    height: 30px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.12);
                    border: none;
                    color: #FFFFFF;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 140ms ease;
                }
                .ai-icon-btn:hover {
                    background: rgba(255, 255, 255, 0.24);
                }
                .ai-panel-messages {
                    flex: 1;
                    padding: 14px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 11px;
                    background: var(--canvas, #F4F6F8);
                }
                .ai-msg-row {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }
                .ai-msg-row.user {
                    align-items: flex-end;
                }
                .ai-msg-row.assistant {
                    align-items: flex-start;
                }
                .ai-msg {
                    padding: 10px 13px;
                    border-radius: 14px;
                    font-size: 13px;
                    line-height: 1.55;
                    max-width: 88%;
                    white-space: pre-wrap;
                    word-break: break-word;
                }
                .ai-msg-assistant {
                    background: var(--surface, #FFFFFF);
                    color: var(--text-primary, #0F172A);
                    border: 1px solid var(--border, #E2E8F0);
                    border-bottom-left-radius: 4px;
                    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
                }
                .ai-msg-user {
                    background: linear-gradient(135deg, #007A3D 0%, #009B4D 100%);
                    color: #FFFFFF;
                    border-bottom-right-radius: 4px;
                    box-shadow: 0 3px 10px rgba(0, 139, 69, 0.22);
                }
                .ai-msg-time {
                    font-size: 10px;
                    color: var(--text-muted, #94A3B8);
                    padding: 0 4px;
                }
                .ai-quick-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    padding: 8px 12px;
                    background: var(--surface, #FFFFFF);
                    border-top: 1px solid var(--border, #E2E8F0);
                }
                .ai-quick-chip {
                    font-family: inherit;
                    font-size: 11.5px;
                    font-weight: 600;
                    padding: 5px 10px;
                    border-radius: 999px;
                    border: 1px solid rgba(0, 139, 69, 0.28);
                    background: rgba(0, 139, 69, 0.06);
                    color: #007A3D;
                    cursor: pointer;
                    transition: all 140ms ease;
                }
                .ai-quick-chip:hover {
                    background: #008B45;
                    color: #FFFFFF;
                    border-color: #008B45;
                }
                .ai-typing {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 2px;
                }
                .ai-typing span {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #008B45;
                    opacity: 0.4;
                    animation: aiBounce 1.2s infinite ease-in-out;
                }
                .ai-typing span:nth-child(2) { animation-delay: 0.2s; }
                .ai-typing span:nth-child(3) { animation-delay: 0.4s; }
                @keyframes aiBounce {
                    0%, 80%, 100% { transform: scale(0.8); opacity: 0.35; }
                    40% { transform: scale(1.15); opacity: 1; }
                }
                .ai-panel-footer {
                    padding: 10px 12px;
                    border-top: 1px solid var(--border, #E2E8F0);
                    background: var(--surface, #FFFFFF);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .ai-panel-input {
                    flex: 1;
                    padding: 9px 13px;
                    border: 1px solid var(--border, #E2E8F0);
                    border-radius: 10px;
                    font-size: 13px;
                    background: var(--surface-subtle, #F8FAFC);
                    color: var(--text-primary, #0F172A);
                    outline: none;
                }
                .ai-panel-input:focus {
                    border-color: #008B45;
                    box-shadow: 0 0 0 3px rgba(0, 139, 69, 0.14);
                }
                .ai-send-btn {
                    height: 38px;
                    padding: 0 14px;
                    border-radius: 10px;
                    border: none;
                    background: #008B45;
                    color: #FFFFFF;
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    flex-shrink: 0;
                    transition: background-color 140ms ease;
                }
                .ai-send-btn:hover { background: #006B35; }
                .ai-send-btn:disabled { opacity: 0.55; cursor: not-allowed; }
                .ai-action-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    margin: 5px 6px 2px 0;
                    padding: 5px 11px;
                    border-radius: 999px;
                    background: rgba(0, 139, 69, 0.1);
                    color: #007A3D;
                    font-size: 12px;
                    font-weight: 700;
                    text-decoration: none;
                    border: 1px solid rgba(0, 139, 69, 0.28);
                    transition: all 140ms ease;
                }
                .ai-action-link:hover {
                    background: #008B45;
                    color: #FFFFFF;
                }
                .ai-action-link.product-cta {
                    background: #0F172A;
                    color: #FFFFFF;
                    border-color: #0F172A;
                }
                .ai-action-link.product-cta:hover {
                    background: #008B45;
                    border-color: #008B45;
                }
                @media (max-width: 760px) {
                    .ai-fab {
                        bottom: calc(68px + env(safe-area-inset-bottom, 0px));
                        right: 12px;
                        height: 44px;
                        padding: 0 13px;
                        font-size: 12.5px;
                    }
                    .ai-panel {
                        bottom: calc(118px + env(safe-area-inset-bottom, 0px));
                        right: 10px;
                        width: calc(100vw - 20px);
                        height: min(470px, 68dvh);
                    }
                    .ai-panel-input {
                        font-size: 16px;
                    }
                }
            </style>

            <button type="button" class="ai-fab" id="btnToggleAi" aria-label="Trợ lý AI HK COMPUTER" title="Trợ lý AI Tư vấn Laptop & PC">
                <span class="ai-fab-dot"></span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Trợ lý AI</span>
            </button>

            <div class="ai-panel" id="aiPanel">
                <div class="ai-panel-header">
                    <div class="ai-header-brand">
                        <span class="ai-avatar" aria-hidden="true">
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                                <circle cx="12" cy="5" r="2"></circle>
                                <path d="M12 7v4"></path>
                                <line x1="8" y1="16" x2="8" y2="16"></line>
                                <line x1="16" y1="16" x2="16" y2="16"></line>
                            </svg>
                        </span>
                        <div>
                            <div class="ai-panel-title">Trợ lý AI — HK COMPUTER</div>
                            <div class="ai-panel-sub">
                                <span class="ai-online-pulse"></span>
                                <span>Trực tuyến · Kho Hà Nội, TP.HCM, Đà Nẵng</span>
                            </div>
                        </div>
                    </div>
                    <div class="ai-header-actions">
                        <button type="button" class="ai-icon-btn" id="btnResetAi" title="Bắt đầu cuộc trò chuyện mới" aria-label="Làm mới hội thoại">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                        </button>
                        <button type="button" class="ai-icon-btn" id="btnCloseAi" title="Thu gọn khung chat" aria-label="Đóng">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>

                <div class="ai-panel-messages" id="aiMessagesContainer"></div>

                <div class="ai-quick-chips" id="aiQuickChips">
                    ${QUICK_PROMPTS.map(prompt => `
                        <button type="button" class="ai-quick-chip" data-quick-prompt="${prompt.replace(/"/g, '&quot;')}">${prompt}</button>
                    `).join('')}
                </div>

                <div class="ai-panel-footer">
                    <input type="text" class="ai-panel-input" id="aiInput" placeholder="Hỏi giá máy, tồn kho chi nhánh, bảo hành..." />
                    <button type="button" class="ai-send-btn" id="btnSendAi">Gửi</button>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        const btnToggle = widget.querySelector('#btnToggleAi');
        const btnClose = widget.querySelector('#btnCloseAi');
        const btnReset = widget.querySelector('#btnResetAi');
        const panel = widget.querySelector('#aiPanel');
        const input = widget.querySelector('#aiInput');
        const btnSend = widget.querySelector('#btnSendAi');
        const chipsHost = widget.querySelector('#aiQuickChips');

        btnToggle.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            panel.style.display = this.isOpen ? 'flex' : 'none';
            if (this.isOpen) {
                this.renderMessages();
                input.focus();
            }
        });

        btnClose.addEventListener('click', () => {
            this.isOpen = false;
            panel.style.display = 'none';
        });

        btnReset.addEventListener('click', () => {
            this.getSessionId(true);
            this.messages = [this.createMessage('assistant', WELCOME_MESSAGE)];
            if (chipsHost) chipsHost.style.display = 'flex';
            this.renderMessages();
        });

        const sendQuery = async (rawQuery) => {
            const query = String(rawQuery || '').trim();
            if (!query || this.isSending) return;

            this.isSending = true;
            btnSend.disabled = true;
            if (chipsHost) chipsHost.style.display = 'none';

            this.messages.push(this.createMessage('user', query));
            input.value = '';
            this.messages.push({ role: 'assistant', typing: true, text: '', time: '' });
            this.renderMessages();

            try {
                const sessionId = this.getSessionId(false);
                const response = await api.post(CONFIG.ENDPOINTS.CHAT_AI.SEND, { message: query, sessionId });
                this.messages.pop();
                const replyText = typeof response === 'string'
                    ? response
                    : (response?.data || response?.result || response?.message || 'Mình chưa nhận được phản hồi, bạn thử hỏi lại nhé!');
                this.messages.push(this.createMessage('assistant', replyText));
            } catch (_) {
                this.messages.pop();
                this.messages.push(this.createMessage('assistant', 'Hiện không thể kết nối tới trợ lý AI. Bạn vui lòng thử lại sau vài giây nhé!'));
            } finally {
                this.isSending = false;
                btnSend.disabled = false;
                this.renderMessages();
                input.focus();
            }
        };

        chipsHost?.querySelectorAll('[data-quick-prompt]').forEach(btn => {
            btn.addEventListener('click', () => sendQuery(btn.dataset.quickPrompt));
        });

        btnSend.addEventListener('click', () => sendQuery(input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendQuery(input.value);
        });
    }

    formatMessage(text) {
        return formatChatMarkdown(text);
    }

    renderMessages() {
        const container = document.getElementById('aiMessagesContainer');
        if (!container) return;
        container.innerHTML = this.messages.map(m => {
            if (m.typing) {
                return `
                    <div class="ai-msg-row assistant">
                        <div class="ai-msg ai-msg-assistant">
                            <span class="ai-typing" aria-label="Đang trả lời"><span></span><span></span><span></span></span>
                        </div>
                    </div>
                `;
            }
            return `
                <div class="ai-msg-row ${m.role}">
                    <div class="ai-msg ai-msg-${m.role}">${this.formatMessage(m.text)}</div>
                    ${m.time ? `<span class="ai-msg-time">${m.time}</span>` : ''}
                </div>
            `;
        }).join('');
        container.scrollTop = container.scrollHeight;
    }
}

export const chatWidget = typeof document !== 'undefined' ? new GeminiChatWidget() : null;
