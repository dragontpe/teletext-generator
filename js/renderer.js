// TelePage - Teletext Rendering Engine
// Renders a 40x25 character grid onto an HTML5 canvas

class TeletextRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cols = 40;
    this.rows = 25;
    this.baseWidth = 576;
    this.baseHeight = 500;
    this.cellWidth = this.baseWidth / this.cols;   // 14.4
    this.cellHeight = this.baseHeight / this.rows; // 20
    this.canvas.width = this.baseWidth;
    this.canvas.height = this.baseHeight;
    this.font = 'bedstead';

    // The grid: each cell has { char, fg, bg, mosaic (sixel data), doubleTop, doubleBot }
    this.grid = this.createEmptyGrid();
    // Mosaic overlay: separate layer for mosaic block edits
    this.mosaicOverlay = this.createEmptyMosaicOverlay();
    // Import text overlay: persists across re-renders for edit.tf imported text
    this.importTextOverlay = this.createEmptyImportOverlay();
  }

  createEmptyGrid() {
    const grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({ char: ' ', fg: 'white', bg: 'black', doubleTop: false, doubleBot: false, font: null });
      }
      grid.push(row);
    }
    return grid;
  }

  createEmptyMosaicOverlay() {
    // Each cell can have a mosaic: { sixels: [6 booleans], color: string } or null
    const overlay = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(null);
      }
      overlay.push(row);
    }
    return overlay;
  }

  createEmptyImportOverlay() {
    // Each cell: { char, fg, bg } or null
    const overlay = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(null);
      }
      overlay.push(row);
    }
    return overlay;
  }

  clearGrid() {
    this.grid = this.createEmptyGrid();
  }

  clearMosaicOverlay() {
    this.mosaicOverlay = this.createEmptyMosaicOverlay();
  }

  clearImportOverlay() {
    this.importTextOverlay = this.createEmptyImportOverlay();
  }

  setImportText(row, col, char, fg, bg) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.importTextOverlay[row][col] = { char, fg, bg: bg || 'black' };
    }
  }

  setCell(row, col, char, fg = 'white', bg = 'black', font = null) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.grid[row][col] = { ...this.grid[row][col], char, fg, bg, font };
    }
  }

  setMosaic(row, col, sixels, color) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.mosaicOverlay[row][col] = { sixels: [...sixels], color };
    }
  }

  clearMosaicCell(row, col) {
    if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
      this.mosaicOverlay[row][col] = null;
    }
  }

  toggleSixel(row, col, sixelIndex, color) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    let mosaic = this.mosaicOverlay[row][col];
    if (!mosaic) {
      mosaic = { sixels: [false, false, false, false, false, false], color };
      this.mosaicOverlay[row][col] = mosaic;
    }
    mosaic.sixels[sixelIndex] = !mosaic.sixels[sixelIndex];
    mosaic.color = color;
    // If all sixels are off, remove the mosaic
    if (mosaic.sixels.every(s => !s)) {
      this.mosaicOverlay[row][col] = null;
    }
  }

  setSixel(row, col, sixelIndex, on, color) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    let mosaic = this.mosaicOverlay[row][col];
    if (!mosaic) {
      mosaic = { sixels: [false, false, false, false, false, false], color };
      this.mosaicOverlay[row][col] = mosaic;
    }
    mosaic.sixels[sixelIndex] = on;
    mosaic.color = color;
    if (mosaic.sixels.every(s => !s)) {
      this.mosaicOverlay[row][col] = null;
    }
  }

  // Write a string starting at (row, col), wrapping at 40 columns
  writeString(row, col, text, fg = 'white', bg = 'black', font = null) {
    for (let i = 0; i < text.length; i++) {
      const c = col + i;
      if (c >= this.cols) break;
      this.setCell(row, c, text[i], fg, bg, font);
    }
  }

  // Write text with word-wrapping, returns number of rows used
  writeWrapped(startRow, startCol, text, fg = 'white', bg = 'black', maxRows = 99, font = null) {
    const lines = text.split('\n');
    let row = startRow;
    for (const line of lines) {
      if (row - startRow >= maxRows) break;
      if (line.length === 0) {
        row++;
        continue;
      }
      // Word wrap at column boundary
      const maxWidth = this.cols - startCol;
      let remaining = line;
      while (remaining.length > 0 && row - startRow < maxRows) {
        if (remaining.length <= maxWidth) {
          this.writeString(row, startCol, remaining, fg, bg, font);
          row++;
          remaining = '';
        } else {
          // Find last space before maxWidth
          let breakAt = remaining.lastIndexOf(' ', maxWidth);
          if (breakAt <= 0) breakAt = maxWidth;
          this.writeString(row, startCol, remaining.substring(0, breakAt), fg, bg, font);
          remaining = remaining.substring(breakAt).trimStart();
          row++;
        }
      }
    }
    return row - startRow;
  }

  // Set double-height flags
  setDoubleHeight(row, col, length) {
    for (let i = 0; i < length && col + i < this.cols; i++) {
      this.grid[row][col + i].doubleTop = true;
      if (row + 1 < this.rows) {
        this.grid[row + 1][col + i].doubleBot = true;
        this.grid[row + 1][col + i].char = this.grid[row][col + i].char;
        this.grid[row + 1][col + i].fg = this.grid[row][col + i].fg;
        this.grid[row + 1][col + i].bg = this.grid[row][col + i].bg;
      }
    }
  }

  // Build the page from template and user data
  buildPage(templateId, data) {
    this.clearGrid();
    const tmpl = templates[templateId];
    if (!tmpl) return;

    const pageNum = data.pageNumber || tmpl.defaultPageNum;
    const service = data.serviceName || tmpl.serviceName;
    const title = (data.title !== undefined && data.title !== null ? data.title : tmpl.defaultTitle).toUpperCase();
    const body = data.body !== undefined && data.body !== null ? data.body : tmpl.defaultBody;
    const headerBg = data.headerBg || tmpl.headerBg;
    const headerTextColor = data.headerText || tmpl.headerText;
    const subtitle = data.subtitle || '';
    const titleColor = data.titleColor || tmpl.titleColor;
    const bodyColor = data.bodyColor || tmpl.bodyColor;
    const fastext = data.fastext || tmpl.fastext;
    const dateTime = data.dateTime || this.formatDateTime();
    const fontHeader = data.fontHeader || 'bedstead';
    const fontTitle = data.fontTitle || 'bedstead';
    const fontBody = data.fontBody || 'bedstead';
    const fastextEnabled = data.fastextEnabled !== false;

    let currentRow = 0;

    for (const item of tmpl.layout) {
      switch (item.type) {
        case 'header':
          this.renderHeader(pageNum, service, dateTime, headerBg, headerTextColor, fontHeader);
          currentRow = 1;
          break;

        case 'separator': {
          const sepColor = item.color || titleColor;
          for (let c = 0; c < this.cols; c++) {
            // Mark as separator — rendered programmatically as bottom third filled
            this.grid[currentRow][c] = { char: '', fg: sepColor, bg: 'black', separator: true };
          }
          currentRow++;
          break;
        }

        case 'title': {
          // Center the title
          const padded = this.centerText(title, this.cols);
          this.writeString(currentRow, 0, padded, titleColor, 'black', fontTitle);
          this.setDoubleHeight(currentRow, 0, this.cols);
          currentRow++;
          break;
        }

        case 'title-bottom':
          // Already handled by setDoubleHeight
          currentRow++;
          break;

        case 'subtitle': {
          if (subtitle) {
            const subPadded = this.centerText(subtitle.toUpperCase(), this.cols);
            this.writeString(currentRow, 0, subPadded, bodyColor, 'black', fontTitle);
          }
          currentRow++;
          break;
        }

        case 'blank':
          currentRow++;
          break;

        case 'body': {
          const maxRows = item.rows || (23 - currentRow);
          if (templateId === 'index') {
            this.renderIndexBody(currentRow, body, bodyColor, maxRows, fontBody);
          } else {
            this.writeWrapped(currentRow, 1, body, bodyColor, 'black', maxRows, fontBody);
          }
          currentRow = 24;
          break;
        }

        case 'sports-table': {
          const sports = data.sports || tmpl.defaultSports || [];
          this.renderSportsTable(currentRow, sports, bodyColor, item.rows || 18, fontBody);
          currentRow = 24;
          break;
        }

        case 'tv-table': {
          const listings = data.listings || tmpl.defaultListings || [];
          this.renderTvListings(currentRow, listings, bodyColor, titleColor, item.rows || 18, fontBody);
          currentRow = 24;
          break;
        }

        case 'fastext':
          if (fastextEnabled) {
            this.renderFastext(fastext);
          }
          currentRow = 25;
          break;
      }
    }
  }

  formatDateTime() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const day = days[now.getDay()];
    const date = now.getDate();
    const month = months[now.getMonth()];
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${day} ${date} ${month} ${h}:${m}/${s}`;
  }

  centerText(text, width) {
    if (text.length >= width) return text.substring(0, width);
    const pad = Math.floor((width - text.length) / 2);
    return ' '.repeat(pad) + text + ' '.repeat(width - text.length - pad);
  }

  renderHeader(pageNum, service, dateTime, bgColor, textColor, font) {
    // Row 0: "P100  CEEFAX 100  Thu 14 Mar  16:42/31"
    const pageStr = `P${pageNum}`;
    const mid = `${service} ${pageNum}`;
    const right = dateTime;
    // Build the full 40-char line
    let line = pageStr;
    // Pad between page and service name
    const midStart = Math.max(pageStr.length + 2, Math.floor((this.cols - mid.length) / 2));
    while (line.length < midStart) line += ' ';
    line += mid;
    // Pad to right-align date/time
    const rightStart = this.cols - right.length;
    while (line.length < rightStart) line += ' ';
    line += right;
    line = line.substring(0, this.cols);

    for (let c = 0; c < this.cols; c++) {
      const ch = c < line.length ? line[c] : ' ';
      this.setCell(0, c, ch, textColor, bgColor, font);
    }
  }

  renderFastext(labels) {
    const colors = ['red', 'green', 'yellow', 'cyan'];
    const row = 24;
    let col = 0;
    const labelWidth = 10;

    for (let i = 0; i < 4; i++) {
      const label = (labels[i] || '').substring(0, labelWidth - 1);
      // Colored block character
      this.setCell(row, col, '\u25A0', colors[i], 'black');
      col++;
      // Label text
      this.writeString(row, col, label, 'white', 'black');
      col += labelWidth - 1;
    }
  }

  renderSportsTable(startRow, sports, bodyColor, maxRows, font) {
    let row = startRow;
    this.writeString(row, 1, 'Home', 'cyan', 'black', font);
    this.writeString(row, 20, 'Score', 'cyan', 'black', font);
    this.writeString(row, 27, 'Away', 'cyan', 'black', font);
    row++;
    for (let c = 1; c < 39; c++) {
      this.setCell(row, c, '\u2500', 'cyan', 'black', font);
    }
    row++;

    for (let i = 0; i < sports.length && (row - startRow) < maxRows - 1; i++) {
      const match = sports[i];
      const altColor = i % 2 === 0 ? 'white' : 'cyan';
      const homePad = match.home.substring(0, 17).padEnd(17);
      const score = `${match.homeScore}-${match.awayScore}`;
      const scorePad = score.padStart(3).padEnd(5);
      const away = match.away.substring(0, 13);

      this.writeString(row, 1, homePad, altColor, 'black', font);
      this.writeString(row, 20, scorePad, 'yellow', 'black', font);
      this.writeString(row, 27, away, altColor, 'black', font);
      row++;
    }
  }

  renderTvListings(startRow, listings, bodyColor, timeColor, maxRows, font) {
    let row = startRow;
    for (let i = 0; i < listings.length && (row - startRow) < maxRows; i++) {
      const item = listings[i];
      const time = (item.time || '').substring(0, 5).padEnd(6);
      const prog = (item.programme || '').substring(0, 33);
      this.writeString(row, 1, time, 'yellow', 'black', font);
      this.writeString(row, 7, prog, i % 2 === 0 ? 'white' : 'cyan', 'black', font);
      row++;
    }
  }

  renderIndexBody(startRow, body, bodyColor, maxRows, font) {
    const lines = body.split('\n');
    let row = startRow;
    for (let i = 0; i < lines.length && (row - startRow) < maxRows; i++) {
      const line = lines[i].trim();
      if (!line) { row++; continue; }
      const match = line.match(/^(.+?)\s*(\d{3})\s*$/);
      if (match) {
        const text = match[1].substring(0, 36);
        const num = match[2];
        this.writeString(row, 1, text, bodyColor, 'black', font);
        this.writeString(row, this.cols - num.length - 1, num, 'yellow', 'black', font);
      } else {
        this.writeString(row, 1, line.substring(0, 38), bodyColor, 'black', font);
      }
      row++;
    }
  }

  // Main render method
  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    // Clear to black
    ctx.fillStyle = TELETEXT_COLORS.black;
    ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

    // Render each cell
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const x = c * this.cellWidth;
        const y = r * this.cellHeight;

        // Draw background
        if (cell.bg !== 'black') {
          ctx.fillStyle = TELETEXT_COLORS[cell.bg] || cell.bg;
          ctx.fillRect(Math.floor(x), Math.floor(y),
                       Math.ceil(this.cellWidth), Math.ceil(this.cellHeight));
        }

        // Separator cells: draw a thin line at the bottom third
        if (cell.separator) {
          ctx.fillStyle = TELETEXT_COLORS[cell.fg] || cell.fg;
          ctx.fillRect(Math.floor(x), Math.floor(y + this.cellHeight * 2 / 3),
                       Math.ceil(this.cellWidth), Math.ceil(this.cellHeight / 3));
          continue;
        }

        // Check for mosaic overlay
        const mosaic = this.mosaicOverlay[r][c];
        if (mosaic && mosaic.sixels.some(s => s)) {
          this.renderMosaicCell(ctx, x, y, mosaic);
        } else {
          // Check for import text overlay (from edit.tf imports)
          const imported = this.importTextOverlay[r][c];
          if (imported && imported.char && imported.char !== ' ') {
            // Draw imported text background if not black
            if (imported.bg && imported.bg !== 'black') {
              ctx.fillStyle = TELETEXT_COLORS[imported.bg] || imported.bg;
              ctx.fillRect(Math.floor(x), Math.floor(y),
                           Math.ceil(this.cellWidth), Math.ceil(this.cellHeight));
            }
            this.renderTextCell(ctx, x, y, { char: imported.char, fg: imported.fg, font: null });
          } else if (cell.char && cell.char !== ' ') {
            // Draw template text character
            this.renderTextCell(ctx, x, y, cell);
          }
        }
      }
    }
  }

  renderTextCell(ctx, x, y, cell) {
    const fg = TELETEXT_COLORS[cell.fg] || cell.fg;
    ctx.fillStyle = fg;

    var fontMap = {
      'bedstead': 'Bedstead',
      'bedstead-ext': 'Bedstead Extended',
      'modeseven': 'Mode Seven'
    };
    const fontKey = cell.font || this.font || 'bedstead';
    const fontFamily = fontMap[fontKey] || 'Bedstead';

    if (cell.doubleTop) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(Math.floor(x), Math.floor(y), Math.ceil(this.cellWidth), Math.ceil(this.cellHeight));
      ctx.clip();
      ctx.translate(Math.floor(x), Math.floor(y));
      ctx.scale(1, 2);
      ctx.font = `${this.cellHeight}px "${fontFamily}"`;
      ctx.textBaseline = 'top';
      ctx.fillText(cell.char, 0, 0);
      ctx.restore();
    } else if (cell.doubleBot) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(Math.floor(x), Math.floor(y), Math.ceil(this.cellWidth), Math.ceil(this.cellHeight));
      ctx.clip();
      ctx.translate(Math.floor(x), Math.floor(y));
      ctx.scale(1, 2);
      ctx.font = `${this.cellHeight}px "${fontFamily}"`;
      ctx.textBaseline = 'top';
      ctx.fillText(cell.char, 0, -this.cellHeight / 2);
      ctx.restore();
    } else {
      ctx.font = `${this.cellHeight}px "${fontFamily}"`;
      ctx.textBaseline = 'top';
      ctx.fillText(cell.char, Math.floor(x), Math.floor(y));
    }
  }

  renderMosaicCell(ctx, x, y, mosaic) {
    const color = TELETEXT_COLORS[mosaic.color] || mosaic.color;
    ctx.fillStyle = color;

    // 2x3 sixel grid within the cell
    // Sixels: 0=top-left, 1=top-right, 2=mid-left, 3=mid-right, 4=bot-left, 5=bot-right
    const halfW = this.cellWidth / 2;
    const thirdH = this.cellHeight / 3;

    const positions = [
      [0, 0],              // sixel 0: top-left
      [halfW, 0],          // sixel 1: top-right
      [0, thirdH],         // sixel 2: mid-left
      [halfW, thirdH],     // sixel 3: mid-right
      [0, thirdH * 2],     // sixel 4: bot-left
      [halfW, thirdH * 2], // sixel 5: bot-right
    ];

    for (let i = 0; i < 6; i++) {
      if (mosaic.sixels[i]) {
        const sx = Math.floor(x + positions[i][0]);
        const sy = Math.floor(y + positions[i][1]);
        const sw = Math.ceil(halfW);
        const sh = Math.ceil(thirdH);
        ctx.fillRect(sx, sy, sw, sh);
      }
    }
  }

  // Get cell coordinates from pixel position
  getCellFromPixel(px, py) {
    const col = Math.floor(px / this.cellWidth);
    const row = Math.floor(py / this.cellHeight);
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return { row, col };
  }

  // Get sixel index from pixel position within a cell
  getSixelFromPixel(px, py) {
    const cellPos = this.getCellFromPixel(px, py);
    if (!cellPos) return null;
    const localX = px - cellPos.col * this.cellWidth;
    const localY = py - cellPos.row * this.cellHeight;
    const halfW = this.cellWidth / 2;
    const thirdH = this.cellHeight / 3;
    const sx = localX < halfW ? 0 : 1;
    const sy = localY < thirdH ? 0 : (localY < thirdH * 2 ? 1 : 2);
    const sixelIndex = sy * 2 + sx;
    return { ...cellPos, sixelIndex };
  }
}
