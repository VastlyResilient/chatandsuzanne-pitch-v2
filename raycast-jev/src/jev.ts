import { getPreferenceValues } from "@raycast/api";

const API_URL = "https://api.typesafe.ai/v1/systemone";

export interface Preferences {
  jevApiKey: string;
  searchPaths?: string;
  googleClientId?: string;
}

export function getPreferences(): Preferences {
  return getPreferenceValues<Preferences>();
}

export interface Scored<T> {
  item: T;
  score: number; // Jev probability 0..1 that the item matches the description
}

/**
 * Ask Jev, for each item, "is this what the person described?" and return the
 * items sorted by probability. Runs a small pool of concurrent requests so a
 * batch of candidates is scored in a fraction of a second. Aborts cleanly when
 * the caller's AbortSignal fires (e.g. the user kept typing).
 */
export async function rankByDescription<T>(
  description: string,
  items: T[],
  toState: (item: T) => string,
  options?: { concurrency?: number; signal?: AbortSignal; charCap?: number },
): Promise<Scored<T>[]> {
  const { jevApiKey } = getPreferences();
  if (!jevApiKey) throw new Error("Missing Jev API key — set it in the JEV extension preferences.");
  if (items.length === 0) return [];

  const concurrency = options?.concurrency ?? 6;
  const charCap = options?.charCap ?? 4000;
  const signal = options?.signal;
  const question =
    "Based only on what this is about, is it the thing the person is looking for? " +
    "They describe it as: " +
    description.trim();
  const criteria = {
    true: "The subject/content clearly matches the description",
    false: "It is about something else",
  };

  const results: Scored<T>[] = [];
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      if (signal?.aborted) return;
      const index = cursor++;
      const item = items[index];
      const state = toState(item).slice(0, charCap);
      if (!state.trim()) {
        results.push({ item, score: 0 });
        continue;
      }
      try {
        const resp = await fetch(API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jevApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state,
            model: "jev-latest",
            questions: { match: { type: "noul", instructions: question, criteria } },
          }),
          signal,
        });
        if (!resp.ok) {
          results.push({ item, score: 0 });
          continue;
        }
        const data = (await resp.json()) as { answers?: { match?: { noul?: number } } };
        const noul = data.answers?.match?.noul ?? 0;
        results.push({ item, score: Number(noul) });
      } catch (error) {
        if (signal?.aborted) return;
        results.push({ item, score: 0 });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  results.sort((a, b) => b.score - a.score);
  return results;
}
