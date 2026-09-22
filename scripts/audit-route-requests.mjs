/**
 * Captura requests /api/v1/public/* por ruta (carga completa, no SPA nav).
 * Uso: node scripts/audit-route-requests.mjs [baseUrl]
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] || "http://localhost:5173";
const ROUTES = [
  "/",
  "/mapa",
  "/galeria",
  "/francisco",
  "/santos",
  "/video",
  "/redes",
  "/autor",
  "/escritores",
  "/creditos",
  "/tres-argentinos",
  "/el-libro",
];

function apiPath(url) {
  try {
    const u = new URL(url);
    if (!u.pathname.includes("/api/v1/public")) return null;
    return u.pathname.replace(/^.*\/api\/v1/, "/api/v1") + u.search;
  } catch {
    return null;
  }
}

async function captureRoute(browser, route) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const apis = [];
  page.on("request", (req) => {
    const p = apiPath(req.url());
    if (p && req.method() === "GET") apis.push(p);
  });
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);
  await context.close();
  return [...new Set(apis)].sort();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const report = {};
  for (const route of ROUTES) {
    process.stderr.write(`… ${route}\n`);
    report[route] = await captureRoute(browser, route);
  }
  await browser.close();
  const out = path.join(__dirname, "audit-route-requests.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.error(`wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
