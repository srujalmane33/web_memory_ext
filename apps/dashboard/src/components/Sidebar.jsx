import React from 'react';
import { 
  FolderOpen, 
  Layers, 
  FileText, 
  Highlighter, 
  Code, 
  StickyNote, 
  Tag as TagIcon, 
  FolderArchive,
  ArrowUpDown,
  X
} from 'lucide-react';

export default function Sidebar({
  selectedType,
  onSelectType,
  selectedTag,
  onSelectTag,
  sortOrder,
  onSortChange,
  availableTags = [],
  totalCount = 0,
}) {
  const typeFilters = [
    { id: '', label: 'All Memories', icon: Layers },
    { id: 'page', label: 'Pages', icon: FileText },
    { id: 'highlight', label: 'Highlights', icon: Highlighter },
    { id: 'snippet', label: 'Code Snippets', icon: Code },
    { id: 'note', label: 'Notes', icon: StickyNote },
  ];

  const hasActiveFilters = Boolean(selectedType || selectedTag);

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-3.5rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Navigation & Types */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Library
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  onSelectType('');
                  onSelectTag('');
                }}
                className="text-[10px] text-blue-600 hover:underline flex items-center space-x-0.5"
              >
                <span>Reset</span>
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>

          <nav className="space-y-1">
            {typeFilters.map((tf) => {
              const Icon = tf.icon;
              const isActive = selectedType === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => onSelectType(tf.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{tf.label}</span>
                  </div>
                  {tf.id === '' && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                      {totalCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sort Controls */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
            Sort Order
          </span>
          <div className="px-2">
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => onSortChange('newest')}
                className={`flex-1 text-[11px] font-medium py-1 rounded transition text-center ${
                  sortOrder === 'newest'
                    ? 'bg-white shadow-xs text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => onSortChange('oldest')}
                className={`flex-1 text-[11px] font-medium py-1 rounded transition text-center ${
                  sortOrder === 'oldest'
                    ? 'bg-white shadow-xs text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Oldest
              </button>
            </div>
          </div>
        </div>

        {/* Tags filter */}
        {availableTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Filter by Tag
              </span>
              {selectedTag && (
                <button
                  onClick={() => onSelectTag('')}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  Clear tag
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1 px-2 max-h-40 overflow-y-auto">
              {availableTags.map((tag) => {
                const isActive = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(isActive ? '' : tag)}
                    className={`inline-flex items-center text-[11px] px-2 py-0.5 rounded-full border transition ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <TagIcon className="h-2.5 w-2.5 mr-1 opacity-70" />
                    <span>#{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Collections (Phase 2 Spec) */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-2">
            Collections
          </span>
          <div className="px-2 py-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center">
            <FolderArchive className="h-4 w-4 mx-auto text-slate-300 mb-1" />
            <p className="text-[11px] font-medium text-slate-500">Custom Collections</p>
            <span className="text-[9px] uppercase tracking-wider font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full mt-1 inline-block">
              Phase 2 Feature
            </span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 px-2">
        <span>Web Memory v1.0 • MERN Stack</span>
      </div>
    </aside>
  );
}
