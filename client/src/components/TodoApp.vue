<script setup>
import { ref, onMounted } from 'vue'
import { getAllTodos, addTodo, updateTodo, deleteTodo } from '../api/todo'

const list = ref([])
const value = ref('')
const loading = ref(false)

async function getList() {
  try {
    list.value = await getAllTodos()
  } catch (e) {
    console.error(e)
  }
}

async function add() {
  const text = value.value.trim()
  if (!text) return
  try {
    await addTodo({ text })
    value.value = ''
    await getList()
  } catch (e) {
    alert(e.message || '新增失败')
  }
}

async function update(item) {
  try {
    await updateTodo(item.id)
    item.isCompleted = item.isCompleted ? 0 : 1
  } catch (e) {
    console.error(e)
  }
}

async function del(item) {
  try {
    await deleteTodo(item.id)
    list.value = list.value.filter((d) => d.id !== item.id)
  } catch (e) {
    console.error(e)
  }
}

onMounted(getList)
</script>

<template>
  <div class="todo-app">
    <div class="title">Todo App</div>

    <div class="todo-form">
      <input
        v-model="value"
        type="text"
        class="todo-input"
        placeholder="Add a todo"
        @keyup.enter="add"
      />
      <div @click="add" class="todo-button">Add Todo</div>
    </div>

    <div class="empty" v-if="!loading && !list.length">暂无待办</div>

    <div
      class="item"
      v-for="item in list"
      :key="item.id"
      :class="{ completed: !!item.isCompleted }"
    >
      <div class="item-left">
        <input
          :checked="!!item.isCompleted"
          @change="update(item)"
          type="checkbox"
        />
        <span class="name">{{ item.text }}</span>
      </div>

      <div @click="del(item)" class="del">del</div>
    </div>
  </div>
</template>

<style scoped>
.todo-app {
  box-sizing: border-box;
  margin-top: 40px;
  margin-left: 1%;
  padding-top: 30px;
  width: 98%;
  min-height: 500px;
  background: #ffffff;
  border-radius: 5px;
}

.title {
  text-align: center;
  font-size: 30px;
  font-weight: 700;
}

.todo-form {
  display: flex;
  margin: 20px 0 30px 20px;
}

.todo-button {
  width: 100px;
  height: 52px;
  border-radius: 0 20px 20px 0;
  text-align: center;
  background: linear-gradient(
    to right,
    rgb(113, 65, 168),
    rgba(44, 114, 251, 1)
  );
  color: #fff;
  line-height: 52px;
  cursor: pointer;
  font-size: 14px;
  user-select: none;
}

.todo-input {
  padding: 0px 15px;
  border-radius: 20px 0 0 20px;
  border: 1px solid #dfe1e5;
  outline: none;
  width: 60%;
  height: 50px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 60px 0;
  font-size: 16px;
}

.item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 80%;
  min-height: 50px;
  margin: 8px auto;
  padding: 16px;
  border-radius: 20px;
  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 20px;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.del {
  color: red;
  user-select: none;
  cursor: pointer;
}

.completed {
  text-decoration: line-through;
  opacity: 0.4;
}
</style>