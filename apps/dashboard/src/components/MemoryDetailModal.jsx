import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Globe, 
  Calendar, 
  Sparkles, 
  Tag as TagIcon,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';

import { notify } from '../utils/notifications';

export default function MemoryDetailModal({
  memory,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onUpdateMemory,
}) {
  const [copied, setCopied] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  if (!isOpen || !memory) return null;

  const handleCopy = () => {
    const content = memory.selectedText || memory.note || memory.url;
    navigator.clipboard.writeText(content);
    setCopied(true);
    notify.info('Copied!', 'Content copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateSummary = async () => {
    const textToSummarize = memory.selectedText || memory.note || memory.title;
    if (!textToSummarize) return;
    setGeneratingAi(true);
    setAiError(null);

    try {
      const res = await api.summarize(textToSummarize);
      if (res?.summary) {
        const updated = await api.updateMemory(memory._id, {
          summary: res.summary,
        });
        onUpdateMemory(updated);
        notify.success('AI Summary Generated', 'Saved to your memory.');
      } else {
        const msg = 'Unable to generate summary for this content.';
        setAiError(msg);
        notify.warning('AI Notice', msg);
      }
    } catch (err) {
      const msg = err.message || 'Failed to generate AI summary.';
      setAiError(msg);
      notify.error('Generation Failed', msg);
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="space-y-1 pr-6">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="uppercase tracking-wider font-semibold text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {memory.type}
              </span>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">{memory.domain}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{new Date(memory.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {memory.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Source Link */}
          <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs">
            <div className="truncate mr-4 text-slate-600">
              <span className="font-semibold text-slate-700 mr-1.5">Source URL:</span>
              <span className="underline select-all">{memory.url}</span>
            </div>
            <a
              href={memory.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 bg-white hover:bg-slate-100 text-blue-600 px-3 py-1.5 rounded-md border border-slate-200 font-semibold shadow-xs shrink-0 transition"
            >
              <span>Open Source</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Full Selected Text */}
          {memory.selectedText && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Saved Excerpt ({memory.selectedText.length} chars)
                </h4>
                <button
                  onClick={handleCopy}
                  className="text-xs text-blue-600 hover:underline flex items-center space-x-1"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy Excerpt'}</span>
                </button>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm font-serif italic leading-relaxed text-slate-800 whitespace-pre-wrap max-h-72 overflow-y-auto selection:bg-blue-100">
                "{memory.selectedText}"
              </div>
            </div>
          )}

          {/* Personal Note */}
          {memory.note && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Personal Note
              </h4>
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {memory.note}
              </div>
            </div>
          )}

          {/* AI Summary Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                <span>AI Summary</span>
              </h4>
              {!memory.summary && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={generatingAi}
                  className="text-xs text-indigo-600 hover:underline flex items-center space-x-1 font-medium disabled:opacity-50"
                >
                  {generatingAi && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>{generatingAi ? 'Generating...' : 'Generate AI Summary'}</span>
                </button>
              )}
            </div>

            {memory.summary ? (
              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 leading-relaxed italic">
                {memory.summary}
              </div>
            ) : aiError ? (
              <p className="text-xs text-amber-700 italic bg-amber-50 p-2 rounded border border-amber-200">
                {aiError}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No summary generated yet. Click "Generate AI Summary" to enrich.
              </p>
            )}
          </div>

          {/* Tags */}
          {memory.tags && memory.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {memory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 font-medium"
                  >
                    <TagIcon className="h-3 w-3 mr-1 text-slate-400" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(memory)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
            >
              <Edit3 className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => onDelete(memory)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold shadow-xs transition"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span>Delete</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
