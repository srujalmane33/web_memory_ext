import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SaveForm from './components/SaveForm';
import RecentList from './components/RecentList';
import AuthModal from './components/AuthModal';
import SettingsModal from './components/SettingsModal';
import { getActiveTab, captureTabContent, localStorageService } from './utils/chrome';
import { getCurrentUser, clearAuthSession, apiRequest } from './utils/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [tabData, setTabData] = useState(null);
  const [memories, setMemories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Initialize
  useEffect(() => {
    async function init() {
      // 1. Get user
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // 2. Query active tab and capture initial metadata & selection
      try {
        const tab = await getActiveTab();
        if (tab) {
          const captured = await captureTabContent(tab.id, tab.url);
          setTabData({
            id: tab.id,
            title: captured.title || tab.title || '',
            url: captured.url || tab.url || '',
            selectedText: captured.selectedText || '',
            restricted: captured.restricted || false,
            error: captured.error,
          });
        }
      } catch (err) {
        console.error('Error querying active tab:', err);
      }

      // 3. Load recent memories
      await loadRecentMemories(currentUser);
    }

    init();
  }, []);

  const loadRecentMemories = async (currentUser) => {
    setIsLoadingMemories(true);
    try {
      if (currentUser) {
        try {
          const res = await apiRequest('/memories?limit=10&sort=newest');
          if (res?.data) {
            setMemories(res.data);
            return;
          }
        } catch (apiErr) {
          console.warn('API fetch failed, falling back to local cache:', apiErr);
        }
      }
      // Fallback to local storage
      const local = await localStorageService.get('wm_local_memories', []);
      setMemories(local);
    } finally {
      setIsLoadingMemories(false);
    }
  };

  const handleSaveMemory = async (memoryPayload) => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      let savedRecord = null;

      if (user) {
        // Authenticated save to API
        try {
          const res = await apiRequest('/memories', {
            method: 'POST',
            body: JSON.stringify(memoryPayload),
          });
          savedRecord = res.data;
        } catch (err) {
          throw new Error(err.message || 'Failed to save memory to server.');
        }
      } else {
        // Local temporary storage for unauthenticated prototype/offline
        savedRecord = {
          ...memoryPayload,
          _id: 'local_' + Date.now(),
          createdAt: new Date().toISOString(),
          isLocalOnly: true,
        };
      }

      // Update local cache
      const existing = await localStorageService.get('wm_local_memories', []);
      const updated = [savedRecord, ...existing.filter(m => (m._id || m.id) !== (savedRecord._id || savedRecord.id))].slice(0, 30);
      await localStorageService.set('wm_local_memories', updated);
      setMemories(updated);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Error occurred while saving memory.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await clearAuthSession();
    setUser(null);
    const local = await localStorageService.get('wm_local_memories', []);
    setMemories(local);
  };

  const handleOpenDashboard = async () => {
    const dashboardUrl = await localStorageService.get('wm_dashboard_url', 'http://localhost:5173');
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: dashboardUrl });
    } else {
      window.open(dashboardUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col min-h-[520px] max-w-[420px] bg-slate-50 text-slate-800">
      <Header
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenDashboard={handleOpenDashboard}
      />

      <main className="flex-1 overflow-y-auto">
        <SaveForm
          tabData={tabData}
          onSave={handleSaveMemory}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
          error={error}
          onDismissError={() => setError(null)}
        />

        <RecentList
          memories={memories}
          isLoading={isLoadingMemories}
          onOpenDashboard={handleOpenDashboard}
        />
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(authedUser) => {
          setUser(authedUser);
          loadRecentMemories(authedUser);
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
