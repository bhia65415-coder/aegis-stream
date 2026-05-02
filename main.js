// ===== AEGIS STREAM ENHANCED — Main Application =====

const views = ['dashboard', 'messages', 'meeting', 'ainotes', 'tasks', 'security'];
let currentView = 'dashboard';
let meetingTimerInterval = null;
let meetingSeconds = 0;
let currentChannel = 'general';
let meetingActive = false;

// --- Channel Messages Data ---
const channelMessages = {
  general: [
    { author: 'Sarah K.', role: 'lead', initials: 'SK', text: 'Good morning team! Sprint planning starts in 10 minutes.', time: '9:50 AM' },
    { author: 'Abhishek', role: 'admin', initials: 'AB', text: 'Thanks Sarah. I\'ve updated the backlog with new priorities.', time: '9:52 AM' },
    { author: 'Mike R.', role: 'guest', initials: 'MR', text: 'I\'ll be joining as well. Need to discuss the onboarding designs.', time: '9:55 AM' },
  ],
  engineering: [
    { author: 'Priya L.', role: 'engineer', initials: 'PL', text: 'API v2 docs are 80% done. Need auth endpoint specs from Abhishek.', time: '10:15 AM' },
    { author: 'Riya N.', role: 'engineer', initials: 'RN', text: 'PostgreSQL migration is complete. All tests passing. ✅', time: '10:20 AM' },
    { author: 'Abhishek', role: 'admin', initials: 'AB', text: 'Great work Riya! Priya, I\'ll send the specs by EOD.', time: '10:25 AM' },
  ],
  design: [
    { author: 'Mike R.', role: 'guest', initials: 'MR', text: 'Still waiting on brand guidelines from marketing. Can someone escalate?', time: '11:00 AM' },
    { author: 'Sarah K.', role: 'lead', initials: 'SK', text: 'I\'ll follow up with the marketing team today.', time: '11:05 AM' },
  ],
  'security-alerts': [
    { author: 'System', role: 'admin', initials: '🔒', text: '⚠️ Guest user James D. has not enabled 2FA. Reminder sent.', time: '8:30 AM' },
    { author: 'System', role: 'admin', initials: '🔒', text: '🟢 Encryption status: All channels secure. AES-256 active.', time: '8:00 AM' },
  ],
  'dm-sarah': [
    { author: 'Sarah K.', role: 'lead', initials: 'SK', text: 'Hey, can you review the security headers PR before Thursday?', time: '2:30 PM' },
    { author: 'Abhishek', role: 'admin', initials: 'AB', text: 'Sure, I\'ll take a look tonight.', time: '2:35 PM' },
  ],
  'dm-mike': [
    { author: 'Mike R.', role: 'guest', initials: 'MR', text: 'Hi Abhishek, I need access to the #engineering channel for the API review.', time: '3:00 PM' },
    { author: 'Abhishek', role: 'admin', initials: 'AB', text: 'I\'ll approve that from the security panel. Give me a moment.', time: '3:02 PM' },
  ],
};

// --- Transcription simulation ---
const transcriptionLines = [
  "Abhishek: Let's start with the sprint review...",
  "Sarah: The security headers PR is ready for review.",
  "Priya: API documentation is at 80%, need auth specs.",
  "Mike: I'm still blocked on brand guidelines from marketing.",
  "James: Permissions flow is almost done, pushing to staging tonight.",
  "Riya: Database migration completed, all tests green.",
  "Abhishek: Great progress everyone. Let's discuss blockers.",
  "Sarah: We should prioritize the 2FA enrollment for James.",
];

// ==================== NAVIGATION ====================
function navigate(viewName) {
  if (!views.includes(viewName)) return;
  currentView = viewName;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`.nav-link[data-view="${viewName}"]`);
  if (link) link.classList.add('active');

  if (viewName === 'dashboard') animateCounters();

  window.location.hash = viewName;
}

// Make navigate globally available
window.navigate = navigate;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  // Nav handlers
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.view);
    });
  });

  const hash = window.location.hash.replace('#', '');
  if (views.includes(hash)) navigate(hash);
  else navigate('dashboard');

  animateCounters();
  setupMessaging();
  setupMeeting();
  setupDragAndDrop();
  setupModal();
  setupAccessApproval();
  setupTaskFilters();
  setupPDFExport();
});

// ==================== COUNTER ANIMATION ====================
function animateCounters() {
  document.querySelectorAll('.stat-value[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    const duration = 1500;
    const step = target / (duration / 16);
    let current = 0;
    el.textContent = '0';

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current);
    }, 16);
  });
}

// ==================== MESSAGING ====================
function setupMessaging() {
  // Render initial channel
  renderMessages('general');

  // Channel click handlers
  document.querySelectorAll('.channel').forEach(ch => {
    ch.addEventListener('click', () => {
      document.querySelectorAll('.channel').forEach(c => c.classList.remove('active'));
      ch.classList.add('active');
      currentChannel = ch.dataset.channel;
      document.getElementById('chat-channel-name').textContent = currentChannel;
      renderMessages(currentChannel);
    });
  });

  // Send message
  const sendBtn = document.getElementById('btn-send-msg');
  const input = document.getElementById('chat-input');

  sendBtn?.addEventListener('click', () => sendMessage());
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (!channelMessages[currentChannel]) channelMessages[currentChannel] = [];
  channelMessages[currentChannel].push({
    author: 'Abhishek',
    role: 'admin',
    initials: 'AB',
    text: text,
    time: time,
  });

  renderMessages(currentChannel);
  input.value = '';

  const chatEl = document.getElementById('chat-messages');
  chatEl.scrollTop = chatEl.scrollHeight;
}

function renderMessages(channel) {
  const container = document.getElementById('chat-messages');
  const messages = channelMessages[channel] || [];

  container.innerHTML = messages.map(msg => `
    <div class="msg-bubble">
      <div class="avatar-ring ${msg.role} sm">
        <div class="avatar-placeholder xs">${escapeHtml(msg.initials)}</div>
      </div>
      <div class="msg-body">
        <div class="msg-header">
          <span class="msg-author">${escapeHtml(msg.author)}</span>
          <span class="role-badge role-${msg.role} mini">${getRoleBadgeText(msg.role)}</span>
          <span class="msg-time">${msg.time}</span>
        </div>
        <div class="msg-text">${escapeHtml(msg.text)}</div>
      </div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

function getRoleBadgeText(role) {
  const map = {
    admin: '👑 ADMIN',
    lead: '⭐ LEAD',
    engineer: '⚙️ ENGINEER',
    guest: '🛡 GUEST',
  };
  return map[role] || role.toUpperCase();
}

// ==================== MEETING ====================
function setupMeeting() {
  const startBtn = document.getElementById('btn-start-meeting');
  const endBtn = document.getElementById('btn-end-call');
  const muteBtn = document.getElementById('btn-mute');
  const cameraBtn = document.getElementById('btn-camera');
  const shareBtn = document.getElementById('btn-share');
  const reactBtn = document.getElementById('btn-reactions');

  startBtn?.addEventListener('click', () => {
    meetingActive = true;
    document.getElementById('meeting-lobby').style.display = 'none';
    document.getElementById('meeting-live').style.display = 'block';
    startMeetingTimer();
    startTranscriptionSim();
    startSpeakerRotation();
    addLiveAINotes();
  });

  endBtn?.addEventListener('click', () => {
    meetingActive = false;
    stopMeetingTimer();
    document.getElementById('meeting-live').style.display = 'none';
    document.getElementById('meeting-lobby').style.display = 'block';
  });

  muteBtn?.addEventListener('click', () => {
    muteBtn.classList.toggle('active');
    muteBtn.querySelector('span').textContent = muteBtn.classList.contains('active') ? 'Unmute' : 'Mute';
  });

  cameraBtn?.addEventListener('click', () => {
    cameraBtn.classList.toggle('active');
    cameraBtn.querySelector('span').textContent = cameraBtn.classList.contains('active') ? 'Start Video' : 'Camera';
  });

  shareBtn?.addEventListener('click', () => {
    shareBtn.classList.toggle('sharing');
    shareBtn.querySelector('span').textContent = shareBtn.classList.contains('sharing') ? 'Stop Share' : 'Share';
  });

  reactBtn?.addEventListener('click', () => {
    const emojis = ['👍', '❤️', '😂', '🎉', '👏', '🔥'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      bottom: 120px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 2.5rem;
      animation: floatUp 1.5s ease forwards;
      z-index: 999;
      pointer-events: none;
    `;
    el.textContent = emoji;
    document.body.appendChild(el);

    // Add float animation
    if (!document.getElementById('float-style')) {
      const style = document.createElement('style');
      style.id = 'float-style';
      style.textContent = `
        @keyframes floatUp {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-120px) scale(1.5); }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => el.remove(), 1500);
  });
}

function startMeetingTimer() {
  if (meetingTimerInterval) return;
  meetingSeconds = 0;
  const display = document.getElementById('meeting-timer');
  meetingTimerInterval = setInterval(() => {
    meetingSeconds++;
    const h = String(Math.floor(meetingSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((meetingSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(meetingSeconds % 60).padStart(2, '0');
    if (display) display.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

function stopMeetingTimer() {
  if (meetingTimerInterval) {
    clearInterval(meetingTimerInterval);
    meetingTimerInterval = null;
  }
}

function startTranscriptionSim() {
  let idx = 0;
  const textEl = document.getElementById('rec-text');
  const interval = setInterval(() => {
    if (!meetingActive) { clearInterval(interval); return; }
    if (textEl) {
      textEl.style.opacity = '0';
      setTimeout(() => {
        textEl.textContent = transcriptionLines[idx % transcriptionLines.length];
        textEl.style.opacity = '1';
        idx++;
      }, 300);
    }
  }, 4000);
}

function startSpeakerRotation() {
  const tiles = document.querySelectorAll('.video-tile');
  let speakerIdx = 0;
  const interval = setInterval(() => {
    if (!meetingActive) { clearInterval(interval); return; }
    tiles.forEach(t => {
      t.classList.remove('active-speaker');
      const ind = t.querySelector('.speaking-indicator');
      if (ind) ind.remove();
    });
    speakerIdx = (speakerIdx + 1) % tiles.length;
    tiles[speakerIdx].classList.add('active-speaker');

    // Add speaking indicator
    const indicator = document.createElement('div');
    indicator.className = 'speaking-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span><span></span>';
    tiles[speakerIdx].appendChild(indicator);
  }, 5000);
}

function addLiveAINotes() {
  const feed = document.getElementById('ai-panel-feed');
  const notes = [
    { type: 'action', text: '✅ Riya N. → Complete PostgreSQL test suite' },
    { type: 'decision', text: '📌 Postpone mobile redesign to Q3' },
    { type: 'blocker', text: '🚫 Priya L. — Needs auth endpoint specs' },
    { type: 'action', text: '✅ Sarah K. → Review security headers PR by Thu' },
    { type: 'decision', text: '📌 Use JWT tokens for external partner auth' },
  ];
  let idx = 0;
  const interval = setInterval(() => {
    if (!meetingActive) { clearInterval(interval); return; }
    if (idx >= notes.length) { clearInterval(interval); return; }
    const entry = document.createElement('div');
    entry.className = `ai-note-entry ${notes[idx].type}`;
    entry.textContent = notes[idx].text;
    feed.appendChild(entry);
    feed.scrollTop = feed.scrollHeight;
    idx++;
  }, 6000);
}

// ==================== DRAG AND DROP ====================
function setupDragAndDrop() {
  const columns = document.querySelectorAll('.column-cards');
  let dragCard = null;

  document.querySelectorAll('.task-card').forEach(card => {
    addDragHandlers(card);
  });

  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      if (dragCard) {
        col.appendChild(dragCard);
        const column = col.closest('.kanban-column');
        if (column?.dataset.status === 'done') {
          dragCard.classList.add('completed');
          const dueEl = dragCard.querySelector('.task-due');
          if (dueEl) { dueEl.textContent = 'Completed'; dueEl.classList.add('completed'); }
        } else {
          dragCard.classList.remove('completed');
        }
        updateColumnCounts();
      }
    });
  });

  function addDragHandlers(card) {
    card.addEventListener('dragstart', (e) => {
      dragCard = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      dragCard = null;
      columns.forEach(c => c.classList.remove('drag-over'));
      updateColumnCounts();
    });
  }

  // Expose for new cards
  window.addDragHandlers = addDragHandlers;
}

function updateColumnCounts() {
  document.querySelectorAll('.kanban-column').forEach(col => {
    const visibleCards = col.querySelectorAll('.task-card:not(.hidden)').length;
    const badge = col.querySelector('.col-count');
    if (badge) badge.textContent = visibleCards;
  });

  // Update progress bars
  const totalCards = document.querySelectorAll('.task-card:not(.hidden)').length;
  if (totalCards === 0) return;

  document.querySelectorAll('.kanban-column').forEach(col => {
    const count = col.querySelectorAll('.task-card:not(.hidden)').length;
    const bar = col.querySelector('.col-progress-bar');
    if (bar) {
      const pct = (count / totalCards) * 100;
      bar.style.width = pct + '%';
    }
  });
}

// ==================== TASK MODAL ====================
function setupModal() {
  const backdrop = document.getElementById('modal-backdrop');
  const addBtn = document.getElementById('btn-add-task');
  const cancelBtn = document.getElementById('btn-cancel-task');
  const saveBtn = document.getElementById('btn-save-task');

  addBtn?.addEventListener('click', () => backdrop.classList.add('open'));
  cancelBtn?.addEventListener('click', () => backdrop.classList.remove('open'));
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.classList.remove('open');
  });

  saveBtn?.addEventListener('click', () => {
    const title = document.getElementById('task-title').value.trim();
    const desc = document.getElementById('task-desc').value.trim();
    const priority = document.getElementById('task-priority').value;
    const assign = document.getElementById('task-assign').value;
    const tagsSelect = document.getElementById('task-tags');
    const selectedTags = Array.from(tagsSelect.selectedOptions).map(o => o.value);
    const dueDate = document.getElementById('task-due').value;

    if (!title) return;

    const card = document.createElement('div');
    card.className = 'task-card glass-panel';
    card.draggable = true;
    card.dataset.id = 't' + Date.now();
    card.dataset.tags = selectedTags.join(',');
    card.dataset.assignee = assign;

    const tagHTML = selectedTags.map(t =>
      `<span class="task-tag ${t.toLowerCase()}">${escapeHtml(t)}</span>`
    ).join('');

    const roleClass = getAssigneeRole(assign);
    const initials = getInitials(assign);
    const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD';

    card.innerHTML = `
      <div class="task-priority ${priority}"></div>
      <div class="task-tags">${tagHTML}</div>
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(desc) || 'No description'}</p>
      <div class="task-meta">
        <div class="task-meta-left">
          <div class="avatar-ring ${roleClass} sm"><div class="avatar-placeholder xs">${initials}</div></div>
          <span class="assignee-name">${escapeHtml(assign)}</span>
        </div>
        <span class="task-due">${dueDateStr}</span>
      </div>
    `;

    if (window.addDragHandlers) window.addDragHandlers(card);

    document.getElementById('col-todo')?.appendChild(card);
    updateColumnCounts();

    // Reset form
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-due').value = '';
    backdrop.classList.remove('open');
  });
}

// ==================== ACCESS APPROVAL ====================
function setupAccessApproval() {
  document.querySelectorAll('.access-card').forEach(card => {
    const approveBtn = card.querySelector('.btn-approve');
    const denyBtn = card.querySelector('.btn-deny');

    approveBtn?.addEventListener('click', () => {
      card.classList.add('approved');
      const actionsEl = card.querySelector('.access-actions');
      actionsEl.innerHTML = '<span style="color:var(--accent-green);font-weight:600;font-size:0.82rem;">✓ Approved</span>';
      setTimeout(() => {
        card.classList.add('removing');
        setTimeout(() => {
          card.remove();
          checkNoRequests();
        }, 400);
      }, 1500);
      updateSecurityBadge();
    });

    denyBtn?.addEventListener('click', () => {
      card.classList.add('denied');
      const actionsEl = card.querySelector('.access-actions');
      actionsEl.innerHTML = '<span style="color:var(--accent-red);font-weight:600;font-size:0.82rem;">✗ Denied</span>';
      setTimeout(() => {
        card.classList.add('removing');
        setTimeout(() => {
          card.remove();
          checkNoRequests();
        }, 400);
      }, 1500);
      updateSecurityBadge();
    });
  });
}

function checkNoRequests() {
  const remaining = document.querySelectorAll('.access-card').length;
  if (remaining === 0) {
    document.getElementById('no-requests').style.display = 'block';
  }
}

function updateSecurityBadge() {
  const remaining = document.querySelectorAll('.access-card').length - 1;
  const badge = document.querySelector('.nav-link[data-view="security"] .nav-badge');
  if (badge) {
    if (remaining <= 0) badge.remove();
    else badge.textContent = remaining;
  }
}

// ==================== TASK FILTERS ====================
function setupTaskFilters() {
  // Status filter
  document.querySelectorAll('[data-filter-status]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-status]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      applyFilters();
    });
  });

  // Tag filter
  document.querySelectorAll('[data-filter-tag]').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-tag]').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      applyFilters();
    });
  });

  // Assignee filter
  document.getElementById('filter-assignee')?.addEventListener('change', () => applyFilters());
}

function applyFilters() {
  const statusFilter = document.querySelector('[data-filter-status].active')?.dataset.filterStatus || 'all';
  const tagFilter = document.querySelector('[data-filter-tag].active')?.dataset.filterTag || 'all';
  const assigneeFilter = document.getElementById('filter-assignee')?.value || 'all';

  document.querySelectorAll('.task-card').forEach(card => {
    let show = true;

    // Status filter
    if (statusFilter !== 'all') {
      const column = card.closest('.kanban-column');
      if (column && column.dataset.status !== statusFilter) show = false;
    }

    // Tag filter
    if (tagFilter !== 'all') {
      const tags = (card.dataset.tags || '').split(',');
      if (!tags.includes(tagFilter)) show = false;
    }

    // Assignee filter
    if (assigneeFilter !== 'all') {
      if (card.dataset.assignee !== assigneeFilter) show = false;
    }

    card.classList.toggle('hidden', !show);
  });

  updateColumnCounts();
}

// ==================== PDF EXPORT ====================
function setupPDFExport() {
  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    const content = generatePDFContent();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AI_Meeting_Notes_Sprint_Planning.html';
    a.click();
    URL.revokeObjectURL(url);

    // Visual feedback
    const btn = document.getElementById('btn-export-pdf');
    const orig = btn.textContent;
    btn.textContent = '✅ Exported!';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

function generatePDFContent() {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>AI Meeting Notes - Sprint Planning</title>
<style>
  body{font-family:'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:2rem;color:#1e293b;}
  h1{color:#0f172a;border-bottom:3px solid #06d6a0;padding-bottom:0.5rem;}
  h2{color:#334155;margin-top:1.5rem;}
  .decision{border-left:4px solid #3b82f6;padding:0.5rem 1rem;margin:0.5rem 0;background:#eff6ff;}
  .blocker{border-left:4px solid #ef4444;padding:0.5rem 1rem;margin:0.5rem 0;background:#fef2f2;}
  .action{border-left:4px solid #10b981;padding:0.5rem 1rem;margin:0.5rem 0;background:#f0fdf4;}
  .meta{color:#64748b;font-size:0.85rem;margin-top:0.25rem;}
  table{width:100%;border-collapse:collapse;margin:1rem 0;}
  th,td{border:1px solid #e2e8f0;padding:0.5rem;text-align:left;}
  th{background:#f8fafc;font-weight:600;}
</style></head><body>
<h1>🤖 AI Meeting Notes</h1>
<p><strong>Meeting:</strong> Sprint Planning — Q2 | <strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<p><strong>Participants:</strong> Abhishek (Admin), Sarah K. (Lead), Priya L. (Engineer), Riya N. (Engineer), Mike R. (Guest), James D. (Guest)</p>

<h2>📌 Key Decisions</h2>
<div class="decision"><strong>Decision:</strong> Move forward with PostgreSQL migration this sprint.<div class="meta">10:15 AM</div></div>
<div class="decision"><strong>Decision:</strong> Use JWT-based authentication for external partner integrations.<div class="meta">10:22 AM</div></div>

<h2>🚫 Blockers</h2>
<div class="blocker"><strong>Blocker:</strong> Mike R. blocked on onboarding designs — waiting for brand guidelines.<div class="meta">10:30 AM</div></div>
<div class="blocker"><strong>Blocker:</strong> Priya needs auth endpoint specs from Abhishek.<div class="meta">10:35 AM</div></div>

<h2>✅ Action Items</h2>
<table>
<tr><th>Action</th><th>Assigned To</th><th>Due Date</th></tr>
<tr><td>Send auth endpoint specs to Priya</td><td>Abhishek</td><td>Wed, May 7</td></tr>
<tr><td>Deploy permissions flow to staging</td><td>James D.</td><td>Today</td></tr>
<tr><td>Review security headers PR</td><td>Sarah K.</td><td>Thu, May 8</td></tr>
<tr><td>Follow up with marketing for brand guidelines</td><td>Mike R.</td><td>Fri, May 9</td></tr>
</table>

<h2>📊 Sentiment Analysis</h2>
<p><strong>Overall Tone:</strong> 😊 Mostly Positive (72%)</p>
<p><strong>Energy Level:</strong> ⚡ Moderate-High (65%)</p>
<p><strong>Active Blockers:</strong> 2</p>

<hr>
<p style="color:#94a3b8;font-size:0.8rem;">Generated by Aegis Stream AI · ${new Date().toLocaleString()}</p>
</body></html>`;
}

// ==================== UTILITIES ====================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getAssigneeRole(name) {
  const roles = {
    'Abhishek': 'admin',
    'Sarah K.': 'lead',
    'Priya L.': 'engineer',
    'Riya N.': 'engineer',
    'Mike R.': 'guest',
    'James D.': 'guest',
  };
  return roles[name] || 'engineer';
}

function getInitials(name) {
  return name.split(/[\s.]+/).filter(p => p).map(p => p[0]).join('').toUpperCase().slice(0, 2);
}
