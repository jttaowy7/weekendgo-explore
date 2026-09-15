/* =========================================================
 * 周末城市探索指南 · 核心逻辑（所有页面共享）
 * 依赖 data.js（ACTIVITIES / TYPES / WEATHER_PRESETS ...）
 * ========================================================= */
const App = (() => {
  /* ---------- 存储 ---------- */
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  /* ---------- 工具 ---------- */
  const typeName = (k) => (ACTIVITY_TYPES.find(t => t.key === k) || {}).name || k;
  const typeEmoji = (k) => (ACTIVITY_TYPES.find(t => t.key === k) || {}).emoji || "📌";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- 天气 ---------- */
  const getWeather = () => WEATHER_PRESETS[get(STORAGE_KEYS.weather, "sunny")] || WEATHER_PRESETS.sunny;
  const setWeather = (code) => set(STORAGE_KEYS.weather, code);

  /* ---------- 偏好（默认：预算有限的大学生） ---------- */
  const defaultPrefs = () => ({
    types: ["exhibition", "market", "show", "hiking"],
    budget: 50,        // 可接受单人票价上限(元)
    distance: 15,      // 可接受出行距离(km)
    people: 2,         // 偏好同行人数
  });
  const getPrefs = () => Object.assign(defaultPrefs(), get(STORAGE_KEYS.prefs, {}));
  const setPrefs = (p) => set(STORAGE_KEYS.prefs, p);

  /* ---------- 打卡记录 ---------- */
  const getCheckins = () => get(STORAGE_KEYS.checkins, []);
  const addCheckin = (c) => { const l = getCheckins(); l.unshift(c); set(STORAGE_KEYS.checkins, l); };
  const removeCheckin = (id) => set(STORAGE_KEYS.checkins, getCheckins().filter(c => c.id !== id));
  const isChecked = (actId) => getCheckins().some(c => c.actId === actId);

  /* ---------- 收藏 ---------- */
  const getFavs = () => get(STORAGE_KEYS.favs, []);
  const toggleFav = (id) => {
    let f = getFavs();
    f.includes(id) ? (f = f.filter(x => x !== id)) : f.push(id);
    set(STORAGE_KEYS.favs, f);
    return f.includes(id);
  };
  const isFav = (id) => getFavs().includes(id);

  /* ---------- 组队 ---------- */
  const getTeams = () => { if (!localStorage.getItem(STORAGE_KEYS.teams)) set(STORAGE_KEYS.teams, SEED_TEAMS); return get(STORAGE_KEYS.teams, SEED_TEAMS); };
  const addTeam = (t) => { const l = getTeams(); l.unshift(t); set(STORAGE_KEYS.teams, l); };

  /* =========================================================
   * 推荐引擎：综合 偏好类型 / 预算 / 距离 / 同行人数 / 天气适配
   * 返回带 score(0-100) 与 reason 的列表，按分数降序
   * ========================================================= */
  function recommend(list, prefs, weather) {
    return list.map(a => {
      let score = 0; const reasons = [];
      // 1) 类型匹配 (0~30)
      if (prefs.types.includes(a.type)) { score += 30; reasons.push("你感兴趣的类型"); }
      else { score += 8; }
      // 2) 预算匹配 (0~25)
      if (a.price <= prefs.budget) { score += 25; }
      else {
        const over = a.price - prefs.budget;
        score += Math.max(0, 25 - over * 0.5);
        if (a.price > prefs.budget) reasons.push("略超预算");
      }
      // 3) 距离匹配 (0~20)
      if (a.distance <= prefs.distance) { score += 20; }
      else { score += Math.max(0, 20 - (a.distance - prefs.distance) * 1.5); reasons.push("距离稍远"); }
      // 4) 同行人数匹配 (0~15)
      const [lo, hi] = a.people;
      if (prefs.people >= lo && prefs.people <= hi) { score += 15; }
      else if (prefs.people < lo) { score += Math.max(0, 15 - (lo - prefs.people) * 5); reasons.push("更适合结伴"); }
      else { score += Math.max(0, 15 - (prefs.people - hi) * 5); reasons.push("更适合小队"); }
      // 5) 天气适配 (0~10) —— 雨天优先室内，晴天优先户外
      const weatherOk = weather.outdoor ? (a.fitWeather === "sunny" || a.fitWeather === "cloudy") : a.indoor;
      if (weatherOk) { score += 10; reasons.push(weather.outdoor ? "天气正好" : "雨天室内更舒适"); }
      else if (!weather.outdoor && !a.indoor) { score -= 18; reasons.push("雨天不太适合"); }
      else { score += 2; }
      score = Math.max(0, Math.min(100, Math.round(score)));
      return { ...a, score, reasons: [...new Set(reasons)] };
    }).sort((x, y) => y.score - x.score);
  }

  // 天气适配提示（详情页/卡片用）
  function weatherFitText(a, weather) {
    if (weather.outdoor) {
      return a.fitWeather === "rainy"
        ? { ok: false, text: "当前晴天，该活动更适合室内，酌情安排" }
        : { ok: true, text: "天气不错，非常适合出门参加！" };
    } else {
      return a.indoor
        ? { ok: true, text: "雨天优选·室内活动，放心去" }
        : { ok: false, text: "雨天户外不便，建议改室内或改期" };
    }
  }

  /* ---------- 渲染：活动卡片 ---------- */
  function cardHTML(a, opts = {}) {
    const priceTxt = a.price === 0 ? '<span class="price free">免费</span>' : `<span class="price">¥${a.price}</span>`;
    const favOn = isFav(a.id) ? "on" : "";
    const scoreVal = typeof opts.score === "function" ? opts.score(a) : opts.score;
    const match = scoreVal != null
      ? `<div class="match">匹配度 <b>${scoreVal}%</b></div>` : "";
    const reasonText = typeof opts.reason === "function" ? opts.reason(a) : opts.reason;
    const fitOk = typeof opts.fitOk === "function" ? opts.fitOk(a) : opts.fitOk;
    const reason = reasonText
      ? `<div class="wfit ${fitOk ? 'good' : 'bad'}">${fitOk ? '✓' : '!'} ${reasonText}</div>` : "";
    return `
    <article class="card fade-in">
      <a class="cover" href="detail.html?id=${a.id}" style="background:${a.cover}">
        <span class="type-badge">${typeEmoji(a.type)} ${typeName(a.type)}</span>
        <button class="fav ${favOn}" data-fav="${a.id}" title="收藏">${favOn ? '♥' : '♡'}</button>
        ${a.emoji}
      </a>
      <div class="body">
        <h3><a href="detail.html?id=${a.id}">${a.title}</a></h3>
        <div class="meta">
          <span>📅 ${a.date}</span><span>📍 ${a.district}</span><span>🚶 ${a.distance}km</span>
        </div>
        ${reason}
        <div class="tags">${a.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
        <div class="foot">
          ${priceTxt}
          <span class="rate">⭐ ${a.rating} · ${a.joined}人想去</span>
        </div>
        ${match}
      </div>
    </article>`;
  }

  function renderGrid(el, list, opts = {}) {
    if (!el) return;
    if (!list.length) { el.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="e-emoji">🗺️</div><p>暂时没有符合条件的活动，试着放宽筛选吧</p></div>`; return; }
    el.innerHTML = list.map(a => cardHTML(a, opts)).join("");
    bindFavs(el);
  }

  /* ---------- 收藏按钮 ---------- */
  function bindFavs(scope) {
    $$("[data-fav]", scope).forEach(b => {
      b.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const on = toggleFav(b.dataset.fav);
        b.classList.toggle("on", on);
        b.textContent = on ? "♥" : "♡";
        toast(on ? "已加入收藏 ♥" : "已取消收藏");
        if (window.__favChanged) window.__favChanged();
      });
    });
  }

  /* ---------- 天气卡渲染 ---------- */
  function renderWeather(el, onToggle) {
    if (!el) return;
    const w = getWeather();
    el.innerHTML = `
      <div class="w-emoji">${w.emoji}</div>
      <div class="w-main">
        <div class="w-temp">${w.temp}°</div>
        <div class="w-label">${CITY} · ${w.label}</div>
      </div>
      <div class="w-meta">
        <div class="m">风力<b>${w.wind}</b></div>
        <div class="m">空气<b>${w.aqi} 优</b></div>
        <div class="m">出行<b>${w.outdoor ? "宜户外" : "宜室内"}</b></div>
      </div>
      <div class="w-toggle">
        ${Object.entries(WEATHER_PRESETS).map(([k, v]) =>
          `<button class="${getWeather().code === k ? 'on' : ''}" data-w="${k}">${v.emoji} ${v.label}</button>`).join("")}
      </div>`;
    $$("[data-w]", el).forEach(b => b.addEventListener("click", () => {
      setWeather(b.dataset.w); renderWeather(el); toast(`已切换为「${WEATHER_PRESETS[b.dataset.w].label}」`);
      if (onToggle) onToggle();
    }));
  }

  /* ---------- 动效：涟漪 + 彩纸 ---------- */
  function ripple(e) {
    const btn = e.currentTarget;
    const r = document.createElement("span");
    const d = Math.max(btn.clientWidth, btn.clientHeight);
    r.className = "ripple";
    r.style.width = r.style.height = d + "px";
    r.style.left = (e.clientX - btn.getBoundingClientRect().left - d / 2) + "px";
    r.style.top = (e.clientY - btn.getBoundingClientRect().top - d / 2) + "px";
    btn.appendChild(r);
    setTimeout(() => r.remove(), 600);
  }
  function bindRipple() {
    $$(".btn").forEach(b => b.addEventListener("click", ripple));
  }
  function confetti(x, y) {
    const colors = ["#6c4bff", "#ff7a59", "#19c2c2", "#ffb02e", "#1fbf75"];
    for (let i = 0; i < 26; i++) {
      const p = document.createElement("div");
      p.style.cssText = `position:fixed;z-index:300;left:${x}px;top:${y}px;width:8px;height:8px;border-radius:2px;background:${colors[i % 5]};pointer-events:none;transition:.9s cubic-bezier(.1,.7,.3,1)`;
      document.body.appendChild(p);
      const ang = Math.random() * Math.PI * 2, dist = 60 + Math.random() * 120;
      requestAnimationFrame(() => {
        p.style.transform = `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 80}px) rotate(${Math.random() * 360}deg)`;
        p.style.opacity = "0";
      });
      setTimeout(() => p.remove(), 950);
    }
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
  }

  return {
    get, set, $, $$, typeName, typeEmoji,
    getWeather, setWeather, WEATHER_PRESETS,
    getPrefs, setPrefs, defaultPrefs,
    getCheckins, addCheckin, removeCheckin, isChecked,
    getFavs, toggleFav, isFav, bindFavs,
    getTeams, addTeam,
    recommend, weatherFitText, cardHTML, renderGrid, renderWeather,
    ripple, bindRipple, confetti, toast, ACTIVITY_TYPES, CITY,
  };
})();
