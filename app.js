// ===================================================================
// Mission 80K — Advanced 3-Day Habit Tracker & Goal Engine
// Strictly retains only a rolling 3-day window of habit data
// Inspired by Atomic Habits, Things 3, and Notion
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
    habits: [
      { id: 'h-1', title: '14 course', category: 'course', history: {} },
      { id: 'h-2', title: '15 course', category: 'course', history: {} },
      { id: 'h-3', title: '16 course', category: 'course', history: {} },
      { id: 'h-4', title: '17 course', category: 'course', history: {} }
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
    habits: [
      { id: 'hm-1', title: '2 Hours focused programming work', category: 'focus', history: {} },
      { id: 'hm-2', title: 'Deposited ₹500 into 80K fund', category: 'saving', history: {} },
      { id: 'hm-3', title: 'Read 20 pages of tech architecture', category: 'course', history: {} },
      { id: 'hm-4', title: 'Zero unneeded online checkouts', category: 'saving', history: {} }
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
    habits: [
      { id: 'ha-1', title: 'Checked flight fares to Dabolim / Mopa', category: 'focus', history: {} },
      { id: 'ha-2', title: 'Saved ₹400 on daily transport & lunch', category: 'saving', history: {} },
      { id: 'ha-3', title: 'Planned South Goa stay & scooty route', category: 'focus', history: {} },
      { id: 'ha-4', title: 'Morning workout & health focus', category: 'health', history: {} }
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

let currentHabitFilter = 'all';
let isSyncing = false;

// ===================================================================
// 3-DAY ROLLING WINDOW UTILITIES
// ===================================================================

// Returns array of exactly the 3 rolling days: [2-days-ago, yesterday, today]
function getRollingThreeDays() {
  const dates = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const isYesterday = i === 1;

    let dayLabel = isToday ? 'Today' : isYesterday ? 'Yest' : d.toLocaleDateString('en-US', { weekday: 'short' });
    let shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    dates.push({
      dateStr,
      dayLabel,
      shortDate,
      isToday,
      isYesterday
    });
  }
  return dates;
}

// Strictly prunes habit history so ONLY the last 3 days of data are kept!
function pruneProfileHabitsToThreeDays(profile) {
  if (!profile || !profile.habits) return;
  const validDates = getRollingThreeDays().map(d => d.dateStr);

  profile.habits.forEach(habit => {
    if (!habit.history) habit.history = {};
    Object.keys(habit.history).forEach(dateKey => {
      // If older than 2 days ago or not in rolling 3 days, delete immediately!
      if (!validDates.includes(dateKey)) {
        delete habit.history[dateKey];
      }
    });
  });
}

function detectCategory(title, fallback) {
  const lower = (title || '').toLowerCase();
  if (lower.includes('course') || lower.includes('study') || lower.includes('read') || lower.includes('learn') || lower.includes('14') || lower.includes('15') || lower.includes('16') || lower.includes('17')) {
    return 'course';
  }
  if (lower.includes('save') || lower.includes('₹') || lower.includes('$') || lower.includes('spend') || lower.includes('budget') || lower.includes('money')) {
    return 'saving';
  }
  if (lower.includes('work') || lower.includes('code') || lower.includes('client') || lower.includes('focus') || lower.includes('project')) {
    return 'focus';
  }
  if (lower.includes('water') || lower.includes('gym') || lower.includes('run') || lower.includes('sleep') || lower.includes('health')) {
    return 'health';
  }
  return fallback || 'focus';
}

function getCategoryIcon(cat) {
  switch (cat) {
    case 'course': return '📚';
    case 'saving': return '💰';
    case 'health': return '🌿';
    default: return '⚡';
  }
}

function getCategoryName(cat) {
  switch (cat) {
    case 'course': return 'Course';
    case 'saving': return 'Savings';
    case 'health': return 'Health';
    default: return 'Focus';
  }
}

// Migrate old `tasks` to advanced 3-day `habits`
function migrateTasksToHabits(profile) {
  if (!profile.habits) profile.habits = [];
  const todayStr = new Date().toISOString().split('T')[0];

  if (profile.tasks && profile.tasks.length > 0) {
    profile.tasks.forEach(task => {
      const existing = profile.habits.find(h => h.title.trim().toLowerCase() === task.title.trim().toLowerCase());
      if (!existing) {
        profile.habits.push({
          id: task.id || 'h-' + Date.now() + Math.random().toString(36).substr(2, 4),
          title: task.title,
          category: detectCategory(task.title, task.category),
          history: {
            [todayStr]: !!task.completed
          }
        });
      } else {
        if (task.completed) existing.history[todayStr] = true;
      }
    });
  }

  // Ensure default sample habits have today populated if empty
  profile.habits.forEach(h => {
    if (!h.history) h.history = {};
    if (h.history[todayStr] === undefined && (h.title === '14' || h.title.includes('Initial'))) {
      h.history[todayStr] = true;
    }
  });

  pruneProfileHabitsToThreeDays(profile);
}

// ===================================================================
// AUDIO CHIMES
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
// INITIALIZATION
// ===================================================================
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalState();
  handleUrlParams();

  // Migrate all profiles & prune to 3 days
  Object.values(appState.profiles).forEach(p => migrateTasksToHabits(p));

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
    // Enforce 3-day pruning before saving to ensure clean lightweight storage
    Object.values(appState.profiles).forEach(p => pruneProfileHabitsToThreeDays(p));

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
            Object.values(appState.profiles).forEach(p => {
              migrateTasksToHabits(p);
              pruneProfileHabitsToThreeDays(p);
            });
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
  Object.values(appState.profiles).forEach(p => pruneProfileHabitsToThreeDays(p));
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
  renderHabitsMatrix();
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

// ===================================================================
// ADVANCED 3-DAY HABIT MATRIX RENDERER
// ===================================================================
function renderHabitsMatrix() {
  const p = getCurrentProfile();
  pruneProfileHabitsToThreeDays(p);

  const container = document.getElementById('habitListContainer');
  const rollingDays = getRollingThreeDays(); // [2 days ago, yesterday, today]
  const todayStr = rollingDays[2].dateStr;
  const yestStr = rollingDays[1].dateStr;

  const habits = p.habits || [];

  // Filter habits
  const filteredHabits = habits.filter(h => {
    if (currentHabitFilter === 'all') return true;
    return h.category === currentHabitFilter;
  });

  // Calculate Metrics
  const totalHabits = habits.length;
  const todayDone = habits.filter(h => h.history && h.history[todayStr]).length;
  const todayPct = totalHabits > 0 ? (todayDone / totalHabits) * 100 : 0;

  document.getElementById('todayCompletionText').textContent = `${todayDone} of ${totalHabits} completed today (${Math.round(todayPct)}%)`;
  document.getElementById('todayProgressBar').style.width = `${todayPct}%`;
  document.getElementById('streakCount').textContent = `${p.streak || 0} Day Streak`;

  // 3-Day Consistency Rate
  let checksPossible = totalHabits * 3;
  let checksDone = 0;
  habits.forEach(h => {
    rollingDays.forEach(d => {
      if (h.history && h.history[d.dateStr]) checksDone++;
    });
  });
  const consistencyPct = checksPossible > 0 ? Math.round((checksDone / checksPossible) * 100) : 0;
  document.getElementById('consistencyScoreText').textContent = `${consistencyPct}% consistency`;

  if (filteredHabits.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
        No habits found in this category. Tap "Add Habit" above to create one!
      </div>
    `;
    return;
  }

  container.innerHTML = filteredHabits.map((habit) => {
    const isTodayDone = habit.history && habit.history[todayStr];
    const isYestDone = habit.history && habit.history[yestStr];
    const missedYesterday = !isYestDone && !isTodayDone;

    // Days checks html
    const daysHtml = rollingDays.map((d) => {
      const isDone = habit.history && habit.history[d.dateStr];
      return `
        <button 
          onclick="toggleHabitDay('${habit.id}', '${d.dateStr}')" 
          class="day-btn ${isDone ? 'completed' : ''} ${d.isToday ? 'is-today' : ''}" 
          title="${d.dayLabel} (${d.shortDate})"
        >
          <span class="text-[9px] font-mono font-medium ${d.isToday ? 'text-emerald-700 font-bold' : 'text-slate-400'}">${d.dayLabel}</span>
          <div class="day-check-icon mt-1">
            ${isDone ? '✓' : ''}
          </div>
        </button>
      `;
    }).join('');

    return `
      <div class="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition shadow-sm group">
        
        <!-- Left: Icon, Title & Tags -->
        <div class="flex items-center gap-3 min-w-0 flex-1 pr-2">
          <span class="text-xl sm:text-2xl flex-shrink-0">${getCategoryIcon(habit.category)}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm sm:text-base font-bold text-slate-900 truncate block">
                ${escapeHtml(habit.title)}
              </span>
              ${missedYesterday ? `
                <span class="hidden md:inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60" title="Atomic Habits: Never miss twice!">
                  ⚡ Never miss twice
                </span>
              ` : ''}
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span class="font-medium text-slate-500">${getCategoryName(habit.category)}</span>
              <span>•</span>
              <button onclick="openEditHabitModal('${habit.id}')" class="hover:text-slate-700 underline text-[11px]">Edit</button>
              <span>•</span>
              <button onclick="deleteHabit('${habit.id}')" class="hover:text-rose-600 text-[11px]">Delete</button>
            </div>
          </div>
        </div>

        <!-- Right: 3-Day Matrix Buttons -->
        <div class="flex items-center gap-1.5 flex-shrink-0">
          ${daysHtml}
        </div>

      </div>
    `;
  }).join('');
}

// Toggle completion for a specific habit on a specific day (within the 3-day window)
function toggleHabitDay(habitId, dateStr) {
  const p = getCurrentProfile();
  const habit = p.habits.find(h => h.id === habitId);
  if (!habit) return;

  if (!habit.history) habit.history = {};
  habit.history[dateStr] = !habit.history[dateStr];

  if (habit.history[dateStr]) {
    playTickSound();
  }

  // Strictly enforce 3-day retention
  pruneProfileHabitsToThreeDays(p);

  // Check if all habits are completed for today
  const rollingDays = getRollingThreeDays();
  const todayStr = rollingDays[2].dateStr;
  const allTodayDone = p.habits.every(h => h.history && h.history[todayStr]);

  if (allTodayDone && p.habits.length > 0) {
    playCelebration();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    p.streak = (p.streak || 0) + 1;
  }

  saveLocalState();
  renderHabitsMatrix();
  lucide.createIcons();
}

function setHabitFilter(filterKey) {
  currentHabitFilter = filterKey;
  document.querySelectorAll('.category-filter-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`filter-${filterKey}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderHabitsMatrix();
  lucide.createIcons();
}

function handleAddNewHabit(e) {
  e.preventDefault();
  const p = getCurrentProfile();
  const input = document.getElementById('newHabitTitleInput');
  const catSelect = document.getElementById('newHabitCategorySelect');
  const title = input.value.trim();
  if (!title) return;

  if (!p.habits) p.habits = [];

  const newHabit = {
    id: 'h-' + Date.now(),
    title: title,
    category: catSelect ? catSelect.value : detectCategory(title, 'focus'),
    history: {}
  };

  p.habits.push(newHabit);
  pruneProfileHabitsToThreeDays(p);

  input.value = '';
  saveLocalState();
  renderHabitsMatrix();
  lucide.createIcons();
}

function markAllTodayDone() {
  const p = getCurrentProfile();
  const todayStr = getRollingThreeDays()[2].dateStr;
  if (!p.habits) return;

  p.habits.forEach(h => {
    if (!h.history) h.history = {};
    h.history[todayStr] = true;
  });

  playCelebration();
  confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
  saveLocalState();
  renderHabitsMatrix();
  lucide.createIcons();
}

function deleteHabit(habitId) {
  const p = getCurrentProfile();
  p.habits = p.habits.filter(h => h.id !== habitId);
  saveLocalState();
  renderHabitsMatrix();
  lucide.createIcons();
}

// Edit Habit Modal
function openEditHabitModal(habitId) {
  const p = getCurrentProfile();
  const habit = p.habits.find(h => h.id === habitId);
  if (!habit) return;

  document.getElementById('editHabitId').value = habit.id;
  document.getElementById('editHabitTitle').value = habit.title;
  document.getElementById('editHabitCategory').value = habit.category || 'focus';

  document.getElementById('editHabitModal').classList.remove('hidden');
  document.getElementById('editHabitModal').classList.add('flex');
}

function closeEditHabitModal() {
  document.getElementById('editHabitModal').classList.add('hidden');
  document.getElementById('editHabitModal').classList.remove('flex');
}

function handleSaveEditedHabit(e) {
  e.preventDefault();
  const p = getCurrentProfile();
  const id = document.getElementById('editHabitId').value;
  const habit = p.habits.find(h => h.id === id);
  if (!habit) return;

  habit.title = document.getElementById('editHabitTitle').value.trim();
  habit.category = document.getElementById('editHabitCategory').value;

  closeEditHabitModal();
  saveLocalState();
  renderHabitsMatrix();
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
