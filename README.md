# My Todo - 통합 로그인 및 Todo 관리 시스템

Node.js + Express + MariaDB 기반의 사용자별 Todo 관리 시스템입니다.

## 🎯 주요 기능

### 인증 시스템
- ✅ **회원가입** - 이메일, 비밀번호, 닉네임, 보안 질문 등
- ✅ **이메일/닉네임 중복 확인** - 실시간 중복 체크
- ✅ **휴대전화 인증** - 데모 인증번호 팝업 (123456)
- ✅ **로그인/로그아웃** - 세션 기반 인증
- ✅ **비밀번호 해싱** - bcrypt 10 라운드

### 프로필 관리
- ✅ **프로필 정보 조회** - 이메일, 닉네임, 이름, 가입일 확인
- ✅ **프로필 사진 업로드** - 5MB 제한, jpg/png/gif/webp 지원
- ✅ **정보 수정** - 이름, 닉네임, 주소, 전화번호 변경
- ✅ **비밀번호 변경** - 현재 비밀번호 확인 후 변경
- ✅ **회원 탈퇴** - 이중 확인 및 비밀번호 검증

### Todo 관리
- ✅ **Todo 추가/수정/삭제** - 완전한 CRUD 기능
- ✅ **카테고리 분류** - 업무, 개인, 운동, 휴식
- ✅ **우선순위 설정** - 상(빨강), 중(노랑), 하(초록)
- ✅ **마감일/시간 설정** - 자동 시간 포맷팅
- ✅ **이모티콘 지원** - UTF-8MB4
- ✅ **반복 일정** - 매일, 매주, 매월, 평일
- ✅ **캘린더 뷰** - 월별 일정 시각화
- ✅ **검색 및 필터링** - 카테고리별, 키워드 검색

## 📁 프로젝트 구조

```
mydiary_login/
├── config/
│   └── db.js              # 데이터베이스 연결 설정
├── public/
│   ├── login/
│   │   ├── index.html     # 로그인/회원가입 페이지
│   │   ├── style.css      # 로그인 페이지 스타일
│   │   └── script.js      # 로그인 페이지 스크립트
│   ├── todo/
│   │   ├── index.html     # Todo 관리 페이지
│   │   ├── style.css      # Todo 페이지 스타일
│   │   └── script.js      # Todo 페이지 스크립트
│   └── uploads/
│       └── profiles/      # 프로필 사진 저장 폴더
├── schema.sql             # 데이터베이스 스키마
├── server.js              # Express 서버
├── package.json           # 프로젝트 의존성
├── .env.example           # 환경 변수 템플릿
├── .gitignore             # Git 제외 파일 목록
└── README.md              # 이 파일
```

## 🚀 설치 및 실행 방법

### 1. 사전 요구사항

시작하기 전에 다음 프로그램들이 설치되어 있어야 합니다:

#### Node.js 설치 확인
```bash
node --version
# 출력 예: v18.17.0 (v14 이상이면 OK)

npm --version
# 출력 예: 9.6.7
```

Node.js가 설치되어 있지 않다면:
- **다운로드**: https://nodejs.org/ 에서 LTS 버전 다운로드
- **권장 버전**: v18 이상

#### MariaDB/MySQL 설치 확인
```bash
mysql --version
# 출력 예: mysql Ver 15.1 Distrib 10.11.6-MariaDB (v10 이상이면 OK)
```

MariaDB/MySQL이 설치되어 있지 않다면:
- **MariaDB**: https://mariadb.org/download/
- **MySQL**: https://dev.mysql.com/downloads/mysql/

---

### 2. 프로젝트 클론 (Git Clone)

#### ✅ Git 저장소에서 프로젝트 복사

먼저 프로젝트를 저장할 폴더로 이동합니다:

```bash
# Windows (원하는 경로로 이동)
cd C:\Users\YourName\Documents

# Mac/Linux
cd ~/Documents
```

GitHub 저장소를 클론합니다:

```bash
# HTTPS 방식 (권장)
git clone https://github.com/YOUR_USERNAME/mydiary_login.git

# SSH 방식 (SSH 키가 설정된 경우)
git clone git@github.com:YOUR_USERNAME/mydiary_login.git
```

> **참고**: `YOUR_USERNAME`은 실제 GitHub 사용자명으로 변경해주세요!

클론한 프로젝트 폴더로 이동:

```bash
cd mydiary_login
```

**예상 결과:**
```
Cloning into 'mydiary_login'...
remote: Enumerating objects: 125, done.
remote: Counting objects: 100% (125/125), done.
remote: Compressing objects: 100% (85/85), done.
Receiving objects: 100% (125/125), 45.23 KiB | 2.12 MiB/s, done.
```

---

### 3. 환경 변수 설정 (.env 파일 생성)

#### ✅ .env.example 파일을 복사하여 .env 파일 생성

프로젝트에는 `.env.example` 템플릿 파일이 포함되어 있습니다. 이를 복사하여 `.env` 파일을 만듭니다:

**Windows (명령 프롬프트 또는 PowerShell):**
```bash
copy .env.example .env
```

**Mac/Linux (터미널):**
```bash
cp .env.example .env
```

#### ✅ .env 파일 편집

`.env` 파일을 텍스트 에디터(VS Code, 메모장 등)로 열고 본인의 환경에 맞게 수정합니다:

```env
# Database Configuration
DB_HOST=localhost                           # 데이터베이스 서버 주소 (로컬이면 localhost)
DB_USER=root                                # 데이터베이스 사용자명
DB_PASSWORD=your_database_password_here     # ⚠️ 본인의 MariaDB/MySQL 비밀번호로 변경!
DB_NAME=mytodo                              # 데이터베이스 이름 (변경 가능)

# Server Configuration
PORT=3000                                   # 서버 포트 (기본 3000, 충돌 시 3001 등으로 변경)

# Session Configuration
SESSION_SECRET=your_session_secret_key_here # ⚠️ 랜덤한 문자열로 변경! (예: my_super_secret_key_12345)
```

**⚠️ 중요:**
- `DB_PASSWORD`: 본인의 MariaDB/MySQL 루트 비밀번호 입력
- `SESSION_SECRET`: 보안을 위해 랜덤한 문자열로 변경 (예: `mysecret2024!@#`)

**예시:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=mypassword123
DB_NAME=mytodo
PORT=3000
SESSION_SECRET=random_secret_key_abc123xyz
```

---

### 4. 데이터베이스 설정

#### ✅ MariaDB/MySQL 서버 실행 확인

**Windows:**
- 작업 관리자 → 서비스 탭 → "MySQL" 또는 "MariaDB" 서비스 확인
- 또는 `services.msc` 실행 후 확인

**Mac (Homebrew):**
```bash
brew services start mariadb
# 또는
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo systemctl start mariadb
# 또는
sudo systemctl start mysql
```

#### ✅ 데이터베이스 스키마 생성

프로젝트에 포함된 `schema.sql` 파일을 실행하여 데이터베이스와 테이블을 생성합니다.

**방법 1: MySQL 명령줄에서 직접 실행 (권장)**

```bash
# 1. MariaDB/MySQL에 접속
mysql -u root -p
# 비밀번호 입력

# 2. 스키마 파일 실행 (MySQL 프롬프트 내에서)
source schema.sql;

# 3. 데이터베이스 생성 확인
SHOW DATABASES;
USE mytodo;
SHOW TABLES;

# 4. 종료
exit;
```

**방법 2: 명령줄에서 한 번에 실행**

**Windows (명령 프롬프트):**
```bash
mysql -u root -p < schema.sql
```

**Mac/Linux:**
```bash
mysql -u root -p < schema.sql
```

**예상 결과:**
```
Database changed
Query OK, 0 rows affected
Query OK, 0 rows affected
Query OK, 0 rows affected
```

데이터베이스가 올바르게 생성되었는지 확인:
```bash
mysql -u root -p -e "USE mytodo; SHOW TABLES;"
```

**출력 예시:**
```
+-------------------+
| Tables_in_mytodo  |
+-------------------+
| todos            |
| users            |
+-------------------+
```

---

### 5. 패키지 설치 (npm install)

#### ✅ Node.js 의존성 패키지 설치

프로젝트 폴더에서 다음 명령어를 실행합니다:

```bash
npm install
```

**예상 결과:**
```
added 92 packages, and audited 93 packages in 8s

8 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

설치되는 주요 패키지:
- `express` - 웹 프레임워크
- `mysql2` - MariaDB/MySQL 드라이버
- `bcrypt` - 비밀번호 해싱
- `express-session` - 세션 관리
- `multer` - 파일 업로드
- `dotenv` - 환경 변수 관리

**⚠️ 주의:**
- 인터넷 연결 필요
- 설치 시간: 약 1~5분 (네트워크 속도에 따라 다름)
- `node_modules/` 폴더가 생성됩니다 (Git에 포함되지 않음)

---

### 6. 서버 실행

#### ✅ Node.js 서버 시작

모든 설정이 완료되었으면 서버를 실행합니다:

```bash
npm start
```

또는:

```bash
node server.js
```

**예상 성공 메시지:**
```
========================================
✅ 서버가 http://localhost:3000 에서 실행 중입니다
========================================
✅ MariaDB 데이터베이스 연결 성공!
```

**⚠️ 오류가 발생하는 경우:**
- `ECONNREFUSED`: MariaDB 서버가 실행 중인지 확인
- `ER_ACCESS_DENIED_ERROR`: `.env` 파일의 `DB_PASSWORD` 확인
- `EADDRINUSE`: 3000번 포트가 이미 사용 중 → `.env`에서 `PORT=3001`로 변경

---

### 7. 브라우저에서 접속

#### ✅ 웹 애플리케이션 열기

서버가 성공적으로 실행되면 브라우저를 열고 다음 주소로 접속합니다:

**로그인/회원가입 페이지:**
```
http://localhost:3000
```
또는
```
http://localhost:3000/login/index.html
```

**Todo 페이지 (로그인 후):**
```
http://localhost:3000/todo/index.html
```

#### ✅ 첫 번째 사용자 생성

1. 로그인 페이지에서 **"회원가입"** 탭 클릭
2. 필수 정보 입력 (이름, 닉네임, 이메일, 비밀번호 등)
3. **휴대전화 인증** 클릭 → 팝업에서 데모 인증번호 `123456` 확인
4. 회원가입 완료 → Todo 페이지로 자동 이동

---

### 8. 서버 종료

서버를 중지하려면 터미널/명령 프롬프트에서:

```
Ctrl + C
```

---

## 📋 빠른 시작 요약

전체 과정을 한눈에 정리하면:

```bash
# 1. 프로젝트 클론
git clone https://github.com/YOUR_USERNAME/mydiary_login.git
cd mydiary_login

# 2. 환경 변수 설정
copy .env.example .env          # Windows
# cp .env.example .env          # Mac/Linux
# .env 파일을 열어 DB_PASSWORD와 SESSION_SECRET 수정!

# 3. 데이터베이스 생성
mysql -u root -p < schema.sql

# 4. 패키지 설치
npm install

# 5. 서버 실행
npm start

# 6. 브라우저에서 http://localhost:3000 접속
```

**소요 시간:** 약 5~10분 (사전 요구사항이 설치된 경우)

## 📖 사용 방법

### 1. 회원가입
1. http://localhost:3000 접속
2. "회원가입" 탭 클릭
3. 필수 정보 입력 (이름, 닉네임, 성별, 휴대전화, 주소, 이메일, 비밀번호)
4. **이메일 중복 확인** 및 **닉네임 중복 체크** 버튼으로 중복 확인
5. **휴대전화 인증** 버튼 클릭 → 팝업에서 데모 인증번호(123456) 확인
6. 인증번호 입력 후 **인증 확인**
7. 보안 질문 선택 및 답변 입력
8. 약관 동의 후 "회원가입" 버튼 클릭
9. 자동 로그인 후 Todo 페이지로 이동

### 2. 로그인
1. 로그인 탭에서 이메일과 비밀번호 입력
2. "Remember Me" 체크 시 30일간 로그인 유지
3. "로그인" 버튼 클릭 → Todo 페이지로 자동 이동

### 3. 프로필 관리
1. Todo 페이지 상단의 **"프로필"** 버튼 클릭
2. 프로필 모달에서 다음 기능 이용:
   - **프로필 사진 업로드** - 사진 선택 → 미리보기 → 업로드
   - **정보 수정** - 이름, 닉네임, 주소, 전화번호 변경
   - **비밀번호 변경** - 현재 비밀번호 입력 후 새 비밀번호 설정
   - **회원 탈퇴** - 비밀번호 입력 후 이중 확인

### 4. Todo 관리
1. 할 일 입력란에 내용 입력
2. 카테고리, 우선순위, 마감일/시간, 이모티콘 설정 (선택)
3. "추가" 버튼 클릭
4. Todo 항목에서:
   - **Done** - 완료 표시 (취소선)
   - **Edit** - 수정
   - **Del** - 삭제
5. 상단 필터로 카테고리별 조회
6. 검색창으로 키워드 검색
7. 캘린더에서 날짜 클릭하여 해당 날짜의 일정 확인

## 🔌 API 엔드포인트

### 인증 API

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|-------|-----------|------|---------|
| POST | `/api/auth/signup` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 | ❌ |
| POST | `/api/auth/logout` | 로그아웃 | ✅ |
| GET | `/api/auth/check` | 로그인 상태 확인 | ❌ |
| POST | `/api/auth/check-email` | 이메일 중복 확인 | ❌ |
| POST | `/api/auth/check-nickname` | 닉네임 중복 확인 | ❌ |

### 프로필 API

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|-------|-----------|------|---------|
| GET | `/api/profile` | 프로필 정보 조회 | ✅ |
| PUT | `/api/profile` | 프로필 정보 수정 | ✅ |
| POST | `/api/profile/photo` | 프로필 사진 업로드 | ✅ |
| PUT | `/api/profile/password` | 비밀번호 변경 | ✅ |
| DELETE | `/api/profile/account` | 회원 탈퇴 | ✅ |

### Todo API

| 메서드 | 엔드포인트 | 설명 | 인증 필요 |
|-------|-----------|------|---------|
| GET | `/api/todos` | Todo 목록 조회 | ✅ |
| POST | `/api/todos` | Todo 추가 | ✅ |
| PUT | `/api/todos/:id` | Todo 수정 | ✅ |
| DELETE | `/api/todos/:id` | Todo 삭제 | ✅ |

## 💾 데이터베이스 스키마

### users 테이블
```sql
- id (PK)              - 사용자 고유 ID
- email (UNIQUE)       - 이메일 (로그인 ID)
- password             - 해시된 비밀번호 (bcrypt)
- nickname             - 닉네임
- name                 - 이름
- phone                - 휴대전화번호
- gender               - 성별
- address              - 주소
- security_question    - 보안 질문
- security_answer      - 보안 답변
- profile_image        - 프로필 이미지 경로
- created_at           - 가입일시
```

### todos 테이블
```sql
- id (PK)              - Todo 고유 ID
- user_id (FK)         - 사용자 ID
- text                 - 할 일 내용
- category             - 카테고리 (all/work/personal/exercise/rest)
- repetition           - 반복 설정 (none/daily/weekly/monthly/weekday)
- priority             - 우선순위 (none/low/medium/high)
- emoji                - 이모티콘
- due_date             - 마감일
- due_time             - 마감시간
- completed            - 완료 여부
- created_at           - 생성일시
- updated_at           - 수정일시
```

## 🔒 보안

- **비밀번호 해싱**: bcrypt (10 salt rounds)
- **세션 관리**: express-session (httpOnly 쿠키)
- **권한 검증**: 모든 Todo/프로필 API는 로그인 필수
- **사용자 격리**: 각 사용자는 자신의 데이터만 접근 가능
- **파일 업로드 제한**: 5MB, 이미지 파일만 허용
- **환경 변수**: 민감한 정보는 .env 파일로 관리

## 🛠️ 트러블슈팅

### 데이터베이스 연결 실패
```
❌ MariaDB 데이터베이스 연결 실패
```
**해결 방법:**
1. MariaDB/MySQL 서버가 실행 중인지 확인
2. `.env` 파일의 데이터베이스 정보 확인
3. `schema.sql`을 실행하여 데이터베이스 생성 확인

### 포트 충돌 (3000번 포트)
**해결 방법:**
- `.env` 파일에서 `PORT=3000`을 다른 포트로 변경

### 파일 업로드 실패
**해결 방법:**
1. `public/uploads/profiles/` 폴더가 존재하는지 확인
2. 파일 크기가 5MB 이하인지 확인
3. 이미지 파일(jpg, png, gif, webp)인지 확인

### 세션 유지 안됨
**해결 방법:**
1. 브라우저 쿠키 설정 확인
2. 시크릿/프라이빗 모드가 아닌지 확인
3. `.env`의 `SESSION_SECRET` 설정 확인

## 🏗️ 기술 스택

### Backend
- **Node.js** - JavaScript 런타임
- **Express** - 웹 프레임워크
- **MariaDB/MySQL** - 관계형 데이터베이스
- **bcrypt** - 비밀번호 해싱
- **express-session** - 세션 관리
- **multer** - 파일 업로드
- **dotenv** - 환경 변수 관리

### Frontend
- **HTML5** - 웹 문서 구조
- **CSS3** - 스타일링
- **JavaScript (Vanilla)** - 클라이언트 로직
- **Fetch API** - 서버 통신

### Database
- **mysql2** - MariaDB/MySQL 드라이버 (promise 지원)

## 📝 개발 노트

### 시간 입력 자동 포맷
- 숫자만 입력하면 자동으로 시간 형식(HH:MM)으로 변환
- 예: `1030` 입력 → `10:30` 자동 변환

### 데모 인증번호
- 휴대전화 인증 시 팝업으로 데모 인증번호(123456) 표시
- 실제 SMS 발송 기능은 미구현

### 프로필 사진
- 업로드된 이미지는 `public/uploads/profiles/` 폴더에 저장
- 파일명: `user_{userId}_{timestamp}.{ext}`
- 새 이미지 업로드 시 기존 이미지 자동 삭제

## 📄 라이선스

ISC

## 👨‍💻 버전 정보

- **Version**: 1.0.0
- **Last Updated**: 2025-11-25
