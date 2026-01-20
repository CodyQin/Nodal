import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { chatWithContext } from '../services/api';
import { GraphData, ChatMessage } from '../types';

interface ChatPanelProps {
  graphData: GraphData;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ graphData }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: 'Hi! I\'ve analyzed the story graph. Ask me anything about the characters or relationships!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    
    // Capture current history before adding new message (or include new message, depending on backend logic)
    // We pass the history SO FAR, and the new message is passed explicitly as 'message'
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatWithContext(userMsg, graphData, history);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error answering that.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-nodal-card border-l border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-nodal-dark/50">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bot className="text-blue-500" />
          Graph Assistant
        </h3>
        <p className="text-xs text-gray-400 mt-1">Powered by Gemini 3</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-md ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-gray-700 text-gray-100 rounded-bl-none border border-gray-600'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-gray-700 rounded-2xl rounded-bl-none p-3 flex items-center gap-2 border border-gray-600">
                <Loader2 className="animate-spin w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700 bg-nodal-dark/30">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about relations..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500 transition-all"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors shadow-lg"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
