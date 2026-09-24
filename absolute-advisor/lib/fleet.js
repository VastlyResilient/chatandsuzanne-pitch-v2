// Fleet storage + analytics. The roster lives in data/fleet.json so it can be
// edited by hand or by the advisor (via its update tools) without a database.
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FLEET_FILE = path.join(DATA_DIR, 'fleet.json');
const SEED_FILE = path.join(__dirname, '..', 'data', 'fleet.json');

function ensureFleetFile() {
  if (fs.existsSync(FLEET_FILE)) return;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.copyFileSync(SEED_FILE, FLEET_FILE);
}

function loadFleet() {
  ensureFleetFile();
  return JSON.parse(fs.readFileSync(FLEET_FILE, 'utf8'));
}

function saveFleet(fleet) {
  fleet.updated = new Date().toISOString().slice(0, 10);
  const tmp = FLEET_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(fleet, null, 2));
  fs.renameSync(tmp, FLEET_FILE);
}

const LUXURY_MAKES = new Set(['Lincoln', 'Cadillac', 'Mercedes-Benz']);

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

function tierOf(v) {
  const seg = segmentOf(v);
  if (seg === 'Group van') return 'group';
  if (LUXURY_MAKES.has(v.make) || v.model.toLowerCase().includes('suburban')) return 'luxury';
  return 'standard';
}

// Rough in-service age: a model year typically goes on sale the fall before.
function ageYears(v, now = new Date()) {
  const start = new Date(v.year - 1, 9, 1);
  return Math.max(0.75, (now - start) / (365.25 * 864e5));
}

function analyze(v, now = new Date()) {
  const age = ageYears(v, now);
  const pace = Math.round(v.miles / age);
  const tier = tierOf(v);
  const flags = [];
  if (v.miles >= 200000) flags.push('200k+ miles: replace');
  else if (v.miles >= 150000) flags.push('150k+ miles: plan the exit');
  else if (v.miles >= 100000 && tier === 'luxury') flags.push('100k+: past peak resale for a luxury unit');
  if (pace >= 45000) flags.push(`heavy pace (~${Math.round(pace / 1000)}k mi/yr)`);
  if (pace < 8000 && age > 1.5) flags.push(`low use (~${Math.round(pace / 1000)}k mi/yr): verify role`);
  if (now.getFullYear() - v.year >= 10) flags.push('10+ model years old');
  if (/mkt/i.test(v.model)) flags.push('MKT ended production after 2019');
  if (!v.plate || /not provided|confirm/i.test(v.model)) flags.push('tracker record incomplete');
  // Replacement priority: miles dominate, age and client-facing image add weight.
  const raw = v.miles / 3500 + age * 2 + (tier === 'luxury' ? 6 : 0);
  let priority = 100 * (1 - Math.exp(-raw / 60));
  if (v.status && v.status !== 'active') priority = 0;
  return {
    ...v,
    segment: segmentOf(v),
    tier,
    ageYears: Math.round(age * 10) / 10,
    milesPerYear: pace,
    flags,
    replacePriority: Math.round(priority),
  };
}

function fleetReport(now = new Date()) {
  const fleet = loadFleet();
  const vehicles = fleet.vehicles.map((v) => analyze(v, now));
  const active = vehicles.filter((v) => (v.status || 'active') === 'active');
  const by = (key) => active.reduce((acc, v) => ((acc[v[key]] = (acc[v[key]] || 0) + 1), acc), {});
  const totalMiles = active.reduce((s, v) => s + v.miles, 0);
  const models = {};
  for (const v of active) {
    const k = `${v.make} ${v.model}`;
    (models[k] = models[k] || []).push(v);
  }
  return {
    company: fleet.company,
    updated: fleet.updated,
    source: fleet.source,
    vehicles,
    summary: {
      activeCount: active.length,
      retiredCount: vehicles.length - active.length,
      byMake: by('make'),
      bySegment: by('segment'),
      byTier: by('tier'),
      totalMiles,
      avgMiles: active.length ? Math.round(totalMiles / active.length) : 0,
      over200k: active.filter((v) => v.miles >= 200000).length,
      over150k: active.filter((v) => v.miles >= 150000).length,
      avgAge: active.length ? Math.round((active.reduce((s, v) => s + v.ageYears, 0) / active.length) * 10) / 10 : 0,
      topReplace: [...active].sort((a, b) => b.replacePriority - a.replacePriority).slice(0, 10).map((v) => v.id),
      modelGroups: Object.fromEntries(
        Object.entries(models).map(([k, list]) => [k, list.map((v) => v.id)])
      ),
    },
  };
}

// Compact text roster for the model's context.
function rosterText(report) {
  const lines = report.vehicles.map((v) =>
    [
      `#${v.id}`,
      v.nickname,
      `${v.year} ${v.make} ${v.model}`,
      v.plate || '(no plate on record)',
      `${v.miles.toLocaleString('en-US')} mi`,
      `~${v.milesPerYear.toLocaleString('en-US')} mi/yr`,
      `${v.ageYears} yrs`,
      v.segment,
      `priority ${v.replacePriority}`,
      v.status && v.status !== 'active' ? `STATUS: ${v.status}` : '',
      v.role ? `role: ${v.role}` : '',
      v.flags.length ? `flags: ${v.flags.join('; ')}` : '',
      v.notes ? `notes: ${v.notes}` : '',
      `VIN ${v.vin}`,
    ]
      .filter(Boolean)
      .join(' | ')
  );
  const s = report.summary;
  const groups = Object.entries(s.modelGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([k, ids]) => `${k} ×${ids.length} (#${ids.join(', #')})`)
    .join('\n');
  return `ROSTER (${s.activeCount} active${s.retiredCount ? `, ${s.retiredCount} retired/sold` : ''}; last updated ${report.updated}; source: ${report.source})
Columns: id | tracker nickname | vehicle | plate | odometer | est. annual pace | est. age | segment | replacement priority (0-100, computed) | role/status/flags/notes | VIN
${lines.join('\n')}

UNITS BY MODEL
${groups}

TOTALS: ${s.totalMiles.toLocaleString('en-US')} fleet miles · avg ${s.avgMiles.toLocaleString('en-US')} mi/vehicle · avg age ${s.avgAge} yrs · ${s.over200k} units at 200k+ · ${s.over150k} units at 150k+
By segment: ${Object.entries(s.bySegment).map(([k, n]) => `${k} ${n}`).join(', ')}
By make: ${Object.entries(s.byMake).map(([k, n]) => `${k} ${n}`).join(', ')}`;
}

const EDITABLE = ['nickname', 'plate', 'miles', 'status', 'role', 'notes', 'year', 'make', 'model'];

function updateVehicle(id, changes) {
  const fleet = loadFleet();
  const v = fleet.vehicles.find((x) => x.id === id);
  if (!v) throw new Error(`No vehicle with id ${id}`);
  const applied = {};
  for (const [k, val] of Object.entries(changes || {})) {
    if (!EDITABLE.includes(k)) continue;
    if (k === 'miles' || k === 'year') {
      const n = Math.round(Number(val));
      if (!Number.isFinite(n) || n < 0) throw new Error(`${k} must be a positive number`);
      v[k] = n;
    } else {
      v[k] = String(val).slice(0, 500);
    }
    applied[k] = v[k];
  }
  if (!Object.keys(applied).length) throw new Error(`Nothing to change. Editable fields: ${EDITABLE.join(', ')}`);
  saveFleet(fleet);
  return { id, applied, vehicle: v };
}

function addVehicle(input) {
  const fleet = loadFleet();
  const year = Math.round(Number(input.year));
  if (!year || year < 1990 || year > 2035) throw new Error('year is required (e.g. 2025)');
  if (!input.make || !input.model) throw new Error('make and model are required');
  const id = fleet.vehicles.reduce((m, v) => Math.max(m, v.id), 0) + 1;
  const v = {
    id,
    nickname: String(input.nickname || `${year} ${input.make} ${input.model}`).slice(0, 80),
    year,
    make: String(input.make).slice(0, 40),
    model: String(input.model).slice(0, 60),
    plate: String(input.plate || '').slice(0, 20),
    miles: Math.max(0, Math.round(Number(input.miles) || 0)),
    vin: String(input.vin || '').slice(0, 17),
    tracker: '',
    status: 'active',
    role: String(input.role || '').slice(0, 200),
    notes: String(input.notes || '').slice(0, 500),
  };
  fleet.vehicles.push(v);
  saveFleet(fleet);
  return v;
}

module.exports = { loadFleet, fleetReport, rosterText, updateVehicle, addVehicle, DATA_DIR };
