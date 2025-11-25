/**
 * Todo List - 서버 API 연동 버전
 * 로그인한 사용자의 Todo 목록을 서버에서 관리
 */

document.addEventListener("DOMContentLoaded", async () => {
    // ==========================================
    // 로그인 상태 확인
    // ==========================================

    /**
     * 페이지 로드 시 로그인 상태를 확인하고, 비로그인 시 로그인 페이지로 리다이렉트
     */
    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/check');
            const data = await response.json();

            if (!data.loggedIn) {
                // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
                alert('로그인이 필요합니다.');
                window.location.href = '/login/index.html';
                return false;
            }

            return true;
        } catch (error) {
            console.error('인증 확인 오류:', error);
            window.location.href = '/login/index.html';
            return false;
        }
    }

    // 로그인 상태 확인
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) return;

    // ==========================================
    // DOM 요소
    // ==========================================

    const body = document.body;
    const themeToggleBtn = document.getElementById("themeToggleBtn");

    const taskInput = document.getElementById("taskInput");
    const categorySelect = document.getElementById("categorySelect");
    const repetitionSelect = document.getElementById("repetitionSelect");
    const prioritySelect = document.getElementById("prioritySelect");
    const emojiSelect = document.getElementById("emojiSelect");
    const dueDateInput = document.getElementById("dueDateInput");
    const dueTimeInput = document.getElementById("dueTimeInput");
    const dueAmPmInput = document.getElementById("dueAmPmInput");
    const addTaskBtn = document.getElementById("addTaskBtn");
    const taskList = document.getElementById("taskList");
    const taskSearchInput = document.getElementById("taskSearchInput");

    const currentMonthYearDisplay = document.getElementById("currentMonthYear");
    const prevMonthBtn = document.getElementById("prevMonthBtn");
    const nextMonthBtn = document.getElementById("nextMonthBtn");
    const calendarGrid = document.querySelector(".calendar-grid");

    const dailyScheduleDisplay = document.getElementById("dailyScheduleDisplay");
    const dailyTaskList = document.getElementById("dailyTaskList");

    const filterButtons = document.querySelectorAll(".filter-btn");
    const dateViewButtons = document.querySelectorAll(".date-view-btn");

    // ==========================================
    // 상태 변수
    // ==========================================

    let currentFilterCategory = "all";
    let currentDateView = "all";
    let searchQuery = "";
    let currentDate = new Date();
    let selectedDateStr = null;
    let editingTask = null;
    let allTodos = []; // 서버에서 가져온 모든 Todo 목록

    // 날짜 -> Set(우선순위)
    let priorityByDate = new Map();

    // ==========================================
    // 유틸리티 함수
    // ==========================================

    const pad = (n) => n.toString().padStart(2, "0");
    const formatDateStr = (d) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    function getPriorityRank(p) {
        return p === "high" ? 1 : p === "medium" ? 2 : p === "low" ? 3 : 4;
    }

    // ==========================================
    // 테마 관리
    // ==========================================

    function applyTheme(theme) {
        if (theme === "dark") {
            body.classList.remove("light-mode");
            body.classList.add("dark-mode");
            themeToggleBtn.textContent = "라이트 모드";
        } else {
            body.classList.remove("dark-mode");
            body.classList.add("light-mode");
            themeToggleBtn.textContent = "다크 모드";
        }
    }

    const savedTheme = localStorage.getItem("theme") || "light";
    applyTheme(savedTheme);

    themeToggleBtn.addEventListener("click", () => {
        const isDark = body.classList.contains("dark-mode");
        const next = isDark ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem("theme", next);
    });

    // ==========================================
    // 서버 API 통신 함수
    // ==========================================

    /**
     * 서버에서 Todo 목록 가져오기
     */
    async function fetchTodos() {
        try {
            const response = await fetch('/api/todos');
            const data = await response.json();

            if (data.success) {
                allTodos = data.todos;
                renderAllTodos();
                updatePriorityByDate();
            } else {
                console.error('Todo 조회 실패:', data.message);
            }
        } catch (error) {
            console.error('Todo 조회 오류:', error);
            alert('Todo 목록을 불러오는 중 오류가 발생했습니다.');
        }
    }

    /**
     * 서버에 Todo 추가
     */
    async function addTodoToServer(todoData) {
        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todoData)
            });

            const data = await response.json();

            if (data.success) {
                // 서버에서 Todo 목록 다시 가져오기
                await fetchTodos();
                return true;
            } else {
                alert(data.message || 'Todo 추가에 실패했습니다.');
                return false;
            }
        } catch (error) {
            console.error('Todo 추가 오류:', error);
            alert('Todo 추가 중 오류가 발생했습니다.');
            return false;
        }
    }

    /**
     * 서버의 Todo 수정
     */
    async function updateTodoOnServer(todoId, todoData) {
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(todoData)
            });

            const data = await response.json();

            if (data.success) {
                await fetchTodos();
                return true;
            } else {
                alert(data.message || 'Todo 수정에 실패했습니다.');
                return false;
            }
        } catch (error) {
            console.error('Todo 수정 오류:', error);
            alert('Todo 수정 중 오류가 발생했습니다.');
            return false;
        }
    }

    /**
     * 서버에서 Todo 삭제
     */
    async function deleteTodoFromServer(todoId) {
        try {
            const response = await fetch(`/api/todos/${todoId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                await fetchTodos();
                return true;
            } else {
                alert(data.message || 'Todo 삭제에 실패했습니다.');
                return false;
            }
        } catch (error) {
            console.error('Todo 삭제 오류:', error);
            alert('Todo 삭제 중 오류가 발생했습니다.');
            return false;
        }
    }

    // ==========================================
    // UI 렌더링 함수
    // ==========================================

    /**
     * 모든 Todo를 화면에 렌더링
     */
    function renderAllTodos() {
        taskList.innerHTML = '';

        // 정렬: 날짜 → 시간 → 우선순위 → 텍스트
        const sortedTodos = [...allTodos].sort((a, b) => {
            const da = a.dueDate || '';
            const db = b.dueDate || '';
            if (da && !db) return -1;
            if (!da && db) return 1;
            if (da !== db) return da.localeCompare(db);

            const ta = a.dueTime || '';
            const tb = b.dueTime || '';
            if (ta && !tb) return -1;
            if (!ta && tb) return 1;
            if (ta !== tb) return ta.localeCompare(tb);

            const pa = getPriorityRank(a.priority);
            const pb = getPriorityRank(b.priority);
            if (pa !== pb) return pa - pb;

            return a.text.toLowerCase().localeCompare(b.text.toLowerCase());
        });

        sortedTodos.forEach((todo) => {
            createTaskElement(todo);
        });

        filterTasks();
    }

    /**
     * Todo DOM 요소 생성
     */
    function createTaskElement(todo) {
        const li = document.createElement("li");
        li.dataset.todoId = todo.id;
        li.dataset.category = todo.category || "";
        li.dataset.repetition = todo.repetition || "none";
        li.dataset.priority = todo.priority || "none";
        li.dataset.dueDate = todo.dueDate || "";
        li.dataset.dueTime = todo.dueTime || "";

        // 우선순위 배경색
        if (todo.priority && todo.priority !== "none") {
            li.classList.add(`priority-bg-${todo.priority}`);
        }

        if (todo.completed) li.classList.add("completed");

        // 상단: 이모티콘 + 텍스트
        const topRow = document.createElement("div");
        topRow.classList.add("task-row-main");

        if (todo.emoji) {
            const e = document.createElement("span");
            e.classList.add("task-emoji");
            e.textContent = todo.emoji;
            topRow.appendChild(e);
        }

        const content = document.createElement("span");
        content.classList.add("task-content");
        content.textContent = todo.text;
        topRow.appendChild(content);

        // 하단: 메타 + 버튼
        const details = document.createElement("div");
        details.classList.add("task-details-display");

        const meta = document.createElement("div");
        meta.classList.add("task-meta");

        if (todo.category && todo.category !== "all") {
            const m = document.createElement("span");
            m.classList.add("task-category");
            const map = { work: "업무", personal: "개인", exercise: "운동", rest: "휴식" };
            m.textContent = map[todo.category] || todo.category;
            meta.appendChild(m);
        }

        if (todo.priority && todo.priority !== "none") {
            const m = document.createElement("span");
            m.classList.add("task-priority");
            const map = { high: "상", medium: "중", low: "하" };
            m.textContent = map[todo.priority] || todo.priority;
            meta.appendChild(m);
        }

        if (todo.dueDate || todo.dueTime) {
            const m = document.createElement("span");
            m.classList.add("task-date");
            m.textContent = [todo.dueDate, todo.dueTime].filter(Boolean).join(" ");
            meta.appendChild(m);
        }

        details.appendChild(meta);

        const actions = document.createElement("div");
        actions.classList.add("task-actions");

        const completeBtn = document.createElement("button");
        completeBtn.classList.add("complete-btn");
        completeBtn.textContent = "Done";
        completeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            handleComplete(todo.id, !todo.completed);
        });
        actions.appendChild(completeBtn);

        const editBtn = document.createElement("button");
        editBtn.classList.add("edit-btn");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            handleEdit(todo);
        });
        actions.appendChild(editBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-btn");
        deleteBtn.textContent = "Del";
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            handleDelete(todo.id);
        });
        actions.appendChild(deleteBtn);

        details.appendChild(actions);

        li.appendChild(topRow);
        li.appendChild(details);
        taskList.appendChild(li);
    }

    /**
     * Todo 완료 상태 토글
     */
    async function handleComplete(todoId, completed) {
        const todo = allTodos.find(t => t.id === todoId);
        if (!todo) return;

        await updateTodoOnServer(todoId, { ...todo, completed });
    }

    /**
     * Todo 편집 모드
     */
    function handleEdit(todo) {
        editingTask = todo;
        taskInput.value = todo.text;
        categorySelect.value = todo.category || "all";
        repetitionSelect.value = todo.repetition || "none";
        prioritySelect.value = todo.priority || "none";
        emojiSelect.value = todo.emoji || "";
        dueDateInput.value = todo.dueDate || "";

        const dueTime = todo.dueTime || "";
        if (dueTime) {
            const [hour, minute] = dueTime.split(":");
            const hour12 = parseInt(hour, 10) % 12 || 12;
            const ampm = parseInt(hour, 10) >= 12 ? "pm" : "am";
            dueTimeInput.value = `${pad(hour12)}:${minute}`;
            dueAmPmInput.value = ampm;
        } else {
            dueTimeInput.value = "";
            dueAmPmInput.value = "am";
        }

        addTaskBtn.textContent = "수정";
    }

    /**
     * Todo 삭제
     */
    async function handleDelete(todoId) {
        if (!confirm('정말로 삭제하시겠습니까?')) return;

        await deleteTodoFromServer(todoId);

        if (selectedDateStr) {
            displayTasksForDate(selectedDateStr);
        }
    }

    /**
     * Todo 추가/수정 처리
     */
    async function addTask() {
        const text = taskInput.value.trim();
        if (!text) {
            alert("할 일을 입력하세요.");
            return;
        }

        const category = categorySelect.value;
        const repetition = repetitionSelect.value;
        const priority = prioritySelect.value;
        const emoji = emojiSelect.value;
        const baseDueDate = dueDateInput.value;
        const dueTimeStr = dueTimeInput.value.trim();
        const dueAmPm = dueAmPmInput.value;

        let baseDueTime = "";
        if (dueTimeStr) {
            const timeRegex = /^([0-9]|0[0-9]|1[0-2]):([0-5][0-9])$/;
            const match = dueTimeStr.match(timeRegex);

            if (!match) {
                alert("시간 형식이 올바르지 않습니다. (예: 10:30)");
                return;
            }

            let hour = parseInt(match[1], 10);
            const minute = parseInt(match[2], 10);

            if (dueAmPm === "pm" && hour !== 12) {
                hour += 12;
            } else if (dueAmPm === "am" && hour === 12) {
                hour = 0;
            }
            baseDueTime = `${pad(hour)}:${pad(minute)}`;
        }

        if (editingTask) {
            // 수정 모드
            await updateTodoOnServer(editingTask.id, {
                text,
                category,
                repetition,
                priority,
                emoji,
                dueDate: baseDueDate,
                dueTime: baseDueTime,
                completed: editingTask.completed
            });

            editingTask = null;
            addTaskBtn.textContent = "추가";
        } else {
            // 추가 모드
            if (repetition !== "none" && !baseDueDate) {
                alert("반복 일정을 사용하려면 날짜를 선택하세요.");
                return;
            }

            // 반복 일정이 있는 경우 여러 개 생성
            if (baseDueDate && repetition !== "none") {
                const dateParts = baseDueDate.split('-').map(Number);
                const base = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
                const occurrences = 5;

                if (repetition === "weekdays") {
                    let daysAdded = 0;
                    let currentDay = new Date(base);
                    while (daysAdded < occurrences) {
                        const dayOfWeek = currentDay.getDay();
                        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                            await addTodoToServer({
                                text,
                                category,
                                repetition,
                                priority,
                                emoji,
                                dueDate: formatDateStr(currentDay),
                                dueTime: baseDueTime
                            });
                            daysAdded++;
                        }
                        currentDay.setDate(currentDay.getDate() + 1);
                    }
                } else {
                    for (let i = 0; i < occurrences; i++) {
                        const d = new Date(base);
                        if (repetition === "daily") d.setDate(base.getDate() + i);
                        else if (repetition === "weekly") d.setDate(base.getDate() + i * 7);
                        else if (repetition === "monthly") d.setMonth(base.getMonth() + i);

                        await addTodoToServer({
                            text,
                            category,
                            repetition,
                            priority,
                            emoji,
                            dueDate: formatDateStr(d),
                            dueTime: baseDueTime
                        });
                    }
                }
            } else {
                // 단일 Todo 추가
                await addTodoToServer({
                    text,
                    category,
                    repetition,
                    priority,
                    emoji,
                    dueDate: baseDueDate || "",
                    dueTime: baseDueTime || ""
                });
            }
        }

        // 입력창 초기화
        taskInput.value = "";
        categorySelect.value = "all";
        repetitionSelect.value = "none";
        prioritySelect.value = "none";
        emojiSelect.value = "";
    }

    addTaskBtn.addEventListener("click", addTask);
    taskInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") addTask();
    });

    // ==========================================
    // 필터 및 검색
    // ==========================================

    function filterTasks() {
        const items = taskList.querySelectorAll("li");
        const now = new Date();
        const todayStr = formatDateStr(now);
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfWeekStr = formatDateStr(startOfWeek);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        const endOfWeekStr = formatDateStr(endOfWeek);

        items.forEach((li) => {
            const category = li.dataset.category || "all";
            const text = (li.querySelector(".task-content")?.textContent || "").toLowerCase();
            const dueDate = li.dataset.dueDate;

            const matchesCategory =
                currentFilterCategory === "all" ||
                category === currentFilterCategory ||
                category === "";

            const matchesSearch =
                !searchQuery || text.includes(searchQuery.toLowerCase());

            let matchesDate = false;
            if (currentDateView === 'all') {
                matchesDate = true;
            } else if (dueDate) {
                const taskDate = new Date(dueDate);
                if (currentDateView === 'daily') {
                    matchesDate = dueDate === todayStr;
                } else if (currentDateView === 'weekly') {
                    matchesDate = dueDate >= startOfWeekStr && dueDate <= endOfWeekStr;
                } else if (currentDateView === 'monthly') {
                    matchesDate = taskDate.getFullYear() === currentYear && taskDate.getMonth() === currentMonth;
                }
            }

            li.style.display = matchesCategory && matchesSearch && matchesDate ? "" : "none";
        });
    }

    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilterCategory = btn.dataset.filter || "all";
            localStorage.setItem("filter", currentFilterCategory);
            filterTasks();
        });
    });

    dateViewButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            dateViewButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentDateView = btn.dataset.viewType || "all";
            filterTasks();
        });
    });

    taskSearchInput.addEventListener("input", () => {
        searchQuery = taskSearchInput.value;
        localStorage.setItem("search", searchQuery);
        filterTasks();
    });

    // ==========================================
    // 캘린더
    // ==========================================

    function updatePriorityByDate() {
        priorityByDate = new Map();
        allTodos.forEach((todo) => {
            const dateStr = todo.dueDate;
            const pr = todo.priority;
            if (!dateStr || !pr || pr === "none") return;
            if (!priorityByDate.has(dateStr)) priorityByDate.set(dateStr, new Set());
            priorityByDate.get(dateStr).add(pr);
        });
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
        if (selectedDateStr) displayTasksForDate(selectedDateStr);
    }

    function renderCalendar(year, month) {
        calendarGrid.querySelectorAll(".calendar-day").forEach((d) => d.remove());

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstWeekday = firstDay.getDay();

        currentMonthYearDisplay.textContent = `${year}년 ${month + 1}월`;

        for (let i = 0; i < firstWeekday; i++) {
            const empty = document.createElement("div");
            empty.classList.add("calendar-day", "empty");
            calendarGrid.appendChild(empty);
        }

        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dateObj = new Date(year, month, day);
            const dateStr = formatDateStr(dateObj);

            const dayCell = document.createElement("div");
            dayCell.classList.add("calendar-day");
            dayCell.textContent = day;

            const dow = dateObj.getDay();
            if (dow === 0) dayCell.classList.add("sunday");
            if (dow === 6) dayCell.classList.add("saturday");

            const priorities = priorityByDate.get(dateStr);
            if (priorities && priorities.size > 0) {
                const stack = document.createElement("div");
                stack.classList.add("priority-stack");
                ["high", "medium", "low"].forEach((lv) => {
                    if (priorities.has(lv)) {
                        const seg = document.createElement("div");
                        seg.classList.add("priority-segment", `priority-${lv}`);
                        stack.appendChild(seg);
                    }
                });
                dayCell.appendChild(stack);
            }

            if (selectedDateStr === dateStr) {
                dayCell.classList.add("selected-date");
            }

            dayCell.addEventListener("click", () => {
                selectedDateStr = dateStr;
                dueDateInput.value = dateStr;
                localStorage.setItem("selectedDate", selectedDateStr);
                displayTasksForDate(dateStr);
                document
                    .querySelectorAll(".calendar-day")
                    .forEach((d) => d.classList.remove("selected-date"));
                dayCell.classList.add("selected-date");
            });

            calendarGrid.appendChild(dayCell);
        }
    }

    function displayTasksForDate(dateStr) {
        dailyTaskList.innerHTML = "";

        const dateParts = dateStr.split('-').map(Number);
        const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
        dailyScheduleDisplay.querySelector("h3").textContent = `${month}월 ${day}일 (${dayOfWeek})`;

        const tasksForDate = allTodos.filter(todo => todo.dueDate === dateStr);

        if (tasksForDate.length === 0) {
            const noTaskMsg = document.createElement("li");
            noTaskMsg.textContent = "이 날짜에 등록된 일정이 없습니다.";
            noTaskMsg.style.textAlign = "center";
            noTaskMsg.style.opacity = "0.7";
            dailyTaskList.appendChild(noTaskMsg);
            return;
        }

        tasksForDate.forEach((todo) => {
            const li = document.createElement("li");
            li.classList.add("daily-task-item");
            if (todo.completed) li.classList.add("completed");

            const text = document.createElement("span");
            text.textContent = `${todo.emoji || ''} ${todo.text}`;
            li.appendChild(text);

            dailyTaskList.appendChild(li);
        });
    }

    prevMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    nextMonthBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    // ==========================================
    // 시간 입력 자동 포맷
    // ==========================================

    dueTimeInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) {
            value = value.slice(0, 4);
        }
        if (value.length > 2) {
            value = value.slice(0, 2) + ':' + value.slice(2);
        }
        e.target.value = value;
    });

    // ==========================================
    // 초기화
    // ==========================================

    async function initialize() {
        // 서버에서 Todo 목록 가져오기
        await fetchTodos();

        const savedFilter = localStorage.getItem("filter") || "all";
        const filterBtn = document.querySelector(`.filter-btn[data-filter="${savedFilter}"]`);
        if (filterBtn) {
            filterButtons.forEach((b) => b.classList.remove("active"));
            filterBtn.classList.add("active");
            currentFilterCategory = savedFilter;
        }

        const savedSearch = localStorage.getItem("search") || "";
        taskSearchInput.value = savedSearch;
        searchQuery = savedSearch;

        selectedDateStr = localStorage.getItem("selectedDate");
        if (selectedDateStr) {
            const dateParts = selectedDateStr.split('-').map(Number);
            currentDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            dueDateInput.value = selectedDateStr;
            displayTasksForDate(selectedDateStr);
        } else {
            currentDate = new Date();
        }

        filterTasks();
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());

        // 기본 시간 설정
        if (!dueTimeInput.value) {
            const now = new Date();
            let currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const ampm = currentHour >= 12 ? "pm" : "am";

            currentHour = currentHour % 12;
            currentHour = currentHour === 0 ? 12 : currentHour;

            dueTimeInput.value = `${pad(currentHour)}:${pad(currentMinute)}`;
            dueAmPmInput.value = ampm;
        }
    }

    // ==========================================
    // 로그아웃 기능
    // ==========================================

    const logoutBtn = document.getElementById('logoutBtn');

    logoutBtn.addEventListener('click', async () => {
        if (!confirm('로그아웃 하시겠습니까?')) return;

        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST'
            });

            const data = await response.json();

            if (data.success) {
                alert('로그아웃되었습니다.');
                window.location.href = '/login/index.html';
            } else {
                alert(data.message || '로그아웃 실패');
            }
        } catch (error) {
            console.error('로그아웃 오류:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        }
    });

    // ==========================================
    // 프로필 모달 기능
    // ==========================================

    const profileBtn = document.getElementById('profileBtn');
    const profileModal = document.getElementById('profileModal');
    const closeModal = document.querySelector('.close-modal');
    const updateProfileBtn = document.getElementById('updateProfileBtn');
    const changePasswordBtn = document.getElementById('changePasswordBtn');

    // 프로필 모달 열기
    profileBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/profile');
            const data = await response.json();

            if (data.success) {
                const user = data.user;
                document.getElementById('userEmail').textContent = user.email || '-';
                document.getElementById('userNickname').textContent = user.nickname || '-';
                document.getElementById('userName').textContent = user.name || '-';
                document.getElementById('userCreatedAt').textContent =
                    user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-';

                // 프로필 사진 표시
                if (user.profileImage) {
                    document.getElementById('profilePhotoPreview').src = user.profileImage;
                }

                profileModal.classList.remove('hidden');
            } else {
                alert(data.message || '프로필 정보를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('프로필 조회 오류:', error);
            alert('프로필 정보 조회 중 오류가 발생했습니다.');
        }
    });

    // 프로필 모달 닫기
    closeModal.addEventListener('click', () => {
        profileModal.classList.add('hidden');
        document.getElementById('profileUpdateMsg').textContent = '';
        document.getElementById('passwordChangeMsg').textContent = '';
    });

    // 모달 외부 클릭 시 닫기
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.classList.add('hidden');
        }
    });

    // 프로필 정보 수정
    updateProfileBtn.addEventListener('click', async () => {
        const name = document.getElementById('editName').value.trim();
        const nickname = document.getElementById('editNickname').value.trim();
        const address = document.getElementById('editAddress').value.trim();
        const phone = document.getElementById('editPhone').value.trim();

        const updateData = {};
        if (name) updateData.name = name;
        if (nickname) updateData.nickname = nickname;
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;

        if (Object.keys(updateData).length === 0) {
            document.getElementById('profileUpdateMsg').textContent = '수정할 정보를 입력해주세요.';
            return;
        }

        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById('profileUpdateMsg').textContent = '프로필이 수정되었습니다.';
                document.getElementById('profileUpdateMsg').style.color = '#2ecc71';

                // 입력 필드 초기화
                document.getElementById('editName').value = '';
                document.getElementById('editNickname').value = '';
                document.getElementById('editAddress').value = '';
                document.getElementById('editPhone').value = '';

                // 프로필 정보 다시 불러오기
                setTimeout(() => {
                    profileBtn.click(); // 모달 새로고침
                }, 500);
            } else {
                document.getElementById('profileUpdateMsg').textContent = data.message || '수정 실패';
                document.getElementById('profileUpdateMsg').style.color = '#e74c3c';
            }
        } catch (error) {
            console.error('프로필 수정 오류:', error);
            document.getElementById('profileUpdateMsg').textContent = '프로필 수정 중 오류가 발생했습니다.';
            document.getElementById('profileUpdateMsg').style.color = '#e74c3c';
        }
    });

    // 비밀번호 변경
    changePasswordBtn.addEventListener('click', async () => {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;

        if (!currentPassword || !newPassword || !newPasswordConfirm) {
            document.getElementById('passwordChangeMsg').textContent = '모든 필드를 입력해주세요.';
            document.getElementById('passwordChangeMsg').style.color = '#e74c3c';
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            document.getElementById('passwordChangeMsg').textContent = '새 비밀번호가 일치하지 않습니다.';
            document.getElementById('passwordChangeMsg').style.color = '#e74c3c';
            return;
        }

        if (newPassword.length < 8) {
            document.getElementById('passwordChangeMsg').textContent = '비밀번호는 8자 이상이어야 합니다.';
            document.getElementById('passwordChangeMsg').style.color = '#e74c3c';
            return;
        }

        try {
            const response = await fetch('/api/profile/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById('passwordChangeMsg').textContent = '비밀번호가 변경되었습니다.';
                document.getElementById('passwordChangeMsg').style.color = '#2ecc71';

                // 입력 필드 초기화
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('newPasswordConfirm').value = '';
            } else {
                document.getElementById('passwordChangeMsg').textContent = data.message || '변경 실패';
                document.getElementById('passwordChangeMsg').style.color = '#e74c3c';
            }
        } catch (error) {
            console.error('비밀번호 변경 오류:', error);
            document.getElementById('passwordChangeMsg').textContent = '비밀번호 변경 중 오류가 발생했습니다.';
            document.getElementById('passwordChangeMsg').style.color = '#e74c3c';
        }
    });

    // 프로필 사진 업로드
    const selectPhotoBtn = document.getElementById('selectPhotoBtn');
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');

    // 사진 선택 버튼 클릭
    selectPhotoBtn.addEventListener('click', () => {
        profilePhotoInput.click();
    });

    // 파일 선택 시 미리보기
    profilePhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                document.getElementById('photoUploadMsg').textContent = '파일 크기는 5MB 이하여야 합니다.';
                document.getElementById('photoUploadMsg').style.color = '#e74c3c';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                profilePhotoPreview.src = event.target.result;
                uploadPhotoBtn.style.display = 'inline-block';
                document.getElementById('photoUploadMsg').textContent = '';
            };
            reader.readAsDataURL(file);
        }
    });

    // 업로드 버튼 클릭
    uploadPhotoBtn.addEventListener('click', async () => {
        const file = profilePhotoInput.files[0];
        if (!file) {
            document.getElementById('photoUploadMsg').textContent = '파일을 선택해주세요.';
            document.getElementById('photoUploadMsg').style.color = '#e74c3c';
            return;
        }

        const formData = new FormData();
        formData.append('profilePhoto', file);

        try {
            const response = await fetch('/api/profile/photo', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                document.getElementById('photoUploadMsg').textContent = '프로필 사진이 업로드되었습니다!';
                document.getElementById('photoUploadMsg').style.color = '#2ecc71';
                uploadPhotoBtn.style.display = 'none';
                profilePhotoInput.value = '';
            } else {
                document.getElementById('photoUploadMsg').textContent = data.message || '업로드 실패';
                document.getElementById('photoUploadMsg').style.color = '#e74c3c';
            }
        } catch (error) {
            console.error('프로필 사진 업로드 오류:', error);
            document.getElementById('photoUploadMsg').textContent = '업로드 중 오류가 발생했습니다.';
            document.getElementById('photoUploadMsg').style.color = '#e74c3c';
        }
    });

    // 회원 탈퇴
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

    deleteAccountBtn.addEventListener('click', async () => {
        const password = document.getElementById('deleteAccountPassword').value;

        if (!password) {
            document.getElementById('deleteAccountMsg').textContent = '비밀번호를 입력해주세요.';
            document.getElementById('deleteAccountMsg').style.color = '#e74c3c';
            return;
        }

        if (!confirm('정말로 회원 탈퇴하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다.')) {
            return;
        }

        if (!confirm('정말 정말 확실합니까? 이 작업은 되돌릴 수 없습니다!')) {
            return;
        }

        try {
            const response = await fetch('/api/profile/account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.success) {
                alert('회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.');
                window.location.href = '/login/index.html';
            } else {
                document.getElementById('deleteAccountMsg').textContent = data.message || '탈퇴 실패';
                document.getElementById('deleteAccountMsg').style.color = '#e74c3c';
            }
        } catch (error) {
            console.error('회원 탈퇴 오류:', error);
            document.getElementById('deleteAccountMsg').textContent = '회원 탈퇴 중 오류가 발생했습니다.';
            document.getElementById('deleteAccountMsg').style.color = '#e74c3c';
        }
    });

    initialize();
});
