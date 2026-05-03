import { mkdirSync, writeFileSync } from "node:fs";

const url = process.env.N8N_CONTACT_WEBHOOK_URL ?? "";
mkdirSync("js", { recursive: true });
writeFileSync(
  "js/contact-config.js",
  `// Generated in CI from secret N8N_CONTACT_WEBHOOK_URL (or empty if unset).\nwindow.__N8N_CONTACT_WEBHOOK__=${JSON.stringify(url)};\n`,
);
