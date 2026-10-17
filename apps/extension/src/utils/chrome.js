/**
 * Chrome Tab & Content Extraction Helpers
 * Handles restricted tabs, activeTab query, and scripting injection safely.
 */

import { isValidHttpUrl, extractDomain, LIMITS } from '@web-memory/shared';

/**
 * Checks if a URL is restricted (Chrome internal, Web Store, file, etc.)
 * @param {string} url
 * @returns {boolean}
 */
export function isRestrictedUrl(url) {
  if (!url) return true;
  const restrictedPrefixes = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'view-source:',
    'https://chromewebstore.google.com',
    'https://chrome.google.com/webstore',
  ];
  return restrictedPrefixes.some(prefix => url.startsWith(prefix));
}

/**
 * Queries the active tab in current window.
 * Falls back to mock data if running outside Chrome extension environment.
 */
export async function getActiveTab() {
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
    // Development fallback
    return {
      id: 99999,
      title: 'Sample Developer Documentation — Web Memory Guide',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API',
    };
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

/**
 * Captures page metadata and selection from the active tab.
 * Uses chrome.scripting.executeScript.
 */
export async function captureTabContent(tabId, tabUrl) {
  if (!tabUrl || isRestrictedUrl(tabUrl) || !isValidHttpUrl(tabUrl)) {
    return {
      restricted: true,
      title: '',
      url: tabUrl || '',
      selectedText: '',
      error: 'Cannot capture content from restricted pages or non-HTTP URLs.',
    };
  }

  if (typeof chrome === 'undefined' || !chrome.scripting || !chrome.scripting.executeScript) {
    // Development fallback
    return {
      restricted: false,
      title: 'Sample Developer Documentation — Web Memory Guide',
      url: tabUrl,
      selectedText: 'The Document Object Model (DOM) connects web pages to scripts or programming languages.',
      error: null,
    };
  }

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const title = document.title || '';
        const url = window.location.href || '';
        const selection = window.getSelection() ? window.getSelection().toString() : '';
        return { title, url, selection };
      },
    });

    if (!results || !results[0] || !results[0].result) {
      return {
        restricted: false,
        title: '',
        url: tabUrl,
        selectedText: '',
        error: 'Unable to access page content.',
      };
    }

    const { title, url, selection } = results[0].result;
    return {
      restricted: false,
      title: (title || '').trim().slice(0, LIMITS.TITLE_MAX_LENGTH),
      url: url || tabUrl,
      selectedText: (selection || '').trim().slice(0, LIMITS.SELECTED_TEXT_MAX_LENGTH),
      error: null,
    };
  } catch (err) {
    return {
      restricted: true,
      title: '',
      url: tabUrl,
      selectedText: '',
      error: `Script execution blocked on this tab: ${err.message || 'Restricted page'}`,
    };
  }
}

/**
 * Storage helper for local drafts and recent memories
 */
export const localStorageService = {
  async get(key, defaultValue = null) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] !== undefined ? result[key] : defaultValue);
        });
      });
    }
    const val = window.localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  },

  async set(key, value) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      });
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  },

  async remove(key) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => {
        chrome.storage.local.remove([key], () => resolve());
      });
    }
    window.localStorage.removeItem(key);
  }
};
