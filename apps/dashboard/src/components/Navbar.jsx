import React from 'react';
import { Bookmark, Search, Sparkles, LogOut, User, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ 
  searchQuery, 
  onSearchChange, 
  onOpenAskModal, 
  onOpenNewModal 
}) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-sm">
      {/* Brand */}
      <div className="flex items-center space-x-3 min-w-[200px]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Bookmark className="h-4 w-4 fill-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">Web Memory</span>
          <span className="hidden sm:inline-block ml-2 text-[11px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            Dashboard
          </span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search title, excerpts, notes, or tags..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-inner-sm"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onOpenAskModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold shadow-xs transition"
          title="Ask My Memory (AI Retrieval)"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span className="hidden sm:inline">Ask My Memory</span>
          <span className="sm:hidden">Ask AI</span>
        </button>

        <button
          onClick={onOpenNewModal}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Add Memory</span>
        </button>

        {/* User profile & Logout */}
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-600">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium max-w-[120px] truncate">{user?.email}</span>
          </div>

          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
