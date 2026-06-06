'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { NotebookSource } from '@/types';

// ─── Icons ───────────────────────────────────────────────────
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const FileIcon = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    pdf: 'text-rose-400',
    txt: 'text-sky-400',
    md: 'text-emerald-400',
    docx: 'text-blue-400',
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`w-4 h-4 ${colors[type] ?? 'text-white/60'}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────
const SUGGESTION_PROMPTS = [
  { label: 'Summarize my notes', query: 'Summarize the key concepts from my uploaded study materials.' },
  { label: 'Quiz me on this topic', query: 'Create 5 quiz questions based on my uploaded notes to test my understanding.' },
  { label: 'What are my upcoming deadlines?', query: 'What assignments and exams do I have coming up soon?' },
  { label: 'How are my grades?', query: 'Give me an overview of how I am performing academically this semester.' },
  { label: 'Explain a difficult concept', query: 'What are the hardest topics in my notes? Explain one clearly.' },
];

const MAX_FILE_SIZE_MB = 20;

// ─── Helpers ──────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Markdown Renderer ────────────────────────────────────────
function parseInlineStyles(line: string): React.ReactNode[] {
  const parts = line.split(/(\*\*.*?\*\*|`.*?`|\$\$.*?\$\$)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={idx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={idx} className="px-1.5 py-0.5 bg-white/15 rounded text-xs font-mono text-sky-200 border border-white/10">{part.slice(1, -1)}</code>;
    if (part.startsWith('$$') && part.endsWith('$$'))
      return <span key={idx} className="font-mono text-sky-300 px-1 py-0.5 bg-white/10 rounded">{part.slice(2, -2)}</span>;
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLang = '';

  return lines.map((line, idx) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const code = codeContent.join('\n');
        codeContent = [];
        return (
          <pre key={idx} className="bg-slate-950/70 text-sky-200 p-4 rounded-xl text-xs font-mono my-3 overflow-x-auto border border-white/10 leading-relaxed">
            {codeLang && <span className="block text-white/30 text-[10px] mb-2 uppercase tracking-widest">{codeLang}</span>}
            <code>{code}</code>
          </pre>
        );
      }
      inCodeBlock = true;
      codeLang = line.trim().replace('```', '');
      return null;
    }
    if (inCodeBlock) { codeContent.push(line); return null; }
    if (line.startsWith('### ')) return <h4 key={idx} className="text-white font-bold text-sm mt-4 mb-1.5 flex items-center gap-1.5">{line.replace('### ', '')}</h4>;
    if (line.startsWith('## ')) return <h3 key={idx} className="text-white font-extrabold text-base mt-5 mb-2">{line.replace('## ', '')}</h3>;
    if (line.startsWith('# ')) return <h2 key={idx} className="text-white font-black text-lg mt-5 mb-2">{line.replace('# ', '')}</h2>;
    if (line.trim().match(/^\d+\.\s/)) {
      const text = line.trim().replace(/^\d+\.\s/, '');
      return <div key={idx} className="flex gap-2 my-0.5"><span className="text-sky-400 font-mono text-xs mt-0.5 shrink-0">{line.trim().match(/^\d+/)?.[0]}.</span><p className="text-sky-100/90 text-sm leading-relaxed">{parseInlineStyles(text)}</p></div>;
    }
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.trim().slice(2);
      return <div key={idx} className="flex gap-2 my-0.5"><span className="text-sky-400 mt-1.5 shrink-0">•</span><p className="text-sky-100/90 text-sm leading-relaxed">{parseInlineStyles(text)}</p></div>;
    }
    if (!line.trim()) return <div key={idx} className="h-1.5" />;
    return <p key={idx} className="text-sky-100/90 text-sm leading-relaxed my-0.5">{parseInlineStyles(line)}</p>;
  });
}

// ─── Main Component ───────────────────────────────────────────
export default function AiAssistantPage() {
  const { studyChats, addChatMessage, clearChatHistory, session, isLocalMode } = useData();
  const { showToast } = useToast();

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<NotebookSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const [sourcesPanel, setSourcesPanel] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId = session.user?.id;

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [studyChats, loading]);

  // Load sources when user is available
  useEffect(() => {
    if (userId && !isLocalMode) {
      fetchSources();
    }
  }, [userId, isLocalMode]);

  const fetchSources = async () => {
    if (!userId) return;
    setLoadingSources(true);
    try {
      const res = await fetch(`/api/sources?userId=${userId}`);
      const data = await res.json();
      if (data.sources) setSources(data.sources);
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setLoadingSources(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!userId) {
      showToast('Please sign in to upload files', 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast(`File too large. Max size is ${MAX_FILE_SIZE_MB} MB`, 'error');
      return;
    }

    const allowed = ['application/pdf', 'text/plain', 'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      showToast('Unsupported file type. Use PDF, TXT, MD, or DOCX.', 'error');
      return;
    }

    setUploadingFile(file.name);
    showToast(`Processing "${file.name}"...`, 'info' as any);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSources((prev) => [data.source, ...prev]);
      showToast(`"${file.name}" added successfully! ${data.source.chunk_count} chunks indexed.`, 'success' as any);
    } catch (err: any) {
      showToast(err.message || 'Failed to process file', 'error');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDeleteSource = async (sourceId: string, sourceName: string) => {
    if (!userId) return;
    if (!confirm(`Remove "${sourceName}" from your knowledge base?`)) return;

    try {
      const res = await fetch(`/api/sources?sourceId=${sourceId}&userId=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete source');
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
      setSelectedSourceIds((prev) => prev.filter((id) => id !== sourceId));
      showToast(`"${sourceName}" removed`, 'success' as any);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    );
  };

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    setInputMessage('');
    setLoading(true);

    try {
      await addChatMessage(messageText, 'user');

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: messageText,
          userId: userId ?? null,
          sourceIds: selectedSourceIds.length > 0 ? selectedSourceIds : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response from AI assistant');

      const data = await res.json();
      await addChatMessage(data.text ?? 'Sorry, I encountered an issue.', 'ai');
    } catch (err: any) {
      showToast(err.message || 'Error communicating with study assistant', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [userId]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const readySources = sources.filter((s) => s.status === 'ready');

  return (
    <div className="lg:h-[calc(100vh-140px)] h-auto flex flex-col gap-4 animate-fade-in p-2 md:p-4">

      {/* Top bar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <SparkleIcon />
          </div>
          <div>
            <h1 className="text-white font-extrabold text-sm leading-tight">AI Study Assistant</h1>
            <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Powered by Gemini 2.5 Flash + RAG</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Source filter pill */}
          {selectedSourceIds.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-300 text-[10px] font-mono font-bold">{selectedSourceIds.length} source{selectedSourceIds.length > 1 ? 's' : ''} active</span>
              <button onClick={() => setSelectedSourceIds([])} className="text-indigo-400/60 hover:text-indigo-300 ml-1 text-xs font-bold cursor-pointer">✕</button>
            </div>
          )}

          <button
            onClick={() => setSourcesPanel(!sourcesPanel)}
            className="px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
          >
            {sourcesPanel ? 'Hide' : 'Show'} Sources
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

        {/* ─── Sources Panel ─────────────────────────────────────── */}
        {sourcesPanel && (
          <div className="lg:w-80 shrink-0 flex flex-col gap-3 lg:h-full">

            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`rounded-[28px] border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
                isDragOver
                  ? 'border-indigo-400 bg-indigo-500/15 scale-[1.01]'
                  : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/8'
              } ${uploadingFile ? 'pointer-events-none opacity-70' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = '';
                }}
              />

              {uploadingFile ? (
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center mx-auto">
                    <div className="w-4 h-4 border-2 border-indigo-400/60 border-t-indigo-400 rounded-full animate-spin" />
                  </div>
                  <p className="text-[11px] font-mono font-bold text-indigo-300">Processing...</p>
                  <p className="text-[10px] text-white/40 truncate px-2">{uploadingFile}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mx-auto text-white/50">
                    <UploadIcon />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/70">Drop files here</p>
                    <p className="text-[10px] text-white/35 mt-0.5">PDF, TXT, MD, DOCX · Max {MAX_FILE_SIZE_MB} MB</p>
                  </div>
                  <span className="inline-block px-2.5 py-1 bg-white/10 text-white/60 text-[10px] font-mono rounded-lg border border-white/10">
                    Click to browse
                  </span>
                </div>
              )}
            </div>

            {/* Sources List */}
            <div className="bg-white/8 border border-white/12 backdrop-blur-md rounded-[28px] p-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/50">
                  Knowledge Base
                </span>
                {readySources.length > 0 && (
                  <span className="text-[10px] font-mono text-white/30">{readySources.length} source{readySources.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {/* Filter hint */}
              {readySources.length > 0 && (
                <p className="text-[10px] text-white/30 mb-3 shrink-0">
                  Click sources to filter AI responses to those files only.
                </p>
              )}

              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {/* Always-present: Student Data source */}
                <div
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl border cursor-pointer transition-all group ${
                    selectedSourceIds.length === 0
                      ? 'border-sky-400/40 bg-sky-500/15'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedSourceIds([])}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedSourceIds.length === 0 ? 'bg-sky-500/30' : 'bg-white/10'
                  }`}>
                    <SparkleIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">All Sources</p>
                    <p className="text-[10px] text-white/40">Your academic data + all files</p>
                  </div>
                  {selectedSourceIds.length === 0 && (
                    <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center shrink-0">
                      <CheckIcon />
                    </div>
                  )}
                </div>

                {loadingSources && (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  </div>
                )}

                {sources.map((source) => {
                  const isSelected = selectedSourceIds.includes(source.id);
                  const isProcessing = source.status === 'processing';
                  const isError = source.status === 'error';

                  return (
                    <div
                      key={source.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all ${
                        isProcessing || isError
                          ? 'border-white/10 bg-white/5 opacity-70'
                          : isSelected
                          ? 'border-indigo-400/40 bg-indigo-500/15 cursor-pointer'
                          : 'border-white/10 bg-white/5 hover:border-white/20 cursor-pointer'
                      }`}
                      onClick={() => !isProcessing && !isError && toggleSourceSelection(source.id)}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-500/30' : 'bg-white/10'
                      }`}>
                        {isProcessing ? (
                          <div className="w-3 h-3 border-2 border-amber-400/60 border-t-amber-400 rounded-full animate-spin" />
                        ) : isError ? (
                          <span className="text-rose-400 text-xs">!</span>
                        ) : (
                          <FileIcon type={source.file_type} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{source.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isProcessing && <span className="text-[9px] text-amber-400 font-mono">Processing...</span>}
                          {isError && <span className="text-[9px] text-rose-400 font-mono">Error</span>}
                          {source.status === 'ready' && (
                            <>
                              <span className="text-[9px] text-white/30 font-mono">{source.chunk_count} chunks</span>
                              <span className="text-white/20">·</span>
                              <span className="text-[9px] text-white/30">{getRelativeTime(source.created_at)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                            <CheckIcon />
                          </div>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSource(source.id, source.name); }}
                          className="w-5 h-5 rounded-lg flex items-center justify-center text-white/20 hover:text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                          aria-label="Delete source"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {sources.length === 0 && !loadingSources && (
                  <div className="py-6 text-center">
                    <p className="text-[11px] text-white/25 font-mono">No files uploaded yet.</p>
                    <p className="text-[10px] text-white/20 mt-1">Upload PDFs or notes to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestion prompts */}
            <div className="bg-white/8 border border-white/12 backdrop-blur-md rounded-[28px] p-4 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/50 block mb-2">
                Suggested Questions
              </span>
              {SUGGESTION_PROMPTS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.query)}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 text-xs font-medium text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-40 group"
                >
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Chat Panel ────────────────────────────────────────── */}
        <div className="flex-1 bg-white/8 border border-white/12 backdrop-blur-md rounded-[32px] shadow-2xl flex flex-col overflow-hidden min-h-[400px] lg:h-full text-white">

          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
                  <SparkleIcon />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm leading-tight">Study Assistant</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-widest">● Online</span>
                  {selectedSourceIds.length > 0 && (
                    <>
                      <span className="text-white/20">·</span>
                      <span className="text-indigo-300 text-[9px] font-mono">Filtered to {selectedSourceIds.length} source{selectedSourceIds.length > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm('Clear all chat history?')) {
                  clearChatHistory();
                  showToast('Chat cleared');
                }
              }}
              className="px-3 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest text-rose-300/60 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {studyChats.map((chat) => {
              const isUser = chat.sender === 'user';
              return (
                <div
                  key={chat.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`max-w-[88%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/30 px-1">
                      {isUser ? 'You' : '✦ Study Assistant'}
                    </span>

                    <div className={`px-4 py-3 rounded-2xl border shadow-lg ${
                      isUser
                        ? 'bg-gradient-to-br from-indigo-500/30 to-purple-600/20 border-indigo-400/30 rounded-tr-sm'
                        : 'bg-white/6 border-white/10 rounded-tl-sm'
                    }`}>
                      {isUser ? (
                        <p className="text-sm font-semibold leading-relaxed text-white">{chat.message}</p>
                      ) : (
                        <div className="space-y-0.5">{renderMarkdown(chat.message)}</div>
                      )}

                      {/* Source references on AI messages */}
                      {!isUser && (chat as any).sources && (chat as any).sources.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
                          {(chat as any).sources.map((src: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[9px] font-mono font-bold">
                              ✦ {src}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className={`text-[8px] font-mono text-right mt-2 ${isUser ? 'text-indigo-200/50' : 'text-white/20'}`}>
                        {new Date(chat.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[88%] flex flex-col gap-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/30 px-1">✦ Study Assistant</span>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm border border-white/10 bg-white/6">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-[10px] text-white/30 font-mono ml-1">Searching knowledge base...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }}
            className="p-4 border-t border-white/10 bg-white/5 flex gap-3 shrink-0"
          >
            {/* Active source chips */}
            {selectedSourceIds.length > 0 && (
              <div className="absolute bottom-20 left-4 right-4 flex gap-1.5 flex-wrap" />
            )}

            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                placeholder={
                  selectedSourceIds.length > 0
                    ? `Ask about your ${selectedSourceIds.length} selected source${selectedSourceIds.length > 1 ? 's' : ''}...`
                    : 'Ask anything — about your notes, grades, assignments, or any study topic...'
                }
                className="w-full px-4 py-3 bg-white/6 border border-white/12 rounded-2xl text-white placeholder-white/25 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-400/40 text-sm disabled:opacity-50 font-medium transition-all pr-10"
              />
              {/* Attach file shortcut */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors cursor-pointer"
                title="Attach file"
              >
                <UploadIcon />
              </button>
            </div>

            <button
              type="submit"
              id="chat-send-btn"
              disabled={loading || !inputMessage.trim()}
              className="py-3 px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-500/30 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
