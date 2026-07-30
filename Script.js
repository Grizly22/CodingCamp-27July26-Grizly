/* ============================================================
   LIFE DASHBOARD — Script.js
   ============================================================ */

'use strict';

/* ============================================================
   SECTION 1 — GREETING & CLOCK
   ============================================================ */
(function initGreeting() {
  const clockEl    = document.getElementById('clock');
  const dateEl     = document.getElementById('date');
  const greetText  = document.getElementById('greeting-text');
  const greetName  = document.getElementById('greeting-name');

  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  function getGreeting(hour) {
    if (hour >= 5  && hour < 12) return '🌤 Good morning!';
    if (hour >= 12 && hour < 17) return '☀️ Good afternoon!';
    if (hour >= 17 && hour < 21) return '🌆 Good evening!';
    return '🌙 Good night!';
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = new Date();
    const h    = now.getHours();
    const m    = now.getMinutes();
    const s    = now.getSeconds();

    clockEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;

    const dayName   = DAYS[now.getDay()];
    const dayNum    = now.getDate();
    const monthName = MONTHS[now.getMonth()];
    const year      = now.getFullYear();
    dateEl.textContent = `${dayName}, ${dayNum} ${monthName} ${year}`;

    greetText.textContent = getGreeting(h);
    greetName.textContent = 'Welcome back 👋';
  }

  tick();
  setInterval(tick, 1000);
})();


/* ============================================================
   SECTION 2 — FOCUS TIMER
   ============================================================ */
(function initTimer() {
  const WORK_SECONDS = 25 * 60;

  const displayEl = document.getElementById('timer-display');
  const labelEl   = document.getElementById('timer-label');
  const startBtn  = document.getElementById('timer-start');
  const stopBtn   = document.getElementById('timer-stop');
  const resetBtn  = document.getElementById('timer-reset');
  const card      = document.querySelector('.card--timer');

  let remaining  = WORK_SECONDS;
  let intervalId = null;
  let isRunning  = false;

  function pad(n) { return String(n).padStart(2, '0'); }

  function render() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    displayEl.textContent = `${pad(m)}:${pad(s)}`;
  }

  function setLabel(text) { labelEl.textContent = text; }

  function setRunningState(running) {
    isRunning = running;
    card.classList.toggle('is-running', running);
    startBtn.disabled = running;
    stopBtn.disabled  = !running;
  }

  function start() {
    if (isRunning || remaining === 0) return;
    setRunningState(true);
    setLabel('Stay focused…');
    card.classList.remove('is-done');

    intervalId = setInterval(() => {
      remaining--;
      render();

      if (remaining <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        setRunningState(false);
        card.classList.add('is-done');
        setLabel('Session complete! 🎉');
        notify();
      }
    }, 1000);
  }

  function stop() {
    if (!isRunning) return;
    clearInterval(intervalId);
    intervalId = null;
    setRunningState(false);
    setLabel('Paused');
  }

  function reset() {
    clearInterval(intervalId);
    intervalId = null;
    remaining  = WORK_SECONDS;
    setRunningState(false);
    card.classList.remove('is-done');
    render();
    setLabel('Ready to focus');
  }

  function notify() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Focus session complete!', {
        body: 'Great work — take a short break.',
        icon: 'https://cdn.jsdelivr.net/npm/twemoji@14/assets/72x72/23f2.png'
      });
    }
  }

  // Request notification permission on first start
  startBtn.addEventListener('click', () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    start();
  });

  stopBtn.addEventListener('click', stop);
  resetBtn.addEventListener('click', reset);

  // Initial state
  stopBtn.disabled = true;
  render();
})();


/* ============================================================
   SECTION 3 — TO-DO LIST
   ============================================================ */
(function initTodo() {
  const STORAGE_KEY = 'lifedash_todos';

  const form      = document.getElementById('todo-form');
  const input     = document.getElementById('todo-input');
  const listEl    = document.getElementById('todo-list');
  const countEl   = document.getElementById('todo-count');
  const clearBtn  = document.getElementById('clear-done');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Modal elements
  const overlay     = document.getElementById('modal-overlay');
  const modalInput  = document.getElementById('modal-input');
  const modalSave   = document.getElementById('modal-save');
  const modalCancel = document.getElementById('modal-cancel');

  let todos        = load();
  let activeFilter = 'all';
  let editingId    = null;

  /* ---------- Storage helpers ---------- */
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  /* ---------- Unique ID ---------- */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  /* ---------- Render ---------- */
  function getFiltered() {
    if (activeFilter === 'active') return todos.filter(t => !t.done);
    if (activeFilter === 'done')   return todos.filter(t => t.done);
    return todos;
  }

  function render() {
    const filtered = getFiltered();
    listEl.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'todo-empty';
      empty.textContent = activeFilter === 'done'
        ? 'No completed tasks yet.'
        : 'Nothing here — add a task above!';
      listEl.appendChild(empty);
    } else {
      filtered.forEach(todo => listEl.appendChild(createItem(todo)));
    }

    // Count active tasks
    const activeCount = todos.filter(t => !t.done).length;
    countEl.textContent = `${activeCount} task${activeCount !== 1 ? 's' : ''} left`;
  }

  function createItem(todo) {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' is-done' : ''}`;
    li.dataset.id = todo.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type      = 'checkbox';
    cb.className = 'todo-checkbox';
    cb.checked   = todo.done;
    cb.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.done ? 'not done' : 'done'}`);
    cb.addEventListener('change', () => toggleDone(todo.id));

    // Text
    const span = document.createElement('span');
    span.className   = 'todo-text';
    span.textContent = todo.text;

    // Actions
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--ghost btn--icon';
    editBtn.title     = 'Edit task';
    editBtn.setAttribute('aria-label', `Edit "${todo.text}"`);
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', () => openModal(todo.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--danger btn--icon';
    delBtn.title     = 'Delete task';
    delBtn.setAttribute('aria-label', `Delete "${todo.text}"`);
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', () => deleteTask(todo.id));

    actions.append(editBtn, delBtn);
    li.append(cb, span, actions);
    return li;
  }

  /* ---------- Actions ---------- */
  function addTask(text) {
    text = text.trim();
    if (!text) return;
    todos.unshift({ id: uid(), text, done: false, createdAt: Date.now() });
    save();
    render();
  }

  function toggleDone(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    todo.done = !todo.done;
    save();
    render();
  }

  function deleteTask(id) {
    todos = todos.filter(t => t.id !== id);
    save();
    render();
  }

  function clearDone() {
    todos = todos.filter(t => !t.done);
    save();
    render();
  }

  /* ---------- Modal (edit) ---------- */
  function openModal(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    editingId = id;
    modalInput.value = todo.text;
    overlay.hidden = false;
    modalInput.focus();
    modalInput.select();
  }

  function closeModal() {
    overlay.hidden = true;
    editingId = null;
    modalInput.value = '';
  }

  function saveModal() {
    const newText = modalInput.value.trim();
    if (!newText || editingId === null) { closeModal(); return; }
    const todo = todos.find(t => t.id === editingId);
    if (todo) { todo.text = newText; save(); render(); }
    closeModal();
  }

  modalSave.addEventListener('click', saveModal);
  modalCancel.addEventListener('click', closeModal);

  // Close on overlay click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  // Save on Enter inside modal
  modalInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveModal();
  });

  /* ---------- Form submit ---------- */
  form.addEventListener('submit', e => {
    e.preventDefault();
    addTask(input.value);
    input.value = '';
    input.focus();
  });

  clearBtn.addEventListener('click', clearDone);

  /* ---------- Filter buttons ---------- */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  /* ---------- Initial render ---------- */
  render();
})();


/* ============================================================
   SECTION 4 — QUICK LINKS
   ============================================================ */
(function initLinks() {
  const STORAGE_KEY = 'lifedash_links';

  const form      = document.getElementById('link-form');
  const nameInput = document.getElementById('link-name');
  const urlInput  = document.getElementById('link-url');
  const gridEl    = document.getElementById('links-grid');

  /* ---------- Storage ---------- */
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaults();
    } catch { return getDefaults(); }
  }

  function save(links) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }

  function getDefaults() {
    return [
      { id: 'dl1', label: 'Google',   url: 'https://google.com' },
      { id: 'dl2', label: 'GitHub',   url: 'https://github.com' },
      { id: 'dl3', label: 'YouTube',  url: 'https://youtube.com' },
      { id: 'dl4', label: 'ChatGPT',  url: 'https://chat.openai.com' },
    ];
  }

  /* ---------- Unique ID ---------- */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  /* ---------- Favicon ---------- */
  function faviconUrl(url) {
    try {
      const origin = new URL(url).origin;
      return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
    } catch { return ''; }
  }

  /* ---------- Render ---------- */
  function render(links) {
    gridEl.innerHTML = '';

    if (links.length === 0) {
      const empty = document.createElement('p');
      empty.className   = 'links-empty';
      empty.textContent = 'No links yet — add one above!';
      gridEl.appendChild(empty);
      return;
    }

    links.forEach(link => {
      const chip = document.createElement('a');
      chip.className = 'link-chip';
      chip.href      = link.url;
      chip.target    = '_blank';
      chip.rel       = 'noopener noreferrer';
      chip.title     = link.url;

      // Favicon
      const favicon = document.createElement('img');
      favicon.className = 'link-chip__favicon';
      favicon.src       = faviconUrl(link.url);
      favicon.alt       = '';
      favicon.onerror   = () => { favicon.style.display = 'none'; };

      // Label
      const labelSpan = document.createElement('span');
      labelSpan.textContent = link.label;

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className   = 'link-chip__delete';
      delBtn.title       = 'Remove link';
      delBtn.setAttribute('aria-label', `Remove ${link.label}`);
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        deleteLink(link.id);
      });

      chip.append(favicon, labelSpan, delBtn);
      gridEl.appendChild(chip);
    });
  }

  /* ---------- Actions ---------- */
  function addLink(label, url) {
    label = label.trim();
    url   = url.trim();
    if (!label || !url) return false;

    // Ensure URL has a protocol
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const links = load();
    links.push({ id: uid(), label, url });
    save(links);
    render(links);
    return true;
  }

  function deleteLink(id) {
    const links = load().filter(l => l.id !== id);
    save(links);
    render(links);
  }

  /* ---------- Form submit ---------- */
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ok = addLink(nameInput.value, urlInput.value);
    if (ok) {
      nameInput.value = '';
      urlInput.value  = '';
      nameInput.focus();
    } else {
      // Highlight empty fields
      if (!nameInput.value.trim()) nameInput.focus();
      else urlInput.focus();
    }
  });

  /* ---------- Initial render ---------- */
  render(load());
})();
