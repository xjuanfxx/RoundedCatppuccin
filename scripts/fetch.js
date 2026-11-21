// Descarga las versiones más recientes de los temas originales a src/.
const fs = require('fs');
const path = require('path');

const SOURCES = {
  'roundeddiscord.css': 'https://markchan0225.github.io/RoundedDiscord/src/roundeddiscord.css',
  'catppuccin-mocha.theme.css': 'https://catppuccin.github.io/discord/dist/catppuccin-mocha.theme.css',
};

const SRC = path.join(__dirname, '..', 'src');

(async () => {
  fs.mkdirSync(SRC, { recursive: true });
  for (const [file, url] of Object.entries(SOURCES)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    const text = await res.text();
    if (text.length < 1000) throw new Error(`${url} parece vacío (${text.length} bytes)`);
    fs.writeFileSync(path.join(SRC, file), text);
    console.log(`✓ ${file} (${text.length} bytes)`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
