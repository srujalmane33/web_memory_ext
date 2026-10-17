import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MemoryCard from './components/MemoryCard';
import MemoryDetailModal from './components/MemoryDetailModal';
import MemoryEditModal from './components/MemoryEditModal';
import AskMemoryModal from './components/AskMemoryModal';
import AuthScreen from './components/AuthScreen';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import { Loader2, Plus, Bookmark, Search, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const { user, loading: authLoading } = useAuth();

  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [detailMemory, setDetailMemory] = useState(null);
  const [editMemory, setEditMemory] = useState(null); // null when closed, empty object {} when creating, object when editing
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAskOpen, setIsAskOpen] = useState(false);

  // Fetch memories whenever filters change
  const fetchMemories = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getMemories({
        page,
        limit: 12,
        sort: sortOrder,
        type: selectedType,
        tag: selectedTag,
        q: searchQuery,
      });

      setMemories(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load memories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMemories();
    }
  }, [user, page, sortOrder, selectedType, selectedTag, searchQuery]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedType, selectedTag, sortOrder]);

  // Compute available tags from loaded memories
  const availableTags = Array.from(
    new Set(memories.flatMap((m) => m.tags || []))
  ).slice(0, 20);

  // Handlers
  const handleSaveMemory = async (payload) => {
    if (editMemory && editMemory._id) {
      // Update
      const updated = await api.updateMemory(editMemory._id, payload);
      setMemories(memories.map(m => m._id === updated._id ? updated : m));
      if (detailMemory && detailMemory._id === updated._id) {
        setDetailMemory(updated);
      }
    } else {
      // Create new
      const created = await api.createMemory(payload);
      setMemories([created, ...memories]);
      setTotalCount(prev => prev + 1);
    }
  };

  const handleDeleteMemory = async (memoryToDelete) => {
    if (!window.confirm(`Are you sure you want to delete "${memoryToDelete.title}"?`)) {
      return;
    }

    try {
      await api.deleteMemory(memoryToDelete._id);
      setMemories(memories.filter(m => m._id !== memoryToDelete._id));
      setTotalCount(prev => Math.max(0, prev - 1));
      if (detailMemory && detailMemory._id === memoryToDelete._id) {
        setDetailMemory(null);
      }
    } catch (err) {
      alert(`Failed to delete memory: ${err.message}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAskModal={() => setIsAskOpen(true)}
        onOpenNewModal={() => {
          setEditMemory(null);
          setIsEditOpen(true);
        }}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          availableTags={availableTags}
          totalCount={totalCount}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {selectedType ? `${selectedType.toUpperCase()} Memories` : 'All Memories'}
                {selectedTag && <span className="text-blue-600 ml-2 font-medium text-base">#{selectedTag}</span>}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalCount} {totalCount === 1 ? 'saved memory' : 'saved memories'} in your library
              </p>
            </div>

            <button
              onClick={fetchMemories}
              disabled={loading}
              className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchMemories}
                className="underline font-semibold text-red-800 hover:text-red-900"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && memories.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Loading your memories...</p>
            </div>
          ) : memories.length === 0 ? (
            /* Empty State */
            <div className="py-20 text-center max-w-md mx-auto space-y-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto">
                <Bookmark className="h-6 w-6 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No memories found</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {searchQuery || selectedType || selectedTag
                  ? 'No memories match your active filters. Try clearing search or tag filters.'
                  : 'Your library is empty. Use the Chrome Extension to save webpages and excerpts, or add one manually!'}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setEditMemory(null);
                    setIsEditOpen(true);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add First Memory</span>
                </button>
              </div>
            </div>
          ) : (
            /* Cards Grid */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {memories.map((m) => (
                  <MemoryCard
                    key={m._id}
                    memory={m}
                    onOpenDetail={(item) => setDetailMemory(item)}
                    onEdit={(item) => {
                      setEditMemory(item);
                      setIsEditOpen(true);
                    }}
                    onDelete={handleDeleteMemory}
                    onSelectTag={(t) => setSelectedTag(t)}
                  />
                ))}
              </div>

              {/* Bounded Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Page {page} of {totalPages} ({totalCount} total)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <MemoryDetailModal
        memory={detailMemory}
        isOpen={Boolean(detailMemory)}
        onClose={() => setDetailMemory(null)}
        onEdit={(item) => {
          setEditMemory(item);
          setIsEditOpen(true);
        }}
        onDelete={handleDeleteMemory}
        onUpdateMemory={(updated) => {
          setDetailMemory(updated);
          setMemories(memories.map(m => m._id === updated._id ? updated : m));
        }}
      />

      <MemoryEditModal
        memory={editMemory}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditMemory(null);
        }}
        onSave={handleSaveMemory}
      />

      <AskMemoryModal
        isOpen={isAskOpen}
        onClose={() => setIsAskOpen(false)}
      />
    </div>
  );
}
