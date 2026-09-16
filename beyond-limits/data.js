/* ══════════════════════════════════════════════════════════════
   Beyond Limits Connect — demo dataset
   Modeled on the real 2024-27 BL Families workbook: 113 active families,
   4 programs, 9 codes sitting in the workbook — one family holding two of
   them — and 105 families carrying none.
   ══════════════════════════════════════════════════════════════ */

const BL = (() => {

  /* deterministic pseudo-random so every reload shows the same school */
  let _s = 20260909;
  const rnd = () => (_s = (_s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));

  const PROGRAMS = {
    Main:      { key:'Main',      label:'Main',      tag:'main',      color:'#1F6FEB', blurb:'Core tutoring & mentoring' },
    Horizons:  { key:'Horizons',  label:'Horizons',  tag:'horizons',  color:'#6E56CF', blurb:'Horizons at New Canaan partnership' },
    SCSE:      { key:'SCSE',      label:'SCSE',      tag:'scse',      color:'#0E9F6E', blurb:'Stamford Charter School for Excellence' },
    Starfish:  { key:'Starfish',  label:'Starfish',  tag:'starfish',  color:'#B8790B', blurb:'Starfish cohort — added Sept 2026' },
    BFFS:      { key:'BFFS',      label:'BFFS',      tag:'bffs',      color:'#D93A45', blurb:'Unlabeled group in Andy’s dashboard — 13 families, all 9th/10th grade' }
  };

  const FIRST = ['Ethan','Annabella','Anthony','Mia','Jayden','Sofia','Marcus','Camila','Elijah','Valentina','Isaiah','Luna','Josiah','Emely','Nathaniel','Genesis','Caleb','Nayeli','Andre','Yaretzi','Damari','Kimberly','Jaylen','Estrella','Malachi','Britney','Amir','Jazmin','Devon','Adriana','Kaden','Melany','Terrence','Wilnise','Jordan','Fabiola','Tyrese','Rosalie','Xavier','Dariana','Micah','Kenia','Omar','Yamilet','Darnell','Leydi','Kevin','Marisol','Joel','Nathalie','Samir','Dulce','Trey','Katerin','Brandon','Aliyah','Jonas','Perla','Ruben','Shanice','Diego','Naomi','Kelvin','Arianna','Manuel','Zuri','Edwin','Iliana','Tobias','Marielys','Sean','Jocelyn','Hector','Abigail','Roland','Solange','Nasir','Paola','Ivan','Destiny','Byron','Milagros','Cedric','Kayla','Angel','Vianney','Darius','Britany','Elias','Mireya','Hassan','Odalys','Quincy','Wendy','Rashad','Yesenia','Simon','Karla','Dante','Lisbeth','Emmanuel','Tatiana','Cristian','Aracely','Malik','Belkis','Gio','Nadia','Roberto','Sarai','Julien','Esmeralda'];
  const LAST = ['Shalauddin','Rojas','Lopez','Guzman','Pierre-Louis','Mendoza','Alvarado','Jean-Baptiste','Ramirez','Osei','Castillo','Duverge','Nguyen','Perez','Toussaint','Vasquez','Almonte','Beauvais','Cordero','Etienne','Figueroa','Gomes','Hernandez','Innocent','Joseph','Kouassi','Lara','Marte','Narcisse','Ortiz','Paulino','Quezada','Reyes','Saint-Fleur','Tavarez','Ureña','Valdez','Wilson','Ximenes','Yepez','Zapata','Aguilar','Baptiste','Colon','Delgado','Espinal','Fernandez','Garcia','Hyppolite','Ibarra','Jimenez','Kadri','Leon','Moreno','Nunez','Oviedo','Peña','Rosario','Santana','Torres','Ulloa','Vargas','Williams','Zelaya','Amaya','Bonilla','Cruz','Diaz','Escobar','Flores','Grullon','Hidalgo','Iglesias','Javier','Khan','Lucas','Montero','Nieves','Olivares'];
  const GUARD = ['Mother','Father','Grandmother','Aunt','Guardian','Grandfather','Stepmother'];
  const LANGS  = ['English','English','English','Spanish','Spanish','Spanish','Haitian Creole','Portuguese'];
  const SCHOOLS = ['Rippowam MS','Cloonan MS','Turn of River MS','Dolan MS','Westhill HS','Stamford HS','AITE','SCSE','Roxbury ES','Hart Magnet'];

  const pad = n => String(n).padStart(4, '0');
  const iso = (y,m,d) => `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  /* ── families ── */
  const families = [];
  let seq = 0;

  const make = (over = {}) => {
    seq++;
    const first = over.first || pick(FIRST);
    const last  = over.last  || pick(LAST);
    const grade = over.grade ?? int(4, 10);
    const programs = over.programs || ['Main'];
    const lang = over.lang || pick(LANGS);
    const f = {
      id: 'f' + seq,
      first, last,
      name: `${last}, ${first}`,
      guardian: over.guardian || `${pick(FIRST)} ${last}`,
      guardianRole: pick(GUARD),
      grade,
      school: over.school || (programs.includes('SCSE') ? 'SCSE' : pick(SCHOOLS)),
      programs,
      lang,
      phone: over.phone || `203-${int(200,899)}-${int(1000,9999)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g,'')}@email.com`,
      joined: over.joined || iso(int(2024,2026), int(1,12), int(1,28)),
      code: over.code ?? null,
      extraCode: over.extraCode || null,
      agreement: over.agreement ?? (rnd() > .12),
      channel: rnd() > .25 ? 'SMS' : 'Email',
      flags: over.flags ? [...over.flags] : [],
      attendance: over.attendance || Array.from({length:8}, () => rnd() > .16 ? 1 : 0),
      notes: over.notes || null
    };
    if (!f.code) f.flags.push('no-code');
    families.push(f);
    return f;
  };

  /* the three cases Andy walked through on the 5 Sept Zoom */
  make({ first:'Ethan', last:'Shalauddin', grade:8, programs:['Main','SCSE'], lang:'English',
         phone:'203-570-8219', joined:'2026-06-03', school:'SCSE', agreement:true,
         flags:['duplicate','two-codes'], guardian:'Rahima Shalauddin',
         code:'BLA-2026-0002', extraCode:'BLA-2026-0003',
         notes:'Submitted the agreement twice — Main 3 Jun 2026, SCSE 6 Jun 2026. Same name, same DOB (05/26/2013), same address. Two different codes were issued. Both submissions were correct; the system created the second identity.' });

  make({ first:'Annabella', last:'Rojas', grade:9, programs:['Main','SCSE'], lang:'Spanish',
         joined:'2024-11-08', flags:['duplicate'], guardian:'Marisol Rojas', agreement:true, code:'BLA-2026-0001',
         notes:'Main 8 Nov 2024, SCSE 5 Dec 2024. Waiting on Andy: which record survives the merge.' });

  make({ first:'Anthony', last:'Lopez', grade:10, programs:['Main','Starfish'], lang:'Spanish',
         joined:'2025-01-02', flags:['duplicate','pasted'], guardian:'Zoraida Lopez', agreement:true,
         notes:'Three rows: Main 2 Jan 2025, Main again 4 Sep 2025, plus a Starfish row copied from the second. Needs Andy’s call.' });

  /* the other three Starfish rows — pasted in, never submitted a Starfish agreement */
  ['Guzman','Duverge','Toussaint'].forEach((ln, i) => {
    make({ first:['Mia','Kelvin','Naomi'][i], last:ln, grade:int(5,8), programs:['Starfish'],
           joined:'2026-09-04', agreement:false, flags:['pasted','no-agreement'],
           notes:'Copied into the Starfish tab by hand on 4 Sept 2026 — never signed a Starfish participation agreement, and the tab has no Participant Code field to write into.' });
  });

  /* Horizons + SCSE cohorts */
  for (let i = 0; i < 20; i++) make({ programs:['Horizons'], school:'Horizons @ New Canaan' });
  for (let i = 0; i < 16; i++) make({ programs:['SCSE'], school:'SCSE' });
  /* BFFS — the 13 nobody has explained, all 9th/10th grade */
  for (let i = 0; i < 13; i++) make({ programs:['Main','BFFS'], grade: rnd() > .5 ? 9 : 10, flags:['unknown-group'] });
  /* the rest of Main */
  while (families.length < 113) make({ programs:['Main'] });

  /* The rest of the codes that exist in the workbook today. Nine in total:
     Ethan holds two of them, and two more were our own test rows — already
     deleted (defect 9), which is why eight families now carry one. */
  const plain = p => families.filter(f => f.programs[0] === p && !f.code && !f.flags.some(x => x !== 'no-code'));
  const give = (f, code) => { if (!f) return; f.code = code; f.flags = f.flags.filter(x => x !== 'no-code'); };
  const [h1, h2] = plain('Horizons'); const [s1, s2] = plain('SCSE'); const [m1, m2] = plain('Main');
  give(h1, 'BLH-2026-0001'); give(h2, 'BLH-2026-0002');
  give(s1, 'BLS-2026-0001'); give(s2, 'BLS-2026-0002');
  give(m1, 'BLA-2026-0004'); give(m2, 'BLA-2026-0005');

  /* a handful of deliberate attendance stories for the nudge engine */
  families[7].attendance  = [1,1,1,0,0,0,1,0];
  families[12].attendance = [1,0,0,0,1,1,1,1];
  families[23].attendance = [0,0,0,1,1,1,1,1];
  families[31].attendance = [1,1,0,0,0,1,0,0];

  /* ── derived counts ── */
  const counts = () => {
    const c = { total: families.length, coded: 0, missing: 0, duplicates: 0, noAgreement: 0, codesIssued: 0, starfishUnsigned: 0, byProgram: {} };
    Object.keys(PROGRAMS).forEach(p => c.byProgram[p] = 0);
    families.forEach(f => {
      f.code ? c.coded++ : c.missing++;
      if (f.code) c.codesIssued++;
      if (f.extraCode) c.codesIssued++;
      if (f.programs.includes('Starfish') && (!f.agreement || f.flags.includes('pasted'))) c.starfishUnsigned++;
      if (f.flags.includes('duplicate')) c.duplicates++;
      if (!f.agreement) c.noAgreement++;
      f.programs.forEach(p => c.byProgram[p] !== undefined && c.byProgram[p]++);
    });
    return c;
  };

  /* ── duplicate candidates the matcher surfaced (name + DOB, never phone alone) ── */
  const matches = [
    {
      id:'m1', confidence:98, status:'open',
      reason:'Exact match on name and date of birth. Two codes issued — BLA-2026-0002 and BLA-2026-0003.',
      left:{ tab:'PA (Main)', row:105, submitted:'3 Jun 2026', name:'Shalauddin, Ethan', dob:'05/26/2013',
             address:'61 West Glen Drive', phone:'203-570-8219', code:'BLA-2026-0002', program:'Main' },
      right:{ tab:'PA (SCSE)', row:16, submitted:'6 Jun 2026', name:'Shalauddin, Ethan', dob:'05/26/2013',
             address:'61 West Glen Drive', phone:'475-257-8689', code:'BLA-2026-0003', program:'SCSE' },
      note:'Andy requires a separate agreement per program — two submissions is correct behavior. Keep both agreements, keep one identity.'
    },
    {
      id:'m2', confidence:94, status:'open',
      reason:'Name and date of birth match. Thirteen months apart, different programs.',
      left:{ tab:'PA (Main)', row:41, submitted:'8 Nov 2024', name:'Rojas, Annabella', dob:'02/14/2011',
             address:'22 Merrell Ave', phone:'203-604-1180', code:'BLA-2026-0001', program:'Main' },
      right:{ tab:'PA (SCSE)', row:9, submitted:'5 Dec 2024', name:'Rojas, Annabella', dob:'02/14/2011',
             address:'22 Merrell Ave', phone:'203-604-1180', code:'—', program:'SCSE' },
      note:'Open question for Andy: which record do we keep as the surviving row?'
    },
    {
      id:'m3', confidence:91, status:'open',
      reason:'Three rows for one student — two Main submissions plus a Starfish row copied from the second.',
      left:{ tab:'PA (Main)', row:62, submitted:'2 Jan 2025', name:'Lopez, Anthony', dob:'09/30/2010',
             address:'140 Fairfield Ave', phone:'203-918-4402', code:'—', program:'Main' },
      right:{ tab:'PA (Main) · PA (Starfish)', row:'88 · 4', submitted:'4 Sep 2025', name:'Lopez, Anthony', dob:'09/30/2010',
             address:'140 Fairfield Ave', phone:'203-918-4402', code:'—', program:'Main + Starfish' },
      note:'The Starfish row was pasted, not submitted — it carries no agreement of its own.'
    }
  ];

  /* ── communication feed ── */
  const posts = [
    { id:'p1', author:'Andy Sklover', initials:'AS', when:'Yesterday · 4:12 PM', audience:'All families · 113',
      title:'Fall schedule is live',
      body:'Tutoring resumes Tuesday 9/15 at the Yerwood Center, 4:30–6:00 PM. Bring your Chromebook and your math packet. Reply here if your pickup time has changed.',
      sent:113, delivered:111, read:96, replies:14, langs:['EN','ES','HT'] },
    { id:'p2', author:'Andy Sklover', initials:'AS', when:'Mon · 9:05 AM', audience:'Horizons · 21',
      title:'Horizons bus change — New Canaan',
      body:'The 3:45 pickup moves to the Fairfield Ave entrance starting this week. Same driver, same time, new door.',
      sent:21, delivered:21, read:19, replies:3, langs:['EN','ES'] },
    { id:'p3', author:'Beyond Limits Connect', initials:'BL', when:'Mon · 8:00 AM', audience:'4 families · automated',
      title:'Attendance check-in (automated)',
      body:'“We missed {student} the last two sessions. Everything okay? Reply 1 to keep the spot, 2 if you need to pause.” — sent in each family’s preferred language.',
      sent:4, delivered:4, read:4, replies:3, langs:['EN','ES'], automated:true },
    { id:'p4', author:'Andy Sklover', initials:'AS', when:'Fri · 2:30 PM', audience:'SCSE · 17',
      title:'Participation agreements — last call',
      body:'Three SCSE families still owe a signed agreement. The link below takes two minutes on a phone.',
      sent:17, delivered:17, read:12, replies:5, langs:['EN','ES'] }
  ];

  /* ── nudge rules ── */
  const rules = [
    { id:'r1', on:true,  name:'Two sessions missed', trigger:2, window:'rolling 3 weeks', audience:'All programs',
      channel:'SMS + app', message:'Hi {guardian} — we missed {student} at the last {count} sessions. Everything alright? Reply 1 to keep the spot, 2 to pause for a week.',
      fired:4, replied:3 },
    { id:'r2', on:true,  name:'Three in a row', trigger:3, window:'consecutive', audience:'All programs',
      channel:'SMS + Andy alerted', message:'{student} has missed 3 sessions in a row. Andy will call today — reply here if a different time works better.',
      fired:1, replied:1 },
    { id:'r3', on:false, name:'Agreement still unsigned', trigger:7, window:'days after signup', audience:'New families',
      channel:'SMS with QR link', message:'Welcome to Beyond Limits! One thing left: the participation agreement for {program}. Two minutes on your phone → {link}',
      fired:0, replied:0 },
    { id:'r4', on:true,  name:'Perfect month', trigger:8, window:'8 of 8 sessions', audience:'All programs',
      channel:'App post + email', message:'{student} showed up to every session this month. That is the whole game. Thank you for getting them here.',
      fired:26, replied:9 }
  ];

  /* ── onboarding / orientation script (Andy edits this himself) ── */
  const script = [
    { k:'Greeting', v:'Welcome to Beyond Limits Academics. I’ll walk you through orientation — about four minutes, and you can stop any time.' },
    { k:'Affiliation', v:'First: which program is your child joining? Main, Horizons, Stamford Charter School for Excellence, or Starfish?' },
    { k:'What we do', v:'Free tutoring and mentoring for Stamford students in grades 4 through 10. We meet twice a week, and every student is paired with a tutor who stays with them.' },
    { k:'Agreement', v:'Each program has its own participation agreement. Yours is for {program} — I’ll show the QR code at the end.' },
    { k:'Communication', v:'We’re moving from Remind to ParentSquare. Until we switch over, keep using Remind — I’ll tell you the day it changes.' },
    { k:'Handoff', v:'Anything I can’t answer goes straight to Andy. Tap “Talk to a person” and he’ll call you back the same day.' }
  ];

  const botFlow = [
    { from:'bot', text:'Hi! I’m the Beyond Limits orientation guide. Four minutes, and you can stop any time. 👋' },
    { from:'bot', text:'Which program is your child joining?', options:['Main','Horizons','SCSE','Starfish'] },
    { from:'me',  text:'Horizons' },
    { from:'bot', text:'Horizons it is. Horizons families meet Tuesdays and Thursdays, 4:30–6:00, with transport from New Canaan.' },
    { from:'bot', text:'Your participation agreement is the Horizons one — different from the Main form, so this is the right link for you.' },
    { from:'bot', text:'Here is your QR code. Scan it with your phone camera, sign, and you are done.', qr:true },
    { from:'bot', text:'Would you rather keep going in Spanish?', options:['Sí, en español','Stay in English','Talk to a person'] }
  ];

  /* ── ParentSquare field mapping ── */
  const mapping = [
    { bl:'Participant Code',      ps:'student_sis_id',        note:'The whole reason this project exists' },
    { bl:'Student first / last',  ps:'student_first_name / student_last_name' },
    { bl:'Grade',                 ps:'grade_level' },
    { bl:'Program',               ps:'group_name',            note:'Editable — a transfer never changes the code' },
    { bl:'Guardian name',         ps:'parent_first_name / parent_last_name' },
    { bl:'Mobile',                ps:'parent_mobile' },
    { bl:'Email',                 ps:'parent_email' },
    { bl:'Preferred language',    ps:'preferred_language',    note:'Missing from the Master today — added here' },
    { bl:'School',                ps:'school_name' }
  ];

  /* ── the nine defects found in the live workbook, 7 Sept 2026 ── */
  const defects = [
    { n:1, state:'open',  title:'The Master has no participant code column', body:'Built in 2024, codes arrived in 2026. Even after every family is coded, Andy’s main view shows nothing. Connect rebuilds the Master off the family list.' },
    { n:2, state:'open',  title:'No preferred-language field on the Master', body:'ParentSquare wants preferred_language on import. It exists nowhere in the workbook today.' },
    { n:3, state:'fixed', title:'Starfish form has no Participant Code question', body:'The script had nowhere to write. Field added, form re-published.' },
    { n:4, state:'fixed', title:'The Starfish tab is structurally broken', body:'Row 1 headers copied from Main, rows 2–5 pasted families, rows 6–9 blank, row 10 the form’s real header shifted one column across. Restructured before anything else touched it.' },
    { n:5, state:'open',  title:'Starfish appears nowhere in the Master', body:'Those four families are invisible in the summary — and in every count Andy reads off it.' },
    { n:6, state:'fixed', title:'SCSE carries a stray 38th column titled “Column 37”', body:'Ethan Shalauddin’s code was parked outside the real Participant Code field. That is why Andy saw a code and our copy showed the cell empty.' },
    { n:7, state:'fixed', title:'The script does not recognize Starfish', body:'Missing from the lookup table, matching none of the fallback patterns.' },
    { n:8, state:'fixed', title:'The script guessed where to write codes', body:'If it could not find the Participant Code column it wrote to column 37 anyway. Guessing where a child’s identifier goes is how codes end up on the wrong family. Removed in v2.' },
    { n:9, state:'fixed', title:'A test row is showing inside Andy’s Master view', body:'Ours. Deleted, along with the three empty leftover tabs.' },
    { n:'★', state:'risk', title:'The workbook and the script sit on a personal account', body:'Every name, birthday, address, phone, income and ethnicity — plus the code generator — live on a personal Gmail, running on RJ’s login. Transferring ownership does not carry the triggers over; they must be recreated afterwards or code generation silently stops.' }
  ];

  const activity = [
    { ico:'code',  t:'<b>BL-2026-0011</b> issued to Reyes, Jordan — first code under the new single series', time:'3 minutes ago' },
    { ico:'merge', t:'Merge held for review: <b>Shalauddin, Ethan</b> — 98% match, two codes', time:'18 minutes ago' },
    { ico:'msg',   t:'Attendance nudge sent to <b>4 families</b> · 3 replied within the hour', time:'Today, 8:00 AM' },
    { ico:'check', t:'<b>Starfish</b> tab restructured — code field added, 4 rows realigned', time:'Yesterday, 6:41 PM' },
    { ico:'warn',  t:'<b>3 SCSE families</b> still owe a participation agreement', time:'Yesterday, 2:30 PM' },
    { ico:'code',  t:'Format migration staged: <b>BLA / BLH / BLS → BL-2026-####</b>', time:'Sat, 11:02 AM' }
  ];

  const openQuestions = [
    'Which copy survives for Annabella Rojas and Anthony Lopez?',
    'Has any participant code been used outside the spreadsheet — printed, texted, in a calendar?',
    'What is BFFS? Thirteen families, all 9th or 10th grade, in no tab.',
    'Who should own the workbook and the script? Both sit on a personal account today.',
    'Do the four Starfish families need to sign a real Starfish agreement?',
    'Can we get ParentSquare’s import format before we shape the data to it?'
  ];

  /* keep the demo copy honest: anything that quotes a number reads it off the data */
  const c0 = counts();
  const scseUnsigned = families.filter(f => f.programs.includes('SCSE') && !f.agreement).length;
  posts[0].audience = `All families · ${c0.total}`;
  posts[0].sent = c0.total; posts[0].delivered = c0.total - 2; posts[0].read = Math.round(c0.total * .85);
  posts[1].audience = `Horizons · ${c0.byProgram.Horizons}`;
  posts[1].sent = posts[1].delivered = c0.byProgram.Horizons; posts[1].read = c0.byProgram.Horizons - 2;
  posts[3].audience = `SCSE · ${c0.byProgram.SCSE}`;
  posts[3].sent = posts[3].delivered = c0.byProgram.SCSE;
  posts[3].read = Math.max(1, c0.byProgram.SCSE - 5);
  posts[3].body = `${scseUnsigned} SCSE families still owe a signed agreement. The link below takes two minutes on a phone.`;

  const firstUncoded = families.find(f => !f.code && !f.flags.some(x => x !== 'no-code')) || families[0];
  activity[0].t = `<b>BL-2026-${String(c0.coded + 1).padStart(4, '0')}</b> is the next number in line — for <b>${firstUncoded.name}</b>, under the new single series`;
  activity[4].t = `<b>${scseUnsigned} SCSE families</b> still owe a participation agreement`;

  return { PROGRAMS, families, counts, matches, posts, rules, script, botFlow, mapping, defects, activity, openQuestions };
})();
