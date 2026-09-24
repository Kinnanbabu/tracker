// ===================================================================
// GoalQuest - Master Application Logic & State Sync Engine
// ===================================================================

const DEFAULT_STATE = {
  currency: 'INR', // 'INR' or 'USD'
  activeGoal: 'goa', // 'goa', 'iphone', or 'macbook'
  totalSaved: 15000,
  goals: {
    goa: {
      id: 'goa',
      icon: '🏖️',
      title: 'Trip to Goa (Sun & Freedom)',
      subtitle: 'Unwind on Palolem & Anjuna beaches, scooty sunsets, night markets, and sea breezes.',
      target: 35000,
      deadline: '2026-11-20',
      color: 'emerald'
    },
    iphone: {
      id: 'iphone',
      icon: '📱',
      title: 'iPhone Newest Pro Max',
      subtitle: 'Flagship camera, 120Hz ProMotion OLED, titanium finish & 24/7 companion.',
      target: 134900,
      deadline: '2026-12-31',
      color: 'purple'
    },
    macbook: {
      id: 'macbook',
      icon: '💻',
      title: 'MacBook Pro M-Series',
      subtitle: 'Supercharged productivity, coding powerhouse, 22h battery life & career asset.',
      target: 169900,
      deadline: '2027-02-28',
      color: 'sky'
    }
  },
  transactions: [
    { id: 'tx-1', amount: 5000, note: 'Initial savings starter', date: '2026-09-20', goal: 'goa' },
    { id: 'tx-2', amount: 2000, note: 'Freelance design project payout', date: '2026-09-22', goal: 'goa' },
    { id: 'tx-3', amount: 8000, note: 'Monthly savings allocation', date: '2026-09-24', goal: 'goa' }
  ],
  tasks: [
    { id: 't-1', title: '💰 Saved ₹300 today (Skipped food delivery / coffee)', category: 'saving', completed: true, date: '' },
    { id: 't-2', title: '🚫 Zero impulse shopping or unneeded checkouts', category: 'habit', completed: true, date: '' },
    { id: 't-3', title: '💻 1 Hour dedicated skill learning or side income work', category: 'todo', completed: true, date: '' },
    { id: 't-4', title: '🔍 Checked flight rates / student discount schemes', category: 'research', completed: false, date: '' },
    { id: 't-5', title: '💧 Drank 2.5L water & kept disciplined mindset', category: 'habit', completed: false, date: '' }
  ],
  streak: 3,
  syncRoom: 'GOAL-' + Math.floor(1000 + Math.random() * 9000),
  lastSync: null
};

// Current App State
let appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
let selectedDateStr = new Date().toISOString().split('T')[0];

// ===================================================================
// AUDIO SYNTHESIZER (Pleasant Chimes using Web Audio API)
// ===================================================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {
    console.debug('Audio error:', e);
  }
}

function playAllDoneFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.1;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  } catch (e) {
    console.debug('Audio fanfare error:', e);
  }
}

// ===================================================================
// INITIALIZATION & STORAGE
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadLocalState();
  checkForUrlDataPayload();
  renderApp();
  initCloudSync();
  lucide.createIcons();
});

function loadLocalState() {
  try {
    const saved = localStorage.getItem('goalquest_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      appState = { ...DEFAULT_STATE, ...parsed };
      // Merge goals safely
      appState.goals = { ...DEFAULT_STATE.goals, ...(parsed.goals || {}) };
    }
  } catch (e) {
    console.error('Failed to load local state:', e);
  }
}

function saveLocalState() {
  try {
    localStorage.setItem('goalquest_state', JSON.stringify(appState));
    syncToCloudDebounced();
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// ===================================================================
// RENDERING FUNCTIONS
// ===================================================================

function formatMoney(amount) {
  const isINR = appState.currency === 'INR';
  const symbol = isINR ? '₹' : '$';
  const val = isINR ? Math.round(amount) : Math.round(amount / 83);
  return `${symbol}${val.toLocaleString('en-US')}`;
}

function renderApp() {
  renderCurrencyUI();
  renderActiveGoalHero();
  renderContenderCards();
  renderTransactionsList();
  renderDailyPlanner();
  updatePaceCalculations();
  lucide.createIcons();
}

function renderCurrencyUI() {
  const isINR = appState.currency === 'INR';
  const symbol = isINR ? '₹' : '$';
  document.getElementById('currencySymbol').textContent = symbol;
  document.getElementById('currencyLabel').textContent = appState.currency;

  document.querySelectorAll('.currency-symbol').forEach(el => {
    el.textContent = symbol;
  });
}

function renderActiveGoalHero() {
  const goalKey = appState.activeGoal || 'goa';
  const goal = appState.goals[goalKey];
  if (!goal) return;

  document.getElementById('activeGoalTitle').textContent = goal.title;
  document.getElementById('activeGoalSubtitle').textContent = goal.subtitle;
  document.getElementById('headerGoalSubtext').textContent = `Target: ${goal.title}`;

  const saved = appState.totalSaved || 0;
  const target = goal.target;
  const pct = Math.min(100, Math.max(0, (saved / target) * 100));

  document.getElementById('activeSavedAmount').textContent = formatMoney(saved);
  document.getElementById('activeTargetAmount').textContent = formatMoney(target);
  document.getElementById('progressPercentageText').textContent = pct.toFixed(1) + '%';

  const remaining = Math.max(0, target - saved);
  document.getElementById('remainingAmountText').textContent = `${formatMoney(remaining)} remaining`;

  const bar = document.getElementById('activeProgressBar');
  bar.style.width = `${pct}%`;

  // Color theme dynamically
  if (goalKey === 'goa') {
    bar.className = 'h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-700 relative shimmer-bar';
  } else if (goalKey === 'iphone') {
    bar.className = 'h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 transition-all duration-700 relative shimmer-bar';
  } else {
    bar.className = 'h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 transition-all duration-700 relative shimmer-bar';
  }

  // Target Deadline
  if (goal.deadline) {
    const diffDays = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    document.getElementById('deadlineBadge').textContent = diffDays > 0 ? `Target: ${diffDays} Days Left` : 'Target Date Reached!';
  }
}

function renderContenderCards() {
  const keys = ['iphone', 'macbook', 'goa'];
  const saved = appState.totalSaved || 0;

  keys.forEach(k => {
    const g = appState.goals[k];
    const pct = Math.min(100, Math.max(0, (saved / g.target) * 100));

    const priceEl = document.getElementById(`${k}PriceDisplay`);
    const savedEl = document.getElementById(`${k}SavedDisplay`);
    const barEl = document.getElementById(`${k}ProgressBar`);
    const badgeEl = document.getElementById(`${k}ActiveBadge`);
    const cardEl = document.getElementById(`card-${k}`);

    if (priceEl) priceEl.textContent = formatMoney(g.target);
    if (savedEl) savedEl.textContent = `${formatMoney(saved)} (${pct.toFixed(1)}%)`;
    if (barEl) barEl.style.width = `${pct}%`;

    const isActive = appState.activeGoal === k;
    if (badgeEl) {
      if (isActive) {
        badgeEl.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i> ACTIVE`;
        badgeEl.className = 'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 flex items-center gap-1';
        cardEl.classList.add('ring-2', 'ring-emerald-400/50');
      } else {
        badgeEl.textContent = 'Select';
        badgeEl.className = 'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10';
        cardEl.classList.remove('ring-2', 'ring-emerald-400/50');
      }
    }
  });
}

function renderTransactionsList() {
  const container = document.getElementById('transactionsList');
  if (!container) return;

  if (!appState.transactions || appState.transactions.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-gray-500 text-xs">
        No savings logged yet. Tap "Add Savings" to deposit your first milestone!
      </div>
    `;
    return;
  }

  // Reverse copy so newest is first
  const list = [...appState.transactions].reverse();
  container.innerHTML = list.map(tx => `
    <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
          +
        </div>
        <div>
          <span class="text-xs font-semibold text-gray-200 block">${escapeHtml(tx.note || 'Savings Deposit')}</span>
          <span class="text-[10px] text-gray-500 font-mono-nums">${tx.date || 'Recently'}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm font-bold font-mono-nums text-emerald-400">+${formatMoney(tx.amount)}</span>
        <button onclick="deleteTransaction('${tx.id}')" title="Delete" class="text-gray-500 hover:text-rose-400 p-1 transition">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function renderDailyPlanner() {
  const dateDisplay = document.getElementById('currentDateDisplay');
  const todayStr = new Date().toISOString().split('T')[0];
  if (selectedDateStr === todayStr) {
    dateDisplay.textContent = `Today (${selectedDateStr})`;
  } else {
    dateDisplay.textContent = selectedDateStr;
  }

  const container = document.getElementById('taskListContainer');
  if (!container) return;

  const tasks = appState.tasks || [];
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const ratioText = `${completedCount} of ${totalCount} completed (${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%)`;

  document.getElementById('dailyCompletionRatio').textContent = ratioText;
  document.getElementById('todayTasksPill').textContent = `${completedCount}/${totalCount}`;
  const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  document.getElementById('dailyProgressBar').style.width = `${pct}%`;
  document.getElementById('streakCount').textContent = `${appState.streak || 0} Day Streak`;

  container.innerHTML = tasks.map((task, idx) => {
    const isDone = task.completed;
    const catBadge = getCategoryBadge(task.category);

    return `
      <div class="glass-card p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-3 group transition hover:border-white/10 ${isDone ? 'bg-black/30' : ''}">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <input 
            type="checkbox" 
            class="tick-checkbox flex-shrink-0" 
            ${isDone ? 'checked' : ''} 
            onchange="toggleTask(${idx})"
          >
          <div class="min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium ${isDone ? 'task-completed text-gray-500' : 'text-gray-200'} truncate">
              ${escapeHtml(task.title)}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          ${catBadge}
          <button onclick="deleteTask(${idx})" class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-1 transition">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function getCategoryBadge(cat) {
  switch (cat) {
    case 'saving':
      return `<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">💰 Saving</span>`;
    case 'habit':
      return `<span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">⚡ Habit</span>`;
    case 'research':
      return `<span class="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">🔍 Research</span>`;
    default:
      return `<span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-300 font-semibold border border-gray-500/30">📝 Task</span>`;
  }
}

function updatePaceCalculations() {
  const goal = appState.goals[appState.activeGoal || 'goa'];
  if (!goal) return;

  const remaining = Math.max(0, goal.target - (appState.totalSaved || 0));

  // Pace for 60 days
  const daily60 = Math.ceil(remaining / 60);
  document.getElementById('paceDaily60').textContent = `${formatMoney(daily60)} / day`;

  // Pace for 90 days weekly
  const weekly90 = Math.ceil(remaining / (90 / 7));
  document.getElementById('paceWeekly').textContent = `${formatMoney(weekly90)} / week`;

  // Current estimated days left assuming ~₹500/day
  const avgDailyPace = 500;
  const daysLeft = Math.ceil(remaining / avgDailyPace);
  document.getElementById('currentPaceText').textContent = remaining === 0 ? 'Goal Met! 🎉' : `~${daysLeft} days (at ₹500/d)`;
}

// ===================================================================
// USER ACTIONS (TICK, ADD TASK, DEPOSIT)
// ===================================================================

function toggleTask(index) {
  const task = appState.tasks[index];
  if (!task) return;

  task.completed = !task.completed;
  if (task.completed) {
    playTickSound();
  }

  // Check if all are completed
  const allDone = appState.tasks.every(t => t.completed);
  if (allDone && appState.tasks.length > 0) {
    playAllDoneFanfare();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    appState.streak = (appState.streak || 0) + 1;
  }

  saveLocalState();
  renderDailyPlanner();
  lucide.createIcons();
}

function handleAddTask(e) {
  e.preventDefault();
  const input = document.getElementById('newTaskInput');
  const catSelect = document.getElementById('newTaskCategory');
  const title = input.value.trim();
  if (!title) return;

  const newTask = {
    id: 't-' + Date.now(),
    title: title,
    category: catSelect ? catSelect.value : 'todo',
    completed: false,
    date: selectedDateStr
  };

  appState.tasks.push(newTask);
  input.value = '';
  saveLocalState();
  renderDailyPlanner();
  lucide.createIcons();
}

function deleteTask(index) {
  appState.tasks.splice(index, 1);
  saveLocalState();
  renderDailyPlanner();
  lucide.createIcons();
}

function setActiveGoal(goalKey) {
  if (!appState.goals[goalKey]) return;
  appState.activeGoal = goalKey;
  saveLocalState();
  renderApp();

  // Subtle confetti when picking active goal
  confetti({
    particleCount: 30,
    spread: 50,
    origin: { y: 0.8 }
  });
}

function quickAddAmount(amt) {
  document.getElementById('depositAmountInput').value = amt;
}

function handleDepositSubmit(e) {
  e.preventDefault();
  const amtInput = document.getElementById('depositAmountInput');
  const noteInput = document.getElementById('depositNoteInput');
  const amount = parseFloat(amtInput.value);

  if (isNaN(amount) || amount <= 0) return;

  const newTx = {
    id: 'tx-' + Date.now(),
    amount: amount,
    note: noteInput.value.trim() || 'Savings addition',
    date: new Date().toISOString().split('T')[0],
    goal: appState.activeGoal
  };

  appState.totalSaved = (appState.totalSaved || 0) + amount;
  if (!appState.transactions) appState.transactions = [];
  appState.transactions.push(newTx);

  // Check if reached milestone or 100%
  const activeGoal = appState.goals[appState.activeGoal];
  if (activeGoal && appState.totalSaved >= activeGoal.target) {
    playAllDoneFanfare();
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 }
    });
  } else {
    playTickSound();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
  }

  amtInput.value = '';
  noteInput.value = '';
  closeDepositModal();
  saveLocalState();
  renderApp();
}

function deleteTransaction(id) {
  const tx = appState.transactions.find(t => t.id === id);
  if (!tx) return;

  appState.totalSaved = Math.max(0, (appState.totalSaved || 0) - tx.amount);
  appState.transactions = appState.transactions.filter(t => t.id !== id);
  saveLocalState();
  renderApp();
}

function toggleCurrency() {
  appState.currency = appState.currency === 'INR' ? 'USD' : 'INR';
  saveLocalState();
  renderApp();
}

// ===================================================================
// TAB SWITCHING
// ===================================================================

function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.remove('hidden');

  // Update desktop tabs
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.className = 'nav-tab px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-gray-400 hover:text-gray-200 hover:bg-white/5';
  });
  const activeBtn = document.getElementById(`nav-btn-${tabId}`);
  if (activeBtn) {
    activeBtn.className = 'nav-tab px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30';
  }

  // Update mobile bottom bar
  const navKeys = ['tracker', 'planner', 'battle', 'blueprints', 'sync'];
  navKeys.forEach(k => {
    const el = document.getElementById(`mobile-nav-${k}`);
    if (el) {
      if (k === tabId) {
        el.className = 'flex flex-col items-center gap-1 text-indigo-400 p-1 text-xs';
      } else {
        el.className = 'flex flex-col items-center gap-1 text-gray-400 p-1 text-xs';
      }
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Date Changer
function changeDate(delta) {
  const current = new Date(selectedDateStr);
  current.setDate(current.getDate() + delta);
  selectedDateStr = current.toISOString().split('T')[0];
  renderDailyPlanner();
}

function goToToday() {
  selectedDateStr = new Date().toISOString().split('T')[0];
  renderDailyPlanner();
}

// ===================================================================
// MODALS MANAGEMENT
// ===================================================================

function openDepositModal() {
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

function openGoalSettingsModal() {
  const goal = appState.goals[appState.activeGoal];
  if (!goal) return;

  document.getElementById('editGoalTitleInput').value = goal.title;
  document.getElementById('editGoalTargetInput').value = goal.target;
  document.getElementById('editGoalDeadlineInput').value = goal.deadline || '';

  document.getElementById('goalSettingsModal').classList.remove('hidden');
  document.getElementById('goalSettingsModal').classList.add('flex');
}

function closeGoalSettingsModal() {
  document.getElementById('goalSettingsModal').classList.add('hidden');
  document.getElementById('goalSettingsModal').classList.remove('flex');
}

function handleSaveGoalSettings(e) {
  e.preventDefault();
  const goal = appState.goals[appState.activeGoal];
  if (!goal) return;

  goal.title = document.getElementById('editGoalTitleInput').value.trim();
  goal.target = parseFloat(document.getElementById('editGoalTargetInput').value) || goal.target;
  goal.deadline = document.getElementById('editGoalDeadlineInput').value;

  saveLocalState();
  closeGoalSettingsModal();
  renderApp();
}

function openSyncModal() {
  switchTab('sync');
}

// ===================================================================
// CROSS-DEVICE SYNC & QR CODE ENGINE
// ===================================================================

function generateSyncQRCode() {
  try {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;

    // Build URL with compressed state or room code
    const baseUrl = window.location.origin + window.location.pathname;
    const minimalState = {
      activeGoal: appState.activeGoal,
      totalSaved: appState.totalSaved,
      currency: appState.currency,
      syncRoom: appState.syncRoom
    };
    const encoded = encodeURIComponent(JSON.stringify(minimalState));
    const mobileUrl = `${baseUrl}#import=${encoded}`;

    new QRious({
      element: canvas,
      value: mobileUrl,
      size: 200,
      background: '#ffffff',
      foreground: '#0b0f19',
      level: 'M'
    });
  } catch (e) {
    console.error('QR code error:', e);
  }
}

function copyMobileSyncLink() {
  const baseUrl = window.location.origin + window.location.pathname;
  const minimalState = {
    activeGoal: appState.activeGoal,
    totalSaved: appState.totalSaved,
    currency: appState.currency,
    syncRoom: appState.syncRoom
  };
  const encoded = encodeURIComponent(JSON.stringify(minimalState));
  const mobileUrl = `${baseUrl}#import=${encoded}`;

  navigator.clipboard.writeText(mobileUrl).then(() => {
    const btnText = document.getElementById('copyLinkBtnText');
    btnText.textContent = 'Copied to Clipboard!';
    setTimeout(() => {
      btnText.textContent = 'Copy Shareable Link';
    }, 2500);
  });
}

function checkForUrlDataPayload() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#import=')) {
    try {
      const raw = decodeURIComponent(hash.substring(8));
      const imported = JSON.parse(raw);
      if (confirm('📲 Found GoalQuest progress transferred from your other device! Do you want to load it now?')) {
        appState.activeGoal = imported.activeGoal || appState.activeGoal;
        appState.totalSaved = imported.totalSaved || appState.totalSaved;
        appState.currency = imported.currency || appState.currency;
        if (imported.syncRoom) appState.syncRoom = imported.syncRoom;
        saveLocalState();
        // Clear hash cleanly
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (e) {
      console.error('Failed to parse URL import data:', e);
    }
  }
}

// Room Code Auto-Sync
let syncDebounceTimer = null;

function syncToCloudDebounced() {
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    triggerManualSync();
  }, 1200);
}

async function triggerManualSync() {
  const dot = document.getElementById('syncStatusDot');
  const text = document.getElementById('syncStatusText');
  if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-spin';
  if (text) text.textContent = 'Syncing...';

  try {
    const room = appState.syncRoom || 'DEFAULT_ROOM';
    // Call our serverless Vercel function
    const res = await fetch(`/api/sync?room=${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: appState })
    });

    if (res.ok) {
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse';
      if (text) text.textContent = 'Cloud Synced';
      appState.lastSync = new Date().toISOString();
    } else {
      // Fallback
      if (dot) dot.className = 'w-2 h-2 rounded-full bg-indigo-400';
      if (text) text.textContent = 'Local Ready';
    }
  } catch (err) {
    // If running offline or without serverless backend
    if (dot) dot.className = 'w-2 h-2 rounded-full bg-indigo-400';
    if (text) text.textContent = 'Local Storage';
  }
}

function saveSyncRoomCode() {
  const input = document.getElementById('syncRoomInput');
  const code = input.value.trim().toUpperCase();
  if (!code) return;

  appState.syncRoom = code;
  saveLocalState();
  alert(`Room code set to "${code}". Enter this exact code on your phone to link them!`);
  triggerManualSync();
}

function initCloudSync() {
  const roomInput = document.getElementById('syncRoomInput');
  if (roomInput && appState.syncRoom) {
    roomInput.value = appState.syncRoom;
  }
}

// Data Export & Import
function exportDataJson() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `goalquest-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importDataJson(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      appState = { ...DEFAULT_STATE, ...parsed };
      saveLocalState();
      renderApp();
      alert('Data successfully imported!');
    } catch (err) {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
}

// ===================================================================
// QUIZ & BLUEPRINT HELPERS
// ===================================================================

function runQuizRecommendation(choice) {
  const box = document.getElementById('quizResultBox');
  box.classList.remove('hidden');

  if (choice === 'work') {
    box.innerHTML = `
      <div class="space-y-2">
        <span class="font-bold text-sm text-sky-300 block">🏆 Recommendation: MacBook Pro M-Series</span>
        <p class="text-gray-300">
          A laptop is an <strong>investment asset</strong> that directly increases your earning potential, speeds up your coding/creative work, and lasts 5-7 years. The ROI on a MacBook Pro will pay for 3 Goa trips and 2 iPhones in the future!
        </p>
        <button onclick="setActiveGoal('macbook')" class="mt-2 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition">
          Set MacBook Pro as Active Quest
        </button>
      </div>
    `;
  } else if (choice === 'burnout') {
    box.innerHTML = `
      <div class="space-y-2">
        <span class="font-bold text-sm text-emerald-300 block">🏆 Recommendation: Trip to Goa</span>
        <p class="text-gray-300">
          Burnout kills productivity. At ~₹35,000, Goa is the <strong>most cost-effective happiness boost</strong> you can get. You'll make lifelong memories with friends, experience sunsets, and return with refreshed energy to earn for the next gadget!
        </p>
        <button onclick="setActiveGoal('goa')" class="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition">
          Set Goa Trip as Active Quest
        </button>
      </div>
    `;
  } else {
    box.innerHTML = `
      <div class="space-y-2">
        <span class="font-bold text-sm text-purple-300 block">🏆 Recommendation: iPhone Newest Pro</span>
        <p class="text-gray-300">
          Your smartphone is in your hand 5 to 7 hours every single day. If your current phone has poor battery life, lagging apps, or a cracked screen, upgrading your daily driver gives immediate quality of life improvements.
        </p>
        <button onclick="setActiveGoal('iphone')" class="mt-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition">
          Set iPhone as Active Quest
        </button>
      </div>
    `;
  }
}

function copyGoaPackingList() {
  const checklist = `🌴 Goa Trip Essentials:
1. Valid Driving License (for Scooty/Thar rental)
2. Sunglasses & SPF 50+ Sunscreen
3. Linen shirts & quick-dry shorts
4. Waterproof phone pouch (for water sports/Baga beach)
5. Power bank for full-day scooty trips
6. UPI / Cash combo (shacks prefer UPI, parking needs cash)
7. Playlist downloaded offline for coastal drives!`;

  navigator.clipboard.writeText(checklist).then(() => {
    alert('Goa Checklist copied to clipboard!');
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m];
  });
}
