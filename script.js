/* Firebase v8 compat — 設定見 firebase-config.js，初始化見 firebase-init.js */
(function () {
  "use strict";

  const db = window.__firebaseDb || null;

  const APP_BUILD_VERSION = "90";

  const STORAGE_KEY = "classroom-dashboard-v1";
  const GROUPS_STORAGE_KEY = "classroom-dashboard-groups-v1";
  const TIMER_MINUTE_CUE_STORAGE_KEY = "classroom-dashboard-timer-minute-cue-v1";
  const DEFAULT_SLOT_COUNT = 22;
  const MIN_SLOT_COUNT = 1;
  const MAX_SLOT_COUNT = 40;
  const DEFAULT_GARDEN_NAME = "欣賞園地";
  const DEFAULT_NAME = "待命名";
  const DEFAULT_EMOJI = "😄";
  const EMOJI_SCORE_UP = "😍";
  const EMOJI_SAD = "😢";
  const EMOJI_SLEEP = "😴";
  const EMOJI_SCORE_DOWN = "😱";
  const EMOJI_REACTION_MS = 10000;
  const SCORE_MIN = 0;
  const SCORE_MAX = 999;
  const LIVES_MAX = 3;
  const LIVES_DEFAULT = 3;
  const HATCH_THRESHOLD = 20;
  const CLASS_PROGRESS_TIER_SIZE = 500;
  const CLASS_PROGRESS_META_KEY = "classroom-class-progress-meta-v1";
  const DAILY_SCORE_STORAGE_KEY = "classroom-daily-score-log-v1";
  const BACKUP_ARCHIVE_VERSION = 1;
  const CLASS_SAVECODE_PREFIX = "AI-BK1:";
  const TEACHER_PASSWORD = "1234";
  const SITE_ACCESS_PASSWORD = "2756";
  const SITE_ACCESS_SESSION_KEY = "classroom-site-access-ok-v1";
  const CLASS_CODE_STORAGE_KEY = "classroom-class-code-v1";
  const GROWTH_JOURNAL_DAYS = 7;

  /** 23 種動物（與 models/animal-*.glb 檔名一致）：1~22 號依序對應前 22 種 */
  const ANIMALS = [
    "beaver",
    "bee",
    "bunny",
    "cat",
    "caterpillar",
    "chick",
    "cow",
    "crab",
    "deer",
    "dog",
    "elephant",
    "fish",
    "fox",
    "giraffe",
    "tiger", // 15 號固定為 tiger
    "koala",
    "lion",
    "monkey",
    "panda",
    "parrot",
    "penguin",
    "polar",
    "hog",
  ];

  /** 更改動物選單中不顯示的物種（仍可用於預設分配） */
  const ANIMALS_HIDDEN_FROM_PICKER = ["hog"];

  const IDLE_ANIM = "idle";
  const IDLE_PHASE_MS = 10000;
  const SPECIAL_PHASE_MS = 2500;
  const SPECIAL_ANIMATIONS = [
    "run",
    "walk",
    "eat",
    "dance",
    "gesture-positive",
    "gesture-negative",
    "static",
    "jump",
  ];

  const QUICK_ADD_VALUES = [1, 2, 3, 4, 5];
  // 繽紛鮮明漸層（半透明 + 磨砂），適合低年級、襯托 3D 動物
  const SLOT_GRADIENTS = [
    "linear-gradient(145deg, rgba(255, 107, 129, 0.55) 0%, rgba(255, 183, 77, 0.55) 100%)",
    "linear-gradient(145deg, rgba(77, 208, 255, 0.55) 0%, rgba(92, 124, 250, 0.55) 100%)",
    "linear-gradient(145deg, rgba(105, 240, 174, 0.55) 0%, rgba(56, 203, 137, 0.55) 100%)",
    "linear-gradient(145deg, rgba(255, 238, 88, 0.55) 0%, rgba(255, 171, 64, 0.55) 100%)",
    "linear-gradient(145deg, rgba(206, 147, 255, 0.55) 0%, rgba(151, 117, 250, 0.55) 100%)",
    "linear-gradient(145deg, rgba(255, 158, 205, 0.55) 0%, rgba(255, 107, 180, 0.55) 100%)",
    "linear-gradient(145deg, rgba(72, 219, 251, 0.55) 0%, rgba(0, 184, 148, 0.55) 100%)",
    "linear-gradient(145deg, rgba(255, 159, 67, 0.55) 0%, rgba(255, 99, 132, 0.55) 100%)",
    "linear-gradient(145deg, rgba(162, 155, 254, 0.55) 0%, rgba(116, 185, 255, 0.55) 100%)",
    "linear-gradient(145deg, rgba(255, 217, 61, 0.55) 0%, rgba(255, 107, 107, 0.55) 100%)",
    "linear-gradient(145deg, rgba(129, 236, 236, 0.55) 0%, rgba(116, 185, 255, 0.55) 100%)",
    "linear-gradient(145deg, rgba(255, 154, 162, 0.55) 0%, rgba(250, 177, 160, 0.55) 100%)",
  ];

  const ANIMAL_LABELS = {
    beaver: "河狸",
    bee: "蜜蜂",
    bunny: "兔子",
    cat: "小貓",
    caterpillar: "毛毛蟲",
    chick: "小雞",
    cow: "乳牛",
    crab: "螃蟹",
    deer: "小鹿",
    dog: "小狗",
    elephant: "大象",
    fish: "小魚",
    fox: "狐狸",
    giraffe: "長頸鹿",
    tiger: "老虎",
    koala: "無尾熊",
    lion: "獅子",
    monkey: "猴子",
    panda: "熊貓",
    parrot: "鸚鵡",
    penguin: "企鵝",
    polar: "北極熊",
    hog: "小豬",
  };

  const LUCKY_DRAW_MS = 3340;
  const LUCKY_DRAW_TICK_MS = 120;

  const gridEl = document.getElementById("dashboard-grid");
  const btnTeacherMode = document.getElementById("btn-teacher-mode");

  function canLoadGlbAssets() {
    const protocol = window.location.protocol;
    return protocol === "http:" || protocol === "https:";
  }

  let slots = [];
  let gardenDisplayName = DEFAULT_GARDEN_NAME;

  function getSlotCount() {
    return slots.length;
  }

  function isValidSlotCount(n) {
    return Number.isInteger(n) && n >= MIN_SLOT_COUNT && n <= MAX_SLOT_COUNT;
  }
  let teacherMode = false;
  let animCycleTimeoutId = null;
  let activeScoreMenuSlotId = null;
  let activeGroupScoreMenuId = null;
  let animalPickSlotId = null;
  let activeGroupMembersModalId = null;

  let webAudioCtx = null;
  let luckyDrawRunning = false;
  let luckyDrawTimerId = null;
  let luckyDrawSuspenseTimer = null;
  let luckyDrawFlashId = null;
  let luckyDrawWinnerIds = [];

  let timerMode = "stopwatch";
  let timerRunning = false;
  let timerIntervalId = null;
  let stopwatchElapsedMs = 0;
  let stopwatchStartTs = 0;
  let countdownRemainingMs = 0;
  let countdownEndTs = 0;
  let timerAlarmPlayed = false;
  let timerAlarmActive = false;
  let timerAlarmAudio = null;
  let timerAlarmIntervalId = null;
  let countdownInitialMs = 0;
  let countdownMinuteThresholds = [];
  let countdownMinuteCuesPlayed = [];
  let timerMinuteCueEnabled = true;
  let timerExpanded = false;
  let timerMiniVisible = false;
  let timerMiniUserMoved = false;
  let bulkSelectedIds = [];
  let bulkPickActive = false;
  let bulkSuccessIds = [];
  const SCORE_UNDO_MAX = 50;
  let scoreUndoStack = [];
  let classProgressCelebratedThresholds = [];
  let classProgressPrevTotal = null;
  let classProgressBootstrapped = false;
  let dailyScorePack = null;
  const slotEmojiTimers = {};
  let dailyMissionDrawRunning = false;
  let missionConfettiTimerId = null;
  let classProgressCelebrationFxTimerId = null;
  let currentDailyMission = null;
  let missionReminderVisible = false;
  let dailyMissionDrawCommitted = false;
  const scoreKingMission = {
    active: false,
    sessionScore: 0,
  };

  const MISSION_SCORE_GOAL = 30;
  const MISSION_CLASS_BONUS = 3;
  const MISSION_ROLL_MS = 2500;
  const MISSION_DEFAULT_REWARD = "全班可加 3 分！";

  const DAILY_MISSIONS = [
    {
      id: "harvest",
      title: "收穫滿滿",
      desc: "課堂完結時，如果有同學分享這節課學會了哪些新知識。",
      reward: MISSION_DEFAULT_REWARD,
    },
    {
      id: "praise",
      title: "讚不絕口",
      desc: "這節課裏，如果同學的上課表現能讓老師不斷稱讚。",
      reward: MISSION_DEFAULT_REWARD,
    },
    {
      id: "active",
      title: "積極學習",
      desc: "這節課裏，所有同學都積極舉手回答問題。",
      reward: MISSION_DEFAULT_REWARD,
    },
    {
      id: "rules",
      title: "認真守規",
      desc: "這節課裏，如果所有同學都聽從老師指令。",
      reward: MISSION_DEFAULT_REWARD,
    },
    {
      id: "scoreKing",
      title: "誰是得分王",
      type: "scoreKing",
      desc: "這節課裏，如果全班取得超過 " + MISSION_SCORE_GOAL + " 分。",
      reward: MISSION_DEFAULT_REWARD,
    },
  ];

  function getClassTotalScore() {
    return slots.reduce(function (sum, s) {
      const n = typeof s.score === "number" ? s.score : 0;
      return sum + n;
    }, 0);
  }

  function computeClassProgressTier(total) {
    const tierSize = CLASS_PROGRESS_TIER_SIZE;
    const safeTotal = Math.max(0, total);
    const level = Math.floor(safeTotal / tierSize) + 1;
    const minScore = (level - 1) * tierSize;
    const maxScore = level * tierSize;
    const pct =
      tierSize > 0 ? ((safeTotal - minScore) / tierSize) * 100 : 0;
    return {
      level: level,
      minScore: minScore,
      maxScore: maxScore,
      pct: Math.min(100, Math.max(0, pct)),
    };
  }

  function loadClassProgressMeta() {
    classProgressCelebratedThresholds = [];
  }

  function saveClassProgressMeta() {
    scheduleCloudSync();
  }

  function bootstrapClassProgressTracking(total) {
    if (classProgressBootstrapped) return;
    classProgressBootstrapped = true;
    classProgressPrevTotal = total;
    for (
      let t = CLASS_PROGRESS_TIER_SIZE;
      t <= total;
      t += CLASS_PROGRESS_TIER_SIZE
    ) {
      if (classProgressCelebratedThresholds.indexOf(t) < 0) {
        classProgressCelebratedThresholds.push(t);
      }
    }
    saveClassProgressMeta();
  }

  function checkClassProgressCelebration(prevTotal, newTotal) {
    if (!classProgressBootstrapped) return;
    let highestNewThreshold = null;
    for (
      let t = CLASS_PROGRESS_TIER_SIZE;
      t <= newTotal;
      t += CLASS_PROGRESS_TIER_SIZE
    ) {
      if (prevTotal < t && newTotal >= t) {
        highestNewThreshold = t;
      }
    }
    if (highestNewThreshold === null) {
      classProgressPrevTotal = newTotal;
      return;
    }
    for (
      let t = CLASS_PROGRESS_TIER_SIZE;
      t <= highestNewThreshold;
      t += CLASS_PROGRESS_TIER_SIZE
    ) {
      if (classProgressCelebratedThresholds.indexOf(t) < 0) {
        classProgressCelebratedThresholds.push(t);
      }
    }
    saveClassProgressMeta();
    showClassProgressCelebration(highestNewThreshold);
    classProgressPrevTotal = newTotal;
  }

  function playClassCelebrationSound() {
    playLuckyDrawSound();
  }

  function showClassProgressCelebration(threshold) {
    const modal = document.getElementById("class-progress-celebration-modal");
    if (!modal) return;
    const level = Math.floor(threshold / CLASS_PROGRESS_TIER_SIZE);
    const titleEl = document.getElementById("class-progress-celebration-title");
    const messageEl = document.getElementById(
      "class-progress-celebration-message"
    );
    if (titleEl) {
      titleEl.textContent = "🎉 全班總得分突破" + threshold + "分！ 🎉";
    }
    if (messageEl) {
      messageEl.innerHTML =
        "恭喜全班晉升到LV." +
        level + 
        "！<br />加油！向LV." +
        (level + 1) +
        "進發！";
    }
    modal.hidden = false;
    document.body.classList.add("class-progress-celebration-open");
    launchClassProgressCelebrationFx();
    playClassCelebrationSound();
  }

  function closeClassProgressCelebration() {
    const modal = document.getElementById("class-progress-celebration-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("class-progress-celebration-open");
    stopClassProgressCelebrationFx();
  }

  function stopClassProgressCelebrationFx() {
    if (classProgressCelebrationFxTimerId !== null) {
      clearInterval(classProgressCelebrationFxTimerId);
      classProgressCelebrationFxTimerId = null;
    }
    const layer = document.getElementById("class-progress-celebration-fx");
    if (layer) layer.innerHTML = "";
  }

  function launchClassProgressCelebrationFx() {
    const layer = document.getElementById("class-progress-celebration-fx");
    if (!layer) return;
    stopClassProgressCelebrationFx();
    const colors = ["#fde047", "#f97316", "#ec4899", "#38bdf8", "#a78bfa", "#22c55e"];
    classProgressCelebrationFxTimerId = setInterval(function () {
      for (let i = 0; i < 12; i++) {
        const isRibbon = Math.random() < 0.3;
        const piece = document.createElement("span");
        piece.className =
          "class-progress-celebration-fx__piece " +
          (isRibbon
            ? "class-progress-celebration-fx__piece--ribbon"
            : "class-progress-celebration-fx__piece--confetti");
        piece.style.left = Math.random() * 100 + "%";
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.setProperty("--fx-drift", Math.round((Math.random() - 0.5) * 220) + "px");
        piece.style.animationDuration =
          (isRibbon ? 3.8 : 2.8) + Math.random() * (isRibbon ? 1.8 : 1.6) + "s";
        piece.style.animationDelay = Math.random() * 0.32 + "s";
        layer.appendChild(piece);
        setTimeout(function () {
          piece.remove();
        }, 6200);
      }
    }, 210);
  }

  function initClassProgressUI() {
    const closeBtn = document.getElementById("btn-class-progress-celebration-close");
    const modal = document.getElementById("class-progress-celebration-modal");
    if (closeBtn) {
      closeBtn.addEventListener("click", closeClassProgressCelebration);
    }
    if (modal) {
      modal.addEventListener("click", function (ev) {
        if (ev.target === modal) closeClassProgressCelebration();
      });
    }
  }

  function saveDailyScoreLog(pack) {
    dailyScorePack = pack;
    try {
      localStorage.setItem(DAILY_SCORE_STORAGE_KEY, JSON.stringify(pack));
    } catch (e) {}
    updateClassProgress();
    scheduleCloudSync();
  }

  function loadDailyScoreLog() {
    const today = todayDateKey();
    let pack = dailyScorePack;

    if (!pack || !Array.isArray(pack.history)) {
      try {
        const raw = localStorage.getItem(DAILY_SCORE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            pack = parsed;
          }
        }
      } catch (e) {}
    }

    if (!pack || !Array.isArray(pack.history)) {
      pack = { currentDate: today, todayScore: 0, history: [] };
    }

    if (typeof pack.todayScore !== "number") {
      pack.todayScore = 0;
    }
    if (!Array.isArray(pack.history)) {
      pack.history = [];
    }

    if (pack.currentDate !== today) {
      if (pack.currentDate && pack.todayScore > 0) {
        const prev = pack.history.find(function (entry) {
          return entry.date === pack.currentDate;
        });
        if (prev) {
          prev.score = pack.todayScore;
        } else {
          pack.history.unshift({
            date: pack.currentDate,
            score: pack.todayScore,
          });
        }
      }
      pack.currentDate = today;
      pack.todayScore = 0;
      saveDailyScoreLog(pack);
      return pack;
    }

    dailyScorePack = pack;
    return pack;
  }

  function getTodayClassScore() {
    const pack = dailyScorePack || loadDailyScoreLog();
    return typeof pack.todayScore === "number" ? pack.todayScore : 0;
  }

  function recordDailyScoreChange(delta) {
    if (!Number.isFinite(delta) || delta === 0) return;
    const pack = loadDailyScoreLog();
    const next = (pack.todayScore || 0) + Math.floor(delta);
    pack.todayScore = Math.max(0, next);
    saveDailyScoreLog(pack);
    if (delta > 0) {
      notifyMissionScoreGain(delta);
    }
  }

  function updateClassProgress() {
    const total = getClassTotalScore();
    const tier = computeClassProgressTier(total);
    const todayScore = getTodayClassScore();
    const prevTotal =
      classProgressPrevTotal == null ? total : classProgressPrevTotal;

    bootstrapClassProgressTracking(total);

    const label = document.getElementById("class-progress-label");
    const bar = document.getElementById("class-progress-bar");
    const dailyEl = document.getElementById("class-progress-daily");
    const track = document.querySelector(".class-progress-track");

    if (label) {
      label.textContent =
        "全班總得分 (Lv." +
        tier.level +
        ")：" +
        total +
        " / " +
        tier.maxScore;
    }
    if (dailyEl) {
      dailyEl.textContent = "今日全班得分：" + todayScore;
    }
    if (bar) {
      bar.style.width = tier.pct + "%";
      bar.setAttribute("aria-valuenow", String(Math.round(tier.pct)));
    }
    if (track) {
      track.setAttribute("aria-valuemin", String(tier.minScore));
      track.setAttribute("aria-valuemax", String(tier.maxScore));
      track.setAttribute("aria-valuenow", String(total));
    }

    checkClassProgressCelebration(prevTotal, total);
  }
  let bulkSuccessTimerId = null;
  let bulkUiBindingsDone = false;
  let groups = [];
  let scoreToastTimeoutId = null;
  let groupPanelInitialized = false;

  let currentClassCode = "";
  let cloudListenerRef = null;
  let cloudSyncTimerId = null;
  let cloudSyncSuspended = false;
  let appBootstrapped = false;
  let lastCloudWriteAt = 0;
  let classCodeModalCallback = null;
  let connectGeneration = 0;

  function updateBuildVersionBadge() {
    const badge = document.querySelector(".build-version-badge");
    if (badge) badge.textContent = "v" + APP_BUILD_VERSION;
  }

  function getDb() {
    return db || window.__firebaseDb || null;
  }

  function ensureFirebaseReady() {
    if (window.__firebaseInitError) {
      return Promise.reject(new Error(window.__firebaseInitError));
    }
    if (window.__firebaseReady) {
      return window.__firebaseReady;
    }
    var existing = getDb();
    if (existing) return Promise.resolve(existing);
    return Promise.reject(new Error("Firebase 尚未初始化。"));
  }

  function formatFirebaseConnectionError(err) {
    const code = err && err.code;
    const msg = err && err.message ? String(err.message) : "";
    if (
      code === "PERMISSION_DENIED" ||
      msg.indexOf("permission_denied") >= 0 ||
      msg.indexOf("Permission denied") >= 0
    ) {
      return (
        "雲端拒絕存取（Permission denied）。\n" +
        "請至 Firebase 主控台：\n" +
        "1. Authentication → 登入方法 → 啟用「匿名」\n" +
        "2. Realtime Database → 規則 → 設為 auth != null 或暫時設 read/write: true"
      );
    }
    if (code === "NETWORK_ERROR" || msg.indexOf("network") >= 0) {
      return "無法連接雲端，請檢查網路連線。";
    }
    if (window.__firebaseInitError) {
      return window.__firebaseInitError;
    }
    return "無法連接雲端，請確認 firebase-config.js 的 databaseURL 與網路。";
  }

  function sanitizeClassCode(raw) {
    return String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
  }

  function setCloudSyncStatus(text, isError) {
    const statusEl = document.getElementById("class-code-sync-status");
    const hintEl = document.getElementById("class-code-sync-hint");
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.classList.toggle("is-error", !!isError);
    }
    if (hintEl) {
      hintEl.textContent = text;
      hintEl.classList.toggle("is-error", !!isError);
    }
  }

  function normalizeCloudSlots(raw) {
    if (Array.isArray(raw)) return raw;
    if (!raw || typeof raw !== "object") return null;
    return Object.keys(raw)
      .filter(function (k) {
        return /^\d+$/.test(k);
      })
      .sort(function (a, b) {
        return parseInt(a, 10) - parseInt(b, 10);
      })
      .map(function (k) {
        return raw[k];
      });
  }

  function coerceCloudNumber(v, fallback) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
    return fallback;
  }

  function serializeSlotsForCloud() {
    const source = slots.length ? slots : createDefaultSlots();
    return source.map(function (s) {
      return {
        id: s.id,
        name: s.name,
        hatched: !!s.hatched,
        animal: s.animal,
        score: clampScore(s.score),
        lives: clampLives(s.lives),
        beamHueBase: normalizeBeamHueBase(s.beamHueBase, s.id),
        history: normalizeScoreHistory(s.history),
      };
    });
  }

  function parseSlotsFromCloud(rawSlots) {
    const list = normalizeCloudSlots(rawSlots);
    if (!list || !isValidSlotCount(list.length)) {
      return createDefaultSlots();
    }
    return list
      .map(function (s, i) {
      const id = i + 1;
      const savedAnimal = s.animal;
      const savedScore = coerceCloudNumber(s.score, 0);
      return {
        id: id,
        name: s.name || DEFAULT_NAME,
        hatched: !!s.hatched,
        animal:
          savedAnimal && isValidAnimal(savedAnimal)
            ? savedAnimal
            : animalForSlot(id),
        emoji: DEFAULT_EMOJI,
        score: clampScore(savedScore),
        lives: coerceCloudNumber(s.lives, LIVES_DEFAULT),
        beamHueBase: normalizeBeamHueBase(s.beamHueBase, id),
        history: normalizeScoreHistory(s.history),
      };
    }).map(function (slot) {
      fixLegacySlotAnimal(slot);
      return slot;
    });
  }

  function parseGroupsFromCloud(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(function (g, idx) {
      const memberIds = Array.isArray(g.memberIds)
        ? g.memberIds.filter(function (id) {
            return Number.isInteger(id) && id >= 1 && id <= getSlotCount();
          })
        : [];
      return {
        id: typeof g.id === "number" ? g.id : idx + 1,
        name:
          typeof g.name === "string" && g.name.trim()
            ? g.name.trim()
            : "組別 " + (idx + 1),
        memberIds: memberIds,
      };
    });
  }

  function findMissionById(id) {
    if (!id) return null;
    for (let i = 0; i < DAILY_MISSIONS.length; i++) {
      if (DAILY_MISSIONS[i].id === id) return DAILY_MISSIONS[i];
    }
    return null;
  }

  function applyMissionFromCloud(raw) {
    if (!raw || typeof raw !== "object") {
      currentDailyMission = null;
      missionReminderVisible = false;
      dailyMissionDrawCommitted = false;
      scoreKingMission.active = false;
      scoreKingMission.sessionScore = 0;
      return;
    }
    dailyMissionDrawCommitted = !!raw.dailyMissionDrawCommitted;
    missionReminderVisible = !!raw.missionReminderVisible;
    currentDailyMission = raw.currentDailyMissionId
      ? findMissionById(raw.currentDailyMissionId)
      : null;
    if (raw.scoreKingMission && typeof raw.scoreKingMission === "object") {
      scoreKingMission.active = !!raw.scoreKingMission.active;
      scoreKingMission.sessionScore =
        typeof raw.scoreKingMission.sessionScore === "number"
          ? Math.max(0, Math.floor(raw.scoreKingMission.sessionScore))
          : 0;
    } else {
      scoreKingMission.active = false;
      scoreKingMission.sessionScore = 0;
    }
    if (!missionReminderVisible) {
      currentDailyMission = null;
    }
  }

  function buildMissionForCloud() {
    return {
      currentDailyMissionId: currentDailyMission ? currentDailyMission.id : null,
      missionReminderVisible: missionReminderVisible,
      dailyMissionDrawCommitted: dailyMissionDrawCommitted,
      scoreKingMission: {
        active: scoreKingMission.active,
        sessionScore: scoreKingMission.sessionScore,
      },
    };
  }

  function applyDailyScorePackFromCloud(raw) {
    const today = todayDateKey();
    if (!raw || typeof raw !== "object") {
      if (!dailyScorePack) {
        dailyScorePack = { currentDate: today, todayScore: 0, history: [] };
      }
      return;
    }
    dailyScorePack = {
      currentDate: raw.currentDate || today,
      todayScore: typeof raw.todayScore === "number" ? raw.todayScore : 0,
      history: Array.isArray(raw.history) ? raw.history.slice() : [],
    };
    if (dailyScorePack.currentDate !== today) {
      if (dailyScorePack.currentDate && dailyScorePack.todayScore > 0) {
        const prev = dailyScorePack.history.find(function (entry) {
          return entry.date === dailyScorePack.currentDate;
        });
        if (prev) {
          prev.score = dailyScorePack.todayScore;
        } else {
          dailyScorePack.history.unshift({
            date: dailyScorePack.currentDate,
            score: dailyScorePack.todayScore,
          });
        }
      }
      dailyScorePack.currentDate = today;
      dailyScorePack.todayScore = 0;
    }
    try {
      localStorage.setItem(DAILY_SCORE_STORAGE_KEY, JSON.stringify(dailyScorePack));
    } catch (e) {}
  }

  function buildDefaultCloudData() {
    return {
      students: {
        slots: serializeSlotsForCloud(),
        updatedAt: Date.now(),
      },
      groups: [],
      classProgress: { celebratedThresholds: [] },
      dailyScore: {
        currentDate: todayDateKey(),
        todayScore: 0,
        history: [],
      },
      timerMinuteCue: "1",
      mission: {
        currentDailyMissionId: null,
        missionReminderVisible: false,
        dailyMissionDrawCommitted: false,
        scoreKingMission: { active: false, sessionScore: 0 },
      },
      classDisplay: {
        gardenName: DEFAULT_GARDEN_NAME,
      },
      updatedAt: Date.now(),
    };
  }

  /** 全新班級的空白雲端資料（不沿用記憶體或 localStorage） */
  function buildFreshCloudData() {
    return {
      students: {
        slots: createDefaultSlots().map(function (s) {
          return {
            id: s.id,
            name: s.name,
            hatched: !!s.hatched,
            animal: s.animal,
            score: clampScore(s.score),
            lives: clampLives(s.lives),
            beamHueBase: normalizeBeamHueBase(s.beamHueBase, s.id),
            history: {},
          };
        }),
        updatedAt: Date.now(),
      },
      groups: [],
      classProgress: { celebratedThresholds: [] },
      dailyScore: {
        currentDate: todayDateKey(),
        todayScore: 0,
        history: [],
      },
      timerMinuteCue: "1",
      mission: {
        currentDailyMissionId: null,
        missionReminderVisible: false,
        dailyMissionDrawCommitted: false,
        scoreKingMission: { active: false, sessionScore: 0 },
      },
      classDisplay: {
        gardenName: DEFAULT_GARDEN_NAME,
      },
      updatedAt: Date.now(),
    };
  }

  function resetClassSwitchSessionState() {
    scoreUndoStack = [];
    bulkPickActive = false;
    bulkSelectedIds = [];
    bulkSuccessIds = [];
    activeScoreMenuSlotId = null;
    activeGroupScoreMenuId = null;
    activeGroupMembersModalId = null;
    closeBulkPickModal();
    closeGroupMembersModal();
    closeGroupManageModal();
    closeGrowthJournalModal();
    refreshScoreUndoButton();
    updateBulkPickUI();
  }

  function collectLegacyLocalPayload() {
    let hasAny = false;
    const payload = buildDefaultCloudData();
    try {
      const slotsRaw = localStorage.getItem(STORAGE_KEY);
      if (slotsRaw) {
        const parsed = JSON.parse(slotsRaw);
        if (parsed && Array.isArray(parsed.slots) && isValidSlotCount(parsed.slots.length)) {
          payload.students = {
            slots: parsed.slots.map(function (s, i) {
              return {
                id: i + 1,
                name: s.name || DEFAULT_NAME,
                hatched: !!s.hatched,
                animal: s.animal,
                score: typeof s.score === "number" ? s.score : 0,
                lives: typeof s.lives === "number" ? s.lives : LIVES_DEFAULT,
              };
            }),
            updatedAt: parsed.updatedAt || Date.now(),
          };
          hasAny = true;
        }
      }
    } catch (e) {}
    try {
      const groupsRaw = localStorage.getItem(GROUPS_STORAGE_KEY);
      if (groupsRaw) {
        payload.groups = JSON.parse(groupsRaw);
        hasAny = true;
      }
    } catch (e) {}
    try {
      const cpRaw = localStorage.getItem(CLASS_PROGRESS_META_KEY);
      if (cpRaw) {
        payload.classProgress = JSON.parse(cpRaw);
        hasAny = true;
      }
    } catch (e) {}
    try {
      const dsRaw = localStorage.getItem(DAILY_SCORE_STORAGE_KEY);
      if (dsRaw) {
        payload.dailyScore = JSON.parse(dsRaw);
        hasAny = true;
      }
    } catch (e) {}
    try {
      const tmRaw = localStorage.getItem(TIMER_MINUTE_CUE_STORAGE_KEY);
      if (tmRaw) {
        payload.timerMinuteCue = tmRaw;
        hasAny = true;
      }
    } catch (e) {}
    return hasAny ? payload : null;
  }

  function buildCloudPayload() {
    return {
      students: {
        slots: serializeSlotsForCloud(),
        updatedAt: Date.now(),
      },
      groups: groups,
      classProgress: {
        celebratedThresholds: classProgressCelebratedThresholds.slice(),
      },
      dailyScore: dailyScorePack || {
        currentDate: todayDateKey(),
        todayScore: 0,
        history: [],
      },
      timerMinuteCue: timerMinuteCueEnabled ? "1" : "0",
      mission: buildMissionForCloud(),
      classDisplay: {
        gardenName: gardenDisplayName,
      },
      updatedAt: Date.now(),
    };
  }

  function applyCloudData(data, options) {
    options = options || {};
    if (!data) data = buildDefaultCloudData();

    if (data.students) {
      const cloudSlots = normalizeCloudSlots(data.students.slots);
      if (cloudSlots && cloudSlots.length) {
        slots = parseSlotsFromCloud(cloudSlots);
        slots.forEach(function (s) {
          if (s.id === 15) s.animal = "tiger";
          s.score = clampScore(coerceCloudNumber(s.score, 0));
          s.lives = clampLives(coerceCloudNumber(s.lives, LIVES_DEFAULT));
          s.beamHueBase = normalizeBeamHueBase(s.beamHueBase, s.id);
          s.emoji = DEFAULT_EMOJI;
        });
      } else if (options.initial) {
        slots = createDefaultSlots();
      }
    } else if (options.initial) {
      slots = createDefaultSlots();
    }

    groups = parseGroupsFromCloud(data.groups);
    classProgressCelebratedThresholds = [];
    if (data.classProgress && Array.isArray(data.classProgress.celebratedThresholds)) {
      classProgressCelebratedThresholds = data.classProgress.celebratedThresholds.filter(
        function (t) {
          return Number.isFinite(t) && t > 0;
        }
      );
    } else if (data.classProgress && data.classProgress.milestone500) {
      classProgressCelebratedThresholds = [CLASS_PROGRESS_TIER_SIZE];
    }

    applyDailyScorePackFromCloud(data.dailyScore);
    if (data.timerMinuteCue === "0") timerMinuteCueEnabled = false;
    else if (data.timerMinuteCue === "1") timerMinuteCueEnabled = true;
    applyMissionFromCloud(data.mission);

    if (
      data.classDisplay &&
      typeof data.classDisplay.gardenName === "string" &&
      data.classDisplay.gardenName.trim()
    ) {
      gardenDisplayName = data.classDisplay.gardenName.trim();
    } else {
      gardenDisplayName = DEFAULT_GARDEN_NAME;
    }
    updateDashHeaderTitle();
    syncGardenNameInput();
    syncStudentCountUI();
    updateLuckyCountLimits();

    classProgressBootstrapped = false;

    if (appBootstrapped) {
      renderAll();
      ensureGroupPanel();
      renderGroupButtons();
      updateClassProgress();
      updateTimerMinuteCueButtonUI();
      syncMissionHudLayout();
      refreshMissionPickButton();
    }
  }

  function scheduleCloudSync() {
    if (!getDb() || !currentClassCode || cloudSyncSuspended) return;
    if (!slots.length) return;
    if (cloudSyncTimerId !== null) {
      clearTimeout(cloudSyncTimerId);
    }
    cloudSyncTimerId = setTimeout(flushCloudSync, 180);
  }

  function flushCloudSyncToCode(code) {
    const db = getDb();
    if (!db || !code) return Promise.resolve();
    if (cloudSyncTimerId !== null) {
      clearTimeout(cloudSyncTimerId);
      cloudSyncTimerId = null;
    }
    const payload = buildCloudPayload();
    lastCloudWriteAt = payload.updatedAt;
    return db
      .ref(code)
      .update(payload)
      .then(function () {
        setCloudSyncStatus("雲端：已同步（" + code + "）", false);
      })
      .catch(function (err) {
        console.warn("[Firebase] 同步至 " + code + " 失敗", err);
      });
  }

  function flushCloudSync() {
    cloudSyncTimerId = null;
    const db = getDb();
    if (!db || !currentClassCode || cloudSyncSuspended) return;
    const payload = buildCloudPayload();
    lastCloudWriteAt = payload.updatedAt;
    db.ref(currentClassCode)
      .update(payload)
      .then(function () {
        setCloudSyncStatus("雲端：已同步（" + currentClassCode + "）", false);
      })
      .catch(function (err) {
        console.warn("[Firebase] 同步失敗", err);
        setCloudSyncStatus("雲端同步失敗，請檢查網路或 Firebase 設定", true);
      });
  }

  function detachCloudListener() {
    if (cloudListenerRef) {
      cloudListenerRef.off();
      cloudListenerRef = null;
    }
  }

  function attachCloudListener(code) {
    const db = getDb();
    if (!db) return;
    detachCloudListener();
    cloudListenerRef = db.ref(code);
    cloudListenerRef.on(
      "value",
      function (snap) {
        const data = snap.val();
        const remoteTs = data && data.updatedAt ? data.updatedAt : 0;
        if (lastCloudWriteAt && remoteTs && remoteTs <= lastCloudWriteAt) return;
        cloudSyncSuspended = true;
        applyCloudData(data || buildFreshCloudData());
        cloudSyncSuspended = false;
      },
      function (err) {
        console.warn("[Firebase] 監聽失敗", err);
        setCloudSyncStatus("雲端連線中斷，正在重試…", true);
      }
    );
  }

  function rememberClassCode(code) {
    try {
      localStorage.setItem(CLASS_CODE_STORAGE_KEY, code);
    } catch (e) {}
  }

  function readRememberedClassCode() {
    try {
      return sanitizeClassCode(localStorage.getItem(CLASS_CODE_STORAGE_KEY));
    } catch (e) {
      return "";
    }
  }

  function syncClassCodeInputs(code) {
    const modalInput = document.getElementById("class-code-input");
    const sidebarInput = document.getElementById("class-code-sidebar-input");
    if (modalInput) modalInput.value = code;
    if (sidebarInput) sidebarInput.value = code;
  }

  function showClassCodeError(msg) {
    const errEl = document.getElementById("class-code-error");
    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = !msg;
    }
  }

  function hideClassCodeModal() {
    const modal = document.getElementById("class-code-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("class-code-open");
    showClassCodeError("");
  }

  function showClassCodeModal(callback) {
    classCodeModalCallback = callback;
    const modal = document.getElementById("class-code-modal");
    const input = document.getElementById("class-code-input");
    if (!modal || !input) {
      if (callback) callback(false);
      return;
    }
    syncClassCodeInputs(readRememberedClassCode());
    modal.hidden = false;
    document.body.classList.add("class-code-open");
    if (window.__firebaseInitError) {
      showClassCodeError(window.__firebaseInitError);
      setCloudSyncStatus(window.__firebaseInitError, true);
    }
    setTimeout(function () {
      input.focus();
      input.select();
    }, 0);
  }

  function connectToClassCode(rawCode, callback, options) {
    options = options || {};
    ensureFirebaseReady()
      .then(function () {
        connectToClassCodeAfterReady(rawCode, callback, options);
      })
      .catch(function (err) {
        console.warn("[Firebase] 初始化失敗", err);
        showClassCodeError(formatFirebaseConnectionError(err));
        setCloudSyncStatus("雲端連線失敗", true);
        if (callback) callback(false);
      });
  }

  function connectToClassCodeAfterReady(rawCode, callback, options) {
    options = options || {};
    const db = getDb();
    if (!db) {
      showAppToast(window.__firebaseInitError || "Firebase 尚未初始化。", {
        variant: "warn",
      });
      if (callback) callback(false);
      return;
    }
    const code = sanitizeClassCode(rawCode);
    if (!code) {
      showClassCodeError("請輸入班級代碼（英數、底線、連字號，例如 1b、3a）。");
      if (callback) callback(false);
      return;
    }

    const previousCode = currentClassCode;
    const explicitSwitch = !!options.explicitSwitch;
    const isClassSwitch =
      explicitSwitch ||
      !!(previousCode && sanitizeClassCode(previousCode) !== code);

    connectGeneration += 1;
    const connectGen = connectGeneration;

    if (cloudSyncTimerId !== null) {
      clearTimeout(cloudSyncTimerId);
      cloudSyncTimerId = null;
    }
    lastCloudWriteAt = 0;
    cloudSyncSuspended = true;
    detachCloudListener();

    setCloudSyncStatus("雲端：正在連接 " + code + "…", false);

    const savePrevious =
      isClassSwitch && previousCode
        ? flushCloudSyncToCode(previousCode)
        : Promise.resolve();

    savePrevious
      .then(function () {
        if (connectGen !== connectGeneration) {
          return Promise.reject({ stale: true });
        }
        return db.ref(code).once("value");
      })
      .then(function (snap) {
        if (connectGen !== connectGeneration) {
          return Promise.reject({ stale: true });
        }
        let data = snap.val();
        const cloudSlots = normalizeCloudSlots(
          data && data.students && data.students.slots
        );
        if (!data || !cloudSlots || !cloudSlots.length) {
          if (isClassSwitch) {
            data = buildFreshCloudData();
          } else {
            const legacy = collectLegacyLocalPayload();
            data = legacy || buildFreshCloudData();
          }
          return db.ref(code).set(data).then(function () {
            return data;
          });
        }
        return data;
      })
      .then(function (data) {
        if (connectGen !== connectGeneration) return;

        currentClassCode = code;
        rememberClassCode(code);
        syncClassCodeInputs(code);
        if (isClassSwitch) {
          resetClassSwitchSessionState();
        }
        applyCloudData(data, { initial: true, classSwitch: isClassSwitch });
        cloudSyncSuspended = false;
        attachCloudListener(code);
        hideClassCodeModal();
        setCloudSyncStatus("雲端：已連線（" + code + "）", false);
        updateDashHeaderTitle();
        if (callback) callback(true);
      })
      .catch(function (err) {
        if (err && err.stale) return;
        cloudSyncSuspended = false;
        console.warn("[Firebase] 連線失敗", err);
        showClassCodeError(formatFirebaseConnectionError(err));
        setCloudSyncStatus("雲端連線失敗", true);
        if (callback) callback(false);
      });
  }

  function onClassCodeSubmit() {
    const input = document.getElementById("class-code-input");
    const code = input ? input.value : "";
    connectToClassCode(code, function (ok) {
      if (ok && classCodeModalCallback) {
        const cb = classCodeModalCallback;
        classCodeModalCallback = null;
        cb(true);
      }
    });
  }

  function onClassCodeSwitchClick() {
    const input = document.getElementById("class-code-sidebar-input");
    const code = input ? input.value : "";
    const sanitized = sanitizeClassCode(code);
    showAppConfirm(
      "切換班級代碼將載入另一班級的雲端資料。\n確定要切換至「" + sanitized + "」嗎？",
      { title: "切換班級" }
    ).then(function (ok) {
      if (!ok) return;
      connectToClassCode(code, function (connected) {
        if (connected && appBootstrapped) {
          renderAll();
          ensureGroupPanel();
          renderGroupButtons();
          updateClassProgress();
          syncMissionHudLayout();
        }
      }, { explicitSwitch: true });
    });
  }

  function confirmSitePassword() {
    return showAppPrompt("請輸入密碼以確認此操作。", "", {
      title: "密碼確認",
      password: true,
      placeholder: "密碼",
    }).then(function (val) {
      if (val === null) return false;
      if (val !== SITE_ACCESS_PASSWORD) {
        showAppToast("密碼錯誤，無法執行此操作。", { variant: "warn" });
        return false;
      }
      return true;
    });
  }

  function onClassCodeResetClick() {
    if (!teacherMode && !ensureTeacherModeOn()) return;

    const input = document.getElementById("class-code-sidebar-input");
    const code = sanitizeClassCode(
      input && input.value ? input.value : currentClassCode
    );
    if (!code) {
      showAppToast("請先輸入要重置的班級代碼。", { variant: "warn" });
      return;
    }
    confirmSitePassword().then(function (passwordOk) {
      if (!passwordOk) return;
      return showAppConfirm(
      "確定將「" +
        code +
        "」的雲端資料重置為空白班級？\n分數、姓名、組別將全部歸零，且無法復原。",
      { title: "重置班級資料", confirmText: "重置", danger: true }
    ).then(function (ok) {
      if (!ok) return;
      const db = getDb();
      if (!db) {
        showAppToast(window.__firebaseInitError || "Firebase 尚未初始化。", {
          variant: "warn",
        });
        return;
      }
      connectGeneration += 1;
      if (cloudSyncTimerId !== null) {
        clearTimeout(cloudSyncTimerId);
        cloudSyncTimerId = null;
      }
      lastCloudWriteAt = 0;
      cloudSyncSuspended = true;
      detachCloudListener();

      const fresh = buildFreshCloudData();
      db.ref(code)
        .set(fresh)
        .then(function () {
          currentClassCode = code;
          rememberClassCode(code);
          syncClassCodeInputs(code);
          resetClassSwitchSessionState();
          applyCloudData(fresh, { initial: true, classSwitch: true });
          cloudSyncSuspended = false;
          attachCloudListener(code);
          updateDashHeaderTitle();
          setCloudSyncStatus("雲端：已重置（" + code + "）", false);
          showAppToast("「" + code + "」已重置為空白班級。", { variant: "success" });
          if (appBootstrapped) {
            renderAll();
            ensureGroupPanel();
            renderGroupButtons();
            updateClassProgress();
            syncMissionHudLayout();
          }
        })
        .catch(function (err) {
          cloudSyncSuspended = false;
          console.warn("[Firebase] 重置失敗", err);
          showAppToast("重置失敗，請檢查網路或 Firebase 設定。", { variant: "warn" });
        });
    });
    });
  }

  function initCollapsiblePanel(toggleEl, bodyEl, panelEl) {
    if (!toggleEl || !bodyEl) return;
    toggleEl.addEventListener("click", function () {
      const willOpen = bodyEl.hidden;
      bodyEl.hidden = !willOpen;
      if (panelEl) panelEl.classList.toggle("is-open", willOpen);
      toggleEl.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  }

  let appToastTimeoutId = null;

  function showAppToast(message, opts) {
    opts = opts || {};
    const duration = opts.duration != null ? opts.duration : 2800;
    const toast = document.getElementById("app-toast");
    const textEl = document.getElementById("app-toast-text");
    if (!toast || !textEl) return;
    textEl.textContent = message;
    toast.classList.toggle("app-toast--success", opts.variant === "success");
    toast.classList.toggle("app-toast--warn", opts.variant === "warn");
    if (appToastTimeoutId) clearTimeout(appToastTimeoutId);
    toast.hidden = false;
    const card = toast.querySelector(".app-toast__card");
    if (card) {
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";
    }
    appToastTimeoutId = setTimeout(function () {
      toast.hidden = true;
      appToastTimeoutId = null;
    }, duration);
  }

  function showAppConfirm(message, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      const modal = document.getElementById("app-confirm-modal");
      const titleEl = document.getElementById("app-confirm-title");
      const msgEl = document.getElementById("app-confirm-message");
      const okBtn = document.getElementById("btn-app-confirm-ok");
      const cancelBtn = document.getElementById("btn-app-confirm-cancel");
      if (!modal || !msgEl || !okBtn || !cancelBtn) {
        resolve(window.confirm(message));
        return;
      }

      if (titleEl) titleEl.textContent = opts.title || "請確認";
      msgEl.textContent = message;
      okBtn.textContent = opts.confirmText || "確定";
      cancelBtn.textContent = opts.cancelText || "取消";
      okBtn.classList.toggle("tools-btn--primary", !opts.danger);
      okBtn.classList.toggle("tools-btn--danger", !!opts.danger);

      function finish(ok) {
        modal.hidden = true;
        document.body.classList.remove("app-dialog-open");
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKeydown);
        resolve(ok);
      }

      function onOk() {
        finish(true);
      }

      function onCancel() {
        finish(false);
      }

      function onBackdrop(ev) {
        if (ev.target === modal) finish(false);
      }

      function onKeydown(ev) {
        if (ev.key === "Escape") finish(false);
      }

      modal.hidden = false;
      document.body.classList.add("app-dialog-open");
      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      modal.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKeydown);
      cancelBtn.focus();
    });
  }

  function showAppPrompt(message, defaultValue, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      const modal = document.getElementById("app-prompt-modal");
      const titleEl = document.getElementById("app-prompt-title");
      const msgEl = document.getElementById("app-prompt-message");
      const inputEl = document.getElementById("app-prompt-input");
      const textareaEl = document.getElementById("app-prompt-textarea");
      const okBtn = document.getElementById("btn-app-prompt-ok");
      const cancelBtn = document.getElementById("btn-app-prompt-cancel");
      if (!modal || !inputEl || !textareaEl || !okBtn || !cancelBtn) {
        resolve(window.prompt(message, defaultValue));
        return;
      }

      const useTextarea = !!opts.multiline;
      const fieldEl = useTextarea ? textareaEl : inputEl;

      if (titleEl) titleEl.textContent = opts.title || "請輸入";
      if (msgEl) {
        if (message) {
          msgEl.textContent = message;
          msgEl.hidden = false;
        } else {
          msgEl.textContent = "";
          msgEl.hidden = true;
        }
      }

      inputEl.hidden = useTextarea;
      textareaEl.hidden = !useTextarea;
      fieldEl.value = defaultValue != null ? defaultValue : "";
      fieldEl.readOnly = !!opts.readonly;
      if (opts.placeholder) fieldEl.placeholder = opts.placeholder;
      else fieldEl.removeAttribute("placeholder");
      if (!useTextarea) {
        if (opts.password) {
          inputEl.type = "password";
          inputEl.autocomplete = "current-password";
        } else {
          inputEl.type = "text";
          inputEl.autocomplete = "off";
        }
      }

      okBtn.textContent = opts.readonly ? "關閉" : opts.confirmText || "確定";
      cancelBtn.hidden = !!opts.readonly;

      function finish(val) {
        modal.hidden = true;
        document.body.classList.remove("app-dialog-open");
        okBtn.removeEventListener("click", onOk);
        cancelBtn.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKeydown);
        resolve(val);
      }

      function onOk() {
        if (opts.readonly) {
          finish(null);
          return;
        }
        finish(fieldEl.value);
      }

      function onCancel() {
        finish(null);
      }

      function onBackdrop(ev) {
        if (ev.target === modal) finish(null);
      }

      function onKeydown(ev) {
        if (ev.key === "Escape") finish(null);
        if (ev.key === "Enter" && !useTextarea && !opts.readonly) {
          ev.preventDefault();
          onOk();
        }
      }

      modal.hidden = false;
      document.body.classList.add("app-dialog-open");
      okBtn.addEventListener("click", onOk);
      cancelBtn.addEventListener("click", onCancel);
      modal.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKeydown);
      setTimeout(function () {
        fieldEl.focus();
        if (!opts.readonly && fieldEl.select) fieldEl.select();
      }, 0);
    });
  }

  function showAppChoice(title, message, choices) {
    return new Promise(function (resolve) {
      const modal = document.getElementById("app-choice-modal");
      const titleEl = document.getElementById("app-choice-title");
      const msgEl = document.getElementById("app-choice-message");
      const listEl = document.getElementById("app-choice-list");
      const cancelBtn = document.getElementById("btn-app-choice-cancel");
      if (!modal || !listEl || !cancelBtn) {
        resolve(null);
        return;
      }

      if (titleEl) titleEl.textContent = title || "請選擇";
      if (msgEl) {
        if (message) {
          msgEl.textContent = message;
          msgEl.hidden = false;
        } else {
          msgEl.textContent = "";
          msgEl.hidden = true;
        }
      }

      listEl.innerHTML = "";
      const choiceButtons = [];
      (choices || []).forEach(function (choice) {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "app-choice-item";
        btn.innerHTML =
          choice.label +
          (choice.hint
            ? '<span class="app-choice-item__hint">' + choice.hint + "</span>"
            : "");
        btn.addEventListener("click", function () {
          finish(choice.value);
        });
        li.appendChild(btn);
        choiceButtons.push(btn);
        listEl.appendChild(li);
      });

      function finish(val) {
        modal.hidden = true;
        document.body.classList.remove("app-dialog-open");
        cancelBtn.removeEventListener("click", onCancel);
        modal.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKeydown);
        resolve(val);
      }

      function onCancel() {
        finish(null);
      }

      function onBackdrop(ev) {
        if (ev.target === modal) finish(null);
      }

      function onKeydown(ev) {
        if (ev.key === "Escape") finish(null);
      }

      modal.hidden = false;
      document.body.classList.add("app-dialog-open");
      cancelBtn.addEventListener("click", onCancel);
      modal.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKeydown);
      if (choiceButtons.length) choiceButtons[0].focus();
    });
  }

  function initToolsCollapsiblePanels() {
    const panels = [
      ["btn-mission-panel-toggle", "mission-panel-body", ".tools-panel--mission"],
      ["btn-lucky-panel-toggle", "lucky-panel-body", ".tools-panel--lucky"],
      ["btn-timer-panel-toggle", "timer-panel-body", ".tools-panel--timer"],
      ["btn-backup-panel-toggle", "backup-panel-body", ".tools-panel--backup"],
      ["btn-class-setup-panel-toggle", "class-setup-panel-body", ".tools-panel--class-setup"],
      ["btn-class-code-panel-toggle", "class-code-panel-body", ".tools-panel--class-code"],
    ];
    panels.forEach(function (entry) {
      initCollapsiblePanel(
        document.getElementById(entry[0]),
        document.getElementById(entry[1]),
        document.querySelector(entry[2])
      );
    });
  }

  function setMissionReminderExpanded(expanded) {
    const hud = document.getElementById("mission-reminder-hud");
    const body = document.getElementById("mission-reminder-body");
    const toggle = document.getElementById("btn-mission-reminder-toggle");
    if (!hud || !body || !toggle) return;
    hud.classList.toggle("is-expanded", expanded);
    body.hidden = !expanded;
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  }

  function initClassCodeUi() {
    const submitBtn = document.getElementById("btn-class-code-submit");
    const input = document.getElementById("class-code-input");
    const switchBtn = document.getElementById("btn-class-code-switch");
    const resetBtn = document.getElementById("btn-class-code-reset");

    if (submitBtn) submitBtn.addEventListener("click", onClassCodeSubmit);
    if (switchBtn) switchBtn.addEventListener("click", onClassCodeSwitchClick);
    if (resetBtn) resetBtn.addEventListener("click", onClassCodeResetClick);
    if (input) {
      input.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          onClassCodeSubmit();
        }
      });
    }
    initToolsCollapsiblePanels();

    const missionToggle = document.getElementById("btn-mission-reminder-toggle");
    const missionBody = document.getElementById("mission-reminder-body");
    if (missionToggle && missionBody) {
      missionToggle.addEventListener("click", function () {
        setMissionReminderExpanded(missionBody.hidden);
      });
      setMissionReminderExpanded(false);
    }
  }

  function saveMissionState() {
    scheduleCloudSync();
  }

  function beamHueBaseForSlot(id) {
    return ((id * 97 + 43) * 137) % 360;
  }

  function normalizeBeamHueBase(value, slotId) {
    if (Number.isFinite(value)) {
      const n = Math.floor(value) % 360;
      return n < 0 ? n + 360 : n;
    }
    return beamHueBaseForSlot(slotId);
  }

  function getScoreBeamCount(score) {
    return Math.min(10, Math.floor(Math.max(0, score) / 50));
  }

  function beamHueForSlot(slot, beamIndex) {
    const base = normalizeBeamHueBase(slot.beamHueBase, slot.id);
    return (base + beamIndex * 41) % 360;
  }

  function updateDashHeaderTitle() {
    const outline = document.querySelector(".dash-header__title-outline");
    const gradient = document.querySelector(".dash-header__title-gradient");
    const prefix = currentClassCode
      ? sanitizeClassCode(currentClassCode).toUpperCase()
      : "";
    const suffix = gardenDisplayName || DEFAULT_GARDEN_NAME;
    const text = prefix ? prefix + suffix : suffix;
    if (outline) outline.textContent = text;
    if (gradient) gradient.textContent = text;
    document.title = text;
  }

  function syncGardenNameInput() {
    const input = document.getElementById("garden-name-input");
    if (input) input.value = gardenDisplayName || DEFAULT_GARDEN_NAME;
  }

  function saveGardenDisplayName(rawName) {
    const trimmed = (rawName || "").trim();
    gardenDisplayName = trimmed || DEFAULT_GARDEN_NAME;
    updateDashHeaderTitle();
    syncGardenNameInput();
    scheduleCloudSync();
  }

  function syncStudentCountUI() {
    const label = document.getElementById("student-count-label");
    if (label) {
      label.textContent = "目前學生：" + getSlotCount() + " 人";
    }
    const removeBtn = document.getElementById("btn-student-remove");
    if (removeBtn) removeBtn.disabled = getSlotCount() <= MIN_SLOT_COUNT;
    const addBtn = document.getElementById("btn-student-add");
    if (addBtn) addBtn.disabled = getSlotCount() >= MAX_SLOT_COUNT;
  }

  function updateLuckyCountLimits() {
    const input = document.getElementById("lucky-count");
    const label = document.querySelector('label[for="lucky-count"] > span');
    const max = getSlotCount();
    if (input) {
      input.max = String(max);
      const val = parseInt(input.value, 10);
      if (!Number.isFinite(val) || val < 1) input.value = "1";
      else if (val > max) input.value = String(max);
    }
    if (label) label.textContent = "挑選人數（1～" + max + "）";
  }

  function createSlotData(id) {
    return {
      id: id,
      name: DEFAULT_NAME,
      hatched: false,
      animal: animalForSlot(id),
      emoji: DEFAULT_EMOJI,
      score: 0,
      lives: LIVES_DEFAULT,
      beamHueBase: beamHueBaseForSlot(id),
      history: {},
    };
  }

  function addStudentSlot() {
    if (!teacherMode && !ensureTeacherModeOn()) return;
    if (getSlotCount() >= MAX_SLOT_COUNT) {
      showAppToast("最多只能有 " + MAX_SLOT_COUNT + " 位學生。", { variant: "warn" });
      return;
    }
    const slot = createSlotData(getSlotCount() + 1);
    slots.push(slot);
    saveSlots();
    renderSlotElement(slot);
    syncStudentCountUI();
    updateLuckyCountLimits();
    showAppToast("已新增 " + slot.id + " 號學生方框。", { variant: "success" });
  }

  function removeLastStudentSlot() {
    if (!teacherMode && !ensureTeacherModeOn()) return;
    if (getSlotCount() <= MIN_SLOT_COUNT) {
      showAppToast("至少需要保留 " + MIN_SLOT_COUNT + " 位學生。", { variant: "warn" });
      return;
    }
    const slot = slots[slots.length - 1];
    const removedId = slot.id;
    showAppConfirm(
      "確定移除 " +
        removedId +
        " 號「" +
        slotDisplayName(slot) +
        "」？\n其分數、組別歸屬將一併清除，且無法復原。",
      { title: "刪減學生方框", confirmText: "移除", danger: true }
    ).then(function (ok) {
      if (!ok) return;
      const el = document.querySelector('.slot[data-slot-id="' + removedId + '"]');
      if (el) el.remove();
      slots.pop();
      groups.forEach(function (g) {
        g.memberIds = g.memberIds.filter(function (id) {
          return id <= getSlotCount();
        });
      });
      bulkSelectedIds = bulkSelectedIds.filter(function (id) {
        return id <= getSlotCount();
      });
      if (activeScoreMenuSlotId === removedId) activeScoreMenuSlotId = null;
      saveGroups();
      saveSlots();
      renderGroupButtons();
      syncStudentCountUI();
      updateLuckyCountLimits();
      showAppToast("已移除 " + removedId + " 號學生方框。", { variant: "success" });
    });
  }

  function initClassSetupPanel() {
    const gardenInput = document.getElementById("garden-name-input");
    const gardenSaveBtn = document.getElementById("btn-garden-name-save");
    const addBtn = document.getElementById("btn-student-add");
    const removeBtn = document.getElementById("btn-student-remove");
    const titleEl = document.querySelector(".dash-header__title");

    syncGardenNameInput();
    syncStudentCountUI();

    if (gardenSaveBtn) {
      gardenSaveBtn.addEventListener("click", function () {
        if (!teacherMode && !ensureTeacherModeOn()) return;
        saveGardenDisplayName(gardenInput ? gardenInput.value : "");
        showAppToast("園地名稱已更新。", { variant: "success" });
      });
    }
    if (gardenInput) {
      gardenInput.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          if (!teacherMode && !ensureTeacherModeOn()) return;
          saveGardenDisplayName(gardenInput.value);
          showAppToast("園地名稱已更新。", { variant: "success" });
        }
      });
    }
    if (addBtn) addBtn.addEventListener("click", addStudentSlot);
    if (removeBtn) removeBtn.addEventListener("click", removeLastStudentSlot);
    if (titleEl) {
      titleEl.addEventListener("dblclick", function () {
        if (!teacherMode && !ensureTeacherModeOn()) return;
        showAppPrompt("請輸入標題後半段名稱（班級代碼會自動加在前面）：", gardenDisplayName, {
          title: "編輯園地名稱",
          placeholder: DEFAULT_GARDEN_NAME,
        }).then(function (val) {
          if (val === null) return;
          saveGardenDisplayName(val);
          showAppToast("園地名稱已更新。", { variant: "success" });
        });
      });
    }
  }

  function beamAngleForIndex(beamIndex) {
    if (beamIndex <= 0) return 0;
    const pair = Math.ceil(beamIndex / 2);
    const sign = beamIndex % 2 === 1 ? -1 : 1;
    return sign * pair * 11;
  }

  function renderSlotBeams(stage, slot) {
    if (!stage || !slot) return;
    let beamsEl = stage.querySelector(".slot__beams");
    const count = slot.hatched ? getScoreBeamCount(slot.score) : 0;
    if (!count) {
      if (beamsEl) beamsEl.hidden = true;
      return;
    }
    if (!beamsEl) {
      beamsEl = document.createElement("div");
      beamsEl.className = "slot__beams";
      beamsEl.setAttribute("aria-hidden", "true");
      stage.insertBefore(beamsEl, stage.firstChild);
    }
    beamsEl.hidden = false;
    beamsEl.innerHTML = "";

    const core = document.createElement("div");
    core.className = "slot__beams-core";
    core.style.setProperty("--beam-hue", String(beamHueForSlot(slot, 0)));
    beamsEl.appendChild(core);

    for (let i = 0; i < count; i++) {
      const beam = document.createElement("span");
      beam.className = "slot__beam";
      beam.style.setProperty("--beam-hue", String(beamHueForSlot(slot, i)));
      beam.style.setProperty("--beam-angle", beamAngleForIndex(i) + "deg");
      beam.style.setProperty("--beam-i", String(i));
      beamsEl.appendChild(beam);
    }
  }

  const SCORE_FX_STAR_HUES = [45, 120, 195, 270, 330, 15];

  function getSlotScoreFxLevel(score) {
    if (score >= 500) return 5;
    if (score >= 350) return 4;
    if (score >= 250) return 3;
    if (score >= 150) return 2;
    if (score >= 50) return 1;
    return 0;
  }

  function renderSlotRipples(stage, slot, score) {
    if (!stage) return;
    let ripplesEl = stage.querySelector(".slot__fx-ripples");
    if (score < 250) {
      if (ripplesEl) ripplesEl.hidden = true;
      return;
    }
    if (!ripplesEl) {
      ripplesEl = document.createElement("div");
      ripplesEl.className = "slot__fx-ripples";
      ripplesEl.setAttribute("aria-hidden", "true");
      stage.insertBefore(ripplesEl, stage.firstChild);
      for (let i = 1; i <= 3; i++) {
        const ring = document.createElement("span");
        ring.className = "slot__fx-ripple slot__fx-ripple--" + i;
        ripplesEl.appendChild(ring);
      }
    }
    ripplesEl.hidden = false;
    ripplesEl.style.setProperty("--ripple-hue", String(beamHueForSlot(slot, 1)));
  }

  function renderSlotStars(stage, slot, score) {
    if (!stage) return;
    let starsEl = stage.querySelector(".slot__fx-stars");
    if (score < 350) {
      if (starsEl) starsEl.hidden = true;
      return;
    }
    if (!starsEl) {
      starsEl = document.createElement("div");
      starsEl.className = "slot__fx-stars";
      starsEl.setAttribute("aria-hidden", "true");
      stage.appendChild(starsEl);
      for (let i = 1; i <= 6; i++) {
        const star = document.createElement("span");
        star.className = "slot__fx-star slot__fx-star--" + i;
        star.textContent = "★";
        starsEl.appendChild(star);
      }
    }
    starsEl.hidden = false;
    starsEl.querySelectorAll(".slot__fx-star").forEach(function (star, i) {
      const hue = (SCORE_FX_STAR_HUES[i] + slot.id * 17) % 360;
      star.style.setProperty("--star-hue", String(hue));
    });
  }

  function renderSlotCrown(el, score) {
    let crownEl = el.querySelector(".slot__fx-crown");
    if (score < 500) {
      if (crownEl) crownEl.hidden = true;
      return;
    }
    if (!crownEl) {
      crownEl = document.createElement("div");
      crownEl.className = "slot__fx-crown";
      crownEl.setAttribute("aria-hidden", "true");
      crownEl.innerHTML =
        '<span class="slot__fx-crown-icon" role="img" aria-hidden="true">👑</span>';
      const stage = el.querySelector(".slot__stage");
      if (stage) el.insertBefore(crownEl, stage);
      else el.appendChild(crownEl);
    }
    crownEl.hidden = false;
  }

  function renderSlotScoreFx(el, slot) {
    if (!el || !slot) return;
    const score = slot.hatched ? Math.max(0, slot.score) : 0;
    const fxLevel = getSlotScoreFxLevel(score);

    el.classList.toggle("slot--fx-glow", fxLevel >= 1);
    el.classList.toggle("slot--fx-border", fxLevel >= 2);
    el.classList.toggle("slot--fx-ripple", fxLevel >= 3);
    el.classList.toggle("slot--fx-stars", fxLevel >= 4);
    el.classList.toggle("slot--fx-crown", fxLevel >= 5);

    if (fxLevel >= 1) {
      el.style.setProperty(
        "--slot-animal-glow-hue",
        String(beamHueForSlot(slot, 0))
      );
    }
    if (fxLevel >= 2) {
      el.style.setProperty(
        "--slot-border-glow-hue",
        String(beamHueBaseForSlot(slot.id))
      );
    }

    const stage = el.querySelector(".slot__stage");
    renderSlotRipples(stage, slot, score);
    renderSlotStars(stage, slot, score);
    renderSlotCrown(el, score);
  }

  function animalForSlot(id) {
    return ANIMALS[(id - 1) % ANIMALS.length];
  }

  /** 修正舊版錯誤預設（1 號應為河狸） */
  function fixLegacySlotAnimal(slot) {
    if (!slot) return;
    if (slot.id === 1 && slot.animal === "polar") {
      slot.animal = "beaver";
    }
  }

  function isValidAnimal(name) {
    return ANIMALS.indexOf(name) >= 0;
  }

  function getPickableAnimals() {
    return ANIMALS.filter(function (animal) {
      return ANIMALS_HIDDEN_FROM_PICKER.indexOf(animal) < 0;
    });
  }

  function eggHueForSlot(id) {
    return Math.round(((id - 1) / Math.max(getSlotCount(), 1)) * 360);
  }

  function slotGradientByPosition(id) {
    const idx = id - 1;
    const row = Math.floor(idx / 6);
    const col = idx % 6;
    // 以列/欄混合跳步，避免左右上下顏色接近
    const paletteIndex =
      (row * 5 + col * 7 + row * col * 3) % SLOT_GRADIENTS.length;
    return SLOT_GRADIENTS[paletteIndex];
  }

  function clampScore(v) {
    const n = Number.isFinite(v) ? v : 0;
    return Math.max(SCORE_MIN, Math.min(SCORE_MAX, n));
  }

  function clampLives(v) {
    const n = Number.isFinite(v) ? Math.floor(v) : LIVES_DEFAULT;
    return Math.max(0, Math.min(LIVES_MAX, n));
  }

  function isSlotSleeping(slot) {
    if (!slot) return false;
    if (typeof slot.lives !== "number") {
      slot.lives = LIVES_DEFAULT;
    }
    return slot.lives === 0;
  }

  /** 睡眠中（0 愛心）不接受加分；減分仍可套用 */
  function canApplyScoreDeltaToSlot(slot, delta) {
    if (!slot || !delta) return false;
    if (delta > 0 && isSlotSleeping(slot)) return false;
    return true;
  }

  function slotDisplayName(slot) {
    if (!slot) return "";
    return slot.name && slot.name !== DEFAULT_NAME
      ? slot.name
      : slot.id + " 號學生";
  }

  function maybeAutoHatchSlot(slot, opts) {
    opts = opts || {};
    if (!slot || slot.hatched) return false;
    if (slot.score < HATCH_THRESHOLD) return false;
    slot.hatched = true;
    if (opts.withFeedback) {
      playHatchSound();
      showAppToast(
        "🎉 " + slot.id + " 號 " + slotDisplayName(slot) + " 的神獸孵化成功！",
        { variant: "success", duration: 3200 }
      );
    }
    return true;
  }

  function syncAllSlotsAutoHatch() {
    let changed = false;
    slots.forEach(function (slot) {
      if (maybeAutoHatchSlot(slot)) changed = true;
    });
    if (changed) saveSlots();
  }

  let activeGrowthJournalSlotId = null;

  function getLocalDateKey(offsetDays) {
    const d = new Date();
    if (offsetDays) d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function normalizeScoreHistory(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const out = {};
    Object.keys(raw).forEach(function (key) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
      const v = parseInt(raw[key], 10);
      if (Number.isFinite(v) && v !== 0) out[key] = v;
    });
    return out;
  }

  function ensureSlotHistory(slot) {
    if (!slot.history || typeof slot.history !== "object") {
      slot.history = {};
    }
    return slot.history;
  }

  function recordSlotScoreHistory(slot, delta) {
    if (!slot || !delta) return;
    const hist = ensureSlotHistory(slot);
    const key = getLocalDateKey(0);
    hist[key] = (hist[key] || 0) + Math.floor(delta);
    if (hist[key] === 0) delete hist[key];
  }

  function applyScoreDeltaToSlot(slot, delta) {
    if (!canApplyScoreDeltaToSlot(slot, delta)) return false;
    slot.score = clampScore(slot.score + delta);
    applyScoreReaction(slot.id, delta);
    recordSlotScoreHistory(slot, delta);
    if (delta > 0) maybeAutoHatchSlot(slot, { withFeedback: true });
    return true;
  }

  function getLastJournalDateKeys() {
    const keys = [];
    for (let i = GROWTH_JOURNAL_DAYS - 1; i >= 0; i--) {
      keys.push(getLocalDateKey(-i));
    }
    return keys;
  }

  function formatHistoryDelta(delta) {
    return (delta > 0 ? "+" : "") + delta;
  }

  function formatJournalDayShort(dateKey) {
    const today = getLocalDateKey(0);
    const yesterday = getLocalDateKey(-1);
    if (dateKey === today) return "今天";
    if (dateKey === yesterday) return "昨天";
    const parts = dateKey.split("-");
    const d = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    return "週" + weekdays[d.getDay()];
  }

  function buildGrowthEncouragement(slot) {
    const hist = ensureSlotHistory(slot);
    const today = hist[getLocalDateKey(0)] || 0;
    const yesterday = hist[getLocalDateKey(-1)] || 0;

    if (today > yesterday && yesterday > 0) {
      const diff = today - yesterday;
      const pct = Math.round((diff / yesterday) * 100);
      return {
        type: "success",
        text: "哇！比昨天多 " + diff + " 分，進步 " + pct + "%！🚀",
      };
    }
    if (today > 0 && yesterday <= 0) {
      return {
        type: "warm",
        text: "今天 " + today + " 分，好厲害喔！✨",
      };
    }
    if (today > 0) {
      return {
        type: "warm",
        text: "今天 " + today + " 分，明天會更棒！🌱",
      };
    }
    return {
      type: "warm",
      text: "加油！得分會長高高～ 🌟",
    };
  }

  function renderGrowthJournalChart(slot) {
    const chartEl = document.getElementById("growth-journal-chart");
    if (!chartEl) return;

    const hist = ensureSlotHistory(slot);
    const keys = getLastJournalDateKeys();
    let maxAbs = 1;
    keys.forEach(function (dateKey) {
      const v = hist[dateKey];
      if (typeof v === "number") {
        maxAbs = Math.max(maxAbs, Math.abs(v));
      }
    });

    chartEl.innerHTML = "";
    const barsWrap = document.createElement("div");
    barsWrap.className = "growth-journal-chart__bars";
    barsWrap.setAttribute("aria-hidden", "true");

    keys.forEach(function (dateKey) {
      const raw = hist[dateKey];
      const score = typeof raw === "number" ? raw : 0;
      const col = document.createElement("div");
      col.className = "growth-journal-chart__col";

      const barWrap = document.createElement("div");
      barWrap.className = "growth-journal-chart__bar-wrap";

      const bar = document.createElement("div");
      bar.className = "growth-journal-chart__bar";
      if (score > 0) {
        bar.classList.add("is-up");
        const heightPct = Math.max(14, (score / maxAbs) * 100);
        bar.style.height = heightPct + "%";
        const valueEl = document.createElement("span");
        valueEl.className = "growth-journal-chart__value";
        valueEl.textContent = "+" + score;
        bar.appendChild(valueEl);
      } else if (score < 0) {
        bar.classList.add("is-down");
        const heightPct = Math.max(14, (Math.abs(score) / maxAbs) * 100);
        bar.style.height = heightPct + "%";
        const valueEl = document.createElement("span");
        valueEl.className = "growth-journal-chart__value";
        valueEl.textContent = String(score);
        bar.appendChild(valueEl);
      } else {
        bar.classList.add("is-zero");
        bar.style.height = "12%";
        const valueEl = document.createElement("span");
        valueEl.className = "growth-journal-chart__value growth-journal-chart__value--zero";
        valueEl.textContent = "0";
        bar.appendChild(valueEl);
      }

      barWrap.appendChild(bar);

      const dayEl = document.createElement("span");
      dayEl.className = "growth-journal-chart__day";
      dayEl.textContent = formatJournalDayShort(dateKey);

      col.appendChild(barWrap);
      col.appendChild(dayEl);
      barsWrap.appendChild(col);
    });

    chartEl.appendChild(barsWrap);

    const legend = document.createElement("p");
    legend.className = "growth-journal-chart__legend";
    legend.textContent = "🟢 綠色 = 加分　🔴 紅色 = 減分";
    chartEl.appendChild(legend);
  }

  function renderGrowthJournalModal(slotId) {
    const slot = getSlotById(slotId);
    const titleEl = document.getElementById("growth-journal-title");
    const subtitleEl = document.getElementById("growth-journal-subtitle");
    const encourageEl = document.getElementById("growth-journal-encourage");
    const chartEl = document.getElementById("growth-journal-chart");
    if (!slot || !titleEl || !chartEl) return;

    titleEl.textContent = "📜 成長日誌";
    if (subtitleEl) {
      subtitleEl.textContent =
        slotDisplayLabel(slot) + " · 總分 " + slot.score;
    }

    if (encourageEl) {
      const msg = buildGrowthEncouragement(slot);
      encourageEl.textContent = msg.text;
      encourageEl.className =
        "growth-journal-modal__encourage growth-journal-modal__encourage--" +
        msg.type;
      encourageEl.hidden = false;
    }

    renderGrowthJournalChart(slot);
  }

  function openGrowthJournalModal(slotId) {
    const modal = document.getElementById("growth-journal-modal");
    if (!modal) return;
    activeGrowthJournalSlotId = slotId;
    renderGrowthJournalModal(slotId);
    modal.hidden = false;
    document.body.classList.add("growth-journal-open");
  }

  function closeGrowthJournalModal() {
    const modal = document.getElementById("growth-journal-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("growth-journal-open");
    activeGrowthJournalSlotId = null;
  }

  function initGrowthJournalModal() {
    const modal = document.getElementById("growth-journal-modal");
    const closeBtn = document.getElementById("btn-growth-journal-close");
    if (closeBtn) closeBtn.addEventListener("click", closeGrowthJournalModal);
    if (modal) {
      modal.addEventListener("click", function (ev) {
        if (ev.target === modal) closeGrowthJournalModal();
      });
    }
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && activeGrowthJournalSlotId !== null) {
        closeGrowthJournalModal();
      }
    });
  }

  function createDefaultSlots(count) {
    const n =
      count != null
        ? Math.max(MIN_SLOT_COUNT, Math.min(MAX_SLOT_COUNT, count))
        : DEFAULT_SLOT_COUNT;
    return Array.from({ length: n }, function (_, i) {
      const id = i + 1;
      return createSlotData(id);
    });
  }

  function loadSlots() {
    if (!slots.length) {
      slots = createDefaultSlots();
    }
  }

  function flushPersistSlots() {
    flushCloudSync();
  }

  function saveSlots() {
    updateClassProgress();
    scheduleCloudSync();
  }

  const LIFE_HEART_SVG =
    '<svg class="slot__life-heart-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path class="slot__life-heart-shape" d="M12 20.8 4.6 13.4 3.5 9.5C3.5 6.8 5.6 5 8 5c1.5 0 2.9.7 4 1.9 1.1-1.2 2.5-1.9 4-1.9 2.4 0 4.5 1.8 4.5 4.5 0 3.3-2.6 6-7.3 10.2L12 20.8z"/>' +
    "</svg>";

  function getSlotById(id) {
    return slots.find(function (s) {
      return s.id === id;
    });
  }

  function clearSlotEmojiTimer(slotId) {
    if (slotEmojiTimers[slotId]) {
      clearTimeout(slotEmojiTimers[slotId]);
      delete slotEmojiTimers[slotId];
    }
  }

  function updateSlotEmojiDisplay(slotId) {
    const slot = getSlotById(slotId);
    if (!slot) return;
    const el = document.querySelector('.slot[data-slot-id="' + slotId + '"]');
    const footerEmoji = el && el.querySelector(".slot__footer-part--emoji");
    if (footerEmoji) {
      footerEmoji.textContent = slot.emoji || DEFAULT_EMOJI;
    }
  }

  function setSlotReactionEmoji(slotId, emoji) {
    const slot = getSlotById(slotId);
    if (!slot) return;

    clearSlotEmojiTimer(slotId);
    slot.emoji = emoji;
    updateSlotEmojiDisplay(slotId);

    slotEmojiTimers[slotId] = setTimeout(function () {
      slot.emoji = DEFAULT_EMOJI;
      updateSlotEmojiDisplay(slotId);
      delete slotEmojiTimers[slotId];
    }, EMOJI_REACTION_MS);
  }

  function applyScoreReaction(slotId, delta) {
    if (delta > 0) {
      setSlotReactionEmoji(slotId, EMOJI_SCORE_UP);
    } else if (delta < 0) {
      setSlotReactionEmoji(slotId, EMOJI_SCORE_DOWN);
    }
  }

  function setViewerAnimation(mv, animName) {
    if (!mv || !animName) return;
    try {
      mv.animationName = animName;
      mv.setAttribute("animation-name", animName);
    } catch (e) {
      console.warn("[動畫] 切換失敗：", animName, e);
    }
  }

  function createBeastModelViewer(slot, className, extraAttrs) {
    const mv = document.createElement("model-viewer");
    mv.className = className;
    mv.src = "models/animal-" + slot.animal + ".glb";
    mv.alt = slot.name + " 的神獸";
    mv.setAttribute("autoplay", "");
    mv.setAttribute("camera-orbit", "0deg 75deg auto");
    mv.setAttribute("shadow-intensity", "0.35");
    mv.setAttribute("environment-image", "neutral");
    mv.setAttribute("interaction-prompt", "none");
    mv.setAttribute("disable-pan", "");
    mv.setAttribute("disable-zoom", "");
    mv.setAttribute("disable-tap", "");
    if (extraAttrs) {
      Object.keys(extraAttrs).forEach(function (key) {
        mv.setAttribute(key, extraAttrs[key]);
      });
    }
    setViewerAnimation(mv, IDLE_ANIM);
    return mv;
  }

  function createBeastFallback(slot, className) {
    const wrap = document.createElement("div");
    wrap.className = className + " slot__beast-fallback";
    const label = ANIMAL_LABELS[slot.animal] || slot.animal;
    wrap.innerHTML =
      '<span class="slot__beast-fallback-icon" aria-hidden="true">🐾</span>' +
      '<span class="slot__beast-fallback-label">' +
      label +
      "</span>";
    wrap.title = "需透過本地伺服器開啟網頁，才能顯示 3D 神獸模型";
    return wrap;
  }

  function appendHatchedBeast(parent, slot, viewerClass, extraAttrs) {
    if (canLoadGlbAssets()) {
      parent.appendChild(createBeastModelViewer(slot, viewerClass, extraAttrs));
      return;
    }
    parent.appendChild(createBeastFallback(slot, viewerClass));
  }

  function showFileProtocolBanner() {
    if (canLoadGlbAssets() || document.getElementById("file-protocol-banner")) return;

    const banner = document.createElement("div");
    banner.id = "file-protocol-banner";
    banner.className = "file-protocol-banner";
    banner.setAttribute("role", "alert");
    banner.innerHTML =
      '<p class="file-protocol-banner__text">' +
      "<strong>偵測到 file:// 開啟方式</strong>：瀏覽器安全限制無法載入 3D 模型（CORS）。" +
      "請雙擊專案資料夾內的 <code>serve.cmd</code>，再開啟 " +
      "<code>http://127.0.0.1:8080</code>。" +
      "</p>" +
      '<button type="button" class="file-protocol-banner__close" aria-label="關閉提示">×</button>';
    document.body.prepend(banner);

    banner
      .querySelector(".file-protocol-banner__close")
      .addEventListener("click", function () {
        banner.remove();
      });
  }

  function forEachHatchedViewer(callback) {
    document
      .querySelectorAll(".slot.is-hatched model-viewer")
      .forEach(callback);
  }

  function pickRandomSpecialAnimation() {
    return SPECIAL_ANIMATIONS[
      Math.floor(Math.random() * SPECIAL_ANIMATIONS.length)
    ];
  }

  function applyIdlePhase() {
    forEachHatchedViewer(function (mv) {
      setViewerAnimation(mv, IDLE_ANIM);
    });
  }

  function applySpecialPhase() {
    forEachHatchedViewer(function (mv) {
      setViewerAnimation(mv, pickRandomSpecialAnimation());
    });
  }

  /** 階段 A：idle 10 秒 → 階段 B：大招 2.5 秒 → 循環 */
  function runAnimationCycle() {
    if (animCycleTimeoutId !== null) {
      clearTimeout(animCycleTimeoutId);
      animCycleTimeoutId = null;
    }

    if (document.hidden) {
      animCycleTimeoutId = setTimeout(runAnimationCycle, 1500);
      return;
    }

    applyIdlePhase();

    animCycleTimeoutId = setTimeout(function () {
      applySpecialPhase();

      animCycleTimeoutId = setTimeout(function () {
        runAnimationCycle();
      }, SPECIAL_PHASE_MS);
    }, IDLE_PHASE_MS);
  }

  function startAnimationCycle() {
    runAnimationCycle();
  }

  // ===============================
  // ====== Freesound 聯網音效 ======
  // ===============================
  const FREESOUND_API_BASE = "https://freesound.org/apiv2/search/";
  const FREESOUND_TOKEN =
    (typeof window !== "undefined" && window.FREESOUND_API_KEY) || "";

  // 針對指定 Sound ID 的快取（避免每次重新打 Freesound）
  const SOUND_ID_SCORE = 241809;
  const SOUND_ID_LUCKY = 139005;
  const SOUND_ID_LIFE = 381778;
  const SOUND_ID_MISSION_DRAW = 145450;
  const SOUND_ID_TIMER = 81159;
  const SOUND_ID_TIMER_MINUTE = 383602;
  const freesoundIdUrlCache = {};
  const freesoundIdAudioCache = {};
  const freesoundIdFetchPromises = {};

  const FREESOUND_EFFECTS = {
    cheer: {
      query: "applause cheer short",
      filter: "tag:(applause OR cheer) duration:[0 TO 5]",
      fallbackFilters: ["tag:applause duration:[0 TO 5]", "duration:[0 TO 4]"],
      sort: "duration_asc",
      volume: 0.8,
    },
    rocket: {
      query: "level up powerup win",
      filter: "duration:[0 TO 8]",
      fallbackFilters: [
        "tag:arcade duration:[0 TO 8]",
        "tag:retro duration:[0 TO 8]",
      ],
      sort: "rating_desc",
      volume: 0.48,
    },
    hatch: {
      query: "magic sparkle pop",
      filter: "tag:(magic OR sparkle OR pop) duration:[0 TO 5]",
      fallbackFilters: ["tag:cartoon duration:[0 TO 4]"],
      sort: "rating_desc",
      volume: 0.72,
    },
    wrong: {
      query: "oops error wrong",
      filter: "tag:(oops OR wrong OR error) duration:[0 TO 4]",
      fallbackFilters: [
        "tag:oops duration:[0 TO 4]",
        "tag:wrong duration:[0 TO 4]",
      ],
      sort: "duration_asc",
      volume: 0.52,
    },
    // Freesound: Cute1.mp3 (約 2.27 秒，可用於加分音效)
    scoreCute: {
      query: "Cute1.mp3",
      filter: "duration:[0 TO 3]",
      fallbackFilters: ["Cute1"],
      sort: "duration_asc",
      volume: 0.85,
    },
    // Freesound: [Synth seq] \"cute\" sine tone pluck sequence - E5->C4
    timerCute: {
      query: "\"cute\" sine tone pluck sequence E5 C4",
      filter: "duration:[0 TO 5]",
      fallbackFilters: ["cute sine pluck sequence"],
      sort: "rating_desc",
      volume: 0.9,
    },
  };

  const freesoundUrlCache = {};
  const freesoundFetchPromises = {};
  const freesoundPreloadedAudio = {};
  let activeFreesoundPlayer = null;
  let cheerAudioPlayer = null;

  function pickPreviewUrlFromResults(results) {
    if (!Array.isArray(results)) return null;
    for (let i = 0; i < results.length; i++) {
      const sound = results[i];
      const previews = sound && sound.previews;
      const url =
        previews &&
        (previews["preview-hq-mp3"] || previews["preview-lq-mp3"]);
      if (url) return url;
    }
    return null;
  }

  async function fetchFreesoundPreviewUrlById(soundId) {
    if (!FREESOUND_TOKEN) return null;
    if (freesoundIdUrlCache[soundId]) return freesoundIdUrlCache[soundId];
    if (freesoundIdFetchPromises[soundId]) {
      return freesoundIdFetchPromises[soundId];
    }

    freesoundIdFetchPromises[soundId] = (async function () {
      try {
        const params = new URLSearchParams({
          token: FREESOUND_TOKEN,
          fields: "id,name,previews",
        });
        const res = await fetch(
          "https://freesound.org/apiv2/sounds/" +
            soundId +
            "/?" +
            params.toString()
        );
        if (!res.ok) throw new Error("Freesound sound HTTP " + res.status);
        const data = await res.json();
        const previews = data && data.previews;
        const url =
          previews &&
          (previews["preview-hq-mp3"] || previews["preview-lq-mp3"] || null);
        if (url) {
          freesoundIdUrlCache[soundId] = url;
          return url;
        }
        return null;
      } catch (err) {
        console.warn("[Freesound] 以 ID 取得預覽失敗:", soundId, err);
        return null;
      } finally {
        delete freesoundIdFetchPromises[soundId];
      }
    })();

    return freesoundIdFetchPromises[soundId];
  }

  async function ensureFreesoundAudioById(soundId, volume) {
    if (!FREESOUND_TOKEN) return null;

    const url = await fetchFreesoundPreviewUrlById(soundId);
    if (!url) return null;

    let audio = freesoundIdAudioCache[soundId];
    if (!audio) {
      audio = new Audio();
      audio.preload = "auto";
      freesoundIdAudioCache[soundId] = audio;
    }

    if (audio.src !== url) {
      audio.src = url;
      audio.load();
    }

    audio.volume = volume != null ? volume : 0.9;
    return audio;
  }

  async function playFreesoundById(soundId, volume) {
    if (!FREESOUND_TOKEN) return false;
    try {
      const audio = await ensureFreesoundAudioById(soundId, volume);
      if (!audio) return false;
      audio.currentTime = 0;
      await audio.play();
      return true;
    } catch (err) {
      console.warn("[Freesound] 以 ID 播放失敗:", soundId, err);
      return false;
    }
  }

  function preloadFreesoundByIds() {
    if (!FREESOUND_TOKEN) return;
    [
      SOUND_ID_SCORE,
      SOUND_ID_LUCKY,
      SOUND_ID_LIFE,
      SOUND_ID_MISSION_DRAW,
      SOUND_ID_TIMER,
      SOUND_ID_TIMER_MINUTE,
    ].forEach(function (soundId) {
      fetchFreesoundPreviewUrlById(soundId)
        .then(function (url) {
          if (url) return ensureFreesoundAudioById(soundId);
        })
        .catch(function () {});
    });
  }

  async function searchFreesoundOnce(query, filter, sort) {
    const params = new URLSearchParams({
      query: query,
      token: FREESOUND_TOKEN,
      fields: "id,name,previews",
      page_size: "8",
      sort: sort || "rating_desc",
    });
    if (filter) params.set("filter", filter);

    const res = await fetch(FREESOUND_API_BASE + "?" + params.toString());
    if (!res.ok) throw new Error("Freesound HTTP " + res.status);
    const data = await res.json();
    return pickPreviewUrlFromResults(data.results);
  }

  async function fetchFreesoundPreviewUrl(effectKey) {
    if (!FREESOUND_TOKEN) return null;
    if (freesoundUrlCache[effectKey]) return freesoundUrlCache[effectKey];
    if (freesoundFetchPromises[effectKey]) return freesoundFetchPromises[effectKey];

    const spec = FREESOUND_EFFECTS[effectKey];
    if (!spec) return null;

    const filtersToTry = [spec.filter]
      .concat(spec.fallbackFilters || [])
      .filter(Boolean);

    freesoundFetchPromises[effectKey] = (async function () {
      try {
        for (let i = 0; i < filtersToTry.length; i++) {
          const url = await searchFreesoundOnce(
            spec.query,
            filtersToTry[i],
            spec.sort
          );
          if (url) {
            freesoundUrlCache[effectKey] = url;
            return url;
          }
        }
        const queryOnlyUrl = await searchFreesoundOnce(
          spec.query,
          "",
          spec.sort
        );
        if (queryOnlyUrl) {
          freesoundUrlCache[effectKey] = queryOnlyUrl;
          return queryOnlyUrl;
        }
        throw new Error("No preview URL in search results");
      } catch (err) {
        console.warn("[Freesound] 搜尋失敗:", effectKey, err);
        return null;
      } finally {
        delete freesoundFetchPromises[effectKey];
      }
    })();

    return freesoundFetchPromises[effectKey];
  }

  async function ensureFreesoundPreloaded(effectKey) {
    if (!FREESOUND_TOKEN) return null;

    try {
      const spec = FREESOUND_EFFECTS[effectKey];
      if (!spec) return null;

      const existing = freesoundPreloadedAudio[effectKey];
      if (existing && existing.dataset.ready === "1") return existing;

      const url = await fetchFreesoundPreviewUrl(effectKey);
      if (!url) return null;

      const player = existing || new Audio();
      player.preload = "auto";
      player.volume = spec.volume != null ? spec.volume : 0.8;
      freesoundPreloadedAudio[effectKey] = player;

      if (player.src !== url) {
        player.dataset.ready = "0";
        player.src = url;
        player.load();
      }

      await new Promise(function (resolve) {
        if (player.readyState >= 3) {
          player.dataset.ready = "1";
          resolve();
          return;
        }
        const done = function () {
          player.dataset.ready = "1";
          resolve();
        };
        player.addEventListener("canplaythrough", done, { once: true });
        player.addEventListener("error", resolve, { once: true });
        setTimeout(resolve, 2500);
      });

      return player;
    } catch (err) {
      console.warn("[Freesound] 預載失敗:", effectKey, err);
      return null;
    }
  }

  async function preloadCheerSound() {
    if (!FREESOUND_TOKEN) return;
    try {
      const player = await ensureFreesoundPreloaded("cheer");
      if (player) cheerAudioPlayer = player;
    } catch (err) {
      console.warn("[Freesound] 歡呼預載失敗:", err);
    }
  }

  function getWebAudioContext() {
    if (!webAudioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      webAudioCtx = new Ctx();
    }
    if (webAudioCtx.state === "suspended") {
      webAudioCtx.resume().catch(function () {});
    }
    return webAudioCtx;
  }

  /** 扣血：本地後備提醒音 */
  function playLifeWarningFallback() {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const dur = 0.15;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(200, t);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function playLifeWarningSound() {
    if (FREESOUND_TOKEN) {
      void playFreesoundById(SOUND_ID_LIFE, 0.85);
      return;
    }
    playLifeWarningFallback();
  }

  /** 加分用的本地合成短促「叮！」（在沒有 Freesound 金鑰時使用） */
  function playScoreDingFallback() {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const dur = 0.1;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.32, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function playScoreDing() {
    if (FREESOUND_TOKEN) {
      void playFreesoundById(SOUND_ID_SCORE, 0.9);
      return;
    }
    playScoreDingFallback();
  }

  /** 孵化：Q 彈雙音節卡通魔法感 */
  function playHatchSound() {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(400, t);
    osc1.frequency.exponentialRampToValueAtTime(600, t + 0.05);
    gain1.gain.setValueAtTime(0.0001, t);
    gain1.gain.exponentialRampToValueAtTime(0.34, t + 0.008);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.06);

    const t2 = t + 0.055;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(800, t2);
    osc2.frequency.exponentialRampToValueAtTime(1500, t2 + 0.14);
    gain2.gain.setValueAtTime(0.0001, t2);
    gain2.gain.exponentialRampToValueAtTime(0.38, t2 + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.18);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.22);
  }

  function playLuckyDrawPulse() {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(58, t + 0.09);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.42, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  function stopLuckyDrawSuspense() {
    if (luckyDrawSuspenseTimer !== null) {
      clearTimeout(luckyDrawSuspenseTimer);
      luckyDrawSuspenseTimer = null;
    }
  }

  function scheduleLuckyDrawSuspense(startedAt) {
    const elapsed = Date.now() - startedAt;
    if (elapsed >= LUCKY_DRAW_MS || !luckyDrawRunning) {
      stopLuckyDrawSuspense();
      return;
    }

    if (!FREESOUND_TOKEN) {
      playLuckyDrawPulse();
    }
    const progress = elapsed / LUCKY_DRAW_MS;
    const interval = Math.max(100, 500 - progress * 400);

    luckyDrawSuspenseTimer = setTimeout(function () {
      scheduleLuckyDrawSuspense(startedAt);
    }, interval);
  }

  function playLuckyDrawSound() {
    if (FREESOUND_TOKEN) {
      void playFreesoundById(SOUND_ID_LUCKY, 0.9);
      return;
    }
    playLuckyWinFanfare();
  }

  /** 抽籤揭曉：本地後備慶祝音 */
  function playLuckyWinFanfare() {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const dur = 0.22;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.45, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);

    const t2 = t + 0.08;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, t2);
    osc2.frequency.exponentialRampToValueAtTime(2093, t2 + 0.15);
    gain2.gain.setValueAtTime(0.0001, t2);
    gain2.gain.exponentialRampToValueAtTime(0.35, t2 + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.16);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t2);
    osc2.stop(t2 + 0.18);
  }

  /** 倒計時結束：Frequent tone，本地後備提示音 */
  function playTimerAlarmFallback() {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    [0, 0.15, 0.3].forEach(function (offset, i) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 2 ? "triangle" : "sine";
      const freq = i === 2 ? 1320 : 880;
      osc.frequency.setValueAtTime(freq, t + offset);
      gain.gain.setValueAtTime(0.0001, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.35, t + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.25);
    });
  }

  function showTimerAlarmModal() {
    syncTimerExpandedAlarmButton();
    syncTimerMiniAlarmButton();
    if (timerExpanded || timerMiniVisible) {
      const modal = document.getElementById("timer-alarm-modal");
      if (modal) modal.hidden = true;
      document.body.classList.remove("timer-alarm-open");
      return;
    }
    const modal = document.getElementById("timer-alarm-modal");
    if (modal) modal.hidden = false;
    document.body.classList.add("timer-alarm-open");
  }

  function hideTimerAlarmModal() {
    const modal = document.getElementById("timer-alarm-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("timer-alarm-open");
    syncTimerExpandedAlarmButton();
    syncTimerMiniAlarmButton();
  }

  function syncTimerExpandedAlarmButton() {
    const btn = document.getElementById("btn-timer-expanded-alarm-close");
    if (!btn) return;
    btn.hidden = !(timerAlarmActive && timerExpanded);
  }

  function syncTimerMiniAlarmButton() {
    const btn = document.getElementById("btn-timer-mini-alarm-close");
    if (!btn) return;
    btn.hidden = !(timerAlarmActive && timerMiniVisible);
  }

  function syncTimerMiniModeLabel() {
    const modeEl = document.getElementById("timer-mini-mode");
    if (!modeEl) return;
    modeEl.textContent = timerMode === "countdown" ? "倒計時" : "正計時";
  }

  function positionTimerMiniDefault() {
    const widget = document.getElementById("timer-mini-widget");
    const teacherBtn = document.getElementById("btn-teacher-mode");
    const slot1 = document.querySelector('.slot[data-slot-id="1"]');
    if (!widget) return;

    const margin = 8;
    let top = margin;
    let left = margin;

    if (teacherBtn) {
      const tb = teacherBtn.getBoundingClientRect();
      top = tb.bottom + margin;
      left = tb.left;
    }

    if (slot1) {
      const s1 = slot1.getBoundingClientRect();
      left = s1.left;
      const preferredTop = s1.top - widget.offsetHeight - margin;
      if (preferredTop > margin) {
        top = preferredTop;
      } else if (teacherBtn) {
        top = teacherBtn.getBoundingClientRect().bottom + margin;
      }
    }

    const maxLeft = Math.max(margin, window.innerWidth - widget.offsetWidth - margin);
    const maxTop = Math.max(margin, window.innerHeight - widget.offsetHeight - margin);
    widget.style.left = Math.min(Math.max(left, margin), maxLeft) + "px";
    widget.style.top = Math.min(Math.max(top, margin), maxTop) + "px";
  }

  function showTimerMiniWidget() {
    const widget = document.getElementById("timer-mini-widget");
    if (!widget) return;
    timerMiniVisible = true;
    widget.hidden = false;
    document.body.classList.add("timer-mini-open");
    syncTimerMiniModeLabel();
    if (!timerMiniUserMoved) {
      positionTimerMiniDefault();
    }
    syncTimerMiniAlarmButton();
    updateTimerDisplay();
  }

  function hideTimerMiniWidget() {
    const widget = document.getElementById("timer-mini-widget");
    timerMiniVisible = false;
    if (widget) widget.hidden = true;
    document.body.classList.remove("timer-mini-open");
    syncTimerMiniAlarmButton();
    if (timerAlarmActive && !timerExpanded) {
      showTimerAlarmModal();
    }
  }

  function initTimerMiniWidget() {
    const widget = document.getElementById("timer-mini-widget");
    const closeBtn = document.getElementById("btn-timer-mini-close");
    const expandBtn = document.getElementById("btn-timer-mini-expand");
    const alarmBtn = document.getElementById("btn-timer-mini-alarm-close");
    const head = widget ? widget.querySelector(".timer-mini-widget__head") : null;

    if (closeBtn) closeBtn.addEventListener("click", hideTimerMiniWidget);
    if (expandBtn) {
      expandBtn.addEventListener("click", function () {
        if (timerMiniDragMoved) return;
        expandTimerDisplay();
      });
    }
    if (alarmBtn) {
      alarmBtn.addEventListener("click", function () {
        stopTimerAlarmLoop();
        hideTimerMiniWidget();
      });
    }

    let timerMiniDragMoved = false;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginLeft = 0;
    let dragOriginTop = 0;

    function onDragStart(clientX, clientY) {
      if (!widget) return;
      dragging = true;
      timerMiniDragMoved = false;
      dragStartX = clientX;
      dragStartY = clientY;
      const rect = widget.getBoundingClientRect();
      dragOriginLeft = rect.left;
      dragOriginTop = rect.top;
    }

    function onDragMove(clientX, clientY) {
      if (!dragging || !widget) return;
      const dx = clientX - dragStartX;
      const dy = clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        timerMiniDragMoved = true;
        timerMiniUserMoved = true;
      }
      const margin = 8;
      const maxLeft = Math.max(margin, window.innerWidth - widget.offsetWidth - margin);
      const maxTop = Math.max(margin, window.innerHeight - widget.offsetHeight - margin);
      const nextLeft = Math.min(Math.max(dragOriginLeft + dx, margin), maxLeft);
      const nextTop = Math.min(Math.max(dragOriginTop + dy, margin), maxTop);
      widget.style.left = nextLeft + "px";
      widget.style.top = nextTop + "px";
    }

    function onDragEnd() {
      dragging = false;
    }

    if (head) {
      head.addEventListener("mousedown", function (ev) {
        if (ev.target.closest(".timer-mini-widget__close")) return;
        ev.preventDefault();
        onDragStart(ev.clientX, ev.clientY);
      });
      head.addEventListener(
        "touchstart",
        function (ev) {
          if (ev.target.closest(".timer-mini-widget__close")) return;
          if (!ev.touches || !ev.touches[0]) return;
          ev.preventDefault();
          onDragStart(ev.touches[0].clientX, ev.touches[0].clientY);
        },
        { passive: false }
      );
    }

    document.addEventListener("mousemove", function (ev) {
      if (!dragging) return;
      onDragMove(ev.clientX, ev.clientY);
    });
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("touchmove", function (ev) {
      if (!dragging || !ev.touches || !ev.touches[0]) return;
      onDragMove(ev.touches[0].clientX, ev.touches[0].clientY);
    });
    document.addEventListener("touchend", onDragEnd);

    window.addEventListener("resize", function () {
      if (timerMiniVisible && !timerMiniUserMoved) {
        positionTimerMiniDefault();
      }
    });
  }

  function stopTimerAlarmLoop() {
    timerAlarmActive = false;
    hideTimerAlarmModal();
    if (timerAlarmAudio) {
      timerAlarmAudio.loop = false;
      timerAlarmAudio.pause();
      timerAlarmAudio.currentTime = 0;
      timerAlarmAudio = null;
    }
    if (timerAlarmIntervalId !== null) {
      clearInterval(timerAlarmIntervalId);
      timerAlarmIntervalId = null;
    }
  }

  function dismissTimerAlarmAndReturn() {
    stopTimerAlarmLoop();
    shrinkTimerDisplay();
    closeToolsSidebar();
  }

  async function startTimerAlarmLoop() {
    if (timerAlarmActive) return;
    timerAlarmActive = true;
    showTimerAlarmModal();

    if (FREESOUND_TOKEN) {
      try {
        const audio = await ensureFreesoundAudioById(SOUND_ID_TIMER, 0.9);
        if (audio) {
          timerAlarmAudio = audio;
          audio.loop = true;
          audio.currentTime = 0;
          await audio.play();
          return;
        }
      } catch (err) {
        console.warn("[Freesound] 倒計時循環音效失敗:", err);
      }
    }

    playTimerAlarmFallback();
    timerAlarmIntervalId = setInterval(playTimerAlarmFallback, 1400);
  }

  function playTimerMinuteCue() {
    if (!timerMinuteCueEnabled) return;
    if (FREESOUND_TOKEN) {
      void playFreesoundById(SOUND_ID_TIMER_MINUTE, 0.85);
      return;
    }
    playScoreDingFallback();
  }

  function loadTimerMinuteCueSetting() {
    /* 由雲端 applyCloudData 載入 */
  }

  function saveTimerMinuteCueSetting() {
    scheduleCloudSync();
  }

  function updateTimerMinuteCueButtonUI() {
    const btn = document.getElementById("btn-timer-minute-cue");
    if (!btn) return;
    btn.hidden = timerMode !== "countdown";
    btn.classList.toggle("is-on", timerMinuteCueEnabled);
    btn.setAttribute("aria-pressed", timerMinuteCueEnabled ? "true" : "false");
    btn.textContent = timerMinuteCueEnabled
      ? "🔔 分鐘提示：開"
      : "🔕 分鐘提示：關";
  }

  function setupCountdownMinuteCues(initialMs) {
    countdownInitialMs = initialMs;
    countdownMinuteCuesPlayed = [];
    countdownMinuteThresholds = [];
    if (
      timerMinuteCueEnabled &&
      timerMode === "countdown" &&
      initialMs >= 5 * 60 * 1000
    ) {
      countdownMinuteThresholds = [240000, 180000, 120000, 60000];
    }
  }

  function checkCountdownMinuteCues(ms) {
    if (!timerRunning || timerMode !== "countdown") return;
    if (!countdownMinuteThresholds.length) return;

    countdownMinuteThresholds.forEach(function (threshold) {
      if (
        ms <= threshold &&
        countdownMinuteCuesPlayed.indexOf(threshold) < 0
      ) {
        countdownMinuteCuesPlayed.push(threshold);
        playTimerMinuteCue();
      }
    });
  }

  async function playFreesoundEffect(effectKey) {
    try {
      const spec = FREESOUND_EFFECTS[effectKey];
      if (!spec || !FREESOUND_TOKEN) return;

      let url = freesoundUrlCache[effectKey] || null;
      const preloaded = freesoundPreloadedAudio[effectKey];
      if (preloaded && preloaded.src) {
        url = preloaded.src;
      }
      if (!url) {
        url = await fetchFreesoundPreviewUrl(effectKey);
      }
      if (!url) return;

      if (activeFreesoundPlayer) {
        try {
          activeFreesoundPlayer.pause();
        } catch (_) {
          /* ignore */
        }
      }

      const player =
        preloaded && preloaded.src === url ? preloaded : new Audio(url);
      player.volume = spec.volume != null ? spec.volume : 0.8;
      player.currentTime = 0;
      activeFreesoundPlayer = player;
      await player.play();
    } catch (err) {
      console.warn("[Freesound] 播放失敗:", effectKey, err);
    }
  }

  function preloadFreesoundEffects() {
    if (!FREESOUND_TOKEN) return;
    preloadFreesoundByIds();
    preloadCheerSound();
    Object.keys(FREESOUND_EFFECTS).forEach(function (key) {
      if (key === "cheer") return;
      ensureFreesoundPreloaded(key).catch(function () {});
    });
  }

  function todayDateKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function ensureSiteAccess(onDone) {
    try {
      if (sessionStorage.getItem(SITE_ACCESS_SESSION_KEY) === "1") {
        onDone(true);
        return;
      }
    } catch (e) {}

    const modal = document.getElementById("site-access-modal");
    const input = document.getElementById("site-access-password");
    const submitBtn = document.getElementById("btn-site-access-submit");
    const cancelBtn = document.getElementById("btn-site-access-cancel");
    const errorEl = document.getElementById("site-access-error");

    if (!modal || !input || !submitBtn) {
      onDone(false);
      return;
    }

    function showError(show) {
      if (errorEl) errorEl.hidden = !show;
    }

    function closeGate() {
      modal.hidden = true;
      document.body.classList.remove("site-access-open");
      input.value = "";
      showError(false);
    }

    function denyAccess() {
      closeGate();
      document.body.innerHTML =
        '<main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;">' +
        '<div style="max-width:420px;padding:1rem 1.25rem;border-radius:12px;background:#fff7ed;color:#7c2d12;border:2px solid #fdba74;font-weight:700;text-align:center;">' +
        "未輸入正確密碼，已停止進入網站。" +
        "</div></main>";
      onDone(false);
    }

    function trySubmit() {
      const val = input.value.trim();
      if (val === SITE_ACCESS_PASSWORD) {
        try {
          sessionStorage.setItem(SITE_ACCESS_SESSION_KEY, "1");
        } catch (e) {}
        closeGate();
        onDone(true);
        return;
      }
      showError(true);
      input.value = "";
      input.focus();
    }

    function onSubmitClick() {
      trySubmit();
    }

    function onCancelClick() {
      denyAccess();
    }

    function onInputKey(ev) {
      if (ev.key === "Enter") {
        ev.preventDefault();
        trySubmit();
      }
    }

    submitBtn.addEventListener("click", onSubmitClick);
    if (cancelBtn) cancelBtn.addEventListener("click", onCancelClick);
    input.addEventListener("keydown", onInputKey);

    modal.hidden = false;
    document.body.classList.add("site-access-open");
    showError(false);
    setTimeout(function () {
      input.focus();
    }, 0);
  }

  function loadGroups() {
    if (!Array.isArray(groups)) {
      groups = [];
    }
  }

  function saveGroups() {
    scheduleCloudSync();
  }

  function nextGroupId() {
    let max = 0;
    groups.forEach(function (g) {
      if (g.id > max) max = g.id;
    });
    return max + 1;
  }

  function getGroupById(groupId) {
    return groups.find(function (g) {
      return g.id === groupId;
    });
  }

  function formatScoreDelta(delta) {
    return (delta > 0 ? "+" : "") + delta + "分";
  }

  function captureScoreUndoSnapshot() {
    return {
      scores: slots.map(function (s) {
        return { id: s.id, score: s.score };
      }),
      todayScore: getTodayClassScore(),
      scoreKingSession: scoreKingMission.active ? scoreKingMission.sessionScore : null,
    };
  }

  function pushScoreUndoSnapshot() {
    scoreUndoStack.push(captureScoreUndoSnapshot());
    if (scoreUndoStack.length > SCORE_UNDO_MAX) {
      scoreUndoStack.shift();
    }
    refreshScoreUndoButton();
  }

  function applyScoreUndoSnapshot(snapshot) {
    snapshot.scores.forEach(function (entry) {
      const s = getSlotById(entry.id);
      if (s) s.score = entry.score;
    });
    const pack = loadDailyScoreLog();
    pack.todayScore =
      typeof snapshot.todayScore === "number" ? Math.max(0, snapshot.todayScore) : 0;
    saveDailyScoreLog(pack);
    dailyScorePack = pack;
    if (snapshot.scoreKingSession !== null && scoreKingMission.active) {
      scoreKingMission.sessionScore = snapshot.scoreKingSession;
      updateMissionScoreHud();
    }
    saveSlots();
    slots.forEach(updateSlotPresentation);
  }

  function undoLastScoreAction() {
    if (!teacherMode) return;
    if (!scoreUndoStack.length) {
      showAppToast("沒有可復原的加減分行動。", { variant: "warn" });
      return;
    }
    const snapshot = scoreUndoStack.pop();
    applyScoreUndoSnapshot(snapshot);
    refreshScoreUndoButton();
  }

  function refreshScoreUndoButton() {
    const btn = document.getElementById("btn-score-undo");
    if (!btn) return;
    btn.hidden = !teacherMode;
    btn.disabled = scoreUndoStack.length === 0;
  }

  function showScoreToast(slot, delta) {
    if (!delta) return;
    const toast = document.getElementById("score-toast");
    const textEl = document.getElementById("score-toast-text");
    if (!toast || !textEl) return;

    const name =
      slot.name && slot.name !== DEFAULT_NAME ? slot.name : slot.id + "號學生";
    textEl.textContent = name + "表現佳！" + formatScoreDelta(delta) + "！";

    if (scoreToastTimeoutId !== null) {
      clearTimeout(scoreToastTimeoutId);
      scoreToastTimeoutId = null;
    }

    toast.hidden = false;
    const card = toast.querySelector(".score-toast__card");
    if (card) {
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";
    }

    scoreToastTimeoutId = setTimeout(function () {
      toast.hidden = true;
      scoreToastTimeoutId = null;
    }, 2200);
  }

  function showGroupScoreToast(group, delta) {
    if (!delta || !group) return;
    const toast = document.getElementById("score-toast");
    const textEl = document.getElementById("score-toast-text");
    if (!toast || !textEl) return;

    textEl.textContent =
      "「" + group.name + "」全組表現佳！" + formatScoreDelta(delta) + "！";

    if (scoreToastTimeoutId !== null) {
      clearTimeout(scoreToastTimeoutId);
    }
    toast.hidden = false;
    const card = toast.querySelector(".score-toast__card");
    if (card) {
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";
    }
    scoreToastTimeoutId = setTimeout(function () {
      toast.hidden = true;
      scoreToastTimeoutId = null;
    }, 2200);
  }

  function slotDisplayLabel(slot) {
    const name =
      slot.name && slot.name !== DEFAULT_NAME ? slot.name : "待命名";
    return slot.id + "號 · " + name;
  }

  function updateBulkPickUI() {
    normalizeBulkSelectedIds();
    const count = bulkSelectedIds.length;
    const showBulkScore = bulkPickActive && count > 0;

    const countEl = document.getElementById("bulk-pick-count");
    if (countEl) {
      countEl.hidden = !showBulkScore;
      countEl.textContent = showBulkScore ? "已揀 " + count + " 人" : "";
    }

    const inline = document.getElementById("bulk-score-inline");
    const inlineLabel = document.getElementById("bulk-score-inline-label");
    if (inline) inline.hidden = !showBulkScore;
    if (inlineLabel && showBulkScore) {
      inlineLabel.textContent =
        "已揀選 " +
        count +
        " 人" +
        (teacherMode ? "，可加分或減分：" : "，點擊加分：");
    }

    const bar = document.getElementById("bulk-score-bar");
    if (bar) bar.hidden = true;

    const minusSection = document.getElementById("bulk-score-minus-section");
    if (minusSection) minusSection.hidden = !teacherMode || !showBulkScore;

    document.body.classList.toggle("bulk-pick-active", bulkPickActive);
    refreshScoreUndoButton();
    slots.forEach(function (slot) {
      const el = document.querySelector('.slot[data-slot-id="' + slot.id + '"]');
      if (el) updateSlotBulkClasses(el, slot);
    });
  }

  function openBulkPickModal() {
    const modal = document.getElementById("bulk-pick-modal");
    const list = document.getElementById("bulk-pick-list");
    if (!modal || !list) return;

    list.innerHTML = "";
    slots.forEach(function (slot) {
      const li = document.createElement("li");
      li.className = "bulk-pick-item";
      const checked = bulkSelectedIds.indexOf(slot.id) >= 0;
      li.innerHTML =
        '<input type="checkbox" class="bulk-pick-item__check" data-bulk-slot-id="' +
        slot.id +
        '"' +
        (checked ? " checked" : "") +
        " />" +
        "<span>" +
        slotDisplayLabel(slot) +
        "</span>";
      const input = li.querySelector(".bulk-pick-item__check");
      li.addEventListener("click", function (ev) {
        if (ev.target === input) return;
        input.checked = !input.checked;
      });
      list.appendChild(li);
    });

    modal.hidden = false;
    document.body.classList.add("bulk-pick-modal-open");
  }

  function closeBulkPickModal() {
    const modal = document.getElementById("bulk-pick-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("bulk-pick-modal-open");
  }

  function getBulkPickModalSelectedIds() {
    const list = document.getElementById("bulk-pick-list");
    if (!list) return [];
    const ids = [];
    list.querySelectorAll(".bulk-pick-item__check:checked").forEach(function (el) {
      const id = parseInt(el.getAttribute("data-bulk-slot-id"), 10);
      if (!Number.isNaN(id)) ids.push(id);
    });
    return ids;
  }

  function confirmBulkPick() {
    bulkSelectedIds = getBulkPickModalSelectedIds();
    if (!bulkSelectedIds.length) {
      showAppToast("請至少揀選一位學生。", { variant: "warn" });
      return;
    }
    bulkPickActive = true;
    closeBulkPickModal();
    closeAllQuickScoreMenus();
    updateBulkPickUI();
  }

  function cancelBulkPick() {
    bulkPickActive = false;
    bulkSelectedIds = [];
    closeBulkPickModal();
    updateBulkPickUI();
  }

  function toggleBulkSlot(slotId) {
    if (!bulkPickActive) return;
    const idx = bulkSelectedIds.indexOf(slotId);
    if (idx >= 0) {
      bulkSelectedIds.splice(idx, 1);
    } else {
      bulkSelectedIds.push(slotId);
    }
    if (!bulkSelectedIds.length) {
      bulkPickActive = false;
    }
    updateBulkPickUI();
  }

  function showBulkScoreToast(count, delta) {
    const toast = document.getElementById("score-toast");
    const textEl = document.getElementById("score-toast-text");
    if (!toast || !textEl) return;

    textEl.textContent =
      delta > 0
        ? "已為 " + count + " 位學生各加" + formatScoreDelta(delta) + "！"
        : "已為 " + count + " 位學生各減" + Math.abs(delta) + "分！";

    if (scoreToastTimeoutId !== null) {
      clearTimeout(scoreToastTimeoutId);
    }
    toast.hidden = false;
    const card = toast.querySelector(".score-toast__card");
    if (card) {
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = "";
    }
    scoreToastTimeoutId = setTimeout(function () {
      toast.hidden = true;
      scoreToastTimeoutId = null;
    }, 2200);
  }

  function normalizeBulkSelectedIds() {
    const seen = {};
    bulkSelectedIds = bulkSelectedIds
      .map(function (id) {
        return parseInt(id, 10);
      })
      .filter(function (id) {
        if (Number.isNaN(id) || id < 1 || id > getSlotCount() || seen[id]) {
          return false;
        }
        seen[id] = true;
        return true;
      });
  }

  function applyBulkQuickScore(delta) {
    normalizeBulkSelectedIds();
    if (!bulkSelectedIds.length || !delta) return;

    pushScoreUndoSnapshot();

    let applied = 0;
    bulkSelectedIds.forEach(function (id) {
      const s = getSlotById(id);
      if (s && applyScoreDeltaToSlot(s, delta)) {
        applied += 1;
      }
    });
    if (!applied) {
      if (delta > 0) {
        showAppToast("所選學生均在睡眠中，無法加分。", { variant: "warn" });
      } else {
        showAppToast("找不到已揀選的學生資料，請重新揀選。", { variant: "warn" });
        cancelBulkPick();
      }
      return;
    }

    if (delta !== 0) {
      recordDailyScoreChange(delta * applied);
    }
    saveSlots();
    bulkSuccessIds = bulkSelectedIds.slice();
    if (bulkSuccessTimerId !== null) {
      clearTimeout(bulkSuccessTimerId);
    }
    bulkSuccessTimerId = setTimeout(function () {
      const ids = bulkSuccessIds.slice();
      bulkSuccessIds = [];
      ids.forEach(function (id) {
        const slot = getSlotById(id);
        const el = slot
          ? document.querySelector('.slot[data-slot-id="' + slot.id + '"]')
          : null;
        if (el && slot) updateSlotBulkClasses(el, slot);
      });
      bulkSuccessTimerId = null;
    }, 850);

    bulkSelectedIds.forEach(function (id) {
      const slot = getSlotById(id);
      if (slot) {
        if (slot.hatched) renderSlotElement(slot);
        else updateSlotPresentation(slot);
      }
    });
    renderGroupButtons();
    updateBulkPickUI();
    playScoreDing();
    showBulkScoreToast(applied, delta);
  }

  function onBulkScoreAction(defaultDelta) {
    if (!bulkSelectedIds.length) {
      cancelBulkPick();
      return;
    }
    applyBulkQuickScore(defaultDelta);
  }

  function applyBulkCustomScore(sign) {
    if (!bulkSelectedIds.length) {
      cancelBulkPick();
      return;
    }
    const inputId = sign > 0 ? "bulk-score-add-input" : "bulk-score-sub-input";
    const inputEl = document.getElementById(inputId);
    const raw = inputEl ? String(inputEl.value).trim() : "";
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0 || n > 99) {
      showAppToast("請輸入 1～99 的正整數。", { variant: "warn" });
      return;
    }
    if (inputEl) inputEl.value = "";
    applyBulkQuickScore(sign > 0 ? n : -n);
  }

  function initBulkUiBindings() {
    if (bulkUiBindingsDone) return;
    bulkUiBindingsDone = true;

    const btnBulkPick = document.getElementById("btn-bulk-pick");
    if (btnBulkPick) {
      btnBulkPick.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        openBulkPickModal();
      });
    }

    const btnBulkConfirm = document.getElementById("btn-bulk-pick-confirm");
    if (btnBulkConfirm) {
      btnBulkConfirm.addEventListener("click", function (ev) {
        ev.preventDefault();
        confirmBulkPick();
      });
    }

    const btnBulkClose = document.getElementById("btn-bulk-pick-close");
    if (btnBulkClose) {
      btnBulkClose.addEventListener("click", function () {
        closeBulkPickModal();
      });
    }

    const btnBulkCancel = document.getElementById("btn-bulk-pick-cancel");
    if (btnBulkCancel) {
      btnBulkCancel.addEventListener("click", function (ev) {
        ev.preventDefault();
        cancelBulkPick();
      });
    }

    const btnBulkAll = document.getElementById("btn-bulk-select-all");
    if (btnBulkAll) {
      btnBulkAll.addEventListener("click", function () {
        document.querySelectorAll(".bulk-pick-item__check").forEach(function (el) {
          el.checked = true;
        });
      });
    }

    const btnBulkNone = document.getElementById("btn-bulk-select-none");
    if (btnBulkNone) {
      btnBulkNone.addEventListener("click", function () {
        document.querySelectorAll(".bulk-pick-item__check").forEach(function (el) {
          el.checked = false;
        });
      });
    }

    const bulkModal = document.getElementById("bulk-pick-modal");
    if (bulkModal) {
      bulkModal.addEventListener("click", function (ev) {
        if (ev.target === bulkModal) closeBulkPickModal();
      });
    }

    const btnAlarmClose = document.getElementById("btn-timer-alarm-close");
    if (btnAlarmClose) {
      btnAlarmClose.addEventListener("click", function () {
        stopTimerAlarmLoop();
        timerAlarmPlayed = true;
      });
    }
  }

  function ensureGroupPanel() {
    const host = document.getElementById("group-score-panel-host");
    if (!host || groupPanelInitialized) return;

    const panel = document.createElement("section");
    panel.id = "group-score-panel";
    panel.className = "group-score-panel";
    panel.setAttribute("aria-label", "組別加分");
    panel.innerHTML =
      '<div class="group-score-panel__bulk">' +
      '<button type="button" id="btn-bulk-pick" class="group-score-panel__bulk-btn" title="自由揀選學生批量加分">☑ 批量揀選</button>' +
      '<span id="bulk-pick-count" class="group-score-panel__bulk-count" hidden></span>' +
      "</div>" +
      '<div id="bulk-score-inline" class="group-score-panel__bulk-score" hidden>' +
      '<p id="bulk-score-inline-label" class="group-score-panel__bulk-score-label">已揀選 0 人</p>' +
      '<div class="group-score-panel__bulk-row">' +
      '<span class="group-score-panel__bulk-row-label">加分</span>' +
      '<div class="group-score-panel__bulk-btns">' +
      '<button type="button" class="bulk-score-quick-btn" data-bulk-delta="1">+1</button>' +
      '<button type="button" class="bulk-score-quick-btn" data-bulk-delta="2">+2</button>' +
      '<button type="button" class="bulk-score-quick-btn" data-bulk-delta="3">+3</button>' +
      '<button type="button" class="bulk-score-quick-btn" data-bulk-delta="4">+4</button>' +
      '<button type="button" class="bulk-score-quick-btn" data-bulk-delta="5">+5</button>' +
      "</div>" +
      '<div class="group-score-panel__bulk-custom">' +
      '<input id="bulk-score-add-input" class="group-score-panel__bulk-custom-input" type="number" min="1" max="99" placeholder="分數" aria-label="自訂加分" />' +
      '<button type="button" id="btn-bulk-score-add-custom" class="bulk-score-custom-btn bulk-score-custom-btn--add">套用加分</button>' +
      "</div>" +
      "</div>" +
      '<div id="bulk-score-minus-section" class="group-score-panel__bulk-row" hidden>' +
      '<span class="group-score-panel__bulk-row-label">減分</span>' +
      '<div class="group-score-panel__bulk-btns">' +
      '<button type="button" class="bulk-score-quick-btn bulk-score-quick-btn--minus" data-bulk-delta="-1">-1</button>' +
      '<button type="button" class="bulk-score-quick-btn bulk-score-quick-btn--minus" data-bulk-delta="-2">-2</button>' +
      '<button type="button" class="bulk-score-quick-btn bulk-score-quick-btn--minus" data-bulk-delta="-3">-3</button>' +
      '<button type="button" class="bulk-score-quick-btn bulk-score-quick-btn--minus" data-bulk-delta="-4">-4</button>' +
      '<button type="button" class="bulk-score-quick-btn bulk-score-quick-btn--minus" data-bulk-delta="-5">-5</button>' +
      "</div>" +
      '<div class="group-score-panel__bulk-custom">' +
      '<input id="bulk-score-sub-input" class="group-score-panel__bulk-custom-input" type="number" min="1" max="99" placeholder="分數" aria-label="自訂減分" />' +
      '<button type="button" id="btn-bulk-score-sub-custom" class="bulk-score-custom-btn bulk-score-custom-btn--sub">套用減分</button>' +
      "</div>" +
      "</div>" +
      '<button type="button" id="btn-bulk-pick-cancel" class="group-score-panel__bulk-cancel">取消揀選</button>' +
      "</div>" +
      '<div class="group-score-panel__head">' +
      '<span class="group-score-panel__label">組別加分</span>' +
      '<button type="button" id="btn-group-manage" class="group-score-panel__manage" title="管理組別">⚙ 管理</button>' +
      "</div>" +
      '<div id="group-buttons" class="group-score-panel__buttons"></div>';

    host.appendChild(panel);

    panel.querySelectorAll(".bulk-score-quick-btn").forEach(function (btn) {
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        const delta = parseInt(btn.getAttribute("data-bulk-delta"), 10);
        if (!Number.isNaN(delta) && delta !== 0) {
          onBulkScoreAction(delta);
        }
      });
    });

    const btnBulkAddCustom = document.getElementById("btn-bulk-score-add-custom");
    if (btnBulkAddCustom) {
      btnBulkAddCustom.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        applyBulkCustomScore(1);
      });
    }
    const btnBulkSubCustom = document.getElementById("btn-bulk-score-sub-custom");
    if (btnBulkSubCustom) {
      btnBulkSubCustom.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (!teacherMode) return;
        applyBulkCustomScore(-1);
      });
    }
    const bulkAddInput = document.getElementById("bulk-score-add-input");
    if (bulkAddInput) {
      bulkAddInput.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          applyBulkCustomScore(1);
        }
      });
    }
    const bulkSubInput = document.getElementById("bulk-score-sub-input");
    if (bulkSubInput) {
      bulkSubInput.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault();
          if (teacherMode) applyBulkCustomScore(-1);
        }
      });
    }

    document.getElementById("btn-group-manage").addEventListener("click", function () {
      if (!teacherMode && !ensureTeacherModeOn()) return;
      openGroupManageModal();
    });

    const modal = document.getElementById("group-manage-modal");
    if (modal) {
      modal.addEventListener("click", function (ev) {
        if (ev.target === modal) closeGroupManageModal();
      });
    }
    const btnClose = document.getElementById("btn-group-manage-close");
    if (btnClose) btnClose.addEventListener("click", closeGroupManageModal);
    const btnAdd = document.getElementById("btn-group-add");
    if (btnAdd) btnAdd.addEventListener("click", onAddGroup);
    const builderModal = document.getElementById("group-builder-modal");
    if (builderModal) {
      builderModal.addEventListener("click", function (ev) {
        if (ev.target === builderModal) closeGroupBuilderModal();
      });
    }
    const builderBtnCancel = document.getElementById("btn-group-builder-cancel");
    if (builderBtnCancel) {
      builderBtnCancel.addEventListener("click", closeGroupBuilderModal);
    }
    const builderBtnConfirm = document.getElementById("btn-group-builder-confirm");
    if (builderBtnConfirm) {
      builderBtnConfirm.addEventListener("click", confirmAddGroupFromBuilder);
    }
    const builderBtnAll = document.getElementById("btn-group-builder-all");
    if (builderBtnAll) {
      builderBtnAll.addEventListener("click", function () {
        document.querySelectorAll(".group-builder-student-check").forEach(function (el) {
          el.checked = true;
        });
      });
    }
    const builderBtnNone = document.getElementById("btn-group-builder-none");
    if (builderBtnNone) {
      builderBtnNone.addEventListener("click", function () {
        document.querySelectorAll(".group-builder-student-check").forEach(function (el) {
          el.checked = false;
        });
      });
    }

    const membersModal = document.getElementById("group-members-modal");
    const membersClose = document.getElementById("btn-group-members-close");
    if (membersClose) {
      membersClose.addEventListener("click", closeGroupMembersModal);
    }
    if (membersModal) {
      membersModal.addEventListener("click", function (ev) {
        if (ev.target === membersModal) closeGroupMembersModal();
      });
    }
    const btnMembersAddAll = document.getElementById("btn-group-members-add-all");
    if (btnMembersAddAll) {
      btnMembersAddAll.addEventListener("click", function () {
        document.querySelectorAll(".group-members-add-check").forEach(function (el) {
          el.checked = true;
        });
      });
    }
    const btnMembersAddNone = document.getElementById("btn-group-members-add-none");
    if (btnMembersAddNone) {
      btnMembersAddNone.addEventListener("click", function () {
        document.querySelectorAll(".group-members-add-check").forEach(function (el) {
          el.checked = false;
        });
      });
    }
    const btnMembersAddConfirm = document.getElementById("btn-group-members-add-confirm");
    if (btnMembersAddConfirm) {
      btnMembersAddConfirm.addEventListener("click", function () {
        if (activeGroupMembersModalId !== null) {
          confirmAddMembersToGroup(activeGroupMembersModalId);
        }
      });
    }
    const btnMembersAddToggle = document.getElementById("btn-group-members-add-toggle");
    if (btnMembersAddToggle) {
      btnMembersAddToggle.addEventListener("click", toggleGroupMembersAddPanel);
    }

    groupPanelInitialized = true;
  }

  function setGroupMembersAddPanelOpen(open) {
    const toggle = document.getElementById("btn-group-members-add-toggle");
    const body = document.getElementById("group-members-add-body");
    if (!toggle || !body) return;
    const isOpen = !!open;
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    body.hidden = !isOpen;
  }

  function toggleGroupMembersAddPanel() {
    const toggle = document.getElementById("btn-group-members-add-toggle");
    const body = document.getElementById("group-members-add-body");
    if (!toggle || !body) return;
    setGroupMembersAddPanelOpen(body.hidden);
  }

  function renderGroupButtons() {
    const wrap = document.getElementById("group-buttons");
    if (!wrap) return;
    wrap.innerHTML = "";

    if (!groups.length) {
      const empty = document.createElement("p");
      empty.className = "group-score-panel__empty";
      empty.textContent = "尚無組別，請點「管理」新增";
      wrap.appendChild(empty);
      return;
    }

    groups.forEach(function (g) {
      const count = g.memberIds.length;
      const wrapItem = document.createElement("div");
      wrapItem.className = "group-btn-wrap";
      wrapItem.dataset.groupId = String(g.id);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "group-btn";
      btn.textContent = g.name + (count ? " (" + count + ")" : "");
      btn.title = count
        ? "查看「" + g.name + "」成員名單（" + count + " 人）"
        : "查看「" + g.name + "」成員名單";
      if (!count) btn.classList.add("is-empty");
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        openGroupMembersModal(g.id);
      });

      wrapItem.appendChild(btn);
      wrap.appendChild(wrapItem);
    });
  }

  function openGroupMembersModal(groupId) {
    const group = getGroupById(groupId);
    if (!group) return;
    closeQuickScoreMenu();
    closeGroupQuickScoreMenu();
    activeGroupMembersModalId = groupId;
    setGroupMembersAddPanelOpen(false);
    renderGroupMembersModal(groupId);
    const modal = document.getElementById("group-members-modal");
    if (modal) modal.hidden = false;
    document.body.classList.add("group-members-open");
  }

  function closeGroupMembersModal() {
    activeGroupMembersModalId = null;
    const modal = document.getElementById("group-members-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("group-members-open");
  }

  function renderGroupMembersModal(groupId) {
    const group = getGroupById(groupId);
    if (!group) return;

    const titleEl = document.getElementById("group-members-title");
    const countEl = document.getElementById("group-members-count");
    const listEl = document.getElementById("group-members-list");
    const emptyEl = document.getElementById("group-members-empty");
    const scoreRow = document.getElementById("group-members-score-row");
    const scoreBtns = document.getElementById("group-members-score-btns");

    if (titleEl) titleEl.textContent = "「" + group.name + "」成員名單";
    if (countEl) {
      countEl.textContent =
        group.memberIds.length > 0
          ? "共 " + group.memberIds.length + " 位成員"
          : "目前沒有成員";
    }

    if (listEl) {
      listEl.innerHTML = "";
      group.memberIds.forEach(function (slotId) {
        const slot = getSlotById(slotId);
        if (!slot) return;
        const li = document.createElement("li");
        li.className = "group-members-item";
        li.innerHTML =
          '<div class="group-members-item__info">' +
          slotDisplayLabel(slot) +
          '<span class="group-members-item__score">目前 ' +
          slot.score +
          " 分</span></div>";
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "group-members-item__remove";
        removeBtn.textContent = "移出組別";
        removeBtn.addEventListener("click", function () {
          removeMemberFromGroup(groupId, slotId);
        });
        li.appendChild(removeBtn);
        listEl.appendChild(li);
      });
    }

    if (emptyEl) emptyEl.hidden = group.memberIds.length > 0;
    if (scoreRow) scoreRow.hidden = group.memberIds.length === 0;

    if (scoreBtns && group.memberIds.length > 0) {
      scoreBtns.innerHTML = "";
      QUICK_ADD_VALUES.forEach(function (delta) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "group-members-modal__score-btn";
        btn.textContent = "+" + delta;
        btn.addEventListener("click", function () {
          applyGroupQuickScore(groupId, delta);
          closeGroupMembersModal();
        });
        scoreBtns.appendChild(btn);
      });
      if (teacherMode) {
        const customBtn = document.createElement("button");
        customBtn.type = "button";
        customBtn.className = "group-members-modal__score-btn";
        customBtn.textContent = "自訂";
        customBtn.addEventListener("click", function () {
          showAppPrompt(
            "可輸入正負整數，輸入 0 則取消。",
            "1",
            { title: "為「" + group.name + "」全組加分" }
          ).then(function (raw) {
            if (raw === null) return;
            const d = parseInt(raw, 10);
            if (!Number.isFinite(d) || d === 0) {
              if (raw.trim() !== "0") {
                showAppToast("請輸入非 0 的整數。", { variant: "warn" });
              }
              return;
            }
            applyGroupScoreDelta(group, d);
            closeGroupMembersModal();
          });
        });
        scoreBtns.appendChild(customBtn);
      }
    }

    renderGroupMembersAddList(groupId);
  }

  function renderGroupMembersAddList(groupId) {
    const group = getGroupById(groupId);
    const listEl = document.getElementById("group-members-add-list");
    if (!group || !listEl) return;

    listEl.innerHTML = "";
    const available = slots.filter(function (slot) {
      return group.memberIds.indexOf(slot.id) < 0;
    });

    if (!available.length) {
      const li = document.createElement("li");
      li.className = "group-members-modal__add-empty";
      li.textContent = "所有學生都已在這個組別內";
      listEl.appendChild(li);
      return;
    }

    available.forEach(function (slot) {
      const li = document.createElement("li");
      li.className = "group-members-add-item";
      li.innerHTML =
        '<input type="checkbox" class="group-members-add-check" data-slot-id="' +
        slot.id +
        '" />' +
        "<span>" +
        slotDisplayLabel(slot) +
        "</span>";
      const input = li.querySelector(".group-members-add-check");
      li.addEventListener("click", function (ev) {
        if (ev.target === input) return;
        input.checked = !input.checked;
      });
      listEl.appendChild(li);
    });
  }

  function getGroupMembersAddSelectedIds() {
    const ids = [];
    document.querySelectorAll(".group-members-add-check:checked").forEach(function (el) {
      const id = parseInt(el.getAttribute("data-slot-id"), 10);
      if (Number.isFinite(id)) ids.push(id);
    });
    return ids;
  }

  function confirmAddMembersToGroup(groupId) {
    if (!ensureTeacherModeOn()) return;
    const group = getGroupById(groupId);
    if (!group) return;
    const selectedIds = getGroupMembersAddSelectedIds();
    if (!selectedIds.length) {
      showAppToast("請至少選擇一位學生。", { variant: "warn" });
      return;
    }
    selectedIds.forEach(function (slotId) {
      if (group.memberIds.indexOf(slotId) < 0) {
        group.memberIds.push(slotId);
      }
    });
    saveGroups();
    renderGroupButtons();
    renderGroupMembersModal(groupId);
  }

  function removeMemberFromGroup(groupId, slotId) {
    if (!teacherMode) {
      ensureTeacherModeOn();
      return;
    }
    const group = getGroupById(groupId);
    const slot = getSlotById(slotId);
    if (!group || !slot) return;
    showAppConfirm(
      "確定將「" + slotDisplayLabel(slot) + "」移出「" + group.name + "」？",
      { title: "移出組別", confirmText: "移出", danger: true }
    ).then(function (ok) {
      if (!ok) return;
      group.memberIds = group.memberIds.filter(function (id) {
        return id !== slotId;
      });
      saveGroups();
      renderGroupButtons();
      if (activeGroupMembersModalId === groupId) {
        renderGroupMembersModal(groupId);
      }
    });
  }

  function openGroupManageModal() {
    const modal = document.getElementById("group-manage-modal");
    if (!modal) return;
    renderGroupManageList();
    modal.hidden = false;
    document.body.classList.add("group-manage-open");
  }

  function closeGroupManageModal() {
    const modal = document.getElementById("group-manage-modal");
    if (modal) modal.hidden = true;
    closeGroupBuilderModal();
    document.body.classList.remove("group-manage-open");
    renderGroupButtons();
  }

  function renderGroupManageList() {
    const list = document.getElementById("group-manage-list");
    if (!list) return;
    list.innerHTML = "";

    if (!groups.length) {
      const li = document.createElement("li");
      li.className = "group-manage-item";
      li.textContent = "尚無組別";
      list.appendChild(li);
      return;
    }

    groups.forEach(function (g) {
      const li = document.createElement("li");
      li.className = "group-manage-item";
      li.innerHTML =
        '<span class="group-manage-item__name">' +
        g.name +
        "</span>" +
        '<span class="group-manage-item__count">' +
        g.memberIds.length +
        " 人</span>";
      const btnRename = document.createElement("button");
      btnRename.type = "button";
      btnRename.className = "group-manage-item__btn group-manage-item__btn--rename";
      btnRename.textContent = "改名";
      btnRename.addEventListener("click", function () {
        onRenameGroup(g.id);
      });
      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "group-manage-item__btn group-manage-item__btn--delete";
      btnDelete.textContent = "刪除";
      btnDelete.addEventListener("click", function () {
        onDeleteGroup(g.id);
      });
      li.appendChild(btnRename);
      li.appendChild(btnDelete);
      list.appendChild(li);
    });

    const btnAdd = document.getElementById("btn-group-add");
    if (btnAdd) btnAdd.disabled = false;
  }

  function onAddGroup() {
    openGroupBuilderModal();
  }

  function openGroupBuilderModal() {
    const modal = document.getElementById("group-builder-modal");
    const nameInput = document.getElementById("group-builder-name");
    const list = document.getElementById("group-builder-student-list");
    if (!modal || !nameInput || !list) return;
    const defaultName = "組別 " + (groups.length + 1);
    nameInput.value = defaultName;
    list.innerHTML = "";
    slots.forEach(function (slot) {
      const li = document.createElement("li");
      li.className = "group-builder-student-item";
      li.innerHTML =
        '<input type="checkbox" class="group-builder-student-check" data-slot-id="' +
        slot.id +
        '" />' +
        "<span>" +
        slotDisplayLabel(slot) +
        "</span>";
      const input = li.querySelector(".group-builder-student-check");
      li.addEventListener("click", function (ev) {
        if (ev.target === input) return;
        input.checked = !input.checked;
      });
      list.appendChild(li);
    });
    modal.hidden = false;
    setTimeout(function () {
      nameInput.focus();
      nameInput.select();
    }, 0);
  }

  function closeGroupBuilderModal() {
    const modal = document.getElementById("group-builder-modal");
    if (modal) modal.hidden = true;
  }

  function getGroupBuilderSelectedIds() {
    const ids = [];
    document.querySelectorAll(".group-builder-student-check:checked").forEach(function (el) {
      const id = parseInt(el.getAttribute("data-slot-id"), 10);
      if (Number.isFinite(id)) ids.push(id);
    });
    return ids;
  }

  function confirmAddGroupFromBuilder() {
    const nameInput = document.getElementById("group-builder-name");
    const fallbackName = "組別 " + (groups.length + 1);
    const name = nameInput ? (nameInput.value || "").trim() || fallbackName : fallbackName;
    const selectedIds = getGroupBuilderSelectedIds();
    groups.push({ id: nextGroupId(), name: name, memberIds: selectedIds });
    saveGroups();
    renderGroupManageList();
    renderGroupButtons();
    closeGroupBuilderModal();
  }

  function onRenameGroup(groupId) {
    const g = getGroupById(groupId);
    if (!g) return;
    showAppPrompt("請輸入新的組別名稱：", g.name, { title: "重新命名組別" }).then(
      function (input) {
        if (input === null) return;
        g.name = input.trim() || g.name;
        saveGroups();
        renderGroupManageList();
        renderGroupButtons();
      }
    );
  }

  function onDeleteGroup(groupId) {
    const g = getGroupById(groupId);
    if (!g) return;
    showAppConfirm('確定要刪除組別「' + g.name + '」嗎？', {
      title: "刪除組別",
      confirmText: "刪除",
      danger: true,
    }).then(function (ok) {
      if (!ok) return;
      groups = groups.filter(function (x) {
        return x.id !== groupId;
      });
      saveGroups();
      renderGroupManageList();
      renderGroupButtons();
    });
  }

  function assignSlotToGroup(slotId) {
    if (!groups.length) {
      showAppToast("尚無組別，請先點「組別加分」旁的「管理」新增組別。", {
        variant: "warn",
      });
      return;
    }

    const choices = groups.map(function (g, idx) {
      return {
        value: String(idx + 1),
        label: g.name,
        hint: "第 " + (idx + 1) + " 組 · " + g.memberIds.length + " 人",
      };
    });
    choices.push({
      value: "0",
      label: "不加入任何組別",
      hint: "將此學生從所有組別移出",
    });

    showAppChoice(
      "指定／變更組別",
      slotId + " 號學生要加入哪一組？（若已在該組，再次選擇會移出）",
      choices
    ).then(function (raw) {
      if (raw === null) return;
      const n = parseInt(raw, 10);
      if (Number.isNaN(n) || n < 0 || n > groups.length) {
        showAppToast("請選擇有效組別。", { variant: "warn" });
        return;
      }

      if (n === 0) {
        groups.forEach(function (g) {
          g.memberIds = g.memberIds.filter(function (id) {
            return id !== slotId;
          });
        });
        saveGroups();
        renderGroupButtons();
        showAppToast(slotId + " 號已移出所有組別。", { variant: "success" });
        return;
      }

      const target = groups[n - 1];
      if (target.memberIds.indexOf(slotId) < 0) {
        target.memberIds.push(slotId);
        saveGroups();
        renderGroupButtons();
        showAppToast(slotId + " 號已加入「" + target.name + "」。", {
          variant: "success",
        });
        return;
      }
      target.memberIds = target.memberIds.filter(function (id) {
        return id !== slotId;
      });
      saveGroups();
      renderGroupButtons();
      showAppToast(slotId + " 號已從「" + target.name + "」移除。", {
        variant: "success",
      });
    });
  }

  function closeGroupQuickScoreMenu() {
    if (activeGroupScoreMenuId === null) return;
    activeGroupScoreMenuId = null;
    renderGroupButtons();
  }

  function applyGroupScoreDelta(group, delta) {
    if (!group || !delta) return;
    pushScoreUndoSnapshot();
    let memberCount = 0;
    group.memberIds.forEach(function (id) {
      const s = getSlotById(id);
      if (s && applyScoreDeltaToSlot(s, delta)) {
        memberCount += 1;
      }
    });
    if (!memberCount) {
      if (delta > 0) {
        showAppToast("組別成員均在睡眠中，無法加分。", { variant: "warn" });
      }
      return;
    }
    if (delta !== 0) {
      recordDailyScoreChange(delta * memberCount);
    }
    saveSlots();
    group.memberIds.forEach(function (id) {
      const s = getSlotById(id);
      if (s) {
        if (s.hatched) renderSlotElement(s);
        else updateSlotPresentation(s);
      }
    });
    playScoreDing();
    showGroupScoreToast(group, delta);
  }

  function onGroupButtonClick(groupId) {
    openGroupMembersModal(groupId);
  }

  function applyGroupQuickScore(groupId, delta) {
    const group = getGroupById(groupId);
    if (!group || !group.memberIds.length) return;
    activeGroupScoreMenuId = null;
    applyGroupScoreDelta(group, delta);
  }

  function beastDisplayName(slot) {
    if (!slot.hatched) return "🥚 神獸蛋";
    const label = ANIMAL_LABELS[slot.animal] || slot.animal;
    return label + " 神獸";
  }

  function getSlotElement(slotId) {
    return document.querySelector('.slot[data-slot-id="' + slotId + '"]');
  }

  function applySlotDrawClasses(el, slotId) {
    if (!el) return;
    el.classList.toggle("slot--draw-flash", luckyDrawFlashId === slotId);
    el.classList.toggle("slot--draw-winner", luckyDrawWinnerIds.indexOf(slotId) >= 0);
  }

  function refreshAllSlotDrawClasses() {
    document.querySelectorAll(".slot").forEach(function (el) {
      const id = parseInt(el.dataset.slotId, 10);
      if (!Number.isNaN(id)) applySlotDrawClasses(el, id);
    });
  }

  function clearLuckyDrawVisuals() {
    luckyDrawFlashId = null;
    luckyDrawWinnerIds = [];
    refreshAllSlotDrawClasses();
  }

  function setLuckyDrawFlash(slotId) {
    const prev = luckyDrawFlashId;
    luckyDrawFlashId = slotId;
    if (prev !== slotId) {
      applySlotDrawClasses(getSlotElement(prev), prev);
      applySlotDrawClasses(getSlotElement(slotId), slotId);
    }
  }

  function pickRandomSlotId() {
    return Math.floor(Math.random() * getSlotCount()) + 1;
  }

  function pickUniqueWinnerIds(count) {
    const pool = [];
    for (let i = 1; i <= getSlotCount(); i++) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, count);
  }

  function buildLuckyWinnerRow(slot) {
    const row = document.createElement("div");
    row.className = "lucky-winner-row";

    const nameCol = document.createElement("div");
    nameCol.className = "lucky-winner-row__name";
    nameCol.innerHTML =
      '<span class="lucky-winner-row__slot-num">第 ' +
      slot.id +
      " 號</span>" +
      '<span class="lucky-winner-row__student">' +
      (slot.name || DEFAULT_NAME) +
      "</span>";

    const beastCol = document.createElement("div");
    beastCol.className = "lucky-winner-row__beast";

    if (slot.hatched) {
      appendHatchedBeast(beastCol, slot, "lucky-winner-row__viewer", {
        "auto-rotate": "",
        "rotation-per-second": "18deg",
        "shadow-intensity": "0.85",
      });
    } else {
      const egg = document.createElement("div");
      egg.className = "lucky-winner-row__egg";
      egg.style.setProperty("--egg-hue", String(eggHueForSlot(slot.id)));
      beastCol.appendChild(egg);
    }

    row.appendChild(nameCol);
    row.appendChild(beastCol);
    return row;
  }

  function showLuckyResultModal(winnerIds) {
    const modal = document.getElementById("lucky-result-modal");
    const bodyEl = document.getElementById("lucky-modal-body");
    if (!modal || !bodyEl) return;

    bodyEl.innerHTML = "";
    winnerIds.forEach(function (id) {
      const slot = getSlotById(id);
      if (!slot) return;
      bodyEl.appendChild(buildLuckyWinnerRow(slot));
    });

    modal.hidden = false;
    document.body.classList.add("lucky-modal-open");
  }

  function closeLuckyResultModal() {
    const modal = document.getElementById("lucky-result-modal");
    const bodyEl = document.getElementById("lucky-modal-body");
    if (bodyEl) bodyEl.innerHTML = "";
    luckyDrawWinnerIds = [];
    if (modal) modal.hidden = true;
    document.body.classList.remove("lucky-modal-open");
    clearLuckyDrawVisuals();
  }

  function applyLuckyWinnerScore(delta) {
    if (!luckyDrawWinnerIds.length || !delta) return;

    pushScoreUndoSnapshot();

    let applied = 0;
    luckyDrawWinnerIds.forEach(function (id) {
      const slot = getSlotById(id);
      if (slot && applyScoreDeltaToSlot(slot, delta)) {
        applied += 1;
      }
    });

    if (!applied) {
      if (delta > 0) {
        showAppToast("中選學生均在睡眠中，無法加分。", { variant: "warn" });
      }
      return;
    }

    recordDailyScoreChange(delta * applied);
    saveSlots();
    luckyDrawWinnerIds.forEach(function (id) {
      const slot = getSlotById(id);
      if (slot) {
        if (slot.hatched) renderSlotElement(slot);
        else updateSlotPresentation(slot);
      }
    });
    playScoreDing();

    const first = getSlotById(luckyDrawWinnerIds[0]);
    if (first) {
      if (luckyDrawWinnerIds.length === 1) {
        showScoreToast(first, delta);
      } else {
        showBulkScoreToast(applied, delta);
      }
    }
  }

  function initLuckyModalScoreButtons() {
    document.querySelectorAll(".lucky-score-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const delta = parseInt(btn.dataset.luckyDelta, 10);
        if (!Number.isFinite(delta) || delta <= 0) return;
        applyLuckyWinnerScore(delta);
      });
    });
  }

  function finishLuckyDraw(count) {
    stopLuckyDrawSuspense();
    luckyDrawRunning = false;
    document.body.classList.remove("lucky-draw-running");
    luckyDrawFlashId = null;

    luckyDrawWinnerIds = pickUniqueWinnerIds(count);
    refreshAllSlotDrawClasses();
    if (!FREESOUND_TOKEN) {
      playLuckyWinFanfare();
    }
    showLuckyResultModal(luckyDrawWinnerIds);

    const btn = document.getElementById("btn-lucky-start");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "🌟 開始抽籤";
    }
  }

  function startLuckyDraw() {
    if (luckyDrawRunning) return;

    const input = document.getElementById("lucky-count");
    let count = input ? parseInt(input.value, 10) : 1;
    if (Number.isNaN(count)) count = 1;
    count = Math.max(1, Math.min(getSlotCount(), count));

    if (input) input.value = String(count);

    closeToolsSidebar();
    closeLuckyResultModal();
    clearLuckyDrawVisuals();
    getWebAudioContext();

    luckyDrawRunning = true;
    document.body.classList.add("lucky-draw-running");

    const btn = document.getElementById("btn-lucky-start");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "✨ 抽籤中…";
    }

    const startedAt = Date.now();
    setLuckyDrawFlash(pickRandomSlotId());
    stopLuckyDrawSuspense();
    playLuckyDrawSound();
    if (!FREESOUND_TOKEN) {
      scheduleLuckyDrawSuspense(startedAt);
    }

    if (luckyDrawTimerId !== null) {
      clearInterval(luckyDrawTimerId);
    }

    luckyDrawTimerId = setInterval(function () {
      if (Date.now() - startedAt >= LUCKY_DRAW_MS) {
        clearInterval(luckyDrawTimerId);
        luckyDrawTimerId = null;
        finishLuckyDraw(count);
        return;
      }
      setLuckyDrawFlash(pickRandomSlotId());
    }, LUCKY_DRAW_TICK_MS);
  }

  function formatTimerMs(ms, showHours) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    if (showHours || h > 0) {
      return String(h).padStart(2, "0") + ":" + mm + ":" + ss;
    }
    return mm + ":" + ss;
  }

  function getCountdownSetupMs() {
    const minEl = document.getElementById("timer-min");
    const secEl = document.getElementById("timer-sec");
    let min = minEl ? parseInt(minEl.value, 10) : 1;
    let sec = secEl ? parseInt(secEl.value, 10) : 30;
    if (Number.isNaN(min)) min = 0;
    if (Number.isNaN(sec)) sec = 0;
    min = Math.max(0, Math.min(99, min));
    sec = Math.max(0, Math.min(59, sec));
    return (min * 60 + sec) * 1000;
  }

  function applyTimerDisplayState(display, text, urgent) {
    if (!display) return;
    display.textContent = text;
    display.classList.toggle("is-urgent", !!urgent);
  }

  function syncTimerExpandedModeLabel() {
    const modeEl = document.getElementById("timer-expanded-mode");
    if (!modeEl) return;
    modeEl.textContent = timerMode === "countdown" ? "倒計時" : "正計時";
  }

  function expandTimerDisplay() {
    const modal = document.getElementById("timer-expanded-modal");
    if (!modal) return;
    hideTimerMiniWidget();
    timerExpanded = true;
    modal.hidden = false;
    document.body.classList.add("timer-expanded-open");
    syncTimerExpandedModeLabel();
    updateTimerDisplay();
    if (timerAlarmActive) {
      const alarmModal = document.getElementById("timer-alarm-modal");
      if (alarmModal) alarmModal.hidden = true;
      document.body.classList.remove("timer-alarm-open");
    }
    syncTimerExpandedAlarmButton();
    syncTimerMiniAlarmButton();
  }

  function closeTimerExpanded() {
    const modal = document.getElementById("timer-expanded-modal");
    timerExpanded = false;
    if (modal) modal.hidden = true;
    document.body.classList.remove("timer-expanded-open");
    syncTimerExpandedAlarmButton();
    syncTimerMiniAlarmButton();
    if (timerAlarmActive && !timerMiniVisible) {
      showTimerAlarmModal();
    }
  }

  function shrinkTimerDisplay() {
    const modal = document.getElementById("timer-expanded-modal");
    timerExpanded = false;
    if (modal) modal.hidden = true;
    document.body.classList.remove("timer-expanded-open");
    timerMiniUserMoved = false;
    showTimerMiniWidget();
    syncTimerExpandedAlarmButton();
    syncTimerMiniAlarmButton();
    if (timerAlarmActive && !timerMiniVisible) {
      showTimerAlarmModal();
    }
  }

  function updateTimerDisplay() {
    const display = document.getElementById("timer-display");
    const expandedDisplay = document.getElementById("timer-display-expanded");
    const miniDisplay = document.getElementById("timer-display-mini");
    if (!display && !expandedDisplay && !miniDisplay) return;

    let ms = 0;
    if (timerMode === "stopwatch") {
      ms = stopwatchElapsedMs;
      if (timerRunning) {
        ms += Date.now() - stopwatchStartTs;
      }
      const text = formatTimerMs(ms, ms >= 3600000);
      applyTimerDisplayState(display, text, false);
      applyTimerDisplayState(expandedDisplay, text, false);
      applyTimerDisplayState(miniDisplay, text, false);
      return;
    }

    ms = countdownRemainingMs;
    if (timerRunning) {
      ms = Math.max(0, countdownEndTs - Date.now());
    }
    const text = formatTimerMs(ms, false);
    const urgent = timerRunning && ms > 0 && ms <= 10000;
    applyTimerDisplayState(display, text, urgent);
    applyTimerDisplayState(expandedDisplay, text, urgent);
    applyTimerDisplayState(miniDisplay, text, urgent);

    checkCountdownMinuteCues(ms);

    if (timerRunning && ms <= 0 && !timerAlarmPlayed) {
      timerAlarmPlayed = true;
      timerRunning = false;
      if (timerIntervalId !== null) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
      }
      countdownRemainingMs = 0;
      applyTimerDisplayState(display, "00:00", false);
      applyTimerDisplayState(expandedDisplay, "00:00", false);
      applyTimerDisplayState(miniDisplay, "00:00", false);
      void startTimerAlarmLoop();
    }
  }

  function stopTimerLoop() {
    if (timerIntervalId !== null) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  }

  function startTimerLoop() {
    stopTimerLoop();
    timerIntervalId = setInterval(updateTimerDisplay, 100);
    updateTimerDisplay();
  }

  function timerStart() {
    getWebAudioContext();
    timerAlarmPlayed = false;
    stopTimerAlarmLoop();

    if (timerMode === "stopwatch") {
      if (!timerRunning) {
        stopwatchStartTs = Date.now();
        timerRunning = true;
        startTimerLoop();
        expandTimerDisplay();
      }
      return;
    }

    if (!timerRunning) {
      if (countdownRemainingMs <= 0) {
        countdownRemainingMs = getCountdownSetupMs();
      }
      if (countdownRemainingMs <= 0) {
        countdownRemainingMs = 1000;
      }
      setupCountdownMinuteCues(countdownRemainingMs);
      countdownEndTs = Date.now() + countdownRemainingMs;
      timerRunning = true;
      startTimerLoop();
      expandTimerDisplay();
    }
  }

  function timerPause() {
    if (!timerRunning) return;

    if (timerMode === "stopwatch") {
      stopwatchElapsedMs += Date.now() - stopwatchStartTs;
    } else {
      countdownRemainingMs = Math.max(0, countdownEndTs - Date.now());
    }
    timerRunning = false;
    stopTimerLoop();
    updateTimerDisplay();
  }

  function timerReset() {
    timerRunning = false;
    timerAlarmPlayed = false;
    stopTimerAlarmLoop();
    stopTimerLoop();
    countdownMinuteThresholds = [];
    countdownMinuteCuesPlayed = [];

    if (timerMode === "stopwatch") {
      stopwatchElapsedMs = 0;
      stopwatchStartTs = 0;
    } else {
      countdownRemainingMs = getCountdownSetupMs();
      countdownEndTs = 0;
    }
    updateTimerDisplay();
  }

  function setTimerMode(mode) {
    timerMode = mode;
    timerRunning = false;
    timerAlarmPlayed = false;
    stopTimerAlarmLoop();
    stopTimerLoop();
    countdownMinuteThresholds = [];
    countdownMinuteCuesPlayed = [];
    updateTimerMinuteCueButtonUI();

    document.querySelectorAll(".timer-mode-tab").forEach(function (tab) {
      const active = tab.dataset.timerMode === mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });

    const setup = document.getElementById("countdown-setup");
    if (setup) setup.hidden = mode !== "countdown";

    if (mode === "countdown") {
      countdownRemainingMs = getCountdownSetupMs();
    } else {
      stopwatchElapsedMs = 0;
    }
    syncTimerExpandedModeLabel();
    syncTimerMiniModeLabel();
    updateTimerDisplay();
  }

  function openToolsSidebar() {
    const sidebar = document.getElementById("tools-sidebar");
    const overlay = document.getElementById("tools-overlay");
    const toggle = document.getElementById("btn-tools-toggle");
    if (!sidebar) return;

    sidebar.classList.add("is-open");
    sidebar.setAttribute("aria-hidden", "false");
    if (overlay) {
      overlay.hidden = false;
      overlay.classList.add("is-visible");
      overlay.setAttribute("aria-hidden", "false");
    }
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("tools-sidebar-open");
  }

  function closeToolsSidebar() {
    const sidebar = document.getElementById("tools-sidebar");
    const overlay = document.getElementById("tools-overlay");
    const toggle = document.getElementById("btn-tools-toggle");
    if (!sidebar) return;

    sidebar.classList.remove("is-open");
    sidebar.setAttribute("aria-hidden", "true");
    if (overlay) {
      overlay.classList.remove("is-visible");
      overlay.setAttribute("aria-hidden", "true");
      setTimeout(function () {
        if (!sidebar.classList.contains("is-open")) overlay.hidden = true;
      }, 300);
    }
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("tools-sidebar-open");
  }

  function toggleToolsSidebar() {
    const sidebar = document.getElementById("tools-sidebar");
    if (sidebar && sidebar.classList.contains("is-open")) {
      closeToolsSidebar();
    } else {
      openToolsSidebar();
    }
  }

  function pickRandomDailyMission() {
    const idx = Math.floor(Math.random() * DAILY_MISSIONS.length);
    return DAILY_MISSIONS[idx];
  }

  function getMissionRewardText(mission) {
    return (mission && mission.reward) || MISSION_DEFAULT_REWARD;
  }

  function resetActiveDailyMissionForRedraw() {
    closeDailyMissionModal();
    hideMissionReminder();
    if (scoreKingMission.active) {
      scoreKingMission.active = false;
      scoreKingMission.sessionScore = 0;
      hideMissionScoreHud();
    }
  }

  function confirmRedrawDailyMission() {
    return showAppConfirm("是否要重新抽取任務？\n目前的任務進度將會重置。", {
      title: "重新抽取任務",
      confirmText: "重新抽取",
      danger: true,
    });
  }

  function getDailyMissionById(id) {
    return DAILY_MISSIONS.find(function (m) {
      return m.id === id;
    });
  }

  function refreshMissionPickButton() {
    const pickBtn = document.getElementById("btn-mission-pick");
    if (!pickBtn) return;
    pickBtn.hidden = !teacherMode || !missionReminderVisible;
  }

  function stopScoreKingMissionSilently() {
    if (!scoreKingMission.active) return;
    scoreKingMission.active = false;
    scoreKingMission.sessionScore = 0;
    hideMissionScoreHud();
    saveMissionState();
  }

  function applyTeacherMissionReplacement(mission) {
    if (!teacherMode || !mission) return;
    stopScoreKingMissionSilently();
    dailyMissionDrawCommitted = true;
    showMissionReminder(mission);
    if (mission.type === "scoreKing") {
      startScoreKingMission();
    } else {
      saveMissionState();
    }
    closeMissionPickModal();
  }

  function renderMissionPickList() {
    const list = document.getElementById("mission-pick-list");
    if (!list) return;
    list.innerHTML = "";
    const currentId = currentDailyMission ? currentDailyMission.id : "";

    DAILY_MISSIONS.forEach(function (mission) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mission-pick-item";
      if (mission.id === currentId) btn.classList.add("is-current");
      btn.innerHTML =
        '<span class="mission-pick-item__title">' +
        mission.title +
        "</span>" +
        '<span class="mission-pick-item__desc">' +
        mission.desc +
        " <strong>" +
        getMissionRewardText(mission) +
        "</strong></span>" +
        (mission.id === currentId
          ? '<span class="mission-pick-item__badge">目前顯示中</span>'
          : "");
      btn.addEventListener("click", function () {
        applyTeacherMissionReplacement(mission);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function openMissionPickModal() {
    if (!teacherMode) {
      ensureTeacherModeOn();
      return;
    }
    if (!missionReminderVisible) {
      showAppToast("請先抽取或開始今日任務後，再揀選任務。", { variant: "warn" });
      return;
    }
    renderMissionPickList();
    const modal = document.getElementById("mission-pick-modal");
    if (modal) modal.hidden = false;
    document.body.classList.add("mission-pick-open");
  }

  function closeMissionPickModal() {
    const modal = document.getElementById("mission-pick-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("mission-pick-open");
  }

  function syncMissionHudLayout() {
    const stack = document.getElementById("dash-mission-stack");
    const reminderHud = document.getElementById("mission-reminder-hud");
    const showReminder = missionReminderVisible;
    const showScore = scoreKingMission.active;

    if (reminderHud) reminderHud.hidden = !showReminder;

    if (stack) {
      stack.hidden = !showReminder && !showScore;
    }

    refreshMissionPickButton();
    document.body.classList.toggle("mission-score-visible", showScore);
    document.body.classList.toggle("mission-reminder-visible", showReminder);
  }

  function getMissionFocusHtml(mission) {
    const reward = getMissionRewardText(mission);
    return (
      '<span class="daily-mission-modal__desc-line">' +
      mission.desc +
      ' <strong class="daily-mission-modal__reward-inline">' +
      reward +
      "</strong></span>"
    );
  }

  function fillMissionContent(target, mission) {
    if (target === "daily") {
      const nameEl = document.getElementById("daily-mission-name");
      const descEl = document.getElementById("daily-mission-desc");
      if (nameEl) nameEl.textContent = mission.title;
      if (descEl) descEl.innerHTML = getMissionFocusHtml(mission);
      return;
    }
    const titleEl = document.getElementById("mission-reminder-title");
    const reminderDesc = document.getElementById("mission-reminder-desc");
    if (titleEl) titleEl.textContent = mission.title;
    if (reminderDesc) reminderDesc.innerHTML = getMissionFocusHtml(mission);
  }

  function showMissionReminder(mission) {
    currentDailyMission = mission;
    missionReminderVisible = true;
    fillMissionContent("reminder", mission);
    setMissionReminderExpanded(false);
    syncMissionHudLayout();
    saveMissionState();
  }

  function hideMissionReminder() {
    missionReminderVisible = false;
    currentDailyMission = null;
    dailyMissionDrawCommitted = false;
    syncMissionHudLayout();
    saveMissionState();
  }

  function closeMissionReminderManual() {
    stopScoreKingMissionSilently();
    hideMissionReminder();
  }

  function beginClassWithMission(mission) {
    closeDailyMissionModal();
    showMissionReminder(mission);
    if (mission.type === "scoreKing") {
      startScoreKingMission();
    }
  }

  function playMissionDrawSound() {
    if (FREESOUND_TOKEN) {
      void playFreesoundById(SOUND_ID_MISSION_DRAW, 0.88);
      return;
    }
    playLuckyDrawPulse();
  }

  function notifyMissionScoreGain(delta) {
    if (!scoreKingMission.active || !Number.isFinite(delta) || delta <= 0) return;
    scoreKingMission.sessionScore += Math.floor(delta);
    updateMissionScoreHud();
    saveMissionState();
  }

  function updateMissionScoreHud() {
    const hud = document.getElementById("mission-score-hud");
    const valueEl = document.getElementById("mission-score-hud-value");
    const barEl = document.getElementById("mission-score-hud-bar");
    const track = document.querySelector(".mission-score-hud__track");
    const score = scoreKingMission.sessionScore;
    const pct = Math.min(100, (score / MISSION_SCORE_GOAL) * 100);

    if (valueEl) valueEl.textContent = String(score);
    if (barEl) barEl.style.width = pct + "%";
    if (track) {
      track.setAttribute("aria-valuenow", String(Math.min(score, MISSION_SCORE_GOAL)));
      track.setAttribute("aria-valuemax", String(MISSION_SCORE_GOAL));
    }
  }

  function showMissionScoreHud() {
    const hud = document.getElementById("mission-score-hud");
    if (hud) hud.hidden = false;
    updateMissionScoreHud();
    syncMissionHudLayout();
  }

  function hideMissionScoreHud() {
    const hud = document.getElementById("mission-score-hud");
    if (hud) hud.hidden = true;
    syncMissionHudLayout();
  }

  function closeDailyMissionModal() {
    const modal = document.getElementById("daily-mission-modal");
    const rollEl = document.getElementById("daily-mission-roll");
    if (modal) modal.hidden = true;
    if (rollEl) rollEl.hidden = true;
    document.body.classList.remove("daily-mission-open");
  }

  function openDailyMissionModal() {
    const modal = document.getElementById("daily-mission-modal");
    if (modal) modal.hidden = false;
    document.body.classList.add("daily-mission-open");
  }

  function renderDailyMissionReveal(mission) {
    const actionsEl = document.getElementById("daily-mission-actions");
    const rollEl = document.getElementById("daily-mission-roll");
    if (!actionsEl) return;

    if (rollEl) rollEl.hidden = true;
    fillMissionContent("daily", mission);
    dailyMissionDrawCommitted = true;
    saveMissionState();
    actionsEl.innerHTML = "";

    if (mission.type === "scoreKing") {
      const startBtn = document.createElement("button");
      startBtn.type = "button";
      startBtn.className = "tools-btn tools-btn--mission-start";
      startBtn.textContent = "⚔️ 開始：誰是得分王";
      startBtn.addEventListener("click", function () {
        beginClassWithMission(mission);
      });
      actionsEl.appendChild(startBtn);
      return;
    }

    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.className = "tools-btn tools-btn--class-start";
    startBtn.textContent = "課堂開始！";
    startBtn.addEventListener("click", function () {
      beginClassWithMission(mission);
    });
    actionsEl.appendChild(startBtn);
  }

  function runDailyMissionRollAnimation(done) {
    const rollEl = document.getElementById("daily-mission-roll");
    const nameEl = document.getElementById("daily-mission-name");
    const descEl = document.getElementById("daily-mission-desc");
    const actionsEl = document.getElementById("daily-mission-actions");
    if (!rollEl) {
      done();
      return;
    }

    const card = rollEl.closest(".daily-mission-modal__card");
    if (card) card.classList.add("is-rolling-reveal");

    if (nameEl) nameEl.textContent = "";
    if (descEl) descEl.innerHTML = "";
    if (actionsEl) actionsEl.innerHTML = "";
    rollEl.hidden = false;

    const started = Date.now();
    const tick = function () {
      const sample = DAILY_MISSIONS[Math.floor(Math.random() * DAILY_MISSIONS.length)];
      rollEl.textContent = "🎲 抽取中：「" + sample.title + "」…";
      if (Date.now() - started >= MISSION_ROLL_MS) {
        if (card) card.classList.remove("is-rolling-reveal");
        done();
        return;
      }
      setTimeout(tick, 85);
    };
    tick();
  }

  function needsMissionRedrawConfirm() {
    return dailyMissionDrawCommitted;
  }

  function drawDailyMission() {
    if (dailyMissionDrawRunning) return;

    if (needsMissionRedrawConfirm()) {
      confirmRedrawDailyMission().then(function (ok) {
        if (!ok) return;
        resetActiveDailyMissionForRedraw();
        runDailyMissionDraw();
      });
      return;
    }

    runDailyMissionDraw();
  }

  function runDailyMissionDraw() {
    if (dailyMissionDrawRunning) return;
    dailyMissionDrawRunning = true;

    const drawBtn = document.getElementById("btn-daily-mission-draw");
    if (drawBtn) drawBtn.classList.add("is-rolling");

    playMissionDrawSound();
    openDailyMissionModal();
    runDailyMissionRollAnimation(function () {
      const mission = pickRandomDailyMission();
      renderDailyMissionReveal(mission);
      if (drawBtn) drawBtn.classList.remove("is-rolling");
      dailyMissionDrawRunning = false;
    });
  }

  function startScoreKingMission() {
    scoreKingMission.active = true;
    scoreKingMission.sessionScore = 0;
    showMissionScoreHud();
    updateMissionScoreHud();
    saveMissionState();
  }

  function grantClassMissionBonus(bonus, options) {
    const opts = options || {};
    if (bonus) pushScoreUndoSnapshot();
    let applied = 0;
    slots.forEach(function (s) {
      if (applyScoreDeltaToSlot(s, bonus)) applied += 1;
    });
    if (applied && bonus) {
      recordDailyScoreChange(bonus * applied);
    }
    saveSlots();
    slots.forEach(renderSlotElement);
    if (opts.withFeedback && bonus && applied) {
      playScoreDing();
      showBulkScoreToast(applied, bonus);
    }
  }

  function onMissionReminderGoalAchieved() {
    if (!missionReminderVisible) return;
    stopScoreKingMissionSilently();
    grantClassMissionBonus(MISSION_CLASS_BONUS, { withFeedback: true });
    hideMissionReminder();
  }

  function playMissionEncourageSound() {
    const ctx = getWebAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(392, t);
    osc.frequency.exponentialRampToValueAtTime(523.25, t + 0.35);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  function playMissionSuccessSound() {
    if (cheerAudioPlayer) {
      cheerAudioPlayer.currentTime = 0;
      void cheerAudioPlayer.play().catch(function () {});
      return;
    }
    if (FREESOUND_TOKEN) {
      void playFreesoundEffect("cheer");
      return;
    }
    playLuckyDrawSound();
  }

  function stopMissionConfetti() {
    if (missionConfettiTimerId !== null) {
      clearInterval(missionConfettiTimerId);
      missionConfettiTimerId = null;
    }
    const layer = document.getElementById("mission-confetti-layer");
    if (layer) layer.innerHTML = "";
  }

  function launchMissionConfetti() {
    const layer = document.getElementById("mission-confetti-layer");
    if (!layer) return;
    stopMissionConfetti();
    const colors = ["#fde047", "#f97316", "#ec4899", "#38bdf8", "#a78bfa", "#4ade80"];
    missionConfettiTimerId = setInterval(function () {
      for (let i = 0; i < 6; i++) {
        const piece = document.createElement("span");
        piece.className = "mission-confetti-piece";
        piece.style.left = Math.random() * 100 + "%";
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = 2.2 + Math.random() * 1.8 + "s";
        piece.style.animationDelay = Math.random() * 0.4 + "s";
        layer.appendChild(piece);
        setTimeout(function () {
          piece.remove();
        }, 4500);
      }
    }, 180);
  }

  function showMissionSuccessOutcome() {
    const modal = document.getElementById("mission-success-modal");
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("mission-outcome-open");
    launchMissionConfetti();
    playMissionSuccessSound();
  }

  function closeMissionSuccessOutcome() {
    const modal = document.getElementById("mission-success-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("mission-outcome-open");
    stopMissionConfetti();
  }

  function showMissionEncourageOutcome(score) {
    const modal = document.getElementById("mission-encourage-modal");
    const textEl = document.getElementById("mission-encourage-text");
    if (textEl) {
      textEl.textContent =
        "大家今天已經盡力了，累積戰力 " +
        score +
        " 分！下次的挑戰一定能成功！";
    }
    if (modal) modal.hidden = false;
    document.body.classList.add("mission-outcome-open");
    playMissionEncourageSound();
  }

  function closeMissionEncourageOutcome() {
    const modal = document.getElementById("mission-encourage-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("mission-outcome-open");
  }

  function endScoreKingMission() {
    if (!scoreKingMission.active) return;
    const score = scoreKingMission.sessionScore;
    scoreKingMission.active = false;
    hideMissionScoreHud();

    if (score >= MISSION_SCORE_GOAL) {
      grantClassMissionBonus(MISSION_CLASS_BONUS);
      showMissionSuccessOutcome();
    } else {
      showMissionEncourageOutcome(score);
    }
    saveMissionState();
  }

  function initMissionStackDrag() {
    const stack = document.getElementById("dash-mission-stack");
    if (!stack || stack.dataset.dragBound === "1") return;
    stack.dataset.dragBound = "1";

    const MISSION_STACK_POS_KEY = "mission-stack-pos-v1";
    let missionStackUserMoved = false;
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginLeft = 0;
    let dragOriginTop = 0;

    function clampMissionStackPosition(left, top) {
      const margin = 8;
      const maxLeft = Math.max(margin, window.innerWidth - stack.offsetWidth - margin);
      const maxTop = Math.max(margin, window.innerHeight - stack.offsetHeight - margin);
      return {
        left: Math.min(Math.max(left, margin), maxLeft),
        top: Math.min(Math.max(top, margin), maxTop),
      };
    }

    function applyMissionStackPosition(left, top) {
      const pos = clampMissionStackPosition(left, top);
      stack.style.left = pos.left + "px";
      stack.style.top = pos.top + "px";
      stack.style.right = "auto";
      missionStackUserMoved = true;
    }

    function saveMissionStackPosition() {
      if (!missionStackUserMoved) return;
      const rect = stack.getBoundingClientRect();
      try {
        localStorage.setItem(
          MISSION_STACK_POS_KEY,
          JSON.stringify({ left: rect.left, top: rect.top })
        );
      } catch (e) {}
    }

    try {
      const raw = localStorage.getItem(MISSION_STACK_POS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
          applyMissionStackPosition(saved.left, saved.top);
        }
      }
    } catch (e) {}

    function onDragStart(clientX, clientY) {
      dragging = true;
      dragStartX = clientX;
      dragStartY = clientY;
      const rect = stack.getBoundingClientRect();
      dragOriginLeft = rect.left;
      dragOriginTop = rect.top;
      stack.classList.add("is-dragging");
    }

    function onDragMove(clientX, clientY) {
      if (!dragging) return;
      const dx = clientX - dragStartX;
      const dy = clientY - dragStartY;
      applyMissionStackPosition(dragOriginLeft + dx, dragOriginTop + dy);
    }

    function onDragEnd() {
      if (!dragging) return;
      dragging = false;
      stack.classList.remove("is-dragging");
      saveMissionStackPosition();
    }

    stack.addEventListener("mousedown", function (ev) {
      if (ev.button !== 0) return;
      if (ev.target.closest("button")) return;
      if (window.matchMedia("(max-width: 768px)").matches) return;
      ev.preventDefault();
      onDragStart(ev.clientX, ev.clientY);
    });

    document.addEventListener("mousemove", function (ev) {
      if (!dragging) return;
      onDragMove(ev.clientX, ev.clientY);
    });

    document.addEventListener("mouseup", onDragEnd);

    stack.addEventListener(
      "touchstart",
      function (ev) {
        if (ev.target.closest("button")) return;
        if (window.matchMedia("(max-width: 768px)").matches) return;
        if (!ev.touches || !ev.touches[0]) return;
        onDragStart(ev.touches[0].clientX, ev.touches[0].clientY);
      },
      { passive: true }
    );

    document.addEventListener(
      "touchmove",
      function (ev) {
        if (!dragging || !ev.touches || !ev.touches[0]) return;
        onDragMove(ev.touches[0].clientX, ev.touches[0].clientY);
      },
      { passive: true }
    );

    document.addEventListener("touchend", onDragEnd);
  }

  function initDailyMissionModule() {
    const drawBtn = document.getElementById("btn-daily-mission-draw");
    const endBtn = document.getElementById("btn-mission-end");
    const reminderClose = document.getElementById("btn-mission-reminder-close");
    const goalAchievedBtn = document.getElementById("btn-mission-goal-achieved");
    const pickBtn = document.getElementById("btn-mission-pick");
    const pickCloseBtn = document.getElementById("btn-mission-pick-close");
    const pickModal = document.getElementById("mission-pick-modal");
    const successClose = document.getElementById("btn-mission-success-close");
    const encourageClose = document.getElementById("btn-mission-encourage-close");
    const missionModal = document.getElementById("daily-mission-modal");

    if (drawBtn) drawBtn.addEventListener("click", drawDailyMission);
    if (reminderClose) {
      reminderClose.addEventListener("click", closeMissionReminderManual);
    }
    if (goalAchievedBtn) {
      goalAchievedBtn.addEventListener("click", onMissionReminderGoalAchieved);
    }
    if (pickBtn) pickBtn.addEventListener("click", openMissionPickModal);
    if (pickCloseBtn) pickCloseBtn.addEventListener("click", closeMissionPickModal);
    if (pickModal) {
      pickModal.addEventListener("click", function (ev) {
        if (ev.target === pickModal) closeMissionPickModal();
      });
    }
    if (endBtn) endBtn.addEventListener("click", endScoreKingMission);
    if (successClose) {
      successClose.addEventListener("click", closeMissionSuccessOutcome);
    }
    if (encourageClose) {
      encourageClose.addEventListener("click", closeMissionEncourageOutcome);
    }
    if (missionModal) {
      missionModal.addEventListener("click", function (ev) {
        if (ev.target === missionModal && !dailyMissionDrawRunning) {
          closeDailyMissionModal();
        }
      });
    }
    initMissionStackDrag();
  }

  function buildBackupArchiveObject() {
    flushCloudSync();
    const payload = buildCloudPayload();
    return {
      version: BACKUP_ARCHIVE_VERSION,
      exportedAt: Date.now(),
      classCode: currentClassCode,
      data: {
        slots: JSON.stringify({
          slots: payload.students.slots,
          updatedAt: payload.students.updatedAt,
        }),
        groups: JSON.stringify(payload.groups),
        classProgress: JSON.stringify(payload.classProgress),
        dailyScore: JSON.stringify(payload.dailyScore),
        timerMinuteCue: payload.timerMinuteCue,
        mission: JSON.stringify(payload.mission),
        classDisplay: JSON.stringify(payload.classDisplay),
      },
    };
  }

  function encodeUtf8ToBase64(str) {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/gi, function (_, hex) {
        return String.fromCharCode(parseInt(hex, 16));
      })
    );
  }

  function decodeBase64ToUtf8(b64) {
    return decodeURIComponent(
      atob(b64)
        .split("")
        .map(function (ch) {
          return "%" + ("00" + ch.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  }

  function buildClassSaveCodeString() {
    const payload = encodeUtf8ToBase64(JSON.stringify(buildBackupArchiveObject()));
    return CLASS_SAVECODE_PREFIX + payload;
  }

  function parseClassSaveCodeString(raw) {
    const trimmed = (raw || "").trim();
    if (!trimmed) {
      throw new Error("存檔碼為空，請貼上先前複製的內容。");
    }
    const payload = trimmed.indexOf(CLASS_SAVECODE_PREFIX) === 0
      ? trimmed.slice(CLASS_SAVECODE_PREFIX.length)
      : trimmed;
    let archive;
    try {
      archive = JSON.parse(decodeBase64ToUtf8(payload));
    } catch (e) {
      throw new Error("存檔碼格式無效，請確認已完整貼上。");
    }
    if (!archive || typeof archive !== "object" || !archive.data) {
      throw new Error("存檔碼內容不完整。");
    }
    return archive;
  }

  function applyBackupArchive(archive) {
    const data = archive.data;
    if (!data.slots) {
      throw new Error("存檔碼缺少學生資料。");
    }
    const slotsParsed = JSON.parse(data.slots);
    if (!slotsParsed.slots || !isValidSlotCount(slotsParsed.slots.length)) {
      throw new Error("學生資料筆數無效（需 " + MIN_SLOT_COUNT + "～" + MAX_SLOT_COUNT + " 位）。");
    }

    cloudSyncSuspended = true;
    slots = parseSlotsFromCloud(slotsParsed.slots);
    if (data.groups) {
      groups = parseGroupsFromCloud(JSON.parse(data.groups));
    } else {
      groups = [];
    }
    if (data.classProgress) {
      const cp = JSON.parse(data.classProgress);
      classProgressCelebratedThresholds = Array.isArray(cp.celebratedThresholds)
        ? cp.celebratedThresholds.filter(function (t) {
            return Number.isFinite(t) && t > 0;
          })
        : [];
    } else {
      classProgressCelebratedThresholds = [];
    }
    if (data.dailyScore) {
      applyDailyScorePackFromCloud(JSON.parse(data.dailyScore));
    }
    if (data.timerMinuteCue === "0") timerMinuteCueEnabled = false;
    else if (data.timerMinuteCue === "1") timerMinuteCueEnabled = true;
    if (data.mission) {
      applyMissionFromCloud(JSON.parse(data.mission));
    }
    if (data.classDisplay) {
      try {
        const cd =
          typeof data.classDisplay === "string"
            ? JSON.parse(data.classDisplay)
            : data.classDisplay;
        if (cd && typeof cd.gardenName === "string" && cd.gardenName.trim()) {
          gardenDisplayName = cd.gardenName.trim();
        }
      } catch (e) {}
    }
    updateDashHeaderTitle();
    syncGardenNameInput();
    syncStudentCountUI();
    updateLuckyCountLimits();
    slots.forEach(function (s) {
      if (s.id === 15) s.animal = "tiger";
      if (typeof s.score !== "number") s.score = 0;
      if (typeof s.lives !== "number") s.lives = LIVES_DEFAULT;
      s.emoji = DEFAULT_EMOJI;
    });
    classProgressBootstrapped = false;
    cloudSyncSuspended = false;
    flushCloudSync();
    renderAll();
    ensureGroupPanel();
    renderGroupButtons();
    updateClassProgress();
    updateTimerMinuteCueButtonUI();
    syncMissionHudLayout();
  }

  function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        const ok = document.execCommand("copy");
        ta.remove();
        if (ok) resolve();
        else reject(new Error("copy failed"));
      } catch (err) {
        ta.remove();
        reject(err);
      }
    });
  }


  function onCopyClassSaveCodeClick() {
    if (!ensureTeacherModeOn()) return;
    const code = buildClassSaveCodeString();
    copyTextToClipboard(code)
      .then(function () {
        showAppToast(
          "全班存檔碼已複製到剪貼簿！\n請貼到記事本或傳給自己保存，日後可在此還原。",
          { variant: "success", duration: 3600 }
        );
      })
      .catch(function () {
        showAppPrompt("", code, {
          title: "手動複製存檔碼",
          multiline: true,
          readonly: true,
        });
      });
  }

  function onRestoreClassSaveCodeClick() {
    if (!ensureTeacherModeOn()) return;
    const input = document.getElementById("class-savecode-input");
    const raw = input ? input.value : "";
    let archive;
    try {
      archive = parseClassSaveCodeString(raw);
    } catch (err) {
      showAppToast(err.message || "存檔碼無效。", { variant: "warn" });
      return;
    }
    showAppConfirm(
      "還原將覆蓋目前瀏覽器中的全班分數、神獸與組別資料。\n確定要還原嗎？",
      { title: "還原全班資料", confirmText: "還原", danger: true }
    ).then(function (ok) {
      if (!ok) return;
      try {
        applyBackupArchive(archive);
        if (input) input.value = "";
        showAppToast("全班資料已成功還原！", { variant: "success" });
      } catch (err) {
        showAppToast(err.message || "還原失敗，請檢查存檔碼。", { variant: "warn" });
      }
    });
  }

  function initDataBackupModule() {
    const copyBtn = document.getElementById("btn-copy-class-savecode");
    const restoreBtn = document.getElementById("btn-restore-class-savecode");

    if (copyBtn) copyBtn.addEventListener("click", onCopyClassSaveCodeClick);
    if (restoreBtn) restoreBtn.addEventListener("click", onRestoreClassSaveCodeClick);
  }

  function initToolsSidebar() {
    const toggle = document.getElementById("btn-tools-toggle");
    const closeBtn = document.getElementById("btn-tools-close");
    const overlay = document.getElementById("tools-overlay");
    const luckyBtn = document.getElementById("btn-lucky-start");
    const luckyModalClose = document.getElementById("btn-lucky-modal-close");
    const timerStartBtn = document.getElementById("btn-timer-start");
    const timerPauseBtn = document.getElementById("btn-timer-pause");
    const timerResetBtn = document.getElementById("btn-timer-reset");

    if (toggle) toggle.addEventListener("click", toggleToolsSidebar);
    if (closeBtn) closeBtn.addEventListener("click", closeToolsSidebar);
    if (overlay) overlay.addEventListener("click", closeToolsSidebar);
    if (luckyBtn) luckyBtn.addEventListener("click", startLuckyDraw);
    if (luckyModalClose) luckyModalClose.addEventListener("click", closeLuckyResultModal);
    initLuckyModalScoreButtons();

    const luckyModal = document.getElementById("lucky-result-modal");
    if (luckyModal) {
      luckyModal.addEventListener("click", function (ev) {
        if (ev.target === luckyModal) closeLuckyResultModal();
      });
    }

    document.querySelectorAll(".timer-mode-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        setTimerMode(tab.dataset.timerMode || "stopwatch");
      });
    });

    if (timerStartBtn) timerStartBtn.addEventListener("click", timerStart);
    if (timerPauseBtn) timerPauseBtn.addEventListener("click", timerPause);
    if (timerResetBtn) timerResetBtn.addEventListener("click", timerReset);

    const timerShrinkBtn = document.getElementById("btn-timer-shrink");
    const timerExpandedCloseBtn = document.getElementById("btn-timer-expanded-close");
    const timerExpandedModal = document.getElementById("timer-expanded-modal");
    if (timerShrinkBtn) timerShrinkBtn.addEventListener("click", shrinkTimerDisplay);
    if (timerExpandedCloseBtn) {
      timerExpandedCloseBtn.addEventListener("click", closeTimerExpanded);
    }
    const timerExpandedAlarmClose = document.getElementById(
      "btn-timer-expanded-alarm-close"
    );
    if (timerExpandedAlarmClose) {
      timerExpandedAlarmClose.addEventListener("click", dismissTimerAlarmAndReturn);
    }
    if (timerExpandedModal) {
      timerExpandedModal.addEventListener("click", function (ev) {
        if (ev.target === timerExpandedModal) shrinkTimerDisplay();
      });
    }

    initTimerMiniWidget();

    const minuteCueBtn = document.getElementById("btn-timer-minute-cue");
    if (minuteCueBtn) {
      minuteCueBtn.addEventListener("click", function () {
        timerMinuteCueEnabled = !timerMinuteCueEnabled;
        saveTimerMinuteCueSetting();
        updateTimerMinuteCueButtonUI();
      });
    }

    ["timer-min", "timer-sec"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", function () {
          if (timerMode === "countdown" && !timerRunning) {
            countdownRemainingMs = getCountdownSetupMs();
            updateTimerDisplay();
          }
        });
      }
    });

    loadTimerMinuteCueSetting();
    updateTimerMinuteCueButtonUI();
    setTimerMode("stopwatch");
    initDailyMissionModule();
    initDataBackupModule();
    initClassSetupPanel();
  }

  function toggleSlotLifeHeart(slotId, heartIndex) {
    const slot = getSlotById(slotId);
    if (!slot || !Number.isFinite(heartIndex)) return;

    if (heartIndex < slot.lives) {
      if (heartIndex !== slot.lives - 1) return;
      slot.lives = clampLives(slot.lives - 1);
      updateSlotLifeDisplay(slot);
      saveSlots();
      playLifeWarningSound();
      if (slot.lives === 0) {
        setSlotReactionEmoji(slotId, EMOJI_SLEEP);
      } else {
        setSlotReactionEmoji(slotId, EMOJI_SAD);
      }
      return;
    }

    if (heartIndex === slot.lives && slot.lives < LIVES_MAX) {
      slot.lives = clampLives(slot.lives + 1);
      clearSlotEmojiTimer(slotId);
      if (slot.emoji === EMOJI_SLEEP || slot.emoji === EMOJI_SAD) {
        slot.emoji = DEFAULT_EMOJI;
        updateSlotEmojiDisplay(slotId);
      }
      updateSlotLifeDisplay(slot);
      saveSlots();
    }
  }

  function wakeUpSlot(slotId) {
    const slot = getSlotById(slotId);
    if (!slot || slot.lives > 0) return;

    clearSlotEmojiTimer(slotId);
    slot.lives = LIVES_DEFAULT;
    slot.emoji = DEFAULT_EMOJI;
    saveSlots();
    renderSlotElement(slot);
  }

  function bindSlotLivesEvents(livesEl, slotId) {
    if (livesEl.dataset.livesBound === "1") return;
    livesEl.dataset.livesBound = "1";
    livesEl.addEventListener("click", function (ev) {
      const heart = ev.target.closest(".slot__life-heart");
      if (!heart) return;
      ev.stopPropagation();
      ev.preventDefault();
      const heartIndex = parseInt(heart.dataset.lifeIndex, 10);
      toggleSlotLifeHeart(slotId, heartIndex);
    });
  }

  function ensureSlotLifeHearts(livesEl, slotId) {
    const existing = livesEl.querySelectorAll(".slot__life-heart");
    const hasSvgHearts =
      existing.length === LIVES_MAX &&
      existing[0] &&
      existing[0].querySelector("svg.slot__life-heart-icon");
    if (hasSvgHearts) {
      bindSlotLivesEvents(livesEl, slotId);
      return existing;
    }

    livesEl.textContent = "";
    for (let i = 0; i < LIVES_MAX; i++) {
      const heart = document.createElement("button");
      heart.type = "button";
      heart.className = "slot__life-heart is-full";
      heart.dataset.lifeIndex = String(i);
      heart.innerHTML = LIFE_HEART_SVG;
      livesEl.appendChild(heart);
    }
    bindSlotLivesEvents(livesEl, slotId);
    return livesEl.querySelectorAll(".slot__life-heart");
  }

  function syncSlotLifeHeartStates(livesEl, slot) {
    if (typeof slot.lives !== "number") {
      slot.lives = LIVES_DEFAULT;
    }

    const hearts = ensureSlotLifeHearts(livesEl, slot.id);
    hearts.forEach(function (heart, i) {
      const isFull = i < slot.lives;
      heart.classList.toggle("is-full", isFull);
      heart.classList.toggle("is-empty", !isFull);
      heart.classList.toggle("is-deductible", isFull && i === slot.lives - 1);
      heart.classList.toggle(
        "is-restoreable",
        !isFull && i === slot.lives && slot.lives < LIVES_MAX
      );
      heart.hidden = false;
      heart.style.display = "";
      heart.removeAttribute("disabled");
      if (isFull && i === slot.lives - 1) {
        heart.setAttribute(
          "aria-label",
          "扣減生命值（目前 " + slot.lives + "，再按一次可恢復）"
        );
      } else if (!isFull && i === slot.lives && slot.lives < LIVES_MAX) {
        heart.setAttribute("aria-label", "恢復此愛心（目前 " + slot.lives + "）");
      } else if (isFull) {
        heart.setAttribute("aria-label", "已點亮的生命值");
      } else {
        heart.setAttribute("aria-label", "已失去的生命值");
      }
    });

    let wakeBtn = livesEl.querySelector(".slot__life-wakeup");
    if (slot.lives === 0) {
      if (!wakeBtn) {
        wakeBtn = document.createElement("button");
        wakeBtn.type = "button";
        wakeBtn.className = "slot__life-wakeup";
        wakeBtn.textContent = "睡醒";
        wakeBtn.setAttribute("aria-label", "睡醒並恢復生命值");
        wakeBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          wakeUpSlot(slot.id);
        });
        livesEl.appendChild(wakeBtn);
      }
    } else if (wakeBtn) {
      wakeBtn.remove();
    }
  }

  function updateSlotLifeDisplay(slot) {
    const el = document.querySelector('.slot[data-slot-id="' + slot.id + '"]');
    if (!el) return;
    const livesEl = el.querySelector(".slot__lives");
    if (livesEl) syncSlotLifeHeartStates(livesEl, slot);
    el.classList.toggle("is-sleeping", slot.lives === 0);
  }

  function renderSlotLives(el, slot) {
    let livesEl = el.querySelector(".slot__lives");
    if (!livesEl) {
      livesEl = document.createElement("div");
      livesEl.className = "slot__lives";
      livesEl.setAttribute("aria-label", "生命值");
      const footer = el.querySelector(".slot__footer");
      if (footer) footer.before(livesEl);
      else el.appendChild(livesEl);
    }

    syncSlotLifeHeartStates(livesEl, slot);
  }

  function clearSlotStageInteractivity(stage) {
    if (!stage) return;
    stage.removeAttribute("role");
    stage.removeAttribute("tabindex");
    stage.removeAttribute("aria-label");
    const target = stage.querySelector(".slot__viewer, .slot__egg, model-viewer");
    if (!target) return;
    target.removeAttribute("role");
    target.removeAttribute("tabindex");
    target.removeAttribute("aria-label");
    target.onclick = null;
    target.onkeydown = null;
  }

  function bindSlotNumNav(el, slot) {
    if (!el || !slot) return;
    const numEl = el.querySelector(".slot__num");
    if (!numEl) return;

    const name =
      slot.name && slot.name !== DEFAULT_NAME ? slot.name : slot.id + " 號學生";
    numEl.setAttribute(
      "aria-label",
      slot.hatched
        ? slot.id + " 號，點擊進入「" + name + "」的神獸內頁"
        : slot.id + " 號，點擊命名（滿 " + HATCH_THRESHOLD + " 分自動孵化）"
    );

    numEl.onclick = function (ev) {
      ev.stopPropagation();
      onSlotBeastClick(slot.id);
    };
    numEl.onkeydown = function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onSlotBeastClick(slot.id);
      }
    };
  }

  function bindSlotStageAnimalPick(stage, slot) {
    if (!stage || !slot || !slot.hatched || !teacherMode) return;

    const openPick = function (ev) {
      ev.stopPropagation();
      if (!teacherMode) return;
      closeQuickScoreMenu();
      openAnimalPickModal(slot.id);
    };

    stage.setAttribute("role", "button");
    stage.setAttribute("tabindex", "0");
    stage.setAttribute(
      "aria-label",
      slot.id + " 號，點擊更改動物"
    );
    stage.onclick = openPick;
    stage.onkeydown = function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        openPick(e);
      }
    };
  }

  function updateSlotNavInteractable(el, slot) {
    const stage = el.querySelector(".slot__stage");
    clearSlotStageInteractivity(stage);
    bindSlotNumNav(el, slot);
    bindSlotStageAnimalPick(stage, slot);
  }

  function getSlotStageKey(slot) {
    if (slot.hatched) {
      return "h:" + slot.animal;
    }
    return "e:" + eggHueForSlot(slot.id);
  }

  function renderSlotStage(stage, slot) {
    if (!stage) return;
    const key = getSlotStageKey(slot);
    if (stage.dataset.stageKey === key && stage.firstChild) {
      clearSlotStageInteractivity(stage);
      return;
    }
    stage.dataset.stageKey = key;
    stage.innerHTML = "";
    if (slot.hatched) {
      appendHatchedBeast(stage, slot, "slot__viewer");
    } else {
      const egg = document.createElement("div");
      egg.className = "slot__egg";
      egg.style.setProperty("--egg-hue", String(eggHueForSlot(slot.id)));
      stage.appendChild(egg);
    }
    clearSlotStageInteractivity(stage);
  }

  function ensureQuickScoreMenu(quickMenu, slotId) {
    if (!quickMenu || quickMenu.dataset.built === "1") return;
    quickMenu.dataset.built = "1";
    QUICK_ADD_VALUES.forEach(function (delta) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "score-quick-btn";
      btn.textContent = "+" + delta;
      btn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        applyQuickScore(slotId, delta);
      });
      quickMenu.appendChild(btn);
    });
  }

  function updateSlotQuickMenu(el, slot) {
    const quickMenu = el.querySelector(".score-quick-menu");
    if (!quickMenu) return;
    const isOpen = activeScoreMenuSlotId === slot.id && !teacherMode;
    quickMenu.classList.toggle("is-open", isOpen);
    quickMenu.setAttribute("aria-hidden", isOpen ? "false" : "true");
  }

  function updateSlotBulkClasses(el, slot) {
    el.classList.toggle(
      "slot--bulk-selected",
      bulkPickActive && bulkSelectedIds.indexOf(slot.id) >= 0
    );
    el.classList.toggle(
      "slot--bulk-success",
      bulkSuccessIds.indexOf(slot.id) >= 0
    );
  }

  function syncAllQuickScoreMenus() {
    slots.forEach(function (slot) {
      const el = document.querySelector('.slot[data-slot-id="' + slot.id + '"]');
      if (el) updateSlotQuickMenu(el, slot);
    });
  }

  function updateSlotPresentation(slot) {
    const el = document.querySelector('.slot[data-slot-id="' + slot.id + '"]');
    if (!el) {
      renderSlotElement(slot);
      return;
    }

    const wasHatched = el.classList.contains("is-hatched");
    el.classList.toggle("is-hatched", slot.hatched);
    el.classList.toggle("is-sleeping", slot.lives === 0);
    if (wasHatched !== slot.hatched) {
      renderSlotStage(el.querySelector(".slot__stage"), slot);
      updateSlotNavInteractable(el, slot);
    }

    const footerEmoji = el.querySelector(".slot__footer-part--emoji");
    const footerName = el.querySelector(".slot__footer-part--name");
    const footerScore = el.querySelector(".slot__footer-part--score");

    if (footerEmoji) {
      footerEmoji.textContent = slot.emoji || DEFAULT_EMOJI;
    }
    if (footerName) {
      footerName.textContent = slot.name;
    }
    if (footerScore) {
      footerScore.textContent = String(slot.score).padStart(1, "0");
    }

    renderSlotLives(el, slot);
    updateSlotQuickMenu(el, slot);
    updateSlotBulkClasses(el, slot);
    applySlotDrawClasses(el, slot.id);
    updateSlotNavInteractable(el, slot);
    renderSlotScoreFx(el, slot);
  }

  function renderSlotElement(slot) {
    let el = document.querySelector('.slot[data-slot-id="' + slot.id + '"]');
    if (!el) {
      el = document.createElement("article");
      el.className = "slot";
      el.dataset.slotId = String(slot.id);

      el.addEventListener("click", function (ev) {
        if (ev.target.closest(".slot__stage")) return;
        if (ev.target.closest(".slot__num")) return;
        if (ev.target.closest(".slot__history-btn")) return;
        if (
          ev.target.closest(".slot__footer") ||
          ev.target.closest(".slot__lives") ||
          ev.target.closest(".score-quick-menu")
        ) {
          return;
        }
        onSlotCardClick(slot.id);
      });

      el.innerHTML =
        '<button type="button" class="slot__num"></button>' +
        '<button type="button" class="slot__history-btn" title="成長日誌" aria-label="查看得分成長日誌">📜</button>' +
        '<div class="slot__stage"></div>' +
        '<div class="slot__lives" aria-label="生命值"></div>' +
        '<div class="slot__footer">' +
        '  <span class="slot__footer-part slot__footer-part--emoji" aria-label="狀態表情"></span>' +
        '  <div class="slot__footer-part slot__footer-part--name"></div>' +
        '  <button type="button" class="slot__footer-part slot__footer-part--score" aria-label="得分"></button>' +
        "</div>" +
        '<div class="score-quick-menu"></div>';

      const historyBtn = el.querySelector(".slot__history-btn");
      if (historyBtn) {
        historyBtn.addEventListener("click", function (ev) {
          ev.stopPropagation();
          openGrowthJournalModal(slot.id);
        });
      }

      gridEl.appendChild(el);
    }

    el.style.setProperty("--slot-gradient", slotGradientByPosition(slot.id));

    el.classList.toggle("is-hatched", slot.hatched);
    el.querySelector(".slot__num").textContent = String(slot.id);

    const footerEmoji = el.querySelector(".slot__footer-part--emoji");
    const footerName = el.querySelector(".slot__footer-part--name");
    const footerScore = el.querySelector(".slot__footer-part--score");
    const quickMenu = el.querySelector(".score-quick-menu");

    if (footerEmoji) {
      footerEmoji.textContent = slot.emoji || DEFAULT_EMOJI;
      footerEmoji.setAttribute("aria-label", "狀態表情");
    }

    if (footerName) {
      footerName.textContent = slot.name;
    }

    if (footerScore) {
      footerScore.textContent = String(slot.score).padStart(1, "0");
      footerScore.onclick = function (ev) {
        ev.stopPropagation();
        onScoreClick(slot.id);
      };
    }

    renderSlotLives(el, slot);
    el.classList.toggle("is-sleeping", slot.lives === 0);

    if (quickMenu) {
      ensureQuickScoreMenu(quickMenu, slot.id);
      updateSlotQuickMenu(el, slot);
    }

    renderSlotStage(el.querySelector(".slot__stage"), slot);

    applySlotDrawClasses(el, slot.id);
    updateSlotBulkClasses(el, slot);
    updateSlotNavInteractable(el, slot);
    renderSlotScoreFx(el, slot);
  }

  function renderAll() {
    if (!gridEl) return;
    slots.forEach(renderSlotElement);
    renderGroupButtons();
  }

  function closeQuickScoreMenu() {
    if (activeScoreMenuSlotId === null) return;
    const prev = getSlotById(activeScoreMenuSlotId);
    activeScoreMenuSlotId = null;
    if (prev) {
      const el = document.querySelector('.slot[data-slot-id="' + prev.id + '"]');
      if (el) updateSlotQuickMenu(el, prev);
    }
  }

  function closeAllQuickScoreMenus() {
    closeQuickScoreMenu();
    closeGroupQuickScoreMenu();
  }

  function applyQuickScore(slotId, delta) {
    const slot = getSlotById(slotId);
    if (!slot || !delta) return;
    if (!canApplyScoreDeltaToSlot(slot, delta)) {
      if (delta > 0 && isSlotSleeping(slot)) {
        showAppToast(slot.id + " 號正在睡眠中，無法加分。", { variant: "warn" });
      }
      return;
    }
    pushScoreUndoSnapshot();
    applyScoreDeltaToSlot(slot, delta);
    if (delta !== 0) {
      recordDailyScoreChange(delta);
    }
    saveSlots();
    activeScoreMenuSlotId = null;
    if (slot.hatched) renderSlotElement(slot);
    else updateSlotPresentation(slot);
    playScoreDing();
    showScoreToast(slot, delta);
  }

  function closeAnimalPickModal() {
    const modal = document.getElementById("animal-pick-modal");
    if (modal) modal.hidden = true;
    document.body.classList.remove("animal-pick-open");
    animalPickSlotId = null;
  }

  function applyAnimalChange(slotId, animal) {
    const slot = getSlotById(slotId);
    if (!slot || !isValidAnimal(animal)) return;
    slot.animal = animal;
    saveSlots();
    renderSlotElement(slot);
    closeAnimalPickModal();
    const label = ANIMAL_LABELS[animal] || animal;
    showAppToast(
      "已將 " + slot.id + " 號「" + slot.name + "」的動物更改為「" + label + "」",
      { variant: "success" }
    );
  }

  function renderAnimalPickList() {
    const list = document.getElementById("animal-pick-list");
    if (!list) return;
    list.innerHTML = "";
    const slot = animalPickSlotId ? getSlotById(animalPickSlotId) : null;

    getPickableAnimals().forEach(function (animal) {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "animal-pick-item";
      if (slot && slot.animal === animal) btn.classList.add("is-current");
      btn.textContent = ANIMAL_LABELS[animal] || animal;
      btn.addEventListener("click", function () {
        applyAnimalChange(animalPickSlotId, animal);
      });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function openAnimalPickModal(slotId) {
    const slot = getSlotById(slotId);
    if (!slot) return;
    animalPickSlotId = slotId;
    const hint = document.getElementById("animal-pick-hint");
    if (hint) {
      hint.textContent =
        "請為 " +
        slot.id +
        " 號「" +
        slot.name +
        "」選擇動物（可與其他同學重複）";
    }
    renderAnimalPickList();
    const modal = document.getElementById("animal-pick-modal");
    if (modal) modal.hidden = false;
    document.body.classList.add("animal-pick-open");
  }

  function initAnimalPickModal() {
    const closeBtn = document.getElementById("btn-animal-pick-close");
    const modal = document.getElementById("animal-pick-modal");
    if (closeBtn) closeBtn.addEventListener("click", closeAnimalPickModal);
    if (modal) {
      modal.addEventListener("click", function (ev) {
        if (ev.target === modal) closeAnimalPickModal();
      });
    }
  }

  function refreshTeacherModeUI() {
    document.body.classList.toggle("teacher-mode-active", teacherMode);
    if (btnTeacherMode) {
      btnTeacherMode.classList.toggle("is-active", teacherMode);
      const labelEl = document.getElementById("teacher-mode-btn-label");
      if (labelEl) {
        labelEl.textContent = teacherMode ? "編輯模式-開" : "編輯模式-關";
      }
      btnTeacherMode.title = teacherMode
        ? "連擊兩下關閉編輯模式"
        : "連擊兩下開啟編輯模式";
      btnTeacherMode.setAttribute(
        "aria-label",
        teacherMode ? "編輯模式已開啟，連擊兩下關閉" : "編輯模式已關閉，連擊兩下開啟"
      );
    }
    updateBulkPickUI();
    refreshScoreUndoButton();
    const resetBtn = document.getElementById("btn-class-code-reset");
    if (resetBtn) resetBtn.hidden = !teacherMode;
    const studentAddBtn = document.getElementById("btn-student-add");
    const studentRemoveBtn = document.getElementById("btn-student-remove");
    const gardenInput = document.getElementById("garden-name-input");
    const gardenSaveBtn = document.getElementById("btn-garden-name-save");
    if (studentAddBtn) studentAddBtn.hidden = !teacherMode;
    if (studentRemoveBtn) studentRemoveBtn.hidden = !teacherMode;
    if (gardenInput) gardenInput.readOnly = !teacherMode;
    if (gardenSaveBtn) gardenSaveBtn.hidden = !teacherMode;
    syncStudentCountUI();
    refreshMissionPickButton();
    syncAllQuickScoreMenus();
    slots.forEach(function (slot) {
      const el = document.querySelector('.slot[data-slot-id="' + slot.id + '"]');
      if (el) updateSlotNavInteractable(el, slot);
    });
  }

  function ensureTeacherModeOn() {
    if (teacherMode) return true;
    showAppToast("請連擊兩下左上角「編輯模式」按鈕以開啟。", { variant: "warn" });
    return false;
  }

  function openTeacherMode() {
    if (teacherMode) return;
    teacherMode = true;
    refreshTeacherModeUI();
  }

  function closeTeacherMode() {
    if (!teacherMode) return;
    teacherMode = false;
    closeMissionPickModal();
    closeAllQuickScoreMenus();
    refreshTeacherModeUI();
  }

  function onTeacherModeButtonDblClick(ev) {
    ev.preventDefault();
    if (teacherMode) closeTeacherMode();
    else openTeacherMode();
  }

  function onScoreClick(slotId) {
    const slot = getSlotById(slotId);
    if (!slot) return;

    if (teacherMode) {
      closeQuickScoreMenu();
      showAppPrompt(
        "• 輸入 +20 或 -20：在目前分數上加減\n• 只輸入數字（如 0）：直接設為該分數\n\n目前分數：" +
          slot.score,
        String(slot.score),
        { title: slot.id + " 號分數調整", placeholder: "例如 +5 或 80" }
      ).then(function (input) {
        if (input === null) return;
        const raw = input.trim();
        if (!raw) return;

        const oldScore = slot.score;
        let newScore = oldScore;

        if (/^[+-]/.test(raw)) {
          const change = parseInt(raw, 10);
          if (Number.isNaN(change)) {
            showAppToast("請輸入有效的加減分數字。", { variant: "warn" });
            return;
          }
          if (change === 0) return;
          newScore = clampScore(oldScore + change);
        } else {
          const target = parseInt(raw, 10);
          if (Number.isNaN(target)) {
            showAppToast("請輸入數字。", { variant: "warn" });
            return;
          }
          newScore = clampScore(target);
        }

        const delta = newScore - oldScore;
        if (delta === 0) {
          saveSlots();
          updateSlotPresentation(slot);
          return;
        }

        if (!canApplyScoreDeltaToSlot(slot, delta)) {
          if (delta > 0 && isSlotSleeping(slot)) {
            showAppToast(slot.id + " 號正在睡眠中，無法加分。", { variant: "warn" });
          }
          return;
        }

        pushScoreUndoSnapshot();
        applyScoreDeltaToSlot(slot, delta);
        recordDailyScoreChange(delta);
        saveSlots();
        if (slot.hatched) renderSlotElement(slot);
        else updateSlotPresentation(slot);
        playScoreDing();
        showScoreToast(slot, delta);
      });
      return;
    }
    closeGroupQuickScoreMenu();
    if (activeScoreMenuSlotId === slotId) {
      activeScoreMenuSlotId = null;
    } else {
      const prev = activeScoreMenuSlotId;
      activeScoreMenuSlotId = slotId;
      if (prev !== null && prev !== slotId) {
        const prevEl = document.querySelector('.slot[data-slot-id="' + prev + '"]');
        const prevSlot = getSlotById(prev);
        if (prevEl && prevSlot) updateSlotQuickMenu(prevEl, prevSlot);
      }
    }
    const el = document.querySelector('.slot[data-slot-id="' + slotId + '"]');
    if (el) updateSlotQuickMenu(el, slot);
  }

  function onSlotTeacherAction(slotId) {
    if (!ensureTeacherModeOn()) return;
    const slot = getSlotById(slotId);
    if (!slot) return;

    showAppChoice(
      slot.id + " 號「" + slot.name + "」",
      "請選擇編輯操作：",
      [
        { value: "1", label: "修改學生姓名" },
        { value: "2", label: "更改動物" },
        { value: "3", label: "指定／變更組別" },
      ]
    ).then(function (choice) {
      if (choice === null) return;

      if (choice.trim() === "1") {
        const defaultName = slot.name === DEFAULT_NAME ? "" : slot.name;
        showAppPrompt("請輸入新的學生姓名：", defaultName, {
          title: "修改學生姓名",
        }).then(function (nameInput) {
          if (nameInput === null) return;
          slot.name = nameInput.trim() || DEFAULT_NAME;
          saveSlots();
          renderSlotElement(slot);
          showAppToast("已更新為：「" + slot.name + "」", { variant: "success" });
        });
        return;
      }

      if (choice.trim() === "2") {
        openAnimalPickModal(slot.id);
        return;
      }

      if (choice.trim() === "3") {
        assignSlotToGroup(slot.id);
        return;
      }

      showAppToast("無效的操作。", { variant: "warn" });
    });
  }

  function onSlotCardClick(slotId) {
    if (bulkPickActive) {
      toggleBulkSlot(slotId);
      return;
    }
    if (teacherMode) {
      closeQuickScoreMenu();
      onSlotTeacherAction(slotId);
    }
  }

  function onSlotBeastClick(slotId) {
    const slot = getSlotById(slotId);
    if (!slot) return;

    if (bulkPickActive) {
      toggleBulkSlot(slotId);
      return;
    }

    if (teacherMode) {
      closeQuickScoreMenu();
      onSlotTeacherAction(slotId);
      return;
    }

    if (slot.hatched) {
      window.location.href = "pet.html?slot=" + slot.id;
      return;
    }

    const defaultName = slot.name === DEFAULT_NAME ? "" : slot.name;
    showAppPrompt(
      "請輸入 " + slot.id + " 號學生的中文姓名：\n（達到 " + HATCH_THRESHOLD + " 分將自動孵化）",
      defaultName,
      { title: "學生姓名" }
    ).then(function (nameInput) {
      if (nameInput === null) return;

      const trimmed = nameInput.trim();
      slot.name = trimmed || DEFAULT_NAME;
      saveSlots();
      renderSlotElement(slot);
    });
  }

  function onSlotClick(slotId) {
    onSlotCardClick(slotId);
  }

  function boot() {
    if (!gridEl) return;
    initClassCodeUi();
    ensureSiteAccess(function (ok) {
      if (!ok) return;
      const remembered = readRememberedClassCode();
      if (remembered) {
        connectToClassCode(remembered, function (codeOk) {
          if (!codeOk) {
            showClassCodeModal(function (retryOk) {
              if (!retryOk) return;
              continueBoot();
            });
            return;
          }
          continueBoot();
        });
        return;
      }
      showClassCodeModal(function (codeOk) {
        if (!codeOk) return;
        continueBoot();
      });
    });
  }

  function continueBoot() {
    updateBuildVersionBadge();
    showFileProtocolBanner();
    loadSlots();
    slots.forEach(fixLegacySlotAnimal);
    syncAllSlotsAutoHatch();
    syncStudentCountUI();
    updateLuckyCountLimits();
    loadGroups();
    loadClassProgressMeta();
    loadDailyScoreLog();
    initClassProgressUI();
    updateTimerMinuteCueButtonUI();

    preloadFreesoundEffects();
    initToolsSidebar();
    initAnimalPickModal();
    updateDashHeaderTitle();

    if (btnTeacherMode) {
      btnTeacherMode.addEventListener("dblclick", onTeacherModeButtonDblClick);
    }

    const btnScoreUndo = document.getElementById("btn-score-undo");
    if (btnScoreUndo) {
      btnScoreUndo.addEventListener("click", undoLastScoreAction);
    }

    document.addEventListener("keydown", function (ev) {
      if (!teacherMode) return;
      const key = ev.key ? ev.key.toLowerCase() : "";
      if ((ev.ctrlKey || ev.metaKey) && key === "z" && !ev.shiftKey) {
        ev.preventDefault();
        undoLastScoreAction();
      }
    });
    document.addEventListener("click", function (ev) {
      if (activeScoreMenuSlotId !== null) {
        const current = document.querySelector(
          '.slot[data-slot-id="' + activeScoreMenuSlotId + '"]'
        );
        if (!current) {
          activeScoreMenuSlotId = null;
        } else if (!current.contains(ev.target)) {
          closeQuickScoreMenu();
        }
      }
      if (activeGroupScoreMenuId !== null) {
        const groupWrap = document.querySelector(
          '[data-group-id="' + activeGroupScoreMenuId + '"]'
        );
        if (!groupWrap) {
          activeGroupScoreMenuId = null;
        } else if (!groupWrap.contains(ev.target)) {
          closeGroupQuickScoreMenu();
        }
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (animCycleTimeoutId !== null) {
          clearTimeout(animCycleTimeoutId);
          animCycleTimeoutId = null;
        }
      } else {
        startAnimationCycle();
      }
    });

    window.addEventListener("beforeunload", flushCloudSync);

    appBootstrapped = true;
    renderAll();
    ensureGroupPanel();
    initBulkUiBindings();
    initGrowthJournalModal();
    renderGroupButtons();
    updateClassProgress();
    refreshTeacherModeUI();
    syncMissionHudLayout();
    startAnimationCycle();
  }

  boot();
})();
