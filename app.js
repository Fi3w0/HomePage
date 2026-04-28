/* =========================================================
   home-page · preview · app.js
   theme + clock + greeting + panel + easter eggs
   ========================================================= */

(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ─────────── settings (localStorage) ───────────
  const KEY = 'home-page.settings.v1';
  const defaults = {
    theme: 'obsidian',
    name: 'fiw',
    seconds: false,
    grain: true,
    bgAnim: true,
    compact: false,
    confetti: false,
    cursor: false,
    tilt: false,
    greetingStyle: 'formal',
    widgets: { spotify:true, discord:true, github:true, twitch:true, steam:true, mc:true, wishlist:true, docker:true, 'news-tech':true, 'news-games':true },
  };
  const load = () => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}'), widgets: { ...defaults.widgets, ...(JSON.parse(localStorage.getItem(KEY) || '{}').widgets || {}) } }; } catch { return { ...defaults }; } };
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const state = load();

  // ─────────── apply settings to DOM ───────────
  function apply() {
    const html = document.documentElement;
    html.setAttribute('data-theme', state.theme);
    html.setAttribute('data-seconds', state.seconds ? 'on' : 'off');
    html.setAttribute('data-grain', state.grain ? 'on' : 'off');
    html.setAttribute('data-bg-anim', state.bgAnim ? 'on' : 'off');
    html.setAttribute('data-compact', state.compact ? 'on' : 'off');
    html.setAttribute('data-tilt', state.tilt ? 'on' : 'off');

    // widget visibility
    for (const [k, v] of Object.entries(state.widgets)) {
      const el = document.querySelector(`[data-card="${k}"]`);
      if (el) el.hidden = !v;
    }

    // theme-card aria-current
    $$('.theme-card, .theme-switch__btn').forEach(b => {
      b.setAttribute('aria-current', b.dataset.themeSet === state.theme ? 'true' : 'false');
    });

    // greeting name
    $('#greeting-name').textContent = state.name || 'fiw';

    updateGreeting();
  }

  // ─────────── clock + greeting ───────────
  const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const DAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

  function updateClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const ss = String(d.getSeconds()).padStart(2,'0');
    $('#clock-time').firstChild.nodeValue = `${hh}:${mm}`;
    $('#clock-sec').textContent = ss;
    $('#clock-date').textContent = `${DAYS[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    $('#kicker-date').textContent = `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2,'0')} ${d.getFullYear()}`;
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
    formal:  (tod, name) => ({ pre: `good <em>${tod}</em>,`, name }),
    casual:  (tod, name) => ({ pre: `hey, <em>${tod === 'night' ? 'night owl' : tod}</em>`, name }),
    pirate:  (tod, name) => ({ pre: `ahoy, ye salty <em>${tod === 'morning' ? 'sea-dog' : 'pirate'}</em> —`, name }),
    haiku:   (tod, name) => ({ pre: `<em>${tod}</em> descends slow / a quiet keystroke begins —`, name }),
    l33t:    (tod, name) => ({ pre: `g00d <em>${tod}</em>,`, name: name.replace(/i/gi, '1').replace(/o/gi, '0').replace(/e/gi, '3') }),
  };

  function updateGreeting() {
    const tod = timeOfDay();
    const fn = STYLES[state.greetingStyle] || STYLES.formal;
    const { pre, name } = fn(tod, state.name || 'fiw');
    const preEl = $('.greeting__pre');
    const nameEl = $('.greeting__name');
    preEl.innerHTML = pre;
    nameEl.textContent = name;
    $('#time-of-day') && ($('#time-of-day').textContent = tod);
  }

  // ─────────── github heatmap (synthetic) ───────────
  function buildHeatmap() {
    const heat = $('.gh__heat');
    if (!heat) return;
    heat.innerHTML = '';
    const seed = [2,0,1,3,4,2,1, 0,1,2,4,3,2,0, 1,3,4,2,1,0,2, 0,2,3,4,2,1,3, 1,2,3,2,4,3,1, 0,0,1,2,3,4,2, 1,2,3,4,3,2,4];
    for (let i = 0; i < 49; i++) {
      const s = document.createElement('span');
      const lvl = seed[i] || 0;
      if (lvl) s.classList.add('l' + lvl);
      heat.appendChild(s);
    }
  }

  // ─────────── countup numbers ───────────
  function animateCountUps() {
    $$('[data-countup]').forEach(el => {
      const target = parseInt(el.dataset.countup, 10);
      if (Number.isNaN(target)) return;
      const dur = 900 + Math.random() * 400;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  // ─────────── wishlist data ───────────
  const wishlist = [
    { name: 'Hollow Knight: Silksong', c1:'#3a1f4a', c2:'#7a2d52', price:null,    old:null,    pct:null, badge:'unreleased', url:'https://store.steampowered.com/app/1030300', ends:null },
    { name: 'Outer Wilds',             c1:'#1a3a2a', c2:'#3a7a4d', price:'$8.99', old:'$24.99', pct:64, url:'https://store.steampowered.com/app/753640', ends:'2d 14h' },
    { name: 'Tunic',                   c1:'#3a2a1a', c2:'#7a5d2e', price:'$14.99', old:'$29.99', pct:50, url:'https://store.steampowered.com/app/553420', ends:'1d 06h' },
    { name: 'Subnautica 2',            c1:'#1a2a3a', c2:'#2d5d7a', price:'$29.99', old:null,     pct:null, badge:'full price', url:'https://store.steampowered.com/app/2754380', ends:null },
    { name: 'Inscryption',             c1:'#2a1a1a', c2:'#7a3d2e', price:'$9.99',  old:'$19.99', pct:50, url:'https://store.steampowered.com/app/1092790', ends:'4d 22h' },
    { name: 'Slay the Spire',          c1:'#3a2a4a', c2:'#7a4d8e', price:'$6.24',  old:'$24.99', pct:75, url:'https://store.steampowered.com/app/646570', ends:'18h 42m' },
    { name: 'Stellaris',               c1:'#0a1a3a', c2:'#3d6dba', price:'$9.99',  old:'$39.99', pct:75, url:'https://store.steampowered.com/app/281990', ends:'3d 02h' },
    { name: 'Pathologic 2',            c1:'#2a2018', c2:'#7a5238', price:'$10.04', old:'$29.99', pct:67, url:'https://store.steampowered.com/app/505230', ends:'5d 11h' },
    { name: 'Dwarf Fortress',          c1:'#3a2418', c2:'#a85d2e', price:'$23.99', old:'$29.99', pct:20, url:'https://store.steampowered.com/app/975370', ends:'9d 04h' },
    { name: 'Caves of Qud',            c1:'#1a3a3a', c2:'#3d8a8a', price:'$19.99', old:null,     pct:null, badge:'full price', url:'https://store.steampowered.com/app/333640', ends:null },
    { name: 'Rain World',              c1:'#1a1a2a', c2:'#3d3d6a', price:'$13.49', old:'$29.99', pct:55, url:'https://store.steampowered.com/app/312520', ends:'2d 19h' },
    { name: 'Disco Elysium: Final Cut',c1:'#3f1d63', c2:'#a855f7', price:'$15.99', old:'$39.99', pct:60, url:'https://store.steampowered.com/app/632470', ends:'6d 03h' },
    { name: 'Citizen Sleeper 2',       c1:'#2a1a3a', c2:'#7a3d8e', price:'$24.99', old:null,     pct:null, badge:'full price', url:'https://store.steampowered.com/app/2901680', ends:null },
    { name: 'Cult of the Lamb',        c1:'#3a1a2a', c2:'#a8385e', price:'$9.89',  old:'$24.99', pct:60, url:'https://store.steampowered.com/app/1313140', ends:'1d 14h' },
    { name: 'NORCO',                   c1:'#1a2a18', c2:'#4a8a3d', price:'$12.49', old:'$24.99', pct:50, url:'https://store.steampowered.com/app/1221250', ends:'7d 09h' },
  ];

  function renderWishlist() {
    const ul = $('#wishlist-list');
    if (!ul) return;
    ul.innerHTML = wishlist.map(w => `
      <li>
        <a class="wish" href="${w.url}" target="_blank" rel="noopener">
          <span class="wish__cover" style="--c1:${w.c1};--c2:${w.c2}"></span>
          <span class="wish__info">
            <span class="wish__name">${w.name}</span>
            <span class="wish__price-line">
              ${w.price ? `<span class="wish__price">${w.price}</span>` : `<span class="wish__price">—</span>`}
              ${w.old ? `<span class="wish__price-old">${w.old}</span>` : ''}
              ${w.pct ? `<span class="wish__badge wish__badge--deal">−${w.pct}%</span>` : ''}
              ${w.badge && !w.pct ? `<span class="wish__badge ${w.badge === 'unreleased' ? 'wish__badge--soon' : ''}">${w.badge}</span>` : ''}
            </span>
          </span>
          ${w.ends ? `<span class="wish__ends">ends in<br><b>${w.ends}</b></span>` : `<span class="wish__ends">—</span>`}
        </a>
      </li>
    `).join('');
  }

  // ─────────── docker data ───────────
  const containers = [
    { name: 'traefik',        img: 'traefik:v3.1',          status: 'up', up: '14d' },
    { name: 'homepage',       img: 'home-page:0.1',         status: 'up', up: '2h'  },
    { name: 'jellyfin',       img: 'linuxserver/jellyfin',  status: 'up', up: '3d'  },
    { name: 'postgres',       img: 'postgres:16',           status: 'up', up: '14d' },
    { name: 'minio',          img: 'minio/minio',           status: 'up', up: '14d' },
    { name: 'paperless-ngx',  img: 'paperless-ngx',         status: 'down', up: '—'  },
    { name: 'uptime-kuma',    img: 'louislam/uptime-kuma',  status: 'up', up: '14d' },
    { name: 'vaultwarden',    img: 'vaultwarden/server',    status: 'up', up: '14d' },
    { name: 'pihole',         img: 'pihole/pihole',         status: 'up', up: '14d' },
    { name: 'syncthing',      img: 'syncthing/syncthing',   status: 'up', up: '7d'  },
  ];
  function renderDocker() {
    const ul = $('#docker-list');
    if (!ul) return;
    ul.innerHTML = containers.map(c => `
      <li class="docker__item">
        <span class="docker__item-dot ${c.status === 'down' ? 'docker__item-dot--off' : ''}"></span>
        <span class="docker__item-name">${c.name}</span>
        <span class="docker__item-img">${c.img}</span>
        <span class="docker__item-up">${c.up}</span>
      </li>
    `).join('');
  }

  // ─────────── settings panel ───────────
  function bindPanel() {
    const panel = $('#panel');
    const open  = () => panel.setAttribute('aria-hidden', 'false');
    const close = () => panel.setAttribute('aria-hidden', 'true');
    $('#menu-btn').addEventListener('click', open);
    $$('[data-close]', panel).forEach(el => el.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    // theme buttons
    $$('[data-theme-set]').forEach(b => {
      b.addEventListener('click', () => {
        state.theme = b.dataset.themeSet;
        save(); apply();
      });
    });

    // toggles + selects + inputs
    $$('[data-setting]', panel).forEach(el => {
      const key = el.dataset.setting;
      // initial value
      if (el.type === 'checkbox') el.checked = !!state[key];
      else el.value = state[key] ?? '';

      el.addEventListener('change', () => {
        state[key] = el.type === 'checkbox' ? el.checked : el.value;
        save(); apply();
      });
      if (el.type === 'text') {
        el.addEventListener('input', () => {
          state[key] = el.value;
          save(); apply();
        });
      }
    });

    // widget toggles
    $$('[data-toggle]', panel).forEach(el => {
      const key = el.dataset.toggle;
      el.checked = state.widgets[key] !== false;
      el.addEventListener('change', () => {
        state.widgets[key] = el.checked;
        save(); apply();
      });
    });

    // reset
    $('#reset-btn').addEventListener('click', () => {
      if (!confirm('reset all settings?')) return;
      localStorage.removeItem(KEY);
      Object.assign(state, JSON.parse(JSON.stringify(defaults)));
      // refresh inputs
      $$('[data-setting]', panel).forEach(el => {
        const key = el.dataset.setting;
        if (el.type === 'checkbox') el.checked = !!state[key];
        else el.value = state[key] ?? '';
      });
      $$('[data-toggle]', panel).forEach(el => { el.checked = state.widgets[el.dataset.toggle] !== false; });
      apply();
    });
  }

  // ─────────── search keyboard ───────────
  function bindSearch() {
    const input = $('#search-input');
    document.addEventListener('keydown', e => {
      if (e.target === input) return;
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  // ─────────── confetti ───────────
  const COLORS = ['#d97706','#f59e0b','#84cc16','#ef4444','#a78bfa','#22d3ee','#fb7185','#fbbf24','#22c55e'];
  function confetti(n = 80) {
    const stage = $('#confetti');
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.style.setProperty('--c', COLORS[Math.floor(Math.random() * COLORS.length)]);
      s.style.setProperty('--r', `${Math.random() * 360}deg`);
      s.style.setProperty('--d', `${2 + Math.random() * 2.5}s`);
      s.style.left = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 0.4}s`;
      s.style.width = `${5 + Math.random() * 6}px`;
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
    let clicks = 0;
    let lastClick = 0;
    $('.greeting__name').addEventListener('click', () => {
      const now = Date.now();
      if (now - lastClick > 1500) clicks = 0;
      lastClick = now;
      clicks++;
      if (clicks >= 5 && state.confetti) {
        confetti(120);
        clicks = 0;
      }
    });

    // konami: ↑↑↓↓←→←→ba
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let pos = 0;
    document.addEventListener('keydown', e => {
      const k = e.key;
      if (k.toLowerCase() === seq[pos].toLowerCase()) {
        pos++;
        if (pos === seq.length) {
          pos = 0;
          if (state.confetti) confetti(200);
        }
      } else {
        pos = 0;
      }
    });

    // mousemove for sparkles
    document.addEventListener('mousemove', onMove);
  }

  // ─────────── colophon quotes ───────────
  const QUOTES = [
    'if found, please return to firefox.',
    'no sponsors. no algorithm. only signal.',
    'a homepage, in the proper sense.',
    'set in fraunces, served warm.',
    'the cursor blinks. the world waits.',
    'today is a good day to refactor.',
    'localhost, made personal.',
  ];
  function rotateQuote() {
    const el = $('#colophon-quote');
    if (el) el.textContent = '— ' + QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  // ─────────── last sync flicker ───────────
  function tickSync() {
    const el = $('#last-sync');
    if (!el) return;
    const opts = ['just now','12s ago','28s ago','46s ago','1m ago'];
    let i = 0;
    setInterval(() => { el.textContent = opts[i = (i + 1) % opts.length]; }, 7000);
  }

  // ─────────── init ───────────
  function init() {
    apply();
    updateClock();
    setInterval(updateClock, 1000);
    setInterval(updateGreeting, 60_000);
    buildHeatmap();
    renderWishlist();
    renderDocker();
    bindPanel();
    bindSearch();
    bindEasterEggs();
    rotateQuote();
    tickSync();
    // countup once cards begin animating in
    setTimeout(animateCountUps, 350);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
