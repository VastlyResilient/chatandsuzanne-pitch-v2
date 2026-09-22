import { useEffect, useMemo, useRef, useState } from "react";
import { Action, ActionPanel, List, Toast, showToast } from "@raycast/api";
import { OAuthService, getAccessToken, withAccessToken } from "@raycast/utils";
import { getPreferences, rankByDescription } from "./jev";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

interface EmailHit {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

const prefs = getPreferences();
const clientId = prefs.googleClientId?.trim();
const google = clientId
  ? OAuthService.google({ clientId, scope: GMAIL_SCOPE })
  : null;

async function gmailSearch(token: string, query: string, signal: AbortSignal): Promise<EmailHit[]> {
  const listUrl =
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=" +
    encodeURIComponent(query);
  const listResp = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!listResp.ok) throw new Error(`Gmail search failed (${listResp.status})`);
  const list = (await listResp.json()) as { messages?: { id: string }[] };
  const ids = (list.messages ?? []).map((m) => m.id);

  const hits: EmailHit[] = [];
  await Promise.all(
    ids.map(async (id) => {
      const url =
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}` +
        "?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date";
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal });
      if (!resp.ok) return;
      const msg = (await resp.json()) as {
        snippet?: string;
        payload?: { headers?: { name: string; value: string }[] };
      };
      const headers = msg.payload?.headers ?? [];
      const h = (name: string) => headers.find((x) => x.name.toLowerCase() === name)?.value ?? "";
      hits.push({
        id,
        subject: h("subject") || "(no subject)",
        from: h("from"),
        date: h("date"),
        snippet: msg.snippet ?? "",
      });
    }),
  );
  return hits;
}

function Inner() {
  const [searchText, setSearchText] = useState("");
  const [items, setItems] = useState<EmailHit[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        const { token } = getAccessToken();
        // 1) Gmail's own search narrows to candidate messages fast.
        const hits = await gmailSearch(token, q, controller.signal);
        if (controller.signal.aborted) return;
        setItems(hits);
        setScores({});
        if (hits.length === 0) {
          setLoading(false);
          return;
        }
        // 2) Jev re-ranks by what you actually described.
        const ranked = await rankByDescription(
          q,
          hits,
          (m) => `Subject: ${m.subject}\nFrom: ${m.from}\n${m.snippet}`,
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const map: Record<string, number> = {};
        for (const r of ranked) map[r.item.id] = r.score;
        setScores(map);
      } catch (error) {
        if (!controller.signal.aborted) {
          await showToast({ style: Toast.Style.Failure, title: "Email search failed", message: String(error) });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchText]);

  const ordered = useMemo(() => {
    const rows = items.map((it) => ({ it, score: scores[it.id] ?? -1 }));
    if (Object.keys(scores).length > 0) rows.sort((a, b) => b.score - a.score);
    return rows;
  }, [items, scores]);

  return (
    <List
      isLoading={loading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Describe the email you're looking for…"
      filtering={false}
      throttle
      isShowingDetail
    >
      {ordered.map(({ it, score }) => (
        <List.Item
          key={it.id}
          title={it.subject}
          subtitle={it.from}
          accessories={score >= 0 ? [{ tag: `${Math.round(score * 100)}%` }] : []}
          detail={<List.Item.Detail markdown={`**${it.subject}**\n\n_${it.from}_ · ${it.date}\n\n${it.snippet}`} />}
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Open in Gmail" url={`https://mail.google.com/mail/u/0/#all/${it.id}`} />
              <Action.CopyToClipboard title="Copy Subject" content={it.subject} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

const InnerWithAuth = google ? withAccessToken(google)(Inner) : null;

export default function Command() {
  if (!InnerWithAuth) {
    return (
      <List searchBarPlaceholder="Gmail not connected">
        <List.EmptyView
          title="Connect Gmail to search email"
          description="Add your Google OAuth Client ID in JEV preferences (⌘, ). See the extension README for the 2-minute setup."
        />
      </List>
    );
  }
  return <InnerWithAuth />;
}
