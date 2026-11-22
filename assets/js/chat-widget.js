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
            </style>

            <button type="button" class="ai-fab" id="btnToggleAi" aria-label="AI Tư vấn Laptop" title="AI Tư vấn Laptop">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="ai-fab-label">AI Tư vấn Laptop</span>
            </button>

            <div class="ai-panel" id="aiPanel">
                <div class="ai-panel-header">
                    <span class="ai-panel-title">AI Tư vấn Laptop — HK COMPUTER</span>
                    <button type="button" class="ai-panel-close" id="btnCloseAi">×</button>
                </div>
                <div class="ai-panel-messages" id="aiMessagesContainer"></div>
                <div class="ai-panel-footer">
                    <input type="text" class="ai-panel-input" id="aiInput" placeholder="VD: Laptop văn phòng dưới 20 triệu?..." />
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
                const response = await api.post(CONFIG.ENDPOINTS.CHAT_AI.SEND, { message: query });
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

    renderMessages() {
        const container = document.getElementById('aiMessagesContainer');
        if (!container) return;
        container.innerHTML = this.messages.map(m => `<div class="ai-msg ai-msg-${m.role}">${m.text}</div>`).join('');
        container.scrollTop = container.scrollHeight;
    }
}

export const chatWidget = new GeminiChatWidget();
