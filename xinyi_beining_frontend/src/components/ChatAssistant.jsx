import React, { useState, useRef, useEffect } from 'react';

const ChatAssistant = () => {
    // 聊天记录的状态
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: '你好！我是基于 Gemini AI 的智能助手。你可以问我关于这部小说的任何问题，比如人物关系、剧情发展、主题分析等。'
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef(null);

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 发送消息
    const handleSend = () => {
        if (!inputValue.trim()) return;

        // 1. 添加用户的消息
        const userMsg = { id: Date.now(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");

        // 2. 模拟 AI 回复 (以后这里接真的后端)
        setTimeout(() => {
            const aiMsg = {
                id: Date.now() + 1,
                sender: 'ai',
                text: '我现在还没接通大脑（后端），不过我已经听到了您说：' + inputValue
            };
            setMessages(prev => [...prev, aiMsg]);
        }, 1000);
    };

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px', // 放在右上角
            width: '320px',
            height: '500px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            zIndex: 2000 // 保证压在地球上面
        }}>
            {/* --- 头部 Header --- */}
            <div style={{
                padding: '15px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                background: '#fff'
            }}>
                {/* 橘色图标 */}
                <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: '#FFA500', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: '10px', color: 'white', fontWeight: 'bold'
                }}>
                    {/* 简单的机器人 SVG 图标 */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                    </svg>
                </div>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>AI 助手</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>由 Gemini 驱动</div>
                </div>
            </div>

            {/* --- 消息列表区域 --- */}
            <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#f9f9f9' }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        display: 'flex',
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        marginBottom: '10px'
                    }}>
                        {/* AI 头像 */}
                        {msg.sender === 'ai' && (
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', background: '#FFA500',
                                marginRight: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span style={{ color: 'white', fontSize: '12px' }}>🤖</span>
                            </div>
                        )}

                        {/* 气泡 */}
                        <div style={{
                            maxWidth: '75%',
                            padding: '10px 14px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            backgroundColor: msg.sender === 'user' ? '#8A2BE2' : '#F0F2F5', // 用户紫，AI灰
                            color: msg.sender === 'user' ? 'white' : '#333',
                            borderTopLeftRadius: msg.sender === 'ai' ? '2px' : '12px',
                            borderTopRightRadius: msg.sender === 'user' ? '2px' : '12px',
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* --- 底部输入框 --- */}
            <div style={{ padding: '15px', borderTop: '1px solid #eee', background: '#fff', display: 'flex' }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="输入你的问题..."
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        outline: 'none',
                        fontSize: '14px'
                    }}
                />
                <button
                    onClick={handleSend}
                    style={{
                        marginLeft: '10px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: '#9370DB', // 浅紫色
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* 发送纸飞机图标 */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChatAssistant;