// Regenerates src/data/logo-icons.json: only the Iconify icons that src/data/integrations.ts uses,
// so app logos render without fetching from the Iconify API.
// Run: npx -p @iconify-json/logos -p @iconify-json/simple-icons -p @iconify/utils node scripts/build-logo-icons.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getIcons } = require("@iconify/utils");
const src = readFileSync(new URL("../src/data/integrations.ts", import.meta.url), "utf8");
const out = [];
for (const prefix of ["logos", "simple-icons"]) {
  const set = require(`@iconify-json/${prefix}/icons.json`);
  const names = [...src.matchAll(new RegExp(`"${prefix}:([a-z0-9-]+)"`, "g"))].map((m) => m[1]);
  const sub = getIcons(set, names);
  const missing = names.filter((n) => !sub?.icons[n] && !sub?.aliases?.[n]);
  if (missing.length) console.warn(prefix, "missing:", missing.join(", "));
  out.push(sub);
}
writeFileSync(new URL("../src/data/logo-icons.json", import.meta.url), JSON.stringify(out));
console.log("wrote", out.map((s) => `${s.prefix}: ${Object.keys(s.icons).length}`).join(", "));
