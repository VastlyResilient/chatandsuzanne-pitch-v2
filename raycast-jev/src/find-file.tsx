import { useEffect, useMemo, useRef, useState } from "react";
import { homedir } from "os";
import { Action, ActionPanel, List, Toast, showToast } from "@raycast/api";
import { getPreferences, rankByDescription } from "./jev";
import { contentForRanking, defaultRoots, mdfindCandidates, FileHit } from "./mac";

export default function Command() {
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState<FileHit[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prefs = getPreferences();
  const roots = useMemo(() => defaultRoots(prefs.searchPaths), [prefs.searchPaths]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    const q = searchText.trim();
    if (q.length < 2) {
      setItems([]);
      setScores({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    timerRef.current = setTimeout(async () => {
      try {
        // 1) Instant candidates from Spotlight (name + indexed content).
        const hits = await mdfindCandidates(q, roots, 40);
        if (controller.signal.aborted) return;
        setItems(hits);
        setScores({});
        if (hits.length === 0) {
          setLoading(false);
          return;
        }

        // 2) Jev semantically re-ranks those candidates by your description.
        const states = await Promise.all(hits.map((h) => contentForRanking(h)));
        if (controller.signal.aborted) return;
        const ranked = await rankByDescription(
          q,
          hits.map((h, i) => ({ hit: h, state: states[i] })),
          (x) => x.state,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;

        const map: Record<string, number> = {};
        for (const r of ranked) map[r.item.hit.path] = r.score;
        setScores(map);
      } catch (error) {
        if (!controller.signal.aborted) {
          await showToast({ style: Toast.Style.Failure, title: "Search failed", message: String(error) });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchText, roots]);

  const ordered = useMemo(() => {
    const rows = items.map((it) => ({ it, score: scores[it.path] ?? -1 }));
    if (Object.keys(scores).length > 0) rows.sort((a, b) => b.score - a.score);
    return rows;
  }, [items, scores]);

  return (
    <List
      isLoading={loading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Describe the file or folder you're looking for…"
      filtering={false}
      throttle
    >
      {ordered.length === 0 && !loading && searchText.trim().length >= 2 ? (
        <List.EmptyView title="No matches yet" description="Try describing what it's about, not its name." />
      ) : (
        ordered.map(({ it, score }) => (
          <List.Item
            key={it.path}
            icon={{ fileIcon: it.path }}
            title={it.name}
            subtitle={it.path.replace(homedir(), "~")}
            accessories={score >= 0 ? [{ tag: `${Math.round(score * 100)}%` }] : []}
            actions={
              <ActionPanel>
                <Action.Open title="Open" target={it.path} />
                <Action.ShowInFinder path={it.path} />
                <Action.CopyToClipboard title="Copy Path" content={it.path} shortcut={{ modifiers: ["cmd"], key: "c" }} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
