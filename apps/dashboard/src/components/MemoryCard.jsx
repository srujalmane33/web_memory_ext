import React, { useState } from 'react';
import { 
  ExternalLink, 
  Tag as TagIcon, 
  Copy, 
  Check, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Globe, 
  Clock,
  Sparkles
} from 'lucide-react';

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MemoryCard({
  memory,
  onOpenDetail,
  onEdit,
  onDelete,
  onSelectTag,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyExcerpt = (e) => {
    e.stopPropagation();
    if (memory.selectedText) {
      navigator.clipboard.writeText(memory.selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const typeBadgeColors = {
    page: 'bg-slate-100 text-slate-700 border-slate-200',
    highlight: 'bg-amber-50 text-amber-700 border-amber-200',
    snippet: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    note: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <article
      onClick={() => onOpenDetail(memory)}
      className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Domain & Type & Actions */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <div className="flex items-center space-x-1.5 truncate max-w-[70%]">
            <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700 truncate">{memory.domain || 'web'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] text-slate-400 shrink-0">{formatDate(memory.createdAt)}</span>
          </div>

          <div className="flex items-center space-x-1">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                typeBadgeColors[memory.type] || typeBadgeColors.page
              }`}
            >
              {memory.type || 'page'}
            </span>

            <a
              href={memory.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
              title="Open original website"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug mb-2">
          {memory.title}
        </h3>

        {/* Excerpt if present */}
        {memory.selectedText && (
          <div className="relative mb-3 bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-xs text-slate-700 font-serif italic line-clamp-3 leading-relaxed">
            "{memory.selectedText}"
          </div>
        )}

        {/* Personal Note if present */}
        {memory.note && (
          <p className="text-xs text-slate-600 line-clamp-2 mb-3 bg-blue-50/50 p-2 rounded border border-blue-100/60 font-sans">
            <span className="font-semibold text-blue-900 mr-1">Note:</span>
            {memory.note}
          </p>
        )}

        {/* AI Summary badge if generated */}
        {memory.summary && (
          <div className="text-[11px] text-indigo-900 bg-indigo-50/70 p-2 rounded border border-indigo-100 mb-3 flex items-start space-x-1.5">
            <Sparkles className="h-3 w-3 text-indigo-500 shrink-0 mt-0.5" />
            <span className="line-clamp-2 italic">{memory.summary}</span>
          </div>
        )}
      </div>

      {/* Footer: Tags & Controls */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
        {/* Tags */}
        <div className="flex flex-wrap gap-1 max-w-[70%]">
          {memory.tags && memory.tags.length > 0 ? (
            memory.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTag(tag);
                }}
                className="text-[10px] bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 px-2 py-0.5 rounded-full font-medium transition"
              >
                #{tag}
              </button>
            ))
          ) : (
            <span className="text-[11px] text-slate-400 italic">No tags</span>
          )}
          {memory.tags && memory.tags.length > 3 && (
            <span className="text-[10px] text-slate-400 self-center">
              +{memory.tags.length - 3}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          {memory.selectedText && (
            <button
              onClick={handleCopyExcerpt}
              title={copied ? 'Copied!' : 'Copy excerpt'}
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}

          <button
            onClick={() => onEdit(memory)}
            title="Edit memory"
            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => onDelete(memory)}
            title="Delete memory"
            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
