import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { localStorageService } from '../utils/chrome';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiUrl, setApiUrl] = useState('http://localhost:5001/api');
  const [dashboardUrl, setDashboardUrl] = useState('http://localhost:5173');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      localStorageService.get('wm_api_url', 'http://localhost:5001/api').then(setApiUrl);
      localStorageService.get('wm_dashboard_url', 'http://localhost:5173').then(setDashboardUrl);
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    await localStorageService.set('wm_api_url', apiUrl.trim());
    await localStorageService.set('wm_dashboard_url', dashboardUrl.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-800">Extension Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">API Base URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:5000/api"
              className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 mb-1">Dashboard URL</label>
            <input
              type="text"
              value={dashboardUrl}
              onChange={(e) => setDashboardUrl(e.target.value)}
              placeholder="http://localhost:5173"
              className="w-full text-xs px-2 py-1.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm flex items-center justify-center space-x-1"
          >
            {saved ? <span>Settings Saved!</span> : <span>Save Settings</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
