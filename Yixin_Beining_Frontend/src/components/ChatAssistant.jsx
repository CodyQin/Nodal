import React, { useState, useRef, useEffect } from 'react';

const ChatAssistant = () => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: 'Hello! I am your AI Assistant powered by Gemini. Ask me anything about the characters, plot, or themes.' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        const userMsg = { id: Date.now(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setTimeout(() => {
            const aiMsg = { id: Date.now() + 1, sender: 'ai', text: 'Analyzing story context...' };
            setMessages(prev => [...prev, aiMsg]);
        }, 800);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* 标题栏 - 模仿 Figma 样式 */}
            <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #F0F2F5',
                display: 'flex', alignItems: 'center', gap: '10px'
            }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    backgroundColor: '#FF9900', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', fontSize: '18px'
                }}>
                    AI
                </div>
                <div>
                    <div style={{ fontWeight: 'bold', color: '#303133', fontSize: '15px' }}>AI Assistant</div>
                    <div style={{ fontSize: '12px', color: '#909399' }}>Powered by Gemini</div>
                </div>
            </div>

            {/* 消息区 */}
            <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                backgroundColor: 'white',
                display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
                {messages.map((msg) => (
                    <div key={msg.id} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                        <div style={{
                            maxWidth: '85%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            borderTopLeftRadius: msg.sender === 'ai' ? '2px' : '12px',
                            borderTopRightRadius: msg.sender === 'user' ? '2px' : '12px',
                            backgroundColor: msg.sender === 'user' ? '#5B4EF6' : '#F7F8FA',
                            color: msg.sender === 'user' ? 'white' : '#303133',
                            fontSize: '14px', lineHeight: '1.6',
                            boxShadow: msg.sender === 'user' ? '0 2px 8px rgba(91, 78, 246, 0.2)' : 'none'
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* 输入框区 */}
            <div style={{ padding: '20px', borderTop: '1px solid #F0F2F5' }}>
                <div style={{
                    display: 'flex', gap: '10px',
                    background: '#F7F8FA', padding: '8px', borderRadius: '12px',
                    border: '1px solid #E4E7ED'
                }}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            padding: '8px', fontSize: '14px', color: '#303133'
                        }}
                    />
                    <button onClick={handleSend} style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: '#5B4EF6', color: 'white', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatAssistant;