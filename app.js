// ===================================================================
// Mission 80K — Financial Target & Simple Daily To-Do List
// Clean, Humane, and Upstash Cloud Synced
// Profiles: Kinnan, Madhav, Allen Joy
// ===================================================================

const DEFAULT_PROFILES = {
  kinnan: {
    id: 'kinnan',
    name: 'Kinnan',
    avatar: '⚡',
    missionTarget: 80000,
    totalSaved: 15600,
    deadline: '2026-12-31',
    streak: 4,
    transactions: [
      { id: 'tx-k1', amount: 5000, note: 'Initial savings starter', date: '2026-09-20' },
      { id: 'tx-k2', amount: 2600, note: 'Freelance gig payout', date: '2026-09-22' },
      { id: 'tx-k3', amount: 8000, note: 'Monthly savings commitment', date: '2026-09-24' }
    ],
    tasks: [
      { id: 'tk-1', title: '14', completed: true, date: '2026-10-03' },
      { id: 'tk-2', title: '15 course', completed: false, date: '2026-10-03' },
      { id: 'tk-3', title: '16 course', completed: false, date: '2026-10-03' },
      { id: 'tk-4', title: '17 course', completed: false, date: '2026-10-03' }
    ]
  },
  madhav: {
    id: 'madhav',
    name: 'Madhav',
    avatar: '💻',
    missionTarget: 80000,
    totalSaved: 22000,
    deadline: '2027-01-31',
    streak: 5,
    transactions: [
      { id: 'tx-m1', amount: 10000, note: 'MacBook seed fund', date: '2026-09-18' },
      { id: 'tx-m2', amount: 5000, note: 'Coding client milestone', date: '2026-09-21' },
      { id: 'tx-m3', amount: 7000, note: 'Weekly discipline deposit', date: '2026-09-24' }
    ],
    tasks: [
      { id: 'tm-1', title: '2 Hours focused programming work', completed: true, date: '2026-10-03' },
      { id: 'tm-2', title: 'Deposited ₹500 into 80K fund', completed: true, date: '2026-10-03' },
      { id: 'tm-3', title: 'Read 20 pages of tech architecture', completed: false, date: '2026-10-03' }
    ]
  },
  allen: {
    id: 'allen',
    name: 'Allen Joy',
    avatar: '🏖️',
    missionTarget: 80000,
    totalSaved: 18500,
    deadline: '2026-11-20',
    streak: 3,
    transactions: [
      { id: 'tx-a1', amount: 6000, note: 'Flight deposit fund', date: '2026-09-19' },
      { id: 'tx-a2', amount: 4500, note: 'Stay allocation', date: '2026-09-22' },
      { id: 'tx-a3', amount: 8000, note: 'Experience pool', date: '2026-09-24' }
    ],
    tasks: [
      { id: 'ta-1', title: 'Checked flight fares to Dabolim / Mopa', completed: true, date: '2026-10-03' },
      { id: 'ta-2', title: 'Saved ₹400 on daily transport & lunch', completed: true, date: '2026-10-03' },
      { id: 'ta-3', title: 'Planned South Goa stay & scooty route', completed: false, date: '2026-10-03' }
    ]
  }
};

let appState = {
  currency: 'INR',
  activeProfile: 'kinnan',
  syncRoom: 'GOAL-2341',
  profiles: JSON.parse(JSON.stringify(DEFAULT_PROFILES)),
  lastUpdated: Date.now()
};

let isSyncing = false;

// ===================================================================
// AUDIO CHIMES (Subtle & Pleasing)
// ===================================================================
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch (e) {}
}

function playCelebration() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = ctx.currentTime + i * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.12, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(st);
      osc.stop(st + 0.22);
    });
  } catch (e) {}
}

// ===================================================================
// 3-DAY CLEAN PRUNING UTILITY
// ===================================================================
function pruneOldTasks(profile) {
  if (!profile || !profile.tasks) return;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 3); // 3 days ago
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  // Keep all uncompleted tasks, and completed tasks from the last 3 days
  profile.tasks = profile.tasks.filter(t => {
    if (!t.completed) return true;
    if (!t.date) return true;
    return t.date >= cutoffStr;
  });
}

// Convert any legacy habits format back to simple tasks seamlessly
function ensureTasksFormat(profile) {
  if (!profile.tasks) profile.tasks = [];
  if (profile.habits && profile.habits.length > 0) {
    profile.habits.forEach(h => {
      const existing = profile.tasks.find(t => t.title.trim().toLowerCase() === h.title.trim().toLowerCase());
      if (!existing) {
        const todayStr = new Date().toISOString().split('T')[0];
        const isDoneToday = h.history && h.history[todayStr];
        profile.tasks.push({
          id: h.id || 't-' + Date.now() + Math.random().toString(36).substr(2, 4),
          title: h.title,
          completed: !!isDoneToday,
          date: todayStr
        });
      }
    });
    delete profile.habits;
  }
  pruneOldTasks(profile);
}

// ===================================================================
// INITIALIZATION
// ===================================================================
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalState();
  handleUrlParams();

  // Ensure tasks format & 3-day pruning
  Object.values(appState.profiles).forEach(p => ensureTasksFormat(p));

  const savedProfile = localStorage.getItem('goalquest_active_profile');
  if (savedProfile && appState.profiles[savedProfile]) {
    appState.activeProfile = savedProfile;
    document.getElementById('profileGateScreen').classList.add('hidden');
  }

  renderApp();
  initSyncInput();
  lucide.createIcons();

  await pullFromCloud();

  setInterval(() => {
    if (!document.hidden && !isSyncing) pullFromCloud(true);
  }, 8000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pullFromCloud(true);
  });
});

function loadLocalState() {
  try {
    const saved = localStorage.getItem('goalquest_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.profiles) {
        appState = { ...appState, ...parsed };
      } else if (parsed.totalSaved !== undefined) {
        appState.profiles.kinnan.totalSaved = parsed.totalSaved;
        if (parsed.transactions) appState.profiles.kinnan.transactions = parsed.transactions;
      }
    }
  } catch (e) {
    console.error('Failed to load local state:', e);
  }
}

function saveLocalState(triggerCloud = true) {
  try {
    Object.values(appState.profiles).forEach(p => pruneOldTasks(p));
    appState.lastUpdated = Date.now();
    localStorage.setItem('goalquest_state', JSON.stringify(appState));
    if (triggerCloud) syncToCloudDebounced();
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');
  if (room) appState.syncRoom = room.toUpperCase().trim();

  const profile = params.get('profile');
  if (profile && appState.profiles[profile]) {
    appState.activeProfile = profile;
    localStorage.setItem('goalquest_active_profile', profile);
    document.getElementById('profileGateScreen').classList.add('hidden');
  }
}

// ===================================================================
// PROFILE SWITCHING
// ===================================================================
function selectProfile(profileId) {
  if (!appState.profiles[profileId]) return;
  appState.activeProfile = profileId;
  localStorage.setItem('goalquest_active_profile', profileId);

  const gate = document.getElementById('profileGateScreen');
  gate.style.opacity = '0';
  setTimeout(() => {
    gate.classList.add('hidden');
    gate.style.opacity = '1';
  }, 250);

  playTickSound();
  renderApp();
}

function openProfileGate() {
  const gate = document.getElementById('profileGateScreen');
  updateGateSavedValues();
  gate.classList.remove('hidden');
  gate.style.opacity = '1';
}

function updateGateSavedValues() {
  ['kinnan', 'madhav', 'allen'].forEach(k => {
    const p = appState.profiles[k];
    const el = document.getElementById(`gateSaved-${k}`);
    if (el) el.textContent = formatMoney(p.totalSaved);
  });
}

function getCurrentProfile() {
  return appState.profiles[appState.activeProfile] || appState.profiles.kinnan;
}

// ===================================================================
// CLOUD SYNC ENGINE (UPSTASH REDIS)
// ===================================================================
let syncDebounceTimer = null;
function syncToCloudDebounced() {
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => pushToCloud(), 1000);
}

function updateSyncUI(status) {
  const dot = document.getElementById('syncStatusDot');
  const text = document.getElementById('syncStatusText');
  if (!dot) return;

  if (status === 'syncing') {
    dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
    if (text) text.textContent = 'Syncing...';
  } else if (status === 'synced') {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500';
    if (text) text.textContent = 'Synced';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-slate-400';
    if (text) text.textContent = 'Local';
  }
}

async function pullFromCloud(silent = false) {
  if (isSyncing) return;
  const room = appState.syncRoom || 'GOAL-2341';
  if (!silent) updateSyncUI('syncing');

  try {
    const res = await fetch(`/api/sync?room=${room}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const cloudData = json.data;
        if (cloudData.profiles) {
          if ((cloudData.lastUpdated || 0) > (appState.lastUpdated || 0)) {
            appState.profiles = cloudData.profiles;
            Object.values(appState.profiles).forEach(p => ensureTasksFormat(p));
            appState.lastUpdated = cloudData.lastUpdated;
            localStorage.setItem('goalquest_state', JSON.stringify(appState));
            renderApp();
          }
        }
        updateSyncUI('synced');
      } else {
        pushToCloud();
      }
    }
  } catch (err) {
    if (!silent) updateSyncUI('local');
  }
}

async function pushToCloud() {
  if (isSyncing) return;
  isSyncing = true;
  updateSyncUI('syncing');

  const room = appState.syncRoom || 'GOAL-2341';
  Object.values(appState.profiles).forEach(p => pruneOldTasks(p));
  appState.lastUpdated = Date.now();

  try {
    const res = await fetch(`/api/sync?room=${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: appState, room: room })
    });
    if (res.ok) updateSyncUI('synced');
    else updateSyncUI('local');
  } catch (err) {
    updateSyncUI('local');
  } finally {
    isSyncing = false;
  }
}

function triggerManualSync() {
  pushToCloud();
}

function saveSyncRoomCode() {
  const input = document.getElementById('syncRoomInput');
  const code = input.value.trim().toUpperCase();
  if (!code) return;

  appState.syncRoom = code;
  saveLocalState(false);
  pullFromCloud();
  alert(`Connected to Room "${code}"! Data will synchronize across all devices using this room.`);
  closeSyncSettingsModal();
}

function initSyncInput() {
  const input = document.getElementById('syncRoomInput');
  if (input && appState.syncRoom) input.value = appState.syncRoom;
}

// ===================================================================
// RENDERING
// ===================================================================
function formatMoney(amount) {
  const isINR = appState.currency === 'INR';
  const symbol = isINR ? '₹' : '$';
  const val = isINR ? Math.round(amount) : Math.round(amount / 83);
  return `${symbol}${val.toLocaleString('en-US')}`;
}

function renderApp() {
  renderNavbar();
  renderHeroSavings();
  renderTodoList();
  renderTransactions();
  renderSquadSummary();
  updateGateSavedValues();
  lucide.createIcons();
}

function renderNavbar() {
  const p = getCurrentProfile();
  document.getElementById('navAvatar').textContent = p.avatar;
  document.getElementById('navProfileName').textContent = p.name;

  const isINR = appState.currency === 'INR';
  const symbol = isINR ? '₹' : '$';
  document.getElementById('currencySymbol').textContent = symbol;
  document.getElementById('currencyLabel').textContent = appState.currency;
  document.querySelectorAll('.currency-symbol').forEach(el => el.textContent = symbol);
}

// 1. Mission 80K Financial Target Hero (AT THE TOP)
function renderHeroSavings() {
  const p = getCurrentProfile();
  const target = p.missionTarget || 80000;
  const saved = p.totalSaved || 0;
  const pct = Math.min(100, Math.max(0, (saved / target) * 100));

  document.getElementById('heroProfileGreeting').textContent = p.name;
  document.getElementById('heroSavedAmount').textContent = formatMoney(saved);
  document.getElementById('heroTargetAmount').textContent = formatMoney(target);
  document.getElementById('heroProgressPercentage').textContent = `${pct.toFixed(1)}%`;

  const remaining = Math.max(0, target - saved);
  document.getElementById('heroRemainingText').textContent = remaining === 0 
    ? 'Goal reached! Milestone completed 🏆' 
    : `${formatMoney(remaining)} left to reach ${formatMoney(target)}`;

  document.getElementById('heroProgressBar').style.width = `${pct}%`;

  const daysLeft = Math.ceil(remaining / 500);
  document.getElementById('currentPaceText').textContent = remaining === 0 
    ? 'Goal Unlocked! 🎉' 
    : `~${daysLeft} days (at ₹500/day)`;
}

// 2. Simple Daily To-Do List (BELOW MISSION 80K)
function renderTodoList() {
  const p = getCurrentProfile();
  ensureTasksFormat(p);

  const container = document.getElementById('taskListContainer');
  const tasks = p.tasks || [];
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  document.getElementById('todoCompletionBadge').textContent = `${completedCount} of ${totalCount} completed (${Math.round(pct)}%)`;
  document.getElementById('todoProgressBar').style.width = `${pct}%`;
  document.getElementById('streakCount').textContent = `${p.streak || 0} Day Streak`;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
        No tasks for today. Add a new task above!
      </div>
    `;
    return;
  }

  container.innerHTML = tasks.map((task, idx) => {
    const isDone = task.completed;
    return `
      <div class="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 transition group ${isDone ? 'opacity-75' : ''}">
        <div class="flex items-center gap-3.5 flex-1 min-w-0">
          <input 
            type="checkbox" 
            class="simple-todo-checkbox" 
            ${isDone ? 'checked' : ''} 
            onchange="toggleTask(${idx})"
          >
          <span class="text-sm sm:text-base font-medium ${isDone ? 'todo-done-text' : 'text-slate-800'} truncate block select-none">
            ${escapeHtml(task.title)}
          </span>
        </div>

        <button onclick="deleteTask(${idx})" class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 transition" title="Delete task">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `;
  }).join('');
}

// Toggle Task
function toggleTask(index) {
  const p = getCurrentProfile();
  const task = p.tasks[index];
  if (!task) return;

  task.completed = !task.completed;
  task.date = new Date().toISOString().split('T')[0];

  if (task.completed) {
    playTickSound();
  }

  const allDone = p.tasks.every(t => t.completed);
  if (allDone && p.tasks.length > 0) {
    playCelebration();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    p.streak = (p.streak || 0) + 1;
  }

  saveLocalState();
  renderTodoList();
  lucide.createIcons();
}

function handleAddNewTask(e) {
  e.preventDefault();
  const p = getCurrentProfile();
  const input = document.getElementById('newTaskTitleInput');
  const title = input.value.trim();
  if (!title) return;

  if (!p.tasks) p.tasks = [];
  p.tasks.push({
    id: 't-' + Date.now(),
    title: title,
    completed: false,
    date: new Date().toISOString().split('T')[0]
  });

  input.value = '';
  saveLocalState();
  renderTodoList();
  lucide.createIcons();
}

function deleteTask(index) {
  const p = getCurrentProfile();
  p.tasks.splice(index, 1);
  saveLocalState();
  renderTodoList();
  lucide.createIcons();
}

function clearCompletedTasks() {
  const p = getCurrentProfile();
  p.tasks = p.tasks.filter(t => !t.completed);
  saveLocalState();
  renderTodoList();
  lucide.createIcons();
}

// ===================================================================
// SAVINGS & SQUAD
// ===================================================================
function renderTransactions() {
  const p = getCurrentProfile();
  const container = document.getElementById('transactionsList');
  document.getElementById('profileTxTitle').textContent = `${p.name}'s Savings Log`;

  if (!p.transactions || p.transactions.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-slate-400 text-xs">
        No savings logged for ${p.name} yet. Tap "Add Savings" to log your first deposit!
      </div>
    `;
    return;
  }

  const list = [...p.transactions].reverse();
  container.innerHTML = list.map(tx => `
    <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold font-mono">
          +
        </div>
        <div>
          <span class="text-xs font-semibold text-slate-800 block">${escapeHtml(tx.note || 'Savings addition')}</span>
          <span class="text-[10px] text-slate-400 font-mono-nums">${tx.date || 'Recently'}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-bold font-mono-nums text-emerald-600">+${formatMoney(tx.amount)}</span>
        <button onclick="deleteTransaction('${tx.id}')" title="Delete" class="text-slate-400 hover:text-rose-500 p-1 transition">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function renderSquadSummary() {
  const container = document.getElementById('squadSummaryCards');
  if (!container) return;

  const list = ['kinnan', 'madhav', 'allen'];
  container.innerHTML = list.map(k => {
    const prof = appState.profiles[k];
    const pct = Math.min(100, (prof.totalSaved / prof.missionTarget) * 100);
    const isMe = prof.id === appState.activeProfile;

    return `
      <div onclick="selectProfile('${prof.id}')" class="p-4 rounded-xl border ${isMe ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white hover:border-slate-300'} cursor-pointer transition space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-lg">${prof.avatar}</span>
            <span class="font-bold text-sm text-slate-900">${prof.name}</span>
          </div>
          ${isMe ? '<span class="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Active</span>' : ''}
        </div>
        <div>
          <div class="flex items-center justify-between text-xs font-mono-nums text-slate-500 mb-1">
            <span>${formatMoney(prof.totalSaved)}</span>
            <span class="font-semibold text-slate-700">${pct.toFixed(1)}%</span>
          </div>
          <div class="w-full h-1.5 progress-track bg-slate-100">
            <div class="h-full bg-emerald-500 rounded-full" style="width: ${pct}%;"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function quickAddAmount(amt) {
  document.getElementById('depositAmountInput').value = amt;
}

function handleDepositSubmit(e) {
  e.preventDefault();
  const p = getCurrentProfile();
  const amtInput = document.getElementById('depositAmountInput');
  const noteInput = document.getElementById('depositNoteInput');
  const amount = parseFloat(amtInput.value);

  if (isNaN(amount) || amount <= 0) return;

  const newTx = {
    id: 'tx-' + Date.now(),
    amount: amount,
    note: noteInput.value.trim() || 'Savings addition',
    date: new Date().toISOString().split('T')[0]
  };

  p.totalSaved = (p.totalSaved || 0) + amount;
  if (!p.transactions) p.transactions = [];
  p.transactions.push(newTx);

  if (p.totalSaved >= p.missionTarget) {
    playCelebration();
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
  } else {
    playTickSound();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
  }

  amtInput.value = '';
  noteInput.value = '';
  closeDepositModal();
  saveLocalState();
  renderApp();
}

function deleteTransaction(id) {
  const p = getCurrentProfile();
  const tx = p.transactions.find(t => t.id === id);
  if (!tx) return;

  p.totalSaved = Math.max(0, (p.totalSaved || 0) - tx.amount);
  p.transactions = p.transactions.filter(t => t.id !== id);
  saveLocalState();
  renderApp();
}

function toggleCurrency() {
  appState.currency = appState.currency === 'INR' ? 'USD' : 'INR';
  saveLocalState();
  renderApp();
}

// Modals
function openDepositModal() {
  const p = getCurrentProfile();
  document.getElementById('depositModalProfile').textContent = p.name;
  document.getElementById('depositModal').classList.remove('hidden');
  document.getElementById('depositModal').classList.add('flex');
  setTimeout(() => document.getElementById('depositAmountInput').focus(), 50);
}

function closeDepositModal() {
  document.getElementById('depositModal').classList.add('hidden');
  document.getElementById('depositModal').classList.remove('flex');
}

function openMobileQRModal() {
  document.getElementById('mobileQRModal').classList.remove('hidden');
  document.getElementById('mobileQRModal').classList.add('flex');
  generateSyncQRCode();
}

function closeMobileQRModal() {
  document.getElementById('mobileQRModal').classList.add('hidden');
  document.getElementById('mobileQRModal').classList.remove('flex');
}

function generateSyncQRCode() {
  try {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;
    const baseUrl = window.location.origin + window.location.pathname;
    const mobileUrl = `${baseUrl}?room=${appState.syncRoom}&profile=${appState.activeProfile}`;

    new QRious({
      element: canvas,
      value: mobileUrl,
      size: 180,
      background: '#ffffff',
      foreground: '#0f172a',
      level: 'M'
    });
  } catch (e) {}
}

function copyMobileSyncLink() {
  const baseUrl = window.location.origin + window.location.pathname;
  const mobileUrl = `${baseUrl}?room=${appState.syncRoom}&profile=${appState.activeProfile}`;

  navigator.clipboard.writeText(mobileUrl).then(() => {
    const btn = document.getElementById('copyLinkBtnText');
    btn.textContent = 'Link Copied!';
    setTimeout(() => btn.textContent = 'Copy Shareable Link', 2500);
  });
}

function openGoalSettingsModal() {
  const p = getCurrentProfile();
  document.getElementById('editGoalTargetInput').value = p.missionTarget || 80000;
  document.getElementById('editGoalDeadlineInput').value = p.deadline || '';
  document.getElementById('goalSettingsModal').classList.remove('hidden');
  document.getElementById('goalSettingsModal').classList.add('flex');
}

function closeGoalSettingsModal() {
  document.getElementById('goalSettingsModal').classList.add('hidden');
  document.getElementById('goalSettingsModal').classList.remove('flex');
}

function handleSaveGoalSettings(e) {
  e.preventDefault();
  const p = getCurrentProfile();
  p.missionTarget = parseFloat(document.getElementById('editGoalTargetInput').value) || 80000;
  p.deadline = document.getElementById('editGoalDeadlineInput').value;

  saveLocalState();
  closeGoalSettingsModal();
  renderApp();
}

function openSyncSettingsModal() {
  document.getElementById('syncSettingsModal').classList.remove('hidden');
  document.getElementById('syncSettingsModal').classList.add('flex');
}

function closeSyncSettingsModal() {
  document.getElementById('syncSettingsModal').classList.add('hidden');
  document.getElementById('syncSettingsModal').classList.remove('flex');
}

function exportDataJson() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mission-80k-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}
