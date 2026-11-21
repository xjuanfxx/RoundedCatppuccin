# Rounded Catppuccin Mocha

[RoundedDiscord](https://github.com/MarkChan0225/RoundedDiscord) + [Catppuccin Mocha](https://github.com/catppuccin/discord) en **un solo tema** para Discord: arreglado, sin `@import` y más ligero.

| Archivo | Tamaño | Para quién |
|---|---|---|
| [`dist/RoundedCatppuccinMocha.theme.css`](dist/RoundedCatppuccinMocha.theme.css) | ~130 KB | Modo oscuro (Mocha) y claro (Latte) |
| [`dist/RoundedCatppuccinMocha-DarkOnly.theme.css`](dist/RoundedCatppuccinMocha-DarkOnly.theme.css) | ~80 KB | Solo modo oscuro |
| [`dist/roundeddiscord.fixed.css`](dist/roundeddiscord.fixed.css) | ~21 KB | Solo las esquinas redondeadas, legible |

Los originales juntos ocupan ~193 KB y hacen dos peticiones de red más.

## Instalación

Hace falta un mod de cliente: **Vencord**, **Equicord**, **Vesktop** o **BetterDiscord**.

### Opción A: archivo local
1. Descarga uno de los archivos `.theme.css` de `dist/`.
2. Cópialo en la carpeta de temas:
   - Vencord: `%APPDATA%\Vencord\themes` (o **Ajustes → Vencord → Temas → Abrir carpeta de temas**)
   - BetterDiscord: `%APPDATA%\BetterDiscord\themes`
3. Actívalo en **Ajustes → Vencord → Temas → Temas locales** (Ctrl+R si no aparece).

### Opción B: tema en línea (se actualiza solo)
En **Vencord → Temas → Temas en línea**, pega:

```
https://cdn.jsdelivr.net/gh/xjuanfxx/RoundedCatppuccin@main/dist/RoundedCatppuccinMocha.theme.css
```

Solo oscuro:

```
https://cdn.jsdelivr.net/gh/xjuanfxx/RoundedCatppuccin@main/dist/RoundedCatppuccinMocha-DarkOnly.theme.css
```

jsDelivr guarda en caché la rama `main` hasta 12 horas, así que los cambios pueden tardar un poco en llegar.

> Si antes usabas RoundedDiscord o Catppuccin por separado, quita sus enlaces de *Temas en línea* y cualquier `@import` de *QuickCSS* para no cargarlos dos veces.

### Cambiar el redondeo
En QuickCSS:

```css
:root { --radius: 12px; }
```

## Qué se arregló

En RoundedDiscord:
- **Errata** `.content-Pph8t6` → `.content_Pph8t6`: ese margen nunca se aplicaba.
- **5 selectores en dos bloques a la vez** (`.deny_2rG0YD`, `.deny_8GP31u`, `.guildSidebar_x3HD6i`, `.item_Wzc60b:first-child`, `.roundedRow_DC2Jmc td:first-child`): estaban en "redondeo arriba" y "redondeo izquierda", y solo se aplicaba el segundo. Se quitó la copia sin efecto, así que se ven igual.
- **Duplicados** `.container_FrbQJp` y `.root__KoJTP`: otra regla ya les pone el mismo valor.
- `rx: 16` fijo → `var(--radius)`.

En Catppuccin:
- Cada regla venía escrita dos veces (`.visual-refresh.theme-dark` y `.visual-refresh .theme-dark`). Se juntaron con `:is(...)`, que tiene la misma especificidad: 650 → 325 selectores.
- Los iconos SVG incrustados aparecían repetidos 2-4 veces. Ahora cada uno está una sola vez, en una variable.
- Minificado para el Chromium de Discord.

Se dejaron a propósito selectores que parecen repetidos pero suben la especificidad (por ejemplo `.card_qCN-Ri:not(...)` o `.item_jqZBm0[aria-checked="true"]`), porque sirven para ganar a los estilos de Discord.

`npm run verify` comprueba que el resultado tiene **exactamente las mismas reglas** que los originales, salvo los arreglos de arriba.

## Actualizaciones

Un workflow de GitHub Actions ([`.github/workflows/update.yml`](.github/workflows/update.yml)) descarga cada lunes las versiones nuevas de los temas originales, recompila, verifica y hace commit si algo cambió. También se puede lanzar a mano desde la pestaña *Actions*.

En local:

```
npm install
npm run update   # fetch + build + verify
```

Scripts:
- `npm run fetch`: descarga los originales a `src/`.
- `npm run build`: genera `dist/`.
- `npm run verify`: compara `dist/` con `src/` y falla si hay diferencias inesperadas.

## Limitaciones

- Las clases de RoundedDiscord son nombres exactos (como `.container_x3HD6i`), y Discord los cambia a menudo. Algunos pueden haber quedado obsoletos; eso solo se puede comprobar con Discord abierto. Catppuccin no tiene este problema, porque busca las clases por su nombre parcial (`[class^=item_]`).
- No se probó en todas las versiones de Discord.

## Créditos y licencia

- [RoundedDiscord](https://github.com/MarkChan0225/RoundedDiscord) de Mark Chan, licencia MIT.
- [Catppuccin for Discord](https://github.com/catppuccin/discord), licencia MIT.

Las licencias originales están en [`licenses/`](licenses). Los scripts de este repo son MIT ([`LICENSE`](LICENSE)).
