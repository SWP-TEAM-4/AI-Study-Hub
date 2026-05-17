-- Database demo nè

CREATE DATABASE IF NOT EXISTS aistudyhub;
USE aistudyhub;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('STUDENT', 'TEACHER', 'ADMIN') DEFAULT 'STUDENT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Documents table
CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_size BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Document shares table
CREATE TABLE document_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  shared_with_user_id INT NOT NULL,
  permission ENUM('VIEW', 'EDIT', 'MANAGE') DEFAULT 'VIEW',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_share (document_id, shared_with_user_id)
);

-- Chatbot messages table
CREATE TABLE chatbot_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  document_id INT,
  message TEXT NOT NULL,
  response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id)
);

-- Storage quota table
CREATE TABLE storage_quota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  total_quota BIGINT DEFAULT 5368709120,
  used_space BIGINT DEFAULT 0,
  plan_type ENUM('FREE', 'PREMIUM', 'ENTERPRISE') DEFAULT 'FREE',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
