/**
 * 데이터베이스 연결 설정
 * MariaDB (MySQL2) 연결 풀을 생성하여 재사용
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

// 데이터베이스 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'mytodo',
  waitForConnections: true,
  connectionLimit: 10,      // 최대 연결 수
  queueLimit: 0,            // 대기 큐에 제한 없음
  charset: 'utf8mb4'        // 이모지 지원을 위한 utf8mb4
});

// 데이터베이스 연결 테스트 함수
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MariaDB 데이터베이스 연결 성공!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MariaDB 데이터베이스 연결 실패:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
