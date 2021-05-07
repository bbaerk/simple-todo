import { writable } from 'svelte/store';
import { STORAGE_KEY_SETTINGS, THEME_SYSTEM } from '@lib/constants';

function createStore() {
  const cachedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
  const defaultSettings = {
    theme: THEME_SYSTEM,
  };

  const { subscribe, set, update } = writable(cachedSettings ? JSON.parse(cachedSettings) : defaultSettings);

  let settingsCache = null;

  function preview(data) {
    update((settings) => {
      settingsCache = settingsCache || settings;
      return data;
    });
  }

  function restore() {
    if (settingsCache) {
      set(settingsCache);
      settingsCache = null;
    }
  }

  function save(data) {
    set(data);
    settingsCache = null;
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data));
  }

  return { subscribe, set, update, preview, restore, save };
}

export const settings = createStore();
