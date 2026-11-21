// Genera dist/ a partir de src/: arregla RoundedDiscord, compacta Catppuccin y une ambos.
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const { transform } = require('lightningcss');
const pkg = require('../package.json');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const log = [];

// ---------- RoundedDiscord: arreglos ----------
function fixRounded(css) {
  const root = postcss.parse(css);

  // 1. Errata: guion en vez de guion bajo.
  root.walkRules((r) => {
    if (r.selector.includes('.content-Pph8t6')) {
      r.selector = r.selector.replaceAll('.content-Pph8t6', '.content_Pph8t6');
      log.push('errata .content-Pph8t6 -> .content_Pph8t6');
    }
  });

  // 2. Selectores en "redondeo arriba" y "redondeo izquierda" a la vez: gana el último,
  //    así que la copia del bloque "arriba" no hace nada. Se elimina.
  const TOP = 'var(--radius) var(--radius) 0 0';
  const LEFT = 'var(--radius) 0 0 var(--radius)';
  const leftSelectors = new Set();
  root.walkRules((r) => {
    const d = r.nodes.find((n) => n.prop === 'border-radius');
    if (d && d.value === LEFT && !d.important) r.selectors.forEach((s) => leftSelectors.add(s));
  });
  root.walkRules((r) => {
    const d = r.nodes.find((n) => n.prop === 'border-radius');
    if (!d || d.value !== TOP || d.important) return;
    const keep = r.selectors.filter((s) => !leftSelectors.has(s));
    if (keep.length < r.selectors.length) {
      log.push(`eliminados ${r.selectors.length - keep.length} selectores en conflicto (arriba vs izquierda)`);
      r.selectors = keep;
    }
  });

  // 3. Selectores cubiertos por otra regla que fija el mismo valor (o con !important).
  const covered = ['.container_FrbQJp', '.root__KoJTP'];
  root.walkRules((r) => {
    const d = r.nodes.find((n) => n.prop === 'border-radius');
    if (!d || d.important || r.nodes.length > 1 || d.value !== 'var(--radius)') return;
    const keep = r.selectors.filter((s) => !covered.includes(s));
    if (keep.length < r.selectors.length) {
      log.push(`eliminados ${r.selectors.length - keep.length} selectores duplicados`);
      r.selectors = keep;
    }
  });

  // 4. rx fijo -> sigue a --radius.
  root.walkDecls('rx', (d) => {
    if (d.value === '16') { d.value = 'var(--radius)'; log.push('rx: 16 -> var(--radius)'); }
  });

  return root.toString();
}

// ---------- Catppuccin: compactar prefijos duplicados ----------
// ".visual-refresh.theme-dark X, .visual-refresh .theme-dark X"
//   -> ":is(.visual-refresh.theme-dark,.visual-refresh .theme-dark) X"
// Misma especificidad (0,2,0) en ambas formas, así que el resultado es idéntico.
function collapseThemes(css, { dropLight = false } = {}) {
  const root = postcss.parse(css);
  const PREFIX = /^\.visual-refresh(\.| \.)theme-(dark|light)(?=$|[\s>+~:.\[])(.*)$/s;
  root.walkRules((r) => {
    const groups = new Map();
    const out = [];
    for (const s of r.selectors) {
      const m = s.match(PREFIX);
      if (!m) { out.push(s); continue; }
      const key = m[2] + '\0' + m[3];
      if (!groups.has(key)) groups.set(key, { mode: m[2], rest: m[3], forms: new Set() });
      groups.get(key).forms.add(m[1]);
    }
    for (const g of groups.values()) {
      if (dropLight && g.mode === 'light') continue;
      if (g.forms.size === 2) out.push(`:is(.visual-refresh.theme-${g.mode},.visual-refresh .theme-${g.mode})${g.rest}`);
      else for (const f of g.forms) out.push(`.visual-refresh${f}theme-${g.mode}${g.rest}`);
    }
    if (!out.length) r.remove();
    else r.selectors = out;
  });
  return root.toString();
}

// Minifica para el Chromium que usa Discord.
const minify = (css) =>
  transform({ filename: 'theme.css', code: Buffer.from(css), minify: true, targets: { chrome: 130 << 16 } })
    .code.toString();

// Los iconos SVG incrustados se repiten 2-4 veces: se guardan una vez en variables.
function dedupeUrls(css) {
  const urls = css.match(/url\(("[^"]*"|'[^']*'|[^)]*)\)/g) || [];
  const count = {};
  urls.forEach((u) => (count[u] = (count[u] || 0) + 1));
  let vars = '';
  let i = 0;
  for (const [u, n] of Object.entries(count)) {
    if (n < 2 || u.length < 200) continue;
    const v = `--ctp-u${i++}`;
    vars += `${v}:${u};`;
    css = css.split(u).join(`var(${v})`);
  }
  return (vars ? `:root{${vars}}` : '') + css;
}

const header = (name, desc) => `/**
 * @name ${name}
 * @description ${desc}
 * @version ${pkg.version}
 * @author RoundedDiscord (MarkChan0225) + Catppuccin, combinados y optimizados
 * @source https://github.com/MarkChan0225/RoundedDiscord
 * @source https://github.com/catppuccin/discord
*/
:root{--radius:16px}
`;

// ---------- Build ----------
fs.mkdirSync(DIST, { recursive: true });
const rounded = fixRounded(read('roundeddiscord.css'));
const mocha = read('catppuccin-mocha.theme.css');
const roundedMin = minify(rounded);

const outputs = {
  'roundeddiscord.fixed.css': rounded,
  'RoundedCatppuccinMocha.theme.css':
    header('Rounded Catppuccin Mocha', 'Catppuccin Mocha (oscuro) + Latte (claro) con esquinas redondeadas. Un solo archivo, sin @import.') +
    dedupeUrls(minify(collapseThemes(mocha))) + '\n' + roundedMin + '\n',
  'RoundedCatppuccinMocha-DarkOnly.theme.css':
    header('Rounded Catppuccin Mocha (solo oscuro)', 'Catppuccin Mocha con esquinas redondeadas, sin las reglas del modo claro.') +
    dedupeUrls(minify(collapseThemes(mocha, { dropLight: true }))) + '\n' + roundedMin + '\n',
};

for (const [file, css] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(DIST, file), css);
  console.log(`✓ dist/${file} (${(css.length / 1024).toFixed(1)} KB)`);
}
[...new Set(log)].forEach((l) => console.log('  · ' + l));
