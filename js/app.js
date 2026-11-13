/* Caiet de practică IX E – Tinkercad și imprimare 3D
   Aplicație statică (fără server). Datele clasei se păstrează în browser (localStorage)
   și se pot salva/încărca dintr-un fișier JSON din Setări. */
(function () {
  'use strict';
  const D = window.CAIET;
  const KEY = 'caiet-ix-e-tinkercad-v1';
  const TEAM_COLORS = ['#1f7a7a', '#c4621d', '#6b4fa3', '#2f8a3e', '#b23a62', '#3f6fb5', '#8a6d1f'];
  const LV = ['', 'S', 'B', 'E'];
  const LVN = ['', 'satisfăcător', 'bine', 'excelent'];

  /* ---------------- state ---------------- */
  const blank = () => ({
    v: 1, elevi: [], echipe: {}, prezenta: {}, progres: {}, faza: {}, semafor: {},
    eval: {}, mas: {}, comp: {}, std: {}, setari: { tema: 'light', fs: 19 }
  });
  let S;
  try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = blank(); }
  let saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Nu pot salva în browser: ' + e.message); } }, 150);
  }
  const ui = { lessonTab: {}, quiz: {}, stepFocus: {}, partSel: {}, evalWho: 'eu', masStud: null, drawn: new Set(), pickPool: 'elevi', resTab: 'standarde', flash: { i: 0, back: false }, mode: {} };

  /* ---------------- helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (s) => { if (s == null || s === '') return NaN; return parseFloat(String(s).replace(/\s/g, '').replace(',', '.').replace('−', '-')); };
  const fmt = (n, d = 2) => (isFinite(n) ? (Math.round(n * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',') : '—');
  const fmtS = (n, d = 2) => (isFinite(n) ? (n > 0 ? '+' : n < 0 ? '−' : '±') + fmt(Math.abs(n), d) : '—');
  const uid = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const todayISO = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const lesson = (n) => D.lectii.find(l => l.nr === +n);
  const weekOf = (n) => D.saptamani.find(w => w.id === lesson(n).sapt);
  const lessonsOfWeek = (id) => D.lectii.filter(l => l.sapt === id);
  const allParts = () => D.lectii.flatMap(l => l.fise.filter(f => f.cote.length).map(f => Object.assign({ lectie: l.nr }, f))).filter((f, i, a) => a.findIndex(x => x.nr === f.nr) === i);
  const students = () => S.elevi.slice().sort((a, b) => (a.echipa || 99) - (b.echipa || 99) || a.nume.localeCompare(b.nume, 'ro'));
  const studentById = (id) => S.elevi.find(e => e.id === id);
  const teamTag = (t) => t ? `<span class="team-tag" style="background:${TEAM_COLORS[(t - 1) % 7]}">${t}</span>` : `<span class="team-tag" style="background:var(--line);color:var(--ink-2)">–</span>`;
  function seeded(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
  function shuffleIdx(n, seed) { const r = seeded(seed), a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function hl(text) {
    // evidențiază cotele: Ø12, 68,4 × 43,7 × 2, X = 5,4
    let t = esc(text);
    t = t.replace(/(Ø\s?\d+(?:,\d+)?(?:\s?×\s?\d+(?:,\d+)?)*|\b\d+(?:,\d+)?(?:\s?×\s?\d+(?:,\d+)?)+|\b[XYZ]\s?=\s?−?\d+(?:,\d+)?(?:\s?(?:și|\/|…)\s?−?\d+(?:,\d+)?)*)/g, '<span class="num-hl">$1</span>');
    return t;
  }
  function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
  function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }

  /* ---------------- icons ---------------- */
  const I = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5a5 5 0 0 1 6 5.5"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    grade: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>',
    shelf: '<path d="M4 4h4v16H4zM10 4h4v16h-4zM16 5l3.5-1 2.5 15.5-3.5 1z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="16" cy="16" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="16" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="16" r="1.3" fill="currentColor"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    ruler: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    play: '<path d="M7 4l13 8-13 8z"/>',
    pause: '<path d="M7 4h4v16H7zM13 4h4v16h-4z"/>',
    reset: '<path d="M4 4v6h6M20 20v-6h-6"/><path d="M20 9a8 8 0 0 0-14-3L4 10M4 15a8 8 0 0 0 14 3l2-4"/>',
    traffic: '<rect x="7" y="2" width="10" height="20" rx="4"/><circle cx="12" cy="7" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="17" r="1.8"/>',
  };
  const ic = (n, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${I[n]}</svg>`;

  /* ---------------- shell ---------------- */
  function applySettings() {
    document.documentElement.dataset.theme = S.setari.tema || 'light';
    document.documentElement.style.setProperty('--fs', (S.setari.fs || 19) + 'px');
  }
  function navHTML(route) {
    const items = [['acasa', 'home', 'Acasă', '#/'], ['predare', 'book', 'Predare', '#/sapt/' + currentWeek().id], ['clasa', 'users', 'Clasa', '#/clasa'],
      ['evaluare', 'grade', 'Evaluare', '#/evaluare'], ['instrumente', 'tool', 'Instrumente', '#/instrumente'], ['resurse', 'shelf', 'Resurse', '#/resurse']];
    return `<div class="brand">FM-R2<b>IX E</b></div>` + items.map(([k, i, t, h]) => `<a class="nv ${route === k ? 'on' : ''}" href="${h}">${ic(i)}<span>${t}</span></a>`).join('') +
      `<div class="spacer"></div><a class="nv ${route === 'setari' ? 'on' : ''}" href="#/setari">${ic('gear')}<span>Setări</span></a>`;
  }
  function topbar(crumbs, extra = '') {
    return `<div class="topbar"><div class="crumbs">${crumbs}</div><div class="grow"></div>${timerChip()}${extra}
      <button class="btn sm ghost noprint" data-act="picker" title="Alege aleator">${ic('dice')}</button>
      <button class="btn sm ghost noprint" data-act="timer" title="Cronometru">${ic('timer')}</button>
      <button class="btn sm ghost noprint" data-act="fullscreen" title="Ecran complet">${ic('full')}</button></div>`;
  }
  function currentLesson() {
    const t = todayISO();
    return D.lectii.find(l => l.iso === t) || D.lectii.find(l => l.iso > t) || D.lectii[D.lectii.length - 1];
  }
  function currentWeek() { return weekOf(currentLesson().nr); }

  /* ---------------- router ---------------- */
  function route() {
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').map(decodeURIComponent);
    const [r, a, b] = parts;
    let html = '', nav = 'acasa';
    try {
      if (!r) html = viewHome();
      else if (r === 'sapt') { nav = 'predare'; html = viewWeek(a || 'S1'); }
      else if (r === 'lectie') { nav = 'predare'; html = viewLesson(+a, b); }
      else if (r === 'clasa') { nav = 'clasa'; html = viewClass(a || 'elevi'); }
      else if (r === 'evaluare') { nav = 'evaluare'; html = viewEval(a, b); }
      else if (r === 'elev') { nav = 'evaluare'; html = viewStudent(a); }
      else if (r === 'instrumente') { nav = 'instrumente'; html = viewTools(); }
      else if (r === 'resurse') { nav = 'resurse'; html = viewRes(a || ui.resTab); }
      else if (r === 'setari') { nav = 'setari'; html = viewSettings(); }
      else html = viewHome();
    } catch (e) { console.error(e); html = `<div class="card callout bad"><h3>Eroare</h3>${esc(e.message)}</div>`; }
    $('#nav').innerHTML = navHTML(nav);
    $('#view').innerHTML = html;
    afterRender();
  }
  function afterRender() {
    $$('[data-autofocus]').forEach(el => el.focus());
    drawE1();
  }
  window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });

  /* ================= HOME ================= */
  function lessonGradedCount(n) { const e = S.eval[n] || {}; return Object.values(e).filter(x => x.pr && x.pr.some(v => v)).length; }
  function viewHome() {
    const cur = currentLesson(), t = todayISO();
    const todays = D.lectii.filter(l => l.iso === t);
    const days = Math.round((new Date(cur.iso) - new Date(t)) / 864e5);
    const cw = currentWeek();
    const nStud = S.elevi.length;
    const evals = D.lectii.reduce((s, l) => s + lessonGradedCount(l.nr), 0);
    let todayCard;
    if (todays.length) {
      todayCard = `<div class="card"><div class="row between"><h2>Azi la practică</h2><span class="chip acc">${esc(todays[0].data)}</span></div>
        <div class="grid g2">${todays.map(l => `<a class="btn lg pri" href="#/lectie/${l.nr}" style="justify-content:flex-start;height:auto;padding:16px 22px;text-align:left"><span class="bignum" style="color:#fff;font-size:2.2rem">L${l.nr}</span><span>${esc(l.titlu)}<br><small style="opacity:.85">${l.ore} ore · ${esc(l.piese)}</small></span></a>`).join('')}</div></div>`;
    } else {
      todayCard = `<div class="card today"><div class="bignum">${days > 0 ? days : '✓'}</div><div><div class="muted small">${days > 0 ? 'zile până la următoarea lecție' : 'Practica s-a încheiat'}</div>
        <h2 style="margin:4px 0">L${cur.nr} · ${esc(cur.titlu)}</h2><div class="muted">${esc(cur.data)} · ${cur.ore} ore · săptămâna ${cur.sapt}</div></div>
        <a class="btn lg pri" href="#/lectie/${cur.nr}">Deschide ${ic('right')}</a></div>`;
    }
    return topbar('Acasă') + `
    <div class="card hero"><div><div class="kicker">${esc(D.clasa)} · ${esc(D.an)} · 5 săptămâni · 150 de ore</div>
      <h1 style="font-size:2.3rem;margin-top:6px">${esc(D.titlu)}</h1><p class="muted" style="font-size:1.1rem;margin-top:-4px">${esc(D.subtitlu)}</p>
      <p>${esc(D.despre)}</p>
      <div class="callout" style="margin-top:12px"><h3>Regula de aur</h3>${esc(D.regulaDeAur)}</div>
      <div class="row" style="margin-top:14px"><a class="btn" href="docs/Caiet_de_practica_IX_E_Tinkercad_imprimare_3D_FM-R2.pdf" target="_blank" rel="noopener">${ic('book')} Caietul de practică (PDF)</a><a class="btn ghost" href="#/resurse/calendar">Calendarul practicii</a></div></div>
      <img src="img/coperta.jpg" alt="Coperta caietului de practică" style="max-height:420px"></div>
    <div style="margin-top:14px">${todayCard}</div>
    <h2 style="margin-top:22px">Cele 5 săptămâni</h2>
    <div class="grid g5">${D.saptamani.map(w => {
      const ls = lessonsOfWeek(w.id), done = ls.filter(l => lessonGradedCount(l.nr) > 0).length;
      return `<a class="wk ${w.id === cw.id ? 'now' : ''}" href="#/sapt/${w.id}"><div class="row between"><span class="id">${w.id}</span><span class="chip plain">${w.ore} ore</span></div>
        <div style="font-weight:700;margin:8px 0 2px">${esc(w.perioada)}</div><div class="muted small" style="min-height:3.2em">L${ls[0].nr}–L${ls[ls.length - 1].nr} · ${ls.length} lecții</div>
        <div class="bar" title="lecții evaluate"><i style="width:${Math.round(done / ls.length * 100)}%"></i></div><div class="small muted" style="margin-top:4px">${done}/${ls.length} evaluate</div></a>`;
    }).join('')}</div>
    <div class="grid g3" style="margin-top:14px">
      <a class="card" href="#/clasa" style="text-decoration:none;color:inherit"><div class="muted small">Elevi în clasă</div><div class="bignum" style="color:var(--teal)">${nStud}</div><div class="small muted">${nStud ? 'în ' + new Set(S.elevi.map(e => e.echipa).filter(Boolean)).size + ' echipe' : 'Adaugă lista clasei →'}</div></a>
      <a class="card" href="#/evaluare" style="text-decoration:none;color:inherit"><div class="muted small">Evaluări de lecție completate</div><div class="bignum" style="color:var(--teal)">${evals}</div><div class="small muted">din ${D.lectii.length * Math.max(nStud, 1)} posibile</div></a>
      <a class="card" href="#/resurse/standarde" style="text-decoration:none;color:inherit"><div class="muted small">Standardele clasei (după șablonul E1)</div>
        <div style="margin-top:6px">${D.standarde.filter(s => s.optiuni.length).map(s => `<div class="row between small"><span>${esc(s.element.split('(')[0])}</span><b>${S.std[s.id] ? 'Ø' + esc(S.std[s.id]) : '<span class="muted">' + esc(s.nominal) + '</span>'}</b></div>`).join('')}</div></a>
    </div>`;
  }

  /* ================= WEEK ================= */
  function viewWeek(id) {
    const w = D.saptamani.find(x => x.id === id) || D.saptamani[0];
    const ls = lessonsOfWeek(w.id);
    return topbar(`<a href="#/">Acasă</a> › Predare › ${w.id}`) + `
    <div class="row" style="margin-bottom:12px">${D.saptamani.map(x => `<a class="btn ${x.id === w.id ? 'pri' : ''}" href="#/sapt/${x.id}">${x.id}</a>`).join('')}</div>
    <div class="card"><div class="row between"><div><div class="muted small">Săptămâna ${w.id.slice(1)} · ${esc(w.zile)}</div><h1 style="margin:4px 0 6px">${esc(w.perioada)}</h1></div><span class="chip acc" style="font-size:1rem">${w.ore} ore</span></div>
    <div class="callout teal"><h3>Ce facem săptămâna aceasta</h3><div style="font-size:1.15rem">${esc(w.ce)}</div></div></div>
    <div class="grid" style="margin-top:14px">${ls.map(l => {
      const pr = S.progres[l.nr] || {}, steps = (pr.p || []).length;
      return `<a class="card" href="#/lectie/${l.nr}" style="text-decoration:none;color:inherit;display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center">
        <div class="lnum"><div><span>LECȚIA</span><b>${l.nr}</b></div></div>
        <div><h2 style="margin-bottom:4px">${esc(l.titlu)}</h2><div class="muted">${esc(l.data)} · ${l.ore} ore · ${esc(l.teme)}</div><div style="margin-top:6px">${l.piese !== '—' ? l.piese.split(/,\s(?=\d\d|E1)/).map(p => `<span class="chip" style="margin:2px">${esc(p)}</span>`).join('') : '<span class="chip plain">fără piesă nouă</span>'}</div></div>
        <div class="noprint" style="text-align:right"><div class="small muted">pași parcurși</div><b>${steps}/${l.pasi.length}</b><div class="small muted" style="margin-top:6px">evaluați: ${lessonGradedCount(l.nr)}</div></div></a>`;
    }).join('')}</div>
    <div class="card" style="margin-top:14px"><h3>Prezența săptămânii</h3><div class="row">${w.zileLucru.map(d => `<a class="btn sm" href="#/clasa/prezenta/${d}">${d.split('-').reverse().join('.')}</a>`).join('')}</div></div>`;
  }

  /* ================= LESSON ================= */
  const TABS = [['start', 'Scopul'], ['comenzi', 'Comenzi noi'], ['pasi', 'Pașii de lucru'], ['piesa', 'Fișa piesei'], ['verificare', 'Verificare'], ['incheiere', 'Încheiere'], ['evaluare', 'Evaluare']];
  function viewLesson(n, tab) {
    const l = lesson(n); if (!l) return viewHome();
    tab = tab || ui.lessonTab[n] || 'start';
    if (tab === 'piesa' && !l.fise.length) tab = 'start';
    ui.lessonTab[n] = tab;
    const w = weekOf(n);
    const tabs = TABS.filter(([k]) => !(k === 'piesa' && !l.fise.length) && !(k === 'comenzi' && !l.comenzi.length));
    const fz = S.faza[n] == null ? -1 : S.faza[n];
    let body = '';
    if (tab === 'start') body = lsStart(l);
    else if (tab === 'comenzi') body = lsCmds(l);
    else if (tab === 'pasi') body = lsSteps(l);
    else if (tab === 'piesa') body = lsPart(l);
    else if (tab === 'verificare') body = lsQuiz(l);
    else if (tab === 'incheiere') body = lsEnd(l);
    else if (tab === 'evaluare') body = lsEvalLink(l);
    const ti = tabs.findIndex(t => t[0] === tab);
    const prevT = tabs[ti - 1], nextT = tabs[ti + 1];
    return topbar(`<a href="#/">Acasă</a> › <a href="#/sapt/${w.id}">${w.id}</a> › Lecția ${l.nr}`) + `
    <div class="lhead"><div class="lnum"><div><span>LECȚIA</span><b>${l.nr}</b></div></div>
      <div style="flex:1;min-width:280px"><h1>${esc(l.titlu)}</h1>
      <div class="row"><span class="chip acc">${esc(l.data)}</span><span class="chip plain">${l.ore} ore</span><span class="chip plain">${esc(l.teme)}</span>${l.piese !== '—' ? `<span class="chip">Piese: ${esc(l.piese.replace(/ – /g, '–'))}</span>` : ''}</div></div>
      <div class="row noprint">${n > 1 ? `<a class="btn sm" href="#/lectie/${n - 1}">${ic('left')} L${n - 1}</a>` : ''}${n < 25 ? `<a class="btn sm" href="#/lectie/${n + 1}">L${n + 1} ${ic('right')}</a>` : ''}</div></div>
    <div class="phases noprint" title="Ciclul de lucru la fiecare piesă">${D.faze.map((f, i) => `<button class="phase ${i === fz ? 'on' : i < fz ? 'done' : ''}" data-act="phase" data-n="${n}" data-i="${i}"><span class="n">${i + 1}</span><b>${f.nume}</b><small>${esc(f.intrebare)}</small></button>`).join('')}</div>
    <div class="tabs noprint">${tabs.map(([k, t], i) => `<a class="tab ${k === tab ? 'on' : ''}" href="${k === 'evaluare' ? '#/evaluare/lectie/' + n : '#/lectie/' + n + '/' + k}"><span class="ti">${i + 1}</span>${t}</a>`).join('')}</div>
    ${body}
    <div class="navfoot noprint">
      <button class="fab" data-act="semafor" data-n="${n}" title="Semaforul echipelor">${ic('traffic')}</button>
      ${prevT ? `<a class="fab" href="#/lectie/${n}/${prevT[0]}" title="${prevT[1]}">${ic('left')}</a>` : ''}
 ${nextT ? `<a class="fab acc" href="${nextT[0] === 'evaluare' ? '#/evaluare/lectie/' + n : '#/lectie/' + n + '/' + nextT[0]}" title="${nextT[1]}">${ic('right')}</a>` : (n < 25 ? `<a class="fab acc" href="#/lectie/${n + 1}" title="Lecția următoare">${ic('right')}</a>` : '')}
    </div>`;
  }
  function lsStart(l) {
    const ssm = l.casete.find(c => c.titlu === 'SSM');
    const other = l.casete.filter(c => c.titlu !== 'SSM');
    return `<div class="grid g2">
      <div class="card"><div class="callout teal" style="margin-bottom:14px"><h3>Unde vrem să ajungem</h3><div class="goal">${esc(l.scop)}</div></div>
        <h3>La final știu să</h3><ul class="clean ticks" style="font-size:1.1rem">${l.stiu.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
      <div><div class="card"><h3>Am nevoie de</h3><ul class="clean ticks">${l.nevoie.map(s => `<li>${esc(s)}</li>`).join('')}</ul></div>
        ${ssm ? `<div class="card callout bad" style="margin-top:14px"><h3>⚠ SSM</h3><div style="font-size:1.1rem">${ssm.text.map(esc).join(' ')}</div></div>` : ''}
        ${other.map(c => `<div class="card callout" style="margin-top:14px"><h3>${esc(c.titlu)}</h3>${c.text.length > 1 ? `<ul>${c.text.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : esc(c.text[0] || '')}</div>`).join('')}
      </div></div>
      ${l.nr === 2 ? rulerFigure() : ''}
      ${l.nr === 24 ? `<div class="card callout teal" style="margin-top:14px"><h3>Cablajul cu conectorii K (anexa G)</h3>La montaj, echipele sertizează terminalele, asamblează conectorii K și completează fișa de verificare a legăturilor W01–W10. <a class="btn teal sm" style="margin-left:10px" href="#/resurse/conectori">Deschide Conectori K</a></div>` : ''}`;
  }
  function rulerFigure() {
    return `<div class="card" style="margin-top:14px"><h3>Regula riglei</h3><div class="grid g2" style="align-items:center">
      <svg viewBox="0 0 420 220" style="width:100%;max-height:260px"><rect x="40" y="40" width="340" height="150" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
      <circle cx="130" cy="140" r="26" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/><line x1="130" y1="100" x2="130" y2="200" stroke="var(--ink-2)" stroke-dasharray="6 4"/>
      <line x1="40" y1="205" x2="130" y2="205" stroke="var(--teal)" stroke-width="3"/><text x="62" y="218" fill="var(--teal)" font-size="14" font-weight="700">axă = 5,4</text>
      <line x1="40" y1="30" x2="104" y2="30" stroke="var(--accent)" stroke-width="3"/><text x="44" y="22" fill="var(--accent)" font-size="14" font-weight="700">margine = 3,7</text>
      <text x="165" y="146" fill="var(--ink)" font-size="15" font-weight="700">Ø3,4</text><path d="M40 190 l0 -18 M40 190 l18 0" stroke="var(--ink)" stroke-width="4"/><text x="46" y="182" font-size="11" fill="var(--ink-2)">rigla (R)</text></svg>
      <div style="font-size:1.25rem"><p><b>Desenul tehnic</b> dă cota la <b style="color:var(--teal)">axa găurii</b>.</p><p><b>Tinkercad</b> măsoară de la riglă până la <b style="color:var(--accent)">marginea formei</b>.</p><p class="mono" style="font-size:1.4rem">margine = axă − Ø/2<br>3,7 = 5,4 − 3,4/2</p><button class="btn teal" data-act="tool" data-t="rigla">${ic('ruler')} Calculator riglă</button></div></div></div>`;
  }
  function lsCmds(l) {
    return `<div class="card"><h2>Comenzi noi${l.nr === 4 ? ' în feliator' : ' în Tinkercad'}</h2><div class="cmdgrid" style="font-size:1.15rem">${l.comenzi.map(([a, b]) => `<div>${esc(a)}</div><div>${kbdify(b)}</div>`).join('')}</div>
      <p class="small muted" style="margin-top:12px">Lista completă a tastelor: <a href="#/resurse/comenzi">Resurse › Comenzi Tinkercad</a></p></div>`;
  }
  function kbdify(t) {
    return esc(t).replace(/\b((?:Ctrl|Shift|Alt) \+ (?:Shift \+ )?(?:[A-Z]|săgeată(?: sus\/jos)?|săgeți|tragere))\b/g, '<span class="kbd">$1</span>').replace(/(^|[\s(→])([LRMWNFDH])(?=[\s,.:;)→]|$)/g, '$1<span class="kbd">$2</span>');
  }
  function lsSteps(l) {
    const pr = S.progres[l.nr] || { p: [] };
    const done = new Set(pr.p || []);
    const focus = ui.stepFocus[l.nr];
    const mode = ui.mode[l.nr] || 0;
    const modes = ['Profesorul demonstrează', 'Lucrăm împreună', 'Lucrați singuri / în echipă'];
    const head = `<div class="row between noprint" style="margin-bottom:12px"><div class="seg">${modes.map((m, i) => `<button class="${i === mode ? 'on' : ''}" data-act="mode" data-n="${l.nr}" data-i="${i}">${m}</button>`).join('')}</div>
      <div class="row"><span class="chip ${done.size === l.pasi.length ? 'ok' : 'plain'}" style="font-size:.95rem">${done.size}/${l.pasi.length} pași</span>
      <button class="btn sm" data-act="stepfocus" data-n="${l.nr}">${focus == null ? ic('eye') + ' Pas cu pas' : 'Toți pașii'}</button>
      <button class="btn sm ghost" data-act="stepreset" data-n="${l.nr}">${ic('reset')}</button></div></div>`;
    if (focus != null) {
      const i = Math.min(focus, l.pasi.length - 1);
      return head + `<div class="card focus-step"><div style="display:grid;grid-template-columns:auto 1fr;gap:26px;align-items:start;width:100%"><div class="lnum" style="width:110px;height:110px"><div><span>PASUL</span><b>${i + 1}</b></div></div><div>${hl(l.pasi[i])}</div></div></div>
        <div class="row between" style="margin-top:14px"><button class="btn lg" data-act="stepgo" data-n="${l.nr}" data-d="-1" ${i === 0 ? 'disabled' : ''}>${ic('left')} Înapoi</button>
        <div class="row">${l.pasi.map((_, k) => `<span style="width:16px;height:16px;border-radius:50%;display:inline-block;background:${k === i ? 'var(--accent)' : done.has(k) ? 'var(--ok)' : 'var(--line)'}"></span>`).join('')}</div>
        <button class="btn lg pri" data-act="stepgo" data-n="${l.nr}" data-d="1">${i === l.pasi.length - 1 ? 'Gata ✓' : 'Am terminat pasul ' + (i + 1)} ${ic('right')}</button></div>`;
    }
    return head + `<div class="steps">${l.pasi.map((p, i) => `<button class="step ${done.has(i) ? 'done' : ''}" data-act="step" data-n="${l.nr}" data-i="${i}"><span class="sn">${i + 1}</span><span>${hl(p)}</span><span class="ck">${ic('check', 'width="20" height="20"')}</span></button>`).join('')}</div>` + vizCard(l.nr);
  }
  const VIZ = {
    3: { n: 5, ck: ['După pasul 2, înainte să copiezi: marginea găurii la 4,2 de ambele laturi; lamajul Ø6 de la Z = 0,9, înalt 1,6.', 'După pasul 3: entraxe 74,2 × 108,2.', 'Înainte de Ctrl + D: prima fantă de la X = 15 la X = 71, axa la Y = 24 (o greșeală aici se repetă de 7 ori).', 'După pasul 5: ultima fantă la Y = 96; nicio fantă nu atinge găurile.'] },
    18: { n: 4, ck: ['Tubul NU este pe axa roții: centrul la X = −8,22; Y = 11,91.', 'Verifică PRIMA SPIȚĂ înainte să o multiplici: un singur arc gros de 1,6; capătul interior pe inelul R 56, cel exterior în bandă (R 76…80).', 'Repetarea polară: inelul-ajutor centrat pe axă, 25,714°; ultima spiță ajunge lângă prima, cu același spațiu.', 'Canalele benzii: 36, la 10°, adânci 1,5.'] } };
  function legCheck() {
    const L = [['W01', 'C-US', 'T1', 4], ['W02', 'C-GIROFAR', 'T2', 4], ['W03', 'C-LIDAR', 'T3', 4], ['W04', 'C-CAM', 'T4', 4], ['W05', 'C-STOP', 'B2', 4], ['W06', 'C-ENV', 'B3', 4], ['W07', 'B-WIFI', 'B4', 4], ['W08', 'alimentare 5 V', 'B1', 4], ['W09', 'drivere stânga', 'K6 T2', 6], ['W10', 'drivere dreapta', 'K6 T5', 6]];
    const V = S.leg || {};
    const cb = (w, k, lab) => `<button class="conf ${V[w] && V[w][k] ? 'da' : 'na'}" data-act="leg" data-w="${w}" data-k="${k}">${lab}</button>`;
    const done = L.filter(([w, , , n]) => { const r = V[w] || {}; return [...Array(n)].every((_, i) => r['p' + (i + 1)]) && r.cod && r.clic; }).length;
    return `<div class="card"><div class="row between"><h2 style="margin:0">Fișa de verificare a legăturilor (lecția 24)</h2><span class="chip ${done === L.length ? 'ok' : 'plain'}">${done} / ${L.length} legături verificate</span></div>
      <p class="muted">Continuitate pin cu pin (multimetrul), codul intră doar în priza lui, clicul ține; tensiunea la sursă, cu roverul alimentat: 5,0–5,2 V între pinii 2 și 1 (la W05: tensiunea acumulatorului).</p>
      <div class="tablewrap"><table class="t"><thead><tr><th>Leg.</th><th>Modulul</th><th>Cod</th><th>Continuitate</th><th>Cod</th><th>Clic</th><th>U (V)</th><th>Echipa</th></tr></thead><tbody>
      ${L.map(([w, m, c, n]) => `<tr><td><b>${w}</b></td><td>${m}</td><td>${c}</td><td><div class="row" style="gap:4px">${[...Array(n)].map((_, i) => cb(w, 'p' + (i + 1), i + 1)).join('')}</div></td><td>${cb(w, 'cod', '✓')}</td><td>${cb(w, 'clic', '✓')}</td>
        <td><input type="text" inputmode="decimal" style="width:80px;min-height:40px" value="${esc((V[w] || {}).u || '')}" data-act="legu" data-w="${w}"></td><td><input type="text" style="width:90px;min-height:40px" value="${esc((V[w] || {}).e || '')}" data-act="lege" data-w="${w}"></td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function vizCard(n) {
    const v = VIZ[n]; if (!v) return '';
    const p = n === 3 ? 'l3' : 'l18';
    return `<div class="card" style="margin-top:14px"><h2>Pas cu pas în imagini</h2><div class="grid ${v.n === 5 ? 'g3' : 'g2'}">${[...Array(v.n)].map((_, i) => `<img class="part-img" src="img/viz/${p}_${i + 1}.png" data-act="zoom" alt="etapa ${i + 1}">`).join('')}</div>
      <div class="callout teal" style="margin-top:12px"><h3>Puncte de control</h3><ol style="margin:0;font-size:1.1rem">${v.ck.map(c => `<li>${esc(c)}</li>`).join('')}</ol></div></div>`;
  }
  function lsPart(l) {
    const sel = ui.partSel[l.nr] || 0, f = l.fise[Math.min(sel, l.fise.length - 1)];
    const labels = ['Material', 'Orientare pe masă', 'Pereți / umplere', 'Suport', 'Timp / masă (dosar)'];
    const meta = D.piese.find(p => p.nr === f.nr);
    let main;
    if (f.sablon) main = e1Block();
    else main = `<div class="part-layout"><div>${f.img ? `<img class="part-img" src="${f.img}" alt="Vederile piesei ${esc(f.nr)}" data-act="zoom">` : ''}<div class="small muted" style="margin-top:6px">Vederi după metoda E · atinge imaginea pentru mărire</div></div>
      <div><div class="tablewrap"><table class="t"><thead><tr><th>Nr.</th><th>Cota</th><th>Nominal</th><th>Tol.</th></tr></thead><tbody>
        ${f.cote.map(c => `<tr><td>${esc(c.nr)}</td><td>${esc(c.cota)}</td><td style="font-weight:750;white-space:nowrap">${esc(c.nominal)}</td><td class="mono">${esc(c.tol)}</td></tr>`).join('')}</tbody></table></div>
        <div class="params">${(f.parametri || []).map((p, i) => `<div><small>${labels[i] || ''}</small><b>${esc(p)}</b></div>`).join('')}</div>
        <div class="row" style="margin-top:12px"><a class="btn teal" href="#/evaluare/masuratori/${f.nr}">${ic('ruler')} Controlul piesei (măsurători)</a></div></div></div>
      ${f.transformare ? transformBlock(f.transformare) : ''}`;
    return `<div class="card">${l.fise.length > 1 ? `<div class="seg" style="margin-bottom:14px">${l.fise.map((x, i) => `<button class="${i === sel ? 'on' : ''}" data-act="partsel" data-n="${l.nr}" data-i="${i}">${esc(x.nr)} · ${esc(x.nume)}</button>`).join('')}</div>` : ''}
      <div class="row between"><h2 style="margin:0">Fișa piesei ${esc(f.nr)} · ${esc(f.nume)}</h2><span class="chip acc">${esc(f.info)}</span></div>
      ${meta ? `<div class="small muted" style="margin:4px 0 12px">${meta.buc} buc. pe rover · ${esc(meta.material)} · total ${meta.masa} g · ${meta.ore} h de imprimare pentru toate bucățile</div>` : '<div style="height:10px"></div>'}
      ${main}</div>`;
  }
  function transformBlock(t) {
    return `<div class="card" style="margin-top:14px;box-shadow:none"><h3>Tabelul de transformare a coordonatelor</h3><p class="mono" style="font-size:1.2rem">${esc(t.formula)}</p>
      <div class="tablewrap"><table class="t"><thead><tr><th>Gaura</th><th class="num">x fișă</th><th class="num">y fișă</th><th class="num">X pe placă</th><th class="num">Y pe placă</th></tr></thead>
      <tbody>${t.randuri.map(r => `<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num"><button class="btn sm ghost" data-act="reveal">ascuns · atinge</button><span class="hidden"><b>${r[3]}</b></span></td><td class="num"><button class="btn sm ghost" data-act="reveal">ascuns · atinge</button><span class="hidden"><b>${r[4]}</b></span></td></tr>`).join('')}</tbody></table></div></div>`;
  }
  function e1Block() {
    return `<div class="grid g2" style="align-items:start"><div><svg id="e1svg" class="e1" viewBox="0 0 560 220"></svg>
      <p class="small muted">Șablon 110 × 36 × 6 · pas 13 · prima axă la X = 8 · rândul 1 la Y = 10 · rândul 2 la Y = 26 · textul adâncit 0,6.<br>Atinge gaura care s-a potrivit cel mai bine: valoarea intră în <b>Standardele clasei</b>.</p></div>
      <div>${stdTable(true)}</div></div>`;
  }
  function stdTable(compact) {
    return `<div class="tablewrap"><table class="t"><thead><tr><th>Element</th><th>Nominal</th><th>Valoarea clasei</th>${compact ? '' : '<th>Folosit la</th>'}</tr></thead><tbody>
      ${D.standarde.map(s => `<tr><td>${esc(s.element)}</td><td>${esc(s.nominal)}</td><td>${s.optiuni.length ? `<div class="seg">${s.optiuni.map(o => `<button class="${S.std[s.id] === o ? 'on' : ''}" data-act="std" data-id="${s.id}" data-v="${o}">${o}</button>`).join('')}</div>` : '<span class="muted">—</span>'}</td>${compact ? '' : `<td class="small">${esc(s.folosit)}</td>`}</tr>`).join('')}</tbody></table></div>`;
  }
  function drawE1() {
    const svg = $('#e1svg'); if (!svg) return;
    const k = 4.6, ox = 20, oy = 18; // mm → px
    const W = 110 * k, H = 36 * k;
    const row2 = [['m4i', '5,4'], ['m4i', '5,6'], ['m4i', '5,8'], ['dax', '5,0'], ['dax', '5,2'], ['dax', '5,4']];
    const row1 = [['m3t', '3,0'], ['m3t', '3,2'], ['m3t', '3,4'], ['m3t', '3,6'], ['m3i', '3,8'], ['m3i', '4,0'], ['m3i', '4,2']];
    let h = `<rect x="${ox}" y="${oy}" width="${W}" height="${H}" rx="${2 * k}" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/>`;
    const hole = (id, v, i, yy, isD) => {
      const cx = ox + (8 + 13 * i) * k, cy = oy + H - yy * k, r = num(v) / 2 * k;
      const sel = S.std[id] === v ? 'sel' : '';
      let shape = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="var(--paper)" stroke="${isD ? 'var(--bad)' : 'var(--ink)'}" stroke-width="2"/>`;
      if (isD) { const fx = cx + 2.1 * k, dy = Math.sqrt(Math.max(r * r - (2.1 * k) ** 2, 0)); shape = `<path d="M${fx} ${cy - dy} A${r} ${r} 0 1 0 ${fx} ${cy + dy} Z" fill="var(--paper)" stroke="var(--bad)" stroke-width="2"/>`; }
      const ty = yy > 18 ? cy - r - 8 : cy + r + 18;
      return `<g class="hole ${sel}" data-act="std" data-id="${id}" data-v="${v}"><rect x="${cx - 26}" y="${cy - 34}" width="52" height="68" fill="transparent"/>${shape}<text x="${cx}" y="${ty}" text-anchor="middle" font-size="15" font-weight="700" fill="${isD ? 'var(--bad)' : 'var(--ink)'}">${isD ? 'D ' : ''}${v}</text></g>`;
    };
    row2.forEach(([id, v], i) => { h += hole(id, v, i, 26, id === 'dax'); });
    row1.forEach(([id, v], i) => { h += hole(id, v, i, 10, false); });
    svg.innerHTML = h;
  }
  function lsQuiz(l) {
    const st = ui.quiz[l.nr] || (ui.quiz[l.nr] = { i: 0, sel: null, rev: false, score: 0, answered: {} });
    const q = l.quiz[st.i];
    const order = shuffleIdx(q.o.length, l.nr * 131 + st.i * 17 + 7);
    const letters = 'ABCD';
    return `<div class="card q-wrap"><div class="row between"><span class="chip acc">Întrebarea ${st.i + 1} din ${l.quiz.length}</span>
      <div class="row noprint"><button class="btn sm" data-act="picker">${ic('dice')} Cine răspunde?</button></div></div>
      <div class="q-text">${esc(q.q)}</div>
      <div class="q-opts">${order.map((oi, k) => {
        const cls = st.rev ? (oi === q.a ? 'right' : (st.sel === oi ? 'wrong' : '')) : (st.sel === oi ? 'sel' : '');
        return `<button class="q-opt ${cls}" data-act="qsel" data-n="${l.nr}" data-o="${oi}"><span class="l">${letters[k]}</span><span>${esc(q.o[oi])}</span></button>`;
      }).join('')}</div>
      ${st.rev ? `<div class="callout teal q-exp"><b>${st.sel === q.a ? 'Corect!' : st.sel == null ? 'Răspunsul corect:' : 'Nu chiar.'}</b> ${esc(q.e)}</div>` : ''}
      <div class="row between" style="margin-top:20px"><button class="btn lg" data-act="qgo" data-n="${l.nr}" data-d="-1" ${st.i === 0 ? 'disabled' : ''}>${ic('left')}</button>
      ${st.rev ? `<button class="btn lg pri" data-act="qgo" data-n="${l.nr}" data-d="1">${st.i === l.quiz.length - 1 ? 'Din nou de la început' : 'Următoarea'} ${ic('right')}</button>` : `<button class="btn lg teal" data-act="qrev" data-n="${l.nr}">${ic('eye')} Arată răspunsul</button>`}</div></div>`;
  }
  function lsEnd(l) {
    const pr = S.progres[l.nr] || { c: [] }, done = new Set(pr.c || []);
    return `<div class="grid g2"><div class="card"><h2>Lista de control</h2><div class="steps">${l.control.map((c, i) => `<button class="step ${done.has(i) ? 'done' : ''}" data-act="ctl" data-n="${l.nr}" data-i="${i}"><span class="sn">${i + 1}</span><span>${hl(c)}</span><span class="ck">${ic('check', 'width="20" height="20"')}</span></button>`).join('')}</div></div>
      <div><div class="card callout"><h3>Întrebare de reflecție · bilet de ieșire</h3><div class="goal">${esc(l.reflectie)}</div><p class="small muted" style="margin-bottom:0">Fiecare elev scrie răspunsul în caiet, la evaluarea lecției ${l.nr}.</p></div>
      <div class="card"><h3>Feedback în trei întrebări</h3>
        <div class="grid" style="gap:8px"><div class="callout teal"><b>Unde vreau să ajung?</b> ${esc(l.scop.split('.')[0])}.</div>
        <div class="callout teal"><b>Cum am lucrat?</b> Ce a ieșit bine și ce nu, pe criteriile C1–C5.</div>
        <div class="callout teal"><b>Ce fac mai departe?</b> Un singur lucru concret pe care îl schimb la lecția următoare.</div></div></div>
      <div class="card"><h3>Faza „Evaluare” din ciclul de lucru</h3><p style="margin:0">${esc(D.faze[5].text)} Dacă nivelul elevului și al profesorului diferă cu mai mult de o treaptă, discutați 2 minute.</p>
      <a class="btn pri" style="margin-top:12px" href="#/evaluare/lectie/${l.nr}">${ic('grade')} Evaluarea lecției ${l.nr}</a></div></div></div>`;
  }
  function lsEvalLink(l) { location.replace('#/evaluare/lectie/' + l.nr); return ''; }

  /* ================= CLASS ================= */
  function viewClass(tab, arg) {
    const parts = location.hash.split('/');
    arg = parts[3] ? decodeURIComponent(parts[3]) : null;
    const tabs = [['elevi', 'Elevi și echipe'], ['piese', 'Repartizarea pieselor'], ['prezenta', 'Prezența']];
    let body = '';
    if (tab === 'elevi') body = clStudents();
    else if (tab === 'piese') body = clParts();
    else body = clAttendance(arg);
    return topbar(`<a href="#/">Acasă</a> › Clasa`) + `<div class="tabs">${tabs.map(([k, t]) => `<a class="tab ${k === tab ? 'on' : ''}" href="#/clasa/${k}">${t}</a>`).join('')}</div>` + body;
  }
  function clStudents() {
    const st = students();
    return `<div class="grid g2" style="align-items:start"><div class="card"><div class="row between"><h2>Elevii clasei (${st.length})</h2></div>
      ${st.length ? `<div class="tablewrap"><table class="t"><thead><tr><th>Nume</th><th>Echipa</th><th></th></tr></thead><tbody>${st.map(e => `<tr>
        <td><input type="text" value="${esc(e.nume)}" data-act="rename" data-id="${e.id}" style="min-height:44px"></td>
        <td><div class="seg">${[1, 2, 3, 4, 5, 6, 7].map(t => `<button class="${e.echipa === t ? 'on' : ''}" data-act="setteam" data-id="${e.id}" data-t="${t}" style="min-height:40px;padding:0 11px">${t}</button>`).join('')}</div></td>
        <td><button class="btn sm ghost" data-act="delstud" data-id="${e.id}" title="Șterge">${ic('trash')}</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Încă nu ai adăugat elevi.</div>'}
      </div>
      <div><div class="card"><h3>Adaugă elevi</h3><label class="fld">Un nume pe rând (poți lipi lista din catalog)</label><textarea id="newstud" rows="6" placeholder="Popescu Andrei&#10;Ionescu Maria"></textarea>
        <div class="row" style="margin-top:10px"><button class="btn pri" data-act="addstud">${ic('plus')} Adaugă</button><button class="btn ghost" data-act="demostud">Elevi de probă</button></div></div>
      <div class="card"><h3>Echipe</h3><p class="small muted">7 echipe, ca în caiet. Poți împărți automat elevii, apoi muta pe cine vrei.</p>
        <button class="btn teal" data-act="autoteams">Împarte automat în 7 echipe</button>
        <div class="grid" style="margin-top:12px;gap:8px">${[1, 2, 3, 4, 5, 6, 7].map(t => `<div class="row" style="gap:8px">${teamTag(t)}<span class="small">${st.filter(e => e.echipa === t).map(e => esc(e.nume)).join(', ') || '<span class="muted">—</span>'}</span></div>`).join('')}</div></div></div></div>`;
  }
  function clParts() {
    const parts = D.piese;
    const owner = {}; Object.entries(S.echipe).forEach(([t, o]) => (o.piese || []).forEach(p => { owner[p] = +t; }));
    const plan = [['S1', '33, 32, 24, 11, 13', '6,0', '137', ''], ['S2', '16, 14, 15, 31, 20, 21, 17, 29, 30', '7,7', '177', ''], ['S3', '12, 10, 22, 23, 25, 26, 27, 28', '26,3', '596', ''], ['S4', '03, 02, 01', '98,2', '2246', '02 = 4 roți; L17 și L18 sunt două etape de modelare ale aceleiași roți'], ['S5', '04, 05, 06, 07, 08', '13,1', '301', '']];
    return `<div class="card"><h2>Planul de imprimare al clasei</h2><p class="muted">Planul este pentru un rover: fiecare piesă apare o singură dată, cu toate bucățile ei.</p>
      <div class="tablewrap"><table class="t"><thead><tr><th>Săpt.</th><th>Piese</th><th class="num">Ore</th><th class="num">Masă (g)</th><th>Observații</th></tr></thead><tbody>${plan.map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td class="num">${r[2]}</td><td class="num">${r[3]}</td><td class="small">${r[4]}</td></tr>`).join('')}<tr><td></td><td><b>Total pentru un rover (30 de piese, 60 de bucăți)</b></td><td class="num"><b>151,3</b></td><td class="num"><b>3457</b></td><td></td></tr></tbody></table></div>
      <div class="callout" style="margin-top:12px"><h3>Cele 40 de puncte pentru piese</h3>Modelul propriu (cotele din designul elevului, verificate în Tinkercad) × 20 · măsurarea cotelor repartizate elevului pe piesa echipei (corect dacă diferența ≤ 0,05 mm) × 10 · piesa imprimată a echipei × 10, același punctaj pentru toată echipa. Elevul al cărui model nu ajunge la imprimantă primește punctele pentru propriul design și pe cele de echipă.</div></div>
      <div class="card"><h2>Repartizarea pieselor pe echipe</h2><p class="muted">Fiecare elev modelează toate piesele. La imprimantă merge doar modelul validat al echipei care are piesa în grijă (de imprimat și de controlat).</p>
      <div class="tablewrap"><table class="t"><thead><tr><th>Nr.</th><th>Piesa</th><th class="num">Buc.</th><th class="num">Masă (g)</th><th class="num">Timp (h)</th><th>Lecția</th><th>Echipa responsabilă</th></tr></thead><tbody>
      ${parts.map(p => `<tr><td><b>${p.nr}</b></td><td>${esc(p.nume)}</td><td class="num">${p.buc}</td><td class="num">${p.masa}</td><td class="num">${p.ore}</td><td><a href="#/lectie/${p.lectia}/piesa">L${p.lectia}</a></td>
        <td><div class="seg">${[1, 2, 3, 4, 5, 6, 7].map(t => `<button class="${owner[p.nr] === t ? 'on' : ''}" data-act="ownpart" data-p="${p.nr}" data-t="${t}" style="min-height:38px;padding:0 10px">${t}</button>`).join('')}</div></td></tr>`).join('')}
      </tbody></table></div>
      <div class="callout" style="margin-top:14px"><h3>Atenție la roți</h3>Cele 4 roți au ≈ 87 de ore de imprimare, adică peste jumătate din total. Prima roată pornește în lecția 18. Celelalte trei se imprimă între S4 și S5, după un program afișat lângă imprimantă.</div></div>`;
  }
  function dayHours(d) { return D.lectii.filter(l => l.iso === d).reduce((s, l) => s + l.ore, 0); }
  function clAttendance(day) {
    const days = D.saptamani.flatMap(w => w.zileLucru);
    day = day && days.includes(day) ? day : (days.includes(todayISO()) ? todayISO() : (days.find(d => d >= todayISO()) || days[0]));
    const abs = S.prezenta[day] || {};
    const st = students();
    const ls = D.lectii.filter(l => l.iso === day);
    return `<div class="card"><div class="row" style="margin-bottom:12px">${D.saptamani.map(w => `<div class="row" style="gap:4px"><b class="small muted">${w.id}</b>${w.zileLucru.map(d => `<a class="btn sm ${d === day ? 'pri' : ''}" href="#/clasa/prezenta/${d}">${d.slice(8)}.${d.slice(5, 7)}</a>`).join('')}</div>`).join('')}</div>
      <h2>${day.split('-').reverse().join('.')} · ${dayHours(day)} ore <span class="muted" style="font-size:1rem;font-weight:500">${ls.map(l => 'L' + l.nr).join(' + ')}</span></h2>
      ${st.length ? `<p class="muted">Atinge numele elevilor absenți. Prezenți: <b>${st.filter(e => !abs[e.id]).length}</b> / ${st.length}</p>
      <div class="stud-chips">${st.map(e => `<button class="${abs[e.id] ? '' : 'on'}" data-act="absent" data-d="${day}" data-id="${e.id}" style="${abs[e.id] ? 'text-decoration:line-through;opacity:.6' : ''}">${teamTag(e.echipa)} ${esc(e.nume)}</button>`).join('')}</div>` : '<div class="empty">Adaugă mai întâi elevii (Clasa › Elevi și echipe).</div>'}</div>
      ${st.length ? `<div class="card"><h3>Ore de practică efectuate (din 132 în laborator)</h3><div class="tablewrap"><table class="t"><thead><tr><th>Elev</th>${D.saptamani.map(w => `<th class="num">${w.id}</th>`).join('')}<th class="num">Total</th><th class="num">Absențe (ore)</th></tr></thead><tbody>
        ${st.map(e => { let tot = 0, ab = 0; const cells = D.saptamani.map(w => { let h = 0; w.zileLucru.forEach(d => { const dh = dayHours(d); if ((S.prezenta[d] || {})[e.id]) ab += dh; else if (d <= todayISO()) h += dh; }); tot += h; return `<td class="num">${h}</td>`; }).join(''); return `<tr><td>${esc(e.nume)}</td>${cells}<td class="num"><b>${tot}</b></td><td class="num" style="color:${ab ? 'var(--bad)' : 'inherit'}">${ab}</td></tr>`; }).join('')}
        </tbody></table></div><p class="small muted">Orele se numără doar pentru zilele care au trecut. Celelalte 18 ore se recuperează prin proiectul individual și prin imprimările lungi.</p></div>` : ''}`;
  }

  /* ================= EVALUATION ================= */
  function evalRec(n, id) { S.eval[n] = S.eval[n] || {}; return S.eval[n][id] = S.eval[n][id] || { eu: [0, 0, 0, 0, 0], pr: [0, 0, 0, 0, 0], cum: '', next: '' }; }
  function peekRec(n, id) { return (S.eval[n] || {})[id]; }
  function lessonTotal(n, id) { const r = peekRec(n, id); if (!r || !r.pr.some(v => v)) return null; return r.pr.reduce((a, b) => a + b, 0); }
  function weekScore(wid, id) { const ts = lessonsOfWeek(wid).map(l => lessonTotal(l.nr, id)).filter(v => v != null); if (!ts.length) return null; return ts.reduce((a, b) => a + b, 0) / ts.length * 4 / 3; }
  function nomTargets(nominal) { return (nominal.match(/\d+(?:,\d+)?/g) || []).map(x => ({ t: x, v: num(x) })); }
  function tolOf(t) { if (!t) return { p: 0, m: 0 }; const pm = t.match(/±\s*([\d,]+)/); if (pm) { const v = num(pm[1]); return { p: v, m: v }; } const a = t.match(/\+\s*([\d,]+)\s*\/\s*[−-]?\s*([\d,]+)/); if (a) return { p: num(a[1]), m: num(a[2]) }; return { p: 0, m: 0 }; }
  function masRec(part, id, ci) { S.mas[part] = S.mas[part] || {}; S.mas[part][id] = S.mas[part][id] || {}; return S.mas[part][id][ci] = S.mas[part][id][ci] || { v: {}, m: null }; }
  function cotaStatus(part, id, ci, cota) {
    const r = ((S.mas[part] || {})[id] || {})[ci]; if (!r) return null;
    if (r.m) return r.m;
    const tg = nomTargets(cota.nominal), tol = tolOf(cota.tol);
    let any = false, bad = false;
    tg.forEach((t, k) => { const m = num(r.v[k]); if (isFinite(m)) { any = true; const dv = m - t.v; if (dv > tol.p + 1e-9 || dv < -tol.m - 1e-9) bad = true; } });
    return any ? (bad ? 'nu' : 'da') : null;
  }
  function conformity(id) {
    let da = 0, tot = 0;
    allParts().forEach(f => f.cote.forEach((c, ci) => { const s = cotaStatus(f.nr, id, ci, c); if (s) { tot++; if (s === 'da') da++; } }));
    return { da, tot, pct: tot ? da / tot : null };
  }
  // cele 40 de puncte pentru piese (caiet, pagina 9): modelul propriu 20 + măsurarea 10 + piesa echipei 10
  function flagPct(id, key) {
    let da = 0, tot = 0;
    allParts().forEach(f => f.cote.forEach((c, ci) => { const r = ((S.mas[f.nr] || {})[id] || {})[ci]; if (r && r[key]) { tot++; if (r[key] === 'da') da++; } }));
    return { da, tot, pct: tot ? da / tot : null };
  }
  function teamConformity(team) {
    const mem = S.elevi.filter(e => team && e.echipa === team).map(e => e.id);
    let da = 0, tot = 0;
    allParts().forEach(f => f.cote.forEach((c, ci) => { const st = mem.map(id => cotaStatus(f.nr, id, ci, c)).filter(Boolean); if (st.length) { tot++; if (!st.includes('nu')) da++; } }));
    return { da, tot, pct: tot ? da / tot : null };
  }
  function finalOf(id) {
    const ws = D.saptamani.map(w => weekScore(w.id, id)).filter(v => v != null);
    const weekly = ws.length ? ws.reduce((a, b) => a + b, 0) / ws.length : null;
    const e = studentById(id) || {}; const comp = S.comp[id] || {};
    const mdl = flagPct(id, 'md'), msr = flagPct(id, 'mc'), tm = e.echipa ? teamConformity(e.echipa) : conformity(id);
    const p20 = mdl.pct == null ? null : mdl.pct * 20, p10m = msr.pct == null ? null : msr.pct * 10, p10e = tm.pct == null ? null : tm.pct * 10;
    const piese = (p20 == null && p10m == null && p10e == null) ? null : (p20 || 0) + (p10m || 0) + (p10e || 0);
    const total = (piese || 0) + (weekly || 0) + (num(comp.proces) || 0) + (num(comp.proiect) || 0) + (num(comp.caiet) || 0) + 10;
    const has = weekly != null || piese != null || ['proces', 'proiect', 'caiet'].some(k => comp[k]);
    return { weekly, mdl, msr, tm, p20, p10m, p10e, piese, conf: tm, conf40: piese, comp, total: has ? total : NaN, nota: has ? total / 10 : NaN };
  }
  function viewEval(sub, arg) {
    const tabs = [['lectie', 'Evaluarea lecției'], ['masuratori', 'Controlul pieselor'], ['situatie', 'Situația și nota finală']];
    sub = sub || 'lectie';
    let body = '';
    if (!S.elevi.length) body = `<div class="card empty"><h2>Nu există elevi</h2><p>Adaugă lista clasei ca să poți evalua.</p><a class="btn pri" href="#/clasa">Mergi la Clasa</a></div>`;
    else if (sub === 'lectie') body = evLesson(+(arg || currentLesson().nr));
    else if (sub === 'masuratori') body = evMeas(arg || (allParts()[0] || {}).nr);
    else body = evSummary();
    return topbar(`<a href="#/">Acasă</a> › Evaluare`) + `<div class="tabs">${tabs.map(([k, t]) => `<a class="tab ${k === sub ? 'on' : ''}" href="#/evaluare/${k}">${t}</a>`).join('')}</div>` + body;
  }
  function evLesson(n) {
    const l = lesson(n) || D.lectii[0];
    const st = students();
    const rows = st.map(e => {
      const r = peekRec(l.nr, e.id) || { eu: [0, 0, 0, 0, 0], pr: [0, 0, 0, 0, 0] };
      const flag = r.eu.some((v, i) => v && r.pr[i] && Math.abs(v - r.pr[i]) > 1);
      const tot = lessonTotal(l.nr, e.id);
      return `<tr class="clickable ${flag ? 'flag' : ''}" data-act="opengrade" data-n="${l.nr}" data-id="${e.id}"><td>${teamTag(e.echipa)}</td><td><b>${esc(e.nume)}</b>${flag ? ' <span class="chip warn small">discuție 2 min</span>' : ''}</td>
        ${D.criterii.map((c, i) => `<td><span class="pair"><span class="lv l${r.eu[i]}" title="elev">${LV[r.eu[i]] || '·'}</span><span class="sep">/</span><span class="lv l${r.pr[i]}" title="profesor">${LV[r.pr[i]] || '·'}</span></span></td>`).join('')}
        <td class="num"><b style="font-size:1.15rem">${tot == null ? '—' : tot}</b><span class="muted small">/15</span></td></tr>`;
    }).join('');
    return `<div class="card"><div class="row between"><div class="row"><a class="btn sm" href="#/evaluare/lectie/${Math.max(1, l.nr - 1)}">${ic('left')}</a>
        <select data-act="evsel" style="width:auto;min-width:320px">${D.lectii.map(x => `<option value="${x.nr}" ${x.nr === l.nr ? 'selected' : ''}>L${x.nr} · ${esc(x.titlu)}</option>`).join('')}</select>
        <a class="btn sm" href="#/evaluare/lectie/${Math.min(25, l.nr + 1)}">${ic('right')}</a></div>
        <div class="row"><span class="chip acc">${esc(l.data)}</span><a class="btn sm" href="#/lectie/${l.nr}">${ic('book')} Lecția</a></div></div>
      <p class="muted" style="margin:12px 0">Atinge un elev ca să deschizi grila. <b>Elevul bifează întâi nivelul lui</b>, apoi profesorul. Coloanele arată <span class="lv l2">elev</span> / <span class="lv l3">profesor</span>; punctele lecției sunt nivelurile profesorului (max. 15).</p>
      <div class="tablewrap"><table class="t"><thead><tr><th></th><th>Elev</th>${D.criterii.map(c => `<th title="${esc(c.nume)}">${c.id}<br><span style="text-transform:none;font-weight:500">${esc(c.nume.split(',')[0])}</span></th>`).join('')}<th class="num">Total</th></tr></thead><tbody>${rows}</tbody></table></div></div>
      <div class="card"><h3>Lista de control a lecției ${l.nr}</h3><ul class="clean ticks">${l.control.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>`;
  }
  function gradeModal(n, id) {
    const l = lesson(n), e = studentById(id), r = evalRec(n, id);
    const who = ui.evalWho;
    const euDone = r.eu.every(v => v);
    const st = students(), idx = st.findIndex(x => x.id === id);
    const prev = st[idx - 1], next = st[idx + 1];
    const tot = r.pr.reduce((a, b) => a + b, 0);
    ui.gradeCur = { n, id };
    const html = `<button class="x" data-act="closemodal">×</button>
      <div class="row between" style="padding-right:60px"><div><div class="muted small">Evaluarea lecției ${l.nr} · ${esc(l.data)}</div><h2 style="margin:2px 0">${teamTag(e.echipa)} ${esc(e.nume)}</h2></div>
        <div class="row"><div class="who"><button class="eu ${who === 'eu' ? 'on' : ''}" data-act="who" data-w="eu">Bifează elevul</button><button class="pr ${who === 'pr' ? 'on' : ''}" data-act="who" data-w="pr">Bifează profesorul</button></div>
        <div style="text-align:center;min-width:90px"><div class="small muted">Puncte</div><div class="bignum" style="font-size:2.2rem">${tot}<span class="small muted">/15</span></div></div></div></div>
      ${who === 'pr' && !euDone ? `<div class="callout" style="margin:10px 0">Autoevaluarea elevului nu este completă. Lasă întâi elevul să-și bifeze nivelul la fiecare criteriu.</div>` : ''}
      <div class="rubric" style="margin-top:12px"><div class="rh">Criteriul</div><div class="rh">S · satisfăcător (1 p)</div><div class="rh">B · bine (2 p)</div><div class="rh">E · excelent (3 p)</div>
      ${D.criterii.map((c, i) => {
        const diff = r.eu[i] && r.pr[i] && Math.abs(r.eu[i] - r.pr[i]) > 1;
        return `<div class="cn">${c.id} · ${esc(c.nume)}${diff ? '<span class="chip warn small" style="margin-top:4px">diferență 2 trepte: discutați</span>' : ''}</div>` + [1, 2, 3].map(v => {
          const cls = (r.eu[i] === v ? ' eu' : '') + (r.pr[i] === v ? ' pr' : '');
          return `<button class="rcell${cls}" data-act="lvl" data-n="${n}" data-id="${id}" data-c="${i}" data-v="${v}">${esc(c[LV[v]])}<span class="marks">${r.eu[i] === v ? '<span class="mk eu">ELEV</span>' : ''}${r.pr[i] === v ? '<span class="mk pr">PROF.</span>' : ''}</span></button>`;
        }).join('');
      }).join('')}</div>
      <div class="grid g2" style="margin-top:16px"><div><label class="fld">Cum am lucrat? (feedback de la profesor)</label><textarea data-act="fb" data-n="${n}" data-id="${id}" data-f="cum" rows="3">${esc(r.cum)}</textarea></div>
        <div><label class="fld">Ce fac mai departe? (un singur lucru concret)</label><textarea data-act="fb" data-n="${n}" data-id="${id}" data-f="next" rows="3">${esc(r.next)}</textarea></div></div>
      <div class="row between" style="margin-top:16px"><button class="btn" data-act="opengrade" data-n="${n}" data-id="${prev ? prev.id : ''}" ${prev ? '' : 'disabled'}>${ic('left')} ${prev ? esc(prev.nume) : ''}</button>
        <button class="btn pri" data-act="${next ? 'opengrade' : 'closemodal'}" data-n="${n}" data-id="${next ? next.id : ''}">${next ? esc(next.nume) + ' ' + ic('right') : 'Gata'}</button></div>`;
    openModal(html);
  }
  function evMeas(partNr) {
    const parts = allParts();
    const f = parts.find(p => p.nr === partNr) || parts[0];
    const st = students();
    if (!ui.masStud || !studentById(ui.masStud)) ui.masStud = st[0].id;
    const sid = ui.masStud, e = studentById(sid);
    const stat = (id) => { let n = 0, d = 0; f.cote.forEach((c, ci) => { const s = cotaStatus(f.nr, id, ci, c); if (s) { n++; if (s === 'da') d++; } }); return { n, d }; };
    const rows = f.cote.map((c, ci) => {
      const r = ((S.mas[f.nr] || {})[sid] || {})[ci] || { v: {}, m: null };
      const tg = nomTargets(c.nominal), tol = tolOf(c.tol), s = cotaStatus(f.nr, sid, ci, c);
      return `<tr><td>${esc(c.nr)}</td><td>${esc(c.cota)}<div class="small muted">${esc(c.nominal)} · ${esc(c.tol)}</div></td>
        <td class="meas"><div class="row" style="gap:6px">${tg.map((t, k) => { const m = num(r.v[k]); const dv = m - t.v; const ok = isFinite(m) ? (dv <= tol.p + 1e-9 && dv >= -tol.m - 1e-9) : null;
          return `<div style="text-align:center"><div class="small muted">${t.t}</div><input type="text" inputmode="decimal" value="${esc(r.v[k] || '')}" data-act="mas" data-p="${f.nr}" data-id="${sid}" data-c="${ci}" data-k="${k}" placeholder="măsurat"><div class="small mono" style="color:${ok == null ? 'var(--ink-2)' : ok ? 'var(--ok)' : 'var(--bad)'}">${isFinite(m) ? fmtS(dv) : '&nbsp;'}</div></div>`; }).join('')}</div></td>
        <td><button class="conf ${s || 'na'}" data-act="masman" data-p="${f.nr}" data-id="${sid}" data-c="${ci}" title="Atinge pentru a decide manual">${s === 'da' ? 'DA' : s === 'nu' ? 'NU' : '—'}${r.m ? ' ✎' : ''}</button></td>
        <td><button class="conf ${r.md || 'na'}" data-act="masflag" data-k="md" data-p="${f.nr}" data-id="${sid}" data-c="${ci}" title="Cota din modelul Tinkercad al elevului, verificată cu rigla">${r.md === 'da' ? 'DA' : r.md === 'nu' ? 'NU' : '—'}</button></td>
        <td><button class="conf ${r.mc || 'na'}" data-act="masflag" data-k="mc" data-p="${f.nr}" data-id="${sid}" data-c="${ci}" title="Doar pentru cotele repartizate elevului: profesorul remăsoară; corect dacă diferența ≤ 0,05 mm">${r.mc === 'da' ? 'DA' : r.mc === 'nu' ? 'NU' : '—'}</button></td></tr>`;
    }).join('');
    const byWeek = D.saptamani.map(w => [w.id, parts.filter(p => lesson(p.lectie).sapt === w.id)]);
    return `<div class="card"><label class="fld">Piesa</label><div class="grid" style="gap:6px">${byWeek.map(([wid, ps]) => `<div class="row" style="gap:6px"><b class="small muted" style="width:28px">${wid}</b>${ps.map(p => `<a class="btn sm ${p.nr === f.nr ? 'pri' : ''}" href="#/evaluare/masuratori/${p.nr}">${p.nr}</a>`).join('')}</div>`).join('')}</div></div>
    <div class="card"><div class="row between"><h2 style="margin:0">${esc(f.nr)} · ${esc(f.nume)}</h2><a class="btn sm" href="#/lectie/${f.lectie}/piesa">Fișa piesei (L${f.lectie})</a></div>
      <p class="muted">Abaterea = cota măsurată − cota nominală. Piesa este conformă dacă abaterea este în toleranță (atinge DA/NU ca să decizi manual). Cele 40 de puncte pentru piese: <b>model propriu</b> (cota din designul elevului, verificată în Tinkercad) × 20 · <b>măsurare corectă</b> (cotele repartizate elevului, remăsurate prin sondaj, diferență ≤ 0,05 mm) × 10 · <b>piesa echipei</b> (conformitatea cotelor măsurate de membrii echipei) × 10.</p>
      <label class="fld">Elevul</label><div class="stud-chips" style="margin-bottom:14px">${st.map(x => { const s = stat(x.id); return `<button class="${x.id === sid ? 'on' : ''}" data-act="masstud" data-id="${x.id}">${esc(x.nume)}<span class="dot ${s.n === f.cote.length ? 'full' : s.n ? 'part' : ''}"></span></button>`; }).join('')}</div>
      <div class="row between"><h3 style="margin:0">${teamTag(e.echipa)} ${esc(e.nume)}</h3><div class="row"><span class="chip ${stat(sid).n ? 'ok' : 'plain'}">conforme ${stat(sid).d} / ${stat(sid).n} măsurate</span>
        ${e.echipa ? `<button class="btn sm" data-act="mascopy" data-p="${f.nr}" data-id="${sid}">Copiază la colegii din echipa ${e.echipa}</button>` : ''}</div></div>
      <div class="tablewrap" style="margin-top:10px"><table class="t"><thead><tr><th>Nr.</th><th>Cota</th><th>Măsurat → abatere</th><th>Piesa conformă</th><th>Model propriu corect</th><th>Măsurare corectă</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  function evSummary() {
    const st = students();
    return `<div class="card"><div class="row between"><h2 style="margin:0">Situația practicii</h2><div class="row noprint"><button class="btn sm" data-act="csv">${ic('download')} Export CSV (Excel)</button><button class="btn sm" data-act="print">${ic('print')} Tipărește</button></div></div>
      <p class="muted">Punctaj săptămânal = media punctajelor lecțiilor × 4/3 (max. 20). Piese (40) = model propriu × 20 + măsurare corectă × 10 + piesa echipei × 10 (regula din caiet, pagina 9). Completează punctele pentru fișa procesului, proiect și caiet (max. 10 fiecare). Nota = total / 10.</p>
      <div class="tablewrap"><table class="t"><thead><tr><th>Elev</th>${D.saptamani.map(w => `<th class="num">${w.id}</th>`).join('')}<th class="num">Media săpt.<br>(20)</th><th class="num">Model<br>(20)</th><th class="num">Măsurare<br>(10)</th><th class="num">Echipă<br>(10)</th><th class="num">Fișa proc.<br>(10)</th><th class="num">Proiect<br>(10)</th><th class="num">Caiet<br>(10)</th><th class="num">Oficiu</th><th class="num">Total</th><th class="num">Nota</th></tr></thead><tbody>
      ${st.map(e => { const F = finalOf(e.id); const inp = (k) => `<input type="text" inputmode="decimal" style="width:64px;min-height:40px;text-align:right" value="${esc(F.comp[k] || '')}" data-act="comp" data-id="${e.id}" data-k="${k}">`;
        return `<tr><td><a href="#/elev/${e.id}">${teamTag(e.echipa)} ${esc(e.nume)}</a></td>${D.saptamani.map(w => { const v = weekScore(w.id, e.id); return `<td class="num">${v == null ? '<span class="muted">—</span>' : fmt(v, 1)}</td>`; }).join('')}
        <td class="num"><b>${F.weekly == null ? '—' : fmt(F.weekly, 1)}</b></td><td class="num"><b>${F.p20 == null ? '—' : fmt(F.p20, 1)}</b><div class="small muted">${F.mdl.da}/${F.mdl.tot}</div></td><td class="num"><b>${F.p10m == null ? '—' : fmt(F.p10m, 1)}</b><div class="small muted">${F.msr.da}/${F.msr.tot}</div></td><td class="num"><b>${F.p10e == null ? '—' : fmt(F.p10e, 1)}</b><div class="small muted">${F.tm.da}/${F.tm.tot}</div></td>
        <td class="num">${inp('proces')}</td><td class="num">${inp('proiect')}</td><td class="num">${inp('caiet')}</td><td class="num">10</td>
        <td class="num"><b>${fmt(F.total, 1)}</b></td><td class="num"><b style="font-size:1.25rem;color:var(--accent)">${fmt(F.nota, 2)}</b></td></tr>`; }).join('')}
      </tbody></table></div></div>
      <div class="card"><h3>Cum se calculează nota finală</h3><div class="tablewrap"><table class="t"><tbody>${D.nota.map(r => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td class="num"><b>${r[2]}</b></td></tr>`).join('')}<tr><td><b>Total</b></td><td>nota = total / 10</td><td class="num"><b>100</b></td></tr></tbody></table></div></div>`;
  }
  function viewStudent(id) {
    const e = studentById(id); if (!e) return viewEval('situatie');
    const F = finalOf(id);
    const bars = D.lectii.map(l => { const r = peekRec(l.nr, id); const t = lessonTotal(l.nr, id); const eu = r && r.eu.some(v => v) ? r.eu.reduce((a, b) => a + b, 0) : null;
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:22px"><div style="height:140px;width:100%;display:flex;align-items:flex-end;gap:2px;justify-content:center">
        <div title="elev" style="width:40%;height:${eu ? eu / 15 * 100 : 0}%;background:var(--teal);border-radius:4px 4px 0 0;opacity:.7"></div><div title="profesor" style="width:40%;height:${t ? t / 15 * 100 : 0}%;background:var(--accent);border-radius:4px 4px 0 0"></div></div><span class="small muted">${l.nr}</span></div>`; }).join('');
    const fbs = D.lectii.map(l => ({ l, r: peekRec(l.nr, id) })).filter(x => x.r && (x.r.cum || x.r.next));
    return topbar(`<a href="#/">Acasă</a> › <a href="#/evaluare/situatie">Evaluare</a> › ${esc(e.nume)}`, `<button class="btn sm noprint" data-act="print">${ic('print')}</button>`) + `
      <div class="card"><div class="row between"><h1 style="margin:0">${teamTag(e.echipa)} ${esc(e.nume)}</h1><div style="text-align:right"><div class="small muted">Nota (până acum)</div><div class="bignum">${fmt(F.nota, 2)}</div></div></div>
      <div class="grid g5" style="margin-top:14px">${D.saptamani.map(w => { const v = weekScore(w.id, id); return `<div class="card" style="box-shadow:none;padding:12px"><div class="small muted">${w.id} (max. 20)</div><b style="font-size:1.6rem">${v == null ? '—' : fmt(v, 1)}</b></div>`; }).join('')}</div>
      <div class="grid g3" style="margin-top:14px"><div class="card" style="box-shadow:none"><div class="small muted">Piese (40): model · măsurare · echipă</div><b style="font-size:1.6rem">${F.piese == null ? '—' : fmt(F.piese, 1)}</b> <span class="muted small">${F.p20 == null ? '—' : fmt(F.p20, 1)} · ${F.p10m == null ? '—' : fmt(F.p10m, 1)} · ${F.p10e == null ? '—' : fmt(F.p10e, 1)}</span></div>
        <div class="card" style="box-shadow:none"><div class="small muted">Media săptămânală</div><b style="font-size:1.6rem">${F.weekly == null ? '—' : fmt(F.weekly, 1)}</b> / 20</div>
        <div class="card" style="box-shadow:none"><div class="small muted">Fișa procesului · proiect · caiet</div><b style="font-size:1.6rem">${esc(F.comp.proces || '—')} · ${esc(F.comp.proiect || '—')} · ${esc(F.comp.caiet || '—')}</b></div></div></div>
      <div class="card"><div class="row between"><h3>Punctajul lecțiilor (max. 15)</h3><span class="small"><span style="color:var(--teal)">■</span> autoevaluare &nbsp; <span style="color:var(--accent)">■</span> profesor</span></div><div style="display:flex;gap:4px;align-items:flex-end">${bars}</div></div>
      <div class="card"><h3>Feedback primit</h3>${fbs.length ? `<div class="tablewrap"><table class="t"><thead><tr><th>Lecția</th><th>Cum am lucrat?</th><th>Ce fac mai departe?</th></tr></thead><tbody>${fbs.map(x => `<tr><td>L${x.l.nr}</td><td>${esc(x.r.cum)}</td><td>${esc(x.r.next)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Încă nu există feedback scris.</p>'}</div>`;
  }

  /* ================= TOOLS ================= */
  function viewTools() {
    return topbar(`<a href="#/">Acasă</a> › Instrumente`) + `<div class="grid g2">
      <div class="card"><h2>${ic('timer', 'width="26" height="26" style="vertical-align:-5px"')} Cronometru</h2><p class="muted">Pentru etapele lecției și pauza 45 / 5 pentru ochi.</p><button class="btn pri lg" data-act="timer">Deschide cronometrul</button></div>
      <div class="card"><h2>${ic('dice', 'width="26" height="26" style="vertical-align:-5px"')} Alegere aleatorie</h2><p class="muted">Elev sau echipă, fără repetare până trec toți (ține cont de absențele de azi).</p><button class="btn pri lg" data-act="picker">Alege</button></div>
      <div class="card"><h2>Regula riglei</h2><p class="muted">Desenul dă axa găurii; Tinkercad măsoară până la marginea formei.</p>
        <div class="grid g2"><div><label class="fld">Cota la axă (din desen)</label><input type="text" inputmode="decimal" id="r_ax" value="5,4" data-act="calc"></div><div><label class="fld">Diametrul găurii Ø</label><input type="text" inputmode="decimal" id="r_d" value="3,4" data-act="calc"></div></div>
        <div class="callout teal" style="margin-top:12px;font-size:1.3rem" id="r_out"></div></div>
      <div class="card"><h2>Abatere și conformitate</h2><div class="grid g2"><div><label class="fld">Cota nominală</label><input type="text" inputmode="decimal" id="a_n" value="70" data-act="calc"></div><div><label class="fld">Toleranța ± (sau +a/−b)</label><input type="text" id="a_t" value="±0,2" data-act="calc"></div></div>
        <div style="margin-top:8px"><label class="fld">Cota măsurată</label><input type="text" inputmode="decimal" id="a_m" value="69,85" data-act="calc"></div><div class="callout teal" style="margin-top:12px;font-size:1.3rem" id="a_out"></div></div>
      <div class="card"><h2>Repetare la pas constant (Ctrl + D)</h2><div class="grid g3"><div><label class="fld">Prima axă</label><input type="text" inputmode="decimal" id="p_a" value="24" data-act="calc"></div><div><label class="fld">Pas</label><input type="text" inputmode="decimal" id="p_p" value="12" data-act="calc"></div><div><label class="fld">Număr de elemente</label><input type="text" inputmode="numeric" id="p_n" value="7" data-act="calc"></div></div>
        <div style="margin-top:8px"><label class="fld">Lățimea elementului (pentru marginea de tastat în Tinkercad, opțional)</label><input type="text" inputmode="decimal" id="p_w" value="3" data-act="calc"></div><div class="callout teal" style="margin-top:12px" id="p_out"></div></div>
      <div class="card"><h2>Repetare polară</h2><div class="grid g3"><div><label class="fld">Număr de elemente n</label><input type="text" inputmode="numeric" id="o_n" value="14" data-act="calc"></div><div><label class="fld">Raza cercului</label><input type="text" inputmode="decimal" id="o_r" value="11" data-act="calc"></div><div><label class="fld">Unghi de start (°)</label><input type="text" inputmode="decimal" id="o_s" value="45" data-act="calc"></div></div>
        <div class="callout teal" style="margin-top:12px" id="o_out"></div></div>
      <div class="card"><h2>Jocuri de montaj</h2><label class="fld">Situația</label><select id="j_s" data-act="calc">${D.anexe.ajustaje.map((a, i) => `<option value="${i}">${esc(a[0])}</option>`).join('')}</select>
        <div style="margin-top:8px"><label class="fld">Dimensiunea piesei cumpărate / a șurubului (mm)</label><input type="text" inputmode="decimal" id="j_d" value="16" data-act="calc"></div><div class="callout teal" style="margin-top:12px" id="j_out"></div></div>
      <div class="card"><h2>Lanț de cote</h2><p class="muted">Ex. lecția 19: axa roții față de sol − fața de sus a plăcii.</p><div class="grid g3"><div><label class="fld">Axa roții de la sol</label><input type="text" inputmode="decimal" id="c_a" value="80" data-act="calc"></div><div><label class="fld">Placa de la sol</label><input type="text" inputmode="decimal" id="c_b" value="54,5" data-act="calc"></div><div><label class="fld">Grosimea plăcii</label><input type="text" inputmode="decimal" id="c_c" value="3" data-act="calc"></div></div>
        <div class="callout teal" style="margin-top:12px" id="c_out"></div></div>
    </div>`;
  }
  function calcTools() {
    const v = (id) => num(($('#' + id) || {}).value);
    if (!$('#r_out')) return;
    const ax = v('r_ax'), d = v('r_d');
    $('#r_out').innerHTML = isFinite(ax) && isFinite(d) ? `margine = ${fmt(ax, 2)} − ${fmt(d, 2)}/2 = <b>${fmt(ax - d / 2, 2)}</b> mm<br><span class="small">invers: axa = margine + Ø/2</span>` : 'Completează valorile.';
    const n = v('a_n'), m = v('a_m'), tol = tolOf(($('#a_t').value || '').includes('±') || ($('#a_t').value || '').includes('+') ? $('#a_t').value : '±' + $('#a_t').value);
    if (isFinite(n) && isFinite(m)) { const dv = m - n, ok = dv <= tol.p + 1e-9 && dv >= -tol.m - 1e-9; $('#a_out').innerHTML = `abaterea = ${fmt(m, 2)} − ${fmt(n, 2)} = <b>${fmtS(dv)}</b> mm<br>toleranță: +${fmt(tol.p)} / −${fmt(tol.m)} → <span class="conf ${ok ? 'da' : 'nu'}">${ok ? 'CONFORM' : 'NECONFORM'}</span>`; } else $('#a_out').textContent = 'Completează valorile.';
    const a = v('p_a'), p = v('p_p'), k = Math.round(v('p_n')), w = v('p_w');
    if (isFinite(a) && isFinite(p) && k > 0 && k < 200) { const xs = [...Array(k)].map((_, i) => a + i * p); $('#p_out').innerHTML = `<b>Axe:</b> ${xs.map(x => fmt(x, 2)).join(' · ')}<br>${isFinite(w) && w > 0 ? `<b>Margini (Tinkercad):</b> ${xs.map(x => fmt(x - w / 2, 2)).join(' · ')}<br>` : ''}<b>Prima–ultima:</b> ${k - 1} × ${fmt(p, 2)} = ${fmt((k - 1) * p, 2)} mm · Ctrl + D de ${k - 1} ori`; } else $('#p_out').textContent = 'Completează valorile.';
    const on = Math.round(v('o_n')), r = v('o_r'), s0 = v('o_s') || 0;
    if (on > 0 && on < 400 && isFinite(r)) { const step = 360 / on; const pts = [...Array(Math.min(on, 12))].map((_, i) => { const t = (s0 + i * step) * Math.PI / 180; return `(${fmt(r * Math.cos(t), 2)}; ${fmt(r * Math.sin(t), 2)})`; }); $('#o_out').innerHTML = `<b>Unghiul de rotire:</b> 360° / ${on} = <b>${fmt(step, 3)}°</b> · Ctrl + D de încă ${on - 2} ori după prima rotire<br><b>Coordonate față de centru:</b> ${pts.join(' · ')}${on > 12 ? ' …' : ''}`; } else $('#o_out').textContent = 'Completează valorile.';
    const js = D.anexe.ajustaje[+$('#j_s').value], jd = v('j_d');
    const rec = { 0: [0.4, 0.6, 'pe diametru (0,2–0,3 pe parte)'], 1: [0.2, 0.2, 'pe diametru (0,1 pe parte)'], 2: [0.3, 0.6, 'la diametru'], 3: [0.4, 0.4, 'la diametru'], 4: [0.4, 0.4, 'pe lățime (0,2 pe parte)'] }[+$('#j_s').value];
    $('#j_out').innerHTML = `Joc recomandat: <b>${esc(js[1])}</b> · exemplu: ${esc(js[2])}${isFinite(jd) ? `<br>Modelezi: <b>${fmt(jd + rec[0], 2)}${rec[1] !== rec[0] ? ' … ' + fmt(jd + rec[1], 2) : ''}</b> mm ${rec[2]}` : ''}`;
    const ca = v('c_a'), cb = v('c_b'), cc = v('c_c');
    $('#c_out').innerHTML = [ca, cb, cc].every(isFinite) ? `${fmt(ca, 2)} − (${fmt(cb, 2)} + ${fmt(cc, 2)}) = <b>${fmt(ca - cb - cc, 2)}</b> mm față de fața de sus a plăcii` : 'Completează valorile.';
  }

  /* ---------- timer ---------- */
  const T = { end: 0, left: 0, run: false, total: 0, int: null, alarm: false, label: '' };
  function tick() {
    if (T.run) { T.left = Math.max(0, T.end - Date.now()); if (T.left === 0) { T.run = false; T.alarm = true; beep(); } }
    const m = Math.floor(T.left / 60000), s = Math.floor(T.left % 60000 / 1000), txt = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const face = $('#tface'); if (face) { face.textContent = txt; face.classList.toggle('alarm', T.alarm); }
    $$('.mini-timer').forEach(el => { el.querySelector('span').textContent = txt; el.classList.toggle('alarm', T.alarm); el.classList.toggle('hidden', !T.run && !T.alarm && !T.left); });
    const pb = $('#tplay'); if (pb) pb.innerHTML = T.run ? ic('pause') + ' Pauză' : ic('play') + ' Pornește';
  }
  function timerChip() { return `<button class="mini-timer noprint ${T.run || T.alarm || T.left ? '' : 'hidden'}" data-act="timer">${ic('timer', 'width="18" height="18"')}<span>00:00</span></button>`; }
  function beep() { try { const ac = new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7].forEach(t => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(.25, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + t + .3); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + .32); }); } catch (e) { } }
  function setTimer(min, label) { T.total = min * 60000; T.left = T.total; T.end = Date.now() + T.left; T.run = true; T.alarm = false; T.label = label || ''; tick(); if ($('#tlabel')) $('#tlabel').textContent = T.label; }
  function timerModal() {
    const pres = [[3, 'Încălzire'], [5, 'Pauză ochi'], [10, ''], [15, ''], [20, ''], [30, ''], [45, 'Lucru 45 min']];
    openModal(`<button class="x" data-act="closemodal">×</button><h2>Cronometru</h2><div id="tlabel" class="muted" style="text-align:center;min-height:1.4em;font-size:1.2rem">${esc(T.label)}</div><div class="timer-face" id="tface">00:00</div>
      <div class="row" style="justify-content:center;margin:18px 0">${pres.map(([m, l]) => `<button class="btn lg" data-act="tset" data-m="${m}" data-l="${esc(l)}">${m} min</button>`).join('')}</div>
      <div class="row" style="justify-content:center"><button class="btn lg" data-act="tadd" data-m="-1">−1</button><button class="btn lg pri" id="tplay" data-act="tplay"></button><button class="btn lg" data-act="tadd" data-m="1">+1</button><button class="btn lg ghost" data-act="treset">${ic('reset')} Zero</button></div>
      <p class="small muted" style="text-align:center;margin-top:14px">Regula 45 / 5: după 45 de minute la ecran, 5 minute de pauză pentru ochi.</p>`, 'narrow');
    tick();
  }
  setInterval(tick, 250);

  /* ---------- picker ---------- */
  function pickerModal(result) {
    const pool = ui.pickPool;
    const abs = S.prezenta[todayISO()] || {};
    const items = pool === 'elevi' ? students().filter(e => !abs[e.id]).map(e => ({ id: e.id, t: e.nume, team: e.echipa })) : [1, 2, 3, 4, 5, 6, 7].map(t => ({ id: 'T' + t, t: 'Echipa ' + t, team: t }));
    const left = items.filter(x => !ui.drawn.has(x.id));
    openModal(`<button class="x" data-act="closemodal">×</button><h2>Alegere aleatorie</h2>
      <div class="seg" style="margin-bottom:10px"><button class="${pool === 'elevi' ? 'on' : ''}" data-act="pool" data-p="elevi">Elev</button><button class="${pool === 'echipe' ? 'on' : ''}" data-act="pool" data-p="echipe">Echipă</button></div>
      ${items.length ? `<div class="pick-name" id="pickname">${result ? (result.team ? teamTag(result.team) + ' ' : '') + esc(result.t) : '?'}</div>
      <div class="row" style="justify-content:center;margin-top:16px"><button class="btn lg pri" data-act="pick">${ic('dice')} Alege</button><button class="btn lg ghost" data-act="pickreset">Reia lista</button></div>
      <p class="small muted" style="text-align:center">Au mai rămas ${left.length} din ${items.length}.</p>` : '<div class="empty">Adaugă elevii în Clasa.</div>'}`, 'narrow');
  }
  function doPick() {
    const abs = S.prezenta[todayISO()] || {};
    const items = ui.pickPool === 'elevi' ? students().filter(e => !abs[e.id]).map(e => ({ id: e.id, t: e.nume, team: e.echipa })) : [1, 2, 3, 4, 5, 6, 7].map(t => ({ id: 'T' + t, t: 'Echipa ' + t, team: t }));
    let left = items.filter(x => !ui.drawn.has(x.id)); if (!left.length) { ui.drawn.clear(); left = items; }
    let k = 0; const el = $('#pickname');
    const spin = setInterval(() => { const x = left[Math.floor(Math.random() * left.length)]; if (el) el.innerHTML = esc(x.t); if (++k > 14) { clearInterval(spin); const w = left[Math.floor(Math.random() * left.length)]; ui.drawn.add(w.id); pickerModal(w); } }, 70);
  }

  /* ---------- semafor ---------- */
  function semaforModal(n) {
    const sm = S.semafor[n] || {};
    openModal(`<button class="x" data-act="closemodal">×</button><h2>Semaforul echipelor · L${n}</h2>
      <p class="muted">Fiecare echipă arată unde se află: <b style="color:var(--ok)">verde</b> = am terminat, <b style="color:var(--warn)">galben</b> = lucrăm, ne descurcăm, <b style="color:var(--bad)">roșu</b> = avem nevoie de ajutor. Atinge cercul echipei.</p>
      <div class="semafor" style="justify-content:center;gap:16px;margin:20px 0">${[1, 2, 3, 4, 5, 6, 7].map(t => `<div style="text-align:center"><button class="sem ${sm[t] || ''}" style="width:90px;height:90px;font-size:1.6rem" data-act="sem" data-n="${n}" data-t="${t}">${t}</button><div class="small muted">${esc(students().filter(e => e.echipa === t).map(e => e.nume.split(' ')[0]).join(', '))}</div></div>`).join('')}</div>
      <div class="row" style="justify-content:center"><button class="btn ghost" data-act="semreset" data-n="${n}">${ic('reset')} Toate la zero</button></div>`);
  }

  /* ---------- modal helpers ---------- */
  function openModal(html, cls = '') { closeModal(); const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.innerHTML = `<div class="modal ${cls}">${html}</div>`; bg.addEventListener('click', ev => { if (ev.target === bg) closeModal(); }); document.body.appendChild(bg); }
  function closeModal() { $$('.modal-bg').forEach(m => m.remove()); }

  /* ================= RESOURCES ================= */
  const RES = [['standarde', 'Standardele clasei'], ['ssm', 'SSM'], ['piese', 'Piesele roverului'], ['comenzi', 'Comenzi Tinkercad'], ['materiale', 'Materiale și defecte'], ['ajustaje', 'Ajustaje și inserții'], ['proces', 'Fișa procesului'], ['conectori', 'Conectori K'], ['glosar', 'Glosar RO–EN'], ['criterii', 'Criterii și notare'], ['rezultate', 'Rezultatele învățării'], ['calendar', 'Calendar']];
  function viewRes(tab) {
    ui.resTab = tab;
    const A = D.anexe;
    let b = '';
    const tbl = (head, rows) => `<div class="tablewrap"><table class="t"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if (tab === 'standarde') b = `<div class="card"><h2>Standardele clasei</h2><p class="muted">Valori fixate o singură dată (lecția 5, după șablonul E1) și folosite la toate piesele. Atinge valoarea aleasă de clasă.</p>${stdTable(false)}</div>
      <div class="card"><h2>Interfețele standardizate ale roverului</h2>${tbl(['Interfața', 'Standard', 'Cote-cheie'], D.interfete.map(r => r.map(esc)))}</div>
      <div class="card"><h2>Desen tehnic și Tinkercad</h2><ul><li>Vederile pieselor sunt așezate după metoda E, ca la desenul tehnic: vederea de sus sub vederea din față, vederea din stânga în dreapta ei.</li><li>Cotele din tabele sunt cote nominale, în mm. Toleranța se aplică piesei imprimate, nu modelului: modelul trebuie să fie exact.</li><li>Abaterea = cota măsurată − cota nominală. Piesa este conformă dacă abaterea este în toleranță.</li></ul>
      <div class="callout"><h3>Regula de aur</h3>${esc(D.regulaDeAur)}</div><h3 style="margin-top:14px">Regulile clasei pentru fișiere</h3><ul>${D.reguliFisiere.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
    else if (tab === 'ssm') b = `<div class="grid g2">${D.ssm.map(([z, rs]) => `<div class="card"><h2>${esc(z)}</h2><ul class="clean ticks" style="font-size:1.1rem">${rs.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`).join('')}
      <div class="card callout bad"><h3>Orice zgomot, miros de ars sau fum</h3><div class="goal">STOP din meniu, apoi anunțați profesorul.</div></div></div>`;
    else if (tab === 'piese') b = `<div class="card"><div class="grid g2" style="align-items:center"><img src="img/rover.png" alt="Roverul FM-R2" style="width:100%"><div><h2>Roverul FM-R2</h2><p>Șasiu din două plăci de aluminiu 350 × 200 × 3, patru roți fără aer Ø160 × 70, motoare NEMA 17. Pe șina DIN dintre plăci stau carcasele A și B, cu electronica (Arduino Mega, ESP32, drivere). Pe șinele Picatinny de pe placa de sus se prind modulele C: girofar, buton STOP, lidar, senzori. Acumulatorul intră de jos, într-o casetă cu zăvoare.</p><div class="row"><span class="chip acc">30 de piese diferite</span><span class="chip acc">60 de bucăți</span><span class="chip acc">≈ 3,5 kg PETG</span><span class="chip acc">≈ 151 h de imprimare</span></div><p class="small muted">${esc(D.etwinning)}</p></div></div></div>
      <div class="card">${tbl(['Nr.', 'Piesa', 'Buc.', 'Material', 'Masă (g)', 'Timp (h)', 'Lecția'], D.piese.map(p => [`<b>${p.nr}</b>`, esc(p.nume), p.buc, esc(p.material), p.masa, p.ore, `<a href="#/lectie/${p.lectia}/piesa">L${p.lectia}</a>`]))}</div>`;
    else if (tab === 'comenzi') b = `<div class="card"><h2>Comenzile Tinkercad</h2><div class="grid g2">${tbl(['Ce vreau să fac', 'Tasta / mouse'], A.comenzi.slice(0, 11).map(r => [esc(r[0]), kbdify(r[1])]))}${tbl(['Ce vreau să fac', 'Tasta / mouse'], A.comenzi.slice(11).map(r => [esc(r[0]), kbdify(r[1])]))}</div></div>
      <div class="card"><h2>Parametrii formelor folosite</h2>${tbl(['Forma', 'Parametri', 'Unde o folosim'], A.forme.map(r => r.map(esc)))}</div>
      <div class="card callout teal"><h3>Rețete folosite des</h3><ul class="clean ticks" style="font-size:1.1rem">${A.retete.map(r => `<li>${hl(r)}</li>`).join('')}</ul></div>`;
    else if (tab === 'materiale') b = `<div class="card"><h2>Materiale (duză 0,4 mm)</h2>${tbl(['Material', 'Duză (°C)', 'Masă (°C)', 'Proprietăți', 'La rover'], A.materiale.map(r => r.map(esc)))}</div>
      <div class="card"><h2>Parametrii feliatorului (setările clasei)</h2>${tbl(['Parametru', 'Valoare uzuală', 'Ce face'], A.parametri.map(r => r.map(esc)))}</div>
      <div class="card"><h2>Defecte frecvente și remedii</h2>${tbl(['Defectul', 'Cauza probabilă', 'Remediul'], A.defecte.map(r => [`<b>${esc(r[0])}</b>`, esc(r[1]), esc(r[2])]))}</div>`;
    else if (tab === 'ajustaje') b = `<div class="card"><h2>Cât joc lăsăm între piese imprimate</h2>${tbl(['Situația', 'Joc recomandat', 'Exemplu în rover'], A.ajustaje.map(r => r.map(esc)))}</div>
      <div class="card"><h2>Inserții filetate</h2>${tbl(['Inserția', 'Ø exterior × lungime', 'Gaura în piesă', 'Adâncimea minimă', 'Temperatura letconului'], A.insertii.map(r => r.map(esc)))}
      <div class="callout" style="margin-top:12px"><h3>Montajul inserției, pas cu pas</h3><ol style="font-size:1.1rem;margin:0">${A.montajInsertie.map(r => `<li>${esc(r)}</li>`).join('')}</ol></div></div>`;
    else if (tab === 'proces') b = `<div class="card"><h2>Fișa procesului de imprimare</h2><p class="muted">Se completează în lecția 24 pentru o piesă la alegere (10 puncte din nota finală).</p>
      ${tbl(['Nr.', 'Operația', 'Parametri / unelte', 'Timp (min)', 'Control', 'Responsabil'], A.proces.map((o, i) => [i + 1, esc(o), '', '', '', '']))}
      <h3 style="margin-top:14px">Rezultatul</h3><ul><li>Timpul real de imprimare</li><li>Masa reală</li><li>Defecte apărute și remedii</li><li>Ce aș schimba data viitoare</li></ul></div>`;
    else if (tab === 'conectori') {
      const pins = [['1', 'GND (lângă colțul teșit)', '#111', 'negru'], ['2', '+5 V (la W05: bucla STOP, 12 V)', '#d32f2f', 'roșu'], ['3', 'semnal 1 (TRIG, DIN, TX)', '#1e5bd8', 'albastru'], ['4', 'semnal 2 (ECHO, BUZ, RX)', '#f2c200', 'galben']];
      const W = [['W01', 'C-US (HC-SR04)', 'A-CTRL', 'K4 · T1', 'GND · +5 V · TRIG D32 · ECHO D33'], ['W02', 'C-GIROFAR', 'A-CTRL', 'K4 · T2', 'GND · +5 V · DIN D34 · BUZ D35'], ['W03', 'C-LIDAR', 'A-CTRL', 'K4 · T3', 'GND · +5 V · TX lidar → RX2 D17 · rezervă'], ['W04', 'C-CAM', 'B-PWR', 'K4 · T4', 'GND · +5 V · rezervă · rezervă'], ['W05', 'C-STOP', 'B-PWR', 'K4 · B2', 'buclă A (+12 V) · buclă B (bobina K1) · – · –'], ['W06', 'C-ENV (opțional)', 'A-CTRL', 'K4 · B3', 'GND · +5 V · MQ-2 A1 · DHT22 D36'], ['W07', 'B-WIFI (ESP32)', 'A-CTRL', 'K4 · B4', 'GND · +5 V · TX1 D18 → divizor · RX1 D19'], ['W08', 'alimentare 5 V', 'B-PWR', 'K4 · B1', 'GND · GND · +5 V · +5 V'], ['W09', 'drivere stânga', 'A-CTRL', 'K6 · T2', 'GND · VIO · STEP/DIR LF · STEP/DIR LR'], ['W10', 'drivere dreapta', 'A-CTRL', 'K6 · T5', 'GND · EN · STEP/DIR RF · STEP/DIR RR']];
      b = `<div class="card"><div class="grid g2" style="align-items:center"><img src="img/conectori/explodat.png" alt="Conectorul K4 desfăcut" style="width:100%;max-height:420px;object-fit:contain">
        <div><h2>Conectorii K ai clasei (anexa G)</h2><p>Carcase printate pentru <b>terminale Dupont sertizate</b>, la <b>pasul de 5,08 mm</b>: între locașuri rămân 2,4 mm de plastic, care se imprimă corect cu duza de 0,4 mm. K4 = 4 contacte (modulele), K6 = 6 contacte (drivere – Mega).</p>
        <ul class="clean ticks"><li><b>34 tată</b>: pinii ascunși într-o manta de 6,5 mm</li><li><b>35 mamă</b>: intră în manta, joc 0,2 pe parte</li><li><b>Colțul teșit</b> 1,5 × 45°: nu intră întors</li><li><b>Nervura de cod</b>: intră doar în priza ei</li><li><b>36 capac</b>: ține terminalele, ureche pentru bridă</li><li><b>37 șablon</b>: alegi locașul (2,5…2,9) și gaura pinului (Ø0,9…1,3)</li></ul></div></div>
        <div class="callout" style="margin-top:12px"><h3>Regula mamă – tată</h3>Partea care dă tensiunea are mereu mufă <b>mamă</b>. Pe carcasele A și B: mamă. Cablul: tată spre carcasă, mamă spre modul. Pe modul: tată.</div></div>
        <div class="grid g2"><div class="card"><h2>Pinii și culorile</h2>${tbl(['Pin', 'Funcția', 'Firul'], pins.map(p => [`<b>${p[0]}</b>`, esc(p[1]), `<span style="display:inline-block;width:14px;height:14px;border:1px solid #555;background:${p[2]};vertical-align:-2px"></span> ${p[3]}`]))}</div>
        <div class="card"><h2>Codurile de cheie</h2>${tbl(['Cod', 'Legătura', 'Cod', 'Legătura'], [['T1', 'C-US', 'B1', 'alimentare 5 V'], ['T2', 'C-GIROFAR', 'B2', 'C-STOP (12 V!)'], ['T3', 'C-LIDAR', 'B3', 'C-ENV'], ['T4', 'C-CAM', 'B4', 'B-WIFI']])}<p class="small muted">T = nervura sus, B = jos; cifra = pinul în dreptul căruia stă nervura.</p></div></div>
        <div class="card"><h2>Tabelul de cablare</h2>${tbl(['Leg.', 'Modulul (tată)', 'Sursa (mamă)', 'Conector', 'Pinii 1 · 2 · 3 · 4 (· 5 · 6)'], W.map(r => r.map(esc)))}</div>
        <div class="grid g3">${[['fisa34', '34 · K4 tată', '23,9 × 8,7 × 21,5 · manta 21,5 × 6,3 × 6,5 · locaș 2,7 · pin Ø1,1'], ['fisa35', '35 · K4 mamă', '21,1 × 5,9 × 16 · locaș 2,7 · pin Ø1,3 · nervură 1,0 × 0,8'], ['fisa37', '37 · șablon de ajustaj', '46 × 22 × 6 · locașuri 2,5…2,9 · găuri Ø0,9…1,3']].map(([f, t, d]) => `<div class="card"><img class="part-img" src="img/conectori/${f}.png" data-act="zoom" alt="${t}"><h3 style="margin-top:10px">${t}</h3><div class="small">${d}</div></div>`).join('')}</div>
        ${legCheck()}
        <div class="card callout bad"><h3>SSM</h3>Conectorii se cuplează doar cu acumulatorul scos sau cu butonul de urgență apăsat. Ochelari la tăierea firelor. Legătura W05 (C-STOP) are 12 V și cod propriu; scoaterea ei oprește roverul.</div>`;
    }
    else if (tab === 'glosar') { const g = A.glosar, f = ui.flash, w = g[f.i % g.length];
      b = `<div class="grid g2" style="align-items:start"><div class="card"><h2>Cartonașe</h2><div class="flash"><button class="face ${f.back ? 'back' : ''}" style="width:100%" data-act="flip">${esc(f.back ? w[1] : w[0])}</button></div>
        <div class="row between" style="margin-top:12px"><button class="btn lg" data-act="flashgo" data-d="-1">${ic('left')}</button><span class="muted">${f.i % g.length + 1} / ${g.length} · atinge cartonașul</span><button class="btn lg pri" data-act="flashgo" data-d="1">${ic('right')}</button></div></div>
        <div class="card"><h2>Glosar român – englez</h2>${tbl(['Română', 'English'], g.map(r => [esc(r[0]), `<i>${esc(r[1])}</i>`]))}</div></div>`; }
    else if (tab === 'criterii') b = `<div class="card"><h2>Ciclul de lucru la fiecare piesă</h2><div class="grid g3">${D.faze.map((f, i) => `<div class="callout teal"><h3>${i + 1}. ${f.nume}</h3><b>${esc(f.intrebare)}</b><br>${esc(f.text)}</div>`).join('')}</div></div>
      <div class="card"><h2>Criteriile S / B / E (aceleași la fiecare lecție)</h2>${tbl(['Criteriul', 'S · satisfăcător (1 p)', 'B · bine (2 p)', 'E · excelent (3 p)'], D.criterii.map(c => [`<b>${c.id} · ${esc(c.nume)}</b>`, esc(c.S), esc(c.B), esc(c.E)]))}
        <p style="margin-top:12px">Autoevaluarea este obligatorie. Elevul bifează întâi nivelul, apoi profesorul îl bifează pe al lui. Dacă nivelurile diferă cu mai mult de o treaptă, discutați 2 minute: așa învață elevul să-și judece singur munca.</p>
        <div class="callout"><h3>Feedback în trei întrebări</h3><b>Unde vreau să ajung?</b> Scopul lecției, citit la început. · <b>Cum am lucrat?</b> Ce a ieșit bine și ce nu, pe criterii. · <b>Ce fac mai departe?</b> Un singur lucru concret pe care îl schimb la lecția următoare.</div></div>
      <div class="card"><h2>Nota finală a practicii</h2>${tbl(['Componenta', 'Cum se calculează', 'Puncte'], D.nota.map(r => [`<b>${esc(r[0])}</b>`, esc(r[1]), r[2]]).concat([['<b>Total</b>', 'nota = total / 10', '<b>100</b>']]))}</div>`;
    else if (tab === 'rezultate') b = `<div class="grid g3">${Object.entries(D.rezultate).map(([k, v]) => `<div class="card"><h2>${k}</h2><ul class="clean ticks">${v.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>
      <div class="card"><h2>Temele practicii</h2>${tbl(['Tema', 'Conținut', 'Ore', 'Lecții'], D.teme.map(r => r.map(esc)))}</div>`;
    else if (tab === 'calendar') b = `<div class="card"><h2>Calendarul practicii</h2><p class="muted">132 de ore în laborator + 18 ore recuperate (proiect individual și imprimări în afara orelor) = 150 de ore. Zile libere: 30 noiembrie și 1 decembrie 2026, 1 iunie 2027.</p>
      ${tbl(['Săpt.', 'Data', 'Lecția', 'Tema lecției', 'Piese', 'Ore'], D.lectii.map(l => [l.sapt, esc(l.data), `<a href="#/lectie/${l.nr}">L${l.nr}</a>`, esc(l.titlu), esc(l.piese), l.ore]))}</div>`;
    return topbar(`<a href="#/">Acasă</a> › Resurse`) + `<div class="tabs">${RES.map(([k, t]) => `<a class="tab ${k === tab ? 'on' : ''}" href="#/resurse/${k}">${t}</a>`).join('')}</div>` + b;
  }

  /* ================= SETTINGS ================= */
  function viewSettings() {
    return topbar(`<a href="#/">Acasă</a> › Setări`) + `<div class="grid g2" style="align-items:start">
      <div class="card"><h2>Afișare</h2><label class="fld">Tema</label><div class="seg"><button class="${S.setari.tema !== 'dark' ? 'on' : ''}" data-act="theme" data-v="light">Luminoasă</button><button class="${S.setari.tema === 'dark' ? 'on' : ''}" data-act="theme" data-v="dark">Întunecată</button></div>
        <label class="fld" style="margin-top:14px">Mărimea textului (pentru tabla interactivă)</label><div class="seg">${[[16, 'Mic'], [19, 'Normal'], [22, 'Mare'], [26, 'Foarte mare']].map(([v, t]) => `<button class="${(S.setari.fs || 19) === v ? 'on' : ''}" data-act="fs" data-v="${v}">${t}</button>`).join('')}</div></div>
      <div class="card"><h2>Datele clasei</h2><p class="muted">Elevii, evaluările, măsurătorile și prezența se păstrează doar în acest browser. Salvează periodic o copie, mai ales înainte de a schimba calculatorul sau tabla.</p>
        <div class="row"><button class="btn pri" data-act="backup">${ic('download')} Salvează copia (JSON)</button><label class="btn">${ic('upload')} Încarcă o copie<input type="file" accept=".json,application/json" data-act="restore" class="hidden"></label></div>
        <hr style="border:0;border-top:1px solid var(--line);margin:18px 0"><button class="btn ghost" data-act="wipe" style="color:var(--bad)">${ic('trash')} Șterge toate datele</button></div>
      <div class="card"><h2>Despre aplicație</h2><p>${esc(D.scoala)}<br>${esc(D.profesor)}</p><p class="small muted">Funcționează și fără internet după prima deschidere. Pentru tabla interactivă: ecran complet (butonul ${ic('full', 'width="16" height="16" style="vertical-align:-3px"')}) și text „Mare”.</p></div></div>`;
  }

  /* ================= EVENTS ================= */
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]'); if (!el) return;
    const a = el.dataset.act, d = el.dataset;
    const rerender = () => route();
    switch (a) {
      case 'fullscreen': if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen(); break;
      case 'timer': timerModal(); break;
      case 'tset': setTimer(+d.m, d.l); break;
      case 'tplay': if (T.run) { T.run = false; } else { if (!T.left) { setTimer(5, ''); break; } T.end = Date.now() + T.left; T.run = true; T.alarm = false; } tick(); break;
      case 'tadd': T.left = Math.max(0, T.left + d.m * 60000); T.end = Date.now() + T.left; T.alarm = false; tick(); break;
      case 'treset': T.run = false; T.left = 0; T.alarm = false; tick(); break;
      case 'picker': pickerModal(); break;
      case 'pool': ui.pickPool = d.p; pickerModal(); break;
      case 'pick': doPick(); break;
      case 'pickreset': ui.drawn.clear(); pickerModal(); break;
      case 'closemodal': closeModal(); rerender(); break;
      case 'phase': S.faza[d.n] = S.faza[d.n] == +d.i ? +d.i - 1 : +d.i; save(); rerender(); break;
      case 'step': case 'ctl': { const k = a === 'step' ? 'p' : 'c'; const pr = S.progres[d.n] = S.progres[d.n] || { p: [], c: [] }; pr[k] = pr[k] || []; const i = +d.i; pr[k] = pr[k].includes(i) ? pr[k].filter(x => x !== i) : pr[k].concat(i); save(); rerender(); break; }
      case 'stepreset': S.progres[d.n] = { p: [], c: (S.progres[d.n] || {}).c || [] }; ui.stepFocus[d.n] = ui.stepFocus[d.n] != null ? 0 : null; save(); rerender(); break;
      case 'stepfocus': ui.stepFocus[d.n] = ui.stepFocus[d.n] == null ? (() => { const done = new Set((S.progres[d.n] || {}).p || []); const l = lesson(d.n); const f = l.pasi.findIndex((_, i) => !done.has(i)); return f < 0 ? 0 : f; })() : null; rerender(); break;
      case 'stepgo': { const l = lesson(d.n), i = ui.stepFocus[d.n]; if (+d.d > 0) { const pr = S.progres[d.n] = S.progres[d.n] || { p: [], c: [] }; pr.p = pr.p || []; if (!pr.p.includes(i)) pr.p.push(i); save(); if (i >= l.pasi.length - 1) { ui.stepFocus[d.n] = null; toast('Toți pașii sunt parcurși'); } else ui.stepFocus[d.n] = i + 1; } else ui.stepFocus[d.n] = Math.max(0, i - 1); rerender(); break; }
      case 'mode': ui.mode[d.n] = +d.i; rerender(); break;
      case 'partsel': ui.partSel[d.n] = +d.i; rerender(); break;
      case 'zoom': { const z = document.createElement('div'); z.className = 'zoom-bg'; z.innerHTML = `<img src="${el.getAttribute('src')}" alt="">`; z.addEventListener('click', () => z.remove()); document.body.appendChild(z); break; }
      case 'reveal': el.classList.add('hidden'); el.nextElementSibling.classList.remove('hidden'); break;
      case 'std': S.std[d.id] = S.std[d.id] === d.v ? undefined : d.v; save(); rerender(); break;
      case 'qsel': { const st = ui.quiz[d.n]; if (!st.rev) { st.sel = +d.o; rerender(); } break; }
      case 'qrev': ui.quiz[d.n].rev = true; rerender(); break;
      case 'qgo': { const st = ui.quiz[d.n], l = lesson(d.n); st.i = (st.i + +d.d + l.quiz.length) % l.quiz.length; st.sel = null; st.rev = false; rerender(); break; }
      case 'semafor': semaforModal(+d.n); break;
      case 'sem': { const sm = S.semafor[d.n] = S.semafor[d.n] || {}; const order = ['', 'g', 'y', 'r']; sm[d.t] = order[(order.indexOf(sm[d.t] || '') + 1) % 4]; save(); semaforModal(+d.n); break; }
      case 'semreset': S.semafor[d.n] = {}; save(); semaforModal(+d.n); break;
      case 'addstud': { const names = ($('#newstud').value || '').split(/\n|;/).map(s => s.trim()).filter(Boolean); names.forEach(nm => S.elevi.push({ id: uid(), nume: nm, echipa: null })); save(); toast(`Am adăugat ${names.length} elevi`); rerender(); break; }
      case 'demostud': for (let i = 1; i <= 21; i++) S.elevi.push({ id: uid(), nume: 'Elev ' + String(i).padStart(2, '0'), echipa: ((i - 1) % 7) + 1 }); save(); rerender(); break;
      case 'setteam': { const e = studentById(d.id); e.echipa = e.echipa === +d.t ? null : +d.t; save(); rerender(); break; }
      case 'delstud': if (confirm('Ștergi elevul și toate evaluările lui?')) { S.elevi = S.elevi.filter(e => e.id !== d.id); save(); rerender(); } break;
      case 'autoteams': { const arr = S.elevi.slice().sort(() => Math.random() - .5); arr.forEach((e, i) => { e.echipa = (i % 7) + 1; }); save(); rerender(); break; }
      case 'ownpart': { Object.values(S.echipe).forEach(o => { o.piese = (o.piese || []).filter(p => p !== d.p); }); const cur = (S.echipe[d.t] = S.echipe[d.t] || { piese: [] }); if (el.classList.contains('on')) { } else cur.piese.push(d.p); save(); rerender(); break; }
      case 'absent': { const ab = S.prezenta[d.d] = S.prezenta[d.d] || {}; if (ab[d.id]) delete ab[d.id]; else ab[d.id] = 1; save(); rerender(); break; }
      case 'opengrade': if (d.id) gradeModal(+d.n, d.id); break;
      case 'who': { ui.evalWho = d.w; const m = $('.modal'); const sc = m && m.scrollTop; gradeModal(ui.gradeCur.n, ui.gradeCur.id); const m2 = $('.modal'); if (m2) m2.scrollTop = sc; break; }
      case 'lvl': { const r = evalRec(+d.n, d.id); const k = ui.evalWho; const i = +d.c, v = +d.v; r[k][i] = r[k][i] === v ? 0 : v; if (k === 'eu' && r.eu.every(x => x)) ui.evalWho = 'pr'; save(); const m = $('.modal'); const sc = m && m.scrollTop; gradeModal(+d.n, d.id); const m2 = $('.modal'); if (m2) m2.scrollTop = sc; break; }
      case 'masstud': ui.masStud = d.id; rerender(); break;
      case 'leg': { S.leg = S.leg || {}; const r = S.leg[d.w] = S.leg[d.w] || {}; r[d.k] = !r[d.k]; save(); rerender(); break; }
      case 'masflag': { const r = masRec(d.p, d.id, +d.c); r[d.k] = r[d.k] == null ? 'da' : r[d.k] === 'da' ? 'nu' : null; save(); rerender(); break; }
      case 'masman': { const r = masRec(d.p, d.id, +d.c); r.m = r.m == null ? 'da' : r.m === 'da' ? 'nu' : null; save(); rerender(); break; }
      case 'mascopy': { const e = studentById(d.id); const src = (S.mas[d.p] || {})[d.id]; if (!src) { toast('Nu există măsurători de copiat'); break; } S.elevi.filter(x => x.echipa === e.echipa && x.id !== e.id).forEach(x => { S.mas[d.p][x.id] = JSON.parse(JSON.stringify(src)); }); save(); toast('Copiat în echipa ' + e.echipa); rerender(); break; }
      case 'csv': exportCSV(); break;
      case 'print': window.print(); break;
      case 'tool': location.hash = '#/instrumente'; break;
      case 'flip': ui.flash.back = !ui.flash.back; rerender(); break;
      case 'flashgo': ui.flash.i = (ui.flash.i + +d.d + D.anexe.glosar.length) % D.anexe.glosar.length; ui.flash.back = false; rerender(); break;
      case 'theme': S.setari.tema = d.v; save(); applySettings(); rerender(); break;
      case 'fs': S.setari.fs = +d.v; save(); applySettings(); rerender(); break;
      case 'backup': download(`caiet-IXE-date-${todayISO()}.json`, JSON.stringify(S, null, 1), 'application/json'); break;
      case 'wipe': if (confirm('Ștergi definitiv toți elevii, evaluările și măsurătorile din acest browser?') && confirm('Sigur? Operația nu se poate anula.')) { S = blank(); save(); applySettings(); rerender(); } break;
    }
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target, d = el.dataset;
    if (d.act === 'evsel') location.hash = '#/evaluare/lectie/' + el.value;
    else if (d.act === 'rename') { const e = studentById(d.id); if (e) { e.nume = el.value.trim() || e.nume; save(); } }
    else if (d.act === 'restore' && el.files[0]) { const fr = new FileReader(); fr.onload = () => { try { const o = JSON.parse(fr.result); if (!o.elevi) throw new Error('fișier necunoscut'); S = Object.assign(blank(), o); save(); applySettings(); toast('Datele au fost încărcate'); route(); } catch (e) { toast('Nu pot citi fișierul: ' + e.message); } }; fr.readAsText(el.files[0]); }
    else if (d.act === 'legu' || d.act === 'lege') { S.leg = S.leg || {}; const r = S.leg[d.w] = S.leg[d.w] || {}; r[d.act === 'legu' ? 'u' : 'e'] = el.value.trim(); save(); }
    else if (d.act === 'calc') calcTools();
    else if (d.act === 'comp') { S.comp[d.id] = S.comp[d.id] || {}; const v = num(el.value); S.comp[d.id][d.k] = isFinite(v) ? String(Math.max(0, Math.min(10, v))).replace('.', ',') : ''; save(); route(); }
    else if (d.act === 'mas') {
      const all = $$('[data-act="mas"]'); const idx = all.indexOf(el);
      const r = masRec(d.p, d.id, +d.c); r.v[d.k] = el.value.trim(); save(); route();
      const nx = $$('[data-act="mas"]')[idx + 1]; if (nx) nx.focus();
    }
  });
  document.addEventListener('input', (ev) => {
    const el = ev.target, d = el.dataset;
    if (d.act === 'calc') calcTools();
    else if (d.act === 'fb') { const r = evalRec(+d.n, d.id); r[d.f] = el.value; save(); }
  });
  document.addEventListener('keydown', (ev) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (ev.key === 'Escape') { closeModal(); route(); }
    const m = location.hash.match(/^#\/lectie\/(\d+)\/?(\w*)/); if (!m || $('.modal-bg')) return;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { const f = $(ev.key === 'ArrowRight' ? '.navfoot .fab.acc' : '.navfoot a.fab:not(.acc)'); if (f) location.hash = f.getAttribute('href'); }
  });
  function exportCSV() {
    const st = students();
    const head = ['Elev', 'Echipa', ...D.saptamani.map(w => w.id), 'Media saptamanala (20)', 'Model propriu (20)', 'Masurare (10)', 'Piesa echipei (10)', 'Fisa procesului (10)', 'Proiect (10)', 'Caiet (10)', 'Oficiu', 'Total', 'Nota'];
    const rows = st.map(e => { const F = finalOf(e.id); return [e.nume, e.echipa || '', ...D.saptamani.map(w => { const v = weekScore(w.id, e.id); return v == null ? '' : fmt(v, 2); }), F.weekly == null ? '' : fmt(F.weekly, 2), F.p20 == null ? '' : fmt(F.p20, 2), F.p10m == null ? '' : fmt(F.p10m, 2), F.p10e == null ? '' : fmt(F.p10e, 2), F.comp.proces || '', F.comp.proiect || '', F.comp.caiet || '', 10, fmt(F.total, 2), fmt(F.nota, 2)]; });
    const lrows = [[], ['Punctaje pe lectii (profesor, max. 15)'], ['Elev', ...D.lectii.map(l => 'L' + l.nr)], ...st.map(e => [e.nume, ...D.lectii.map(l => { const t = lessonTotal(l.nr, e.id); return t == null ? '' : t; })])];
    const csv = '﻿' + [head, ...rows, ...lrows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    download(`situatie-practica-IXE-${todayISO()}.csv`, csv, 'text/csv;charset=utf-8');
  }

  /* ---------------- boot ---------------- */
  applySettings();
  route();
  const obs = new MutationObserver(() => { if ($('#r_out') && !$('#r_out').dataset.done) { $('#r_out').dataset.done = 1; calcTools(); } });
  obs.observe(document.getElementById('view'), { childList: true });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
