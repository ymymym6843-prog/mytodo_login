-- ==========================================
-- My Todo 데이터베이스 스키마
-- ==========================================

-- 데이터베이스 생성 (존재하지 않는 경우)
CREATE DATABASE IF NOT EXISTS mytodo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 데이터베이스 사용
USE mytodo;

-- ==========================================
-- Users 테이블: 사용자 정보
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '사용자 고유 ID',
  email VARCHAR(255) NOT NULL UNIQUE COMMENT '이메일 (로그인 ID)',
  password VARCHAR(255) NOT NULL COMMENT '해시된 비밀번호',
  nickname VARCHAR(100) NOT NULL COMMENT '닉네임',
  name VARCHAR(100) DEFAULT NULL COMMENT '이름',
  phone VARCHAR(20) DEFAULT NULL COMMENT '휴대전화번호',
  gender VARCHAR(20) DEFAULT NULL COMMENT '성별',
  address TEXT DEFAULT NULL COMMENT '주소',
  security_question VARCHAR(255) DEFAULT NULL COMMENT '보안 질문',
  security_answer VARCHAR(255) DEFAULT NULL COMMENT '보안 답변',
  profile_image TEXT DEFAULT NULL COMMENT '프로필 이미지 (Base64 또는 URL)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '가입일시',
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 정보 테이블';

-- ==========================================
-- Todos 테이블: 할 일 목록
-- ==========================================
CREATE TABLE IF NOT EXISTS todos (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Todo 고유 ID',
  user_id INT NOT NULL COMMENT '사용자 ID (FK)',
  text TEXT NOT NULL COMMENT '할 일 내용',
  category VARCHAR(50) DEFAULT 'all' COMMENT '카테고리 (work, personal, exercise, rest, all)',
  repetition VARCHAR(50) DEFAULT 'none' COMMENT '반복 설정 (none, daily, weekly, monthly, weekdays)',
  priority VARCHAR(20) DEFAULT 'none' COMMENT '우선순위 (high, medium, low, none)',
  emoji VARCHAR(10) DEFAULT NULL COMMENT '이모티콘',
  due_date DATE DEFAULT NULL COMMENT '마감일',
  due_time TIME DEFAULT NULL COMMENT '마감시간',
  completed BOOLEAN DEFAULT FALSE COMMENT '완료 여부',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_due_date (due_date),
  INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='할 일 목록 테이블';

-- ==========================================
-- 초기 데이터 확인
-- ==========================================
SELECT 'Database and tables created successfully!' AS Status;
