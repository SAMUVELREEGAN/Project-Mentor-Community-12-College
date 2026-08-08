export const API_BASE = 'http://localhost:8000/api';
export const UPLOAD_BASE = 'http://localhost:8000/uploads';

export const USER_TOKEN_KEY = 'pmc_user_token';
export const USER_DATA_KEY = 'pmc_user_data';
export const ADMIN_TOKEN_KEY = 'pmc_admin_token';
export const ADMIN_DATA_KEY = 'pmc_admin_data';

export function getStorageItem(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorageItem(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function removeStorageItem(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
