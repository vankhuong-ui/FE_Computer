/**
 * chat-widget.js - Compact Circular AI Laptop Advisor Button (HK COMPUTER)
 * Minimal unobtrusive fab that expands label on hover; full Light & Dark mode contrast.
 */

import { api } from './api.js';
import { CONFIG } from './config.js';

class GeminiChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [
            {
                role: 'assistant',
                text: 'Xin chào! Tôi là trợ lý AI Tư vấn Laptop & PC của HK COMPUTER. Bạn cần chọn máy theo ngân sách, kiểm tra tồn kho hay tư vấn nâng cấp?'
            }
        ];
        this.render();
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
                    height: 46px;
                    padding: 0 14px;
                    background: #008B45;
                    color: #FFFFFF;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    border-radius: 9999px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-family: var(--font-sans);
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    z-index: 1000;
                    box-shadow: 0 8px 22px rgba(0, 139, 69, 0.32);
                    transition: transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
                }
                .ai-fab:hover {
                    background: #006B35;
                    transform: translateY(-2px);
                    box-shadow: 0 10px 26px rgba(0, 139, 69, 0.42);
                }
                .ai-fab-label {
                    max-width: 0;
                    overflow: hidden;
                    white-space: nowrap;
                    opacity: 0;
                    transition: max-width 220ms ease, opacity 180ms ease;
                }
                .ai-fab:hover .ai-fab-label,
                .ai-fab:focus-visible .ai-fab-label {
                    max-width: 150px;
                    opacity: 1;
                }
                .ai-panel {
                    display: none;
                    position: fixed;
                    bottom: 78px;
                    right: 22px;
                    width: 360px;
                    max-width: calc(100vw - 32px);
                    height: 460px;
                    background: var(--surface, #FFFFFF);
                    color: var(--text-primary, #0F172A);
                    border: 1px solid var(--border, #E2E8F0);
                    border-radius: 14px;
                    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
                    z-index: 1001;
                    flex-direction: column;
                    overflow: hidden;
                }
                .ai-panel-header {
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #008B45;
                    color: #FFFFFF;
                }
                .ai-panel-title {
                    font-size: 13px;
                    font-weight: 700;
                }
                .ai-panel-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 20px;
                    color: #FFFFFF;
                    line-height: 1;
                }
                .ai-panel-messages {
                    flex: 1;
                    padding: 14px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    background: var(--canvas, #F4F6F8);
                }
                .ai-msg {
                    padding: 10px 12px;
                    border-radius: 10px;
                    font-size: 13px;
                    line-height: 1.5;
                    max-width: 86%;
                    white-space: pre-wrap;
                }
                .ai-msg-assistant {
                    background: var(--surface, #FFFFFF);
                    color: var(--text-primary, #0F172A);
                    border: 1px solid var(--border, #E2E8F0);
                    align-self: flex-start;
                }
                .ai-msg-user {
                    background: #008B45;
                    color: #FFFFFF;
                    align-self: flex-end;
                }
                .ai-panel-footer {
                    padding: 10px 12px;
                    border-top: 1px solid var(--border, #E2E8F0);
                    background: var(--surface, #FFFFFF);
                    display: flex;
                    gap: 8px;
                }
                .ai-panel-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid var(--border, #E2E8F0);
                    border-radius: 8px;
                    font-size: 13px;
                    background: var(--surface-subtle, #F8FAFC);
                    color: var(--text-primary, #0F172A);
                    outline: none;
                }
                .ai-panel-input:focus {
                    border-color: #008B45;
                }
                .ai-action-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin: 4px 6px 2px 0;
                    padding: 4px 10px;
                    border-radius: 999px;
                    background: rgba(0, 139, 69, 0.12);
                    color: #008B45;
                    font-size: 12px;
                    font-weight: 600;
                    text-decoration: none;
                    border: 1px solid rgba(0, 139, 69, 0.28);
                    transition: background-color 150ms ease, color 150ms ease;
                }
                .ai-action-link:hover {
                    background: #008B45;
                    color: #FFFFFF;
                }
                @media (max-width: 760px) {
                    .ai-fab {
                        bottom: calc(70px + env(safe-area-inset-bottom, 0px));
                        right: 14px;
                        height: 42px;
                        padding: 0 12px;
                    }
                    .ai-panel {
                        bottom: calc(120px + env(safe-area-inset-bottom, 0px));
                        right: 12px;
                        width: calc(100vw - 24px);
                        height: min(430px, 68dvh);
                    }
                    .ai-panel-input {
                        font-size: 16px;
                    }
                }
            </style>

            <button type="button" class="ai-fab" id="btnToggleAi" aria-label="Tư vấn cấu hình & Dịch vụ" title="Tư vấn cấu hình & Dịch vụ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="ai-fab-label">Tư vấn cấu hình</span>
            </button>

            <div class="ai-panel" id="aiPanel">
                <div class="ai-panel-header">
                    <span class="ai-panel-title">Tư vấn cấu hình &amp; Dịch vụ — HK COMPUTER</span>
                    <button type="button" class="ai-panel-close" id="btnCloseAi">×</button>
                </div>
                <div class="ai-panel-messages" id="aiMessagesContainer"></div>
                <div class="ai-panel-footer">
                    <input type="text" class="ai-panel-input" id="aiInput" placeholder="Nhập nhu cầu sử dụng hoặc dòng máy cần tư vấn..." />
                    <button type="button" class="btn btn-primary btn-sm" id="btnSendAi">Gửi</button>
                </div>
            </div>
        `;

        document.body.appendChild(widget);

        const btnToggle = widget.querySelector('#btnToggleAi');
        const btnClose = widget.querySelector('#btnCloseAi');
        const panel = widget.querySelector('#aiPanel');
        const input = widget.querySelector('#aiInput');
        const btnSend = widget.querySelector('#btnSendAi');

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

        const handleSend = async () => {
            const query = input.value.trim();
            if (!query) return;

            this.messages.push({ role: 'user', text: query });
            input.value = '';
            this.renderMessages();

            this.messages.push({ role: 'assistant', text: 'Đang tư vấn...' });
            this.renderMessages();

            try {
                let sessionId = sessionStorage.getItem('hk_chat_session_id');
                if (!sessionId) {
                    sessionId = 'sess_' + Math.random().toString(36).slice(2, 11);
                    sessionStorage.setItem('hk_chat_session_id', sessionId);
                }
                const response = await api.post(CONFIG.ENDPOINTS.CHAT_AI.SEND, { message: query, sessionId });
                this.messages.pop();
                const replyText = typeof response === 'string' ? response : (response?.data || response?.message || 'Không có câu trả lời');
                this.messages.push({ role: 'assistant', text: replyText });
            } catch (err) {
                this.messages.pop();
                this.messages.push({ role: 'assistant', text: 'Không thể kết nối tới trợ lý AI. Vui lòng thử lại sau.' });
            }
            this.renderMessages();
        };

        btnSend.addEventListener('click', handleSend);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });
    }

    formatMessage(text) {
        const safe = String(text ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        const withLinks = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => {
            const cleanHref = href.trim();
            const isAllowed =
                /^(detailproductuser\.html\?(id=\d+|slug=[a-z0-9-]+)|checkout\.html|cart\.html|warranty\.html|support\.html|order\.html|index\.html)$/i.test(cleanHref) ||
                /^https:\/\/vankhuongdev\.id\.vn\/[a-z0-9\-._~:/?#=&]*$/i.test(cleanHref);
            if (!isAllowed) {
                return label;
            }
            return `<a href="${cleanHref}" class="ai-action-link">${label} &rarr;</a>`;
        });

        return withLinks.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    }

    renderMessages() {
        const container = document.getElementById('aiMessagesContainer');
        if (!container) return;
        container.innerHTML = this.messages.map(m => `<div class="ai-msg ai-msg-${m.role}">${this.formatMessage(m.text)}</div>`).join('');
        container.scrollTop = container.scrollHeight;
    }
}

export const chatWidget = new GeminiChatWidget();
