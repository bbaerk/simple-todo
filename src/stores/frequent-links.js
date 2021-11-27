import { writable } from 'svelte/store';
import pick from 'lodash/pick';

function createStore() {
  const { subscribe, set, update } = writable([]);

  return { subscribe, set, update };
}

export const frequentLinks = createStore();
