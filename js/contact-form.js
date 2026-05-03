/**
 * Contact form: POST to n8n Webhook when configured; otherwise opens the visitor’s
 * email app (mailto) so the section always works.
 *
 * n8n: Webhook Production URL in GitHub secret N8N_CONTACT_WEBHOOK_URL (not a tutorial example).
 * CORS: allow https://vbsmrobotic.github.io on the Webhook node. End with Respond to Webhook JSON { "ok": true }.
 */
(function () {
  const CONTACT_EMAIL = "vahidbehtaji2013@gmail.com";
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("contact-form-status");
  const submitBtn = form.querySelector('[type="submit"]');
  const rawWebhook =
    typeof window.__N8N_CONTACT_WEBHOOK__ === "string"
      ? window.__N8N_CONTACT_WEBHOOK__.trim()
      : "";
  const isDocPlaceholder = (url) =>
    !url ||
    url.includes("yourname.app.n8n.cloud") ||
    url.includes("example.com/webhook");
  const webhookUrl = isDocPlaceholder(rawWebhook) ? "" : rawWebhook;
  const useN8n = Boolean(webhookUrl);

  const setStatus = (message, kind) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("is-error", "is-success", "is-info");
    if (kind) statusEl.classList.add(kind);
    statusEl.hidden = !message;
  };

  /* Status line is only for errors / success after submit — no extra copy above the fields. */

  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function buildMailtoLink(name, email, topic, message) {
    const subject = `[Website contact] ${topic}`;
    let body = `Name: ${name}\nReply-to: ${email}\nTopic: ${topic}\n\n${message}\n\n---\nSent from: ${window.location.href}`;
    const maxLen = 2000;
    const link = () =>
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    while (link().length > maxLen && body.length > 80) {
      body =
        body.slice(0, Math.floor(body.length * 0.88)) +
        "\n\n[Message shortened for email link — you can paste more in your mail app.]";
    }
    return link();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", "");

    const fd = new FormData(form);
    const name = String(fd.get("name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const topic = String(fd.get("topic") || "").trim();
    const message = String(fd.get("message") || "").trim();
    const hp = String(fd.get("website") || "").trim();

    if (hp) {
      setStatus("Thanks — your message was sent.", "is-success");
      form.reset();
      return;
    }

    if (!name || name.length > 120) {
      setStatus("Please enter your name (max 120 characters).", "is-error");
      return;
    }
    if (!emailOk(email)) {
      setStatus("Please enter a valid email address.", "is-error");
      return;
    }
    if (!topic) {
      setStatus("Please choose a topic.", "is-error");
      return;
    }
    if (message.length < 10) {
      setStatus("Please write a bit more detail (at least 10 characters).", "is-error");
      return;
    }
    if (message.length > 8000) {
      setStatus("Message is too long (max 8000 characters).", "is-error");
      return;
    }

    if (!useN8n) {
      window.location.href = buildMailtoLink(name, email, topic, message);
      setStatus(
        "If your email program opened, press Send there. If nothing opened, copy my address from the lines above.",
        "is-success",
      );
      return;
    }

    const payload = {
      source: "vahid_website",
      name,
      email,
      topic,
      message,
      pageUrl: window.location.href,
      submittedAt: new Date().toISOString(),
      hp: "",
    };

    submitBtn.disabled = true;
    setStatus("Sending…", "");

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "cors",
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        /* ignore */
      }

      const ok =
        res.ok &&
        (data === null ||
          data.ok === true ||
          data.success === true ||
          data.message === "Workflow was started");

      if (ok) {
        setStatus("Thanks — I received your message and will get back when I can.", "is-success");
        form.reset();
      } else {
        setStatus(
          "Something went wrong sending your message. Try again or use the email fallback above.",
          "is-error",
        );
      }
    } catch {
      setStatus(
        "Could not reach n8n (network or CORS). Use Send again after fixing n8n, or disconnect the webhook secret to use email-app sending.",
        "is-error",
      );
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
