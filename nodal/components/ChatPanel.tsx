import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { chatWithContextStream } from '../services/api';
import { AnalysisResult, ChatMessage } from '../types';

interface ChatPanelProps {
  analysisResult: AnalysisResult | null;
  theme?: 'dark' | 'light';
}

const PRESET_QUESTIONS = [
  "Who are the main characters?",
  "How do relationships change?",
  "What is the main conflict?",
  "Summarize the story timeline."
];

const FormattedMessage: React.FC<{ text: string; theme: 'dark' | 'light' }> = ({ text, theme }) => {
  const lines = text.split('\n');
  
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) return <div key={lineIdx} className="h-2" />;

        // Handle bullet points
        const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
        const cleanLine = isBullet ? line.trim().substring(2) : line;

        // Process bold markers (**text**)
        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
        const content = parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={partIdx} className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex gap-2 pl-1">
              <span className="text-blue-500 font-bold">•</span>
              <span>{content}</span>
            </div>
          );
        }

        return <p key={lineIdx}>{content}</p>;
      })}
    </div>
  );
};

const ChatPanel: React.FC<ChatPanelProps> = ({ analysisResult, theme = 'dark' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: 'Hi! I\'ve analyzed the story graph. Ask me anything about the characters, relationships, or how the plot develops across phases!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (analysisResult) {
       setMessages([{ role: 'ai', content: 'Hi! I\'ve analyzed the story graph. Ask me anything about the characters, relationships, or how the plot develops across phases!' }]);
    }
  }, [analysisResult]);

  const handleSend = async (textOverride?: string | React.SyntheticEvent) => {
    const userMsg = typeof textOverride === 'string' ? textOverride : input.trim();
    if (!userMsg || isLoading || !analysisResult) return;

    if (typeof textOverride !== 'string') {
      setInput('');
    }
    
    setMessages(prev => [
      ...prev, 
      { role: 'user', content: userMsg },
      { role: 'ai', content: '' }
    ]);
    setIsLoading(true);

    const sanitizeGraphData = (nodes: any[], edges: any[]) => ({
      nodes: nodes.map(n => ({
        id: n.id,
        label_original: n.label_original,
        label_en: n.label_en,
        description: n.description_en || n.description_original || n.description,
      })),
      edges: edges.map(e => ({
        source: typeof e.source === 'object' ? (e.source as any).id : e.source,
        target: typeof e.target === 'object' ? (e.target as any).id : e.target,
        relation: {
          type: e.relation.type_en || e.relation.type_original,
          label: e.relation.label_en || e.relation.label_original,
        }
      }))
    });

    const prepareContext = (data: AnalysisResult): any => {
      if (data.timeline && data.timeline.length > 0) {
        return {
          type: "timeline_graph",
          timeline: data.timeline.map(phase => ({
            phase_id: phase.phase_id,
            phase_name_original: phase.phase_name_original,
            phase_name_en: phase.phase_name_en,
            summary_original: phase.summary_original,
            summary_en: phase.summary_en,
            graph: sanitizeGraphData(phase.graph.nodes, phase.graph.edges)
          }))
        };
      } 
      if (data.nodes) {
        return {
          type: "single_graph",
          ...sanitizeGraphData(data.nodes, data.edges || [])
        };
      }
      return {};
    };

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const cleanContext = prepareContext(analysisResult);

    try {
      await chatWithContextStream(userMsg, cleanContext, history, (chunk) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'ai') {
            newMessages[newMessages.length - 1] = {
              ...lastMsg,
              content: lastMsg.content + chunk
            };
          }
          return newMessages;
        });
      });
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'ai') {
          if (!lastMsg.content) {
             newMessages[newMessages.length - 1] = { ...lastMsg, content: 'Sorry, I encountered an error processing the graph data for chat.' };
          } else {
             newMessages[newMessages.length - 1] = { ...lastMsg, content: lastMsg.content + '\n\n[Connection Error]' };
          }
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Theme Classes
  const containerBg = isDark ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200';
  const headerBg = isDark ? 'bg-slate-900/50 border-white/10' : 'bg-slate-50/80 border-slate-200';
  const headerText = isDark ? 'text-white' : 'text-slate-800';
  const headerSubText = isDark ? 'text-gray-400' : 'text-slate-500';
  
  const aiBubbleBg = isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-slate-100 border-slate-200 text-slate-800';
  const userBubbleBg = 'bg-blue-600 text-white'; // Keep user bubble consistent/blue

  const presetBtnBg = isDark 
    ? 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/80 hover:border-blue-500/30' 
    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-blue-400';
  const presetText = isDark ? 'text-gray-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900';

  const inputAreaBg = isDark ? 'bg-slate-900/30 border-white/10' : 'bg-slate-50 border-slate-200';
  const inputBg = isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400';

  return (
    <div className={`flex flex-col h-full border-l transition-colors duration-500 ${containerBg}`}>
      {/* Header */}
      <div className={`p-4 border-b shadow-sm flex-shrink-0 backdrop-blur-sm ${headerBg}`}>
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${headerText}`}>
          <Bot className="text-blue-500" />
          Graph Assistant
        </h3>
        <p className={`text-xs mt-1 ${headerSubText}`}>Analyzing character connections & timeline</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-md border ${
                msg.role === 'user' 
                  ? `${userBubbleBg} border-blue-500 rounded-br-none` 
                  : `${aiBubbleBg} rounded-bl-none`
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <>
                  {msg.content ? (
                    <FormattedMessage text={msg.content} theme={theme} />
                  ) : (
                    <div className="flex gap-1 py-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {/* Large Preset Questions */}
        {messages.length === 1 && !isLoading && (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 px-2 mt-4">
              <p className={`text-[10px] uppercase tracking-widest font-bold mb-3 pl-1 ${headerSubText}`}>Suggested Questions</p>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all group ${presetBtnBg}`}
                  >
                    <div className="p-1.5 rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                      <Sparkles size={14} />
                    </div>
                    <span className={`text-sm font-medium ${presetText}`}>{q}</span>
                  </button>
                ))}
              </div>
           </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area Wrapper */}
      <div className={`border-t flex-shrink-0 z-20 ${inputAreaBg}`}>
        
        {/* Small Preset Chips */}
        {messages.length > 1 && !isLoading && (
          <div className="px-4 pt-3 pb-1 overflow-x-auto flex gap-2 no-scrollbar mask-fade-right">
            {PRESET_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-full border text-xs transition-all active:scale-95 flex-shrink-0 ${
                    isDark 
                    ? 'bg-gray-800/80 border-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white' 
                    : 'bg-white border-slate-300 text-slate-600 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <MessageSquare size={12} className="opacity-70" />
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Field */}
        <div className="p-4 pt-2">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about phases, summaries, or relationships..."
              className={`flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-12 border ${inputBg}`}
              disabled={isLoading || !analysisResult}
            />
            <button
              onClick={(e) => handleSend(e)}
              disabled={isLoading || !input.trim() || !analysisResult}
              className="absolute right-1.5 top-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
          <p className={`text-[10px] text-center mt-2 ${headerSubText}`}>Gemini 3 Pro Analysis</p>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;