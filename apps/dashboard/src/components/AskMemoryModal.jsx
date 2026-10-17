import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Loader2, 
  ExternalLink, 
  AlertCircle, 
  BookOpen, 
  HelpCircle 
} from 'lucide-react';
import { api } from '../api/client';

export default function AskMemoryModal({ isOpen, onClose }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ask My Memory</h2>
              <p className="text-[11px] text-slate-500">
                Grounded answers strictly citing your saved library
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

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
                placeholder="e.g. How does Manifest V3 handle background scripts?"
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
              <p className="text-[11px] text-slate-400">Grounded strictly on your personal excerpts</p>
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
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
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
            <div className="py-8 text-center text-slate-400 space-y-1">
              <HelpCircle className="h-8 w-8 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-medium text-slate-600">Ask questions about anything you saved</p>
              <p className="text-[11px]">Answers are generated only from your own saved snippets and articles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
