// Offline answers used when no API key is configured. They are computed from
// the real roster so the app is useful (and testable) before setup is done.
'use strict';

const { fleetReport } = require('./fleet');

const fmt = (n) => n.toLocaleString('en-US');

function lastUserText(messages) {
  const m = messages[messages.length - 1];
  if (typeof m.content === 'string') return m.content;
  return m.content.filter((b) => b.type === 'text').map((b) => b.text).join(' ');
}

function swapAnswer(r, model) {
  const pool = r.vehicles.filter((v) => v.status === 'active' && (!model || `${v.make} ${v.model}`.toLowerCase().includes(model)));
  const top = [...pool].sort((a, b) => b.replacePriority - a.replacePriority).slice(0, model ? 8 : 6);
  const rows = top.map((v) => `| ${v.nickname} | ${v.year} ${v.make} ${v.model} | ${fmt(v.miles)} | ~${fmt(v.milesPerYear)} | ${v.replacePriority} |`).join('\n');
  return `**Swap first: ${top[0].nickname} (${top[0].year} ${top[0].model}, ${fmt(top[0].miles)} mi).** Here's the replacement queue from the roster:

| Unit | Vehicle | Miles | Pace/yr | Priority |
|---|---|---|---|---|
${rows}

- ${r.summary.over200k} units are already past 200k miles. That's where air suspension, turbo and downtime costs pile up and resale falls off.
- Replace 2–3 per quarter instead of all at once, so payments stay smooth and your top accounts always get fresh units.

**Next move:** get fleet-department quotes on 2–3 year off-lease replacements before winter, while 200k+ units still sell as runners.

[[options: Which Aviator to sell first? | What should replace them? | Show me the math]]`;
}

function idleAnswer(r) {
  const low = r.vehicles.filter((v) => v.status === 'active' && v.flags.some((f) => f.startsWith('low use')));
  const rows = low.slice(0, 10).map((v) => `| ${v.nickname} | ${v.year} ${v.make} ${v.model} | ${fmt(v.miles)} | ~${fmt(v.milesPerYear)} |`).join('\n');
  return `**${low.length} units show a low lifetime pace. Each one is either a spare or a revenue opportunity.**

| Unit | Vehicle | Miles | Pace/yr |
|---|---|---|---|
${rows}

- **Mach-Es and minivans:** put them on flat-rate corporate airport programs (BDL/HVN/JFK). Energy cost per mile is lowest here, and corporate buyers like a green option.
- **Sprinter (AB-L01784L):** vans earn the most per hour when booked. Sell wedding guest shuttles, casino/wine-trail tours, and university athletics and admissions groups.
- **Economy crossovers:** medical/NEMT, dealership service shuttles and corporate employee shuttles give steady weekday utilization.

**Next move:** tell me what each of these is actually doing today and I'll build a plan for every car.

[[options: Build a plan per car | Find contracts near me | Price a Sprinter package]]`;
}

function playAnswer() {
  const month = new Date().getMonth();
  const plays = [
    'Lock in 3 corporate airport accounts with a flat-rate program before Q1 travel restarts.',
    'Open prom and graduation booking now, with school-wide group rates and deposits.',
    'Pitch HVN and BDL airline crew transport. Steady volume at night and in the off-peak.',
    'Package a wedding bundle: couple car + guest Sprinter + late-night return, with a 5-hour minimum.',
    'Sell holiday-party and New Year\'s Eve packages to corporate HR teams now. They sell out every year.',
    'Offer Yale/Quinnipiac parents\' weekend and game-day packages. Hamden is right next door.',
  ];
  const pick = plays[month % plays.length];
  return `**Today's play: ${pick}**

- It's a proven, repeatable move for an operator your size, and it fills weekday hours your fleet already pays for.
- Start with the 10 warmest past clients and planners. One yes a week adds up fast.

**Next move:** want me to write the outreach message and price sheet?

[[options: Write the outreach | Price it for me | Give me another play]]`;
}

async function demoAnswer(messages, emit, signal, hasKey) {
  const q = lastUserText(messages).toLowerCase();
  const r = fleetReport();
  let body;
  if (/aviator/.test(q)) body = swapAnswer(r, 'aviator');
  else if (/mkt/.test(q)) body = swapAnswer(r, 'mkt');
  else if (/swap|replace|sell|trade|xts|retire/.test(q)) body = swapAnswer(r);
  else if (/idle|underused|unused|more out of|spare|utiliz/.test(q)) body = idleAnswer(r);
  else body = playAnswer();

  const banner = hasKey
    ? '_Demo mode is on (DEMO=1). Answers come from the roster only._\n\n'
    : '_Demo mode: add your Anthropic API key to the `.env` file and restart to unlock full answers and live web search. For now, this answer comes straight from your roster._\n\n';
  emit({ type: 'status', text: 'Reading your roster…' });
  await new Promise((r) => setTimeout(r, 500));
  const text = banner + body;
  for (let i = 0; i < text.length; i += 6) {
    if (signal.aborted) return;
    emit({ type: 'text', text: text.slice(i, i + 6) });
    await new Promise((r) => setTimeout(r, 8));
  }
}

module.exports = { demoAnswer };
