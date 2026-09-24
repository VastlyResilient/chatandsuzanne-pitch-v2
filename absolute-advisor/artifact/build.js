// Builds the claude.ai Artifact version of the Advisor from public/index.html:
//   node artifact/build.js <outDir>
// Writes <outDir>/index.html. Publish it with lake.mp4 (the background video)
// and public/logo.webp
// beside it, declaring capabilities {sample: {}}.
'use strict';

const fs = require('fs');
const path = require('path');

const out = process.argv[2];
if (!out) throw new Error('usage: node artifact/build.js <outDir>');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');

// Standing briefing: the server persona, adjusted for a version without web search.
const promptSrc = fs.readFileSync(path.join(root, 'lib/prompt.js'), 'utf8');
let persona = promptSrc.match(/const PERSONA = `([\s\S]*?)`;/)[1];
const searchLine = persona.split('\n').find((l) => l.startsWith('- Use web search whenever'));
if (!searchLine) throw new Error('web search line not found in PERSONA');
persona = persona.replace(
  searchLine,
  "- This version has no live web search. When current facts matter (vehicle prices, auction values, incentives, rates, event dates, contracts), give a clearly labeled estimate from your knowledge and say exactly what to verify and where. Never present a current price as confirmed."
);

// Seed roster without tracker device ids (not needed for advice).
const fleet = JSON.parse(fs.readFileSync(path.join(root, 'data/fleet.json'), 'utf8'));
const seed = fleet.vehicles.map(({ tracker, ...v }) => v);

const affirm = html.match(/const AFFIRMATIONS = (\[[\s\S]*?\n\]);/)[1];
const app = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const listings = fs.readFileSync(path.join(root, 'lib/listings.js'), 'utf8').replace("'use strict';", '');
const safe = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

const script = `<script>
const AFFIRMATIONS = ${affirm};
const SEED_VEHICLES = ${safe(seed)};
const PERSONA = ${safe(persona)};
${listings}
${app}
</script>`;

const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
let body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
body = body.replace(/<script>[\s\S]*<\/script>\s*$/, script);
body = body.replace(/<div class="gate" id="gate">[\s\S]*?<\/form>\s*<\/div>\n/, '');
body = body.replace(/src="https:\/\/d8j0ntlcm91z4[^"]+"/, 'src="lake.mp4"');
body = body.replace('<span id="modelLabel">Live Search</span>', '<span id="modelLabel">Deep Think</span>');
body = body.replace('aria-label="Toggle live web search"', 'aria-label="Switch between deep and fast answers"');
body = body.replace('aria-label="Attach photos, PDFs or spreadsheets"', 'aria-label="Attach photos or spreadsheets"');
body = body.replace('accept="image/*,.pdf,.csv,.tsv,.txt,.md,.json"', 'accept="image/*,.csv,.tsv,.txt,.md,.json"');

const headKept = head
  .replace(/<meta charset[^>]*>\n?/, '')
  .replace(/<meta name="viewport"[^>]*>\n?/, '')
  .replace(/<title>[^<]*<\/title>/, '<title>Absolute Advisor</title>')
  .replace(' with live web search.', '.');

const page = `${headKept.trim()}\n${body.trim()}\n`;
for (const bad of ['/api/', 'gateForm', 'd8j0ntlcm91z4']) {
  if (page.includes(bad)) throw new Error(`build left a server-only reference: ${bad}`);
}
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), page);
console.log(`wrote ${path.join(out, 'index.html')} (${(page.length / 1024).toFixed(0)} KB)`);
