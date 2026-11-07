// Builds assets/grass.svg: my GitHub contribution graph, drawn like GitHub's own (dark theme).
// Run: GITHUB_TOKEN=... node scripts/build-grass.mjs   (the daily workflow does this)
import { writeFileSync } from "node:fs";

const LOGIN = "10x4hs";
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required");

const q = `{ user(login: "${LOGIN}") { contributionsCollection { contributionCalendar {
  totalContributions weeks { contributionDays { date contributionCount contributionLevel weekday } } } } } }`;
const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "profile-grass" },
  body: JSON.stringify({ query: q }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));
const cal = json.data.user.contributionsCollection.contributionCalendar;

// GitHub dark-theme greens
const COLOR = { NONE: "#161b22", FIRST_QUARTILE: "#0e4429", SECOND_QUARTILE: "#006d32", THIRD_QUARTILE: "#26a641", FOURTH_QUARTILE: "#39d353" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const W = 880, X0 = 72, Y0 = 92, S = 11, G = 3, P = S + G; // cell size + gap, like GitHub
const weeks = cal.weeks.slice(-53);
let cells = "", months = "", lastMonth = -1, today = null;
weeks.forEach((w, c) => {
  const x = X0 + c * P;
  const first = new Date(w.contributionDays[0].date + "T00:00:00Z");
  const m = first.getUTCMonth();
  if (m !== lastMonth && first.getUTCDate() <= 7) {
    months += `<text x="${x}" y="${Y0 - 10}" class="lbl">${MONTHS[m]}</text>`;
    lastMonth = m;
  }
  for (const d of w.contributionDays) {
    const y = Y0 + d.weekday * P;
    const tip = `${d.contributionCount || "No"} contribution${d.contributionCount === 1 ? "" : "s"} on ${d.date}`;
    cells += `<rect class="c" style="animation-delay:${(0.2 + c * 0.012).toFixed(3)}s" x="${x}" y="${y}" width="${S}" height="${S}" rx="2" fill="${COLOR[d.contributionLevel] || COLOR.NONE}" stroke="#fff" stroke-opacity=".05"><title>${tip}</title></rect>`;
    today = { x, y };
  }
});
const total = cal.totalContributions.toLocaleString("en-US");
const days = ["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => d && `<text x="${X0 - 10}" y="${Y0 + i * P + 9}" text-anchor="end" class="lbl">${d}</text>`).join("");
const LX = W - 44 - 5 * P - 32;
const legend = Object.values(COLOR).map((c, i) => `<rect x="${LX + i * P}" y="${Y0 + 7 * P + 12}" width="${S}" height="${S}" rx="2" fill="${c}" stroke="#fff" stroke-opacity=".05"/>`).join("");
const H = Y0 + 7 * P + 48;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">
  <title id="t">${total} contributions on GitHub in the last year.</title>
  <defs>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="22"/></clipPath>
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .lbl { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 11px; fill: #8b949e; }
      .c { opacity: 0; animation: pop .45s cubic-bezier(.28,.11,.32,1) forwards; }
      @keyframes pop { from { opacity: 0 } to { opacity: 1 } }
      .now { transform-box: fill-box; transform-origin: center; animation: ring 2.6s cubic-bezier(.28,.11,.32,1) 1.2s infinite; opacity: 0; }
      @keyframes ring { from { opacity: .9; transform: scale(1) } to { opacity: 0; transform: scale(2.6) } }
      @media (prefers-reduced-motion: reduce) { .c { animation: none; opacity: 1 } .now { animation: none } }
    </style>
  </defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="#0d1117"/>
    <text x="44" y="46" class="sans" font-size="16" font-weight="600" fill="#f0f6fc">${total} contributions in the last year</text>
    <text x="${W - 44}" y="46" text-anchor="end" class="mono" font-size="11" letter-spacing="1.6" fill="#8b949e">@${LOGIN}</text>
    ${months}
    ${days}
    ${cells}
    ${today ? `<rect class="now" x="${today.x}" y="${today.y}" width="${S}" height="${S}" rx="2" fill="none" stroke="#39d353" stroke-width="1.2"/>` : ""}
    <text x="${LX - 6}" y="${Y0 + 7 * P + 21}" text-anchor="end" class="lbl">Less</text>
    ${legend}
    <text x="${LX + 5 * P + 3}" y="${Y0 + 7 * P + 21}" class="lbl">More</text>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="22" fill="none" stroke="#fff" stroke-opacity=".1"/>
</svg>
`;
writeFileSync(new URL("../assets/grass.svg", import.meta.url), svg);
console.log(`grass.svg: ${total} contributions, ${weeks.length} weeks`);
