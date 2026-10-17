import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Loader2, 
  ExternalLink, 
  AlertCircle, 
  BookOpen, 
  HelpCircle,
  Key,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '../api/client';
import { notify } from '../utils/notifications';

export default function AskMemoryModal({ isOpen, onClose }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getAiStatus().then(setAiStatus).catch(() => {});
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.askMemory(question.trim());
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to query memory assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setSavingKey(true);
    try {
      const status = await api.setAiConfig(apiKeyInput.trim());
      setAiStatus(status);
      setShowKeyConfig(false);
      notify.success('AI Key Configured', status.configured ? 'Google Gemini is now active.' : 'Reverted to built-in knowledge engine.');
    } catch (err) {
      notify.error('Failed to update AI key', err.message);
    } finally {
      setSavingKey(false);
    }
  };

  const quickPrompts = [
    'What are my latest saved memories?',
    'Summarize what I have saved about Chrome extensions',
    'List all code solutions and tutorials in my library',
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900">Ask My Memory</h2>
                {aiStatus?.configured ? (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                    Gemini Active
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                    Built-in Knowledge Engine
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Grounded answers strictly referencing your saved library
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 p-1.5 rounded-lg hover:bg-white/60 transition"
              title="Configure Gemini API Key"
            >
              <Key className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline text-[11px]">API Key</span>
              {showKeyConfig ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Optional Gemini API Key Drawer */}
        {showKeyConfig && (
          <form onSubmit={handleSaveApiKey} className="p-3.5 bg-slate-100/80 border-b border-slate-200 text-xs flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Google Gemini API Key (Optional)
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... (leave blank to use built-in engine)"
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={savingKey}
              className="w-full sm:w-auto mt-2 sm:mt-4 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs flex items-center justify-center space-x-1 shrink-0"
            >
              {savingKey && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Key</span>
            </button>
          </form>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Question Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask anything about what you have saved..."
                className="w-full text-xs pl-3.5 pr-20 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-inner-sm bg-white"
              />
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center space-x-1 shadow-xs transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Ask</span>
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">Searching your saved memories...</p>
              <p className="text-[11px] text-slate-400">Synthesizing facts strictly from your personal excerpts</p>
            </div>
          )}

          {/* Result view */}
          {result && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Answer card */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span>Answer</span>
                </div>
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {result.answer}
                </div>
              </div>

              {/* Verified Source Cards */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                  <span>Supporting Sources ({result.sources?.length || 0})</span>
                </h4>

                {result.sources && result.sources.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.sources.map((src) => (
                      <div
                        key={src.memoryId}
                        className="rounded-lg border border-slate-200 p-3 bg-white hover:border-blue-300 transition flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-semibold text-slate-600 uppercase">{src.domain}</span>
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline flex items-center space-x-0.5"
                            >
                              <span>Open</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                          <p className="text-xs font-semibold text-slate-900 line-clamp-1 mb-1">
                            {src.title}
                          </p>
                          {src.reason && (
                            <p className="text-[11px] text-slate-500 italic line-clamp-2">
                              {src.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No matching supporting sources found in your memories for this query.
                  </p>
                )}
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="py-6 text-center text-slate-400 space-y-3">
              <HelpCircle className="h-8 w-8 mx-auto text-slate-300 stroke-[1.5]" />
              <div>
                <p className="text-xs font-semibold text-slate-700">Ask questions about anything you saved</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Answers are generated strictly from your own excerpts.</p>
              </div>

              <div className="pt-2 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 text-center">
                  Try asking
                </span>
                <div className="flex flex-col gap-1.5 max-w-md mx-auto">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => setQuestion(p)}
                      className="text-xs text-left p-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 transition"
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
