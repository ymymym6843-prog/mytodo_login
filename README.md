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

- **Node.js** v14 이상
- **MariaDB** 또는 **MySQL** v10 이상

### 2. 프로젝트 클론

```bash
git clone <repository-url>
cd mydiary_login
```

### 3. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 본인의 설정값으로 수정합니다:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

`.env` 파일 내용:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_database_password_here
DB_NAME=mytodo

# Server Configuration
PORT=3000

# Session Configuration
SESSION_SECRET=your_session_secret_key_here
```

### 4. 데이터베이스 설정

MariaDB 서버가 실행 중인지 확인한 후, 스키마를 생성합니다:

```bash
# MariaDB에 로그인
mysql -u root -p

# 스키마 파일 실행
source schema.sql

# 또는 명령줄에서 직접:
mysql -u root -p < schema.sql
```

### 5. 패키지 설치

```bash
npm install
```

설치되는 주요 패키지:
- `express` - 웹 프레임워크
- `mysql2` - MariaDB/MySQL 드라이버
- `bcrypt` - 비밀번호 해싱
- `express-session` - 세션 관리
- `multer` - 파일 업로드
- `dotenv` - 환경 변수 관리

### 6. 서버 실행

```bash
npm start
# 또는
node server.js
```

서버가 성공적으로 시작되면:
- **로그인 페이지**: http://localhost:3000 또는 http://localhost:3000/login/index.html
- **Todo 페이지**: http://localhost:3000/todo/index.html (로그인 필요)

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
