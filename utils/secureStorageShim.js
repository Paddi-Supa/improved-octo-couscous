import * as SecureStore from 'expo-secure-store';

// A tiny shim that provides an AsyncStorage-like interface expected by
// firebase's getReactNativePersistence while using expo-secure-store under the hood.
// Methods match: getItem(key), setItem(key, value), removeItem(key)

// SecureStore only accepts a restricted set of characters for keys.
// Firebase persistence may pass keys with characters SecureStore rejects (e.g. ':', '/').
// To be compatible we deterministically "sanitize" arbitrary keys into an allowed set
// by leaving safe chars as-is and encoding unsafe chars as '.' + HEXCODE (uppercase).
const sanitizeKey = (k) => {
  if (typeof k !== 'string') return null;
  if (k.length === 0) return null;
  let out = '';
  for (let i = 0; i < k.length; i++) {
    const ch = k[i];
    if (/^[A-Za-z0-9._-]$/.test(ch)) {
      out += ch;
    } else {
      const hex = ch.charCodeAt(0).toString(16).toUpperCase();
      out += '.' + hex;
    }
  }
  return out;
};

const shim = {
  async getItem(key) {
    const sKey = sanitizeKey(key);
    if (!sKey) {
      console.warn('secureStorageShim.getItem called with invalid key', String(key));
      return null;
    }
    try {
      const v = await SecureStore.getItemAsync(sKey);
      return v === undefined ? null : v;
    } catch (e) {
      console.warn('secureStorageShim.getItem error', e);
      return null;
    }
  },
  async setItem(key, value) {
    const sKey = sanitizeKey(key);
    if (!sKey) {
      console.warn('secureStorageShim.setItem called with invalid key', String(key));
      return;
    }
    try {
      await SecureStore.setItemAsync(sKey, value == null ? '' : String(value));
    } catch (e) {
      console.warn('secureStorageShim.setItem error', e);
    }
  },
  async removeItem(key) {
    const sKey = sanitizeKey(key);
    if (!sKey) {
      console.warn('secureStorageShim.removeItem called with invalid key', String(key));
      return;
    }
    try {
      await SecureStore.deleteItemAsync(sKey);
    } catch (e) {
      console.warn('secureStorageShim.removeItem error', e);
    }
  },
};

export default shim;
