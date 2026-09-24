import fs from "fs";
import path from "path";

const dir = "c:/Users/NEW GAME/Desktop/TodoFran/FiestasReligiosas/frontend/dist/assets";
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".js"))) {
  const s = fs.readFileSync(path.join(dir, f), "utf8");
  if (s.includes("api/v1") || s.includes("fiestas-religiosas") || s.includes("vercel.app")) {
    const hits = [];
    for (const re of [
      /https:\/\/fiestas-religiosas[^"'`]+/g,
      /\/api\/v1/g,
      /https:\/\/[^"'`]+\.vercel\.app[^"'`]*/g,
    ]) {
      const m = s.match(re);
      if (m) hits.push(...m);
    }
    console.log(f, [...new Set(hits)].slice(0, 10));
  }
}
