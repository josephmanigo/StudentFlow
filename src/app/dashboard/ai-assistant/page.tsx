'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';

const suggestionPrompts = [
  { label: 'Calculus Integration by Parts', query: 'Explain Integration by Parts in Calculus' },
  { label: 'Node.js Simple Web Server', query: 'Show me how to build a simple HTTP web server in Node.js' },
  { label: 'Relational DB Keys', query: 'What are Primary Keys and Foreign Keys in a database schema?' },
];

export default function AiAssistantPage() {
  const { studyChats, addChatMessage, clearChatHistory, isLocalMode } = useData();
  const { showToast } = useToast();

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [studyChats, loading]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    setInputMessage('');
    setLoading(true);

    try {
      // 1. Add User Message
      await addChatMessage(messageText, 'user');

      // 2. Fetch AI Response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: messageText }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI assistant');
      }

      const data = await response.json();
      
      // 3. Add AI Message
      await addChatMessage(data.text || 'Sorry, I encountered an issue compiling the response.', 'ai');
    } catch (err: any) {
      showToast(err.message || 'Error communicating with study assistant', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your study chat history?')) {
      clearChatHistory();
      showToast('Chat history cleared');
    }
  };

  // Simple custom Markdown rendering to avoid dependency bloat
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeContent: string[] = [];

    return lines.map((line, idx) => {
      // Code block detection
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const codeStr = codeContent.join('\n');
          codeContent = [];
          return (
            <pre key={idx} className="bg-slate-950/60 text-sky-200 p-4 rounded-xl text-xs font-mono my-2 overflow-x-auto border border-white/10">
              <code>{codeStr}</code>
            </pre>
          );
        } else {
          inCodeBlock = true;
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-white font-sans font-bold text-sm mt-4 mb-2">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-white font-sans font-extrabold text-base mt-5 mb-2">{line.replace('## ', '')}</h3>;
      }

      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const itemText = line.trim().substring(2);
        return (
          <ul key={idx} className="list-disc pl-5 my-1 text-sky-100">
            <li>{parseInlineStyles(itemText)}</li>
          </ul>
        );
      }

      // Empty lines
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      // Normal paragraphs
      return <p key={idx} className="text-sky-100/90 leading-relaxed text-sm my-1">{parseInlineStyles(line)}</p>;
    });
  };

  // Helper to parse bold text **bold** and inline code `code`
  const parseInlineStyles = (lineStr: string) => {
    // Regex matches bold (**text**) or inline code (`code`)
    const parts = lineStr.split(/(\*\*.*?\*\*|`.*?`|\$\$.*?\$\$)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono text-sky-200 border border-white/5">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return <span key={idx} className="font-mono text-sky-300 px-1 py-0.5 bg-white/10 rounded">{part.slice(2, -2)}</span>;
      }
      return part;
    });
  };

  return (
    <div className="lg:h-[calc(100vh-140px)] h-auto flex flex-col lg:flex-row gap-6 animate-fade-in text-white p-2 md:p-4">
      
      {/* Suggestions Sidebar panel */}
      <div className="lg:w-80 flex flex-col gap-4 shrink-0 justify-between lg:h-full pb-2">
        <div className="space-y-4">
          <div className="bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] p-5 shadow-xl space-y-4">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-sky-200/70">AI Study Assistant</span>
              <h3 className="font-sans font-bold text-white text-base mt-0.5">
                Study Prompts
              </h3>
            </div>
            <p className="text-xs text-sky-200/60 font-medium">Click any of these pre-made study prompts to test the AI helper:</p>
            
            <div className="flex flex-col gap-2">
              {suggestionPrompts.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.query)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 text-xs font-semibold text-white flex items-center justify-between group transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="pr-2">{s.label}</span>
                  <span className="shrink-0 text-[8px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 bg-white/10 border border-white/10 rounded text-sky-200 group-hover:bg-white group-hover:text-[#6495ED] transition-all">
                    Ask
                  </span>
                </button>
              ))}
            </div>
          </div>

          {isLocalMode && (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-[32px] p-4 text-amber-250">
              <div className="text-[10px] leading-relaxed">
                <span className="inline-block px-2 py-0.5 bg-white/20 text-white rounded font-mono font-bold tracking-[0.25em] text-xs border border-white/10 mb-2">STUDY AI</span>
                <p className="font-bold">Local Database Mode Active</p>
                <p className="text-amber-200/80 mt-0.5">Responses are simulated locally. Add your `GEMINI_API_KEY` to `.env.local` to connect a live LLM model.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window Panel */}
      <div className="flex-1 bg-white/12 border border-white/18 backdrop-blur-md rounded-[32px] shadow-xl flex flex-col overflow-hidden h-[450px] lg:h-full text-white">
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <span className="text-[8px] font-mono font-bold tracking-widest uppercase bg-white/20 text-white border border-white/15 px-1.5 py-0.5 rounded inline-block mb-1">ONLINE</span>
              <h3 className="font-sans font-extrabold text-white text-base leading-tight">Study Assistant</h3>
              <p className="text-sky-100/70 text-sm font-mono font-bold uppercase tracking-[0.15em]">Chat with your personal AI academic study assistant.</p>
            </div>
          </div>
          
          <button
            onClick={handleClearHistory}
            className="px-2.5 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest text-rose-300 hover:text-rose-200 hover:bg-white/5 border border-rose-500/30 transition-all cursor-pointer"
          >
            Clear Chat
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/2">
          {studyChats.map((chat) => {
            const isUser = chat.sender === 'user';
            
            return (
              <div
                key={chat.id}
                className={`flex flex-col gap-1.5 max-w-[85%] ${isUser ? 'ml-auto items-end' : 'items-start'}`}
              >
                {/* Sender Indicator */}
                <span className="text-[8px] font-mono font-bold tracking-widest text-sky-200/50 uppercase px-1">
                  {isUser ? 'Student' : 'Study Assistant'}
                </span>

                {/* Message Body */}
                <div className={`p-4 rounded-2xl border ${
                  isUser
                    ? 'bg-white/20 border-white/30 text-white shadow-md shadow-white/5'
                    : 'bg-white/5 border-white/10 text-white shadow-sm'
                }`}>
                  {isUser ? (
                    <p className="text-sm font-semibold leading-relaxed">{chat.message}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {renderMessageContent(chat.message)}
                    </div>
                  )}
                  
                  <p className={`text-[8px] font-mono text-right mt-2 ${isUser ? 'text-sky-100' : 'text-sky-200/40'}`}>
                    {new Date(chat.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex flex-col gap-1.5 max-w-[80%] items-start animate-fade-in">
              <span className="text-[8px] font-mono font-bold tracking-widest text-sky-200/50 uppercase px-1">
                Study Assistant
              </span>
              <div className="p-4 rounded-2xl border border-white/10 bg-white/5 shadow-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Footer */}
        <form onSubmit={handleFormSubmit} className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={loading}
            placeholder="Ask a study question... (e.g. explain integration by parts)"
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-sky-200/30 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 text-xs disabled:opacity-50 font-medium"
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="py-2 px-4 bg-white hover:bg-sky-50 text-[#6495ED] font-mono font-bold rounded-xl text-xs uppercase tracking-[0.2em] transition-all shadow-md active:scale-[0.97] cursor-pointer shrink-0 disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
