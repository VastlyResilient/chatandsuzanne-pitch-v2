// Absolute Advisor server: serves the app and streams answers from Claude
// (with live web search) grounded in Komal's fleet roster.
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

try {
  process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
  // No .env file: rely on real environment variables.
}

const { Anthropic } = require('@anthropic-ai/sdk');
const { fleetReport, updateVehicle, addVehicle } = require('./lib/fleet');
const { loadNotes, addNote, deleteNote } = require('./lib/notes');
const { buildSystem } = require('./lib/prompt');
const { demoAnswer } = require('./lib/demo');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const MODEL = process.env.MODEL || 'claude-opus-5';
const EFFORT = process.env.EFFORT || 'high';
const APP_PASSWORD = process.env.APP_PASSWORD || '';
const HAS_KEY = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const DEMO = process.env.DEMO === '1' || !HAS_KEY;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_BODY = 30 * 1024 * 1024;

const client = DEMO ? null : new Anthropic();
let fallbacksSupported = process.env.FALLBACKS !== '0';

// ---------------------------------------------------------------- tools

const CLIENT_TOOLS = [
  {
    name: 'save_note',
    description:
      "Save a durable fact about Komal's business to long-term memory (rates, which vehicles do which jobs, what nickname prefixes mean, key clients, goals, preferences, decisions). Saved notes are shown to you at the start of every future conversation.",
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The fact, written so it makes sense on its own later.' },
        category: { type: 'string', enum: ['rates', 'fleet', 'clients', 'operations', 'goals', 'preferences', 'general'] },
      },
      required: ['text'],
    },
  },
  {
    name: 'delete_note',
    description: 'Delete a saved note that is wrong or out of date. Use the note id shown in brackets, e.g. "n4".',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
  },
  {
    name: 'update_vehicle',
    description:
      'Update a vehicle on the roster by its id (#). Use when Komal reports new mileage, a sale/retirement (status "sold" or "retired"), a role ("airport + corporate", "weddings"), a plate, or a note. Only include fields that change.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'integer', description: 'Roster id (#) of the vehicle.' },
        changes: {
          type: 'object',
          properties: {
            miles: { type: 'integer' },
            status: { type: 'string', description: 'active, sold, retired, in-shop, or for-sale' },
            role: { type: 'string' },
            notes: { type: 'string' },
            plate: { type: 'string' },
            nickname: { type: 'string' },
            model: { type: 'string' },
          },
        },
      },
      required: ['id', 'changes'],
    },
  },
  {
    name: 'add_vehicle',
    description: 'Add a newly acquired vehicle to the roster.',
    eager_input_streaming: true,
    input_schema: {
      type: 'object',
      properties: {
        year: { type: 'integer' },
        make: { type: 'string' },
        model: { type: 'string' },
        miles: { type: 'integer' },
        plate: { type: 'string' },
        vin: { type: 'string' },
        nickname: { type: 'string' },
        role: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['year', 'make', 'model'],
    },
  },
];

function runClientTool(name, input) {
  if (!input || typeof input !== 'object') throw new Error('tool input was not an object');
  switch (name) {
    case 'save_note': {
      if (typeof input.text !== 'string') throw new Error('text must be a string');
      const note = addNote(input.text, input.category);
      return { result: `Saved note ${note.id}.`, status: 'Saved to memory', changed: 'notes' };
    }
    case 'delete_note': {
      if (typeof input.id !== 'string') throw new Error('id must be a string like "n3"');
      deleteNote(input.id);
      return { result: `Deleted note ${input.id}.`, status: 'Removed a note', changed: 'notes' };
    }
    case 'update_vehicle': {
      const id = Number(input.id);
      if (!Number.isInteger(id)) throw new Error('id must be an integer roster id');
      const out = updateVehicle(id, input.changes);
      return { result: JSON.stringify(out), status: `Updated #${id} on the roster`, changed: 'fleet' };
    }
    case 'add_vehicle': {
      const v = addVehicle(input);
      return { result: JSON.stringify(v), status: `Added #${v.id} to the roster`, changed: 'fleet' };
    }
    default:
      throw new Error(`Unknown tool ${name}`);
  }
}

function serverTools(search) {
  if (!search) return [];
  return [
    {
      type: 'web_search_20260209',
      name: 'web_search',
      max_uses: 8,
      user_location: {
        type: 'approximate',
        city: 'North Haven',
        region: 'Connecticut',
        country: 'US',
        timezone: 'America/New_York',
      },
    },
    { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 5 },
  ];
}

// ---------------------------------------------------------------- helpers

function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  const data = isBuf || typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': isBuf || typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('Upload too large (30 MB max).'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function authorized(req) {
  if (!APP_PASSWORD) return true;
  const given = Buffer.from(String(req.headers['x-app-key'] || ''));
  const want = Buffer.from(APP_PASSWORD);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// Accept only the shapes the UI produces: text, base64 images, base64 PDFs.
function sanitizeMessages(raw) {
  if (!Array.isArray(raw) || !raw.length) throw Object.assign(new Error('No messages'), { status: 400 });
  const msgs = raw.slice(-40).map((m) => {
    if (m.role !== 'user' && m.role !== 'assistant') throw Object.assign(new Error('Bad role'), { status: 400 });
    if (typeof m.content === 'string') return { role: m.role, content: m.content.slice(0, 40000) || '…' };
    if (!Array.isArray(m.content)) throw Object.assign(new Error('Bad content'), { status: 400 });
    const content = m.content
      .map((b) => {
        if (b.type === 'text' && typeof b.text === 'string') return { type: 'text', text: b.text.slice(0, 200000) || '…' };
        if (m.role !== 'user') return null;
        if (b.type === 'image' && b.source?.type === 'base64' && IMAGE_TYPES.has(b.source.media_type))
          return { type: 'image', source: { type: 'base64', media_type: b.source.media_type, data: String(b.source.data) } };
        if (b.type === 'document' && b.source?.type === 'base64' && b.source.media_type === 'application/pdf')
          return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: String(b.source.data) } };
        return null;
      })
      .filter(Boolean);
    return { role: m.role, content: content.length ? content : '…' };
  });
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user')
    throw Object.assign(new Error('Last message must be from the user'), { status: 400 });
  return msgs;
}

// After a mid-output fallback, blocks before the last fallback marker that the
// next model cannot continue from must not be echoed back.
function echoableContent(content) {
  const lastFallback = content.map((b) => b.type).lastIndexOf('fallback');
  if (lastFallback < 0) return content;
  const resultIds = new Set(content.filter((b) => b.tool_use_id).map((b) => b.tool_use_id));
  return content.filter((b, i) => {
    if (i >= lastFallback) return true;
    if (['thinking', 'redacted_thinking', 'tool_use'].includes(b.type)) return false;
    if (b.type === 'server_tool_use' && !resultIds.has(b.id)) return false;
    return true;
  });
}

// ---------------------------------------------------------------- chat

async function handleChat(req, res) {
  const body = await readBody(req);
  const search = body.search !== false;
  const messages = sanitizeMessages(body.messages);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const emit = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);
  const controller = new AbortController();
  res.on('close', () => controller.abort());

  if (DEMO) {
    await demoAnswer(messages, emit, controller.signal, HAS_KEY);
    emit({ type: 'done' });
    return res.end();
  }

  const system = buildSystem();
  const tools = [...serverTools(search), ...CLIENT_TOOLS];
  let sentText = false;
  let toolSinceText = false;
  let jsonRetries = 0;

  for (let turn = 0; turn < 10; turn++) {
    const params = {
      model: MODEL,
      max_tokens: 32000,
      system,
      tools,
      messages,
      thinking: { type: 'adaptive' },
      output_config: { effort: EFFORT },
      ...(fallbacksSupported ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' } : {}),
    };

    let message;
    const partialInputs = {};
    try {
      const stream = client.beta.messages.stream(params, { signal: controller.signal });
      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          const b = event.content_block;
          if (b.type === 'text') {
            if (sentText && toolSinceText) emit({ type: 'text', text: '\n\n' });
            toolSinceText = false;
          } else if (b.type === 'server_tool_use') {
            toolSinceText = true;
            partialInputs[event.index] = { name: b.name, json: '' };
            emit({ type: 'status', text: b.name === 'web_fetch' ? 'Reading a page…' : b.name === 'web_search' ? 'Searching the web…' : 'Crunching the results…' });
          } else if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
            emit({
              type: 'sources',
              items: b.content
                .filter((r) => r.type === 'web_search_result')
                .slice(0, 6)
                .map((r) => ({ title: r.title, url: r.url })),
            });
          } else if (b.type === 'tool_use') {
            toolSinceText = true;
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            sentText = true;
            emit({ type: 'text', text: event.delta.text });
          } else if (event.delta.type === 'input_json_delta' && partialInputs[event.index]) {
            partialInputs[event.index].json += event.delta.partial_json;
          }
        } else if (event.type === 'content_block_stop' && partialInputs[event.index]) {
          const p = partialInputs[event.index];
          try {
            const input = JSON.parse(p.json || '{}');
            if (p.name === 'web_search' && input.query) emit({ type: 'status', text: `Searching: ${input.query}` });
            if (p.name === 'web_fetch' && input.url) emit({ type: 'status', text: `Reading ${new URL(input.url).hostname}` });
          } catch {
            // Status line only; ignore unparsable partials.
          }
        }
      }
      message = await stream.finalMessage();
      jsonRetries = 0;
    } catch (err) {
      if (controller.signal.aborted) return res.end();
      if (err instanceof Anthropic.BadRequestError && fallbacksSupported && /fallback/i.test(err.message)) {
        fallbacksSupported = false; // account/platform without server-side fallbacks
        turn--;
        continue;
      }
      if (!(err instanceof Anthropic.APIError) && jsonRetries++ < 2) {
        turn--; // a streamed tool input could not be parsed; re-issue the turn
        continue;
      }
      emit({ type: 'error', text: friendlyError(err) });
      return res.end();
    }

    if (message.stop_reason === 'refusal') {
      if (!sentText) emit({ type: 'text', text: "I can't help with that one, Komal. Ask me anything about the fleet or the business." });
      break;
    }
    if (message.stop_reason === 'pause_turn') {
      messages.push({ role: 'assistant', content: echoableContent(message.content) });
      continue;
    }
    const toolUses = message.content.filter((b) => b.type === 'tool_use');
    if (!toolUses.length) break;
    if (message.stop_reason === 'max_tokens') {
      emit({ type: 'error', text: 'That answer ran long and got cut off. Ask me to continue.' });
      break;
    }

    messages.push({ role: 'assistant', content: echoableContent(message.content) });
    const results = [];
    for (const tu of toolUses) {
      try {
        const out = runClientTool(tu.name, tu.input);
        emit({ type: 'status', text: out.status });
        emit({ type: 'changed', what: out.changed });
        results.push({ type: 'tool_result', tool_use_id: tu.id, content: out.result });
      } catch (e) {
        results.push({ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: String(e.message || e) });
      }
    }
    messages.push({ role: 'user', content: results });
  }

  emit({ type: 'done' });
  res.end();
}

function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError) return 'The API key was rejected. Check ANTHROPIC_API_KEY in the .env file and restart.';
  if (err instanceof Anthropic.PermissionDeniedError) return `This API key can't use ${MODEL}. Set MODEL in .env to a model your account can use.`;
  if (err instanceof Anthropic.RateLimitError) return "I'm getting a lot of requests right now. Give it a few seconds and try again.";
  if (err instanceof Anthropic.APIConnectionError) return "I couldn't reach the AI service. Check the internet connection and try again.";
  if (err instanceof Anthropic.InternalServerError) return 'The AI service hiccuped. Try again in a moment.';
  if (err instanceof Anthropic.APIError) return `Something went wrong (${err.status || 'error'}): ${err.message}`;
  return `Something went wrong: ${err.message || err}`;
}

// ---------------------------------------------------------------- routes

const STATIC_TYPES = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return send(res, 404, 'Not found');
  }
  res.writeHead(200, {
    'Content-Type': STATIC_TYPES[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  try {
    if (!pathname.startsWith('/api/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
      return serveStatic(req, res, pathname);
    }
    if (pathname === '/api/health') {
      return send(res, 200, { ok: true, demo: DEMO, hasKey: HAS_KEY, model: MODEL, locked: Boolean(APP_PASSWORD) });
    }
    if (!authorized(req)) return send(res, 401, { error: 'Passcode required' });

    if (pathname === '/api/unlock' && req.method === 'POST') return send(res, 200, { ok: true });
    if (pathname === '/api/chat' && req.method === 'POST') return await handleChat(req, res);
    if (pathname === '/api/fleet' && req.method === 'GET') return send(res, 200, fleetReport());
    if (pathname === '/api/notes' && req.method === 'GET') return send(res, 200, loadNotes());
    if (pathname.startsWith('/api/notes/') && req.method === 'DELETE') {
      deleteNote(decodeURIComponent(pathname.slice('/api/notes/'.length)));
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: 'Not found' });
  } catch (err) {
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', text: friendlyError(err) })}\n\n`);
      return res.end();
    }
    return send(res, err.status || 500, { error: err.message || 'Server error' });
  }
});

server.listen(PORT, HOST, () => {
  const mode = DEMO ? (HAS_KEY ? 'DEMO mode (DEMO=1)' : 'DEMO mode (no ANTHROPIC_API_KEY found; add it to .env for live answers)') : `live · ${MODEL} · web search on`;
  console.log(`\n  Absolute Advisor is running → http://localhost:${PORT}\n  ${mode}${APP_PASSWORD ? ' · passcode protected' : ''}\n`);
});
