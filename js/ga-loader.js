/**
 * Loads gtag.js only when a real-looking GA4 Measurement ID is set in ga-config.js.
 */
(function () {
  var id =
    typeof window.__GA4_MEASUREMENT_ID__ === "string"
      ? window.__GA4_MEASUREMENT_ID__.trim()
      : "";
  if (!id || id === "G-XXXXXXXXXX" || !/^G-[A-Z0-9a-z]{6,20}$/i.test(id)) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id);

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.appendChild(s);
})();
