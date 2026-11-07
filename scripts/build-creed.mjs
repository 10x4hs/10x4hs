// Builds assets/creed.svg: "Why I build" + the GitHub contribution graph drawn as a halftone field.
// Run: GITHUB_TOKEN=... node scripts/build-creed.mjs   (the daily workflow does this)
import { writeFileSync } from "node:fs";

const LOGIN = "10x4hs";
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error("GITHUB_TOKEN is required");

const q = `{ user(login: "${LOGIN}") { contributionsCollection { contributionCalendar {
  totalContributions weeks { contributionDays { date contributionCount contributionLevel weekday } } } } } }`;
const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { authorization: `bearer ${token}`, "content-type": "application/json", "user-agent": "profile-creed" },
  body: JSON.stringify({ query: q }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));
const cal = json.data.user.contributionsCollection.contributionCalendar;

// level → dot size and colour (site palette: blue → silver-blue → gold → ember)
const LV = {
  NONE: { r: 1.5, fill: "#ffffff", op: 0.1 },
  FIRST_QUARTILE: { r: 2.9, fill: "#2f5bff", op: 1 },
  SECOND_QUARTILE: { r: 3.8, fill: "#8a9bff", op: 1 },
  THIRD_QUARTILE: { r: 4.6, fill: "#e9c46a", op: 1 },
  FOURTH_QUARTILE: { r: 5.4, fill: "#ff7a2f", op: 1 },
};

const X0 = 47, Y0 = 352, P = 15; // first dot centre, pitch
const weeks = cal.weeks.slice(-53);
let dots = "";
let today = null;
weeks.forEach((w, c) => {
  for (const d of w.contributionDays) {
    const l = LV[d.contributionLevel] || LV.NONE;
    const x = X0 + c * P, y = Y0 + d.weekday * P;
    const tip = `${d.date}: ${d.contributionCount} contribution${d.contributionCount === 1 ? "" : "s"}`;
    dots += `<circle class="g" style="animation-delay:${(0.9 + c * 0.018).toFixed(3)}s" cx="${x}" cy="${y}" r="${l.r}" fill="${l.fill}" fill-opacity="${l.op}"><title>${tip}</title></circle>`;
    today = { x, y };
  }
});
const total = cal.totalContributions.toLocaleString("en-US");
const legend = Object.values(LV).map((l, i) => `<circle cx="${712 + i * 15}" cy="320" r="${l.r}" fill="${l.fill}" fill-opacity="${l.op}"/>`).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="480" viewBox="0 0 880 480" role="img" aria-labelledby="t">
  <title id="t">Why I build. For people, toward people, within people. I am an idealist, and I want to build a world where everyone is happy. Motto: God Left No Answer. ${total} contributions on GitHub in the last year.</title>
  <defs>
    <pattern id="dots" width="10" height="17.32" patternUnits="userSpaceOnUse">
      <circle cx="2.5" cy="4.33" r="1.2" fill="#fff"/><circle cx="7.5" cy="12.99" r="1.2" fill="#fff"/>
    </pattern>
    <mask id="dotMask"><rect width="880" height="480" fill="url(#dots)"/></mask>
    <radialGradient id="blue" r=".5"><stop offset="0" stop-color="#3a63ff"/><stop offset=".6" stop-color="#15245e" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <linearGradient id="silver" x1="0" x2="1">
      <stop offset="0" stop-color="#eceef1"/><stop offset=".36" stop-color="#c9ccd1"/><stop offset=".68" stop-color="#a7abb3"/><stop offset="1" stop-color="#dcdee2"/>
    </linearGradient>
    <clipPath id="card"><rect width="880" height="480" rx="22"/></clipPath>
    <style>
      .sans { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif; }
      .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
      .drift { animation: drift 16s ease-in-out infinite alternate; }
      @keyframes drift { to { transform: translate(120px, -40px) } }
      .in { opacity: 0; animation: appear 1s cubic-bezier(.28,.11,.32,1) forwards; }
      @keyframes appear { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
      .d1 { animation-delay: .2s } .d2 { animation-delay: .5s } .d3 { animation-delay: .8s } .d4 { animation-delay: 1.1s } .d5 { animation-delay: 1.5s }
      .ghost { opacity: 0; animation: ghost 2.4s cubic-bezier(.28,.11,.32,1) .4s forwards; }
      @keyframes ghost { from { opacity: 0; transform: translateX(24px) } to { opacity: 1; transform: none } }
      .g { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .5s cubic-bezier(.28,.11,.32,1) forwards; }
      @keyframes pop { from { opacity: 0; transform: scale(.2) } to { opacity: 1; transform: none } }
      .now { transform-box: fill-box; transform-origin: center; animation: ring 2.6s cubic-bezier(.28,.11,.32,1) 2s infinite; opacity: 0; }
      @keyframes ring { from { opacity: .9; transform: scale(1) } to { opacity: 0; transform: scale(3.6) } }
      @media (prefers-reduced-motion: reduce) { .drift, .now { animation: none } .in, .ghost, .g { animation: none; opacity: 1 } }
    </style>
  </defs>
  <g clip-path="url(#card)">
    <rect width="880" height="480" fill="#060914"/>
    <g mask="url(#dotMask)"><g class="drift"><ellipse cx="160" cy="300" rx="380" ry="220" fill="url(#blue)"/></g></g>

    <g class="ghost">
      <text x="836" y="70" text-anchor="end" class="mono" font-size="11" letter-spacing="2" fill="#8b8b90">MOTTO</text>
      <text x="836" y="126" text-anchor="end" class="sans" font-size="46" font-weight="700" letter-spacing="-1.4" fill="#2c2c2e">God Left</text>
      <text x="836" y="176" text-anchor="end" class="sans" font-size="46" font-weight="700" letter-spacing="-1.4" fill="#2c2c2e">No Answer</text>
    </g>

    <text x="44" y="70" class="mono in d1" font-size="11" letter-spacing="2" fill="#8b8b90">WHY I BUILD</text>
    <text x="44" y="128" class="sans in d2" font-size="38" font-weight="700" letter-spacing="-1" fill="#f5f5f7">For people,</text>
    <text x="44" y="174" class="sans in d3" font-size="38" font-weight="700" letter-spacing="-1" fill="url(#silver)">toward people,</text>
    <text x="44" y="220" class="sans in d4" font-size="38" font-weight="700" letter-spacing="-1" fill="#8e9099">within people.</text>
    <text x="44" y="262" class="sans in d5" font-size="15" fill="#a1a1a6">I am an idealist, and I want to build a world where everyone is happy.</text>

    <line x1="44" y1="292" x2="836" y2="292" stroke="#fff" stroke-opacity=".1"/>
    <g class="in d5">
      <text x="44" y="324" class="mono" font-size="11" letter-spacing="1.6" fill="#8b8b90"><tspan fill="#f5f5f7" font-weight="600">${total}</tspan>  CONTRIBUTIONS IN THE LAST YEAR</text>
      <text x="700" y="324" text-anchor="end" class="mono" font-size="10" letter-spacing="1.4" fill="#636366">LESS</text>
      ${legend}
      <text x="788" y="324" class="mono" font-size="10" letter-spacing="1.4" fill="#636366">MORE</text>
    </g>
    ${dots}
    ${today ? `<circle class="now" cx="${today.x}" cy="${today.y}" r="5" fill="none" stroke="#e9c46a" stroke-width="1.2"/>` : ""}
  </g>
  <rect x=".5" y=".5" width="879" height="479" rx="22" fill="none" stroke="#fff" stroke-opacity=".1"/>
</svg>
`;
writeFileSync(new URL("../assets/creed.svg", import.meta.url), svg);
console.log(`creed.svg: ${total} contributions, ${weeks.length} weeks`);
