/* ══════════════════════════════════════════════════════════════
   Beyond Limits Connect — application shell
   ══════════════════════════════════════════════════════════════ */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ── icons ── */
const ICO = {
  home:'<path d="M3 10.5L12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16.5 5.6a3 3 0 010 5.6"/><path d="M18 20c0-2.6-.9-4.2-2.2-5.2"/>',
  hash:'<path d="M5 9h14M5 15h14M10 4L8 20M16 4l-2 16"/>',
  merge:'<path d="M7 4v6a5 5 0 005 5h5"/><path d="M17 4v6"/><path d="M14 12l3 3-3 3"/>',
  square:'<rect x="3" y="4" width="18" height="14" rx="3.5"/><path d="M8 20l4-2 4 2"/><path d="M7.5 9.5h9M7.5 13h6"/>',
  bell:'<path d="M18 8a6 6 0 10-12 0c0 7-2 9-2 9h16s-2-2-2-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
  spark:'<path d="M12 3l1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6z"/><path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  bridge:'<path d="M3 16V9a9 9 0 0118 0v7"/><path d="M3 16h18"/><path d="M8.5 16v-4M15.5 16v-4M12 16V9.5"/>',
  shield:'<path d="M12 3l7.5 3v6c0 4.6-3.2 7.9-7.5 9-4.3-1.1-7.5-4.4-7.5-9V6z"/><path d="M9.2 12.2l2 2 3.6-3.8"/>',
  code:'<path d="M9 7l-5 5 5 5"/><path d="M15 7l5 5-5 5"/>',
  check:'<path d="M4.5 12.5l5 5 10-11"/>',
  warn:'<path d="M12 4l9 16H3z"/><path d="M12 10v4.5M12 17.4v.2"/>',
  msg:'<path d="M20 12a7.5 7.5 0 01-10.9 6.7L4 20l1.4-4.6A7.5 7.5 0 1120 12z"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  qr:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><path d="M13.5 13.5h3v3h-3zM19 19h1.5v1.5H19zM13.5 19H15v1.5h-1.5zM19 13.5h1.5V15H19z"/>',
  file:'<path d="M14 3v5h5"/><path d="M19 8v12H5V3h9z"/><path d="M8.5 13h7M8.5 16.5h5"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="M4 20h4L19 9a2.5 2.5 0 10-3.5-3.5L4.5 16.5z"/>',
  down:'<path d="M12 4v13M6.5 11.5L12 17l5.5-5.5"/><path d="M4 20h16"/>',
  globe:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.5 3.6 5.4 3.6 8.5S14.4 18 12 20.5C9.6 18 8.4 15.1 8.4 12S9.6 6 12 3.5z"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  reply:'<path d="M10 8L4 13l6 5"/><path d="M4 13h9a6 6 0 016 6v1"/>',
  lock:'<rect x="4.5" y="10" width="15" height="10.5" rx="3"/><path d="M8 10V7.5a4 4 0 018 0V10"/>'
};
const ico = (n, cls = 'i') => `<svg viewBox="0 0 24 24" class="${cls}">${ICO[n] || ''}</svg>`;

/* ── nav model ── */
const NAV = [
  { group:'Run the day' },
  { id:'today',      label:'Today',            icon:'home' },
  { id:'square',     label:'The Square',       icon:'square' },
  { id:'nudges',     label:'Nudges',           icon:'bolt' },
  { group:'The back end Andy asked for first' },
  { id:'families',   label:'Family Records',   icon:'users',  count:() => BL.counts().total },
  { id:'codes',      label:'Code Studio',      icon:'hash',   count:() => BL.counts().missing, hot:true },
  { id:'merge',      label:'Merge Desk',       icon:'merge',  count:() => BL.matches.filter(m => m.status === 'open').length },
  { group:'Onboarding & handoff' },
  { id:'onboarding', label:'Orientation',      icon:'qr' },
  { id:'bridge',     label:'ParentSquare Bridge', icon:'bridge' },
  { id:'health',     label:'Workbook Health',  icon:'shield' }
];

const CRUMB = {
  today:['Run the day','Today'], square:['Run the day','The Square'], nudges:['Run the day','Nudges'],
  families:['Back end','Family Records'], codes:['Back end','Code Studio'], merge:['Back end','Merge Desk'],
  onboarding:['Onboarding','Orientation'], bridge:['Onboarding','ParentSquare Bridge'], health:['Onboarding','Workbook Health']
};

/* ── app state ── */
const S = {
  route:'today',
  q:'',
  program:'All',
  onlyMissing:false,
  audience:{ programs:['All'], grades:'All', unsignedOnly:false },
  translate:true,
  botStep:0
};

/* ── chrome ── */
function renderNav(){
  $('#nav').innerHTML = NAV.map(n => {
    if (n.group) return `<div class="rail__group">${esc(n.group)}</div>`;
    const c = n.count ? n.count() : null;
    return `<button class="navitem ${S.route === n.id ? 'is-active' : ''}" data-go="${n.id}" title="${esc(n.label)}">
      ${ico(n.icon)}<span>${esc(n.label)}</span>
      ${c !== null ? `<span class="navitem__count ${n.hot && c > 0 ? 'is-hot' : ''}">${c}</span>` : ''}
    </button>`;
  }).join('');
}

function renderCrumb(){
  const c = CRUMB[S.route] || ['', ''];
  $('#crumb').innerHTML = `<span>${esc(c[0])}</span><span class="sep">/</span><b>${esc(c[1])}</b>`;
}

function setMigration(){
  const c = BL.counts();
  const pct = Math.round((c.coded / c.total) * 100);
  $('#migrationPct').textContent = pct + '%';
  $('#migrationVal').style.strokeDashoffset = String(97.4 - (97.4 * pct / 100));
}

function toast(text, icon = 'check'){
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${ico(icon)}<span>${text}</span>`;
  $('#toasts').append(el);
  setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 360); }, 3200);
}

/* ── drawer ── */
function openDrawer(html){
  $('#drawer').innerHTML = html;
  $('#drawer').classList.add('is-on');
  $('#drawer').setAttribute('aria-hidden','false');
  $('#scrim').classList.add('is-on');
  const c = $('.drawer__close');
  if (c) c.onclick = closeDrawer;
}
function closeDrawer(){
  $('#drawer').classList.remove('is-on');
  $('#drawer').setAttribute('aria-hidden','true');
  $('#scrim').classList.remove('is-on');
}

/* ── router ── */
const VIEWS = {};
function go(route, opts = {}){
  if (!VIEWS[route]) route = 'today';
  S.route = route;
  if (!opts.silent) history.replaceState(null, '', '#' + route);
  renderNav(); renderCrumb();
  const v = $('#view');
  v.innerHTML = VIEWS[route]();
  v.classList.remove('fade-in'); void v.offsetWidth; v.classList.add('fade-in');
  window.scrollTo({ top:0, behavior:'auto' });
  if (WIRE[route]) WIRE[route]();
  setMigration();
}
const WIRE = {};

/* ── command palette ── */
function paletteItems(q){
  const term = q.trim().toLowerCase();
  const out = [];
  NAV.filter(n => n.id).forEach(n => {
    if (!term || n.label.toLowerCase().includes(term))
      out.push({ group:'Screens', icon:n.icon, label:n.label, hint:'go', run:() => go(n.id) });
  });
  if (term.length > 1){
    BL.families.filter(f =>
      f.name.toLowerCase().includes(term) ||
      (f.code || '').toLowerCase().includes(term) ||
      f.programs.join(' ').toLowerCase().includes(term)
    ).slice(0, 7).forEach(f => out.push({
      group:'Families', icon:'users', label:f.name,
      hint:f.code || 'no code', run:() => { go('families'); setTimeout(() => familyDrawer(f.id), 120); }
    }));
  }
  return out.slice(0, 12);
}
function drawPalette(){
  const items = paletteItems($('#paletteInput').value);
  let last = '';
  $('#paletteResults').innerHTML = items.length ? items.map((it, i) => {
    const head = it.group !== last ? `<div class="pgroup">${it.group}</div>` : '';
    last = it.group;
    return head + `<div class="pres ${i === 0 ? 'is-sel' : ''}" data-i="${i}">
      <span class="pres__ico">${ico(it.icon)}</span><span>${esc(it.label)}</span>
      <span class="pres__k">${esc(it.hint)}</span></div>`;
  }).join('') : `<div class="pgroup">No match — try a family name, a code, or a screen</div>`;
  $$('.pres').forEach(el => el.onclick = () => { items[+el.dataset.i].run(); togglePalette(false); });
  return items;
}
function togglePalette(on){
  const p = $('#palette');
  p.classList.toggle('is-on', on);
  p.setAttribute('aria-hidden', String(!on));
  if (on){ $('#paletteInput').value = ''; drawPalette(); $('#paletteInput').focus(); }
}

/* ── boot ── */
function boot(){
  renderNav();
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if (g) go(g.dataset.go);
  });
  $('#scrim').onclick = closeDrawer;
  $('#cmdkBtn').onclick = () => togglePalette(true);
  $('#bellBtn').onclick = () => { go('today'); toast('Six things happened since Friday — see the activity river', 'bell'); };
  $('#railUser').onclick = () => toast('Signed in as Andy Sklover · Beyond Limits Academics', 'shield');
  $('#themeBtn').onclick = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    toast(dark ? 'Daylight mode' : 'Evening mode — for the office sessions that run late', 'spark');
  };
  $('#paletteInput').addEventListener('input', drawPalette);
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); togglePalette(!$('#palette').classList.contains('is-on')); }
    if (e.key === 'Escape'){ togglePalette(false); closeDrawer(); }
    if (e.key === 'Enter' && $('#palette').classList.contains('is-on')){
      const items = paletteItems($('#paletteInput').value);
      if (items[0]){ items[0].run(); togglePalette(false); }
    }
  });
  $('#palette').addEventListener('click', e => { if (e.target.id === 'palette') togglePalette(false); });
  go(location.hash.replace('#','') || 'today', { silent:true });
}

/* ══════════════════════════════════════════════════════════════
   helpers shared by the screens
   ══════════════════════════════════════════════════════════════ */
function spark(points, color){
  const w = 96, h = 42, max = Math.max(...points), min = Math.min(...points);
  const d = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - 4 - ((p - min) / ((max - min) || 1)) * (h - 12);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return `<svg class="kpi__spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <path d="${d} L${w},${h} L0,${h} Z" fill="${color}" opacity=".12"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}

function progTag(p){
  const P = BL.PROGRAMS[p];
  return `<span class="tag tag--${P ? P.tag : 'quiet'} tag--dot">${esc(p)}</span>`;
}

function initials(name){
  const [last, first] = name.split(', ');
  return ((first || '')[0] || '') + ((last || '')[0] || '');
}

/* a deterministic decorative QR-looking block — not a scannable code */
function fakeQR(seedStr, fg = '#0A1A35'){
  let s = 0; for (const ch of seedStr) s = (s * 31 + ch.charCodeAt(0)) % 99991;
  const n = 11, cells = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++){
    s = (s * 1103515245 + 12345) % 2147483648;
    const corner = (x < 3 && y < 3) || (x > n - 4 && y < 3) || (x < 3 && y > n - 4);
    const on = corner ? (x === 0 || y === 0 || x === n - 1 || y === n - 1 || (x === 1 && y === 1) || (x > n - 3 && y === 1) || (x === 1 && y > n - 3) ? true : (x + y) % 2 === 0)
                      : (s % 100) > 52;
    if (on) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  }
  return `<svg viewBox="0 0 ${n} ${n}" fill="${fg}" shape-rendering="crispEdges">${cells.join('')}</svg>`;
}

function reach(){
  const sel = S.audience.programs;
  return BL.families.filter(f => {
    const inProg = sel.includes('All') || f.programs.some(p => sel.includes(p));
    const gradeOk = S.audience.grades === 'All'
      || (S.audience.grades === '4-6' && f.grade <= 6)
      || (S.audience.grades === '7-8' && f.grade >= 7 && f.grade <= 8)
      || (S.audience.grades === '9-10' && f.grade >= 9);
    return inProg && gradeOk && (!S.audience.unsignedOnly || !f.agreement);
  });
}

/* ══════════════════════════════════════════════════════════════
   01 · TODAY
   ══════════════════════════════════════════════════════════════ */
VIEWS.today = () => {
  const c = BL.counts();
  const pct = Math.round(c.coded / c.total * 100);
  const openMatches = BL.matches.filter(m => m.status === 'open').length;

  const queue = [
    { ico:'users', bg:'var(--sky-bg)', fg:'var(--sky)', step:'STEP 1',
      t:'Clean the family list', d:`39 families deleted by Andy. 2 still need his decision — Annabella Rojas and Anthony Lopez.`, go:'merge' },
    { ico:'hash', bg:'var(--gold-100)', fg:'var(--amber)', step:'STEP 2',
      t:'Put a participant code on every family', d:`${c.missing} of ${c.total} families still ${c.missing === 1 ? 'has' : 'have'} no code. No codes, no ParentSquare.`, go:'codes' },
    { ico:'qr', bg:'var(--violet-bg)', fg:'var(--violet)', step:'STEP 3',
      t:'Parent onboarding chatbot', d:'Drafted and editable — holding until the orientation slides land.', go:'onboarding' }
  ];

  return `
  <section class="today-hero fade-in">
    <div>
      <span class="today-hero__stamp">${ico('bolt')} Wednesday · 16 September 2026</span>
      <h1>Good morning, Andy.<br>${c.missing
        ? `Today the back end is <em>${c.missing} code${c.missing === 1 ? '' : 's'}</em> short.`
        : `Every family carries a <em>code</em> today.`}</h1>
      <p>Remind is closing. Beyond Limits is not in the district, so there is no school-assigned number to fall back on — the participant code <em>is</em> the identifier ParentSquare will import. Everything else in here waits behind that.</p>
      <div class="today-hero__cta">
        <button class="btn btn--gold" data-go="codes">${ico('hash')} Open Code Studio</button>
        ${openMatches ? `<button class="btn btn--ghost" data-go="merge">${ico('merge')} Review ${openMatches} merge${openMatches === 1 ? '' : 's'}</button>` : ''}
        <button class="btn btn--ghost" data-go="square">${ico('square')} Post to families</button>
      </div>
    </div>
    <div class="codeclock">
      <div class="codeclock__top"><span>Coded families</span><span>${pct}%</span></div>
      <div class="codeclock__num">${c.coded}<small>/ ${c.total}</small></div>
      <div class="bar" style="margin-top:14px">
        <i class="a" style="width:${pct}%"></i><i class="b" style="width:${100 - pct}%"></i>
      </div>
      <div class="codeclock__legend">
        <span><i style="background:var(--gold-500)"></i> ${c.coded} issued</span>
        <span><i style="background:rgba(255,255,255,.35)"></i> ${c.missing} to back-fill</span>
      </div>
    </div>
  </section>

  <div class="kpis stagger">
    <div class="kpi"><div class="kpi__label">${ico('users')} Active families</div>
      <div class="kpi__val">${c.total}</div><div class="kpi__sub">152 listed → 39 removed by Andy</div>
      ${spark([152,148,141,134,126,119,115,113], '#1F6FEB')}</div>
    <div class="kpi kpi--alert"><div class="kpi__label">${ico('hash')} Codes outstanding</div>
      <div class="kpi__val">${c.missing}</div><div class="kpi__sub">one afternoon in the office clears it</div>
      ${spark([113,113,112,111,110,108,106,105], '#B8790B')}</div>
    <div class="kpi"><div class="kpi__label">${ico('merge')} Duplicate identities</div>
      <div class="kpi__val">${openMatches}</div><div class="kpi__sub">held for review — never auto-merged</div>
      ${spark([0,1,1,2,2,3,3,3], '#D93A45')}</div>
    <div class="kpi"><div class="kpi__label">${ico('file')} Agreements outstanding</div>
      <div class="kpi__val">${c.noAgreement}</div><div class="kpi__sub">4 of them never signed a Starfish form</div>
      ${spark([34,31,29,27,25,24,22,21], '#0E9F6E')}</div>
  </div>

  <div class="today-grid">
    <div class="queue">
      <div class="queue__head">
        ${ico('bolt')}<h3>The build order — in Andy’s words</h3>
        <span class="tag tag--quiet" style="margin-left:auto">“This coding is number one.”</span>
      </div>
      ${queue.map(q => `
        <div class="queue__item" data-go="${q.go}">
          <span class="queue__ico" style="background:${q.bg};color:${q.fg}">${ico(q.ico)}</span>
          <div><div class="queue__t">${esc(q.t)}</div><div class="queue__d">${esc(q.d)}</div></div>
          <div style="text-align:right"><div class="queue__step">${q.step}</div>
            <span class="btn btn--ghost btn--sm" style="margin-top:6px">Open ${ico('arrow')}</span></div>
        </div>`).join('')}
      <div class="queue__item" style="background:var(--surface-2);cursor:default">
        <span class="queue__ico" style="background:var(--paper-2);color:var(--ink-3)">${ico('lock')}</span>
        <div><div class="queue__t">Not building yet</div>
          <div class="queue__d">No custom dashboard, no grants portal, no monthly retainer, nothing student-facing. Parents only.</div></div>
        <span class="queue__step">HELD</span>
      </div>
    </div>

    <div class="pulse">
      <div class="riverbox">
        <div class="sect-title">Activity</div>
        <div class="river">
          ${BL.activity.map(a => `
            <div class="river__row">
              <span class="river__pin">${ico(a.ico === 'code' ? 'hash' : a.ico === 'merge' ? 'merge' : a.ico === 'msg' ? 'msg' : a.ico === 'warn' ? 'warn' : 'check')}</span>
              <div><div class="river__t">${a.t}</div><div class="river__time">${esc(a.time)}</div></div>
            </div>`).join('')}
        </div>
      </div>
      <div class="riverbox">
        <div class="sect-title">Open questions for Andy</div>
        <ol style="margin:14px 0 0 18px;display:flex;flex-direction:column;gap:10px;font-size:12.8px;line-height:1.55;color:var(--ink-2)">
          ${BL.openQuestions.map(q => `<li>${esc(q)}</li>`).join('')}
        </ol>
      </div>
    </div>
  </div>`;
};

/* ══════════════════════════════════════════════════════════════
   02 · FAMILY RECORDS
   ══════════════════════════════════════════════════════════════ */
function filtered(){
  const q = S.q.trim().toLowerCase();
  return BL.families.filter(f => {
    const inProg = S.program === 'All' || f.programs.includes(S.program);
    const hit = !q || f.name.toLowerCase().includes(q) || (f.code || '').toLowerCase().includes(q)
      || f.guardian.toLowerCase().includes(q) || f.school.toLowerCase().includes(q);
    return inProg && hit && (!S.onlyMissing || !f.code);
  });
}

VIEWS.families = () => {
  const c = BL.counts();
  const progs = ['All', ...Object.keys(BL.PROGRAMS)];
  return `
  <div class="fam-head">
    <div>
      <h1>Family Records</h1>
      <p>One row per family — however many programs they join, however many forms they complete. This is the only place a participant code is ever created.</p>
    </div>
    <div style="display:flex;gap:9px">
      <button class="btn btn--ghost" data-go="bridge">${ico('down')} Export for ParentSquare</button>
      <button class="btn btn--primary" id="addFam">${ico('plus')} Add family</button>
    </div>
  </div>

  <div class="filterbar">
    <label class="search">${ico('users')}<input id="famSearch" placeholder="Name, code, guardian, school…" value="${esc(S.q)}"></label>
    <div class="chipset">
      ${progs.map(p => `<button class="chip ${S.program === p ? 'is-on' : ''}" data-prog="${p}">
        ${esc(p)}<span class="chip__n">${p === 'All' ? c.total : c.byProgram[p]}</span></button>`).join('')}
    </div>
    <button class="chip ${S.onlyMissing ? 'is-on' : ''}" id="missChip" style="margin-left:auto">
      ${ico('hash')} Missing a code<span class="chip__n">${c.missing}</span></button>
  </div>

  <div class="table-wrap">
    <table class="fam">
      <thead><tr>
        <th>Family</th><th>Program</th><th>Grade</th><th>Participant code</th>
        <th>Language</th><th>Agreement</th><th>Flags</th>
      </tr></thead>
      <tbody id="famBody">${famRows(filtered())}</tbody>
    </table>
    <div class="tablefoot">
      <span id="famCount">${filtered().length} of ${c.total} families</span>
      <span>Click any row for the full record, the merge history and every code ever issued</span>
    </div>
  </div>`;
};

function famRows(list){
  if (!list.length) return `<tr><td colspan="7"><div class="empty">Nothing matches that. Try a last name, or a code like BLA-2026.</div></td></tr>`;
  return list.map(f => `
    <tr data-fam="${f.id}">
      <td><div class="fam__who">
        <span class="avatar avatar--sm">${esc(initials(f.name))}</span>
        <div><div class="fam__name">${esc(f.name)}</div>
          <div class="fam__meta">${esc(f.guardianRole)} · ${esc(f.guardian)}</div></div>
      </div></td>
      <td>${f.programs.map(progTag).join(' ')}</td>
      <td class="mono">${f.grade}</td>
      <td>${f.code
        ? `<span class="codecell">${esc(f.code)}</span>`
        : `<span class="codecell codecell--missing">none yet</span>`}</td>
      <td>${esc(f.lang)}</td>
      <td>${f.agreement ? `<span class="tag tag--scse">signed</span>` : `<span class="tag tag--starfish">outstanding</span>`}</td>
      <td><div class="flagcell">
        ${f.flags.includes('duplicate') ? `<span class="tag tag--bffs">duplicate</span>` : ''}
        ${f.flags.includes('two-codes') ? `<span class="tag tag--bffs">2 codes</span>` : ''}
        ${f.flags.includes('pasted') ? `<span class="tag tag--starfish">pasted row</span>` : ''}
        ${f.flags.includes('unknown-group') ? `<span class="tag tag--quiet">BFFS?</span>` : ''}
      </div></td>
    </tr>`).join('');
}

function refreshFam(){
  const list = filtered();
  $('#famBody').innerHTML = famRows(list);
  $('#famCount').textContent = `${list.length} of ${BL.counts().total} families`;
  bindFamRows();
}
function bindFamRows(){
  $$('#famBody tr[data-fam]').forEach(tr => tr.onclick = () => familyDrawer(tr.dataset.fam));
}

WIRE.families = () => {
  $('#famSearch').addEventListener('input', e => { S.q = e.target.value; refreshFam(); });
  $$('[data-prog]').forEach(b => b.onclick = () => { S.program = b.dataset.prog; go('families'); });
  $('#missChip').onclick = () => { S.onlyMissing = !S.onlyMissing; go('families'); };
  $('#addFam').onclick = () => toast('New families arrive through the participation agreement — the form issues the code', 'file');
  bindFamRows();
};

function familyDrawer(id){
  const f = BL.families.find(x => x.id === id);
  if (!f) return;
  const att = f.attendance;
  const missed = att.filter(a => !a).length;
  openDrawer(`
    <div class="drawer__head">
      <button class="drawer__close">${ico('x')}</button>
      <div style="display:flex;align-items:center;gap:13px">
        <span class="avatar" style="width:46px;height:46px;border-radius:15px;font-size:15px">${esc(initials(f.name))}</span>
        <div>
          <div style="font-size:19px;font-weight:700;letter-spacing:-.02em">${esc(f.name)}</div>
          <div class="muted" style="font-size:12.5px">Grade ${f.grade} · ${esc(f.school)}</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-top:14px;flex-wrap:wrap">
        ${f.programs.map(progTag).join('')}
        ${f.code ? `<span class="tag tag--quiet mono">${esc(f.code)}</span>` : `<span class="tag tag--starfish">no code yet</span>`}
      </div>
    </div>
    <div class="drawer__body">
      ${f.notes ? `<div class="blueprint__note" style="background:var(--gold-100);border-color:var(--gold-400);color:var(--amber)">
        ${ico('warn')}<div>${esc(f.notes)}</div></div>` : ''}

      <div class="dsection">
        <h5>Identity</h5>
        <div class="dkv"><span>Participant code</span><b class="mono">${f.code ? esc(f.code) : '— to be issued —'}</b></div>
        <div class="dkv"><span>Programs</span><b>${f.programs.map(esc).join(' · ')}</b></div>
        <div class="dkv"><span>Joined</span><b>${esc(f.joined)}</b></div>
        <div class="dkv"><span>Agreement</span><b>${f.agreement ? 'On file' : 'Outstanding'}</b></div>
      </div>

      <div class="dsection">
        <h5>Household</h5>
        <div class="dkv"><span>${esc(f.guardianRole)}</span><b>${esc(f.guardian)}</b></div>
        <div class="dkv"><span>Mobile</span><b class="mono">${esc(f.phone)}</b></div>
        <div class="dkv"><span>Email</span><b style="font-size:12px">${esc(f.email)}</b></div>
        <div class="dkv"><span>Preferred language</span><b>${esc(f.lang)}</b></div>
        <div class="dkv"><span>Reaches them fastest</span><b>${esc(f.channel)}</b></div>
      </div>

      <div class="dsection">
        <h5>Attendance — last 8 sessions</h5>
        <div class="dots" style="margin-bottom:8px">${att.map(a => `<i class="${a ? '' : 'miss'}" style="width:24px;height:7px"></i>`).join('')}</div>
        <div class="muted" style="font-size:12.5px">${missed === 0 ? 'Perfect attendance — the “perfect month” nudge fires for this family.' : `${missed} missed. ${missed >= 2 ? 'The two-missed nudge has already gone out.' : 'Below the nudge threshold.'}`}</div>
      </div>

      <div class="dsection">
        <h5>Record history</h5>
        <div class="timeline">
          <div class="tl"><span class="tl__pin"></span><div><b>Participation agreement submitted</b><small>${esc(f.joined)} · PA (${esc(f.programs[0])})</small></div></div>
          ${f.programs.length > 1 ? `<div class="tl"><span class="tl__pin"></span><div><b>Added to ${esc(f.programs[1])}</b><small>Second agreement on file — identity unchanged</small></div></div>` : ''}
          ${f.code ? `<div class="tl"><span class="tl__pin"></span><div><b>Code ${esc(f.code)} issued</b><small>Will migrate to the BL-2026 series</small></div></div>` : `<div class="tl"><span class="tl__pin"></span><div><b>Awaiting a code</b><small>Queued for the back-fill run</small></div></div>`}
        </div>
      </div>

      <div style="display:flex;gap:9px;flex-wrap:wrap">
        <button class="btn btn--primary" data-act="reassign">${ico('merge')} Move program</button>
        <button class="btn btn--ghost" data-act="message">${ico('msg')} Message household</button>
        <button class="btn btn--ghost" data-act="code">${ico('hash')} Issue code</button>
      </div>
      <p class="muted" style="font-size:12px;line-height:1.6">Moving a family between programs never asks the parent to fill the form out again, and never changes the code — exactly what Andy asked for on 5 September.</p>
    </div>`);
  $$('[data-act]', $('#drawer')).forEach(b => b.onclick = () => {
    const a = b.dataset.act;
    if (a === 'reassign') toast(`${f.name} can be moved — the code travels with them`, 'merge');
    if (a === 'message'){ closeDrawer(); go('square'); toast(`Composer aimed at ${f.name} · ${f.lang}`, 'msg'); }
    if (a === 'code'){
      if (f.code){ toast(`${f.name} already holds ${f.code} — one family, one code`, 'shield'); return; }
      f.code = 'BL-2026-' + String(BL.families.filter(x => x.code).length + 1).padStart(4, '0');
      f.flags = f.flags.filter(x => x !== 'no-code');
      toast(`${f.code} issued to ${f.name}`, 'hash');
      closeDrawer(); go('families');
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   03 · CODE STUDIO
   ══════════════════════════════════════════════════════════════ */
VIEWS.codes = () => {
  const c = BL.counts();
  const legacy = BL.families.filter(f => f.code && /^BL[AHS]-/.test(f.code)).slice(0, 6);
  return `
  <div class="fam-head">
    <div>
      <h1>Code Studio</h1>
      <p>Where an identity is born, exactly once. The code is what ParentSquare will import in place of a district student number — so it has to survive a program transfer, a second agreement and a typo.</p>
    </div>
    <span class="tag tag--starfish" style="padding:8px 14px">${c.missing} famil${c.missing === 1 ? 'y' : 'ies'} waiting</span>
  </div>

  <div class="studio">
    <div>
      <section class="blueprint">
        <span class="h-eyebrow" style="color:var(--gold-400)">The format decision</span>
        <h2>One series for all of Beyond Limits</h2>
        <p>Today the program is baked into the prefix — BLA, BLH, BLS. Andy has asked to move families between programs, and a code that changes on transfer is not an identifier. The program moves into its own editable column.</p>
        <div class="codebuild">
          <div class="seg"><b>BL</b><span>Organisation</span></div>
          <span class="seg__dash">–</span>
          <div class="seg"><b>2026</b><span>Cohort year</span></div>
          <span class="seg__dash">–</span>
          <div class="seg seg--gold"><b>0011</b><span>Sequence</span></div>
          <div style="margin-left:14px;align-self:center">
            <div class="tag tag--scse tag--dot">program stored separately</div>
          </div>
        </div>
        <div class="blueprint__note">${ico('warn')}
          <div>Do it now, at ${c.coded} codes. Not later, at ${c.total}. The only thing that gates this: has a code already been printed, texted or put in a calendar anywhere outside the workbook?</div>
        </div>
      </section>

      <div class="migrate">
        <div class="beforeafter">
          <h4>Today — three series, one collision</h4>
          ${legacy.map(f => `<div class="oldcode"><s>${esc(f.code)}</s><span class="muted" style="font-size:11px">${esc(f.name)}</span></div>`).join('')}
          <div class="oldcode"><s>BLA-2026-0003</s><span class="tag tag--bffs">duplicate identity</span></div>
        </div>
        <div class="beforeafter" style="border-color:var(--mint)">
          <h4>After — one series, program in its own column</h4>
          ${legacy.map((f, i) => `<div class="oldcode"><span>BL-2026-${String(i + 1).padStart(4, '0')}</span>
            <span class="arrowpill">${esc(f.programs[0])}</span></div>`).join('')}
          <div class="oldcode"><span>BL-2026-0007</span><span class="arrowpill">Main + SCSE</span></div>
        </div>
      </div>

      <div class="card pad-lg" style="margin-top:16px">
        <div class="sect-title">What the generator refuses to do</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:14px">
          ${[
            ['Guess a column','v1 wrote to column 37 when it could not find the Participant Code field. v2 stops and reports instead.'],
            ['Issue a second code','A family that already holds a code keeps it — a new program is an added row value, not a new identity.'],
            ['Silently merge','Anything below 100% certainty is held for Andy. A wrong merge is worse than a slow one.'],
            ['Skip a tab','Starfish is in the lookup table now. So is every tab added after it.']
          ].map(([t, d]) => `<div style="padding:15px 16px;border:1px solid var(--line);border-radius:16px;background:var(--surface-2)">
            <div style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:13px">${ico('shield')} ${esc(t)}</div>
            <p class="muted" style="font-size:12px;line-height:1.55;margin-top:7px">${esc(d)}</p></div>`).join('')}
        </div>
      </div>
    </div>

    <aside class="runner">
      <h3>Back-fill run</h3>
      <p>${c.missing} famil${c.missing === 1 ? 'y' : 'ies'}, sorted the way Andy reads them: Main, then Horizons, SCSE, Starfish.</p>
      <div class="steps" id="runSteps">
        ${[['Snapshot the workbook','a restore point before anything is written'],
           ['Match against the family list','name + date of birth, never phone alone'],
           ['Hold the unclear ones','they go to the Merge Desk, not to a guess'],
           ['Write the codes','one family, one code, in one pass'],
           ['Rebuild the Master','with the code and language columns it never had']]
          .map((s, i) => `<div class="step" data-step="${i}"><span class="step__n">${i + 1}</span>
            <div><b>${esc(s[0])}</b><small>${esc(s[1])}</small></div></div>`).join('')}
      </div>
      <div class="runbar"><i id="runBar"></i></div>
      <div class="console" id="console"><span class="c-dim">ready · nothing has been written</span></div>
      <button class="btn btn--gold" id="runBtn" style="width:100%;justify-content:center;margin-top:14px">${ico('bolt')} Run the back-fill</button>
      <p class="muted" style="font-size:11.5px;margin-top:10px;line-height:1.5">A dry run by default. Andy watches it, then presses again to commit — the way we will do it in the office.</p>
    </aside>
  </div>`;
};

WIRE.codes = () => {
  const btn = $('#runBtn'), con = $('#console'), bar = $('#runBar');
  let running = false;
  btn.onclick = () => {
    if (running) return;
    running = true;
    btn.innerHTML = ico('clock') + ' Running…';
    const missing = BL.counts().missing;
    const lines = [
      ['snapshot › 2024-27 BL Families · 11 tabs · restore point saved', 200],
      ['scan › PA (Main) 110 · PA (Horizons) 21 · PA (SCSE) 17 · PA (Starfish) 4', 500],
      ['match › name + date of birth across all tabs', 900],
      ['<span class="c-gold">hold › 3 families matched more than one row — sent to Merge Desk</span>', 1300],
      [`write › issuing ${missing - 3} codes in the BL-2026 series`, 1750],
      ['verify › 0 collisions · 0 blank writes · 0 fallback columns used', 2250],
      ['<span class="c-gold">master › code + preferred language columns rebuilt</span>', 2650],
      ['done › dry run complete. Nothing written. Press again to commit.', 3050]
    ];
    con.innerHTML = '';
    lines.forEach(([t, ms], i) => setTimeout(() => {
      con.insertAdjacentHTML('beforeend', `<div>${t}</div>`);
      con.scrollTop = con.scrollHeight;
      bar.style.width = ((i + 1) / lines.length * 100) + '%';
      const steps = $$('#runSteps .step');
      const active = Math.min(Math.floor(i / 1.7), steps.length - 1);
      steps.forEach((s, si) => {
        s.classList.toggle('is-done', si < active);
        s.classList.toggle('is-now', si === active);
      });
      if (i === lines.length - 1){
        $$('#runSteps .step').forEach(s => { s.classList.add('is-done'); s.classList.remove('is-now'); });
        btn.innerHTML = ico('check') + ' Commit the run';
        btn.onclick = commit;
        running = false;
        toast('Dry run finished — nothing written yet', 'eye');
      }
    }, ms));
  };
  function commit(){
    let n = BL.families.filter(f => f.code).length;
    BL.families.forEach(f => {
      if (f.code || f.flags.includes('duplicate')) return;
      n++; f.code = 'BL-2026-' + String(n).padStart(4, '0');
      f.flags = f.flags.filter(x => x !== 'no-code');
    });
    toast('Codes written. Every family that is not held for review now has one.', 'check');
    go('codes');
  }
};

/* ══════════════════════════════════════════════════════════════
   04 · MERGE DESK
   ══════════════════════════════════════════════════════════════ */
VIEWS.merge = () => {
  const open = BL.matches.filter(m => m.status === 'open');
  return `
  <div class="merge-head">
    <div>
      <h1>Merge Desk</h1>
      <p style="font-size:13.5px;color:var(--ink-3);margin-top:5px;max-width:70ch;line-height:1.6">Andy requires a separate agreement per program — a family submitting twice is correct behaviour. The mistake was never the parent’s; it was the system issuing a second identity. Nothing here merges itself.</p>
    </div>
    <div style="display:flex;gap:9px">
      <span class="tag tag--quiet" style="padding:8px 14px">Matched on name + date of birth</span>
      <span class="tag ${open.length ? 'tag--bffs' : 'tag--scse'}" style="padding:8px 14px">${open.length ? `${open.length} awaiting Andy` : 'nothing awaiting Andy'}</span>
    </div>
  </div>

  <div id="matchList">${BL.matches.map(matchCard).join('')}</div>

  <div class="card pad-lg" style="margin-top:6px">
    <div class="sect-title">Why phone number is not the matching key</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:14px;font-size:12.8px;line-height:1.6;color:var(--ink-2)">
      <p>Ethan Shalauddin’s two submissions carry <b class="mono">203-570-8219</b> and <b class="mono">475-257-8689</b>. Same child, same address, same birthday — two phones, because two parents filled the form.</p>
      <p>Households share numbers, change carriers and hand phones to older siblings. Name plus date of birth caught all three duplicates in the workbook. Phone alone would have caught none of them.</p>
      <p>When the match is not exact, the record waits. Andy’s words on the call: <em>“if these codes get screwed up on the back end… it’s going to be worse.”</em></p>
    </div>
  </div>`;
};

function matchCard(m){
  if (m.status === 'merged') return `
    <div class="matchcard">
      <div class="resolved">
        ${ico('check','i')}
        <div style="font-weight:600;margin-top:8px">${esc(m.left.name)} — merged</div>
        <p class="muted" style="font-size:12.5px;margin-top:6px">One identity, both agreements kept on file. The surviving code is ${esc(m.left.code)}.</p>
      </div></div>`;
  const col = m.confidence > 95 ? 'var(--rose)' : 'var(--amber)';
  const row = (k, a, b) => `<div class="fieldrow ${a === b ? 'is-same' : 'is-diff'}"><span>${esc(k)}</span><b>${esc(a)}</b></div>`;
  return `
  <div class="matchcard" data-match="${m.id}">
    <div class="matchcard__top">
      <span class="avatar">${esc(initials(m.left.name))}</span>
      <div><div style="font-weight:700;letter-spacing:-.01em">${esc(m.left.name)}</div>
        <div class="muted" style="font-size:12px">${esc(m.reason)}</div></div>
      <div class="confidence">
        <span class="mono" style="font-size:12px;font-weight:600;color:${col}">${m.confidence}%</span>
        <span class="confidence__meter"><i style="width:${m.confidence}%;background:${col}"></i></span>
      </div>
    </div>
    <div class="versus">
      <div class="versus__side">
        <div class="sect-title" style="margin-bottom:12px">${esc(m.left.tab)} · row ${esc(m.left.row)}</div>
        ${row('Submitted', m.left.submitted, m.right.submitted)}
        ${row('Date of birth', m.left.dob, m.right.dob)}
        ${row('Address', m.left.address, m.right.address)}
        ${row('Parent phone', m.left.phone, m.right.phone)}
        ${row('Program', m.left.program, m.right.program)}
        <div class="fieldrow"><span>Code</span><b class="mono">${esc(m.left.code)}</b></div>
      </div>
      <div class="versus__mid"><span>same child</span></div>
      <div class="versus__side">
        <div class="sect-title" style="margin-bottom:12px">${esc(m.right.tab)} · row ${esc(m.right.row)}</div>
        ${row('Submitted', m.right.submitted, m.left.submitted)}
        ${row('Date of birth', m.right.dob, m.left.dob)}
        ${row('Address', m.right.address, m.left.address)}
        ${row('Parent phone', m.right.phone, m.left.phone)}
        ${row('Program', m.right.program, m.left.program)}
        <div class="fieldrow"><span>Code</span><b class="mono">${esc(m.right.code)}</b></div>
      </div>
    </div>
    <div class="matchcard__act">
      <span class="muted">${esc(m.note)}</span>
      <button class="btn btn--ghost btn--sm" data-keep="${m.id}">${ico('eye')} Not a match</button>
      <button class="btn btn--primary btn--sm" data-merge="${m.id}">${ico('merge')} Merge — keep ${esc(m.left.code === '—' ? 'the earlier record' : m.left.code)}</button>
    </div>
  </div>`;
}

WIRE.merge = () => {
  $$('[data-merge]').forEach(b => b.onclick = () => {
    const m = BL.matches.find(x => x.id === b.dataset.merge);
    m.status = 'merged';
    if (m.left.code === '—') m.left.code = 'BL-2026-0009';
    const f = BL.families.find(x => x.name === m.left.name);
    if (f){
      f.flags = f.flags.filter(x => x !== 'duplicate' && x !== 'two-codes');
      if (!f.code){ f.code = m.left.code; f.flags = f.flags.filter(x => x !== 'no-code'); }
    }
    toast(`${m.left.name} is one family again — both agreements kept`, 'merge');
    go('merge');
  });
  $$('[data-keep]').forEach(b => b.onclick = () => toast('Kept separate. The pair will not be offered again.', 'eye'));
};

/* ══════════════════════════════════════════════════════════════
   05 · THE SQUARE — posts, messages, delivery
   ══════════════════════════════════════════════════════════════ */
VIEWS.square = () => {
  const r = reach();
  const langs = [...new Set(r.map(f => f.lang))];
  const progs = ['All', ...Object.keys(BL.PROGRAMS)];
  return `
  <div class="fam-head">
    <div>
      <h1>The Square</h1>
      <p>One post, every household, in the language they actually read. Remind could text. This knows which family it is texting, which program they are in, and whether they have signed anything.</p>
    </div>
    <span class="tag tag--scse" style="padding:8px 14px">${ico('globe')} ${langs.length} languages live</span>
  </div>

  <div class="square">
    <div>
      <section class="composer">
        <div class="composer__tabs">
          <button class="ctab is-on">Post to families</button>
          <button class="ctab" data-soon>Direct message</button>
          <button class="ctab" data-soon>Scheduled</button>
        </div>
        <div class="composer__body">
          <div class="audience">
            <span class="audience__label">To</span>
            ${progs.map(p => `<button class="chip ${S.audience.programs.includes(p) ? 'is-on' : ''}" data-aud="${p}">${esc(p)}</button>`).join('')}
            <span style="width:1px;height:22px;background:var(--line);margin:0 4px"></span>
            ${['All','4-6','7-8','9-10'].map(g => `<button class="chip ${S.audience.grades === g ? 'is-on' : ''}" data-grade="${g}">${g === 'All' ? 'All grades' : 'Gr ' + g}</button>`).join('')}
            <button class="chip ${S.audience.unsignedOnly ? 'is-on' : ''}" data-unsigned>${ico('file')} No agreement on file</button>
          </div>
          <input class="field" id="postTitle" placeholder="Subject — “Fall schedule is live”" value="Tutoring resumes Tuesday">
          <textarea class="field" id="postBody" rows="5" placeholder="Write it once.">We start back Tuesday 9/15 at the Yerwood Center, 4:30–6:00 PM. Bring your Chromebook. Reply here if your pickup time has changed — I read every reply.</textarea>
          <div class="langrow">
            <span class="switch ${S.translate ? 'is-on' : ''}" id="transSwitch"></span>
            <span>Translate per household — ${esc(langs.join(', '))}</span>
            <span class="tag tag--quiet" style="margin-left:auto">${ico('shield')} No student ever sees this</span>
          </div>
        </div>
        <div class="composer__foot">
          <span class="reach">Reaching <b id="reachN">${r.length}</b> families · <b>${r.filter(f => f.channel === 'SMS').length}</b> by text, <b>${r.filter(f => f.channel === 'Email').length}</b> by email</span>
          <button class="btn btn--ghost" id="previewBtn">${ico('eye')} Preview</button>
          <button class="btn btn--gold" id="sendBtn">${ico('msg')} Send now</button>
        </div>
      </section>

      <div class="feed">
        <div class="sect-title" style="margin-top:8px">Sent</div>
        ${BL.posts.map(p => `
          <article class="post">
            <div class="post__head">
              <span class="avatar ${p.automated ? '' : 'avatar--andy'}">${esc(p.initials)}</span>
              <div class="post__who"><b>${esc(p.author)}</b><small>${esc(p.when)} · ${esc(p.audience)}</small></div>
              <div style="margin-left:auto;display:flex;gap:5px">
                ${p.automated ? `<span class="tag tag--horizons">${ico('bolt')} automated</span>` : ''}
                ${p.langs.map(l => `<span class="tag tag--quiet">${esc(l)}</span>`).join('')}
              </div>
            </div>
            <div style="font-weight:700;font-size:14px;margin-bottom:5px">${esc(p.title)}</div>
            <div class="post__body">${esc(p.body)}</div>
            <div class="post__stats">
              <span>${ico('check')} ${p.delivered}/${p.sent} delivered</span>
              <span>${ico('eye')} ${Math.round(p.read / p.sent * 100)}% read
                <span class="readbar"><i style="width:${Math.round(p.read / p.sent * 100)}%"></i></span></span>
              <span>${ico('reply')} ${p.replies} replies</span>
            </div>
          </article>`).join('')}
      </div>
    </div>

    <aside class="phone">
      <div class="sect-title" style="margin-bottom:12px">How it lands</div>
      <div class="phone__frame">
        <div class="phone__notch"></div>
        <div class="phone__screen" id="phoneScreen">
          <div class="bubble bubble--sms">
            <div class="bubble__from">Beyond Limits · SMS</div>
            <span id="smsText">Tutoring resumes Tuesday 9/15, 4:30–6:00 at the Yerwood Center. Reply if your pickup time changed.</span>
          </div>
          <div class="bubble">
            <div class="bubble__from">Español · misma familia</div>
            Las tutorías vuelven el martes 15/9, de 4:30 a 6:00 en el Yerwood Center. Responda si cambió la hora de recogida.
          </div>
          <div class="bubble">
            <div class="bubble__from">Kreyòl ayisyen</div>
            Leson patikilye yo rekòmanse madi 15/9, 4:30–6:00 nan Yerwood Center.
          </div>
          <div class="delivery">
            <span>${ico('check')} delivered 111/113</span><span>${ico('eye')} read 85%</span>
          </div>
        </div>
      </div>
      <p class="muted" style="font-size:11.5px;line-height:1.6;margin-top:14px">Two undelivered numbers are flagged back into Family Records the moment a carrier bounces them — which is how a wrong phone number gets found before ParentSquare inherits it.</p>
    </aside>
  </div>`;
};

WIRE.square = () => {
  const upd = () => {
    const r = reach();
    $('#reachN').textContent = r.length;
  };
  $$('[data-aud]').forEach(b => b.onclick = () => {
    const p = b.dataset.aud;
    if (p === 'All') S.audience.programs = ['All'];
    else {
      const set = new Set(S.audience.programs.filter(x => x !== 'All'));
      set.has(p) ? set.delete(p) : set.add(p);
      S.audience.programs = set.size ? [...set] : ['All'];
    }
    go('square');
  });
  $$('[data-grade]').forEach(b => b.onclick = () => { S.audience.grades = b.dataset.grade; go('square'); });
  $('[data-unsigned]').onclick = () => { S.audience.unsignedOnly = !S.audience.unsignedOnly; go('square'); };
  $('#transSwitch').onclick = () => {
    S.translate = !S.translate;
    $('#transSwitch').classList.toggle('is-on', S.translate);
    toast(S.translate ? 'Translation on — each household gets their own language' : 'Translation off — English only', 'globe');
  };
  $('#postBody').addEventListener('input', e => {
    $('#smsText').textContent = e.target.value.slice(0, 190) || 'Your message appears here as the family sees it.';
  });
  $('#previewBtn').onclick = () => toast('Preview shown on the right, per language', 'eye');
  $('#sendBtn').onclick = () => {
    const r = reach();
    toast(`Queued to ${r.length} families · ${S.translate ? 'translated per household' : 'English only'}`, 'msg');
  };
  $$('[data-soon]').forEach(b => b.onclick = () => toast('Same composer, different delivery — wired after the codes land', 'clock'));
  upd();
};

/* ══════════════════════════════════════════════════════════════
   06 · NUDGES
   ══════════════════════════════════════════════════════════════ */
VIEWS.nudges = () => {
  const watch = BL.families
    .map(f => ({ f, missed: f.attendance.filter(a => !a).length, recent: f.attendance.slice(-3).filter(a => !a).length }))
    .filter(x => x.missed >= 2).sort((a, b) => b.recent - a.recent || b.missed - a.missed).slice(0, 7);
  return `
  <div class="fam-head">
    <div>
      <h1>Nudges</h1>
      <p>“Message them if they miss x amount of days.” That sentence, built. It counts sessions, not days, because Beyond Limits meets twice a week — and it writes to the parent, never the student.</p>
    </div>
    <button class="btn btn--primary" id="newRule">${ico('plus')} New rule</button>
  </div>

  <div class="rulewrap">
    <div>
      <section class="flow">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
          <span class="h-eyebrow">Live rule</span>
          <b style="font-size:15px;letter-spacing:-.01em">Two sessions missed</b>
          <span class="tag tag--scse tag--dot" style="margin-left:auto">running</span>
        </div>

        <div class="flownode">
          <span class="flownode__ico" style="background:var(--sky-bg);color:var(--sky)">${ico('clock')}</span>
          <div><b>When a family misses <span class="flowedit" id="thresh">2 sessions</span> in a <span class="flowedit" id="win">rolling 3 weeks</span></b>
            <p>Counted from the tutor’s check-in, across every program the family belongs to.</p></div>
        </div>
        <div class="flowlink"></div>
        <div class="flownode">
          <span class="flownode__ico" style="background:var(--violet-bg);color:var(--violet)">${ico('globe')}</span>
          <div><b>Write to the guardian on file, in their language</b>
            <p>Spanish, Haitian Creole, Portuguese or English — chosen per household, not per program.</p></div>
        </div>
        <div class="flowlink"></div>
        <div class="flownode" style="border-color:var(--gold-400);background:var(--gold-100)">
          <span class="flownode__ico" style="background:var(--gold-500);color:var(--navy-900)">${ico('msg')}</span>
          <div><b>Send · SMS + app</b>
            <p style="color:var(--amber)">“Hi {guardian} — we missed {student} at the last 2 sessions. Everything alright? Reply 1 to keep the spot, 2 to pause for a week.”</p></div>
        </div>
        <div class="flowlink"></div>
        <div class="flownode">
          <span class="flownode__ico" style="background:var(--mint-bg);color:var(--mint)">${ico('reply')}</span>
          <div><b>Reply 1 → nothing happens. Reply 2 → paused, Andy told.</b>
            <p>No reply in 48 hours and the family moves to Andy’s call list. A person, not another text.</p></div>
        </div>

        <div class="blueprint__note" style="background:var(--sky-bg);border-color:transparent;color:var(--ink-2);margin-top:22px">
          ${ico('shield')}<div><b>Nothing student-facing.</b> Andy was explicit at the diner: a chat that answers a child on its own is a risk he does not want. Every automated word here goes to an adult on the agreement.</div>
        </div>
      </section>
    </div>

    <aside style="display:flex;flex-direction:column;gap:16px">
      <div class="card pad-lg">
        <div class="sect-title">Rules</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">
          ${BL.rules.map(r => `
            <div style="display:flex;align-items:center;gap:11px;padding:12px 13px;border:1px solid var(--line);border-radius:14px;background:var(--surface-2)">
              <span class="switch ${r.on ? 'is-on' : ''}" data-rule="${r.id}"></span>
              <div style="min-width:0">
                <b style="font-size:13px">${esc(r.name)}</b>
                <div class="muted" style="font-size:11.5px;margin-top:2px">${esc(r.channel)} · fired ${r.fired}× · ${r.replied} replied</div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <div class="watchlist">
        <div style="padding:16px 18px;border-bottom:1px solid var(--line)">
          <div class="sect-title">Watchlist</div>
          <p class="muted" style="font-size:11.5px;margin-top:5px">Last 8 sessions · red is a miss</p>
        </div>
        ${watch.map(w => `
          <div class="wl" data-fam="${w.f.id}" style="cursor:pointer">
            <div><b>${esc(w.f.name)}</b><small>Gr ${w.f.grade} · ${esc(w.f.programs.join(' · '))} · ${esc(w.f.lang)}</small>
              <div class="dots">${w.f.attendance.map(a => `<i class="${a ? '' : 'miss'}"></i>`).join('')}</div></div>
            <span class="tag ${w.recent >= 2 ? 'tag--bffs' : 'tag--starfish'}">${w.missed} missed</span>
          </div>`).join('')}
      </div>
    </aside>
  </div>`;
};

WIRE.nudges = () => {
  $$('[data-rule]').forEach(s => s.onclick = () => {
    const r = BL.rules.find(x => x.id === s.dataset.rule);
    r.on = !r.on;
    s.classList.toggle('is-on', r.on);
    toast(`${r.name} — ${r.on ? 'on' : 'paused'}`, 'bolt');
  });
  $$('.wl[data-fam]').forEach(el => el.onclick = () => familyDrawer(el.dataset.fam));
  $('#thresh').onclick = () => toast('Threshold is Andy’s to set — 2, 3 or 4 sessions', 'edit');
  $('#win').onclick = () => toast('Window: rolling 3 weeks, a month, or consecutive sessions', 'edit');
  $('#newRule').onclick = () => toast('Rules are plain sentences: when → who → what → then', 'plus');
};

/* ══════════════════════════════════════════════════════════════
   07 · ORIENTATION
   ══════════════════════════════════════════════════════════════ */
VIEWS.onboarding = () => {
  const c = BL.counts();
  const perProgram = Object.keys(BL.PROGRAMS).filter(p => p !== 'BFFS').map(p => {
    const fams = BL.families.filter(f => f.programs.includes(p));
    const signed = fams.filter(f => f.agreement).length;
    return { p, total: fams.length, signed, pct: fams.length ? Math.round(signed / fams.length * 100) : 0 };
  });
  return `
  <div class="fam-head">
    <div>
      <h1>Orientation</h1>
      <p>Andy gives the same mini-lecture every time a family arrives. This gives it for him — asks the affiliation first, because the agreement differs by program, then hands over the right QR code. No avatar, no face: a book and a calculator, the way he asked.</p>
    </div>
    <span class="tag tag--starfish" style="padding:8px 14px">${c.noAgreement} agreements outstanding</span>
  </div>

  <div class="onb">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="qrgrid">
        ${perProgram.map(x => `
          <div class="qrcard">
            <div class="qrcard__qr">${fakeQR('BL-' + x.p)}</div>
            <b>${esc(x.p)}</b>
            <small>${esc(BL.PROGRAMS[x.p].blurb)}</small>
            <div class="qrcard__bar"><i style="width:${x.pct}%;background:${BL.PROGRAMS[x.p].color}"></i></div>
            <small style="display:block;margin-top:7px">${x.signed}/${x.total} agreements signed</small>
          </div>`).join('')}
      </div>

      <div class="scripted">
        <div style="padding:18px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px">
          <div><div class="sect-title">The script</div>
            <p class="muted" style="font-size:12px;margin-top:5px">Click any line and type. No PowerPoint to re-send, no rebuild — the change is live on the next family that opens it.</p></div>
          <button class="btn btn--ghost btn--sm" id="saveScript" style="margin-left:auto">${ico('check')} Save</button>
        </div>
        ${BL.script.map((s, i) => `
          <div class="scripted__row">
            <div class="scripted__k">${esc(s.k)}</div>
            <div class="editable" contenteditable="true" data-line="${i}">${esc(s.v)}</div>
          </div>`).join('')}
      </div>

      <div class="card pad-lg">
        <div class="sect-title">What it will not do</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin-top:14px;font-size:12.5px;line-height:1.6;color:var(--ink-2)">
          <p>${ico('lock')} <b>Never answers a student.</b> Parents and guardians only.</p>
          <p>${ico('lock')} <b>Never improvises.</b> Off-script questions go to “talk to a person” — Andy calls the same day.</p>
          <p>${ico('lock')} <b>Never shows family data.</b> A tutor sees a check mark that the agreement exists, and nothing behind it.</p>
        </div>
      </div>
    </div>

    <aside class="bot">
      <div class="bot__head">
        <span class="bot__mark">${ico('file')}</span>
        <div><b>Orientation guide</b><small>an object, not a person — as requested</small></div>
        <button class="btn btn--sm" id="botReset" style="margin-left:auto;background:rgba(255,255,255,.1);color:#fff">Restart</button>
      </div>
      <div class="bot__chat" id="botChat"></div>
      <div class="bot__opts" id="botOpts"></div>
      <p style="font-size:11px;color:rgba(233,239,250,.55);margin-top:12px;line-height:1.55">Works the same on a phone as on a laptop. Andy asked; it does.</p>
    </aside>
  </div>`;
};

WIRE.onboarding = () => {
  const chat = $('#botChat'), opts = $('#botOpts');
  let i = 0;
  function step(){
    if (i >= BL.botFlow.length){ opts.innerHTML = ''; return; }
    const m = BL.botFlow[i];
    if (m.from === 'bot'){
      const typing = document.createElement('div');
      typing.className = 'msg msg--bot typing';
      typing.innerHTML = '<i></i><i></i><i></i>';
      chat.append(typing); chat.scrollTop = chat.scrollHeight;
      setTimeout(() => {
        typing.remove();
        const el = document.createElement('div');
        el.className = 'msg msg--bot';
        el.innerHTML = esc(m.text) + (m.qr ? `<div style="width:92px;margin:10px 0 2px;background:#fff;padding:7px;border-radius:11px">${fakeQR('BL-Horizons')}</div>` : '');
        chat.append(el); chat.scrollTop = chat.scrollHeight;
        if (m.options){
          opts.innerHTML = m.options.map(o => `<button class="optbtn">${esc(o)}</button>`).join('');
          $$('.optbtn', opts).forEach(b => b.onclick = () => {
            opts.innerHTML = '';
            const me = document.createElement('div');
            me.className = 'msg msg--me'; me.textContent = b.textContent;
            chat.append(me); chat.scrollTop = chat.scrollHeight;
            i += (BL.botFlow[i + 1] && BL.botFlow[i + 1].from === 'me') ? 2 : 1;
            setTimeout(step, 420);
          });
        } else { i++; setTimeout(step, 620); }
      }, 620);
    } else { i++; step(); }
  }
  chat.innerHTML = '<div class="msg msg--sys">orientation · 4 minutes</div>';
  step();
  $('#botReset').onclick = () => { chat.innerHTML = '<div class="msg msg--sys">orientation · 4 minutes</div>'; opts.innerHTML = ''; i = 0; step(); };
  $('#saveScript').onclick = () => {
    $$('[data-line]').forEach(el => BL.script[+el.dataset.line].v = el.textContent.trim());
    toast('Script saved — live for the next family that opens it', 'check');
  };
};

/* ══════════════════════════════════════════════════════════════
   08 · PARENTSQUARE BRIDGE
   ══════════════════════════════════════════════════════════════ */
function exportRows(){
  return BL.families.map(f => ({
    student_sis_id: f.code || '',
    student_first_name: f.first,
    student_last_name: f.last,
    grade_level: f.grade,
    group_name: f.programs.join('; '),
    parent_first_name: f.guardian.split(' ')[0],
    parent_last_name: f.guardian.split(' ').slice(1).join(' '),
    parent_mobile: f.phone,
    parent_email: f.email,
    preferred_language: f.lang,
    school_name: f.school
  }));
}

VIEWS.bridge = () => {
  const c = BL.counts();
  const ready = BL.families.filter(f => f.code && f.agreement).length;
  const rows = exportRows().slice(0, 5);
  const head = Object.keys(rows[0]);
  const checks = [
    { s: c.missing === 0 ? 'done' : 'blocked', b:'Every family carries a code', d: c.missing === 0 ? `All ${c.total} families hold a participant code.` : `${c.missing} famil${c.missing === 1 ? 'y' : 'ies'} still ${c.missing === 1 ? 'has' : 'have'} none. ParentSquare has nothing to key on for them.` },
    { s: BL.matches.some(m => m.status === 'open') ? 'blocked' : 'done', b:'No family holds two identities', d: BL.matches.filter(m => m.status === 'open').length ? `${BL.matches.filter(m => m.status === 'open').length} merge${BL.matches.filter(m => m.status === 'open').length === 1 ? '' : 's'} still on the desk.` : 'Every duplicate resolved — one family, one code.' },
    { s:'done', b:'Preferred language on every row', d:'Absent from the Master today; Connect carries it on the family record.' },
    { s:'done', b:'Program lives outside the code', d:'A transfer changes a column, never the identifier ParentSquare imported.' },
    { s:'blocked', b:'ParentSquare import format confirmed', d:'Open question for Andy — get their spec before we shape the file to it.' },
    { s:'done', b:'Remind wind-down message drafted', d:'“Keep using Remind until we switch” — scheduled, not improvised.' }
  ];
  return `
  <div class="fam-head">
    <div>
      <h1>ParentSquare Bridge</h1>
      <p>Remind is being folded into ParentSquare — an external deadline, not Andy’s choice. Beyond Limits is not in the district, so the participant code goes into the field a school would fill with a student ID.</p>
    </div>
    <button class="btn btn--gold" id="dlBtn">${ico('down')} Download ${c.total}-row CSV</button>
  </div>

  <div class="bridge">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card pad-lg">
        <div class="sect-title">Field mapping</div>
        <div style="margin-top:14px">
          ${BL.mapping.map(m => `
            <div class="maprow">
              <div class="mapbox">${esc(m.bl)}${m.note ? `<div class="muted" style="font-size:11px;margin-top:3px;font-weight:400">${esc(m.note)}</div>` : ''}</div>
              <div class="mapline"></div>
              <div class="mapbox mapbox--ps">${esc(m.ps)}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="card pad-lg">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <div class="sect-title">File preview</div>
          <span class="tag tag--quiet" style="margin-left:auto">first 5 of ${c.total} rows</span>
        </div>
        <div class="csv">
          <div class="h">${head.join(',')}</div>
          ${rows.map(r => `<div>${head.map(k => esc(String(r[k] || '—'))).join(',')}</div>`).join('')}
        </div>
      </div>
    </div>

    <aside style="display:flex;flex-direction:column;gap:16px">
      <div class="card pad-lg">
        <div class="sect-title">Readiness</div>
        <div style="font-size:34px;font-weight:700;letter-spacing:-.03em;margin:10px 0 2px">${ready}<span style="font-size:15px;color:var(--ink-3);font-weight:500"> / ${c.total} rows importable</span></div>
        <div class="bar" style="background:var(--paper-2);margin:12px 0 18px"><i class="a" style="width:${Math.round(ready / c.total * 100)}%;background:var(--navy-700)"></i></div>
        <div class="checklist">
          ${checks.map(k => `<div class="ck is-${k.s}">
            <span class="ck__box">${k.s === 'done' ? ico('check') : ico('warn')}</span>
            <div><b>${esc(k.b)}</b><small>${esc(k.d)}</small></div></div>`).join('')}
        </div>
      </div>
      <div class="card pad-lg" style="background:linear-gradient(160deg,var(--gold-100),var(--surface) 70%);border-color:var(--gold-400)">
        <div style="display:flex;gap:10px">${ico('bolt')}
          <div><b style="font-size:13.5px">The order that matters</b>
            <p class="muted" style="font-size:12.5px;line-height:1.6;margin-top:6px">Codes first, merges second, export third. Exporting a duplicate into ParentSquare copies the problem into the system Beyond Limits will live in for the next five years.</p></div></div>
      </div>
    </aside>
  </div>`;
};

WIRE.bridge = () => {
  $('#dlBtn').onclick = () => {
    const rows = exportRows(), head = Object.keys(rows[0]);
    const csv = [head.join(','), ...rows.map(r => head.map(k => `"${String(r[k] ?? '').replace(/"/g,'""')}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'beyond-limits-parentsquare-import.csv'; a.click();
    URL.revokeObjectURL(url);
    toast(`${rows.length} rows exported — blank codes included so nothing hides`, 'down');
  };
};

/* ══════════════════════════════════════════════════════════════
   09 · WORKBOOK HEALTH
   ══════════════════════════════════════════════════════════════ */
VIEWS.health = () => {
  const fixed = BL.defects.filter(d => d.state === 'fixed').length;
  const tabs = [
    ['Directory','12 × 2','A contents page','ok'],
    ['Master – 2024-26 BL Families','357 × 26','Three pivot tables. No code column, no language column.','warn'],
    ['Sheet13 / 14 / 15','1 × 1 each','Empty. Ours. Deleted.','fixed'],
    ['DS Letters','49 × 6','Discounted-services tracking — moved out of the family workbook.','fixed'],
    ['BL Families Dashboard','1045 × 14','74 cells of content, three broken formulas.','warn'],
    ['PA (Main)','110 × 37','Real submissions · code field present','ok'],
    ['PA (Horizons)','21 × 37','Real submissions · code field present','ok'],
    ['PA (SCSE)','17 × 38','Stray 38th column titled “Column 37”.','fixed'],
    ['PA (Starfish)','4 × 37','Four pasted rows, header row at line 10, shifted one column.','fixed']
  ];
  return `
  <div class="fam-head">
    <div>
      <h1>Workbook Health</h1>
      <p>Everything we found on 7 September, reading every tab, column and cell of the live file — and what happens to each one. ${fixed} of ${BL.defects.length} already closed.</p>
    </div>
    <span class="tag tag--quiet" style="padding:8px 14px">2024-27 BL Families · 11 tabs</span>
  </div>

  <div class="card pad-lg" style="margin-bottom:16px">
    <div class="sect-title">The tabs, as they stand</div>
    <div style="margin-top:14px;display:flex;flex-direction:column">
      ${tabs.map(t => `
        <div style="display:grid;grid-template-columns:minmax(0,1.1fr) 92px minmax(0,2fr) 86px;gap:14px;align-items:center;padding:12px 0;border-bottom:1px solid var(--line-2)">
          <b style="font-size:13px">${esc(t[0])}</b>
          <span class="mono muted" style="font-size:11.5px">${esc(t[1])}</span>
          <span class="muted" style="font-size:12.5px">${esc(t[2])}</span>
          <span class="tag ${t[3] === 'fixed' ? 'tag--scse' : t[3] === 'warn' ? 'tag--starfish' : 'tag--quiet'}" style="justify-self:end">${t[3] === 'fixed' ? 'handled' : t[3] === 'warn' ? 'rebuilding' : 'clean'}</span>
        </div>`).join('')}
    </div>
  </div>

  <div class="health">
    ${BL.defects.map(d => `
      <div class="defect defect--${d.state}">
        <div class="defect__n">DEFECT ${esc(String(d.n))}</div>
        <h4>${esc(d.title)}</h4>
        <p>${esc(d.body)}</p>
        <div class="defect__foot">
          <span class="tag ${d.state === 'fixed' ? 'tag--scse' : d.state === 'risk' ? 'tag--bffs' : 'tag--starfish'}">
            ${d.state === 'fixed' ? 'closed' : d.state === 'risk' ? 'ownership risk' : 'in the fix'}</span>
          ${d.state === 'fixed' ? `<span class="muted" style="font-size:11.5px">no charge — this one is on us</span>` : ''}
        </div>
      </div>`).join('')}
  </div>

  <div class="card pad-lg ownercard" style="margin-top:16px">
    <div style="display:flex;gap:14px;align-items:flex-start">
      ${ico('lock')}
      <div>
        <b style="font-size:15px">Who owns the data</b>
        <p style="font-size:13px;line-height:1.65;color:var(--ink-2);margin-top:8px;max-width:88ch">The Google Forms belong to Beyond Limits. The workbook — every name, birthday, home address, phone, income and ethnicity — and the code-generating script do not: they sit on a personal Gmail account, with the script running under a personal login. If either account is closed or lost, Beyond Limits loses the data or the automation. Transferring ownership does not carry the form triggers over; they have to be recreated afterwards, or code generation stops silently and nobody finds out until a family has no code.</p>
        <p style="font-size:13px;line-height:1.65;color:var(--ink-2);margin-top:10px">Not part of this project. Andy should know before the ParentSquare migration, not after.</p>
      </div>
    </div>
  </div>`;
};

boot();
