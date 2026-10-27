import request from '../utils/request'

export function getAllTodos() {
  return request.get('/todo')
}

export function addTodo(data) {
  return request.post('/todo', data)
}

export function updateTodo(id) {
  return request.put(`/todo/${id}`)
}

export function deleteTodo(id) {
  return request.delete(`/todo/${id}`)
}
