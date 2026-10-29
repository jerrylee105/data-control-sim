/* =========================================================
   Giả lập Data controls – ChatGPT (bản học tập)
   ========================================================= */
(() => {
  'use strict';

  // ---------- Dữ liệu mẫu ----------
  const SEED_CHATS = [
    { id: 'c1', title: 'Giải bài toán phân số lớp 7', personal: false,
      msgs: [['u', 'Giúp em tính 3/4 + 5/6 với ạ.'], ['a', 'Quy đồng mẫu số chung là 12: 3/4 = 9/12, 5/6 = 10/12. Vậy 9/12 + 10/12 = 19/12 (hay 1 7/12).']] },
    { id: 'c2', title: 'Đăng ký CLB bóng đá (SĐT, địa chỉ nhà)', personal: true,
      msgs: [['u', 'Viết giúp em đơn đăng ký CLB bóng đá. Em tên Nguyễn Minh An, lớp 7A2, SĐT 0912 345 678, nhà ở số 12 ngõ 34 phố Hoa Sữa.'], ['a', 'Dưới đây là mẫu đơn đăng ký… <br><br><i>Lưu ý: Em nên hạn chế nhập số điện thoại và địa chỉ nhà thật vào chatbot.</i>']] },
    { id: 'c3', title: 'Dàn ý văn tả cảnh quê hương', personal: false,
      msgs: [['u', 'Lập dàn ý bài văn tả cảnh quê hương vào buổi sáng.'], ['a', 'Mở bài: giới thiệu quê hương. Thân bài: tả bầu trời, cánh đồng, con người lúc bình minh. Kết bài: tình cảm của em.']] },
    { id: 'c4', title: 'Ý tưởng poster bảo vệ môi trường', personal: false,
      msgs: [['u', 'Gợi ý khẩu hiệu cho poster bảo vệ môi trường.'], ['a', '“Hành tinh xanh – Bắt đầu từ bàn tay em”, “Bớt một túi nilon, thêm một mầm xanh”.']] },
    { id: 'c5', title: 'Từ vựng tiếng Anh chủ đề Food', personal: false,
      msgs: [['u', 'Cho em 5 từ vựng tiếng Anh về đồ ăn.'], ['a', 'noodles (mì), rice (cơm), vegetable (rau), chicken (thịt gà), fruit (hoa quả).']] },
  ];
  const SEED_LINKS = [
    { id: 'l1', name: 'Đăng ký CLB bóng đá (SĐT, địa chỉ nhà)', type: 'Chat', date: 'October 12, 2026', personal: true },
    { id: 'l2', name: 'Poster bảo vệ môi trường', type: 'Image', date: 'September 22, 2026', personal: false },
    { id: 'l3', name: 'Dàn ý văn tả cảnh quê hương', type: 'Chat', date: 'October 2, 2026', personal: false },
  ];

  const TASKS = [
    { id: 't1', text: 'Tắt “Improve the model for everyone”.',
      hint: 'Bấm vào avatar ở góc dưới bên trái → Settings → Data controls. Tìm công tắc màu xanh.' },
    { id: 't2', text: 'Xoá link chia sẻ chứa thông tin cá nhân.',
      hint: 'Trong Data controls, dòng “Shared links” có nút Manage. Tìm link có số điện thoại, địa chỉ rồi bấm biểu tượng thùng rác.' },
    { id: 't3', text: 'Quản lý lịch sử chat:', subs: ['Lưu trữ (Archive) ít nhất 1 đoạn chat', 'Xoá đoạn chat có thông tin cá nhân'],
      hint: 'Rê chuột vào một đoạn chat ở thanh bên trái, bấm dấu ⋯ để thấy Archive và Delete. Đoạn chat đã lưu trữ nằm ở Data controls → Archived chats.' },
    { id: 't4', text: 'Tắt “Location”.',
      hint: 'Trong Data controls, dòng “Location” có nút Turn off.' },
  ];

  const OUTRO_TEXT = {
    t1: 'Tắt <b>Improve the model for everyone</b>: đoạn chat của em không còn được dùng để huấn luyện AI.',
    t2: 'Xoá <b>link chia sẻ</b> có số điện thoại và địa chỉ nhà: người lạ không xem được nữa.',
    t3: '<b>Lưu trữ</b> đoạn chat cần giữ và <b>xoá</b> đoạn chat chứa thông tin cá nhân.',
    t4: 'Tắt <b>Location</b>: ChatGPT không dùng vị trí của em nữa.',
  };

  // ---------- State ----------
  let S;
  function resetState() {
    S = {
      chats: SEED_CHATS.map(c => ({ ...c, status: 'active', archivedAt: null })),
      links: SEED_LINKS.map(l => ({ ...l })),
      improve: true,
      location: true,
      archivedAny: false,
      currentChat: null,
      tab: 'data',
      done: {},
      openHints: {},
      startTime: 0,
      finished: false,
    };
  }

  // ---------- Helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ICON = {
    trash: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    restore: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/></svg>',
    archive: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v13M7 8l5-5 5 5M5 14v6h14v-6"/></svg>',
    pen: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  };
  const svg = p => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const TABS = [
    ['profile', 'Profile', svg('<circle cx="12" cy="9" r="3.5"/><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"/>')],
    ['security', 'Security and login', svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>')],
    ['account', 'Account', svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5c1.5-2 3.4-3 5.5-3s4 1 5.5 3"/>')],
    ['archivedtab', 'Archived chats', svg('<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/>')],
    ['voice', 'Voice', svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>')],
    ['storage', 'Storage', svg('<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>')],
    ['personalization', 'Personalization', svg('<circle cx="12" cy="12" r="9"/><path d="M8 13c1 1.5 2.4 2 4 2s3-.5 4-2"/>')],
    ['keyboard', 'Keyboard', svg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 14h8"/>')],
    ['usage', 'Usage', svg('<path d="M4 18a8 8 0 1116 0"/><path d="M12 18l4-6"/>')],
    ['data', 'Data controls', svg('<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/>')],
  ];

  function toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.innerHTML = msg;
    $('#toast-zone').appendChild(t);
    setTimeout(() => t.remove(), 2800);
  }

  let confirmCb = null;
  function confirmBox(title, text, okLabel, cb) {
    $('#confirm-title').textContent = title;
    $('#confirm-text').innerHTML = text;
    $('#confirm-ok').textContent = okLabel;
    confirmCb = cb;
    $('#confirm-overlay').hidden = false;
    $('#confirm-ok').focus();
  }
  function closeConfirm() { $('#confirm-overlay').hidden = true; confirmCb = null; }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  }

  // ---------- Sidebar & chat ----------
  function renderSidebar() {
    const list = $('#chat-list');
    const active = S.chats.filter(c => c.status === 'active');
    list.innerHTML = active.length ? active.map(c => `
      <li class="chat-item ${S.currentChat === c.id ? 'active' : ''}" data-id="${c.id}">
        <button class="ci-title" data-open="${c.id}" title="${esc(c.title)}">${esc(c.title)}</button>
        <button class="ci-more" data-more="${c.id}" aria-label="More options" aria-haspopup="menu">•••</button>
      </li>`).join('') : '<li class="empty-note">No chats yet</li>';
  }

  function renderChat() {
    const body = $('#chat-body');
    const c = S.chats.find(x => x.id === S.currentChat && x.status === 'active');
    if (!c) {
      body.innerHTML = '<div class="welcome"><div><h2>What can I help with?</h2><p>Gợi ý: hãy kiểm tra quyền riêng tư của tài khoản trước nhé.</p></div></div>';
      return;
    }
    body.innerHTML = '<div class="thread">' + c.msgs.map(([r, t]) =>
      `<div class="${r === 'u' ? 'msg-user' : 'msg-ai'}">${r === 'u' ? esc(t) : t}</div>`).join('') + '</div>';
  }

  function closePopovers() {
    $('#account-menu').hidden = true;
    document.querySelectorAll('.chat-menu').forEach(m => m.remove());
    document.querySelectorAll('[aria-expanded="true"].ci-more').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  function openChatMenu(btn, id) {
    closePopovers();
    btn.setAttribute('aria-expanded', 'true');
    const r = btn.getBoundingClientRect();
    const m = document.createElement('div');
    m.className = 'popover chat-menu';
    m.setAttribute('role', 'menu');
    m.style.position = 'fixed';
    m.style.left = (r.right - 10) + 'px';
    m.style.top = Math.min(r.top, innerHeight - 200) + 'px';
    m.innerHTML = `
      <button class="am-item" data-dummy>${ICON.share}Share</button>
      <button class="am-item" data-dummy>${ICON.pen}Rename</button>
      <button class="am-item" data-act="archive" data-id="${id}">${ICON.archive}Archive</button>
      <button class="am-item danger" data-act="delete" data-id="${id}">${ICON.trash}Delete</button>`;
    document.body.appendChild(m);
  }

  function animateRemove(id, then) {
    const li = document.querySelector(`.chat-item[data-id="${id}"]`);
    if (li) { li.classList.add('removing'); setTimeout(then, 330); } else then();
  }

  function archiveChat(id) {
    const c = S.chats.find(x => x.id === id);
    animateRemove(id, () => {
      c.status = 'archived'; c.archivedAt = new Date();
      S.archivedAny = true;
      if (S.currentChat === id) S.currentChat = null;
      refresh();
      toast('Chat archived');
    });
  }

  function deleteChat(id, fromArchive = false) {
    const c = S.chats.find(x => x.id === id);
    confirmBox('Delete chat?', `This will delete <b>${esc(c.title)}</b>.`, 'Delete', () => {
      const done = () => {
        c.status = 'deleted';
        if (S.currentChat === id) S.currentChat = null;
        refresh();
        toast('Chat deleted');
      };
      if (fromArchive) done(); else animateRemove(id, done);
    });
  }

  // ---------- Settings ----------
  function openSettings() {
    closePopovers();
    S.tab = S.tab || 'data';
    renderSettings();
    $('#settings-overlay').hidden = false;
  }

  function renderSettings() {
    $('#st-tabs').innerHTML = TABS.map(([id, label, ic]) =>
      `<button class="st-tab ${S.tab === id ? 'active' : ''}" data-tab="${id}">${ic}${label}</button>`).join('');
    const content = $('#st-content');
    if (S.tab !== 'data') {
      const label = TABS.find(t => t[0] === S.tab)[1];
      content.innerHTML = `<h3>${label}</h3><div class="placeholder-panel">Mục <b>${label}</b> không thuộc nhiệm vụ hôm nay.<br>Hãy tìm mục quản lý dữ liệu và quyền riêng tư nhé.</div>`;
      return;
    }
    const archivedCount = S.chats.filter(c => c.status === 'archived').length;
    content.innerHTML = `
      <h3>Data controls</h3>
      <div class="panel">
        <div class="row" id="row-links">
          <div class="row-text">Shared links</div>
          <button class="pill" id="btn-manage-links">Manage</button>
        </div>
        <div class="row" id="row-improve">
          <div class="row-text">Improve the model for everyone
            <small>Allow your content to be used to train our models, which makes ChatGPT better for you and everyone who uses it.</small></div>
          <button class="toggle" id="toggle-improve" role="switch" aria-checked="${S.improve}" aria-label="Improve the model for everyone"></button>
        </div>
        <div class="row" id="row-location">
          <div class="row-text">Location
            <small>When enabled, your location helps ChatGPT provide more relevant information, like local recommendations, news, and weather. <a href="#" data-dummy>Learn more</a></small></div>
          <button class="pill" id="btn-location">${S.location ? 'Turn off' : 'Turn on'}</button>
        </div>
        <div class="row clickable" data-dummy>
          <div class="row-text">Information shared with apps</div><span class="arrow">›</span>
        </div>
        <div class="row clickable" id="row-archived">
          <div class="row-text">Archived chats${archivedCount ? ` <small style="display:inline">(${archivedCount})</small>` : ''}</div><span class="arrow">›</span>
        </div>
        <div class="row">
          <div class="row-text">Archive all chats</div>
          <button class="pill" id="btn-archive-all">Archive all</button>
        </div>
        <div class="row">
          <div class="row-text">Delete all chats</div>
          <button class="pill danger" id="btn-delete-all">Delete all</button>
        </div>
        <div class="row">
          <div class="row-text">Export data</div>
          <button class="pill" data-dummy>Export</button>
        </div>
      </div>`;
  }

  function flashRow(id) {
    const r = document.getElementById(id);
    if (r) { r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash'); }
  }

  // ---------- Sub modals ----------
  let subMode = null;
  function openSub(mode) { subMode = mode; renderSub(); $('#sub-overlay').hidden = false; }
  function closeSub() { $('#sub-overlay').hidden = true; subMode = null; renderSettings(); }

  function renderSub() {
    const title = $('#sub-title'), body = $('#sub-body');
    if (subMode === 'links') {
      title.textContent = 'Shared links';
      const rows = S.links.map(l => `
        <div class="t-row" data-row="${l.id}">
          <span class="name" title="${esc(l.name)}">${esc(l.name)}</span>
          <span>${l.type}</span><span>${l.date}</span>
          <span class="acts"><button data-del-link="${l.id}" aria-label="Delete shared link">${ICON.trash}</button></span>
        </div>`).join('');
      body.innerHTML = `
        <p class="sub-desc">Anyone with a shared link can view the shared image, message, chat, or scheduled task. Deleting a shared link stops others from viewing that shared content. It does not delete your original content. <a href="#" data-dummy>Learn more</a></p>
        <div class="table">
          <div class="t-head"><span>Name</span><span>Type</span><span>Date shared</span><span></span></div>
          ${rows || '<div class="t-empty">You have no shared links.</div>'}
        </div>
        <div class="sub-foot">${S.links.length ? '<button class="pill danger" id="btn-del-all-links">Delete all shared links</button>' : ''}</div>`;
    } else if (subMode === 'archived') {
      title.textContent = 'Archived chats';
      const arch = S.chats.filter(c => c.status === 'archived');
      const rows = arch.map(c => `
        <div class="t-row" data-row="${c.id}">
          <span class="name" title="${esc(c.title)}">${esc(c.title)}</span>
          <span>${c.archivedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span class="acts">
            <button data-restore="${c.id}" aria-label="Unarchive" title="Unarchive">${ICON.restore}</button>
            <button data-del-arch="${c.id}" aria-label="Delete" title="Delete">${ICON.trash}</button>
          </span>
        </div>`).join('');
      body.innerHTML = `
        <p class="sub-desc">Archived chats are hidden from your sidebar but are not deleted. You can unarchive or delete them here.</p>
        <div class="table archived">
          <div class="t-head"><span>Name</span><span>Date archived</span><span></span></div>
          ${rows || '<div class="t-empty">You have no archived conversations.</div>'}
        </div>`;
    }
  }

  // ---------- Tasks ----------
  function evaluate() {
    const personal = S.chats.find(c => c.personal);
    return {
      t1: !S.improve,
      t2: !S.links.some(l => l.personal),
      t3a: S.archivedAny,
      t3b: personal.status === 'deleted',
      t4: !S.location,
    };
  }

  function renderTasks() {
    const ev = evaluate();
    const state = { t1: ev.t1, t2: ev.t2, t3: ev.t3a && ev.t3b, t4: ev.t4 };
    let count = 0;
    $('#tp-list').innerHTML = TASKS.map((t, i) => {
      const ok = state[t.id];
      if (ok) count++;
      if (ok && !S.done[t.id]) { S.done[t.id] = true; if (S.startTime) toast(`🎉 Hoàn thành nhiệm vụ ${i + 1}!`, 'win'); }
      if (!ok) S.done[t.id] = false;
      const subs = t.subs ? `<ul class="sub-steps">${t.subs.map((s, k) =>
        `<li class="${(k === 0 ? ev.t3a : ev.t3b) ? 'ok' : ''}">${s}</li>`).join('')}</ul>` : '';
      return `<li class="task ${ok ? 'done' : ''}">
        <div class="task-row"><span class="check">✓</span><span class="task-text"><b>${i + 1}.</b> ${t.text}</span></div>
        ${subs}
        <button class="hint-btn" data-hint="${t.id}">${S.openHints[t.id] ? 'Ẩn gợi ý' : '💡 Gợi ý'}</button>
        ${S.openHints[t.id] ? `<div class="hint">${t.hint}</div>` : ''}
      </li>`;
    }).join('');
    $('#tp-count').textContent = `${count}/4`;
    $('#tp-bar').style.width = (count / 4 * 100) + '%';
    if (count === 4 && !S.finished && S.startTime) {
      S.finished = true;
      setTimeout(finish, 1600);
    }
  }

  function refresh() {
    renderSidebar();
    renderChat();
    if (!$('#settings-overlay').hidden) renderSettings();
    if (subMode) renderSub();
    renderTasks();
  }

  // ---------- Outro ----------
  function finish() {
    closePopovers(); closeConfirm();
    $('#sub-overlay').hidden = true; subMode = null;
    $('#settings-overlay').hidden = true;
    const sec = Math.round((Date.now() - S.startTime) / 1000);
    $('#outro-time').textContent = `${Math.floor(sec / 60)} phút ${sec % 60} giây`;
    $('#done-list').innerHTML = TASKS.map(t => `<li><span>${OUTRO_TEXT[t.id]}</span></li>`).join('');
    showScreen('outro');
    $('#outro').scrollTop = 0;
    confetti();
  }

  function confetti() {
    const cv = $('#confetti'), ctx = cv.getContext('2d');
    cv.width = innerWidth; cv.height = innerHeight;
    const colors = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#facc15'];
    const P = Array.from({ length: 180 }, () => ({
      x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * .6,
      w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, vy: 2 + Math.random() * 3.5,
      vx: -1.5 + Math.random() * 3, r: Math.random() * Math.PI, vr: -.15 + Math.random() * .3,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const end = Date.now() + 4500;
    (function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      P.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (Date.now() < end) requestAnimationFrame(tick); else ctx.clearRect(0, 0, cv.width, cv.height);
    })();
  }

  // ---------- Events ----------
  function startSim() {
    resetState();
    S.startTime = Date.now();
    $('#settings-overlay').hidden = true;
    $('#sub-overlay').hidden = true;
    $('#task-panel').classList.toggle('collapsed', innerWidth < 1000);
    $('#tp-toggle').setAttribute('aria-expanded', innerWidth >= 1000);
    showScreen('sim');
    refresh();
  }

  $('#btn-start').addEventListener('click', startSim);
  $('#btn-restart').addEventListener('click', () => { showScreen('intro'); $('#intro').scrollTop = 0; });

  document.addEventListener('click', e => {
    const t = e.target.closest('button, a, .row, [data-dummy]');

    // Đóng popover khi bấm ra ngoài
    if (!e.target.closest('.popover, #btn-account, .ci-more')) closePopovers();
    if (!t) return;

    if (t.hasAttribute('data-dummy')) {
      e.preventDefault(); closePopovers();
      toast('Mục này không thuộc nhiệm vụ hôm nay 🙂', 'info');
      return;
    }

    // Sidebar
    if (t.id === 'btn-account') { const m = $('#account-menu'); const open = m.hidden; closePopovers(); m.hidden = !open; return; }
    if (t.id === 'btn-open-settings') { openSettings(); return; }
    if (t.id === 'btn-new-chat' || t.id === 'sb-new') { S.currentChat = null; refresh(); return; }
    if (t.id === 'sb-search' || t.id === 'btn-sb-toggle') { toast('Mục này không thuộc nhiệm vụ hôm nay 🙂', 'info'); return; }
    if (t.dataset.open) { S.currentChat = t.dataset.open; refresh(); return; }
    if (t.dataset.more) { openChatMenu(t, t.dataset.more); return; }
    if (t.dataset.act === 'archive') { closePopovers(); archiveChat(t.dataset.id); return; }
    if (t.dataset.act === 'delete') { closePopovers(); deleteChat(t.dataset.id); return; }
    if (t.id === 'btn-send') { sendMsg(); return; }

    // Tasks
    if (t.dataset.hint) { S.openHints[t.dataset.hint] = !S.openHints[t.dataset.hint]; renderTasks(); return; }
    if (t.id === 'tp-toggle') {
      const p = $('#task-panel'); p.classList.toggle('collapsed');
      t.setAttribute('aria-expanded', !p.classList.contains('collapsed')); return;
    }

    // Settings
    if (t.id === 'btn-close-settings') { $('#settings-overlay').hidden = true; return; }
    if (t.dataset.tab) { S.tab = t.dataset.tab; if (S.tab === 'archivedtab') { S.tab = 'data'; renderSettings(); openSub('archived'); } else renderSettings(); return; }
    if (t.id === 'toggle-improve') {
      S.improve = !S.improve;
      t.setAttribute('aria-checked', S.improve);
      toast(S.improve ? 'Model training turned on' : 'Model training turned off');
      flashRow('row-improve'); renderTasks(); return;
    }
    if (t.id === 'btn-location') {
      S.location = !S.location;
      renderSettings(); flashRow('row-location');
      toast(S.location ? 'Location turned on' : 'Location turned off');
      renderTasks(); return;
    }
    if (t.id === 'btn-manage-links') { openSub('links'); return; }
    if (t.id === 'row-archived') { openSub('archived'); return; }
    if (t.id === 'btn-archive-all') {
      const n = S.chats.filter(c => c.status === 'active').length;
      if (!n) { toast('No chats to archive', 'info'); return; }
      confirmBox('Archive all chats?', 'All chats will be moved to Archived chats. You can view them in Data controls → Archived chats.', 'Archive all', () => {
        S.chats.forEach(c => { if (c.status === 'active') { c.status = 'archived'; c.archivedAt = new Date(); } });
        S.archivedAny = true; S.currentChat = null; refresh(); toast('All chats archived');
      });
      return;
    }
    if (t.id === 'btn-delete-all') {
      const n = S.chats.filter(c => c.status !== 'deleted').length;
      if (!n) { toast('No chats to delete', 'info'); return; }
      confirmBox('Delete all chats?', 'This will permanently delete <b>all</b> your chats, including archived chats. This cannot be undone.', 'Delete all', () => {
        S.chats.forEach(c => { c.status = 'deleted'; });
        S.currentChat = null; refresh(); toast('All chats deleted');
      });
      return;
    }

    // Sub modal
    if (t.id === 'btn-close-sub') { closeSub(); return; }
    if (t.dataset.delLink) {
      const id = t.dataset.delLink;
      const row = document.querySelector(`.t-row[data-row="${id}"]`);
      row.classList.add('removing');
      setTimeout(() => { S.links = S.links.filter(l => l.id !== id); toast('Shared link deleted'); refresh(); }, 330);
      return;
    }
    if (t.id === 'btn-del-all-links') {
      confirmBox('Delete all shared links?', 'Others will no longer be able to view any content you have shared. Your original chats will not be deleted.', 'Delete all', () => {
        S.links = []; toast('All shared links deleted'); refresh();
      });
      return;
    }
    if (t.dataset.restore) {
      const c = S.chats.find(x => x.id === t.dataset.restore);
      c.status = 'active'; toast('Chat unarchived'); refresh(); return;
    }
    if (t.dataset.delArch) { deleteChat(t.dataset.delArch, true); return; }

    // Confirm
    if (t.id === 'confirm-cancel') { closeConfirm(); return; }
    if (t.id === 'confirm-ok') { const cb = confirmCb; closeConfirm(); if (cb) cb(); return; }
  });

  // Bấm nền tối để đóng
  ['settings-overlay', 'sub-overlay', 'confirm-overlay'].forEach(id => {
    document.getElementById(id).addEventListener('mousedown', e => {
      if (e.target.id !== id) return;
      if (id === 'settings-overlay') $('#settings-overlay').hidden = true;
      if (id === 'sub-overlay') closeSub();
      if (id === 'confirm-overlay') closeConfirm();
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#confirm-overlay').hidden) closeConfirm();
    else if (!$('#sub-overlay').hidden) closeSub();
    else if (!$('#settings-overlay').hidden) $('#settings-overlay').hidden = true;
    else closePopovers();
  });

  function sendMsg() {
    const inp = $('#composer-input');
    if (!inp.value.trim()) return;
    inp.value = '';
    toast('Giả lập không trả lời chat. Em hãy tập trung vào nhiệm vụ nhé!', 'info');
  }
  $('#composer-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

  // Khi bị nhúng trong iframe (Google Sites) → hiện nút mở toàn màn hình
  let embedded = true;
  try { embedded = window.self !== window.top; } catch (_) { embedded = true; }
  if (embedded) { const fs = $('#btn-fullscreen'); fs.href = location.href; fs.hidden = false; }

  resetState();
})();
