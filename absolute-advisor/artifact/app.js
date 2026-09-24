// Cloud (claude.ai Artifact) version of the Advisor's page logic. Answers come
// from the `sample` capability on the viewer's own Claude account; memory and
// roster edits are kept in this browser. build.js splices this file into the
// page together with SEED_VEHICLES, PERSONA and AFFIRMATIONS.
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const frame = $('#frame'), thread = $('#thread'), input = $('#input'), card = $('#card');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  // ------------------------------------------------------------ entrance teardown
  const root = document.documentElement;
  const endAnim = () => root.classList.remove('anim');
  document.querySelector('.logos span:last-child').addEventListener('animationend', endAnim, { once: true });
  setTimeout(endAnim, 2600);

  // ------------------------------------------------------------ greeting + affirmations
  function greeting() {
    const h = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/New_York' }));
    const part = h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    $('#greet').textContent = `${part}, Komal.`;
  }
  greeting();
  setInterval(greeting, 60000);
  const affirm = $('#affirm');
  const order = AFFIRMATIONS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  let ai = 0;
  affirm.textContent = AFFIRMATIONS[order[0]] || '';
  setInterval(() => {
    affirm.classList.add('out');
    setTimeout(() => { ai = (ai + 1) % order.length; affirm.textContent = AFFIRMATIONS[order[ai]]; affirm.classList.remove('out'); }, 900);
  }, 40000);

  // ------------------------------------------------------------ fleet (seed + this browser's edits)
  const fleetState = () => store.get('aa.fleet', { edits: {}, added: [] });
  function vehicles() {
    const st = fleetState();
    return [...SEED_VEHICLES.map((v) => ({ ...v, ...(st.edits[v.id] || {}) })), ...st.added];
  }
  const LUXURY = new Set(['Lincoln', 'Cadillac', 'Mercedes-Benz']);
  function segmentOf(v) {
    const m = `${v.make} ${v.model}`.toLowerCase();
    if (/sprinter|transit/.test(m)) return 'Group van';
    if (/mach-e/.test(m)) return 'EV crossover';
    if (/aviator|escalade|suburban|gle|xt5|navigator|yukon|tahoe|gls/.test(m)) return 'Executive SUV';
    if (/mkt/.test(m)) return 'Executive wagon (MKT)';
    if (/odyssey|sienna|voyager|pacifica/.test(m)) return 'Minivan';
    if (/sentra|altima|accord|malibu|camry/.test(m)) return 'Economy sedan';
    return 'Economy crossover';
  }
  function analyze(v, now = new Date()) {
    const age = Math.max(0.75, (now - new Date(v.year - 1, 9, 1)) / (365.25 * 864e5));
    const pace = Math.round(v.miles / age);
    const seg = segmentOf(v);
    const tier = seg === 'Group van' ? 'group' : LUXURY.has(v.make) || /suburban/i.test(v.model) ? 'luxury' : 'standard';
    const flags = [];
    if (v.miles >= 200000) flags.push('200k+ miles: replace');
    else if (v.miles >= 150000) flags.push('150k+ miles: plan the exit');
    else if (v.miles >= 100000 && tier === 'luxury') flags.push('100k+: past peak resale for a luxury unit');
    if (pace >= 45000) flags.push(`heavy pace (~${Math.round(pace / 1000)}k mi/yr)`);
    if (pace < 8000 && age > 1.5) flags.push(`low use (~${Math.round(pace / 1000)}k mi/yr): verify role`);
    if (now.getFullYear() - v.year >= 10) flags.push('10+ model years old');
    if (/mkt/i.test(v.model)) flags.push('MKT ended production after 2019');
    if (!v.plate || /not provided|confirm/i.test(v.model)) flags.push('tracker record incomplete');
    const raw = v.miles / 3500 + age * 2 + (tier === 'luxury' ? 6 : 0);
    const active = (v.status || 'active') === 'active';
    return { ...v, segment: seg, tier, ageYears: Math.round(age * 10) / 10, milesPerYear: pace, flags, replacePriority: active ? Math.round(100 * (1 - Math.exp(-raw / 60))) : 0 };
  }
  function report() {
    const list = vehicles().map((v) => analyze(v));
    const active = list.filter((v) => (v.status || 'active') === 'active');
    const count = (k) => active.reduce((a, v) => ((a[v[k]] = (a[v[k]] || 0) + 1), a), {});
    const totalMiles = active.reduce((s, v) => s + v.miles, 0);
    const models = {};
    active.forEach((v) => (models[`${v.make} ${v.model}`] = models[`${v.make} ${v.model}`] || []).push(v.id));
    return {
      vehicles: list,
      summary: {
        activeCount: active.length, retiredCount: list.length - active.length, totalMiles,
        avgMiles: active.length ? Math.round(totalMiles / active.length) : 0,
        over200k: active.filter((v) => v.miles >= 200000).length,
        over150k: active.filter((v) => v.miles >= 150000).length,
        avgAge: active.length ? Math.round((active.reduce((s, v) => s + v.ageYears, 0) / active.length) * 10) / 10 : 0,
        byMake: count('make'), bySegment: count('segment'), models,
      },
    };
  }
  const n = (x) => Number(x).toLocaleString('en-US');
  function rosterText() {
    const r = report(), s = r.summary;
    const lines = r.vehicles.map((v) => [
      `#${v.id}`, v.nickname, `${v.year} ${v.make} ${v.model}`, v.plate || '(no plate on record)', `${n(v.miles)} mi`,
      `~${n(v.milesPerYear)} mi/yr`, `${v.ageYears} yrs`, v.segment, `priority ${v.replacePriority}`,
      v.status && v.status !== 'active' ? `STATUS: ${v.status}` : '', v.role ? `role: ${v.role}` : '',
      v.flags.length ? `flags: ${v.flags.join('; ')}` : '', v.notes ? `notes: ${v.notes}` : '', v.vin ? `VIN ${v.vin}` : '',
    ].filter(Boolean).join(' | '));
    const groups = Object.entries(s.models).sort((a, b) => b[1].length - a[1].length).map(([k, ids]) => `${k} ×${ids.length} (#${ids.join(', #')})`).join('\n');
    return `ROSTER (${s.activeCount} active${s.retiredCount ? `, ${s.retiredCount} retired/sold` : ''}; source: GPS tracker app screenshots)
Columns: id | tracker nickname | vehicle | plate | odometer | est. annual pace | est. age | segment | replacement priority (0-100, computed) | role/status/flags/notes | VIN
${lines.join('\n')}

UNITS BY MODEL
${groups}

TOTALS: ${n(s.totalMiles)} fleet miles · avg ${n(s.avgMiles)} mi/vehicle · avg age ${s.avgAge} yrs · ${s.over200k} units at 200k+ · ${s.over150k} units at 150k+
By segment: ${Object.entries(s.bySegment).map(([k, c]) => `${k} ${c}`).join(', ')}
By make: ${Object.entries(s.byMake).map(([k, c]) => `${k} ${c}`).join(', ')}`;
  }

  // ------------------------------------------------------------ memory (this browser)
  const loadNotes = () => store.get('aa.notes', []);
  function addNote(text, category) {
    const notes = loadNotes();
    const id = 'n' + (notes.reduce((m, x) => Math.max(m, Number(x.id.slice(1)) || 0), 0) + 1);
    notes.push({ id, text: String(text).slice(0, 600), category: String(category || 'general').slice(0, 40), date: new Date().toISOString().slice(0, 10) });
    store.set('aa.notes', notes.slice(-300));
    return id;
  }
  function deleteNote(id) {
    const notes = loadNotes();
    const next = notes.filter((x) => x.id !== id);
    if (next.length === notes.length) throw new Error(`No note with id ${id}`);
    store.set('aa.notes', next);
  }

  function instructions() {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/New_York' });
    const notes = loadNotes();
    return `${PERSONA}\n\n${rosterText()}\n\nTODAY: ${date} (Eastern Time).\n\nWHAT YOU'VE LEARNED ABOUT KOMAL'S BUSINESS (saved notes; these override playbook defaults)\n${
      notes.length ? notes.map((x) => `- [${x.id}] (${x.category}, ${x.date}) ${x.text}`).join('\n') : '(none yet: learn about the business as you go and save what matters)'
    }\n\nEverything above is your standing briefing. The conversation with Komal follows.`;
  }

  // ------------------------------------------------------------ tools Claude may call (run in this page)
  let onChanged = () => {};
  const TOOLS = [
    {
      name: 'save_note',
      description: "Save a durable fact about Komal's business (rates, which vehicles do which jobs, what nickname prefixes mean, clients, goals, preferences). Returns the note id.",
      inputSchema: { type: 'object', properties: { text: { type: 'string' }, category: { type: 'string', enum: ['rates', 'fleet', 'clients', 'operations', 'goals', 'preferences', 'general'] } }, required: ['text'] },
      execute(i) { if (!String(i.text || '').trim()) throw new Error('text is empty'); const id = addNote(i.text, i.category); onChanged('notes', 'Saved to memory'); return `Saved note ${id}.`; },
    },
    {
      name: 'delete_note',
      description: 'Delete a saved note that is wrong or out of date, by its id such as "n4".',
      inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
      execute(i) { deleteNote(String(i.id)); onChanged('notes', 'Removed a note'); return `Deleted ${i.id}.`; },
    },
    {
      name: 'update_vehicle',
      description: 'Update a roster vehicle by id (#): new mileage, status (active, sold, retired, in-shop, for-sale), role, notes, plate. Only include fields that change. Returns the updated vehicle.',
      inputSchema: { type: 'object', properties: { id: { type: 'integer' }, changes: { type: 'object', properties: { miles: { type: 'integer' }, status: { type: 'string' }, role: { type: 'string' }, notes: { type: 'string' }, plate: { type: 'string' }, nickname: { type: 'string' }, model: { type: 'string' } } } }, required: ['id', 'changes'] },
      execute(i) {
        const id = Number(i.id);
        const st = fleetState();
        const added = st.added.find((v) => v.id === id);
        if (!added && !SEED_VEHICLES.some((v) => v.id === id)) throw new Error(`No vehicle with id ${id}`);
        const clean = {};
        for (const [k, val] of Object.entries(i.changes || {})) {
          if (!['miles', 'status', 'role', 'notes', 'plate', 'nickname', 'model'].includes(k)) continue;
          if (k === 'miles') { const m = Math.round(Number(val)); if (!(m >= 0)) throw new Error('miles must be a positive number'); clean.miles = m; }
          else clean[k] = String(val).slice(0, 300);
        }
        if (!Object.keys(clean).length) throw new Error('Nothing to change');
        if (added) Object.assign(added, clean); else st.edits[id] = { ...(st.edits[id] || {}), ...clean };
        store.set('aa.fleet', st);
        onChanged('fleet', `Updated #${id} on the roster`);
        return vehicles().find((v) => v.id === id);
      },
    },
    {
      name: 'add_vehicle',
      description: 'Add a newly acquired vehicle to the roster. Returns it with its new id.',
      inputSchema: { type: 'object', properties: { year: { type: 'integer' }, make: { type: 'string' }, model: { type: 'string' }, miles: { type: 'integer' }, plate: { type: 'string' }, vin: { type: 'string' }, nickname: { type: 'string' }, role: { type: 'string' }, notes: { type: 'string' } }, required: ['year', 'make', 'model'] },
      execute(i) {
        const year = Math.round(Number(i.year));
        if (!(year > 1990 && year < 2036) || !i.make || !i.model) throw new Error('year, make and model are required');
        const st = fleetState();
        const id = vehicles().reduce((m, v) => Math.max(m, v.id), 0) + 1;
        const v = { id, nickname: String(i.nickname || `${year} ${i.make} ${i.model}`).slice(0, 80), year, make: String(i.make).slice(0, 40), model: String(i.model).slice(0, 60), plate: String(i.plate || '').slice(0, 20), miles: Math.max(0, Math.round(Number(i.miles) || 0)), vin: String(i.vin || '').slice(0, 17), status: 'active', role: String(i.role || '').slice(0, 200), notes: String(i.notes || '').slice(0, 300) };
        st.added.push(v); store.set('aa.fleet', st);
        onChanged('fleet', `Added #${id} to the roster`);
        return v;
      },
    },
  ];

  // ------------------------------------------------------------ Claude
  let sample = null, canImages = false, canTools = false;
  (window.claude?.use ? window.claude.use('sample') : Promise.resolve(null)).then(async (s) => {
    sample = s;
    if (!s) return;
    const lim = await s.limits().catch(() => null);
    canImages = Boolean(lim?.images);
    canTools = Boolean(lim?.tools);
  });
  let tier = store.get('aa.tier', 'complex');
  const modelBtn = $('#model');
  const paintModel = () => { modelBtn.dataset.on = String(tier === 'complex'); $('#modelLabel').textContent = tier === 'complex' ? 'Deep Think' : 'Fast Answer'; modelBtn.title = tier === 'complex' ? 'Most capable model, thinks longer' : 'Quicker, lighter answers'; };
  paintModel();
  modelBtn.addEventListener('click', () => { tier = tier === 'complex' ? 'default' : 'complex'; store.set('aa.tier', tier); paintModel(); });

  // ------------------------------------------------------------ markdown (escape first, then a safe subset)
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function inline(s) {
    const codes = [];
    s = s.replace(/`([^`]+)`/g, (_, c) => (codes.push(c), `\u0000${codes.length - 1}\u0000`));
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`);
    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+[^\s<).,;:!?'"])/g, (_, p, u) => `${p}<a href="${u}" target="_blank" rel="noopener noreferrer">${u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 48)}</a>`);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>').replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>');
    return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[i]}</code>`);
  }
  function md(src) {
    const lines = esc(src).split('\n');
    let out = '', i = 0;
    const isRow = (l) => /^\s*\|.*\|\s*$/.test(l);
    const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
    while (i < lines.length) {
      const l = lines[i];
      if (/^\s*```/.test(l)) { let code = ''; i++; while (i < lines.length && !/^\s*```/.test(lines[i])) code += lines[i++] + '\n'; i++; out += `<pre><code>${code}</code></pre>`; continue; }
      if (isRow(l) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        const head = cells(l); i += 2; let body = '';
        while (i < lines.length && isRow(lines[i])) body += `<tr>${cells(lines[i++]).map((c) => `<td>${c}</td>`).join('')}</tr>`;
        out += `<div class="tbl"><table><thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`; continue;
      }
      let m;
      if ((m = l.match(/^\s*(#{1,4})\s+(.*)$/))) { out += `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`; i++; continue; }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { out += '<hr>'; i++; continue; }
      if (/^\s*&gt;\s?/.test(l)) { const q = []; while (i < lines.length && /^\s*&gt;\s?/.test(lines[i])) q.push(lines[i++].replace(/^\s*&gt;\s?/, '')); out += `<blockquote>${inline(q.join('<br>'))}</blockquote>`; continue; }
      if (/^\s*([-*•])\s+/.test(l) || /^\s*\d+[.)]\s+/.test(l)) {
        const ordered = /^\s*\d+[.)]\s+/.test(l);
        const re = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*•]\s+/;
        const items = [];
        while (i < lines.length && (re.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
          if (re.test(lines[i])) items.push(lines[i].replace(re, '')); else items[items.length - 1] += ' ' + lines[i].trim();
          i++;
        }
        const tag = ordered ? 'ol' : 'ul';
        out += `<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</${tag}>`; continue;
      }
      if (!l.trim()) { i++; continue; }
      const p = [];
      while (i < lines.length && lines[i].trim() && !/^\s*(#{1,4}\s|```|[-*•]\s|\d+[.)]\s|&gt;)/.test(lines[i]) && !isRow(lines[i])) p.push(lines[i++]);
      if (!p.length) p.push(lines[i++]);
      out += `<p>${inline(p.join('<br>'))}</p>`;
    }
    return out;
  }
  const OPTS_RE = /\[\[options:\s*([^\]]*)\]\]\s*$/;
  const visible = (t) => t.replace(OPTS_RE, '').replace(/\[\[[^\]]*\]?$/, '').replace(/\[$/, '').trimEnd();

  // ------------------------------------------------------------ conversation
  let history = [];
  const saved = store.get('aa.thread', null);
  if (saved && Date.now() - saved.at < 8 * 3600e3 && saved.history?.length) history = saved.history;
  const persist = () => store.set('aa.thread', { at: Date.now(), history });
  const setChatting = (on) => frame.classList.toggle('chatting', on);
  const scrollDown = () => { thread.scrollTop = thread.scrollHeight; };

  function renderUser(h) {
    const el = document.createElement('div');
    el.className = 'msg user';
    el.textContent = h.text;
    if (h.files?.length) { const f = document.createElement('span'); f.className = 'files'; f.textContent = 'Attached: ' + h.files.join(', '); el.appendChild(f); }
    thread.appendChild(el);
  }
  function fillBot(el, text, final) {
    el.querySelector('.md').innerHTML = md(visible(text));
    el.querySelectorAll('.opts').forEach((x) => x.remove());
    if (!final) return;
    const m = text.match(OPTS_RE);
    if (m && el === thread.lastElementChild) {
      const o = document.createElement('div'); o.className = 'opts';
      m[1].split('|').map((x) => x.trim()).filter(Boolean).slice(0, 6).forEach((label) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
        b.addEventListener('click', () => ask(label));
        o.appendChild(b);
      });
      el.appendChild(o);
    }
  }
  function renderBot(h) {
    const el = document.createElement('div');
    el.className = 'msg bot';
    el.innerHTML = '<div class="md"></div>';
    thread.appendChild(el);
    fillBot(el, h.text, true);
  }
  function renderAll() {
    thread.innerHTML = '';
    history.forEach((h) => (h.role === 'user' ? renderUser(h) : renderBot(h)));
    setChatting(history.length > 0);
    requestAnimationFrame(scrollDown);
  }
  renderAll();

  // ------------------------------------------------------------ attachments (images to Claude; text files inline)
  let files = []; // {name, image?: Blob, text?: string}
  const pillBox = $('#attachments');
  function renderPills() {
    pillBox.innerHTML = '';
    files.forEach((f, i) => {
      const p = document.createElement('span'); p.className = 'pill';
      p.innerHTML = '<span></span><button type="button" aria-label="Remove">×</button>';
      p.firstChild.textContent = f.name;
      p.lastChild.addEventListener('click', () => { files.splice(i, 1); renderPills(); });
      pillBox.appendChild(p);
    });
    pillBox.classList.toggle('has', files.length > 0);
  }
  $('#attach').addEventListener('click', () => $('#file').click());
  $('#file').addEventListener('change', async (e) => {
    for (const file of [...e.target.files].slice(0, 6)) {
      if (file.type.startsWith('image/')) {
        if (canImages) files.push({ name: file.name, image: file });
        else note("Photos can't be sent from this view. Describe the vehicle in text instead.");
      } else if (/\.(csv|tsv|txt|md|json)$/i.test(file.name) || file.type.startsWith('text/')) {
        files.push({ name: file.name, text: (await file.text()).slice(0, 20000) });
      } else {
        note(`${file.name}: this version reads photos and text/CSV files. Paste the key numbers from a PDF instead.`);
      }
    }
    e.target.value = '';
    renderPills();
    input.focus();
  });
  function note(text) {
    setChatting(true);
    const el = document.createElement('div');
    el.className = 'msg bot';
    el.innerHTML = '<div class="md"></div>';
    el.querySelector('.md').innerHTML = md(`**Heads up:** ${text}`);
    thread.appendChild(el);
    scrollDown();
  }

  // ------------------------------------------------------------ asking
  const ERRORS = {
    not_granted: 'The Advisor needs permission to use Claude on your account. Reload the page and choose Allow.',
    sampling_disabled: "Claude isn't available on this account, so the Advisor can't answer here.",
    rate_limited: "You've hit a usage limit for the moment. Give it a minute and ask again.",
    session_expired: 'Sign in to Claude again, then reload this page.',
    refused: "I can't help with that one. Ask me anything about the fleet or the business.",
    prompt_too_large: 'This conversation got too long. Tap New Chat and ask again.',
    empty_completion: 'No answer came back. Try rephrasing the question.',
    image_rejected: "That photo couldn't be read. Try a JPEG or PNG under 20 MB.",
  };
  let controller = null;
  const MAX_CHARS = 52000;
  function turnsFor(newText) {
    const base = instructions();
    const turns = history.map((h) => ({ role: h.role, content: h.role === 'user' && h.files?.length ? `${h.text}\n\n[Attached: ${h.files.join(', ')}]` : h.text || '…' }));
    turns.push({ role: 'user', content: newText });
    let size = base.length + turns.reduce((s, t) => s + t.content.length, 0);
    while (turns.length > 1 && size > MAX_CHARS) { size -= turns.shift().content.length; }
    while (turns.length && turns[0].role !== 'user') turns.shift();
    return [{ role: 'user', content: base }, ...turns];
  }

  async function ask(text) {
    text = (text || '').trim();
    if (controller) return;
    if (!text && !files.length) { input.focus(); return; }
    if (!text) text = 'Take a look at what I attached and tell me what matters.';
    const sending = files; files = []; renderPills();
    const userTurn = { role: 'user', text, files: sending.map((f) => f.name) };
    const textForClaude = [
      ...sending.filter((f) => f.text).map((f) => `Attached file "${f.name}":\n\n${f.text}`),
      sending.some((f) => f.image) ? `(${sending.filter((f) => f.image).length} photo(s) attached.)` : '',
      text,
    ].filter(Boolean).join('\n\n');
    const turns = turnsFor(textForClaude);
    history.push(userTurn);
    input.value = ''; autosize();
    setChatting(true);
    renderUser(userTurn);
    const bot = { role: 'assistant', text: '' };
    const el = document.createElement('div');
    el.className = 'msg bot';
    el.innerHTML = '<div class="md"></div><div class="status"><i></i><span>Thinking…</span></div>';
    thread.appendChild(el);
    scrollDown();
    const setStatus = (t) => { const s = el.querySelector('.status span'); if (s) s.textContent = t; };
    onChanged = (what, label) => { setStatus(label); if (drawerKind === what) openDrawer(what); };

    if (!sample) {
      bot.text = 'The Advisor answers through Claude. Open this link in a browser where you are signed in to claude.ai, then ask again.';
      return finish();
    }
    controller = new AbortController();
    card.classList.add('busy');
    $('#send').setAttribute('aria-label', 'Stop');
    let raf = 0;
    const paint = () => { raf = 0; const near = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 140; fillBot(el, bot.text, false); if (near) scrollDown(); };
    const images = sending.filter((f) => f.image).map((f) => f.image);
    try {
      const res = await sample(turns, {
        modelTier: tier,
        cache: false,
        signal: controller.signal,
        ...(canTools ? { tools: TOOLS } : {}),
        ...(images.length ? { images } : {}),
        onText: ({ text: t }) => { bot.text = t; setStatus('Writing…'); if (!raf) raf = requestAnimationFrame(paint); },
      });
      bot.text = res.text;
      if (res.truncated) bot.text += '\n\n_That answer ran long and got cut off. Ask me to continue._';
    } catch (e) {
      if (e?.code === 'refused') bot.text = '';
      else if (e?.text) bot.text = e.text;
      if (e?.code !== 'cancelled') {
        const msg = ERRORS[e?.code] || 'The connection to Claude dropped. Ask again in a moment.';
        bot.text += (bot.text ? '\n\n' : '') + `**Heads up:** ${msg}`;
      }
    } finally {
      if (raf) cancelAnimationFrame(raf);
    }
    finish();

    function finish() {
      controller = null;
      card.classList.remove('busy');
      $('#send').setAttribute('aria-label', 'Ask');
      el.querySelector('.status')?.remove();
      if (!bot.text.trim()) bot.text = '_Stopped._';
      history.push(bot);
      fillBot(el, bot.text, true);
      persist();
      scrollDown();
    }
  }

  function autosize() {
    if (getComputedStyle(input).position === 'absolute') return;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 180) + 'px';
  }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); } });
  $('#send').addEventListener('click', (e) => { e.preventDefault(); if (controller) controller.abort(); else ask(input.value); });
  const shortPh = () => { input.placeholder = innerWidth < 600 ? 'Ask me anything about the fleet…' : 'Should I swap an Aviator for a new XTS? Ask me anything about the fleet...'; };
  shortPh(); addEventListener('resize', shortPh);

  const PROMPTS = {
    swap: 'Which vehicles should I swap out first, and what should replace them? Rank them, show the math, and tell me the timing.',
    idle: 'Which of my vehicles are underused, and exactly how can I make more money with each of them in the next 30 days?',
    play: "Give me today's highest-probability profit play for Absolute Transportation: something I can start today, based on the season, my fleet and my market.",
    playbook: "Build me a 90-day playbook to grow Absolute Transportation's profit: fleet moves, pricing, and new contracts, ranked by impact and likelihood of success.",
    seasons: "What's coming up in the next 60 days between Boston and New Jersey (events, holidays, peak travel dates), and how should I price and position the fleet for each?",
  };
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    e.preventDefault();
    const act = t.dataset.act;
    $('#menu').checked = false;
    if (PROMPTS[act]) return ask(PROMPTS[act]);
    if (act === 'fleet' || act === 'notes') return openDrawer(act);
    if (act === 'new' || act === 'home') {
      if (controller) controller.abort();
      if (act === 'new' || history.length) { history = []; store.del('aa.thread'); renderAll(); }
      input.focus();
    }
  });

  // ------------------------------------------------------------ drawer: fleet + notes
  const drawer = $('#drawer');
  let drawerKind = null;
  function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); drawerKind = null; }
  drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDrawer(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  function openDrawer(kind) {
    drawerKind = kind;
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    const body = $('#drawerBody');
    if (kind === 'fleet') {
      $('#drawerTitle').textContent = 'Your fleet';
      $('#drawerSub').textContent = 'Sorted by replacement priority. Tap any vehicle for a verdict.';
      const r = report(), s = r.summary;
      const list = r.vehicles.slice().sort((a, b) => b.replacePriority - a.replacePriority);
      body.innerHTML = `
        <div class="tiles">
          <div class="tile"><b>${s.activeCount}</b><span>active units</span></div>
          <div class="tile"><b>${s.over200k}</b><span>at 200k+ mi</span></div>
          <div class="tile"><b>${n(Math.round(s.avgMiles / 1000))}k</b><span>avg miles</span></div>
          <div class="tile"><b>${s.avgAge}</b><span>avg age (yrs)</span></div>
        </div>
        <input class="search" id="fleetSearch" placeholder="Search: Aviator, L01588L, Mach-E, 200k…" aria-label="Search fleet">
        <div class="vlist" id="vlist"></div>
        <p class="empty">Roster from the GPS tracker screenshots. Tell the Advisor about new mileage, sales or purchases and it updates this list in this browser.</p>`;
      const vlist = $('#vlist');
      const draw = (q) => {
        q = (q || '').toLowerCase();
        vlist.innerHTML = '';
        list.filter((v) => !q || `${v.nickname} ${v.year} ${v.make} ${v.model} ${v.plate} ${v.segment} ${v.flags.join(' ')} ${v.status}`.toLowerCase().includes(q)).forEach((v) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'v';
          b.innerHTML = `<span><span class="t"></span><br><span class="m"></span></span><span><span class="mi">${n(v.miles)} mi</span><br><span class="m">~${n(Math.round(v.milesPerYear / 1000))}k/yr</span></span><span class="bar"><i style="width:${v.replacePriority}%"></i></span><span class="fl"></span>`;
          b.querySelector('.t').textContent = `${v.year} ${v.make} ${v.model}`;
          b.querySelector('.m').textContent = `${v.nickname}${v.plate && !v.nickname.includes(v.plate) ? ' · ' + v.plate : ''} · ${v.segment}${(v.status || 'active') !== 'active' ? ' · ' + v.status.toUpperCase() : ''}${v.role ? ' · ' + v.role : ''}`;
          const fl = b.querySelector('.fl');
          v.flags.forEach((f) => { const em = document.createElement('em'); em.textContent = f; if (/replace|exit|heavy/.test(f)) em.className = 'hot'; fl.appendChild(em); });
          b.addEventListener('click', () => {
            closeDrawer();
            ask(`Give me your verdict on #${v.id}, ${v.nickname} (${v.year} ${v.make} ${v.model}${v.plate ? ', ' + v.plate : ''}, ${n(v.miles)} mi): keep, reassign, or sell? What's it worth, and what should replace it?`);
          });
          vlist.appendChild(b);
        });
      };
      draw('');
      $('#fleetSearch').addEventListener('input', (e) => draw(e.target.value));
    } else {
      $('#drawerTitle').textContent = 'What I remember';
      $('#drawerSub').textContent = 'Facts I use in every answer, kept in this browser. Remove anything out of date.';
      const notes = loadNotes();
      if (!notes.length) {
        body.innerHTML = '<div class="empty">Nothing saved yet. As we talk, I\'ll remember what matters: your rates, which cars do which jobs, your key clients and goals. You can also just tell me: “Remember that our airport rate to JFK is $325.”</div>';
        return;
      }
      body.innerHTML = '';
      notes.slice().reverse().forEach((x) => {
        const row = document.createElement('div'); row.className = 'note';
        row.innerHTML = '<p></p><button class="x" type="button" aria-label="Delete note">×</button>';
        row.querySelector('p').textContent = x.text;
        const small = document.createElement('small'); small.textContent = `${x.category} · ${x.date}`;
        row.querySelector('p').appendChild(small);
        row.querySelector('button').addEventListener('click', () => { deleteNote(x.id); row.remove(); });
        body.appendChild(row);
      });
    }
  }
})();
