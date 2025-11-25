/* 
  script.js
  - 테마(라이트/다크) 전환
  - 탭 전환 (로그인/회원가입/프로필 설정)
  - 회원가입: 유효성 검사, 중복 체크, 비밀번호 강도 표시, SHA-256 해싱
  - 로그인: 자동로그인, remember me, 로그인 시도 제한, 계정 잠금/해제
  - 비밀번호 찾기(재설정)
  - 프로필: 정보 수정, 비밀번호 변경, 프로필 사진 변경, 로그아웃, 회원탈퇴
  - 데이터 관리: localStorage와 users.json 연동을 통한 사용자 정보 및 세션 관리
*/

/* 
  [학습용 배려 사항]
  - 실제 서비스에서는 보안을 위해 사용자 정보를 클라이언트(브라우저)의 localStorage에 저장해서는 안 됩니다.
    반드시 서버(백엔드)와 데이터베이스(DB)를 사용해야 합니다.
  - 모든 통신은 HTTPS를 통해 암호화되어야 합니다.
  - 비밀번호는 서버에서도 솔트(salt)를 추가하고 여러 번 해싱(e.g., PBKDF2, bcrypt)하여 저장해야 합니다.

  여기서는 "학습용 데모"이므로 localStorage를 간단한 DB처럼 사용합니다.
  - users: 회원 목록
  - currentUserEmail: 현재 로그인한 사용자 이메일
  - sessionExpireAt: 자동로그아웃 시간(ms)
*/

/* ---------- 상수 및 초기 설정 ---------- */

// 보안 질문 목록
const SECURITY_QUESTIONS = [
  "가장 기억에 남는 여행지는 어디인가요?",
  "어릴 적 가장 친한 친구의 이름은 무엇인가요?",
  "나의 첫 반려동물의 이름은 무엇인가요?",
  "가장 좋아하는 책의 제목은 무엇인가요?",
  "부모님의 고향은 어디인가요?",
  "가장 존경하는 인물의 이름은 무엇인가요?",
  "처음으로 다녔던 초등학교의 이름은 무엇인가요?",
];
/* ---------- 공통 유틸 함수 영역 ---------- */

/**
 * localStorage에서 사용자 리스트 가져오기
 * 저장된 값이 없으면 빈 배열([]) 반환
 */
function getUsers() {
  const data = localStorage.getItem("users");
  return data ? JSON.parse(data) : [];
}

/**
 * 사용자 리스트 저장
 * @param {Array} users 
 */
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

/**
 * 이메일로 사용자 찾기
 * @param {string} email 
 * @returns 사용자 객체 또는 undefined
 */
function findUserByEmail(email) {
  const users = getUsers();
  return users.find((u) => u.email === email);
}

/**
 * 닉네임으로 사용자 찾기
 * @param {string} nickname 
 * @returns 사용자 객체 또는 undefined
 */
function findUserByNickname(nickname) {
  const users = getUsers();
  return users.find((u) => u.nickname === nickname);
}

/**
 * 현재 로그인한 사용자 이메일 얻기
 */
function getCurrentUserEmail() {
  return localStorage.getItem("currentUserEmail");
}

/**
 * 현재 로그인한 사용자 객체 얻기
 */
function getCurrentUser() {
  const email = getCurrentUserEmail();
  if (!email) return null;
  return findUserByEmail(email);
}

/**
 * 로그인 세션 시작
 * @param {string} email - 로그인한 사용자 이메일
 * @param {boolean} rememberMe - 로그인 상태 유지 여부
 */
function startSession(email, rememberMe) {
  // 현재 로그인한 사용자의 이메일 저장
  localStorage.setItem("currentUserEmail", email);

  /*
    자동로그아웃 시간 설정
    - rememberMe가 true이면 더 긴 시간 (예: 24시간)
    - 아니면 짧은 시간 (예: 10분)
  */
  const now = Date.now();
  const expireMs = rememberMe
    ? 24 * 60 * 60 * 1000 // 24시간
    : 10 * 60 * 1000;     // 10분
  const expireAt = now + expireMs;
  localStorage.setItem("sessionExpireAt", String(expireAt));
}

/**
 * 세션이 유효한지 확인
 * - 유효하지 않다면 로그아웃 처리
 */
function checkSession() {
  const expireAt = localStorage.getItem("sessionExpireAt");
  if (!expireAt) return false;
  const now = Date.now();
  if (now > Number(expireAt)) {
    // 만료 시 로그아웃 처리
    endSession();
    alert("세션이 만료되어 자동 로그아웃되었습니다.");
    return false;
  }
  return true;
}

/**
 * 세션 종료 (로그아웃)
 */
function endSession() {
  localStorage.removeItem("currentUserEmail");
  localStorage.removeItem("sessionExpireAt");
}

/**
 * SHA-256 해시 함수 (Web Crypto API 사용, 비동기)
 * 실제 서비스에서는 추가적인 보안처리(솔트, PBKDF2 등)가 필요합니다.
 * 여기서는 학습용 데모용으로 단순 SHA-256만 적용.
 * @param {string} text 
 * @returns {Promise<string>} 16진수 문자열 해시
 */
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * 비밀번호 강도 계산
 * - 매우 간단한 규칙 기반 (길이, 숫자, 특수문자, 대문자 포함 여부)
 * - 0~100 사이 숫자를 반환
 */
function calcPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 30;
  if (/[0-9]/.test(password)) score += 20;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  if (password.length >= 12) score += 10;
  if (score > 100) score = 100;
  return score;
}

/* ---------- UI 제어 관련 ---------- */

// DOM 요소 가져오기
const themeToggleBtn = document.getElementById("themeToggleBtn");
const tabButtons = document.querySelectorAll(".tab-btn");
const viewSections = document.querySelectorAll(".view-section");

// 로그인 관련 요소
const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const rememberMeCheckbox = document.getElementById("rememberMe");
const loginBtn = document.getElementById("loginBtn");
const loginErrorMsg = document.getElementById("loginErrorMsg");
const loginAttemptInfo = document.getElementById("loginAttemptInfo");
const showResetPasswordBtn = document.getElementById("showResetPassword");
const resetPasswordSection = document.getElementById("resetPasswordSection");
const resetEmailInput = document.getElementById("resetEmail");
const resetPhoneInput = document.getElementById("resetPhone");
const resetNewPasswordInput = document.getElementById("resetNewPassword");
const resetNewPasswordConfirmInput = document.getElementById("resetNewPasswordConfirm");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const resetPasswordMsg = document.getElementById("resetPasswordMsg");

const showUnlockFormBtn = document.getElementById("showUnlockForm");
const unlockSection = document.getElementById("unlockSection");
const unlockEmailInput = document.getElementById("unlockEmail");
const unlockPhoneInput = document.getElementById("unlockPhone");
const unlockBtn = document.getElementById("unlockBtn");
const unlockMsg = document.getElementById("unlockMsg");

// 회원가입 관련 요소
const signupNameInput = document.getElementById("signupName");
const signupNicknameInput = document.getElementById("signupNickname");
const signupGenderSelect = document.getElementById("signupGender");
const signupPhoneInput = document.getElementById("signupPhone");
const signupAddressInput = document.getElementById("signupAddress");
const signupEmailIdInput = document.getElementById("signupEmailId");
const signupEmailDomainInput = document.getElementById("signupEmailDomain");
const signupEmailDomainSelect = document.getElementById("signupEmailDomainSelect");
const signupPasswordInput = document.getElementById("signupPassword");
const signupPasswordConfirmInput = document.getElementById("signupPasswordConfirm");
const checkNicknameBtn = document.getElementById("checkNicknameBtn");
const passwordConfirmMsg = document.getElementById("passwordConfirmMsg");
const checkEmailBtn = document.getElementById("checkEmailBtn");
const agreeServiceTermsCheckbox = document.getElementById("agreeServiceTerms");
const agreeTermsCheckbox = document.getElementById("agreeTerms");
const signupBtn = document.getElementById("signupBtn");
const signupMsg = document.getElementById("signupMsg");

// 비밀번호 강도 표시 관련 요소
const strengthFill = document.getElementById("strengthFill");
const strengthText = document.getElementById("strengthText");

// 회원가입 - 주소 관련 요소
const signupZipcodeInput = document.getElementById("signupZipcode");
const signupAddressDetailInput = document.getElementById("signupAddressDetail");
const findAddressBtn = document.getElementById("findAddressBtn");

// 회원가입 - 휴대전화 인증 관련 요소
const sendVerificationCodeBtn = document.getElementById("sendVerificationCodeBtn");
const phoneVerificationArea = document.getElementById("phoneVerificationArea");
const phoneVerificationCodeInput = document.getElementById("phoneVerificationCode");
const confirmVerificationCodeBtn = document.getElementById("confirmVerificationCodeBtn");
const phoneVerificationMsg = document.getElementById("phoneVerificationMsg");

let isPhoneVerified = false; // 휴대전화 인증 완료 여부 플래그

// 프로필 관련 요소
const profileNameSpan = document.getElementById("profileName");
const profileEmailSpan = document.getElementById("profileEmail");
const profileNicknameSpan = document.getElementById("profileNickname");
const profileJoinDateSpan = document.getElementById("profileJoinDate");
const profileImagePreview = document.getElementById("profileImagePreview");
const profileImageInput = document.getElementById("profileImageInput");

const editNameInput = document.getElementById("editName");
const editNicknameInput = document.getElementById("editNickname");
const editAddressInput = document.getElementById("editAddress");
const updateProfileBtn = document.getElementById("updateProfileBtn");
const updateProfileMsg = document.getElementById("updateProfileMsg");

const currentPasswordInput = document.getElementById("currentPassword");
const newPasswordInput = document.getElementById("newPassword");
const newPasswordConfirmInput = document.getElementById("newPasswordConfirm");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const changePasswordMsg = document.getElementById("changePasswordMsg");

const logoutBtn = document.getElementById("logoutBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");

// 보안 질문 관련 요소
const signupSecurityQuestionSelect = document.getElementById("signupSecurityQuestion");
const signupSecurityAnswerInput = document.getElementById("signupSecurityAnswer");
const resetSecurityQuestionSelect = document.getElementById("resetSecurityQuestion");
const resetSecurityAnswerInput = document.getElementById("resetSecurityAnswer");


/* ---------- 테마 전환 기능 ---------- */

// 현재 테마 저장용 (localStorage 사용) 키 이름
const THEME_KEY = "appTheme";

/**
 * 저장된 테마(라이트/다크)를 불러와서 body에 적용
 */
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const theme = savedTheme || "light";
  document.body.setAttribute("data-theme", theme);
  themeToggleBtn.textContent = theme === "light" ? "🌞 라이트 모드" : "🌙 다크 모드";
}

/**
 * 테마 버튼 클릭 시 라이트/다크 토글
 */
themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.body.setAttribute("data-theme", newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
  themeToggleBtn.textContent = newTheme === "light" ? "🌞 라이트 모드" : "🌙 다크 모드";
});

/* ---------- 탭 전환 기능 ---------- */

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const clickedTab = btn;
    const targetId = clickedTab.getAttribute("data-target");

    // --- 탭 전환 전 유효성 검사 ---
    // 1. 로그인 상태에서 '로그인' 또는 '회원가입' 탭을 누른 경우
    if ((targetId === 'login-section' || targetId === 'signup-section') && checkSession()) {
      alert('이미 로그인된 상태입니다. 프로필 페이지를 이용해주세요.');
      return; // 탭 전환을 막습니다.
    }

    // 2. 로그아웃 상태에서 '프로필' 탭을 누른 경우
    if (targetId === 'profile-section' && !checkSession()) {
      alert('로그인이 필요합니다.');
      // 로그인 탭으로 강제 이동
      document.querySelector('[data-target="login-section"]').click();
      return; // 탭 전환을 막습니다.
    }

    // 모든 탭 버튼에서 active 클래스 제거
    tabButtons.forEach((b) => b.classList.remove("active"));
    // 클릭한 버튼만 active
    clickedTab.classList.add("active");

    // 모든 섹션 숨김
    viewSections.forEach((sec) => sec.classList.remove("active"));
    // 대상 섹션만 보이기
    document.getElementById(targetId).classList.add("active");

    // 프로필 탭으로 성공적으로 전환했다면, 프로필 정보 로드
    if (targetId === 'profile-section') {
        loadProfileInfo();
    }
  });
});

/* ---------- 비밀번호 눈 아이콘(보기/숨기기) ---------- */

// 모든 eye-btn 버튼에 대해 이벤트 등록
document.querySelectorAll(".eye-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // data-target-input 속성에 연결된 input의 id가 들어 있음
    const targetId = btn.getAttribute("data-target-input");
    const input = document.getElementById(targetId);
    if (!input) return;

    // type="password" -> "text" 토글
    if (input.type === "password") {
      input.type = "text";
    } else {
      input.type = "password";
    }
  });
});

/* ---------- 로그인 시도 제한 및 계정 잠금 처리 ---------- */

// 최대 로그인 시도 횟수
const MAX_LOGIN_ATTEMPTS = 5;

/**
 * 특정 이메일 계정의 현재 로그인 시도 횟수를 가져오기
 */
function getLoginAttempts(email) {
  const key = `loginAttempts_${email}`;
  const value = localStorage.getItem(key);
  return value ? Number(value) : 0;
}

/**
 * 특정 이메일 계정의 로그인 시도 횟수 저장
 */
function setLoginAttempts(email, count) {
  const key = `loginAttempts_${email}`;
  localStorage.setItem(key, String(count));
}

/**
 * 계정 잠김 여부 확인
 */
function isAccountLocked(email) {
  const key = `accountLocked_${email}`;
  return localStorage.getItem(key) === "true";
}

/**
 * 계정 잠금 설정
 */
function lockAccount(email) {
  const key = `accountLocked_${email}`;
  localStorage.setItem(key, "true");
}

/**
 * 계정 잠금 해제
 */
function unlockAccount(email) {
  const key = `accountLocked_${email}`;
  localStorage.removeItem(key);
  setLoginAttempts(email, 0);
}

/* ---------- 로그인 기능 구현 ---------- */

loginBtn.addEventListener("click", async () => {
  loginErrorMsg.textContent = "";
  loginAttemptInfo.textContent = "";

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  if (!email || !password) {
    loginErrorMsg.textContent = "이메일과 비밀번호를 모두 입력해주세요.";
    return;
  }

  // 계정 잠김 여부 먼저 확인
  if (isAccountLocked(email)) {
    loginErrorMsg.textContent = "해당 계정은 잠겨 있습니다. '계정 잠금 해제'를 이용해주세요.";
    showUnlockFormBtn.classList.remove("hidden");
    return;
  }

  const user = findUserByEmail(email);
  if (!user) {
    loginErrorMsg.textContent = "해당 이메일로 가입된 계정이 없습니다.";
    return;
  }

  // 비밀번호 해시 후 비교
  const hashedInputPw = await sha256(password);
  if (user.passwordHash !== hashedInputPw) {
    // 로그인 실패 처리
    const attempts = getLoginAttempts(email) + 1;
    setLoginAttempts(email, attempts);

    const remain = MAX_LOGIN_ATTEMPTS - attempts;
    if (remain <= 0) {
      // 계정 잠금
      lockAccount(email);
      loginErrorMsg.textContent =
        "비밀번호를 여러 번 잘못 입력하여 계정이 잠겼습니다. '계정 잠금 해제'를 이용해주세요.";
      showUnlockFormBtn.classList.remove("hidden");
    } else {
      loginErrorMsg.textContent = "비밀번호가 올바르지 않습니다.";
      loginAttemptInfo.textContent = `남은 시도 횟수: ${remain}회`;
    }
    return;
  }

  // 여기까지 왔다면 비밀번호가 맞음 -> 로그인 성공
  setLoginAttempts(email, 0); // 시도 횟수 초기화

  // remember me 값
  const rememberMe = rememberMeCheckbox.checked;
  startSession(email, rememberMe);

  // 로그인 기록 업데이트
  const users = getUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx > -1) {
    // 로그인 기록을 배열 형태로 관리
    if (!users[idx].loginHistory) {
      users[idx].loginHistory = [];
    }
    // 최근 기록을 배열 맨 앞에 추가
    users[idx].loginHistory.unshift({
      time: new Date().toLocaleString(),
      device: navigator.userAgent,
    });
    saveUsers(users);
  }

  loginErrorMsg.textContent = "";
  loginAttemptInfo.textContent = "로그인 성공! 프로필 페이지로 이동합니다...";

  // 약간의 딜레이 후 프로필 탭으로 전환 (부드러운 화면 전환 느낌)
  setTimeout(() => {
    document.querySelector('[data-target="profile-section"]').click();
  }, 700);
});

/* ---------- 계정 잠금 해제 기능 ---------- */

// "계정 잠금 해제" 버튼 클릭 시 잠금 해제 폼 보이기
showUnlockFormBtn.addEventListener("click", () => {
  unlockSection.classList.toggle("hidden");
});

// 본인 인증 후 잠금 해제 처리
unlockBtn.addEventListener("click", () => {
  unlockMsg.textContent = "";
  const email = unlockEmailInput.value.trim();
  const phone = unlockPhoneInput.value.trim();

  if (!email || !phone) {
    unlockMsg.textContent = "이메일과 휴대전화번호를 모두 입력해주세요.";
    return;
  }

  const user = findUserByEmail(email);
  if (!user) {
    unlockMsg.textContent = "해당 이메일로 가입된 계정이 없습니다.";
    return;
  }

  if (user.phone !== phone) {
    unlockMsg.textContent = "휴대전화번호가 일치하지 않습니다.";
    return;
  }

  // 여기까지 오면 본인 인증 성공 -> 계정 잠금 해제
  unlockAccount(email);
  unlockMsg.textContent = "계정 잠금이 해제되었습니다. 다시 로그인해주세요.";
});

/* ---------- 비밀번호 재설정 기능 ---------- */

// "비밀번호 찾기" 버튼
showResetPasswordBtn.addEventListener("click", () => {
  resetPasswordSection.classList.toggle("hidden");
});

resetPasswordBtn.addEventListener("click", async () => {
  resetPasswordMsg.textContent = "";

  const email = resetEmailInput.value.trim();
  const phone = resetPhoneInput.value.trim();
  const newPw = resetNewPasswordInput.value;
  const newPwConfirm = resetNewPasswordConfirmInput.value;
  const question = resetSecurityQuestionSelect.value;
  const answer = resetSecurityAnswerInput.value.trim();

  if (!email || !phone || !newPw || !newPwConfirm || !answer) {
    resetPasswordMsg.textContent = "모든 항목을 입력해주세요.";
    return;
  }
  
  if (newPw !== newPwConfirm) {
    resetPasswordMsg.textContent = "새 비밀번호가 일치하지 않습니다.";
    return;
  }

  const user = findUserByEmail(email);
  if (!user) {
    resetPasswordMsg.textContent = "해당 이메일로 가입된 계정이 없습니다.";
    return;
  }

  if (user.phone !== phone) {
    resetPasswordMsg.textContent = "휴대전화번호가 일치하지 않습니다.";
    return;
  }

  if (user.securityQuestion !== question || user.securityAnswer !== answer) {
    resetPasswordMsg.textContent = "보안 질문 또는 답변이 일치하지 않습니다.";
    return;
  }

  // 비밀번호 해싱 후 저장
  const users = getUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx > -1) {
    users[idx].passwordHash = await sha256(newPw);
    saveUsers(users);
  }

  resetPasswordMsg.textContent = "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해주세요.";
});

/* ---------- 회원가입 기능 ---------- */

// 닉네임 중복 체크
checkNicknameBtn.addEventListener("click", () => {
  const nickname = signupNicknameInput.value.trim();
  if (!nickname) {
    alert("닉네임을 입력해주세요.");
    return;
  }
  const exists = !!findUserByNickname(nickname);
  if (exists) {
    alert("이미 사용 중인 닉네임입니다.");
  } else {
    alert("사용 가능한 닉네임입니다.");
  }
});

// 이메일 중복 체크
checkEmailBtn.addEventListener("click", () => {
  const emailId = signupEmailIdInput.value.trim();
  const emailDomain = signupEmailDomainInput.value.trim();
  if (!emailId || !emailDomain) {
    alert("이메일 아이디와 도메인을 모두 입력해주세요.");
    return;
  }
  const email = `${emailId}@${emailDomain}`;
  if (!email) {
    alert("이메일을 입력해주세요.");
    return;
  }
  const exists = !!findUserByEmail(email);
  if (exists) {
    alert("이미 사용 중인 이메일입니다.");
  } else {
    alert("사용 가능한 이메일입니다.");
  }
});

// 이메일 도메인 선택
signupEmailDomainSelect.addEventListener("change", (e) => {
  const selectedDomain = e.target.value;
  signupEmailDomainInput.value = selectedDomain === "직접입력" ? "" : selectedDomain;
  signupEmailDomainInput.readOnly = selectedDomain !== "직접입력";
});

/**
 * 비밀번호와 비밀번호 확인 필드의 값이 일치하는지 실시간으로 확인하는 함수
 */
function validatePasswordConfirmation() {
  const password = signupPasswordInput.value;
  const confirmPassword = signupPasswordConfirmInput.value;

  if (confirmPassword && password !== confirmPassword) {
    passwordConfirmMsg.textContent = "비밀번호가 일치하지 않습니다.";
  } else {
    passwordConfirmMsg.textContent = "";
  }
}
signupPasswordInput.addEventListener('input', validatePasswordConfirmation);
signupPasswordConfirmInput.addEventListener('input', validatePasswordConfirmation);


// 비밀번호 입력 시마다 강도 업데이트
signupPasswordInput.addEventListener("input", () => {
  const password = signupPasswordInput.value;
  const strength = calcPasswordStrength(password);

  strengthFill.style.width = `${strength}%`;

  // 강도에 따라 색상, 문구 변경
  if (strength < 30) {
    strengthFill.style.background = "#e74c3c"; // 약함
    strengthText.textContent = "비밀번호 강도: 매우 약함 (보안 위험)";
  } else if (strength < 60) {
    strengthFill.style.background = "#f1c40f"; // 보통
    strengthText.textContent = "비밀번호 강도: 보통";
  } else if (strength < 90) {
    strengthFill.style.background = "#2ecc71"; // 강함
    strengthText.textContent = "비밀번호 강도: 강함";
  } else {
    strengthFill.style.background = "#3498db"; // 매우 강함
    strengthText.textContent = "비밀번호 강도: 매우 강함 (안전)";
  }
});

// 회원가입 버튼 클릭
signupBtn.addEventListener("click", async () => {
  signupMsg.textContent = "";

  const name = signupNameInput.value.trim();
  const nickname = signupNicknameInput.value.trim();
  const gender = signupGenderSelect.value;
  const phone = signupPhoneInput.value.trim();
  const address = signupAddressInput.value.trim();
  const emailId = signupEmailIdInput.value.trim();
  const emailDomain = signupEmailDomainInput.value.trim();
  const password = signupPasswordInput.value;
  const passwordConfirm = signupPasswordConfirmInput.value;
  const agreeServiceTerms = agreeServiceTermsCheckbox.checked;
  const agreeTerms = agreeTermsCheckbox.checked;
  const securityQuestion = signupSecurityQuestionSelect.value;
  const securityAnswer = signupSecurityAnswerInput.value.trim();

  // 기본 유효성 검사
  if (!name || !nickname || !gender || !phone || !address || !emailId || !emailDomain || !password || !passwordConfirm) {
    signupMsg.textContent = "모든 필수 정보를 입력해주세요.";
    signupMsg.classList.add("error-msg");
    return;
  }

  if (!isPhoneVerified) {
    alert("휴대전화 인증을 완료해주세요.");
    signupMsg.textContent = "휴대전화 인증이 필요합니다.";
    signupMsg.classList.add("error-msg");
    return;
  }

  const email = `${emailId}@${emailDomain}`;
  // 이메일/닉네임 중복 체크
  if (findUserByEmail(email)) {
    alert("이미 사용 중인 이메일입니다.");
    signupMsg.textContent = "이메일 중복으로 회원가입에 실패했습니다.";
    signupMsg.classList.add("error-msg");
    return;
  }

  if (findUserByNickname(nickname)) {
    alert("이미 사용 중인 닉네임입니다.");
    signupMsg.textContent = "닉네임 중복으로 회원가입에 실패했습니다.";
    signupMsg.classList.add("error-msg");
    return;
  }

  // 비밀번호 일치 여부
  if (password !== passwordConfirm) {
    // 실시간 경고 메시지가 이미 표시되므로 alert은 제거하고, 제출만 막습니다.
    signupMsg.textContent = "비밀번호가 일치하지 않습니다.";
    signupMsg.classList.add("error-msg");
    return;
  }

  // 비밀번호 최소 조건 (예: 8자 이상)
  if (password.length < 8) {
    alert("비밀번호는 8자 이상이어야 합니다.");
    signupMsg.textContent = "비밀번호는 8자 이상이어야 합니다.";
    signupMsg.classList.add("error-msg");
    return;
  }

  // 개인정보 동의 체크
  if (!agreeServiceTerms || !agreeTerms) {
    alert("필수 약관에 모두 동의해야 회원가입이 가능합니다.");
    signupMsg.textContent = "필수 약관에 동의해주세요.";
    signupMsg.classList.add("error-msg");
    return;
  }

  // 보안 질문/답변 확인
  if (!securityQuestion || !securityAnswer) {
    alert("비밀번호 찾기 질문과 답변을 모두 입력해주세요.");
    signupMsg.textContent = "비밀번호 찾기 질문과 답변을 입력해주세요.";
    return;
  }

  // 비밀번호 해싱 처리
  const passwordHash = await sha256(password);

  // 사용자 객체 생성
  const newUser = {
    name,
    nickname,
    gender,
    phone,
    address,
    email,
    passwordHash,
    securityQuestion,
    securityAnswer,
    joinDate: new Date().toLocaleDateString(),
    profileImage: null, // 프로필 사진(추후 Base64 또는 URL 저장)
    loginHistory: [],   // 로그인 기록을 저장할 배열
  };

  // 기존 유저 리스트에 추가
  const users = getUsers();
  users.push(newUser);
  saveUsers(users);

  // 회원가입 성공 메시지
  signupMsg.textContent = "회원가입이 완료되었습니다! 자동 로그인 후 프로필 설정 페이지로 이동합니다.";
  signupMsg.classList.remove("error-msg");

  // 애니메이션 효과를 위해 살짝 딜레이
  document.getElementById("signup-section").classList.add("signup-success-animate");

  // 자동 로그인 처리
  startSession(email, true); // 자동로그인: rememberMe=true

  // 로그인 기록 저장
  const updatedUsers = getUsers();
  const idx = updatedUsers.findIndex((u) => u.email === email);
  if (idx > -1) {
    // 첫 로그인 기록 저장
    updatedUsers[idx].loginHistory.unshift({
      time: new Date().toLocaleString(),
      device: navigator.userAgent,
    });
    saveUsers(updatedUsers);
  }

  // 약간의 딜레이 후 프로필 페이지로 전환
  setTimeout(() => {
    document.querySelector('[data-target="profile-section"]').click();
  }, 800);
});

/* ---------- 주소 찾기 기능 (카카오 우편번호 서비스) ---------- */
// '우편번호 찾기' 버튼 클릭 시 카카오 우편번호 API를 호출하여 주소 검색 기능을 활성화합니다.
findAddressBtn.addEventListener('click', function() {
    // 주소 검색 UI를 삽입할 엘리먼트
    const wrap = document.getElementById('address-search-wrap');

    new daum.Postcode({
        oncomplete: function(data) {
            // 검색결과 항목을 클릭했을때 실행할 코드를 작성하는 부분.

            // 각 주소의 노출 규칙에 따라 주소를 조합한다.
            let addr = ''; // 주소 변수

            //사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
            if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
                addr = data.roadAddress;
            } else { // 사용자가 지번 주소를 선택했을 경우(J)
                addr = data.jibunAddress;
            }

            // 우편번호와 주소 정보를 해당 필드에 넣는다.
            signupZipcodeInput.value = data.zonecode;
            signupAddressInput.value = addr;
            
            // 주소 검색 UI를 숨기고 커서를 상세주소 필드로 이동한다.
            wrap.style.display = 'none';
            signupAddressDetailInput.focus();
        },
        // 우편번호 찾기 화면 크기가 조정되었을때 실행할 코드를 작성하는 부분.
        // (여기서는 UI를 삽입할 엘리먼트의 높이를 조정)
        onresize : function(size) {
            wrap.style.height = size.height+'px';
        },
        width : '100%',
        height : '100%'
    }).embed(wrap);

    // 주소 검색 UI를 화면에 표시
    wrap.style.display = 'block';
});

/* ---------- 휴대전화 인증 시뮬레이션 기능 ---------- */
let tempVerificationCode = ''; // 임시 인증번호 저장 변수

sendVerificationCodeBtn.addEventListener("click", () => {
  const phone = signupPhoneInput.value.trim();
  if (phone.length < 10) {
    alert("올바른 휴대전화번호를 입력해주세요.");
    return;
  }

  // 실제로는 서버에서 인증번호를 생성하고 SMS를 발송해야 합니다.
  // 여기서는 6자리 랜덤 숫자를 생성하여 alert으로 보여주는 것으로 대체합니다.
  tempVerificationCode = String(Math.floor(100000 + Math.random() * 900000));
  alert(`[데모] 인증번호 [${tempVerificationCode}]가 발송되었습니다.`);

  phoneVerificationArea.classList.remove("hidden");
  phoneVerificationMsg.textContent = "인증번호를 입력해주세요.";
});

confirmVerificationCodeBtn.addEventListener("click", () => {
  const inputCode = phoneVerificationCodeInput.value;
  if (inputCode === tempVerificationCode) {
    isPhoneVerified = true;
    phoneVerificationMsg.textContent = "인증이 완료되었습니다.";
    phoneVerificationMsg.style.color = "green";
    phoneVerificationArea.classList.add("hidden");
  } else {
    isPhoneVerified = false;
    phoneVerificationMsg.textContent = "인증번호가 일치하지 않습니다.";
    phoneVerificationMsg.style.color = "var(--error-color)";
  }
});
/* ---------- 프로필 정보 로딩 및 업데이트 ---------- */

/**
 * 프로필 탭에 정보 채워넣기
 */
function loadProfileInfo() {
  const user = getCurrentUser();
  if (!user) return;

  profileNameSpan.textContent = user.name;
  profileEmailSpan.textContent = user.email;
  profileNicknameSpan.textContent = user.nickname;
  profileJoinDateSpan.textContent = user.joinDate || "-";

  // 로그인 기록 테이블 채우기
  const historyTableBody = document.querySelector("#loginHistoryTable > tbody");
  historyTableBody.innerHTML = ""; // 기존 내용 초기화

  if (user.loginHistory && user.loginHistory.length > 0) {
    // 최근 5개 기록만 표시
    user.loginHistory.slice(0, 5).forEach(record => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${record.time}</td>
        <td>${record.device.substring(0, 40)}...</td>
      `; // 기기 정보가 너무 길 수 있으므로 일부만 표시
      historyTableBody.appendChild(row);
    });
  } else {
    historyTableBody.innerHTML = `<tr><td colspan="2">로그인 기록이 없습니다.</td></tr>`;
  }
  // 프로필 이미지
  if (user.profileImage) {
    profileImagePreview.style.backgroundImage = `url(${user.profileImage})`;
  } else {
    profileImagePreview.style.backgroundImage = "";
  }

  // 수정 폼 초기값 채우기
  editNameInput.value = user.name;
  editNicknameInput.value = user.nickname;
  editAddressInput.value = user.address || "";
}

/* 프로필 사진 업로드 & 미리보기 */
profileImageInput.addEventListener("change", () => {
  const file = profileImageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const imageDataUrl = reader.result;

    // 미리보기 업데이트
    profileImagePreview.style.backgroundImage = `url(${imageDataUrl})`;

    // 현재 사용자 정보에 반영
    const user = getCurrentUser();
    if (!user) return;
    const users = getUsers();
    const idx = users.findIndex((u) => u.email === user.email);
    if (idx > -1) {
      users[idx].profileImage = imageDataUrl;
      saveUsers(users);
    }
  };
  reader.readAsDataURL(file);
});

/* 내 정보 수정 저장 */
updateProfileBtn.addEventListener("click", () => {
  updateProfileMsg.textContent = "";

  const user = getCurrentUser();
  if (!user) {
    updateProfileMsg.textContent = "로그인 정보가 없습니다.";
    return;
  }

  const newName = editNameInput.value.trim();
  const newNickname = editNicknameInput.value.trim();
  const newAddress = editAddressInput.value.trim();

  if (!newName || !newNickname) {
    updateProfileMsg.textContent = "이름과 닉네임은 비워둘 수 없습니다.";
    return;
  }

  // 닉네임 중복 체크 (본인 제외)
  const users = getUsers();
  const nicknameOwner = users.find(
    (u) => u.nickname === newNickname && u.email !== user.email
  );
  if (nicknameOwner) {
    updateProfileMsg.textContent = "이미 사용 중인 닉네임입니다.";
    return;
  }

  // 실제 데이터 업데이트
  const idx = users.findIndex((u) => u.email === user.email);
  if (idx > -1) {
    users[idx].name = newName;
    users[idx].nickname = newNickname;
    users[idx].address = newAddress;
    saveUsers(users);
  }

  updateProfileMsg.textContent = "개인정보가 성공적으로 수정되었습니다.";
  // 화면에 표시된 정보 다시 로딩
  loadProfileInfo();
});

/* 비밀번호 변경 */
changePasswordBtn.addEventListener("click", async () => {
  changePasswordMsg.textContent = "";

  const user = getCurrentUser();
  if (!user) {
    changePasswordMsg.textContent = "로그인 정보가 없습니다.";
    return;
  }

  const currentPw = currentPasswordInput.value;
  const newPw = newPasswordInput.value;
  const newPwConfirm = newPasswordConfirmInput.value;

  if (!currentPw || !newPw || !newPwConfirm) {
    changePasswordMsg.textContent = "모든 비밀번호 항목을 입력해주세요.";
    return;
  }

  // 현재 비밀번호 확인
  const hashedCurrent = await sha256(currentPw);
  if (hashedCurrent !== user.passwordHash) {
    changePasswordMsg.textContent = "현재 비밀번호가 일치하지 않습니다.";
    return;
  }

  if (newPw !== newPwConfirm) {
    changePasswordMsg.textContent = "새 비밀번호가 서로 일치하지 않습니다.";
    return;
  }

  if (newPw.length < 8) {
    changePasswordMsg.textContent = "새 비밀번호는 8자 이상이어야 합니다.";
    return;
  }

  const users = getUsers();
  const idx = users.findIndex((u) => u.email === user.email);
  if (idx > -1) {
    users[idx].passwordHash = await sha256(newPw);
    saveUsers(users);
  }

  changePasswordMsg.textContent = "비밀번호가 성공적으로 변경되었습니다.";
  // 입력칸 초기화
  currentPasswordInput.value = "";
  newPasswordInput.value = "";
  newPasswordConfirmInput.value = "";
});

/* 로그아웃 */
logoutBtn.addEventListener("click", () => {
  endSession();
  alert("로그아웃되었습니다.");
  // 로그인 탭으로 이동
  document.querySelector('[data-target="login-section"]').click();
});

/* 회원탈퇴 */
deleteAccountBtn.addEventListener("click", () => {
  const user = getCurrentUser();
  if (!user) {
    alert("로그인 정보가 없습니다.");
    return;
  }

  const confirmDelete = confirm(
    "정말로 회원탈퇴 하시겠습니까? 모든 정보가 삭제됩니다."
  );
  if (!confirmDelete) return;

  const users = getUsers().filter((u) => u.email !== user.email);
  saveUsers(users);
  endSession();
  alert("회원탈퇴가 완료되었습니다.");

  // 로그인 탭으로 이동
  document.querySelector('[data-target="login-section"]').click();
});

/* ---------- 보안 질문 목록 초기화 ---------- */
function initializeSecurityQuestions() {
  // 회원가입용 select 채우기
  signupSecurityQuestionSelect.innerHTML = SECURITY_QUESTIONS.map(q => `<option value="${q}">${q}</option>`).join('');
  // 비밀번호 재설정용 select 채우기
  resetSecurityQuestionSelect.innerHTML = SECURITY_QUESTIONS.map(q => `<option value="${q}">${q}</option>`).join('');
}

/* ---------- users.json 초기화 및 페이지 로드 ---------- */

/**
 * users.json에서 초기 사용자 데이터를 가져와 localStorage에 저장하는 함수.
 * 이 함수는 localStorage에 'users' 데이터가 없을 때만 실행됩니다.
 */
async function initializeUsers() {
  const users = getUsers();
  // 사용자가 이미 존재하면(회원가입을 했거나, 이미 초기화된 경우) 함수를 실행하지 않음.
  if (users && users.length > 0) {
    console.log("기존 사용자 데이터가 있어 초기화를 건너뜁니다.");
    return;
  }

  try {
    // users.json 파일을 fetch API로 가져옴
    const response = await fetch('users.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // JSON 파일에 'users' 배열이 있고, 비어있지 않은지 확인
    if (data && data.users && data.users.length > 0) {
      saveUsers(data.users);
      console.log("users.json에서 초기 사용자 데이터를 성공적으로 불러왔습니다.");
    }
  } catch (error) {
    console.error("초기 사용자 데이터를 불러오는 데 실패했습니다:", error);
    // 사용자에게 간단한 안내를 할 수도 있습니다.
    // alert("초기 회원 데이터를 불러오지 못했습니다. 직접 회원가입을 진행해주세요.");
  }
}

/**
 * 페이지가 완전히 로드되었을 때 실행되는 메인 로직
 */
window.addEventListener("load", async () => {
  // 테마 초기화
  initTheme();

  // 보안 질문 목록 초기화
  initializeSecurityQuestions();

  // users.json에서 초기 데이터 불러오기 (필요 시)
  await initializeUsers();

  // 페이지 열릴 때 세션 체크
  if (checkSession()) {
    // 세션이 유효하면 프로필 탭으로 이동
    document.querySelector('[data-target="profile-section"]').click();
  } else {
    // 아니면 로그인 탭 유지
    document.querySelector('[data-target="login-section"]').click();
  }
});
