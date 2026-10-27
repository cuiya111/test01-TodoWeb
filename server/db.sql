-- 创建数据库
CREATE DATABASE IF NOT EXISTS my_todolist DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE my_todolist;

-- 创建 todo 表
CREATE TABLE IF NOT EXISTS todo (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键自增id',
  isCompleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否完成 0未完成 1已完成',
  text VARCHAR(500) NOT NULL COMMENT '待办内容'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;