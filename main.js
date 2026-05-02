// ===== AEGIS STREAM — Main Application =====

// --- SPA Router ---
const views = ['dashboard', 'meeting', 'tasks', 'pulse', 'settings'];
let currentView = 'dashboard';
let meetingTimerInterval = null;
let meetingSeconds = 0;

function navigate(viewName) {
  if (!views.includes(viewName)) return;
  currentView = viewName;

  // Update views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.add('active');

  // Update nav links
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`.nav-link[data-view="${viewName}"]`);
  if (link) link.classList.add('active');

  // View-specific logic
  if (viewName === 'dashboard') animateCounters();
  if (viewName === 'meeting') startMeetingTimer();
  else stopMeetingTimer();

  // Manage whisper bar & task overlay
  const whisper = document.getElementById('ai-whisper');
  const overlay = document.getElementById('task-overlay');
  if (viewName === 'meeting') {
    setTimeout(() => whisper.classList.add('visible'), 2000);
  } else {
    whisper.classList.remove('visible');
    overlay.classList.remove('open');
  }

  window.location.hash = viewName;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  // Nav click handlers
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.view);
    });
  });

  // Hash routing
  const hash = window.location.hash.replace('#', '');
  if (views.includes(hash)) navigate(hash);
  else navigate('dashboard');

  // Dashboard counter animation
  animateCounters();

  // Workflow loop auto-cycle
  startWorkflowCycle();

  // Meeting controls
  setupMeetingControls();

  // Task board drag & drop
  setupDragAndDrop();

  // Modal handlers
  setupModal();

  // Typewriter effect for AI Pulse scriber
  setupTypewriter();
});

// --- Counter Animation ---
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

// --- Workflow Loop Auto-Cycle ---
function startWorkflowCycle() {
  const steps = ['wf-initiate', 'wf-tag', 'wf-execute', 'wf-review'];
  let idx = 0;

  setInterval(() => {
    steps.forEach(id => document.getElementById(id)?.classList.remove('active'));
    document.getElementById(steps[idx])?.classList.add('active');
    idx = (idx + 1) % steps.length;
  }, 2500);

  // Also allow click
  steps.forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      steps.forEach(s => document.getElementById(s)?.classList.remove('active'));
      document.getElementById(id)?.classList.add('active');
    });
  });
}

// --- Meeting Timer ---
function startMeetingTimer() {
  if (meetingTimerInterval) return;
  meetingSeconds = 0;
  const display = document.querySelector('.meeting-timer');
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

// --- Meeting Controls ---
function setupMeetingControls() {
  const toggleBtn = document.getElementById('btn-toggle-tasks');
  const closeBtn = document.getElementById('btn-close-overlay');
  const overlay = document.getElementById('task-overlay');
  const endBtn = document.getElementById('btn-end-call');

  toggleBtn?.addEventListener('click', () => overlay.classList.toggle('open'));
  closeBtn?.addEventListener('click', () => overlay.classList.remove('open'));
  endBtn?.addEventListener('click', () => {
    stopMeetingTimer();
    navigate('dashboard');
  });
}

// --- Drag and Drop ---
function setupDragAndDrop() {
  const columns = document.querySelectorAll('.column-cards');
  let dragCard = null;

  document.querySelectorAll('.task-card').forEach(card => {
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
  });

  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      if (dragCard) {
        col.appendChild(dragCard);

        // Mark as completed if dropped in "done"
        const column = col.closest('.kanban-column');
        if (column?.dataset.status === 'done') {
          dragCard.classList.add('completed');
          const dueEl = dragCard.querySelector('.task-due');
          if (dueEl) dueEl.textContent = 'Completed';
        } else {
          dragCard.classList.remove('completed');
        }
      }
    });
  });
}

function updateColumnCounts() {
  document.querySelectorAll('.kanban-column').forEach(col => {
    const count = col.querySelectorAll('.task-card').length;
    const badge = col.querySelector('.col-count');
    if (badge) badge.textContent = count;
  });
}

// --- Modal ---
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

    if (!title) return;

    const card = document.createElement('div');
    card.className = 'task-card glass-panel';
    card.draggable = true;
    card.dataset.id = 't' + Date.now();
    card.innerHTML = `
      <div class="task-priority ${priority}"></div>
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(desc) || 'No description'}</p>
      <div class="task-meta">
        <span class="tag-badge tag-blue-sm">${escapeHtml(assign)}</span>
        <span class="task-due">Due: TBD</span>
      </div>
    `;

    // Add drag handlers
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      updateColumnCounts();
    });

    document.getElementById('col-todo')?.appendChild(card);
    updateColumnCounts();

    // Reset form
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    backdrop.classList.remove('open');
  });
}

// --- Typewriter for AI Scriber ---
function setupTypewriter() {
  const feed = document.getElementById('scriber-feed');
  if (!feed) return;

  const entries = feed.querySelectorAll('.scribe-entry');
  entries.forEach((entry, i) => {
    entry.style.opacity = '0';
    entry.style.transform = 'translateX(-10px)';
    entry.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  });

  // Reveal entries one by one when pulse view is active
  const observer = new IntersectionObserver((observed) => {
    observed.forEach(ob => {
      if (ob.isIntersecting) {
        entries.forEach((entry, i) => {
          setTimeout(() => {
            entry.style.opacity = '1';
            entry.style.transform = 'translateX(0)';
          }, i * 300);
        });
        observer.disconnect();
      }
    });
  });
  observer.observe(feed);

  // Also trigger on nav
  document.querySelector('.nav-link[data-view="pulse"]')?.addEventListener('click', () => {
    entries.forEach((entry, i) => {
      entry.style.opacity = '0';
      entry.style.transform = 'translateX(-10px)';
      setTimeout(() => {
        entry.style.opacity = '1';
        entry.style.transform = 'translateX(0)';
      }, i * 300);
    });
  });
}

// --- Utility ---
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Whisper Rotation ---
const whispers = [
  "Last meeting, Abhishek agreed to finish the API documentation by today.",
  "Team decided on Apr 25 to use JWT tokens for external partner authentication.",
  "Priya mentioned she needs the auth endpoint specs before completing API docs.",
  "Mike has been blocked on brand guidelines for 3 days now.",
  "The PostgreSQL migration was completed ahead of schedule by Riya."
];
let whisperIdx = 0;
setInterval(() => {
  const el = document.getElementById('whisper-content');
  if (el && currentView === 'meeting') {
    whisperIdx = (whisperIdx + 1) % whispers.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = whispers[whisperIdx];
      el.style.opacity = '1';
    }, 300);
  }
}, 8000);
