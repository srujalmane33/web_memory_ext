import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Highlighter, 
  Code, 
  StickyNote, 
  Tag as TagIcon, 
  Globe, 
  Check, 
  AlertCircle, 
  Loader2,
  X
} from 'lucide-react';
import { extractDomain, normalizeTags, LIMITS, isValidHttpUrl } from '@web-memory/shared';

export default function SaveForm({ 
  tabData, 
  onSave, 
  isSaving, 
  saveSuccess, 
  error, 
  onDismissError 
}) {
  const [mode, setMode] = useState('page'); // 'page' or 'selection'
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [type, setType] = useState('page');
  const [selectionWarning, setSelectionWarning] = useState(false);

  // Sync initial tab data
  useEffect(() => {
    if (tabData) {
      setTitle(tabData.title || '');
      setUrl(tabData.url || '');
      if (tabData.selectedText && tabData.selectedText.trim().length > 0) {
        setSelectedText(tabData.selectedText.trim());
        setMode('selection');
        setType('highlight');
        setSelectionWarning(false);
      } else {
        setSelectedText('');
        setMode('page');
        setType('page');
      }
    }
  }, [tabData]);

  // Mode toggling
  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'selection') {
      if (!selectedText || selectedText.trim().length === 0) {
        setSelectionWarning(true);
        setType('highlight');
      } else {
        setSelectionWarning(false);
        setType('highlight');
      }
    } else {
      setSelectionWarning(false);
      setType('page');
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const added = normalizeTags(tagInput);
    const merged = Array.from(new Set([...tags, ...added])).slice(0, LIMITS.MAX_TAGS_COUNT);
    setTags(merged);
    setTagInput('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (!isValidHttpUrl(url)) {
      return;
    }

    onSave({
      title: title.trim().slice(0, LIMITS.TITLE_MAX_LENGTH),
      url: url.trim(),
      domain: extractDomain(url),
      type,
      selectedText: mode === 'selection' ? selectedText.trim().slice(0, LIMITS.SELECTED_TEXT_MAX_LENGTH) : '',
      note: note.trim().slice(0, LIMITS.NOTE_MAX_LENGTH),
      tags,
    });
  };

  const domain = extractDomain(url);
  const isRestricted = tabData?.restricted;

  return (
    <div className="p-3.5 space-y-3">
      {/* Primary Actions: Save Current Page vs Save Selection */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => handleModeChange('page')}
          className={`flex items-center justify-center space-x-1.5 py-1.5 text-xs font-medium rounded-md transition ${
            mode === 'page'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Save Page</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('selection')}
          className={`flex items-center justify-center space-x-1.5 py-1.5 text-xs font-medium rounded-md transition ${
            mode === 'selection'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Highlighter className="h-3.5 w-3.5" />
          <span>Save Selection</span>
        </button>
      </div>

      {/* Restricted tab error message */}
      {isRestricted && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Restricted Browser Page</p>
            <p className="text-[11px] text-amber-700 leading-normal">
              Chrome prevents capturing internal system tabs or browser settings. Navigate to any standard website (HTTP/HTTPS) to save pages and selections.
            </p>
          </div>
        </div>
      )}

      {/* Selection empty warning */}
      {mode === 'selection' && selectionWarning && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-xs text-blue-800 flex items-start justify-between space-x-2">
          <div className="flex items-start space-x-1.5">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">No text was selected</p>
              <p className="text-[11px] text-blue-700">
                Highlight text on the page first, or paste snippet below, or switch back to "Save Page".
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleModeChange('page')}
            className="text-[11px] text-blue-700 underline font-semibold shrink-0"
          >
            Save Page
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-800 flex items-start justify-between">
          <div className="flex items-center space-x-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={onDismissError} className="text-red-500 hover:text-red-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Success banner */}
      {saveSuccess && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 flex items-center space-x-2">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium">Memory saved successfully to your library!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Source URL Preview */}
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded px-2 py-1 truncate">
          <Globe className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-700">{domain || 'unknown-domain'}</span>
          <span className="text-slate-400">|</span>
          <span className="truncate">{url}</span>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-[11px] font-medium text-slate-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={LIMITS.TITLE_MAX_LENGTH}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page or snippet title"
            className="w-full text-xs rounded border border-slate-300 px-2 py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Selected Excerpt (if selection mode) */}
        {mode === 'selection' && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-medium text-slate-700">
                Selected Excerpt / Passage
              </label>
              <span className="text-[10px] text-slate-400">
                {selectedText.length}/{LIMITS.SELECTED_TEXT_MAX_LENGTH}
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={LIMITS.SELECTED_TEXT_MAX_LENGTH}
              value={selectedText}
              onChange={(e) => {
                setSelectedText(e.target.value);
                if (e.target.value.trim().length > 0) setSelectionWarning(false);
              }}
              placeholder="Paste or edit selected text here..."
              className="w-full text-xs font-mono rounded border border-slate-300 px-2 py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>
        )}

        {/* Memory Type Selector */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-slate-500 font-medium">Type:</span>
          {['page', 'highlight', 'snippet', 'note'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border transition ${
                type === t
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Personal Note */}
        <div>
          <label className="block text-[11px] font-medium text-slate-700 mb-1">
            Personal Note <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={2}
            maxLength={LIMITS.NOTE_MAX_LENGTH}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why does this matter? Add thoughts or context..."
            className="w-full text-xs rounded border border-slate-300 px-2 py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-[11px] font-medium text-slate-700 mb-1">
            Tags <span className="text-slate-400 font-normal">(press Enter or comma to add)</span>
          </label>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200"
                >
                  <TagIcon className="h-2.5 w-2.5 mr-1 text-slate-400" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex space-x-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="e.g. react, tutorial, bugfix"
              className="flex-1 text-xs rounded border border-slate-300 px-2 py-1.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded font-medium border border-slate-200"
            >
              Add
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isSaving || isRestricted || !title.trim()}
            className="w-full flex items-center justify-center space-x-1.5 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving memory...</span>
              </>
            ) : (
              <span>Save to Web Memory</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
