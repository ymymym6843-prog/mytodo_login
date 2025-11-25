document.addEventListener("DOMContentLoaded", () => {
  // === DOM ===
  const body = document.body;
  const themeToggleBtn = document.getElementById("themeToggleBtn");

  const taskInput = document.getElementById("taskInput");
  const categorySelect = document.getElementById("categorySelect");
  const repetitionSelect = document.getElementById("repetitionSelect");
  const prioritySelect = document.getElementById("prioritySelect");
  const emojiSelect = document.getElementById("emojiSelect");
  const dueDateInput = document.getElementById("dueDateInput");
  const dueTimeInput = document.getElementById("dueTimeInput"); // New time input
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

  // === 상태 ===
  let currentFilterCategory = "all";
  let currentDateView = "all";
  let searchQuery = "";
  let currentDate = new Date();
  let selectedDateStr = null;
  let editingTask = null;

  // 날짜 -> Set(우선순위)
  let priorityByDate = new Map();

  // 유틸
  const pad = (n) => n.toString().padStart(2, "0");
  const formatDateStr = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  function getPriorityRank(p) {
    return p === "high" ? 1 : p === "medium" ? 2 : p === "low" ? 3 : 4;
  }



  // === 테마 ===
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

  // === 정렬: 날짜 → 시간 → 우선순위 → 텍스트 ===
  function sortTaskList() {
    const items = Array.from(taskList.querySelectorAll("li"));
    items.sort((a, b) => {
      const da = a.dataset.dueDate || "";
      const db = b.dataset.dueDate || "";
      if (da && !db) return -1;
      if (!da && db) return 1;
      if (da !== db) return da.localeCompare(db);

      const ta = a.dataset.dueTime || "";
      const tb = b.dataset.dueTime || "";
      if (ta && !tb) return -1;
      if (!ta && tb) return 1;
      if (ta !== tb) return ta.localeCompare(tb);

      const pa = getPriorityRank(a.dataset.priority);
      const pb = getPriorityRank(b.dataset.priority);
      if (pa !== pb) return pa - pb;

      const ca =
        (a.querySelector(".task-content")?.textContent || "").toLowerCase();
      const cb =
        (b.querySelector(".task-content")?.textContent || "").toLowerCase();
      return ca.localeCompare(cb);
    });
    items.forEach((li) => taskList.appendChild(li));
  }

  // === 저장 ===
  function saveTasks() {
    const tasks = Array.from(taskList.querySelectorAll("li")).map((li) => ({
      text: li.querySelector(".task-content")?.textContent || "",
      category: li.dataset.category || "",
      repetition: li.dataset.repetition || "none",
      priority: li.dataset.priority || "none",
      emoji: li.querySelector(".task-emoji")?.textContent || "",
      dueDate: li.dataset.dueDate || "",
      dueTime: li.dataset.dueTime || "", // 시간 값 추가
      completed: li.classList.contains("completed"),
    }));
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // === 날짜별 우선순위 맵 ===
  function updatePriorityByDate() {
    priorityByDate = new Map();
    const items = taskList.querySelectorAll("li");
    items.forEach((li) => {
      const dateStr = li.dataset.dueDate;
      const pr = li.dataset.priority;
      if (!dateStr || !pr || pr === "none") return;
      if (!priorityByDate.has(dateStr)) priorityByDate.set(dateStr, new Set());
      priorityByDate.get(dateStr).add(pr);
    });
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    if (selectedDateStr) displayTasksForDate(selectedDateStr);
  }

  // === 할 일 DOM 생성 ===
  function createTaskElement({
    text,
    category,
    repetition,
    priority,
    emoji,
    dueDate,
    dueTime,
    completed = false,
  }) {
    const li = document.createElement("li");
    li.dataset.category = category || "";
    li.dataset.repetition = repetition || "none";
    li.dataset.priority = priority || "none";
    li.dataset.dueDate = dueDate || "";
    li.dataset.dueTime = dueTime || "";

    // Apply background color based on priority by adding a class
    if (priority && priority !== "none") {
      li.classList.add(`priority-bg-${priority}`);
    }

    if (completed) li.classList.add("completed");

    // 상단: 이모티콘 + 텍스트
    const topRow = document.createElement("div");
    topRow.classList.add("task-row-main");

    if (emoji) {
      const e = document.createElement("span");
      e.classList.add("task-emoji");
      e.textContent = emoji;
      topRow.appendChild(e);
    }

    const content = document.createElement("span");
    content.classList.add("task-content");
    content.textContent = text;
    topRow.appendChild(content);

    // 하단: 메타 + 버튼
    const details = document.createElement("div");
    details.classList.add("task-details-display");

    const meta = document.createElement("div");
    meta.classList.add("task-meta");

    if (category && category !== "all") {
      const m = document.createElement("span");
      m.classList.add("task-category");
      const map = { work: "업무", personal: "개인", exercise: "운동", rest: "휴식" };
      m.textContent = map[category] || category;
      meta.appendChild(m);
    }

    if (priority && priority !== "none") {
      const m = document.createElement("span");
      m.classList.add("task-priority");
      const map = { high: "상", medium: "중", low: "하" };
      m.textContent = map[priority] || priority;
      meta.appendChild(m);
    }

    if (dueDate || dueTime) {
      const m = document.createElement("span");
      m.classList.add("task-date");
      m.textContent = [dueDate, dueTime].filter(Boolean).join(" ");
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
      handleComplete(li);
    });
    actions.appendChild(completeBtn);

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit-btn");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        handleEdit(li);
    });
    actions.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "Del";
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleDelete(li);
    });
    actions.appendChild(deleteBtn);

    details.appendChild(actions);

    li.appendChild(topRow);
    li.appendChild(details);
    taskList.appendChild(li);
  }

  function handleComplete(li) {
    li.classList.toggle("completed");
    filterTasks();
    saveTasks();
  }

  function handleEdit(li) {
    editingTask = li;
    taskInput.value = li.querySelector(".task-content").textContent;
    categorySelect.value = li.dataset.category || "all";
    repetitionSelect.value = li.dataset.repetition || "none";
    prioritySelect.value = li.dataset.priority || "none";
    emojiSelect.value = li.querySelector(".task-emoji")?.textContent || "";
    dueDateInput.value = li.dataset.dueDate || "";
    
    const dueTime = li.dataset.dueTime || "";
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

  function handleDelete(li) {
    const deletedDate = li.dataset.dueDate;
    li.remove();
    sortTaskList();
    updatePriorityByDate();
    filterTasks();
    saveTasks();
    if (selectedDateStr && deletedDate === selectedDateStr) {
      displayTasksForDate(selectedDateStr);
    }
  }

  // === 할 일 추가 ===
  function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
      alert("할 일을 입력하세요.");
      return;
    }

    const category = categorySelect.value;
    const repetition = repetitionSelect.value;
    const priority = prioritySelect.value;
    const emoji = emojiSelect.value;
    const baseDueDate = dueDateInput.value;    // 날짜 값
    const dueTimeStr = dueTimeInput.value.trim(); // Read from new text input
    const dueAmPm = dueAmPmInput.value;

    let baseDueTime = "";
    if (dueTimeStr) {
        const timeRegex = /^([0-9]|0[0-9]|1[0-2]):([0-5][0-9])$/; // 1-12 hours, 00-59 minutes
        const match = dueTimeStr.match(timeRegex);

        if (!match) {
            alert("시간 형식이 올바르지 않습니다. (예: 10:30)");
            return;
        }

        let hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);

        // Adjust hour based on AM/PM
        if (dueAmPm === "pm" && hour !== 12) {
            hour += 12;
        } else if (dueAmPm === "am" && hour === 12) {
            hour = 0; // 12 AM is 00:00 in 24-hour format
        }
        baseDueTime = `${pad(hour)}:${pad(minute)}`; // Store in 24-hour format for sorting/consistency
    }

    if (editingTask) {
        editingTask.querySelector(".task-content").textContent = text;
        editingTask.dataset.category = category;
        editingTask.dataset.repetition = repetition;
        editingTask.dataset.priority = priority;
        if (emoji) {
            let emojiSpan = editingTask.querySelector(".task-emoji");
            if (!emojiSpan) {
                emojiSpan = document.createElement("span");
                emojiSpan.classList.add("task-emoji");
                editingTask.querySelector(".task-row-main").prepend(emojiSpan);
            }
            emojiSpan.textContent = emoji;
        } else {
            editingTask.querySelector(".task-emoji")?.remove();
        }
        editingTask.dataset.dueDate = baseDueDate;
        editingTask.dataset.dueTime = baseDueTime;

        // Update meta info
        const meta = editingTask.querySelector(".task-meta");
        meta.innerHTML = ""; // Clear existing meta
        if (category && category !== "all") {
          const m = document.createElement("span");
          m.classList.add("task-category");
          const map = { work: "업무", personal: "개인", exercise: "운동", rest: "휴식" };
          m.textContent = map[category] || category;
          meta.appendChild(m);
        }
        if (priority && priority !== "none") {
          const m = document.createElement("span");
          m.classList.add("task-priority");
          const map = { high: "상", medium: "중", low: "하" };
          m.textContent = map[priority] || priority;
          meta.appendChild(m);
        }
        if (baseDueDate || baseDueTime) {
          const m = document.createElement("span");
          m.classList.add("task-date");
          m.textContent = [baseDueDate, baseDueTime].filter(Boolean).join(" ");
          meta.appendChild(m);
        }

        editingTask = null;
        addTaskBtn.textContent = "추가";
    } else {
        // 반복 일정을 사용하는 경우 날짜 선택이 필요
        if (repetition !== "none" && !baseDueDate) {
          alert("반복 일정을 사용하려면 날짜를 선택하세요.");
          return;
        }

        const createWithDate = (dateStr) =>
          createTaskElement({
            text,
            category,
            repetition,
            priority,
            emoji,
            dueDate: dateStr || "",  // 날짜
            dueTime: baseDueTime || "", // 시간
          });

        // 날짜가 선택되었을 때 할 일 추가
        if (!baseDueDate || repetition === "none") {
          createWithDate(baseDueDate || "");
        } else {
          // 반복 일정 생성
          const dateParts = baseDueDate.split('-').map(Number);
          const base = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
          
          const occurrences = 5; // Number of occurrences for repetition

          if (repetition === "weekdays") {
            let daysAdded = 0;
            let currentDay = new Date(base);
            while (daysAdded < occurrences) {
              const dayOfWeek = currentDay.getDay(); // 0 = Sunday, 6 = Saturday
              if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday and not Saturday
                createWithDate(formatDateStr(currentDay));
                daysAdded++;
              }
              currentDay.setDate(currentDay.getDate() + 1);
            }
          } else { // daily, weekly, monthly
            for (let i = 0; i < occurrences; i++) {
              const d = new Date(base);
              if (repetition === "daily") d.setDate(base.getDate() + i);
              else if (repetition === "weekly") d.setDate(base.getDate() + i * 7);
              else if (repetition === "monthly") d.setMonth(base.getMonth() + i);
              createWithDate(formatDateStr(d));
            }
          }
        }
    }

    // 입력창 초기화
    taskInput.value = "";
    categorySelect.value = "all";
    repetitionSelect.value = "none";
    prioritySelect.value = "none";
    emojiSelect.value = "";

    // 추가된 항목 정렬 및 저장
    sortTaskList();
    updatePriorityByDate();
    filterTasks();
    saveTasks();
  }

  addTaskBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });

  // === 필터/검색 ===
  function filterTasks() {
    const items = taskList.querySelectorAll("li");
    const now = new Date();
    const todayStr = formatDateStr(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Get start of the week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfWeekStr = formatDateStr(startOfWeek);

    // Get end of the week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const endOfWeekStr = formatDateStr(endOfWeek);

    items.forEach((li) => {
      const category = li.dataset.category || "all";
      const text =
        (li.querySelector(".task-content")?.textContent || "").toLowerCase();
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
      // Note: We don't save this view to localStorage, it's ephemeral
      filterTasks();
    });
  });

  taskSearchInput.addEventListener("input", () => {
    searchQuery = taskSearchInput.value;
    localStorage.setItem("search", searchQuery);
    filterTasks();
  });

  // === 캘린더 렌더 ===
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

  // === 날짜별 일정 표시 ===
  function displayTasksForDate(dateStr) {
    dailyTaskList.innerHTML = "";

    const dateParts = dateStr.split('-').map(Number);
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    dailyScheduleDisplay.querySelector("h3").textContent = `${month}월 ${day}일 (${dayOfWeek})`;

    const tasksForDate = Array.from(taskList.querySelectorAll("li")).filter(
      (li) => li.dataset.dueDate === dateStr
    );

    if (tasksForDate.length === 0) {
      const noTaskMsg = document.createElement("li");
      noTaskMsg.textContent = "이 날짜에 등록된 일정이 없습니다.";
      noTaskMsg.style.textAlign = "center";
      noTaskMsg.style.opacity = "0.7";
      dailyTaskList.appendChild(noTaskMsg);
      return;
    }

    tasksForDate.forEach((task) => {
      const clone = task.cloneNode(true);

      // 클론된 노드의 이벤트 핸들러 재설정
      clone.querySelector(".complete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        handleComplete(task);
        displayTasksForDate(dateStr); // Refresh daily view
      });

      clone.querySelector(".edit-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        handleEdit(task);
      });

      clone.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        handleDelete(task);
        displayTasksForDate(dateStr); // Refresh daily view
      });

      dailyTaskList.appendChild(clone);
    });
  }

  // === 월 이동 ===
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
  });

  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
  });

  // === 초기화 ===
  function initialize() {
    const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
    savedTasks.forEach(createTaskElement);

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

    sortTaskList();
    updatePriorityByDate();
    filterTasks();
    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());

    // Set default time in new input fields if not already set by a loaded task
    if (!dueTimeInput.value) { // Check if time input is empty
        const now = new Date();
        let currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const ampm = currentHour >= 12 ? "pm" : "am";

        currentHour = currentHour % 12;
        currentHour = currentHour === 0 ? 12 : currentHour; // 0시를 12시로

        dueTimeInput.value = `${pad(currentHour)}:${pad(currentMinute)}`;
        dueAmPmInput.value = ampm;
    }
  }

  initialize();

  // === 시간 입력 자동 포맷 ===
  dueTimeInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, ''); // 숫자만 남김
    if (value.length > 4) {
      value = value.slice(0, 4);
    }
    if (value.length > 2) {
      value = value.slice(0, 2) + ':' + value.slice(2);
    }
    e.target.value = value;
  });
});
