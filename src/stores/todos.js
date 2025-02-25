import { writable, derived } from 'svelte/store';
import { tweened } from 'svelte/motion';
import * as uuid from 'uuid';
import pick from 'lodash/pick';
import { trackEvent } from '@lib/umami';
import { STORAGE_KEY_DATA } from '@lib/constants';

const REMOVE_TIMER_DURATION = 2000;
const REMOVE_TIMER_INITIAL = 0;
const REMOVE_TIMER_FINAL = 1;

function createStore() {
  const cachedTodos = localStorage.getItem(STORAGE_KEY_DATA);
  const allowedFields = ['id', 'body', 'list', 'order', 'done', 'tags'];

  const { subscribe, set: _set, update: _update } = writable(cachedTodos ? JSON.parse(cachedTodos) : []);

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY_DATA) {
      set(JSON.parse(event.newValue));
    }
  });

  function set(data) {
    _set(data.map((todo) => pick(todo, allowedFields)));
  }

  function update(data) {
    _update((todos) => {
      return todos.map((todo) => {
        if (todo.id === data.id) {
          if (todo.done !== data.done) {
            trackEvent('todos', data.done ? 'done' : 'undone');
          }
          return { ...todo, ...pick(data, allowedFields) };
        }
        return todo;
      });
    });
  }

  function save(data) {
    if (data.id) {
      _update((todos) => todos.map((todo) => (todo.id === data.id ? pick(data, allowedFields) : todo)));
      trackEvent('todos', 'edit');
    } else {
      _update((todos) => {
        const order = Math.max(...todos.filter((todo) => todo.list === data.list).map((todo) => todo.order), 0) + 1;
        return [
          ...todos,
          {
            ...pick(data, allowedFields),
            id: uuid.v4(),
            order,
            done: false,
            createdAt: Date.now(),
          },
        ];
      });
      trackEvent('todos', 'add');
    }
  }

  function remove(data) {
    _update((todos) => todos.filter((todo) => todo.id !== data.id));
    trackEvent('todos', 'remove');
  }

  let removeDoneCache = [];
  const removeDoneTimer = tweened(REMOVE_TIMER_INITIAL, { duration: REMOVE_TIMER_DURATION });
  removeDoneTimer.subscribe((value) => {
    if (value === REMOVE_TIMER_FINAL) {
      removeDoneCache = [];
      removeDoneTimer.set(REMOVE_TIMER_INITIAL, { duration: 0 });
    }
  });
  const removeDoneTimerFinished = derived(removeDoneTimer, (value) => value === REMOVE_TIMER_FINAL);

  function removeDone() {
    _update((todos) => {
      removeDoneCache = todos.filter((todo) => todo.done);
      removeDoneTimer.set(REMOVE_TIMER_INITIAL, { duration: 0 });
      removeDoneTimer.set(REMOVE_TIMER_FINAL);
      return todos.filter((todo) => !todo.done);
    });
    trackEvent('todos', 'remove-done');
  }

  function undoRemoveDone() {
    _update((todos) => {
      todos = [...todos, ...removeDoneCache];
      removeDoneCache = [];
      removeDoneTimer.set(REMOVE_TIMER_INITIAL, { duration: 0 });
      return todos;
    });
    trackEvent('todos', 'undo-remove-done');
  }

  function updateTags(tags) {
    _update((todos) => {
      todos = todos.map((todo) => ({
        ...todo,
        tags: todo.tags?.filter((tag) => tags.hasOwnProperty(tag)),
      }));
      return todos;
    });
  }

  return {
    subscribe,
    set,
    update,
    save,
    remove,
    removeDone,
    undoRemoveDone,
    removeDoneTimer,
    removeDoneTimerFinished,
    updateTags,
  };
}

export const todos = createStore();
export const removeDoneTimer = todos.removeDoneTimer;
export const removeDoneTimerFinished = todos.removeDoneTimerFinished;

todos.subscribe((value) => localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(value)));
