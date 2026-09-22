import { execFile } from "child_process";
import { promisify } from "util";
import { stat } from "fs/promises";
import { basename } from "path";
import { homedir } from "os";

const run = promisify(execFile);

export interface FileHit {
  path: string;
  name: string;
  isDir: boolean;
}

/** Split a description into useful search tokens (drop tiny stop-ish words). */
function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
}

export function defaultRoots(searchPaths?: string): string[] {
  const configured = (searchPaths ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^~(?=$|\/)/, homedir()));
  return configured.length > 0 ? configured : [homedir()];
}

/**
 * Use Spotlight (mdfind) to get instant candidate files and folders whose NAME
 * or indexed CONTENT matches any word in the query. This is what makes results
 * appear at Spotlight speed before Jev is ever called.
 */
export async function mdfindCandidates(
  query: string,
  roots: string[],
  limit = 40,
): Promise<FileHit[]> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const clause = tokens
    .map((t) => {
      const esc = t.replace(/"/g, '\\"');
      return `(kMDItemDisplayName == "*${esc}*"cd || kMDItemTextContent == "*${esc}*"cd)`;
    })
    .join(" || ");

  const args: string[] = [];
  for (const r of roots) args.push("-onlyin", r);
  args.push(clause);

  try {
    const { stdout } = await run("mdfind", args, { maxBuffer: 8 * 1024 * 1024 });
    const paths = stdout
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, limit);

    const hits: FileHit[] = [];
    for (const p of paths) {
      let isDir = false;
      try {
        isDir = (await stat(p)).isDirectory();
      } catch {
        continue; // path vanished; skip
      }
      hits.push({ path: p, name: basename(p), isDir });
    }
    return hits;
  } catch {
    return [];
  }
}

/**
 * Get the text Spotlight already extracted for a file (works for PDFs, Word,
 * Pages, text, etc.) — fast, no re-parsing. For folders, summarize the folder
 * by its name and the names of the things inside it. This is the `state` Jev
 * judges against. The filename is intentionally NOT the primary signal.
 */
export async function contentForRanking(hit: FileHit, cap = 4000): Promise<string> {
  if (hit.isDir) {
    try {
      const { stdout } = await run("ls", ["-1A", hit.path], { maxBuffer: 1024 * 1024 });
      const children = stdout
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 80)
        .join(", ");
      return `Folder named "${hit.name}". It contains: ${children}`.slice(0, cap);
    } catch {
      return `Folder named "${hit.name}"`;
    }
  }

  try {
    const { stdout } = await run(
      "mdls",
      ["-raw", "-name", "kMDItemTextContent", hit.path],
      { maxBuffer: 8 * 1024 * 1024 },
    );
    const text = stdout.trim();
    if (text && text !== "(null)") return text.slice(0, cap);
  } catch {
    // fall through
  }
  // No indexed content (e.g. an image or unindexed type): fall back to a
  // description built from Spotlight metadata + the name.
  try {
    const { stdout } = await run(
      "mdls",
      ["-name", "kMDItemKind", "-name", "kMDItemDisplayName", hit.path],
      { maxBuffer: 1024 * 1024 },
    );
    return `${hit.name} — ${stdout.replace(/\s+/g, " ").trim()}`.slice(0, cap);
  } catch {
    return hit.name;
  }
}
