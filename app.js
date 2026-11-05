/* =========================================================
   test · 测试项目 — 交互
   - 深浅色主题切换（记住选择）
   - 待办清单：增删改查 + 筛选 + localStorage 持久化
   无框架、无依赖，直接跑在浏览器里。
   ========================================================= */

(function () {
  'use strict';

  var TODO_KEY = 'test-todos-v1';
  var THEME_KEY = 'test-theme';

  var els = {
    form: document.getElementById('todoForm'),
    input: document.getElementById('todoInput'),
    list: document.getElementById('todoList'),
    empty: document.getElementById('emptyState'),
    clear: document.getElementById('clearDone'),
    filters: Array.prototype.slice.call(document.querySelectorAll('.filter[data-filter]')),
    progressBar: document.getElementById('progressBar'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.querySelector('.theme-icon'),
    year: document.getElementById('year')
  };

  /* ---------- 存储（隐私模式下会抛错，静默降级） ---------- */

  var store = {
    read: function (key) {
      try {
        return window.localStorage.getItem(key);
      } catch (err) {
        return null;
      }
    },
    write: function (key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        /* ignore */
      }
    }
  };

  /* ---------- 主题 ---------- */

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    els.themeIcon.textContent = isDark ? '☀️' : '🌙';
    els.themeToggle.setAttribute('aria-label', isDark ? '切换到浅色主题' : '切换到深色主题');
  }

  els.themeToggle.addEventListener('click', function () {
    var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.write(THEME_KEY, next);
  });

  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  /* ---------- 数据 ---------- */

  function makeId() {
    return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function seedTodos() {
    return [
      { id: makeId(), text: '看一眼 README', done: true },
      { id: makeId(), text: '把页面交互跑一遍', done: false },
      { id: makeId(), text: '提个 PR 收工', done: false }
    ];
  }

  function normalize(list) {
    return list
      .filter(function (item) {
        return item && typeof item.text === 'string' && item.text.trim() !== '';
      })
      .map(function (item) {
        return {
          id: String(item.id || makeId()),
          text: String(item.text).slice(0, 120),
          done: Boolean(item.done)
        };
      });
  }

  function loadTodos() {
    var raw = store.read(TODO_KEY);
    if (raw === null) return seedTodos();

    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? normalize(parsed) : seedTodos();
    } catch (err) {
      return seedTodos();
    }
  }

  var todos = loadTodos();
  var currentFilter = 'all';

  function save() {
    store.write(TODO_KEY, JSON.stringify(todos));
  }

  /* ---------- 渲染 ---------- */

  function visibleTodos() {
    if (currentFilter === 'active') {
      return todos.filter(function (t) {
        return !t.done;
      });
    }
    if (currentFilter === 'done') {
      return todos.filter(function (t) {
        return t.done;
      });
    }
    return todos;
  }

  function createItem(todo) {
    var li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' is-done' : '');

    var box = document.createElement('input');
    box.type = 'checkbox';
    box.id = 'todo-' + todo.id;
    box.checked = todo.done;
    box.setAttribute('aria-label', '完成「' + todo.text + '」');
    box.addEventListener('change', function () {
      toggleTodo(todo.id, box.checked);
    });

    var text = document.createElement('label');
    text.className = 'todo-text';
    text.htmlFor = box.id;
    text.textContent = todo.text;

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'todo-delete';
    del.textContent = '✕';
    del.setAttribute('aria-label', '删除「' + todo.text + '」');
    del.addEventListener('click', function () {
      removeTodo(todo.id);
    });

    li.appendChild(box);
    li.appendChild(text);
    li.appendChild(del);
    return li;
  }

  function updateProgress() {
    var total = todos.length;
    var done = todos.filter(function (t) {
      return t.done;
    }).length;
    var percent = total === 0 ? 0 : Math.round((done / total) * 100);

    els.progressFill.style.width = percent + '%';
    els.progressBar.setAttribute('aria-valuenow', String(percent));
    els.progressText.textContent = done + ' / ' + total;
    els.clear.disabled = done === 0;
  }

  function render() {
    var items = visibleTodos();

    els.list.textContent = '';
    items.forEach(function (todo) {
      els.list.appendChild(createItem(todo));
    });

    if (items.length === 0) {
      if (todos.length === 0) {
        els.empty.textContent = '这里空空的，先添加一条吧。';
      } else if (currentFilter === 'done') {
        els.empty.textContent = '还没有已完成的事项。';
      } else {
        els.empty.textContent = '全部搞定，休息一下 🎉';
      }
    }
    els.empty.hidden = items.length > 0;

    updateProgress();
  }

  /* ---------- 操作 ---------- */

  function syncFilterButtons() {
    els.filters.forEach(function (btn) {
      var active = btn.dataset.filter === currentFilter;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function setFilter(name) {
    currentFilter = name;
    syncFilterButtons();
    render();
  }

  function addTodo(raw) {
    var text = raw.trim();
    if (!text) return;

    todos.unshift({ id: makeId(), text: text.slice(0, 120), done: false });

    // 在「已完成」下新增会看不到，自动切回「全部」
    if (currentFilter === 'done') {
      currentFilter = 'all';
      syncFilterButtons();
    }

    save();
    render();
  }

  function toggleTodo(id, done) {
    todos.forEach(function (todo) {
      if (todo.id === id) todo.done = done;
    });
    save();
    render();
  }

  function removeTodo(id) {
    todos = todos.filter(function (todo) {
      return todo.id !== id;
    });
    save();
    render();
  }

  /* ---------- 事件绑定 ---------- */

  els.form.addEventListener('submit', function (event) {
    event.preventDefault();
    addTodo(els.input.value);
    els.input.value = '';
    els.input.focus();
  });

  els.filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setFilter(btn.dataset.filter);
    });
  });

  els.clear.addEventListener('click', function () {
    todos = todos.filter(function (todo) {
      return !todo.done;
    });
    save();
    render();
  });

  /* ---------- 启动 ---------- */

  els.year.textContent = String(new Date().getFullYear());
  els.filters.forEach(function (btn) {
    btn.setAttribute('aria-pressed', btn.dataset.filter === 'all' ? 'true' : 'false');
  });
  render();
})();
