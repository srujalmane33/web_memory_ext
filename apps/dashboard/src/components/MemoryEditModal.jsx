import React, { useState, useEffect } from 'react';
import { X, Loader2, Tag as TagIcon, AlertCircle } from 'lucide-react';
import { normalizeTags, isValidHttpUrl, extractDomain, LIMITS, MEMORY_TYPES } from '@web-memory/shared';

export default function MemoryEditModal({
  memory, // null if creating new
  isOpen,
  onClose,
  onSave,
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState('page');
  const [selectedText, setSelectedText] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (memory) {
        setTitle(memory.title || '');
        setUrl(memory.url || '');
        setType(memory.type || 'page');
        setSelectedText(memory.selectedText || '');
        setNote(memory.note || '');
        setTags(memory.tags || []);
      } else {
        // Reset for new creation
        setTitle('');
        setUrl('');
        setType('page');
        setSelectedText('');
        setNote('');
        setTags([]);
      }
      setError(null);
    }
  }, [isOpen, memory]);

  if (!isOpen) return null;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isValidHttpUrl(url)) {
      setError('Please provide a valid HTTP or HTTPS URL.');
      return;
    }

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim().slice(0, LIMITS.TITLE_MAX_LENGTH),
        url: url.trim(),
        type,
        selectedText: selectedText.trim().slice(0, LIMITS.SELECTED_TEXT_MAX_LENGTH),
        note: note.trim().slice(0, LIMITS.NOTE_MAX_LENGTH),
        tags,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save memory.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-sm font-bold text-slate-900">
            {memory ? 'Edit Memory' : 'Add New Web Memory'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-red-700 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={LIMITS.TITLE_MAX_LENGTH}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title or reference name"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Source URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Type</label>
            <div className="flex space-x-2">
              {MEMORY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`capitalize px-3 py-1 rounded-full border text-xs font-medium transition ${
                    type === t
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Selected Excerpt / Passage</label>
              <span className="text-[10px] text-slate-400">
                {selectedText.length}/{LIMITS.SELECTED_TEXT_MAX_LENGTH}
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={LIMITS.SELECTED_TEXT_MAX_LENGTH}
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
              placeholder="Paste captured text excerpt here..."
              className="w-full text-xs font-mono rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Personal Note</label>
              <span className="text-[10px] text-slate-400">
                {note.length}/{LIMITS.NOTE_MAX_LENGTH}
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={LIMITS.NOTE_MAX_LENGTH}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why is this memory useful? Context or notes..."
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tags</label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
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
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tag and press Enter or comma..."
                className="flex-1 text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium"
              >
                Add
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{memory ? 'Save Changes' : 'Create Memory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
