// ===================================================================
// MISSION 80K - Multi-Profile State & Real-Time Sync Engine
// Profiles: Kinnan, Madhav, Allen Joy
// Inspired by Noomo Agency & Lusion.co
// ===================================================================

const DEFAULT_PROFILES = {
  kinnan: {
    id: 'kinnan',
    name: 'Kinnan',
    avatar: '⚡',
    badge: 'OPERATIVE 01',
    themeColor: 'indigo',
    missionTarget: 80000,
    totalSaved: 15600,
    chosenReward: 'iphone',
    deadline: '2026-12-31',
    streak: 4,
    transactions: [
      { id: 'tx-k1', amount: 5000, note: 'Initial Mission starter', date: '2026-09-20', goal: 'iphone' },
      { id: 'tx-k2', amount: 2600, note: 'Freelance design gig', date: '2026-09-22', goal: 'iphone' },
      { id: 'tx-k3', amount: 8000, note: 'Monthly savings commitment', date: '2026-09-24', goal: 'iphone' }
    ],
    tasks: [
      { id: 'tk-1', title: '💰 Saved ₹300 today (Skipped takeout & outside food)', category: 'saving', completed: true },
      { id: 'tk-2', title: '🚫 Zero impulse shopping or online cart checkouts', category: 'habit', completed: true },
      { id: 'tk-3', title: '💻 1 Hour dedicated skill building / side project', category: 'work', completed: true },
      { id: 'tk-4', title: '🔍 Researched iPhone festive discount cards', category: 'work', completed: false },
      { id: 'tk-5', title: '💧 Drank 2.5L water & kept disciplined focus', category: 'habit', completed: false }
    ]
  },
  madhav: {
    id: 'madhav',
    name: 'Madhav',
    avatar: '💻',
    badge: 'OPERATIVE 02',
    themeColor: 'sky',
    missionTarget: 80000,
    totalSaved: 22000,
    chosenReward: 'macbook',
    deadline: '2027-01-31',
    streak: 5,
    transactions: [
      { id: 'tx-m1', amount: 10000, note: 'MacBook seed fund', date: '2026-09-18', goal: 'macbook' },
      { id: 'tx-m2', amount: 5000, note: 'Coding client milestone', date: '2026-09-21', goal: 'macbook' },
      { id: 'tx-m3', amount: 7000, note: 'Weekly discipline deposit', date: '2026-09-24', goal: 'macbook' }
    ],
    tasks: [
      { id: 'tm-1', title: '💻 2 Hours focused coding on revenue project', category: 'work', completed: true },
      { id: 'tm-2', title: '💰 Deposited ₹500 directly into MacBook fund', category: 'saving', completed: true },
      { id: 'tm-3', title: '🔍 Checked Apple Student discount & trade-in values', category: 'work', completed: true },
      { id: 'tm-4', title: '🚫 No unnecessary gadget accessory purchases', category: 'habit', completed: false },
      { id: 'tm-5', title: '⚡ Read 20 pages of tech architecture', category: 'work', completed: false }
    ]
  },
  allen: {
    id: 'allen',
    name: 'Allen Joy',
    avatar: '🏖️',
    badge: 'OPERATIVE 03',
    themeColor: 'emerald',
    missionTarget: 80000,
    totalSaved: 18500,
    chosenReward: 'goa',
    deadline: '2026-11-20',
    streak: 3,
    transactions: [
      { id: 'tx-a1', amount: 6000, note: 'Flight deposit fund', date: '2026-09-19', goal: 'goa' },
      { id: 'tx-a2', amount: 4500, note: 'Resort stay allocation', date: '2026-09-22', goal: 'goa' },
      { id: 'tx-a3', amount: 8000, note: 'Goa experience pool', date: '2026-09-24', goal: 'goa' }
    ],
    tasks: [
      { id: 'ta-1', title: '🌴 Researched flight deals to Dabolim / Mopa airport', category: 'work', completed: true },
      { id: 'ta-2', title: '💰 Saved ₹400 on daily transport & lunch', category: 'saving', completed: true },
      { id: 'ta-3', title: '🛵 Planned South Goa scooty itinerary (Palolem / Agonda)', category: 'work', completed: false },
      { id: 'ta-4', title: '🚫 Zero weekend impulse spending', category: 'habit', completed: false },
      { id: 'ta-5', title: '💧 Morning run & health discipline', category: 'habit', completed: false }
    ]
  }
};

const REWARD_INFO = {
  iphone: { title: 'iPhone Newest Pro Max', icon: '📱', color: 'purple' },
  macbook: { title: 'MacBook Pro M-Series', icon: '💻', color: 'sky' },
  goa: { title: 'Trip to Goa (Sun & Freedom)', icon: '🏖️', color: 'emerald' }
};

let appState = {
  version: 2,
  currency: 'INR',
  activeProfile: 'kinnan',
  syncRoom: 'GOAL-2341',
  profiles: JSON.parse(JSON.stringify(DEFAULT_PROFILES)),
  lastUpdated: Date.now()
};

let selectedDateStr = new Date().toISOString().split('T')[0];
let isSyncing = false;

// ===================================================================
// AUDIO SYNTHESIZER
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
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    osc.frequency.exponentialRampToValueAtTime(987.77, ctx.currentTime + 0.12); // B5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {}
}

function playFanfare() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const st = ctx.currentTime + i * 0.1;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.2, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(st);
      osc.stop(st + 0.3);
    });
  } catch (e) {}
}

// ===================================================================
// INITIALIZATION
// ===================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initAmbientCanvas();
  loadLocalState();
  handleUrlParams();
  
  // Check if profile was previously selected
  const savedProfile = localStorage.getItem('goalquest_active_profile');
  if (savedProfile && appState.profiles[savedProfile]) {
    appState.activeProfile = savedProfile;
    document.getElementById('profileGateScreen').classList.add('hidden');
  }

  renderApp();
  initSyncInput();
  lucide.createIcons();

  // Pull latest multi-profile state from Upstash cloud
  await pullFromCloud();

  // Setup auto-polling every 8s for live real-time sync across devices
  setInterval(() => {
    if (!document.hidden && !isSyncing) {
      pullFromCloud(true);
    }
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
      // Migrate old single-user format if detected
      if (parsed.profiles) {
        appState = { ...appState, ...parsed };
      } else if (parsed.totalSaved !== undefined) {
        // Migrate old state to Kinnan's profile so no saved funds are lost!
        appState.profiles.kinnan.totalSaved = parsed.totalSaved;
        if (parsed.transactions && parsed.transactions.length > 0) {
          appState.profiles.kinnan.transactions = parsed.transactions;
        }
        if (parsed.tasks && parsed.tasks.length > 0) {
          appState.profiles.kinnan.tasks = parsed.tasks;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load local state:', e);
  }
}

function saveLocalState(triggerCloud = true) {
  try {
    appState.lastUpdated = Date.now();
    localStorage.setItem('goalquest_state', JSON.stringify(appState));
    if (triggerCloud) {
      syncToCloudDebounced();
    }
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');
  if (room) {
    appState.syncRoom = room.toUpperCase().trim();
  }

  const profile = params.get('profile');
  if (profile && appState.profiles[profile]) {
    appState.activeProfile = profile;
    localStorage.setItem('goalquest_active_profile', profile);
    document.getElementById('profileGateScreen').classList.add('hidden');
  }
}

// ===================================================================
// PROFILE MANAGEMENT & GATE
// ===================================================================
function selectProfile(profileId) {
  if (!appState.profiles[profileId]) return;
  appState.activeProfile = profileId;
  localStorage.setItem('goalquest_active_profile', profileId);

  // Transition out gate
  const gate = document.getElementById('profileGateScreen');
  gate.style.opacity = '0';
  setTimeout(() => {
    gate.classList.add('hidden');
    gate.style.opacity = '1';
  }, 400);

  playTickSound();
  confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
  renderApp();
}

function openProfileGate() {
  const gate = document.getElementById('profileGateScreen');
  updateGateCards();
  gate.classList.remove('hidden');
  gate.style.opacity = '1';
  lucide.createIcons();
}

function updateGateCards() {
  const keys = ['kinnan', 'madhav', 'allen'];
  let squadTotal = 0;

  keys.forEach(k => {
    const p = appState.profiles[k];
    const pct = Math.min(100, (p.totalSaved / p.missionTarget) * 100);
    squadTotal += p.totalSaved;

    const rewardObj = REWARD_INFO[p.chosenReward] || { title: 'Reward Target' };
    const rEl = document.getElementById(`gateReward-${k}`);
    const pctEl = document.getElementById(`gatePercent-${k}`);
    const barEl = document.getElementById(`gateBar-${k}`);
    const sEl = document.getElementById(`gateSaved-${k}`);

    if (rEl) rEl.textContent = `Target: ${rewardObj.title}`;
    if (pctEl) pctEl.textContent = `${pct.toFixed(1)}%`;
    if (barEl) barEl.style.width = `${pct}%`;
    if (sEl) sEl.textContent = formatMoney(p.totalSaved);
  });

  const squadEl = document.getElementById('gateSquadTotal');
  if (squadEl) squadEl.textContent = formatMoney(squadTotal);
}

// ===================================================================
// CLOUD SYNC ENGINE (UPSTASH REDIS)
// ===================================================================
let syncDebounceTimer = null;
function syncToCloudDebounced() {
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    pushToCloud();
  }, 1000);
}

function updateSyncUI(status) {
  const dot = document.getElementById('syncStatusDot');
  const text = document.getElementById('syncStatusText');
  if (!dot || !text) return;

  switch (status) {
    case 'syncing':
      dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-spin';
      text.textContent = 'Syncing...';
      break;
    case 'synced':
      dot.className = 'w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse';
      text.textContent = `Cloud Synced (${appState.syncRoom})`;
      break;
    case 'local':
    default:
      dot.className = 'w-2 h-2 rounded-full bg-indigo-400';
      text.textContent = `Local (${appState.syncRoom})`;
      break;
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

        // Check if cloud data has the multi-profile structure
        if (cloudData.profiles) {
          if ((cloudData.lastUpdated || 0) > (appState.lastUpdated || 0)) {
            appState.profiles = cloudData.profiles;
            appState.lastUpdated = cloudData.lastUpdated;
            localStorage.setItem('goalquest_state', JSON.stringify(appState));
            renderApp();
          }
        } else if (cloudData.totalSaved !== undefined) {
          // Backward-compat: update Kinnan
          if (cloudData.totalSaved > appState.profiles.kinnan.totalSaved) {
            appState.profiles.kinnan.totalSaved = cloudData.totalSaved;
            if (cloudData.transactions) appState.profiles.kinnan.transactions = cloudData.transactions;
            renderApp();
          }
        }
        updateSyncUI('synced');
      } else {
        // Room empty on cloud, seed with current multi-profile data
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
  appState.lastUpdated = Date.now();

  try {
    const res = await fetch(`/api/sync?room=${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: appState, room: room })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) updateSyncUI('synced');
    } else {
      updateSyncUI('local');
    }
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

function getCurrentProfile() {
  return appState.profiles[appState.activeProfile] || appState.profiles.kinnan;
}

function renderApp() {
  renderNavbar();
  renderHeroMission();
  renderRewardCards();
  renderTransactions();
  renderPlanner();
  renderSquadLeaderboard();
  updateGateCards();
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

function renderHeroMission() {
  const p = getCurrentProfile();
  const target = p.missionTarget || 80000;
  const saved = p.totalSaved || 0;
  const pct = Math.min(100, Math.max(0, (saved / target) * 100));

  document.getElementById('heroOperativeName').textContent = `Operative: ${p.name}`;
  document.getElementById('heroSavedAmount').textContent = formatMoney(saved);
  document.getElementById('heroTargetAmount').textContent = formatMoney(target);
  document.getElementById('heroProgressPercentage').textContent = `${pct.toFixed(1)}%`;

  const remaining = Math.max(0, target - saved);
  document.getElementById('heroRemainingText').textContent = `${formatMoney(remaining)} to complete Mission 80K`;

  document.getElementById('heroProgressBar').style.width = `${pct}%`;

  const rewardObj = REWARD_INFO[p.chosenReward] || { title: 'Custom Goal' };
  document.getElementById('heroRewardTitle').textContent = rewardObj.title;

  // Pace calculations
  const daily60 = Math.ceil(remaining / 60);
  document.getElementById('paceDaily60').textContent = `${formatMoney(daily60)} / day`;

  const weekly90 = Math.ceil(remaining / (90 / 7));
  document.getElementById('paceWeekly').textContent = `${formatMoney(weekly90)} / week`;

  const daysLeft = Math.ceil(remaining / 500);
  document.getElementById('currentPaceText').textContent = remaining === 0 ? 'Mission Achieved! 🏆' : `~${daysLeft} days (@ ₹500/d)`;
}

function renderRewardCards() {
  const p = getCurrentProfile();
  ['iphone', 'macbook', 'goa'].forEach(k => {
    const card = document.getElementById(`rewardCard-${k}`);
    const badge = document.getElementById(`rewardBadge-${k}`);
    const isSelected = p.chosenReward === k;

    if (badge) {
      if (isSelected) {
        badge.textContent = 'ALLOCATED';
        badge.className = 'text-[10px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/50';
        card.classList.add('ring-2', 'ring-emerald-400/50', 'bg-white/[0.04]');
      } else {
        badge.textContent = 'Select';
        badge.className = 'text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-400';
        card.classList.remove('ring-2', 'ring-emerald-400/50', 'bg-white/[0.04]');
      }
    }
  });
}

function renderTransactions() {
  const p = getCurrentProfile();
  const container = document.getElementById('transactionsList');
  document.getElementById('profileTxTitle').textContent = `${p.name}'s Savings Log`;

  if (!p.transactions || p.transactions.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-slate-500 text-xs font-mono">
        No savings logged for ${p.name} yet. Tap "Log Savings" to deposit!
      </div>
    `;
    return;
  }

  const list = [...p.transactions].reverse();
  container.innerHTML = list.map(tx => `
    <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
          +
        </div>
        <div>
          <span class="text-xs font-semibold text-slate-200 block">${escapeHtml(tx.note || 'Savings Deposit')}</span>
          <span class="text-[10px] text-slate-500 font-mono-nums">${tx.date || 'Recently'}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm font-bold font-mono-nums text-emerald-400">+${formatMoney(tx.amount)}</span>
        <button onclick="deleteTransaction('${tx.id}')" title="Delete" class="text-slate-500 hover:text-rose-400 p-1 transition">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function renderPlanner() {
  const p = getCurrentProfile();
  const dateDisplay = document.getElementById('currentDateDisplay');
  const todayStr = new Date().toISOString().split('T')[0];
  dateDisplay.textContent = selectedDateStr === todayStr ? `Today (${selectedDateStr})` : selectedDateStr;

  const container = document.getElementById('taskListContainer');
  const tasks = p.tasks || [];
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  document.getElementById('dailyCompletionRatio').textContent = `${completedCount} of ${totalCount} completed (${Math.round(pct)}%)`;
  document.getElementById('todayTasksPill').textContent = `${completedCount}/${totalCount}`;
  document.getElementById('dailyProgressBar').style.width = `${pct}%`;
  document.getElementById('streakCount').textContent = `${p.streak || 0} Day Streak`;

  container.innerHTML = tasks.map((task, idx) => {
    const isDone = task.completed;
    return `
      <div class="lusion-card p-3.5 rounded-xl border border-white/5 flex items-center justify-between gap-3 group transition hover:border-white/10 ${isDone ? 'bg-black/30' : ''}">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <input 
            type="checkbox" 
            class="lusion-tick flex-shrink-0" 
            ${isDone ? 'checked' : ''} 
            onchange="toggleTask(${idx})"
          >
          <div class="min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium ${isDone ? 'task-done-strike text-slate-500' : 'text-slate-200'} truncate">
              ${escapeHtml(task.title)}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10 uppercase">
            ${task.category || 'todo'}
          </span>
          <button onclick="deleteTask(${idx})" class="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderSquadLeaderboard() {
  const container = document.getElementById('squadLeaderboardList');
  if (!container) return;

  const profilesArr = Object.values(appState.profiles).sort((a, b) => {
    const pctA = a.totalSaved / a.missionTarget;
    const pctB = b.totalSaved / b.missionTarget;
    return pctB - pctA; // Rank 1 is highest percentage
  });

  container.innerHTML = profilesArr.map((prof, rank) => {
    const pct = Math.min(100, (prof.totalSaved / prof.missionTarget) * 100);
    const rewardObj = REWARD_INFO[prof.chosenReward] || { title: 'Target' };
    const isMe = prof.id === appState.activeProfile;

    return `
      <div class="lusion-card p-5 rounded-2xl border ${isMe ? 'border-indigo-500/50 bg-indigo-950/20' : 'border-white/10'} flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <span class="text-lg font-mono font-extrabold text-slate-400">#${rank + 1}</span>
          <div class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
            ${prof.avatar}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-base text-white font-display">${prof.name}</h4>
              ${isMe ? '<span class="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300">YOU</span>' : ''}
            </div>
            <span class="text-xs text-slate-400">Aiming for: <strong class="text-slate-200">${rewardObj.title}</strong></span>
          </div>
        </div>

        <div class="flex-1 max-w-xs space-y-1.5">
          <div class="flex items-center justify-between text-xs font-mono-nums">
            <span class="text-slate-400">${formatMoney(prof.totalSaved)} / ₹80,000</span>
            <span class="text-emerald-400 font-bold">${pct.toFixed(1)}%</span>
          </div>
          <div class="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" style="width: ${pct}%;"></div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="selectProfile('${prof.id}')" class="px-3 py-1.5 rounded-lg lusion-pill text-xs font-medium hover:text-white transition">
            View Operative
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ===================================================================
// USER ACTIONS (TICK, DEPOSIT, GOAL)
// ===================================================================
function toggleTask(index) {
  const p = getCurrentProfile();
  const task = p.tasks[index];
  if (!task) return;

  task.completed = !task.completed;
  if (task.completed) playTickSound();

  const allDone = p.tasks.every(t => t.completed);
  if (allDone && p.tasks.length > 0) {
    playFanfare();
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    p.streak = (p.streak || 0) + 1;
  }

  saveLocalState();
  renderPlanner();
  lucide.createIcons();
}

function handleAddTask(e) {
  e.preventDefault();
  const p = getCurrentProfile();
  const input = document.getElementById('newTaskInput');
  const cat = document.getElementById('newTaskCategory');
  const title = input.value.trim();
  if (!title) return;

  p.tasks.push({
    id: 't-' + Date.now(),
    title: title,
    category: cat ? cat.value : 'todo',
    completed: false
  });

  input.value = '';
  saveLocalState();
  renderPlanner();
  lucide.createIcons();
}

function deleteTask(index) {
  const p = getCurrentProfile();
  p.tasks.splice(index, 1);
  saveLocalState();
  renderPlanner();
  lucide.createIcons();
}

function setChosenReward(rewardKey) {
  const p = getCurrentProfile();
  p.chosenReward = rewardKey;
  saveLocalState();
  renderApp();
  confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
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
    date: new Date().toISOString().split('T')[0],
    goal: p.chosenReward
  };

  p.totalSaved = (p.totalSaved || 0) + amount;
  if (!p.transactions) p.transactions = [];
  p.transactions.push(newTx);

  if (p.totalSaved >= p.missionTarget) {
    playFanfare();
    confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
  } else {
    playTickSound();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
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

// Navigation & Modals
function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.className = 'nav-tab px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-white/5';
  });
  const activeBtn = document.getElementById(`nav-btn-${tabId}`);
  if (activeBtn) {
    activeBtn.className = 'nav-tab px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30';
  }

  const navKeys = ['tracker', 'planner', 'squad', 'sync'];
  navKeys.forEach(k => {
    const el = document.getElementById(`mobile-nav-${k}`);
    if (el) {
      el.className = k === tabId ? 'flex flex-col items-center gap-1 text-indigo-400 p-1 text-xs' : 'flex flex-col items-center gap-1 text-slate-400 p-1 text-xs';
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changeDate(delta) {
  const current = new Date(selectedDateStr);
  current.setDate(current.getDate() + delta);
  selectedDateStr = current.toISOString().split('T')[0];
  renderPlanner();
}

function goToToday() {
  selectedDateStr = new Date().toISOString().split('T')[0];
  renderPlanner();
}

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
      size: 200,
      background: '#ffffff',
      foreground: '#05070d',
      level: 'M'
    });
  } catch (e) {}
}

function copyMobileSyncLink() {
  const baseUrl = window.location.origin + window.location.pathname;
  const mobileUrl = `${baseUrl}?room=${appState.syncRoom}&profile=${appState.activeProfile}`;

  navigator.clipboard.writeText(mobileUrl).then(() => {
    const btn = document.getElementById('copyLinkBtnText');
    btn.textContent = 'Copied to Clipboard!';
    setTimeout(() => btn.textContent = 'Copy Shareable Mobile Link', 2500);
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

function copyGoaPackingList() {
  const text = `🌴 Goa Trip Essentials (Mission 80K):
1. Driving License for Scooty rental
2. Sunglasses & SPF 50+ Sunscreen
3. Linen shirts & quick-dry shorts
4. Waterproof phone bag
5. Power bank for coastal rides
6. Cash & UPI combo for beach shacks`;
  navigator.clipboard.writeText(text).then(() => alert('Goa Checklist copied!'));
}

function exportDataJson() {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mission-80k-squad-backup-${new Date().toISOString().split('T')[0]}.json`;
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
      if (parsed.profiles) {
        appState = { ...appState, ...parsed };
        saveLocalState();
        renderApp();
        alert('All profiles successfully restored from backup!');
      }
    } catch (err) {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

// ===================================================================
// LUSION / NOOMO AMBIENT GENERATIVE CANVAS (Zero overhead, smooth 60fps)
// ===================================================================
function initAmbientCanvas() {
  const canvas = document.getElementById('ambientCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Subtle luminous floating orbs
  const orbs = [
    { x: width * 0.2, y: height * 0.3, radius: 240, vx: 0.25, vy: 0.15, color: 'rgba(99, 102, 241, 0.08)' },
    { x: width * 0.8, y: height * 0.6, radius: 320, vx: -0.2, vy: -0.25, color: 'rgba(14, 165, 233, 0.06)' },
    { x: width * 0.5, y: height * 0.85, radius: 280, vx: 0.18, vy: -0.12, color: 'rgba(16, 185, 129, 0.05)' }
  ];

  function animate() {
    ctx.clearRect(0, 0, width, height);

    orbs.forEach(orb => {
      orb.x += orb.vx;
      orb.y += orb.vy;

      if (orb.x < -100 || orb.x > width + 100) orb.vx *= -1;
      if (orb.y < -100 || orb.y > height + 100) orb.vy *= -1;

      const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
      grad.addColorStop(0, orb.color);
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }
  animate();
}
