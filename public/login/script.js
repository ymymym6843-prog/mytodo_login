/* 
  script.js - 로그인/회원가입 클라이언트 스크립트
  서버 API와 통신하여 사용자 인증 처리
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

/* ---------- DOM 요소 가져오기 ---------- */

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

// 보안 질문 관련 요소
const signupSecurityQuestionSelect = document.getElementById("signupSecurityQuestion");
const signupSecurityAnswerInput = document.getElementById("signupSecurityAnswer");

/* ---------- 테마 전환 기능 ---------- */

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

        // 모든 탭 버튼에서 active 클래스 제거
        tabButtons.forEach((b) => b.classList.remove("active"));
        // 클릭한 버튼만 active
        clickedTab.classList.add("active");

        // 모든 섹션 숨김
        viewSections.forEach((sec) => sec.classList.remove("active"));
        // 대상 섹션만 보이기
        document.getElementById(targetId).classList.add("active");
    });
});

/* ---------- 비밀번호 눈 아이콘(보기/숨기기) ---------- */

document.querySelectorAll(".eye-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-target-input");
        const input = document.getElementById(targetId);
        if (!input) return;

        if (input.type === "password") {
            input.type = "text";
        } else {
            input.type = "password";
        }
    });
});

/* ---------- 로그인 기능 ---------- */

/**
 * 로그인 버튼 클릭 이벤트
 */
loginBtn.addEventListener("click", async () => {
    loginErrorMsg.textContent = "";
    loginAttemptInfo.textContent = "";

    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;
    const rememberMe = rememberMeCheckbox.checked;

    if (!email || !password) {
        loginErrorMsg.textContent = "이메일과 비밀번호를 모두 입력해주세요.";
        return;
    }

    try {
        // 서버에 로그인 요청
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, rememberMe })
        });

        const data = await response.json();

        if (data.success) {
            loginAttemptInfo.textContent = "로그인 성공! Todo 페이지로 이동합니다...";

            // Todo 페이지로 리다이렉트
            setTimeout(() => {
                window.location.href = '/todo/index.html';
            }, 700);
        } else {
            loginErrorMsg.textContent = data.message || "로그인에 실패했습니다.";
        }

    } catch (error) {
        console.error('로그인 오류:', error);
        loginErrorMsg.textContent = "서버 연결 중 오류가 발생했습니다.";
    }
});

/* ---------- 회원가입 기능 ---------- */

/**
 * 이메일 도메인 선택
 */
signupEmailDomainSelect.addEventListener("change", (e) => {
    const selectedDomain = e.target.value;
    signupEmailDomainInput.value = selectedDomain === "직접입력" ? "" : selectedDomain;
    signupEmailDomainInput.readOnly = selectedDomain !== "직접입력";
});

/**
 * 비밀번호와 비밀번호 확인 필드의 값이 일치하는지 실시간으로 확인
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

/**
 * 비밀번호 강도 계산
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

/**
 * 비밀번호 입력 시마다 강도 업데이트
 */
signupPasswordInput.addEventListener("input", () => {
    const password = signupPasswordInput.value;
    const strength = calcPasswordStrength(password);

    strengthFill.style.width = `${strength}%`;

    if (strength < 30) {
        strengthFill.style.background = "#e74c3c";
        strengthText.textContent = "비밀번호 강도: 매우 약함 (보안 위험)";
    } else if (strength < 60) {
        strengthFill.style.background = "#f1c40f";
        strengthText.textContent = "비밀번호 강도: 보통";
    } else if (strength < 90) {
        strengthFill.style.background = "#2ecc71";
        strengthText.textContent = "비밀번호 강도: 강함";
    } else {
        strengthFill.style.background = "#3498db";
        strengthText.textContent = "비밀번호 강도: 매우 강함 (안전)";
    }
});

/**
 * 주소 찾기 기능 (카카오 우편번호 서비스)
 */
findAddressBtn.addEventListener('click', function () {
    const wrap = document.getElementById('address-search-wrap');

    new daum.Postcode({
        oncomplete: function (data) {
            let addr = '';

            if (data.userSelectedType === 'R') {
                addr = data.roadAddress;
            } else {
                addr = data.jibunAddress;
            }

            signupZipcodeInput.value = data.zonecode;
            signupAddressInput.value = addr;
            signupAddressDetailInput.focus();

            wrap.style.display = 'none';
        },
        onclose: function () {
            wrap.style.display = 'none';
        },
        width: '100%',
        height: '100%'
    }).embed(wrap);

    wrap.style.display = 'block';
});

/**
 * 휴대전화 인증 (간단한 데모 버전)
 */
sendVerificationCodeBtn.addEventListener('click', () => {
    const phone = signupPhoneInput.value.trim();

    if (!phone) {
        alert('휴대전화번호를 입력해주세요.');
        return;
    }

    // 실제로는 서버에서 SMS를 발송해야 하지만, 데모에서는 간단히 처리
    phoneVerificationArea.classList.remove('hidden');

    // 데모 인증번호를 팝업으로 표시
    alert('📱 휴대전화 인증\n\n인증번호가 발송되었습니다.\n\n[데모 인증번호: 123456]\n\n위 번호를 입력해주세요.');

    phoneVerificationMsg.textContent = '인증번호가 발송되었습니다.';
});

confirmVerificationCodeBtn.addEventListener('click', () => {
    const code = phoneVerificationCodeInput.value.trim();

    // 데모용 인증번호
    if (code === '123456') {
        isPhoneVerified = true;
        phoneVerificationMsg.textContent = '✅ 인증이 완료되었습니다.';
        phoneVerificationMsg.style.color = '#2ecc71';
    } else {
        phoneVerificationMsg.textContent = '❌ 인증번호가 올바르지 않습니다.';
        phoneVerificationMsg.style.color = '#e74c3c';
    }
});

/**
 * 닉네임 중복 체크
 */
checkNicknameBtn.addEventListener('click', async () => {
    const nickname = signupNicknameInput.value.trim();

    if (!nickname) {
        alert('닉네임을 입력해주세요.');
        return;
    }

    try {
        const response = await fetch('/api/auth/check-nickname', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickname })
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
        } else {
            alert(data.message || '닉네임 확인 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('닉네임 확인 오류:', error);
        alert('서버 연결 중 오류가 발생했습니다.');
    }
});

/**
 * 이메일 중복 체크
 */
checkEmailBtn.addEventListener('click', async () => {
    const emailId = signupEmailIdInput.value.trim();
    const emailDomain = signupEmailDomainInput.value.trim();

    if (!emailId || !emailDomain) {
        alert('이메일 아이디와 도메인을 모두 입력해주세요.');
        return;
    }

    const email = `${emailId}@${emailDomain}`;

    try {
        const response = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            alert(data.message);
        } else {
            alert(data.message || '이메일 확인 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('이메일 확인 오류:', error);
        alert('서버 연결 중 오류가 발생했습니다.');
    }
});

/**
 * 회원가입 버튼 클릭
 */
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

    if (password !== passwordConfirm) {
        signupMsg.textContent = "비밀번호가 일치하지 않습니다.";
        signupMsg.classList.add("error-msg");
        return;
    }

    if (password.length < 8) {
        alert("비밀번호는 8자 이상이어야 합니다.");
        signupMsg.textContent = "비밀번호는 8자 이상이어야 합니다.";
        signupMsg.classList.add("error-msg");
        return;
    }

    if (!agreeServiceTerms || !agreeTerms) {
        alert("필수 약관에 모두 동의해야 회원가입이 가능합니다.");
        signupMsg.textContent = "필수 약관에 동의해주세요.";
        signupMsg.classList.add("error-msg");
        return;
    }

    if (!securityQuestion || !securityAnswer) {
        alert("비밀번호 찾기 질문과 답변을 모두 입력해주세요.");
        signupMsg.textContent = "비밀번호 찾기 질문과 답변을 입력해주세요.";
        return;
    }

    try {
        // 서버에 회원가입 요청
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                nickname,
                name,
                phone,
                gender,
                address,
                securityQuestion,
                securityAnswer
            })
        });

        const data = await response.json();

        if (data.success) {
            signupMsg.textContent = "회원가입이 완료되었습니다! 자동 로그인 후 Todo 페이지로 이동합니다.";
            signupMsg.classList.remove("error-msg");

            // Todo 페이지로 리다이렉트
            setTimeout(() => {
                window.location.href = '/todo/index.html';
            }, 800);
        } else {
            signupMsg.textContent = data.message || "회원가입에 실패했습니다.";
            signupMsg.classList.add("error-msg");
        }

    } catch (error) {
        console.error('회원가입 오류:', error);
        signupMsg.textContent = "서버 연결 중 오류가 발생했습니다.";
        signupMsg.classList.add("error-msg");
    }
});

/* ---------- 초기화 ---------- */

/**
 * 페이지 로드 시 초기화
 */
function init() {
    // 테마 초기화
    initTheme();

    // 보안 질문 옵션 추가
    SECURITY_QUESTIONS.forEach((q) => {
        const option = document.createElement("option");
        option.value = q;
        option.textContent = q;
        signupSecurityQuestionSelect.appendChild(option);
    });
}

// 페이지 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', init);
