/* ============================================================
   OZEMOYA — WIN97 WINDOW MANAGER + AI ASSISTANT
   ============================================================ */

(function () {
  'use strict';

  /* ── Z-index tracker ── */
  let topZ = 20;

  /* ── Window metadata ── */
  const WIN_META = {
    'projects-window': { label: 'Projects',      sym: 'ico-folder'  },
    'services-window': { label: 'Services',       sym: 'ico-gear'    },
    'contacts-window': { label: 'Contacts',       sym: 'ico-book'    },
    'music-window':    { label: 'Music Player',   sym: 'ico-cd'      },
    'ai-window':       { label: 'OzeBot',         sym: 'ico-robot'   },
    'mypc-window':     { label: 'My Computer',    sym: 'ico-monitor' },
    'resume-window':   { label: 'Resume.txt',     sym: 'ico-doc'     },
    'recycle-window':  { label: 'Recycle Bin',    sym: 'ico-trash'   },
    'welcome-dialog':  { label: 'Welcome',        sym: 'ico-info'    },
  };

  /* ================================================================
     WINDOW OPEN / CLOSE / MINIMIZE
  ================================================================ */

  window.openWindow = function(id) { return openWindow(id); };

  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;

    win.style.display = 'block';
    bringToFront(win);
    centerIfNeeded(win);
    makeDraggable(win);
    syncTaskbarBtn(id, false);
    setActiveWindow(win);
  }

  function closeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = 'none';
    removeTaskbarBtn(id);
  }

  function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = 'none';
    syncTaskbarBtn(id, true);
  }

  function bringToFront(win) {
    topZ++;
    win.style.zIndex = topZ;
  }

  function setActiveWindow(activeWin) {
    document.querySelectorAll('.win97-window').forEach(w => {
      w.classList.toggle('inactive', w !== activeWin);
    });
  }

  /* Center window on first open if no position set yet */
  function centerIfNeeded(win) {
    if (win.dataset.positioned) return;
    win.dataset.positioned = '1';
    const vw = window.innerWidth;
    const vh = window.innerHeight - 30; // leave taskbar room
    const ww = win.offsetWidth  || 320;
    const wh = win.offsetHeight || 200;
    win.style.left = Math.max(20, (vw - ww) / 2 - Math.random() * 60) + 'px';
    win.style.top  = Math.max(20, (vh - wh) / 2 - Math.random() * 40) + 'px';
  }

  /* ================================================================
     DRAGGABLE WINDOWS
  ================================================================ */

  function makeDraggable(win) {
    const titleBar = win.querySelector('.title-bar');
    if (!titleBar || titleBar._draggable) return;
    titleBar._draggable = true;

    let dragging = false, ox = 0, oy = 0;

    titleBar.addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      ox = e.clientX - win.offsetLeft;
      oy = e.clientY - win.offsetTop;
      bringToFront(win);
      setActiveWindow(win);
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      win.style.left = (e.clientX - ox) + 'px';
      win.style.top  = (e.clientY - oy) + 'px';
    });

    document.addEventListener('mouseup', () => { dragging = false; });
  }

  /* Also init dragging on mousedown on window body to raise z */
  document.querySelectorAll('.win97-window').forEach(win => {
    win.addEventListener('mousedown', () => {
      bringToFront(win);
      setActiveWindow(win);
    });
  });

  /* ================================================================
     TASKBAR BUTTONS
  ================================================================ */

  function syncTaskbarBtn(id, minimized) {
    if (id === 'welcome-dialog') return; // no taskbar button for dialogs
    let btn = document.getElementById('tb-' + id);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'tb-' + id;
      btn.className = 'tb-btn';
      const meta = WIN_META[id] || { label: id, sym: '' };
      const svgHtml = meta.sym
        ? `<svg viewBox="0 0 32 32" width="14" height="14" style="image-rendering:pixelated;shape-rendering:crispEdges;flex-shrink:0"><use href="#${meta.sym}"/></svg>`
        : '';
      btn.innerHTML = `${svgHtml}<span>${meta.label}</span>`;
      btn.addEventListener('click', () => {
        const win = document.getElementById(id);
        if (!win) return;
        if (win.style.display === 'none') {
          win.style.display = 'block';
          bringToFront(win);
          setActiveWindow(win);
          btn.classList.remove('minimized');
        } else {
          win.style.display = 'none';
          btn.classList.add('minimized');
        }
      });
      document.getElementById('taskbar-apps').appendChild(btn);
    }
    btn.classList.toggle('minimized', minimized);
  }

  function removeTaskbarBtn(id) {
    const btn = document.getElementById('tb-' + id);
    if (btn) btn.remove();
  }

  /* ================================================================
     TITLE BAR BUTTON ROUTING
  ================================================================ */

  document.addEventListener('click', e => {
    const btn = e.target.closest('.win-btn');
    if (!btn) return;
    const action = btn.dataset.action;
    const target = btn.dataset.target;
    if (!action || !target) return;
    if (action === 'close')    closeWindow(target);
    if (action === 'minimize') minimizeWindow(target);
    if (action === 'maximize') toggleMaximize(target);
  });

  /* Simple maximize toggle */
  const maxState = {};
  function toggleMaximize(id) {
    const win = document.getElementById(id);
    if (!win) return;
    if (maxState[id]) {
      Object.assign(win.style, maxState[id]);
      delete maxState[id];
    } else {
      maxState[id] = { top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height };
      Object.assign(win.style, { top: '0', left: '0', width: '100vw', height: 'calc(100vh - 30px)' });
    }
  }

  /* ================================================================
     DESKTOP ICON — DOUBLE-CLICK TO OPEN
  ================================================================ */

  document.querySelectorAll('.dapp').forEach(icon => {
    let clicks = 0, timer = null;
    icon.addEventListener('click', e => {
      clicks++;
      if (clicks === 1) {
        // single click: select
        document.querySelectorAll('.dapp').forEach(d => d.classList.remove('selected'));
        icon.classList.add('selected');
        timer = setTimeout(() => { clicks = 0; }, 500);
      } else if (clicks >= 2) {
        clearTimeout(timer);
        clicks = 0;
        const id = icon.dataset.window;
        if (id) openWindow(id);
      }
    });
  });

  /* Deselect icon on desktop click */
  document.getElementById('desktop').addEventListener('click', e => {
    if (!e.target.closest('.dapp') && !e.target.closest('.win97-window') && !e.target.closest('.taskbar')) {
      document.querySelectorAll('.dapp').forEach(d => d.classList.remove('selected'));
    }
  });

  /* ================================================================
     START MENU
  ================================================================ */

  const startBtn  = document.getElementById('start-btn');
  const startMenu = document.getElementById('start-menu');

  startBtn.addEventListener('click', e => {
    startMenu.classList.toggle('open');
    startBtn.classList.toggle('pressed');
    e.stopPropagation();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
      startMenu.classList.remove('open');
      startBtn.classList.remove('pressed');
    }
  });

  document.querySelectorAll('.start-menu-item[data-open]').forEach(item => {
    item.addEventListener('click', () => {
      openWindow(item.dataset.open);
      startMenu.classList.remove('open');
      startBtn.classList.remove('pressed');
    });
  });

  document.getElementById('shutdown-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to shut down ozemoya?')) {
      document.body.innerHTML = '<div style="background:#000;color:#fff;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;font-size:18px;font-family:sans-serif;">It is now safe to close your browser.</div>';
    }
  });

  /* ================================================================
     CLOCK
  ================================================================ */

  function updateClock() {
    const now = new Date();
    document.getElementById('Time').textContent =
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  updateClock();
  setInterval(updateClock, 1000);

  /* ================================================================
     NEWS TICKER
  ================================================================ */

  (async function initTicker() {
    const el = document.getElementById('headline');
    try {
      const res  = await fetch('https://newsapi.org/v2/top-headlines?country=us&apiKey=3702918983a4465894f86153fcaabf02');
      const data = await res.json();
      if (data.articles && data.articles.length) {
        el.textContent = data.articles.map(a => a.title).join('   ///   ');
        return;
      }
    } catch (_) {}
    el.textContent = '✦ Welcome to ozemoya — Portfolio of Myles Miller ✦ Designer & Developer based in Atlanta, GA ✦ Projects: Faber Bay • Kumomi ✦ Available for work — myleskmiller@gmail.com ✦ Double-click any icon to explore ✦';
  })();

  /* ================================================================
     LOADING SCREEN
  ================================================================ */

  window.addEventListener('load', () => {
    setTimeout(() => {
      const ls = document.getElementById('loading-screen');
      ls.style.transition = 'opacity 0.6s';
      ls.style.opacity    = '0';
      setTimeout(() => {
        ls.style.display = 'none';
        // Show welcome dialog after boot
        openWindow('welcome-dialog');
      }, 700);
    }, 3200);
  });

  /* ================================================================
     AI ASSISTANT — OZEBOT
  ================================================================ */

  const KB = {
    greet:    ['hi','hello','hey','sup','yo','howdy','hiya','good morning','good afternoon','greetings'],
    who:      ['who are you','what are you','introduce','your name','ozebot'],
    myles:    ['who is myles','about myles','tell me about','myles miller','portfolio owner'],
    projects: ['project','faber','kumomi','portfolio','built','made','work','app','site','website'],
    contact:  ['contact','email','phone','reach','hire','linkedin','available','work together','get in touch'],
    skills:   ['skill','tech','stack','code','language','framework','design','tools','dev','html','css','js'],
    music:    ['music','song','listen','spotify','playlist','band','favorite'],
    joke:     ['joke','funny','laugh','humor','haha','lol','comedy'],
    help:     ['help','what can you do','commands','topics','options'],
    bye:      ['bye','goodbye','cya','later','peace','see you','farewell'],
  };

  const REPLIES = {
    greet: [
      'Hey there! I\'m OzeBot, your guide to all things Myles Miller. What\'d you like to know? 😸',
      'Hello! Welcome to ozemoya. Ask me about projects, skills, or how to reach Myles!',
      'Hi! Great to meet you. I can tell you about Myles\'s work — just ask!',
    ],
    who: [
      'I\'m OzeBot, a digital assistant living inside this Windows 97 desktop. I know everything about Myles!',
      'OzeBot here! Think of me as Clippy\'s cooler cousin. I\'m here to help visitors learn about Myles.',
      'I\'m an AI assistant built into ozemoya.github.io. Ask me anything about this portfolio!',
    ],
    myles: [
      'Myles Miller is a designer and developer who builds creative things for the web. This entire Windows 97 desktop is his portfolio!',
      'Myles is a creative dev — he does front-end development, UI/UX, and graphic design. Check out his Projects folder!',
      'He\'s the mastermind behind ozemoya. Developer. Designer. Cat GIF enthusiast.',
    ],
    projects: [
      'Double-click the Projects folder to see all his work! Highlights include Faber Bay (faber-bay.vercel.app) and Kumomi (kumomi.vercel.app).',
      'He\'s built web apps like Faber Bay and Kumomi. Open the Projects icon on the desktop to see them!',
      'Check the Projects folder! Faber Bay and Kumomi are two of his recent builds.',
    ],
    contact: [
      'Reach Myles at myleskmiller@gmail.com, or call 678-559-2304. Open the Contacts window for all details!',
      'Email: myleskmiller@gmail.com | LinkedIn: linkedin.com/in/myles-miller-669516263 | He\'d love to collaborate!',
      'Double-click Contacts on the desktop for full info. Or just email myleskmiller@gmail.com!',
    ],
    skills: [
      'Myles works with HTML, CSS, JavaScript, and has strong design skills too. He\'s the full package — code + aesthetics.',
      'His toolkit includes front-end dev (HTML/CSS/JS), UI/UX design, and graphic design. Check Services for more!',
      'Design + Development. He makes things look great AND work perfectly.',
    ],
    music: [
      'Great taste! Double-click the Music icon for Myles\'s playlist. City Pop vibes incoming 🎵',
      'Open the Music Player from the desktop — he\'s got a solid Spotify selection curated in there!',
      'Music is life! Hit the Music icon on the desktop.',
    ],
    joke: [
      'Why do programmers prefer dark mode? Because light attracts bugs! 🐛',
      'I tried to think of a Windows 97 joke... but I got a fatal error.',
      'How many designers does it take to change a light bulb? "Does it have to be a light bulb?"',
      'Why did the developer go broke? Because he used up all his cache.',
    ],
    help: [
      'I can tell you about: Myles\'s projects, his skills, how to contact him, music recommendations, or just have a chat! Try asking "who is Myles?" or "show me projects".',
      'Topics I know: projects, skills, contact info, music, and jokes! Ask anything.',
    ],
    bye: [
      'Goodbye! Come back anytime 👋',
      'See you later! Don\'t forget to check out the Projects folder.',
      'Cya! It was nice chatting. Shoot Myles an email if you\'re interested in working together!',
    ],
    default: [
      'Hmm, not sure about that one! Try asking about Myles\'s projects, skills, or contact info.',
      'I don\'t quite follow — but I\'m great at answering questions about this portfolio! Give it a shot.',
      'That\'s a tricky one. Ask me about projects, skills, or how to hire Myles!',
    ],
  };

  function getReply(input) {
    const txt = input.toLowerCase();
    for (const [cat, keywords] of Object.entries(KB)) {
      if (keywords.some(kw => txt.includes(kw))) {
        const set = REPLIES[cat];
        return set[Math.floor(Math.random() * set.length)];
      }
    }
    return REPLIES.default[Math.floor(Math.random() * REPLIES.default.length)];
  }

  function appendMsg(text, isUser) {
    const log = document.getElementById('chat-log');
    const row = document.createElement('div');
    row.className = 'ai-message ' + (isUser ? 'user-message' : 'bot-message');
    if (isUser) {
      row.innerHTML = `<span>${escHtml(text)}</span>`;
    } else {
      row.innerHTML = `<img src="images/caticont.png" class="bot-avatar" alt="" /><span>${escHtml(text)}</span>`;
    }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function handleSend() {
    const input = document.getElementById('ai-input');
    const text  = input.value.trim();
    if (!text) return;
    appendMsg(text, true);
    input.value = '';

    // typing indicator
    const log     = document.getElementById('chat-log');
    const typing  = document.createElement('div');
    typing.className = 'ai-message bot-message ai-typing';
    typing.innerHTML = '<img src="images/caticont.png" class="bot-avatar" alt="" /><span>typing...</span>';
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    setTimeout(() => {
      typing.remove();
      appendMsg(getReply(text), false);
    }, 600 + Math.random() * 400);
  }

  document.getElementById('ai-send').addEventListener('click', handleSend);
  document.getElementById('ai-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSend();
  });

})();
