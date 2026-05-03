/**
 * Small header badge: shows sessions from visitor-stats.json (commit or n8n daily).
 * GA4 cannot be read safely from the browser; update this JSON via n8n + GA4 API + GitHub, or paste counts from GA4 manually.
 */
(function () {
  function sitePrefix() {
    var p = window.location.pathname;
    var idx = p.indexOf("/vahid_website");
    return idx >= 0 ? "/vahid_website" : "";
  }

  function formatSessions(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 10000) return (n / 1000).toFixed(1) + "k";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(Math.round(n));
  }

  var wrap = document.querySelector(".nav-wrap");
  if (!wrap) return;

  var nav = wrap.querySelector(".site-nav");
  if (!nav || wrap.querySelector(".visitor-badge")) return;

  var cluster = document.createElement("div");
  cluster.className = "visitor-badge-cluster";
  nav.replaceWith(cluster);
  cluster.appendChild(nav);

  var badge = document.createElement("div");
  badge.className = "visitor-badge";
  badge.id = "visitor-badge";
  badge.setAttribute("role", "status");
  badge.setAttribute("aria-live", "polite");
  badge.setAttribute(
    "title",
    "Approximate sessions for the period shown (updated in visitor-stats.json; e.g. daily via n8n or GA4 export).",
  );
  badge.innerHTML =
    '<span class="visitor-badge__icon" aria-hidden="true">' +
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M4 19V5M10 19v-6M16 19V9M22 19V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    "</svg></span>" +
    '<span class="visitor-badge__text">…</span>';
  cluster.appendChild(badge);

  var textEl = badge.querySelector(".visitor-badge__text");
  textEl.textContent = "…";

  var url = sitePrefix() + "/js/visitor-stats.json?t=" + Date.now();
  fetch(url, { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error("stats");
      return r.json();
    })
    .then(function (data) {
      var period = data.period || "Period";
      var n = typeof data.sessions === "number" ? data.sessions : null;
      textEl.textContent = period + ": " + formatSessions(n);
    })
    .catch(function () {
      textEl.textContent = "Stats: —";
    });
})();
