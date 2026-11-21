// Comprueba que dist/ contiene exactamente las mismas reglas que los originales,
// salvo los arreglos intencionados de build.js. Falla (exit 1) si hay diferencias inesperadas.
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const { transform } = require('lightningcss');

const ROOT = path.join(__dirname, '..');
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const minify = (css) =>
  transform({ filename: 'x.css', code: Buffer.from(css), minify: true, targets: { chrome: 130 << 16 } }).code.toString();

// Convierte un CSS en un conjunto de "selector|propiedad|valor".
function tuples(css) {
  const root = postcss.parse(minify(css));
  const out = new Set();
  root.walkRules((r) => {
    for (const s of r.selectors) {
      const m = s.match(/^:is\(([^,]+),([^)]+)\)(.*)$/s);
      for (const sel of m ? [m[1] + m[3], m[2] + m[3]] : [s]) {
        r.walkDecls((d) => out.add(`${sel}|${d.prop}|${d.value}${d.important ? '!' : ''}`));
      }
    }
  });
  return out;
}

// Deshace las variables --ctp-uN para poder comparar.
function expandUrlVars(css) {
  const root = postcss.parse(css);
  const vars = {};
  root.walkRules(':root', (r) => {
    r.walkDecls((d) => { if (/^--ctp-u\d+$/.test(d.prop)) { vars[d.prop] = d.value; d.remove(); } });
    if (!r.nodes.length) r.remove();
  });
  return root.toString().replace(/var\((--ctp-u\d+)\)/g, (_, k) => vars[k]);
}

// Diferencias esperadas por los arreglos de build.js.
const EXPECTED = /^(\.deny_2rG0YD|\.deny_8GP31u|\.guildSidebar_x3HD6i|\.item_Wzc60b:first-child|\.roundedRow_DC2Jmc td:first-child)\|border-radius\|var\(--radius\)var\(--radius\)0 0$|^\.root__KoJTP\|border-radius\|var\(--radius\)$|^\.newRing_lUEm2A rect\|rx\||^\.platform-osx \.content[-_]Pph8t6/;

const original = read('src', 'catppuccin-mocha.theme.css') + read('src', 'roundeddiscord.css') + ':root{--radius:16px}';
const A = tuples(original);
let failed = false;

for (const [file, dropLight] of [['RoundedCatppuccinMocha.theme.css', false], ['RoundedCatppuccinMocha-DarkOnly.theme.css', true]]) {
  const B = tuples(expandUrlVars(read('dist', file)));
  const missing = [...A].filter((t) => !B.has(t) && !EXPECTED.test(t) && !(dropLight && t.includes('theme-light')));
  const extra = [...B].filter((t) => !A.has(t) && !EXPECTED.test(t));
  console.log(`${file}: ${B.size} reglas, ${missing.length} faltan, ${extra.length} sobran`);
  [...missing.map((t) => '  - ' + t), ...extra.map((t) => '  + ' + t)].slice(0, 20).forEach((l) => console.log(l.slice(0, 200)));
  if (missing.length || extra.length) failed = true;
}
process.exit(failed ? 1 : 0);
