/**
 * chat-widget.js - Gemini AI Hardware Advisor Widget
 * Directly connects to Spring Boot /api/chat (ChatController.java)
 * Minimalist design strictly compliant with taste-skill (clean borders, no gradients, no AI clichés)
 */

import { api } from './api.js';
import { CONFIG } from './config.js';

class GeminiChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [
            {
                role: 'assistant',
                text: 'Xin chào! Tôi là trợ lý AI phần cứng. Tôi có thể giúp bạn kiểm tra độ tương thích linh kiện hoặc tư vấn cấu hình máy tính phù hợp.'
            }
        ];
        this.render();
    }

    render() {
        if (document.getElementById('gemini-chat-widget')) return;

        const hasDock = !!document.getElementById('hk-floating-dock');

        const widget = document.createElement('div');
        widget.id = 'gemini-chat-widget';
        if (hasDock) widget.classList.add('has-hk-dock');
        widget.innerHTML = `
            <style>
                .ai-widget-button {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    background: #008B45;
                    color: #FFFFFF;
                    border: none;
                    border-radius: 9999px;
                    padding: 10px 18px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    z-index: 1000;
                    box-shadow: 0 6px 18px rgba(0, 139, 69, 0.28);
                    transition: transform 150ms ease, background 150ms ease;
                }
                .ai-widget-button:hover {
                    background: #006B35;
                }
                .ai-widget-button:active {
                    transform: scale(0.98);
                }
                .has-hk-dock .ai-widget-button {
                    display: none;
                }
                .ai-widget-panel {
                    display: none;
                    position: fixed;
                    bottom: 80px;
                    right: 24px;
                    width: 360px;
                    max-width: calc(100vw - 32px);
                    height: 460px;
                    background: var(--surface, #FFFFFF);
                    color: var(--text-primary, #0F172A);
                    border: 1px solid var(--border, #E5E7EB);
                    border-radius: 12px;
                    box-shadow: 0 12px 32px rgba(0,0,0,0.18);
                    z-index: 1001;
                    flex-direction: column;
                    overflow: hidden;
                }
                .has-hk-dock .ai-widget-panel {
                    bottom: 24px;
                    right: 92px;
                }
                .ai-panel-header {
                    padding: 12px 16px;
                    border-bottom: 1px solid #007339;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #008B45;
                    color: #FFFFFF;
                }
                .ai-panel-title {
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
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
                    padding: 16px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .ai-msg {
                    padding: 10px 12px;
                    border-radius: var(--radius-sm);
                    font-size: var(--text-xs);
                    line-height: 1.5;
                    max-width: 85%;
                }
                .ai-msg-assistant {
                    background: var(--surface-subtle);
                    color: var(--text-primary);
                    border: 1px solid var(--border);
                    align-self: flex-start;
                }
                .ai-msg-user {
                    background: var(--text-primary);
                    color: var(--text-inverse);
                    align-self: flex-end;
                }
                .ai-panel-footer {
                    padding: 12px;
                    border-top: 1px solid var(--border);
                    display: flex;
                    gap: 8px;
                }
                .ai-panel-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    font-size: var(--text-xs);
                    outline: none;
                }
                .ai-panel-input:focus {
                    border-color: var(--text-primary);
                }
            </style>

            <button type="button" class="ai-widget-button" id="btnToggleAi">
                <span>AI Tư Vấn Cấu Hình</span>
            </button>

            <div class="ai-widget-panel" id="aiPanel">
                <div class="ai-panel-header">
                    <span class="ai-panel-title">Tư Vấn Phần Cứng (Gemini AI)</span>
                    <button class="ai-panel-close" id="btnCloseAi">×</button>
                </div>
                <div class="ai-panel-messages" id="aiMessagesContainer"></div>
                <div class="ai-panel-footer">
                    <input type="text" class="ai-panel-input" id="aiInput" placeholder="Ví dụ: RTX 4060 đi với nguồn nào?..." />
                    <button type="button" class="btn btn-primary btn-sm" id="btnSendAi">Gửi</button>
                </div>
            </div>
        `;

        document.body.appendChild(widget);
        if (document.getElementById('hk-floating-dock')) {
            widget.classList.add('has-hk-dock');
        }

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

            // Add placeholder typing state
            this.messages.push({ role: 'assistant', text: 'Đang phân tích cấu hình...' });
            this.renderMessages();

            try {
                const response = await api.post(CONFIG.ENDPOINTS.CHAT_AI.SEND, { message: query });
                // Replace typing placeholder
                this.messages.pop();
                const replyText = typeof response === 'string' ? response : (response?.data || response?.message || 'Không có câu trả lời');
                this.messages.push({ role: 'assistant', text: replyText });
            } catch (err) {
                this.messages.pop();
                this.messages.push({ role: 'assistant', text: 'Không thể kết nối với dịch vụ tư vấn AI. Vui lòng thử lại sau.' });
            }
            this.renderMessages();
        };

        btnSend.addEventListener('click', handleSend);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    renderMessages() {
        const container = document.getElementById('aiMessagesContainer');
        if (!container) return;
        container.innerHTML = this.messages.map(m => `
            <div class="ai-msg ai-msg-${m.role}">
                ${m.text}
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    }
}

export const chatWidget = new GeminiChatWidget();
