/**
 * My Todo - 통합 로그인 및 Todo 관리 시스템
 * Express + MariaDB 기반 백엔드 서버
 */

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { pool, testConnection } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 미들웨어 설정
// ==========================================

// JSON 파싱
app.use(express.json());
// URL 인코딩된 데이터 파싱
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(session({
    secret: process.env.SESSION_SECRET || 'mytodo-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24시간
        httpOnly: true
    }
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// ==========================================
// 파일 업로드 설정 (Multer)
// ==========================================

// uploads 디렉토리 생성 (없으면)
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer 스토리지 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // 파일명: user_아이디_타임스탬프.확장자
        const ext = path.extname(file.originalname);
        const filename = `user_${req.session.userId}_${Date.now()}${ext}`;
        cb(null, filename);
    }
});

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('이미지 파일만 업로드 가능합니다!'));
    }
};

// Multer 인스턴스
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
    fileFilter: fileFilter
});

// ==========================================
// 인증 미들웨어
// ==========================================

/**
 * 로그인 여부를 확인하는 미들웨어
 */
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }
    next();
}

// ==========================================
// 인증 API 엔드포인트
// ==========================================

/**
 * POST /api/auth/signup
 * 회원가입
 */
app.post('/api/auth/signup', async (req, res) => {
    const {
        email,
        password,
        nickname,
        name,
        phone,
        gender,
        address,
        securityQuestion,
        securityAnswer
    } = req.body;

    try {
        // 필수 필드 확인
        if (!email || !password || !nickname) {
            return res.status(400).json({
                success: false,
                message: '이메일, 비밀번호, 닉네임은 필수 항목입니다.'
            });
        }

        // 이메일 중복 체크
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: '이미 사용 중인 이메일입니다.'
            });
        }

        // 비밀번호 해싱 (bcrypt, salt rounds: 10)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 정보 저장
        const [result] = await pool.query(
            `INSERT INTO users (email, password, nickname, name, phone, gender, address, security_question, security_answer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [email, hashedPassword, nickname, name, phone, gender, address, securityQuestion, securityAnswer]
        );

        // 자동 로그인 처리
        req.session.userId = result.insertId;
        req.session.email = email;

        res.json({
            success: true,
            message: '회원가입이 완료되었습니다.',
            user: { id: result.insertId, email, nickname }
        });

    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '회원가입 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/auth/login
 * 로그인
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;

    try {
        // 필수 필드 확인
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '이메일과 비밀번호를 입력해주세요.'
            });
        }

        // 사용자 조회
        const [users] = await pool.query(
            'SELECT id, email, password, nickname FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        const user = users[0];

        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '이메일 또는 비밀번호가 올바르지 않습니다.'
            });
        }

        // 세션에 사용자 정보 저장
        req.session.userId = user.id;
        req.session.email = user.email;

        // Remember Me 설정
        if (rememberMe) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30일
        }

        res.json({
            success: true,
            message: '로그인 성공',
            user: { id: user.id, email: user.email, nickname: user.nickname }
        });

    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({
            success: false,
            message: '로그인 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/auth/logout
 * 로그아웃
 */
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '로그아웃 중 오류가 발생했습니다.'
            });
        }
        res.json({ success: true, message: '로그아웃되었습니다.' });
    });
});

/**
 * GET /api/auth/check
 * 로그인 상태 확인
 */
app.get('/api/auth/check', (req, res) => {
    if (req.session.userId) {
        res.json({
            success: true,
            loggedIn: true,
            user: {
                id: req.session.userId,
                email: req.session.email
            }
        });
    } else {
        res.json({
            success: true,
            loggedIn: false
        });
    }
});

/**
 * POST /api/auth/check-email
 * 이메일 중복 확인
 */
app.post('/api/auth/check-email', async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({
                success: false,
                message: '이메일을 입력해주세요.'
            });
        }

        const [users] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        res.json({
            success: true,
            available: users.length === 0,
            message: users.length === 0 ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.'
        });

    } catch (error) {
        console.error('이메일 중복 체크 오류:', error);
        res.status(500).json({
            success: false,
            message: '이메일 확인 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/auth/check-nickname
 * 닉네임 중복 확인
 */
app.post('/api/auth/check-nickname', async (req, res) => {
    const { nickname } = req.body;

    try {
        if (!nickname) {
            return res.status(400).json({
                success: false,
                message: '닉네임을 입력해주세요.'
            });
        }

        const [users] = await pool.query(
            'SELECT id FROM users WHERE nickname = ?',
            [nickname]
        );

        res.json({
            success: true,
            available: users.length === 0,
            message: users.length === 0 ? '사용 가능한 닉네임입니다.' : '이미 사용 중인 닉네임입니다.'
        });

    } catch (error) {
        console.error('닉네임 중복 체크 오류:', error);
        res.status(500).json({
            success: false,
            message: '닉네임 확인 중 오류가 발생했습니다.'
        });
    }
});

/**
 * GET /api/profile
 * 현재 로그인한 사용자의 프로필 정보 조회
 */
app.get('/api/profile', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT id, email, nickname, name, phone, gender, address, 
                    profile_image, created_at
             FROM users WHERE id = ?`,
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        const user = users[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                name: user.name,
                phone: user.phone,
                gender: user.gender,
                address: user.address,
                profileImage: user.profile_image,
                createdAt: user.created_at
            }
        });

    } catch (error) {
        console.error('프로필 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '프로필 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/profile
 * 프로필 정보 수정
 */
app.put('/api/profile', requireAuth, async (req, res) => {
    const { name, nickname, address, phone } = req.body;

    try {
        // 닉네임 변경 시 중복 체크 (다른 사용자가 사용 중인지)
        if (nickname) {
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE nickname = ? AND id != ?',
                [nickname, req.session.userId]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: '이미 사용 중인 닉네임입니다.'
                });
            }
        }

        // 프로필 업데이트
        await pool.query(
            `UPDATE users 
             SET name = COALESCE(?, name),
                 nickname = COALESCE(?, nickname),
                 address = COALESCE(?, address),
                 phone = COALESCE(?, phone)
             WHERE id = ?`,
            [name, nickname, address, phone, req.session.userId]
        );

        res.json({
            success: true,
            message: '프로필이 수정되었습니다.'
        });

    } catch (error) {
        console.error('프로필 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: '프로필 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/profile/photo
 * 프로필 사진 업로드
 */
app.post('/api/profile/photo', requireAuth, upload.single('profilePhoto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: '이미지 파일을 선택해주세요.'
            });
        }

        // 새 이미지 경로
        const imagePath = `/uploads/profiles/${req.file.filename}`;

        // 기존 이미지 정보 가져오기
        const [users] = await pool.query(
            'SELECT profile_image FROM users WHERE id = ?',
            [req.session.userId]
        );

        // 기존 이미지가 있으면 삭제
        if (users.length > 0 && users[0].profile_image) {
            const oldImagePath = path.join(__dirname, 'public', users[0].profile_image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // DB에 새 이미지 경로 저장
        await pool.query(
            'UPDATE users SET profile_image = ? WHERE id = ?',
            [imagePath, req.session.userId]
        );

        res.json({
            success: true,
            message: '프로필 사진이 업로드되었습니다.',
            imagePath: imagePath
        });

    } catch (error) {
        console.error('프로필 사진 업로드 오류:', error);

        // 업로드된 파일 삭제 (오류 발생 시)
        if (req.file) {
            const filePath = path.join(uploadsDir, req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.status(500).json({
            success: false,
            message: '프로필 사진 업로드 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/profile/password
 * 비밀번호 변경
 */
app.put('/api/profile/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: '현재 비밀번호와 새 비밀번호를 입력해주세요.'
            });
        }

        // 현재 비밀번호 확인
        const [users] = await pool.query(
            'SELECT password FROM users WHERE id = ?',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '현재 비밀번호가 올바르지 않습니다.'
            });
        }

        // 새 비밀번호 해싱
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 비밀번호 업데이트
        await pool.query(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedNewPassword, req.session.userId]
        );

        res.json({
            success: true,
            message: '비밀번호가 변경되었습니다.'
        });

    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        res.status(500).json({
            success: false,
            message: '비밀번호 변경 중 오류가 발생했습니다.'
        });
    }
});

/**
 * DELETE /api/profile/account
 * 회원 탈퇴 (계정 삭제)
 */
app.delete('/api/profile/account', requireAuth, async (req, res) => {
    const { password } = req.body;

    try {
        if (!password) {
            return res.status(400).json({
                success: false,
                message: '비밀번호를 입력해주세요.'
            });
        }

        // 비밀번호 확인
        const [users] = await pool.query(
            'SELECT password FROM users WHERE id = ?',
            [req.session.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, users[0].password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '비밀번호가 올바르지 않습니다.'
            });
        }

        // 사용자의 모든 Todo 먼저 삭제 (CASCADE가 설정되어 있지만 명시적으로)
        await pool.query(
            'DELETE FROM todos WHERE user_id = ?',
            [req.session.userId]
        );

        // 사용자 계정 삭제
        await pool.query(
            'DELETE FROM users WHERE id = ?',
            [req.session.userId]
        );

        // 세션 종료
        req.session.destroy();

        res.json({
            success: true,
            message: '회원 탈퇴가 완료되었습니다.'
        });

    } catch (error) {
        console.error('회원 탈퇴 오류:', error);
        res.status(500).json({
            success: false,
            message: '회원 탈퇴 중 오류가 발생했습니다.'
        });
    }
});

// ==========================================
// Todo CRUD API 엔드포인트
// ==========================================

/**
 * GET /api/todos
 * 현재 로그인한 사용자의 Todo 목록 조회
 */
app.get('/api/todos', requireAuth, async (req, res) => {
    try {
        const [todos] = await pool.query(
            `SELECT id, text, category, repetition, priority, emoji, due_date, due_time, completed, created_at
       FROM todos
       WHERE user_id = ?
       ORDER BY due_date ASC, due_time ASC, priority DESC, created_at DESC`,
            [req.session.userId]
        );

        // Date/Time 포맷팅
        const formattedTodos = todos.map(todo => ({
            ...todo,
            dueDate: todo.due_date ? todo.due_date.toISOString().split('T')[0] : '',
            dueTime: todo.due_time || '',
            completed: !!todo.completed
        }));

        res.json({ success: true, todos: formattedTodos });

    } catch (error) {
        console.error('Todo 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: 'Todo 목록 조회 중 오류가 발생했습니다.'
        });
    }
});

/**
 * POST /api/todos
 * Todo 추가
 */
app.post('/api/todos', requireAuth, async (req, res) => {
    const {
        text,
        category,
        repetition,
        priority,
        emoji,
        dueDate,
        dueTime
    } = req.body;

    try {
        // 필수 필드 확인
        if (!text) {
            return res.status(400).json({
                success: false,
                message: '할 일 내용을 입력해주세요.'
            });
        }

        // Todo 추가
        const [result] = await pool.query(
            `INSERT INTO todos (user_id, text, category, repetition, priority, emoji, due_date, due_time, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.session.userId,
                text,
                category || 'all',
                repetition || 'none',
                priority || 'none',
                emoji || null,
                dueDate || null,
                dueTime || null,
                false
            ]
        );

        res.json({
            success: true,
            message: 'Todo가 추가되었습니다.',
            todo: {
                id: result.insertId,
                text,
                category,
                repetition,
                priority,
                emoji,
                dueDate,
                dueTime,
                completed: false
            }
        });

    } catch (error) {
        console.error('Todo 추가 오류:', error);
        res.status(500).json({
            success: false,
            message: 'Todo 추가 중 오류가 발생했습니다.'
        });
    }
});

/**
 * PUT /api/todos/:id
 * Todo 수정
 */
app.put('/api/todos/:id', requireAuth, async (req, res) => {
    const todoId = req.params.id;
    const {
        text,
        category,
        repetition,
        priority,
        emoji,
        dueDate,
        dueTime,
        completed
    } = req.body;

    try {
        // Todo 소유권 확인
        const [todos] = await pool.query(
            'SELECT id FROM todos WHERE id = ? AND user_id = ?',
            [todoId, req.session.userId]
        );

        if (todos.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Todo를 찾을 수 없거나 권한이 없습니다.'
            });
        }

        // Todo 수정
        await pool.query(
            `UPDATE todos
       SET text = ?, category = ?, repetition = ?, priority = ?, emoji = ?,
           due_date = ?, due_time = ?, completed = ?
       WHERE id = ? AND user_id = ?`,
            [
                text,
                category || 'all',
                repetition || 'none',
                priority || 'none',
                emoji || null,
                dueDate || null,
                dueTime || null,
                completed ? 1 : 0,
                todoId,
                req.session.userId
            ]
        );

        res.json({
            success: true,
            message: 'Todo가 수정되었습니다.'
        });

    } catch (error) {
        console.error('Todo 수정 오류:', error);
        res.status(500).json({
            success: false,
            message: 'Todo 수정 중 오류가 발생했습니다.'
        });
    }
});

/**
 * DELETE /api/todos/:id
 * Todo 삭제
 */
app.delete('/api/todos/:id', requireAuth, async (req, res) => {
    const todoId = req.params.id;

    try {
        // Todo 삭제 (소유권 확인 포함)
        const [result] = await pool.query(
            'DELETE FROM todos WHERE id = ? AND user_id = ?',
            [todoId, req.session.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Todo를 찾을 수 없거나 권한이 없습니다.'
            });
        }

        res.json({
            success: true,
            message: 'Todo가 삭제되었습니다.'
        });

    } catch (error) {
        console.error('Todo 삭제 오류:', error);
        res.status(500).json({
            success: false,
            message: 'Todo 삭제 중 오류가 발생했습니다.'
        });
    }
});

// ==========================================
// 기본 라우트
// ==========================================

// 루트 경로는 로그인 페이지로 리다이렉트
app.get('/', (req, res) => {
    res.redirect('/login/index.html');
});

// ==========================================
// 서버 시작
// ==========================================

async function startServer() {
    // 데이터베이스 연결 테스트
    const isConnected = await testConnection();

    if (!isConnected) {
        console.error('❌ 데이터베이스 연결 실패로 서버를 시작할 수 없습니다.');
        console.error('다음을 확인해주세요:');
        console.error('1. MariaDB/MySQL 서버가 실행 중인지 확인');
        console.error('2. config/db.js의 연결 정보가 올바른지 확인');
        console.error('3. schema.sql을 실행하여 데이터베이스와 테이블을 생성했는지 확인');
        process.exit(1);
    }

    // Express 서버 시작
    app.listen(PORT, () => {
        console.log('');
        console.log('==========================================');
        console.log('🚀 My Todo 서버가 시작되었습니다!');
        console.log('==========================================');
        console.log(`📍 서버 주소: http://localhost:${PORT}`);
        console.log(`📂 로그인 페이지: http://localhost:${PORT}/login/index.html`);
        console.log(`📋 Todo 페이지: http://localhost:${PORT}/todo/index.html`);
        console.log('==========================================');
        console.log('');
    });
}

startServer();
