import React, { useState } from 'react';
import { ExternalLink, Search, Clock, Tag as TagIcon, Globe, FileText } from 'lucide-react';

function timeAgo(dateString) {
  if (!dateString) return 'recently';
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentList({ memories = [], isLoading, onOpenDashboard }) {
  const [query, setQuery] = useState('');

  const filtered = memories.filter((m) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.domain && m.domain.toLowerCase().includes(q)) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(q))) ||
      (m.selectedText && m.selectedText.toLowerCase().includes(q)) ||
      (m.note && m.note.toLowerCase().includes(q))
    );
  });

  return (
    <div className="border-t border-slate-200 bg-white">
      {/* Header & Quick Search */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-1 text-xs font-semibold text-slate-800">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Recent Captures ({memories.length})</span>
        </div>
        <button
          onClick={onOpenDashboard}
          className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center space-x-1"
        >
          <span>All memories</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
      </div>

      {memories.length > 0 && (
        <div className="px-3 pt-2">
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2 top-2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter recent memories..."
              className="w-full text-[11px] pl-6 pr-2 py-1 rounded border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50"
            />
          </div>
        </div>
      )}

      {/* List content */}
      <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading recent memories...</div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 space-y-1">
            <FileText className="h-6 w-6 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="font-medium text-slate-600">No memories found</p>
            <p className="text-[11px] text-slate-400">
              {query ? 'No captures match your filter.' : 'Capture your first webpage or excerpt above!'}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item._id || item.id || item.createdAt}
              className="group p-2 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-1">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-slate-800 hover:text-blue-600 line-clamp-1 group-hover:underline"
                  title={item.title}
                >
                  {item.title || 'Untitled'}
                </a>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-blue-600 shrink-0 p-0.5"
                  title="Open Source"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Excerpt preview if any */}
              {item.selectedText && (
                <p className="text-[11px] text-slate-600 line-clamp-2 my-1 italic font-serif bg-white/60 p-1 rounded border border-slate-100">
                  "{item.selectedText}"
                </p>
              )}

              {/* Note preview if any */}
              {item.note && (
                <p className="text-[11px] text-slate-500 line-clamp-1 mb-1">
                  Note: {item.note}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="font-medium text-slate-600 truncate">{item.domain}</span>
                  <span>•</span>
                  <span>{timeAgo(item.createdAt)}</span>
                </div>

                {item.type && (
                  <span className="uppercase tracking-wider px-1.5 py-0.2 bg-slate-200/70 text-slate-600 rounded text-[9px] font-semibold">
                    {item.type}
                  </span>
                )}
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-[9px] text-slate-400">+{item.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
