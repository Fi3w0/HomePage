/* =========================================================
   home-page · v0.2 · app.js v9
   theme + clock + greeting + panel + bangs + api + edit mode
   ========================================================= */

(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ─────────── settings ───────────
  const KEY = 'home-page.settings.v3';
  const defaults = {
    theme: 'obsidian', name: 'fiw', dek: '',
    seconds: false, grain: true, bgAnim: false, compact: false,
    confetti: false, cursor: false, tilt: false,
    comicSans: false, rainbow: false, upsideDown: false, wiggle: false,
    tiny: false, chonky: false, crt: false, typewriter: false,
    rock: false, rockName: 'steve',
    accent: '', font: 'default', radius: 'default', pageWidth: 'default',
    greetingStyle: 'formal',
    widgets: {
      spotify:true, discord:true, github:true, twitch:true,
      steam:true, mc:true, wishlist:true, docker:true, 'news-tech':true, 'news-games':true,
    },
    quicklinks: [
      { label: 'github', url: 'https://github.com', color: '#a78bfa' },
      { label: 'youtube', url: 'https://youtube.com', color: '#ef4444' },
      { label: 'reddit', url: 'https://reddit.com', color: '#fb923c' },
      { label: 'mail', url: 'https://mail.google.com', color: '#60a5fa' },
      { label: 'claude', url: 'https://claude.ai', color: '#d97706' },
      { label: 'twitch', url: 'https://twitch.tv', color: '#c084fc' },
      { label: 'hn', url: 'https://news.ycombinator.com', color: '#f97316' },
    ],
  };
  const load = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { ...defaults, ...raw, widgets: { ...defaults.widgets, ...(raw.widgets || {}) } };
    } catch { return { ...defaults }; }
  };
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const state = load();

  // ─────────── apply ───────────
  function apply() {
    const html = document.documentElement;
    html.setAttribute('data-theme',      state.theme);
    html.setAttribute('data-seconds',    state.seconds   ? 'on' : 'off');
    html.setAttribute('data-grain',      state.grain     ? 'on' : 'off');
    html.setAttribute('data-bg-anim',    state.bgAnim    ? 'on' : 'off');
    html.setAttribute('data-compact',    state.compact   ? 'on' : 'off');
    html.setAttribute('data-tilt',       state.tilt      ? 'on' : 'off');
    html.setAttribute('data-comic',      state.comicSans ? 'on' : 'off');
    html.setAttribute('data-rainbow',    state.rainbow   ? 'on' : 'off');
    html.setAttribute('data-flip',       state.upsideDown? 'on' : 'off');
    html.setAttribute('data-wiggle',     state.wiggle    ? 'on' : 'off');
    html.setAttribute('data-tiny',       state.tiny      ? 'on' : 'off');
    html.setAttribute('data-chonky',     state.chonky    ? 'on' : 'off');
    html.setAttribute('data-crt',        state.crt       ? 'on' : 'off');
    html.setAttribute('data-typewriter', state.typewriter? 'on' : 'off');
    html.setAttribute('data-font',       state.font      || 'default');
    html.setAttribute('data-radius',     state.radius    || 'default');
    html.setAttribute('data-page-width', state.pageWidth || 'default');

    if (state.accent) html.style.setProperty('--accent-override', state.accent);
    else html.style.removeProperty('--accent-override');

    for (const [k, v] of Object.entries(state.widgets)) {
      const el = document.querySelector(`[data-card="${k}"]`);
      if (el) el.hidden = !v;
    }
    reflowTiles();

    $$('.theme-card').forEach(b =>
      b.setAttribute('aria-current', b.dataset.themeSet === state.theme ? 'true' : 'false')
    );

    const gn = $('#greeting-name'); if (gn) gn.textContent = state.name || 'fiw';
    const dekEl = $('#dek'); if (dekEl && state.dek) dekEl.textContent = state.dek;

    renderRock();
    updateGreeting();
  }

  // ─────────── clock ───────────
  const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const DAYS   = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

  function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil((((t - y0) / 86400000) + 1) / 7);
  }

  function updateClock() {
    const d  = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const ss = String(d.getSeconds()).padStart(2,'0');
    const ct = $('#clock-time');    if (ct) ct.firstChild.nodeValue = `${hh}:${mm}`;
    const cs = $('#clock-sec');     if (cs) cs.textContent = ss;
    const cd = $('#clock-date');    if (cd) cd.textContent = `${DAYS[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const kd = $('#kicker-date');   if (kd) kd.textContent = `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')} ${d.getFullYear()}`;
    const tz = $('#clock-tz');      if (tz) { try { tz.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().toLowerCase().replace('_',' '); } catch { tz.textContent = 'utc'; } }
    const wk = $('#clock-week');    if (wk) wk.textContent = String(isoWeek(d)).padStart(2,'0');
  }

  function timeOfDay() {
    const h = new Date().getHours();
    if (h < 5)  return 'night';
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    if (h < 22) return 'evening';
    return 'night';
  }

  const STYLES = {
    formal:      (t,n) => ({ pre:`good <em>${t}</em>,`, name:n }),
    casual:      (t,n) => ({ pre:`hey, <em>${t==='night'?'night owl':t}</em>`, name:n }),
    pirate:      (t,n) => ({ pre:`ahoy, ye salty <em>${t==='morning'?'sea-dog':'pirate'}</em> —`, name:n }),
    haiku:       (t,n) => ({ pre:`<em>${t}</em> descends slow / a quiet keystroke begins —`, name:n }),
    l33t:        (t,n) => ({ pre:`g00d <em>${t}</em>,`, name:n.replace(/i/gi,'1').replace(/o/gi,'0').replace(/e/gi,'3') }),
    shakespeare: (t,n) => ({ pre:`hark! 'tis <em>${t}</em>, fair`, name:n }),
    corporate:   (t,n) => ({ pre:`circling back this <em>${t}</em>,`, name:n }),
    uwu:         (t,n) => ({ pre:`gud <em>${t==='morning'?'mownin':t==='evening'?'evenin':t}</em> ouo`, name:n }),
    medieval:    (t,n) => ({ pre:`prithee, good <em>${t}</em>,`, name:n }),
  };

  function updateGreeting() {
    const tod = timeOfDay();
    const fn  = STYLES[state.greetingStyle] || STYLES.formal;
    const { pre, name } = fn(tod, state.name || 'fiw');
    const preEl  = $('.greeting__pre');  if (preEl)  preEl.innerHTML = pre;
    const nameEl = $('.greeting__name'); if (nameEl) nameEl.textContent = name;
    const tEl    = $('#time-of-day');    if (tEl)    tEl.textContent = tod;
  }

  // ─────────── github heatmap ───────────
  function buildHeatmap(levels = null) {
    const heat = $('.gh__heat');
    if (!heat) return;
    heat.replaceChildren();
    const weeks = 14;
    const rng = (i) => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };
    // Use real data only if it has actual contributions; otherwise use synthetic
    const hasRealData = levels && levels.some(v => v > 0);
    for (let w = 0; w < weeks; w++) {
      for (let day = 0; day < 7; day++) {
        const i = w * 7 + day;
        let lvl;
        if (hasRealData) {
          lvl = levels[i] ?? 0;
        } else {
          const v = rng(i + 1);
          lvl = v > 0.85 ? 4 : v > 0.65 ? 3 : v > 0.45 ? 2 : v > 0.25 ? 1 : 0;
          if (i === weeks * 7 - 1) lvl = 4;
        }
        const s = document.createElement('span');
        if (lvl) s.classList.add('l' + lvl);
        s.title = hasRealData ? `${levels[i] ?? 0} contributions` : `${lvl} commits`;
        heat.appendChild(s);
      }
    }
  }

  // ─────────── tiling reflow ───────────
  // row 1: spotify(5) + discord(4) + github(3)  = 12
  // row 2: twitch(5)  + mc(3)                    = 12
  // row 3: steam(4)   + wishlist(4)+ docker(4)  = 12
  // row 4: news-tech(6) + news-games(6)         = 12
  const TILE_PREFS = {
    spotify:      { cols: 5, rows: 2, order:  1 },
    discord:      { cols: 4, rows: 2, order:  2 },
    github:       { cols: 3, rows: 2, order:  3 },
    twitch:       { cols: 5, rows: 2, order:  5 },
    mc:           { cols: 3, rows: 2, order:  6 },
    steam:        { cols: 4, rows: 2, order:  7 },
    wishlist:     { cols: 4, rows: 2, order:  8 },
    docker:       { cols: 4, rows: 2, order:  9 },
    'news-tech':  { cols: 6, rows: 2, order: 10 },
    'news-games': { cols: 6, rows: 2, order: 11 },
  };

  function packRows(cards, totalCols = 12) {
    const rows = [];
    let row = [], used = 0;
    for (const c of cards) {
      const w = Math.min(c.cols, totalCols);
      if (used + w > totalCols) { rows.push(row); row = []; used = 0; }
      row.push({ ...c, cols: w });
      used += w;
    }
    if (row.length) rows.push(row);
    for (const r of rows) {
      let leftover = totalCols - r.reduce((s,c) => s + c.cols, 0);
      if (leftover <= 0) continue;
      const sorted = [...r].sort((a,b) => b.cols - a.cols);
      let i = 0;
      while (leftover-- > 0) sorted[(i++) % sorted.length].cols += 1;
    }
    return rows;
  }

  function reflowTiles() {
    const bento = document.querySelector('.bento');
    if (!bento) return;
    const visible = Object.entries(TILE_PREFS)
      .map(([key, pref]) => ({ key, el: document.querySelector(`[data-card="${key}"]`), ...pref }))
      .filter(c => c.el && !c.el.hidden);
    if (!visible.length) return;
    visible.sort((a,b) => a.order - b.order);

    if (window.innerWidth <= 720) {
      visible.forEach(c => {
        ['data-tile-cols','data-tile-rows','data-tile-order'].forEach(a => c.el.removeAttribute(a));
        ['--tile-cols','--tile-rows','--tile-order'].forEach(p => c.el.style.removeProperty(p));
      });
      return;
    }

    const rows = packRows(visible.map(v => ({ key:v.key, cols:v.cols, rows:v.rows })));
    let order = 1;
    for (const r of rows) {
      for (const c of r) {
        const v = visible.find(x => x.key === c.key);
        v.el.setAttribute('data-tile-cols', '');
        v.el.setAttribute('data-tile-rows', '');
        v.el.setAttribute('data-tile-order', '');
        v.el.style.setProperty('--tile-cols', c.cols);
        v.el.style.setProperty('--tile-rows', c.rows);
        v.el.style.setProperty('--tile-order', order++);
      }
    }
  }

  let reflowRaf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(reflowRaf);
    reflowRaf = requestAnimationFrame(reflowTiles);
  });

  // ─────────── layout persistence ───────────
  const LAYOUT_KEY = 'home-page.layout.v1';

  function saveLayout() {
    const order = Object.entries(TILE_PREFS)
      .sort((a,b) => a[1].order - b[1].order)
      .map(([k]) => k);
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(order));
  }

  function loadLayout() {
    try {
      const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null');
      if (!Array.isArray(saved)) return;
      saved.forEach((key, i) => { if (TILE_PREFS[key]) TILE_PREFS[key].order = i + 1; });
    } catch {}
  }

  // ─────────── edit mode (drag-and-drop reorder) ───────────
  let editActive = false;
  let dragSrc = null;

  function enterEditMode() {
    editActive = true;
    document.documentElement.setAttribute('data-edit', 'on');
    const editBtn = $('#edit-btn');
    if (editBtn) editBtn.setAttribute('aria-pressed', 'true');
    $$('[data-card]').forEach(card => {
      if (card.hidden) return;
      card.setAttribute('draggable', 'true');
      card.addEventListener('dragstart',  onDragStart);
      card.addEventListener('dragend',    onDragEnd);
      card.addEventListener('dragover',   onDragOver);
      card.addEventListener('dragleave',  onDragLeave);
      card.addEventListener('drop',       onDrop);
    });
  }

  function exitEditMode() {
    editActive = false;
    document.documentElement.removeAttribute('data-edit');
    const editBtn = $('#edit-btn');
    if (editBtn) editBtn.setAttribute('aria-pressed', 'false');
    $$('[data-card]').forEach(card => {
      card.removeAttribute('draggable');
      card.removeEventListener('dragstart',  onDragStart);
      card.removeEventListener('dragend',    onDragEnd);
      card.removeEventListener('dragover',   onDragOver);
      card.removeEventListener('dragleave',  onDragLeave);
      card.removeEventListener('drop',       onDrop);
      card.classList.remove('card--drag-over', 'card--dragging');
    });
  }

  function onDragStart(e) {
    dragSrc = this;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => this.classList.add('card--dragging'), 0);
  }
  function onDragEnd() {
    this.classList.remove('card--dragging');
    $$('.card--drag-over').forEach(c => c.classList.remove('card--drag-over'));
    dragSrc = null;
  }
  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (this !== dragSrc) this.classList.add('card--drag-over');
  }
  function onDragLeave() { this.classList.remove('card--drag-over'); }
  function onDrop(e) {
    e.preventDefault();
    this.classList.remove('card--drag-over');
    if (!dragSrc || dragSrc === this) return;
    const srcKey = dragSrc.dataset.card;
    const dstKey = this.dataset.card;
    if (!TILE_PREFS[srcKey] || !TILE_PREFS[dstKey]) return;
    // Insert src before dst: shift orders
    const srcOrder = TILE_PREFS[srcKey].order;
    const dstOrder = TILE_PREFS[dstKey].order;
    if (srcOrder < dstOrder) {
      // moving forward: shift everything between src+1..dst down by 1
      for (const p of Object.values(TILE_PREFS)) {
        if (p.order > srcOrder && p.order <= dstOrder) p.order -= 1;
      }
    } else {
      // moving backward: shift everything between dst..src-1 up by 1
      for (const p of Object.values(TILE_PREFS)) {
        if (p.order >= dstOrder && p.order < srcOrder) p.order += 1;
      }
    }
    TILE_PREFS[srcKey].order = dstOrder;
    saveLayout();
    reflowTiles();
  }

  function bindEditMode() {
    const btn = $('#edit-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (editActive) exitEditMode();
      else enterEditMode();
    });
  }

  // ─────────── pet rock ───────────
  function renderRock() {
    let rock = document.getElementById('pet-rock');
    if (state.rock) {
      if (!rock) {
        rock = document.createElement('div');
        rock.id = 'pet-rock';
        rock.className = 'pet-rock';
        rock.title = 'click to pet';
        // Safe DOM construction — no innerHTML
        const body = document.createElement('div');
        body.className = 'pet-rock__body';
        body.setAttribute('aria-hidden', 'true');
        ['pet-rock__eye pet-rock__eye--l', 'pet-rock__eye pet-rock__eye--r', 'pet-rock__mouth'].forEach(cls => {
          const s = document.createElement('span');
          s.className = cls;
          body.appendChild(s);
        });
        const nm = document.createElement('div');
        nm.className = 'pet-rock__name';
        rock.append(body, nm);
        document.body.appendChild(rock);
        rock.addEventListener('click', () => {
          rock.classList.remove('pet-rock--happy');
          void rock.offsetWidth;
          rock.classList.add('pet-rock--happy');
        });
      }
      const nm = rock.querySelector('.pet-rock__name');
      if (nm) nm.textContent = state.rockName || 'steve';
    } else if (rock) {
      rock.remove();
    }
  }

  // ─────────── countup ───────────
  function animateCountUps() {
    $$('[data-countup]').forEach(el => {
      const target = parseInt(el.dataset.countup, 10);
      if (Number.isNaN(target)) return;
      const dur = 900 + Math.random() * 400;
      const t0  = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // ─────────── wishlist ───────────
  function renderWishlist(data) {
    const ul = $('#wishlist-list');
    if (!ul || !data?.items?.length) return;
    ul.replaceChildren();
    data.items.forEach(w => {
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.className = 'wish'; a.href = w.url;

      const cover = document.createElement('span'); cover.className = 'wish__cover';
      cover.style.backgroundImage    = `url(${w.cover})`;
      cover.style.backgroundSize     = 'cover';
      cover.style.backgroundPosition = 'center';

      const info = document.createElement('span'); info.className = 'wish__info';
      const name = document.createElement('span'); name.className = 'wish__name'; name.textContent = w.name;
      const pline = document.createElement('span'); pline.className = 'wish__price-line';

      if (w.discount_pct) {
        const p = document.createElement('span'); p.className = 'wish__price'; p.textContent = w.price ?? '—';
        const po = document.createElement('span'); po.className = 'wish__price-old'; po.textContent = w.price_original ?? '';
        const badge = document.createElement('span'); badge.className = 'wish__badge wish__badge--deal'; badge.textContent = `−${w.discount_pct}%`;
        pline.append(p, po, badge);
      } else if (w.unreleased) {
        const p = document.createElement('span'); p.className = 'wish__price'; p.textContent = '—';
        const badge = document.createElement('span'); badge.className = 'wish__badge wish__badge--soon'; badge.textContent = 'unreleased';
        pline.append(p, badge);
      } else {
        const p = document.createElement('span'); p.className = 'wish__price'; p.textContent = w.price ?? '—';
        pline.appendChild(p);
      }
      info.append(name, pline);
      a.append(cover, info);
      li.appendChild(a); ul.appendChild(li);
    });
  }

  async function loadWishlist() {
    const data = await apiGet('/api/steam/wishlist', { timeout: 10000 });
    if (data) renderWishlist(data);
  }

  // ─────────── news ───────────
  function fmtAge(age_min) {
    if (age_min < 60)   return `${age_min}m`;
    if (age_min < 1440) return `${Math.floor(age_min / 60)}h`;
    return `${Math.floor(age_min / 1440)}d`;
  }

  function renderNews(data, listId, timeId) {
    const ol = document.getElementById(listId);
    if (!ol || !data?.items?.length) return;
    ol.replaceChildren();
    data.items.forEach(item => {
      const li = document.createElement('li'); li.className = 'news__item';
      const src = document.createElement('span'); src.className = 'news__src'; src.textContent = item.source;
      const a   = document.createElement('a');   a.className = 'news__title'; a.href = item.url;
      a.textContent = item.title;
      const t   = document.createElement('span'); t.className = 'news__time'; t.textContent = fmtAge(item.age_min);
      li.append(src, a, t); ol.appendChild(li);
    });
    const timeEl = document.getElementById(timeId);
    if (timeEl && data.refreshed_at) {
      const d = new Date(data.refreshed_at);
      timeEl.textContent = `refreshed ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
  }

  async function loadNews() {
    const [tech, games] = await Promise.all([
      apiGet('/api/news/tech',  { timeout: 15000 }),
      apiGet('/api/news/games', { timeout: 15000 }),
    ]);
    if (tech)  renderNews(tech,  'news-tech-list',  'news-tech-time');
    if (games) renderNews(games, 'news-games-list', 'news-games-time');
  }

  // ─────────── docker / homelab ───────────
  function renderDocker(d) {
    const ul = $('#docker-list');
    if (!ul || !d) return;

    const nums = $$('.docker__summary .docker__sum-num');
    if (nums[0]) { nums[0].dataset.countup = d.running; nums[0].textContent = d.running; }
    if (nums[1]) { nums[1].dataset.countup = d.stopped; nums[1].textContent = d.stopped; }
    if (nums[2]) nums[2].innerHTML = `${d.cpu}<small>%</small>`;
    if (nums[3]) nums[3].innerHTML = `${d.ram}<small>g</small>`;

    ul.innerHTML = d.containers.map(c => `
      <li class="docker__item">
        <span class="docker__item-dot ${c.status==='down'?'docker__item-dot--off':''}"></span>
        <span class="docker__item-name">${c.name}</span>
        <span class="docker__item-img">${c.image}</span>
        <span class="docker__item-up">${c.uptime}</span>
      </li>
    `).join('');
  }

  async function loadDocker() { renderDocker(await apiGet('/api/docker/list', { timeout: 8000 })); }

  // ─────────── weather ───────────
  // ─────────── search / bangs ───────────
  const BANGS = {
    g:   q => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    yt:  q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    w:   q => `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`,
    gh:  q => `https://github.com/search?q=${encodeURIComponent(q)}`,
    r:   q => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}`,
    map: q => `https://www.google.com/maps/search/${encodeURIComponent(q)}`,
    npm: q => `https://www.npmjs.com/search?q=${encodeURIComponent(q)}`,
    so:  q => `https://stackoverflow.com/search?q=${encodeURIComponent(q)}`,
    mdn: q => `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(q)}`,
  };

  function bindSearch() {
    const input = $('#search-input');
    const form  = $('#search-form');
    document.addEventListener('keydown', e => {
      if (e.target === input) return;
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); input.focus(); }
    });
    form.addEventListener('submit', e => {
      const v = input.value.trim();
      if (!v) { e.preventDefault(); return; }
      const m = v.match(/^([a-z]+)\s+(.+)$/i);
      if (m && BANGS[m[1].toLowerCase()]) {
        e.preventDefault();
        window.location.href = BANGS[m[1].toLowerCase()](m[2]);
        input.value = '';
      }
    });
  }

  // ─────────── settings panel ───────────
  function bindPanel() {
    const panel = $('#panel');
    const open  = () => panel.setAttribute('aria-hidden', 'false');
    const close = () => panel.setAttribute('aria-hidden', 'true');
    $('#menu-btn').addEventListener('click', open);
    $$('[data-close]', panel).forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    $$('[data-theme-set]').forEach(b => {
      b.addEventListener('click', () => { state.theme = b.dataset.themeSet; save(); apply(); });
    });

    $$('[data-setting]', panel).forEach(el => {
      const key = el.dataset.setting;
      if (el.type === 'checkbox') el.checked = !!state[key];
      else el.value = state[key] ?? '';
      el.addEventListener('change', () => { state[key] = el.type === 'checkbox' ? el.checked : el.value; save(); apply(); });
      if (el.type === 'text') el.addEventListener('input', () => { state[key] = el.value; save(); apply(); });
    });

    $$('[data-toggle]', panel).forEach(el => {
      const key = el.dataset.toggle;
      el.checked = state.widgets[key] !== false;
      el.addEventListener('change', () => { state.widgets[key] = el.checked; save(); apply(); });
    });

    $('#reset-btn').addEventListener('click', () => {
      if (!confirm('reset all settings?')) return;
      localStorage.removeItem(KEY);
      Object.assign(state, JSON.parse(JSON.stringify(defaults)));
      save(); apply();
      renderQuicklinks();
      // re-bind panel after defaults restore
      $$('[data-setting]', panel).forEach(el => {
        const key = el.dataset.setting;
        if (el.type === 'checkbox') el.checked = !!state[key];
        else el.value = state[key] ?? '';
      });
    });

    renderQuicklinks();
    $('#ql-add-btn').addEventListener('click', () => {
      state.quicklinks.push({ label: '', url: '', color: '#a78bfa' });
      save();
      renderQuicklinks();
    });
  }

  // ─────────── quicklinks editor ───────────
  function renderQuicklinks() {
    const editor = $('#ql-editor');
    if (!editor) return;
    editor.replaceChildren();
    state.quicklinks.forEach((ql, i) => {
      const row = document.createElement('div'); row.className = 'ql-row';
      const lbl = document.createElement('input'); lbl.type = 'text'; lbl.placeholder = 'label'; lbl.className = 'input ql-row__lbl'; lbl.value = ql.label;
      const url = document.createElement('input'); url.type = 'text'; url.placeholder = 'url'; url.className = 'input ql-row__url'; url.value = ql.url;
      const col = document.createElement('input'); col.type = 'color'; col.className = 'ql-row__col'; col.value = ql.color;
      const del = document.createElement('button'); del.className = 'ql-row__del'; del.textContent = '✕';
      lbl.addEventListener('input', () => { state.quicklinks[i].label = lbl.value; save(); renderQuicklinks(); });
      url.addEventListener('input', () => { state.quicklinks[i].url = url.value; save(); renderQuicklinks(); });
      col.addEventListener('input', () => { state.quicklinks[i].color = col.value; save(); renderQuicklinks(); });
      del.addEventListener('click', () => { state.quicklinks.splice(i, 1); save(); renderQuicklinks(); });
      row.append(lbl, url, col, del); editor.appendChild(row);
    });
    // Render the actual quicklinks bar
    const ul = $('#quicklinks');
    if (ul) {
      ul.replaceChildren();
      state.quicklinks.filter(q => q.label && q.url).forEach(q => {
        const li = document.createElement('li');
        const a = document.createElement('a'); a.className = 'ql'; a.href = q.url; a.style.setProperty('--ql-c', q.color);
        const dot = document.createElement('span'); dot.className = 'ql__dot';
        a.append(dot, document.createTextNode(q.label));
        li.appendChild(a); ul.appendChild(li);
      });
    }
  }

  // ─────────── confetti ───────────
  const COLORS = ['#d97706','#f59e0b','#84cc16','#ef4444','#a78bfa','#22d3ee','#fb7185','#fbbf24','#22c55e'];
  function confetti(n = 80) {
    const stage = $('#confetti');
    const frag  = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.style.setProperty('--c', COLORS[i % COLORS.length]);
      s.style.setProperty('--r', `${Math.random() * 360}deg`);
      s.style.setProperty('--d', `${2 + Math.random() * 2.5}s`);
      s.style.left = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 0.4}s`;
      s.style.width  = `${5  + Math.random() * 6}px`;
      s.style.height = `${10 + Math.random() * 10}px`;
      frag.appendChild(s);
      setTimeout(() => s.remove(), 5500);
    }
    stage.appendChild(frag);
  }

  // ─────────── cursor sparkles ───────────
  let lastSpark = 0;
  function onMove(e) {
    if (!state.cursor) return;
    const now = performance.now();
    if (now - lastSpark < 40) return;
    lastSpark = now;
    const s = document.createElement('div');
    s.className = 'spark';
    s.style.left = `${e.clientX - 3}px`;
    s.style.top  = `${e.clientY - 3}px`;
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }

  // ─────────── easter eggs ───────────
  function bindEasterEggs() {
    let clicks = 0, lastClick = 0;
    $('.greeting__name').addEventListener('click', () => {
      const now = Date.now();
      if (now - lastClick > 1500) clicks = 0;
      lastClick = now; clicks++;
      if (clicks >= 5 && state.confetti) { confetti(120); clicks = 0; }
    });
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let pos = 0;
    document.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === seq[pos].toLowerCase()) {
        if (++pos === seq.length) { pos = 0; if (state.confetti) confetti(200); }
      } else { pos = 0; }
    });
    document.addEventListener('mousemove', onMove);
  }

  // ─────────── colophon ───────────
  const QUOTES = [
    'if found, please return to firefox.',
    'no sponsors. no algorithm. only signal.',
    'a homepage, in the proper sense.',
    'set in fraunces, served warm.',
    'the cursor blinks. the world waits.',
    'today is a good day to refactor.',
    'localhost, made personal.',
    'rss is not dead. it just got quieter.',
    'a quiet desk, a warm terminal — three things on the list today, and the kettle just clicked off.',
    'the terminal never judges your typos.',
    'commit often. refactor bravely. ship with confidence.',
    'every great system started with a single import.',
    'some bugs whisper. others stare you in the face until 3am.',
    'the most elegant code is the code you never had to write.',
    'readme driven development — start with the story.',
    'your homelab is a love letter to yourself.',
    'containers are just very opinionated suitcases.',
    'the ssh session that never closes.',
    'git log is a time machine with accountability.',
    'docker-compose up — the modern equivalent of lighting a beacon.',
    'a fresh database is like a blank notebook.',
    'the best error message is the one you never see.',
    'documentation is a gift to your future self.',
  ];
  const DEKS = [
    'a quiet desk, a warm terminal — <span class="dek__accent">three things on the list today</span>, and the kettle just clicked off.',
    'the screen glows. the fans hum. <span class="dek__accent">all is right with the world.</span>',
    'another <span class="dek__accent">layer of abstraction</span> between you and the void.',
    'pixels arranged. <span class="dek__accent">fonts selected.</span> peace achieved.',
    'containers up. services green. <span class="dek__accent">nothing is on fire.</span>',
    'one more <span class="dek__accent">git push</span> before the coffee runs out.',
    'you are exactly where you need to be — <span class="dek__accent">in the terminal.</span>',
    'the only downtime today is <span class="dek__accent">for yourself.</span>',
    'no meetings. no alerts. <span class="dek__accent">just code.</span>',
    'a fresh branch. a blank screen. <span class="dek__accent">infinite possibility.</span>',
    'the build passed. the tests are green. <span class="dek__accent">the machine approves.</span>',
    'everything runs in containers — <span class="dek__accent">including your focus.</span>',
    'localhost:<span class="dek__accent">3000</span> — the most comforting port number.',
    'system uptime: healthy. <span class="dek__accent">mental uptime: pending.</span>',
    'the only 404 here is <span class="dek__accent">your motivation to close the lid.</span>',
  ];
  function rotateQuote() {
    const el = $('#colophon-quote');
    if (el) el.textContent = '— ' + QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const dek = $('#dek');
    if (dek && !state.dek) dek.innerHTML = DEKS[Math.floor(Math.random() * DEKS.length)];
  }

  // ─────────── api helper ───────────
  // Returns parsed JSON on 2xx, null on anything else — every provider uses this
  // so the page never breaks when a provider is unwired or down.
  async function apiGet(path, { timeout = 4000 } = {}) {
    try {
      const ctl = new AbortController();
      const t   = setTimeout(() => ctl.abort(), timeout);
      const r   = await fetch(path, { signal: ctl.signal, headers: { accept: 'application/json' } });
      clearTimeout(t);
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }
  window.api = { get: apiGet };

  // ─────────── minecraft ───────────
  function renderMc(d) {
    if (!d) return;
    const card = $('[data-card="mc"]');
    if (!card) return;

    const dot = card.querySelector('.mc__status .live-dot');
    const lbl = card.querySelector('.mc__status-label');
    const png = card.querySelector('.mc__ping');

    if (!d.online) {
      dot && (dot.className = 'live-dot');
      lbl && (lbl.textContent = 'offline');
      png && (png.textContent = '—');
      return;
    }

    dot && (dot.className = 'live-dot live-dot--green');
    lbl && (lbl.textContent = 'online');
    png && (png.textContent = `${d.ping_ms}ms`);

    const lines = (d.description || '').split('\n');
    const m1 = card.querySelector('#mc-motd1');
    const m2 = card.querySelector('#mc-motd2');
    if (m1 && lines[0]) m1.textContent = lines[0];
    if (m2) m2.textContent = lines[1] || `${d.version?.name ?? '?'} · neoforge`;

    const numEl = card.querySelector('.mc__players-num [data-countup]');
    const maxEl = card.querySelector('.mc__players-max');
    if (numEl) { numEl.dataset.countup = d.players.online; numEl.textContent = d.players.online; }
    if (maxEl) maxEl.textContent = `/${d.players.max}`;

    const list   = card.querySelector('.mc__players-list');
    const sample = d.players.sample ?? [];
    if (list) {
      list.replaceChildren();
      if (sample.length === 0) {
        const li = document.createElement('li'); li.className = 'mc__pl-empty'; li.textContent = 'no one online';
        list.appendChild(li);
      } else {
        const palette = ['#a78bfa','#34d399','#fb7185','#fbbf24','#60a5fa','#f472b6'];
        sample.slice(0, 6).forEach((p, i) => {
          const li   = document.createElement('li');
          const skin = document.createElement('span');
          skin.className = 'mc__pl-skin'; skin.style.setProperty('--c1', palette[i % palette.length]);
          li.append(skin, document.createTextNode(p.name));
          list.appendChild(li);
        });
      }
    }

    // CPU/RAM bars
    const cpuBar = card.querySelector('#mc-cpu-bar');
    const cpuNum = card.querySelector('#mc-cpu');
    const ramBar = card.querySelector('#mc-ram-bar');
    const ramNum = card.querySelector('#mc-ram');
    if (d.cpu != null && cpuBar && cpuNum) {
      const w = Math.min(d.cpu, 100);
      cpuBar.style.setProperty('--w', w + '%');
      cpuNum.textContent = d.cpu + '%';
    }
    if (d.ram != null && ramBar && ramNum) {
      const limit = d.ram_limit || 16384;
      const w = Math.min(d.ram / limit * 100, 100);
      ramBar.style.setProperty('--w', w + '%');
      ramNum.textContent = d.ram >= 1024 ? Math.round(d.ram / 1024 * 10) / 10 + 'gb' : d.ram + 'mb';
    }
  }

  async function loadMc() { renderMc(await apiGet('/api/mc/status')); }

  // ─────────── github ───────────
  function renderGithub(d) {
    if (!d) return;
    const nums = $$('.gh__stat .gh__num');
    if (nums[0]) { nums[0].dataset.countup = d.today; nums[0].textContent = d.today; }
    if (nums[1]) { nums[1].dataset.countup = d.week;  nums[1].textContent = d.week; }
    if (nums[2]) { nums[2].dataset.countup = d.streak;nums[2].textContent = d.streak; }

    if (d.heatmap) buildHeatmap(d.heatmap);

    const ul = $('.gh__commits');
    if (!ul) return;
    ul.replaceChildren();
    (d.commits ?? []).slice(0, 4).forEach(c => {
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = c.url; a.target = '_blank'; a.rel = 'noopener';
      const sha  = document.createElement('span'); sha.className  = 'gh__sha';  sha.textContent = c.sha;
      const msg  = document.createElement('span'); msg.className  = 'gh__msg';  msg.textContent = c.message;
      const repo = document.createElement('span'); repo.className = 'gh__repo'; repo.textContent = c.repo;
      a.append(sha, msg, repo); li.appendChild(a); ul.appendChild(li);
    });

    // Update github link to user profile
    const link = $('[data-card="github"] .card__source--link');
    if (link) link.href = `https://github.com/${d.user ?? 'Fi3w0'}`;
  }

  async function loadGithub() { renderGithub(await apiGet('/api/github/activity', { timeout: 8000 })); }

  // ─────────── spotify ───────────
  function fmtMs(ms) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function fmtTimeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
  }

  function renderSpotify(d) {
    if (!d) return;
    const card = $('[data-card="spotify"]');
    if (!card) return;

    const eyebrow = card.querySelector('.card__eyebrow');
    const link = card.querySelector('.spotify');
    const art = $('#sp-art');
    const title = $('#sp-title');
    const artist = $('#sp-artist');
    const album = $('#sp-album');
    const fill = $('#sp-fill');
    const cur = $('#sp-cur');
    const dur = $('#sp-dur');
    const eq = card.querySelector('.eq');
    const recentList = $('.recent-tracks__list');

    if (d.now && d.now.is_playing) {
      if (eyebrow) eyebrow.innerHTML = '<span class="live-dot live-dot--green"></span>now playing';
      if (link) link.href = `https://www.last.fm/user/${d.user ?? 'Fi3w0'}`;
      if (art) art.style.background = `url(${d.now.album_art_url || ''}) center/cover`;
      if (title) title.textContent = d.now.song;
      if (artist) artist.textContent = d.now.artist;
      if (album) album.textContent = d.now.album;
      if (fill) fill.style.transform = 'scaleX(1)';
      if (cur) cur.textContent = 'LIVE';
      if (dur) dur.textContent = '';
      card.classList.add('spotify--playing');
      if (eq) eq.classList.add('eq--playing');
    } else {
      if (eyebrow) eyebrow.innerHTML = '<span class="live-dot live-dot--dim"></span>paused';
      if (art) art.style.background =
        'radial-gradient(120% 120% at 30% 20%, #f9a8d4 0%, transparent 55%), radial-gradient(140% 140% at 80% 80%, #4c1d95 0%, transparent 60%), linear-gradient(135deg, #831843 0%, #1e1b4b 100%)';
      if (title) title.textContent = d.now?.song ?? '—';
      if (artist) artist.textContent = d.now?.artist ?? '';
      if (album) album.textContent = d.now?.album ?? '';
      card.classList.remove('spotify--playing');
      if (eq) eq.classList.remove('eq--playing');
      if (fill) fill.style.transform = 'scaleX(0)';
      if (cur) cur.textContent = '0:00';
      if (dur) dur.textContent = '0:00';
    }

    if (recentList && d.recent?.length) {
      recentList.replaceChildren();
      d.recent.forEach(t => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        const cover = document.createElement('span');
        cover.className = 'recent-tracks__cover';
        cover.style.background = `url(${t.album_art_url}) center/cover`;
        const name = document.createElement('span');
        name.className = 'recent-tracks__name';
        name.textContent = t.song;
        const artEl = document.createElement('span');
        artEl.className = 'recent-tracks__artist';
        artEl.textContent = t.artist;
        const time = document.createElement('span');
        time.className = 'recent-tracks__time';
        time.textContent = fmtTimeAgo(t.played_at);
        a.append(cover, name, artEl, time);
        li.appendChild(a);
        recentList.appendChild(li);
      });
    }
  }

  async function loadSpotify() { renderSpotify(await apiGet('/api/spotify/data', { timeout: 8000 })); }

  // ─────────── twitch ───────────
  function fmtViewers(n) {
    return n >= 1000 ? (n / 1000).toFixed(1).replace('.0','') + 'k' : String(n);
  }

  function renderTwitch(streamers) {
    if (!streamers?.length) return;
    const ul = $('.streamers');
    if (!ul) return;
    ul.replaceChildren();
    const palette = [
      ['#7c3aed','#ec4899'],['#0e7490','#22d3ee'],['#1e40af','#60a5fa'],
      ['#92400e','#fbbf24'],['#065f46','#6ee7b7'],['#7c2d12','#f97316'],
      ['#4c1d95','#a78bfa'],['#134e4a','#34d399'],
    ];
    streamers.forEach((s, i) => {
      const [c1, c2] = palette[i % palette.length];
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href = `https://twitch.tv/${s.login}`; a.target = '_blank'; a.rel = 'noopener';
      a.className = `streamer${s.live ? ' streamer--live' : ''}`;

      const av = document.createElement('span'); av.className = 'streamer__av';
      if (s.profile_image_url) {
        av.style.backgroundImage = `url(${s.profile_image_url})`;
        av.style.backgroundSize  = 'cover';
        av.style.backgroundPosition = 'center';
      } else {
        av.style.setProperty('--c1', c1); av.style.setProperty('--c2', c2);
      }

      const main = document.createElement('span'); main.className = 'streamer__main';
      const name = document.createElement('span'); name.className = 'streamer__name'; name.textContent = s.display_name;
      const game = document.createElement('span'); game.className = 'streamer__game';
      if (s.live && s.game) {
        const h = s.duration_min ? `${Math.floor(s.duration_min/60)}h ${s.duration_min%60}m` : '';
        game.textContent = s.game + (h ? ` · ${h}` : '');
      } else { game.textContent = 'offline'; }
      main.append(name, game);

      const vw = document.createElement('span');
      vw.className = `streamer__viewers${s.live ? '' : ' streamer__viewers--off'}`;
      if (s.live) {
        const dot = document.createElement('span'); dot.className = 'live-dot';
        vw.append(dot, document.createTextNode(fmtViewers(s.viewers ?? 0)));
      } else { vw.textContent = 'offline'; }

      a.append(av, main, vw); li.appendChild(a); ul.appendChild(li);
    });

    const liveN = streamers.filter(s => s.live).length;
    const cnt = $('#twitch-live-count'); if (cnt) cnt.textContent = String(liveN);
  }

  async function loadTwitch() { renderTwitch(await apiGet('/api/twitch/following', { timeout: 6000 })); }

  // ─────────── discord ───────────
  const DISCORD_ACT_TYPES = ["playing", "streaming", "listening", "watching", "custom", "competing"];

  function renderDiscord(d) {
    if (!d) return;
    const nameEl = $('#discord-name');
    const preEl  = $('#discord-presence');
    const actLbl = $('#discord-act-label');
    const actNm  = $('#discord-act-name');
    const actDet = $('#discord-act-detail');
    const av     = $('#discord-avatar');
    const lastEl = $('#discord-last');
    const tl     = $('#discord-timeline');

    if (nameEl) nameEl.textContent = d.display_name || d.username;
    if (preEl) {
      preEl.dataset.presence = d.status;
      preEl.style.background = "";
    }
    if (av && d.avatar_url) {
      av.style.backgroundImage = `url(${d.avatar_url})`;
      av.style.backgroundSize  = "cover";
      av.style.backgroundPosition = "center";
    }

    const act = d.current_activities?.[0];
    if (actLbl && act) {
      actLbl.textContent = act.label || DISCORD_ACT_TYPES[act.type] || "playing";
    } else if (actLbl) {
      actLbl.textContent = d.spotify ? "listening" : "—";
    }

    if (actNm && act) {
      let t = act.name || "";
      if (act.duration) t += ` · ${act.duration}`;
      actNm.textContent = t;
    } else if (actNm) {
      actNm.textContent = "";
    }

    if (actDet && act?.details) actDet.textContent = act.details;
    else if (actDet && d.spotify) actDet.textContent = `${d.spotify.song} — ${d.spotify.artist}`;
    else if (actDet) actDet.textContent = "";

    if (lastEl) {
      if (d.last_activity) {
        const la = d.last_activity;
        lastEl.textContent = `${la.label} — ${la.name} · ${la.duration}m · ${la.time_ago}`;
      } else {
        lastEl.textContent = "—";
      }
    }

    if (tl && d.longest_activities?.length) {
      tl.replaceChildren();
      d.longest_activities.forEach(h => {
        const li = document.createElement('li');
        const tm = document.createElement('span'); tm.className = 'discord__t-time'; tm.textContent = `${h.duration}m`;
        const ic = document.createElement('span'); ic.className = 'discord__t-icon'; ic.textContent = h.label === "listening" ? "🎧" : "▶";
        const tx = document.createElement('span'); tx.className = 'discord__t-text'; tx.textContent = `${h.label} — ${h.name}`;
        li.append(tm, ic, tx); tl.appendChild(li);
      });
    } else if (tl) {
      tl.replaceChildren();
    }
  }

  async function loadDiscord() { renderDiscord(await apiGet('/api/discord/presence', { timeout: 6000 })); }

  // ─────────── steam ───────────
  function fmtLastPlayed(ts) {
    if (!ts) return null;
    const diff = Math.floor((Date.now() / 1000 - ts) / 86400);
    if (diff === 0) return 'today';
    if (diff === 1) return 'yesterday';
    if (diff < 7)  return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return `${Math.floor(diff / 30)}mo ago`;
  }

  function renderSteam(data) {
    if (!data?.games?.length) return;
    const ul = $('.steam-list');
    if (!ul) return;
    ul.replaceChildren();
    const maxH = Math.max(...data.games.map(g => g.hours_total), 1);
    data.games.forEach(g => {
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.className = 'steam-game'; a.href = g.url;

      const cover = document.createElement('span'); cover.className = 'steam-game__cover';
      cover.style.backgroundImage    = `url(${g.cover})`;
      cover.style.backgroundSize     = 'cover';
      cover.style.backgroundPosition = 'center';

      const main = document.createElement('span'); main.className = 'steam-game__main';
      const name = document.createElement('span'); name.className = 'steam-game__name'; name.textContent = g.name;
      const sub  = document.createElement('span'); sub.className  = 'steam-game__sub';
      const when = fmtLastPlayed(g.last_played);
      if (g.hours_2weeks) {
        sub.textContent = `${g.hours_2weeks}h recently · ${g.hours_total}h total`;
      } else if (when) {
        sub.textContent = `${when} · ${g.hours_total}h total`;
      } else {
        sub.textContent = `${g.hours_total}h total`;
      }
      main.append(name, sub);

      const bar  = document.createElement('span'); bar.className = 'steam-game__bar';
      const fill = document.createElement('span'); fill.style.setProperty('--w', `${Math.round(g.hours_total / maxH * 100)}%`);
      bar.appendChild(fill);

      a.append(cover, main, bar); li.appendChild(a); ul.appendChild(li);
    });

    // Last achievement
    const achEl = $('#steam-ach');
    if (achEl) {
      achEl.textContent = data.achievement || '—';
      const top = data.games[0];
      if (top && data.achievement) {
        achEl.textContent = `${data.achievement} — ${top.name}`;
      }
    }
  }

  async function loadSteam() { renderSteam(await apiGet('/api/steam/recent', { timeout: 8000 })); }

  // ─────────── weather chart line ───────────
  // ─────────── page visibility — pause bg animations when hidden ───────────
  function handleVisibility() {
    const state = document.hidden ? 'paused' : 'running';
    document.querySelectorAll('.bg-mesh, .bg-aurora').forEach(el => {
      el.style.animationPlayState = state;
    });
  }
  document.addEventListener('visibilitychange', handleVisibility);

  // ─────────── health ping → colophon ───────────
  async function pingHealth() {
    const el = $('#last-sync');
    const h  = await apiGet('/api/health', { timeout: 2500 });
    if (el) el.textContent = h?.ok ? 'just now · api ok' : 'offline · placeholder data';
  }

  function tickSync() {
    pingHealth();
    setInterval(pingHealth, 30_000);
  }

  // ─────────── init ───────────
  function init() {
    loadLayout();   // restore saved widget order before first reflow
    apply();
    updateClock();
    setInterval(updateClock, 1000);
    setInterval(updateGreeting, 60_000);
    buildHeatmap();
    bindPanel();
    bindSearch();
    bindEasterEggs();
    bindEditMode();
    rotateQuote();
    setInterval(rotateQuote, 30_000);
    tickSync();
    setTimeout(animateCountUps, 350);

    // providers — graceful: keep mock layout if api returns null
    loadMc();
    loadSpotify();
    loadGithub();
    loadTwitch();
    loadDiscord();
    loadSteam();
    loadWishlist();
    loadNews();
    loadDocker();

    setInterval(loadMc,       30_000);
    setInterval(loadSpotify,  30_000);
    setInterval(loadTwitch,   90_000);
    setInterval(loadDiscord,  60_000);
    setInterval(loadSteam,    15 * 60_000);
    setInterval(loadGithub,    5 * 60_000);
    setInterval(loadWishlist, 30 * 60_000);
    setInterval(loadNews,     15 * 60_000);
    setInterval(loadDocker,   30_000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
