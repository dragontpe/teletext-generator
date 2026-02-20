# TelePage — Vintage Teletext Generator

A browser-based tool that generates authentic 1980s teletext screen captures in the style of BBC Ceefax, ITV Oracle, and other vintage teletext services.

**[Live Demo](https://dragontpe.github.io/teletext-generator/)** (if deployed to GitHub Pages)

## Features

- **12 Page Templates** — News, Weather, Sport, TV Listings, Index, Finance, Travel, and more
- **Mosaic Block Editor** — Draw pixel art using teletext's 2x3 sixel block graphics with draw, line, rectangle, fill, and erase tools
- **Clipart Library** — Pre-built teletext block art for quick insertion, with move/resize/delete
- **edit.tf Import** — Paste any [edit.tf](http://edit.tf) URL to import full teletext pages
- **CRT Effects** — Authentic post-processing: scanlines, phosphor glow, barrel distortion, chromatic aberration, vignette, and noise/grain
- **4 CRT Presets** — Clean, Mild, Authentic, and Beat-up Old TV
- **Customizable Colors** — Full teletext 8-color palette for headers, titles, body text, and mosaics
- **3 Teletext Fonts** — Bedstead, Bedstead Extended, and Mode Seven
- **Export Options** — Export as PNG (with or without CRT effects) or copy directly to clipboard

## Getting Started

### Run Locally

No build step required. Just serve the files with any HTTP server:

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve -p 8080

# PHP
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

### Deploy to GitHub Pages

1. Go to your repo Settings > Pages
2. Set source to "Deploy from a branch"
3. Select `main` branch, root folder
4. Save — your site will be live at `https://yourusername.github.io/teletext-generator/`

## How to Use

### Basic Page Creation

1. **Pick a template** from the grid (News, Weather, Sport, etc.)
2. **Edit content** — change the title, body text, page number, and service name
3. **Customize colors** using the teletext 8-color palette
4. **Adjust CRT effects** — choose a preset or fine-tune individual effects
5. **Export** as PNG or copy to clipboard

### Mosaic Editor

1. Click **Open Mosaic Editor** in the controls panel
2. Choose a drawing tool: Draw, Line, Rectangle, Erase, or Fill
3. Select a draw color from the palette
4. Draw directly on the preview canvas
5. Use the **Clipart Library** dropdown to insert pre-built block art

### Importing from edit.tf

[edit.tf](http://edit.tf) is an online teletext editor. To import pages:

1. Open the **Mosaic Editor** section
2. Paste an edit.tf URL into the "Import from edit.tf" field
3. Click **Import Page**
4. The full teletext page will be rendered as mosaic graphics

You can find example edit.tf pages at the [Horsenburger examples archive](https://github.com/Horsenburger/examples.edit.tf).

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+E` / `Cmd+E` | Export PNG (with CRT effects) |
| `Ctrl+Shift+E` / `Cmd+Shift+E` | Export Clean PNG |
| `Ctrl+Shift+C` / `Cmd+Shift+C` | Copy to Clipboard |

## Technical Details

- Pure HTML/CSS/JavaScript — no frameworks or build tools
- Canvas-based rendering: 576x500px (40 columns x 25 rows)
- Dual canvas system: teletext content + CRT effects overlay
- Teletext Level 1 mosaic graphics: 2x3 sixel blocks per character cell
- edit.tf hash format: 7-bit character codes packed into base64url encoding

### Teletext Color Palette

| Color | Hex |
|-------|-----|
| Black | `#000000` |
| Red | `#FF0000` |
| Green | `#00FF00` |
| Yellow | `#FFFF00` |
| Blue | `#0000FF` |
| Magenta | `#FF00FF` |
| Cyan | `#00FFFF` |
| White | `#FFFFFF` |

## Fonts

TelePage includes three teletext-accurate fonts:

- **[Bedstead](https://bjh21.me.uk/bedstead/)** — by Ben Harris, based on the SAA5050 teletext character generator
- **Bedstead Extended** — wider variant of Bedstead
- **[Mode Seven](https://galax.xyz/TELETEXT/)** — by galax.xyz, recreation of the Mode 7 display

## Credits

Built with Claude Code (Anthropic) and Codex (OpenAI).

Teletext service names (Ceefax, Oracle, etc.) are trademarks of their respective owners. This project is not affiliated with the BBC, ITV, Channel 4, or any broadcaster.

## License

MIT
