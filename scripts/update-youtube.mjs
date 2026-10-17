// Refreshes data/youtube.js with the Zero Wealth YouTube channel's numbers and videos.
// Runs daily from .github/workflows/youtube-data.yml (Node 20+, no dependencies).
//
// Sources, in order of preference:
//   1. YouTube Data API v3 — only if the YOUTUBE_API_KEY secret is set (exact subscribers, total views, video count).
//   2. The public channel page — subscribers ("7.47K") and video count, when there is no API key.
//   3. The public RSS feed — the 15 latest videos with their view counts (always used).
// Whatever can't be fetched keeps its previous value, so the site never shows blanks.

import { readFile, writeFile } from "node:fs/promises";

const CHANNEL_ID = "UCn2tPHDpXme_rNmy6tBPUNg";
const HANDLE = "@ZeroWealthIN"; // shown on the site; links use the permanent channel ID, so they work even while a handle change propagates
const OUT = new URL("../data/youtube.js", import.meta.url);
const UA = { "User-Agent": "Mozilla/5.0 (zerowealth.in data refresh)", "Accept-Language": "en" };
const KEEP = 60; // videos kept in the file (older ones drop off)

const decode = s => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const parseCount = t => { // "7.47K" -> 7470, "1.2M" -> 1200000, "277" -> 277
  const m = String(t).replace(/,/g, "").match(/([\d.]+)\s*([KMB]?)/i);
  return m ? Math.round(parseFloat(m[1]) * ({ K: 1e3, M: 1e6, B: 1e9 }[m[2].toUpperCase()] || 1)) : null;
};

async function loadPrevious() {
  try {
    const src = await readFile(OUT, "utf8");
    return JSON.parse(src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1));
  } catch { return null; }
}

async function fromFeed() {
  const xml = await (await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`, { headers: UA })).text();
  const name = decode((xml.match(/<title>([^<]*)<\/title>/) || [])[1] || "");
  const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: (e.match(/<yt:videoId>([^<]+)/) || [])[1],
    title: decode((e.match(/<title>([^<]*)<\/title>/) || [])[1] || ""),
    published: ((e.match(/<published>([^<]+)/) || [])[1] || "").slice(0, 10),
    views: +((e.match(/<media:statistics views="(\d+)"/) || [])[1] || 0),
    short: /\/shorts\//.test((e.match(/<link rel="alternate" href="([^"]+)"/) || [])[1] || "")
  })).filter(v => v.id);
  if (!videos.length) throw new Error("feed had no videos");
  return { name, videos };
}

async function fromPage() {
  const html = await (await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}`, { headers: UA })).text();
  const subsText = (html.match(/([\d.,]+[KMB]?) subscribers/) || [])[1];
  const videosText = (html.match(/([\d,]+) videos/) || [])[1];
  const handle = ((html.match(/"vanityChannelUrl":"https?:\/\/www\.youtube\.com\/(@[^"]+)"/) || [])[1]) || null;
  if (!subsText) throw new Error("subscriber count not found on channel page");
  return { subscribersText: subsText, subscribers: parseCount(subsText), videoCount: videosText ? parseCount(videosText) : null, handle };
}

async function fromApi(key) {
  const r = await (await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${key}`)).json();
  const c = r.items && r.items[0];
  if (!c) throw new Error("API returned no channel: " + JSON.stringify(r.error || r).slice(0, 200));
  const s = c.statistics;
  return { subscribers: +s.subscriberCount, totalViews: +s.viewCount, videoCount: +s.videoCount, handle: c.snippet.customUrl || null };
}

const prev = (await loadPrevious()) || {};
const data = { ...prev, channelId: CHANNEL_ID, handle: HANDLE };
const log = [];

try {
  const f = await fromFeed();
  // merge: newest feed entries refresh views; older known videos are kept
  const byId = new Map((prev.videos || []).map(v => [v.id, v]));
  f.videos.forEach(v => byId.set(v.id, { ...byId.get(v.id), ...v }));
  data.videos = [...byId.values()].sort((a, b) => b.published.localeCompare(a.published)).slice(0, KEEP);
  if (f.name) data.name = f.name;
  log.push(`feed: ${f.videos.length} videos`);
} catch (e) { log.push("feed failed (kept previous): " + e.message); }

let stats = null;
if (process.env.YOUTUBE_API_KEY) {
  try { stats = await fromApi(process.env.YOUTUBE_API_KEY); data.source = "api"; log.push("api: ok"); }
  catch (e) { log.push("api failed: " + e.message); }
}
if (!stats) {
  try { stats = await fromPage(); data.source = "page"; log.push("page: ok"); }
  catch (e) { log.push("page failed (kept previous): " + e.message); }
}
if (stats) {
  for (const k of ["subscribers", "subscribersText", "videoCount", "totalViews"]) if (stats[k] != null) data[k] = stats[k];
  if (stats.handle && stats.handle.toLowerCase() !== HANDLE.toLowerCase()) log.push(`note: YouTube reports handle ${stats.handle}, site shows ${HANDLE}`);
}
data.recentViews = (data.videos || []).slice(0, 15).reduce((a, v) => a + (v.views || 0), 0);

// only write (and so only commit) when something visible changed
const strip = d => JSON.stringify({ ...d, updated: undefined });
if (strip(data) === strip(prev)) { console.log("no change", log.join(" · ")); process.exit(0); }
data.updated = new Date().toISOString().slice(0, 10);
const body = "/* Generated daily by scripts/update-youtube.mjs — do not edit by hand. */\nwindow.ZW_YT = " + JSON.stringify(data, null, 1) + ";\n";
await writeFile(OUT, body);
console.log("updated", log.join(" · "));
