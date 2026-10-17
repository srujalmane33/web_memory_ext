import React from 'react';
import { Bookmark, ExternalLink, Settings, User, LogOut, CheckCircle2 } from 'lucide-react';

export default function Header({ user, onOpenAuth, onLogout, onOpenSettings, onOpenDashboard }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 shadow-sm sticky top-0 z-20">
      <div className="flex items-center space-x-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
          <Bookmark className="h-4 w-4 fill-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-900 leading-none tracking-tight">Web Memory</h1>
          <span className="text-[10px] text-slate-500 font-medium">Capture & Recall</span>
        </div>
      </div>

      <div className="flex items-center space-x-1.5">
        {user ? (
          <div className="flex items-center space-x-1 bg-slate-100 rounded-md py-0.5 px-2">
            <User className="h-3 w-3 text-slate-500" />
            <span className="text-[11px] font-medium text-slate-700 max-w-[80px] truncate" title={user.email}>
              {user.email.split('@')[0]}
            </span>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-red-600 ml-0.5 p-0.5"
              title="Log out"
            >
              <LogOut className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline px-1.5 py-0.5"
          >
            Sign in
          </button>
        )}

        <button
          onClick={onOpenDashboard}
          title="Open Web Dashboard"
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={onOpenSettings}
          title="Settings"
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
