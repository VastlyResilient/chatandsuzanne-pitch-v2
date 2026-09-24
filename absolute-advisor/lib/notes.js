// Long-term memory: short facts the advisor learns about the business.
'use strict';

const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('./fleet');

const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const MAX_NOTES = 300;

function loadNotes() {
  try {
    return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeNotes(notes) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = NOTES_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(notes, null, 2));
  fs.renameSync(tmp, NOTES_FILE);
}

function addNote(text, category = 'general') {
  const clean = String(text || '').trim().slice(0, 600);
  if (!clean) throw new Error('note text is empty');
  const notes = loadNotes();
  const id = 'n' + (notes.reduce((m, n) => Math.max(m, Number(n.id.slice(1)) || 0), 0) + 1);
  const note = { id, text: clean, category: String(category).slice(0, 40), date: new Date().toISOString().slice(0, 10) };
  notes.push(note);
  writeNotes(notes.slice(-MAX_NOTES));
  return note;
}

function deleteNote(id) {
  const notes = loadNotes();
  const next = notes.filter((n) => n.id !== id);
  if (next.length === notes.length) throw new Error(`No note with id ${id}`);
  writeNotes(next);
  return true;
}

module.exports = { loadNotes, addNote, deleteNote };
