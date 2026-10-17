/**
 * API client for Chrome Extension
 * Handles communicating with the Express backend, authentication token lifecycle,
 * and fallback to local temporary storage if unauthenticated or offline.
 */

import { localStorageService } from './chrome';

const DEFAULT_API_BASE = 'http://localhost:5000/api';

export async function getApiBaseUrl() {
  const configured = await localStorageService.get('wm_api_url', DEFAULT_API_BASE);
  return configured || DEFAULT_API_BASE;
}

export async function getAuthToken() {
  return await localStorageService.get('wm_token', null);
}

export async function getCurrentUser() {
  return await localStorageService.get('wm_user', null);
}

export async function setAuthSession(token, user) {
  await localStorageService.set('wm_token', token);
  await localStorageService.set('wm_user', user);
}

export async function clearAuthSession() {
  await localStorageService.remove('wm_token');
  await localStorageService.remove('wm_user');
}

/**
 * Sends authenticated request to API
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = await getApiBaseUrl();
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let responseData = null;
  if (contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = { message: await response.text() };
  }

  if (!response.ok) {
    const errorMsg = responseData?.error?.message || responseData?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.code = responseData?.error?.code;
    throw err;
  }

  return responseData;
}
