const express = require('express')
const pool = require('../db')

const router = express.Router()

// 1. 获取所有待办
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM todo ORDER BY id DESC')  // 这里必须将id输出，这样前端才能获取id
    res.json({ code: 200, data: rows })
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message })
  }
})

// 2. 新增待办
router.post('/', async (req, res) => {
  const { text } = req.body
  if (!text || !text.trim()) return res.status(400).json({ code: 400, msg: '待办内容不能为空' })
  try {
    const [result] = await pool.query('INSERT INTO todo (text) VALUES (?)', [text])
    res.json({ code: 200, data: { text, isCompleted: 0 } })
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message })
  }
})

// 3. 修改待办（更新内容 / 完成状态）【params路径传id】
router.put('/:id', async (req, res) => {
  // 从路径参数拿id，不再 req.body
  const { id } = req.params
  const numId = Number(id)
  if (!id || !Number.isInteger(numId) || numId <= 0) {
    return res.status(400).json({ code: 400, msg: '参数错误：id 必须为正整数' })
  }
  try {
    const [result] = await pool.query(
      'UPDATE todo SET isCompleted = 1 - isCompleted WHERE id = ?',
      [numId]
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, msg: '待办不存在' })
    }
    const [rows] = await pool.query(
      'SELECT isCompleted, text FROM todo WHERE id = ?',
      [numId]
    )
    res.json({ code: 200, msg: '修改成功' })  
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message })
  }
})

// 4. 删除待办【params路径传id】
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const numId = Number(id)
  if (!id || !Number.isInteger(numId) || numId <= 0) {
    return res.status(400).json({ code: 400, msg: '参数错误：id 必须为正整数' })
  }
  try {
    const [result] = await pool.query('DELETE FROM todo WHERE id = ?', [numId])
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, msg: '待办不存在' })
    }
    res.json({ code: 200, msg: '删除成功' }) 
  } catch (e) {
    res.status(500).json({ code: 500, msg: e.message })
  }
})


module.exports = router