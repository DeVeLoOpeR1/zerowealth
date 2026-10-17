/*
 * Zero Wealth × YouTube — shared by the home page and the calculators page.
 * Reads window.ZW_YT (data/youtube.js, refreshed daily by a GitHub Action) and fills:
 * the ▶ count in the top bar, the hero line, the home-page channel section,
 * the "Watch" card on each calculator, and the footer link.
 * Every element has a static fallback in the HTML, so the page still works without this file.
 */
(function () {
  "use strict";
  var D = window.ZW_YT || {};
  var CH = "https://www.youtube.com/channel/" + (D.channelId || "UCn2tPHDpXme_rNmy6tBPUNg");
  var SUB = CH + "?sub_confirmation=1";
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9C2 8.9 2 12 2 12s0 3.1.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8Z" fill="#ff0033"/><path d="m10 15.2 5.2-3.2L10 8.8Z" fill="#fff"/></svg>';
  var PLAY_WHITE = PLAY.replace('fill="#ff0033"', 'fill="#ffffff"').replace('fill="#fff"', 'fill="#ff0033"');

  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  // 7470 -> "7.47K", 411536 -> "4.1L" (Indian style for views)
  function short(n) {
    if (n == null || isNaN(n)) return "";
    if (n >= 1e7) return +(n / 1e7).toFixed(1) + "Cr";
    if (n >= 1e5) return +(n / 1e5).toFixed(1) + "L";
    if (n >= 1e3) return +(n / 1e3).toFixed(n >= 1e4 ? 1 : 2) + "K";
    return String(n);
  }
  function subsText() { return D.subscribersText || short(D.subscribers); }
  function ago(iso) {
    var days = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 864e5));
    if (days < 1) return "today";
    if (days < 30) return days + (days === 1 ? " day ago" : " days ago");
    var m = Math.round(days / 30.4);
    if (m < 12) return m + (m === 1 ? " month ago" : " months ago");
    var y = Math.round(days / 365);
    return y + (y === 1 ? " year ago" : " years ago");
  }

  // ---------- which calculator each video is about (by title) ----------
  var FD_EXAMPLE = "principal=500000&return=7.5&senior=0&tenure=5&frequency=4&slab=0";
  var TOPICS = [
    [/monthly income|monthly payout|har mahin/i, "fd", "FD monthly income", FD_EXAMPLE + "&payout=12"],
    // RD before FD: titles like "RD Top-Up vs FD" mention both
    [/\brd\b|recurring deposit|top-?up/i, "rd", "RD Calculator", "monthly=5000&return=7&senior=0&months=24&topup=50000&topupMonth=6&slab=0"],
    [/\bfd\b|fixed deposit/i, "fd", "FD Calculator", FD_EXAMPLE + "&payout=0"],
    [/emergency fund|goal/i, "goal", "Goal Planner", ""],
    [/\bswp\b|systematic withdrawal/i, "swp", "SWP Calculator", ""],
    [/\bsip\b/i, "sip", "SIP Calculator", ""],
    [/lump ?sum/i, "lumpsum", "Lumpsum Calculator", ""],
    [/\bemi\b|home loan|car loan|personal loan/i, "emi", "EMI Calculator", ""],
    [/\bppf\b|provident fund/i, "ppf", "PPF Calculator", ""],
    [/retire/i, "retirement", "Retirement Calculator", ""],
    [/inflation|mehngai/i, "inflation", "Inflation Calculator", ""],
    [/compound/i, "compound", "Compound Interest Calculator", ""]
  ];
  var FINANCE = /\b(fd|rd|sip|swp|ppf|emi|loan|fund|bank|tax|interest|invest|saving|money|wealth|income|deposit|retire|inflation|stable money)\b/i;
  function topic(v) {
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i][0].test(v.title)) return { tool: TOPICS[i][1], label: TOPICS[i][2], params: TOPICS[i][3] };
    return null;
  }
  function calcHref(t, onCalcPage) {
    var base = onCalcPage ? "" : "calculators.html";
    return base + "#" + t.tool + (t.params ? "?" + t.params : "");
  }
  var videos = (D.videos || []).filter(function (v) { return v && v.id && (topic(v) || FINANCE.test(v.title)); });
  function watchUrl(v) { return "https://www.youtube.com/" + (v.short ? "shorts/" : "watch?v=") + v.id; }
  function thumb(v, cls) {
    return '<img class="' + cls + '" src="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg" srcset="https://i.ytimg.com/vi/' + v.id + '/mqdefault.jpg 320w, https://i.ytimg.com/vi/' + v.id + '/hqdefault.jpg 480w" sizes="(max-width:540px) 80vw, 360px" alt="" loading="lazy" decoding="async" width="320" height="180">';
  }

  // ---------- small pieces: top-bar count, hero line, footer ----------
  function fillCounts() {
    var s = subsText();
    document.querySelectorAll("[data-yt-link]").forEach(function (a) { a.href = a.hasAttribute("data-yt-subscribe") ? SUB : CH; });
    if (!s) return;
    document.querySelectorAll("[data-yt-subs]").forEach(function (el) { el.textContent = s; });
    document.querySelectorAll("[data-yt-pill]").forEach(function (a) { a.setAttribute("aria-label", "Zero Wealth on YouTube, " + s + " subscribers"); });
  }

  // ---------- home page: channel section ----------
  var MILESTONES = [100, 500, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000];
  function renderSection(root) {
    var subs = D.subscribers || 0, goal = MILESTONES.find(function (m) { return m > subs; }) || subs;
    var pct = goal ? Math.min(100, Math.round(subs / goal * 100)) : 100;
    var views = D.totalViews ? [short(D.totalViews), "total views"] : D.recentViews ? [short(D.recentViews) + "+", "recent views"] : null;
    var stats = root.querySelector(".ytstats");
    if (stats && subs) {
      stats.innerHTML =
        '<div class="ytstat"><strong>' + esc(subsText()) + '</strong><span>subscribers</span></div>' +
        (D.videoCount ? '<div class="ytstat"><strong>' + D.videoCount + '</strong><span>videos</span></div>' : "") +
        (views ? '<div class="ytstat"><strong>' + esc(views[0]) + '</strong><span>' + views[1] + '</span></div>' : "") +
        '<div class="ytgoal"><div class="row"><span>Road to ' + short(goal) + ' subscribers</span><span>' + pct + '%</span></div>' +
        '<div class="ytbar" role="progressbar" aria-valuemin="0" aria-valuemax="' + goal + '" aria-valuenow="' + subs + '" aria-label="Progress to ' + short(goal) + ' subscribers"><i style="width:' + pct + '%"></i></div>' +
        '<small>' + (goal - subs).toLocaleString("en-IN") + ' to go — join the community 🙌</small></div>';
    }
    var grid = root.querySelector(".ytvids"), tabs = root.querySelectorAll(".yttabs [data-sort]");
    if (!grid || !videos.length) { var w = root.querySelector(".ytlist"); if (w) w.hidden = true; return; }
    function draw(sort) {
      var list = videos.slice().sort(function (a, b) { return sort === "latest" ? b.published.localeCompare(a.published) : b.views - a.views; }).slice(0, 6);
      grid.innerHTML = list.map(function (v) {
        var t = topic(v);
        return '<article class="ytv">' +
          '<a class="ytthumb" href="' + watchUrl(v) + '" target="_blank" rel="noopener" aria-label="Watch on YouTube: ' + esc(v.title) + '">' + thumb(v, "ytimg") + '<span class="pb">' + PLAY + '</span>' + (v.short ? '<span class="dur">Short</span>' : "") + '</a>' +
          '<div class="ytbody"><h3><a href="' + watchUrl(v) + '" target="_blank" rel="noopener">' + esc(v.title) + '</a></h3>' +
          '<div class="ytmeta">' + short(v.views) + ' views · ' + ago(v.published) + '</div>' +
          (t ? '<a class="ytcalc" href="' + calcHref(t) + '"><span>Try it: ' + esc(t.label) + ' →</span><em>' + (t.params ? "Pre-filled" : "Open") + '</em></a>' : '<a class="ytcalc muted" href="' + watchUrl(v) + '" target="_blank" rel="noopener"><span>Watch on YouTube ↗</span></a>') +
          '</div></article>';
      }).join("");
      grid.scrollLeft = 0;
      tabs.forEach(function (b) { var on = b.getAttribute("data-sort") === sort; b.classList.toggle("active", on); b.setAttribute("aria-pressed", String(on)); });
    }
    tabs.forEach(function (b) { b.addEventListener("click", function () { draw(b.getAttribute("data-sort")); }); });
    draw("popular");
    var upd = root.querySelector("[data-yt-updated]");
    if (upd && D.updated) upd.textContent = "Updated " + ago(D.updated) + " from YouTube";
  }

  // ---------- calculators page: "Watch · explained in Hindi" card for the open calculator ----------
  function renderWatch(tool) {
    var boxes = document.querySelectorAll("[data-yt-watch]");
    if (!boxes.length) return;
    var match = videos.filter(function (v) { var t = topic(v); return t && t.tool === tool; }).sort(function (a, b) { return b.views - a.views; })[0];
    boxes.forEach(function (box) {
      var forThis = box.getAttribute("data-yt-watch") === (tool === "sip" ? "sip" : "generic");
      if (!match || !forThis) { box.hidden = true; box.innerHTML = ""; return; }
      box.hidden = false;
      box.innerHTML = '<a class="watchcard" href="' + watchUrl(match) + '" target="_blank" rel="noopener">' +
        '<span class="wthumb">' + thumb(match, "wimg") + PLAY + '</span>' +
        '<span class="wtext"><span class="wkick">' + PLAY + ' Watch · explained in Hindi</span><b>' + esc(match.title) + '</b>' +
        '<small>' + esc(D.name || "Zero Wealth") + ' · ' + short(match.views) + ' views on YouTube</small></span>' +
        '<span class="wgo">Watch ↗</span></a>';
    });
  }

  window.ZWYT = { renderWatch: renderWatch, data: D };
  function init() {
    fillCounts();
    var sec = document.getElementById("youtube");
    if (sec) renderSection(sec);
    if (window.__zwCurrentTool) renderWatch(window.__zwCurrentTool);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
