<script>
import { createEventDispatcher } from 'svelte';
import { dndzone, TRIGGERS } from 'svelte-dnd-action';
import TodoItem from '@components/TodoItem.svelte';

export let todos;

const dispatch = createEventDispatcher();

const handleUpdateTodo = (event) => dispatch('updatetodo', event.detail);
const handleEditTodo = (todo) => dispatch('edittodo', todo);
const handleDeleteTodo = (todo) => dispatch('deletetodo', todo);
const handleDragAndDrop = (event) => {
  todos = event.detail.items.map((todo, i, items) => ({ ...todo, order: items.length - i }));
  if (event.detail.info.trigger == TRIGGERS.DROPPED_INTO_ZONE) {
    dispatch('update', todos);
  }
};
</script>

<ol use:dndzone={{ items: todos, dropTargetStyle: {} }} on:consider={handleDragAndDrop} on:finalize={handleDragAndDrop}>
  {#each todos as todo (todo.id)}
    <TodoItem
      {todo}
      on:update={handleUpdateTodo}
      on:edit={() => handleEditTodo(todo)}
      on:delete={() => handleDeleteTodo(todo)}
    />
  {/each}
</ol>

<style>
ol {
  display: flex;
  flex-direction: column;
  gap: 2rem;

  padding: 0 6px 0 1.4rem;
  margin: 0 -1.4rem;
  list-style: none;
  overflow-y: scroll;
}

ol::-webkit-scrollbar {
  width: 8px;
}

ol::-webkit-scrollbar-thumb {
  border-radius: 1rem;
  background-color: var(--dimmed-300);
}
</style>
