// TelePage - Mosaic Block Editor

class MosaicEditor {
  constructor(renderer, effectsCanvas, onUpdate) {
    this.renderer = renderer;
    this.canvas = effectsCanvas;
    this.onUpdate = onUpdate;
    this.active = false;
    this.tool = 'draw';
    this.color = 'white';
    this.drawing = false;
    this.startCell = null;

    // Placement mode for clipart drag-and-drop
    this.placing = false;
    this.placeArt = null;
    this.placeRow = 0;
    this.placeCol = 0;

    // Placed clipart tracking
    this.placedItems = [];
    this.selectedItem = null;
    this._selectOverlay = null;
    this._selectCanvas = null;
    this._draggingSelected = false;
    this._dragOffsetRow = 0;
    this._dragOffsetCol = 0;
    this._resizingHandle = null; // 'nw','ne','sw','se' or null
    this._resizeAnchorRow = 0;
    this._resizeAnchorCol = 0;

    // Inline text tool editor state
    this._textBoxEditor = null;
    this._textBoxRow = 1;
    this._textBoxCol = 0;
    this._textBoxWidth = 1;
    this._textBoxHeight = 1;

    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
  }

  activate() {
    this.active = true;
    // Disable selection overlay so draw overlay can take its place
    this._disableSelection();
    var container = this.canvas.parentElement;

    // Preview canvas for line/rect shape preview while dragging
    var pvCanvas = document.createElement('canvas');
    pvCanvas.id = 'drawPreviewCanvas';
    pvCanvas.width = this.renderer.baseWidth;
    pvCanvas.height = this.renderer.baseHeight;
    pvCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:9;pointer-events:none;';
    container.appendChild(pvCanvas);
    this._drawPreviewCanvas = pvCanvas;

    // Create a transparent draw overlay (same approach as selection/placement)
    var overlay = document.createElement('div');
    overlay.id = 'drawOverlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;cursor:crosshair;';
    overlay.addEventListener('mousedown', this._onMouseDown);
    overlay.addEventListener('mousemove', this._onMouseMove);
    overlay.addEventListener('mouseup', this._onMouseUp);
    overlay.addEventListener('mouseleave', this._onMouseUp);
    container.appendChild(overlay);
    this._drawOverlay = overlay;
    // Keep selection visuals available while editing; interactions stay on draw overlay.
    this._enableSelection();
    this._setSelectionInteractivity(false);
    document.body.classList.add('mosaic-active');
  }

  deactivate() {
    this.active = false;
    this.drawing = false;
    // Remove draw overlay and preview canvas
    if (this._drawOverlay && this._drawOverlay.parentElement) {
      this._drawOverlay.parentElement.removeChild(this._drawOverlay);
    }
    this._drawOverlay = null;
    if (this._drawPreviewCanvas && this._drawPreviewCanvas.parentElement) {
      this._drawPreviewCanvas.parentElement.removeChild(this._drawPreviewCanvas);
    }
    this._drawPreviewCanvas = null;
    this._closeTextBoxEditor();
    document.body.classList.remove('mosaic-active');
    // Re-enable selection overlay for placed items
    this._enableSelection();
    this._setSelectionInteractivity(true);
  }

  setTool(tool) {
    if (this.tool !== tool) {
      this._closeTextBoxEditor();
    }
    this.tool = tool;
    if (this.active) {
      this._setSelectionInteractivity(tool === 'text');
    }
  }
  setColor(color) { this.color = color; }

  _setSelectionInteractivity(enabled) {
    if (!this._selectOverlay || !this._selectCanvas) return;
    this._selectOverlay.style.pointerEvents = enabled ? 'auto' : 'none';
    this._selectOverlay.style.zIndex = enabled ? '10' : '8';
    this._selectCanvas.style.zIndex = enabled ? '9' : '11';
  }

  _getCanvasCoords(e) {
    const rect = this.renderer.canvas.getBoundingClientRect();
    const scaleX = this.renderer.baseWidth / rect.width;
    const scaleY = this.renderer.baseHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  _onMouseDown(e) {
    if (!this.active) return;
    e.preventDefault();
    const coords = this._getCanvasCoords(e);

    if (this.tool === 'text') {
      var cellPos = this.renderer.getCellFromPixel(coords.x, coords.y);
      if (cellPos && cellPos.row !== 0 && cellPos.row !== 24) {
        var hitItem = this._findItemAt(cellPos.row, cellPos.col);
        if (hitItem) {
          this._selectItem(hitItem);
          this._draggingSelected = true;
          this._dragOffsetRow = cellPos.row - hitItem.row;
          this._dragOffsetCol = cellPos.col - hitItem.col;
          this.drawing = false;
          this.startCell = null;
          return;
        }
        this._deselectItem();
      }
    }

    this.drawing = true;
    const info = this.renderer.getSixelFromPixel(coords.x, coords.y);
    if (!info) return;

    // Skip header (row 0) and fastext (row 24)
    if (info.row === 0 || info.row === 24) return;

    this.startCell = info;

    switch (this.tool) {
      case 'draw':
        this.renderer.toggleSixel(info.row, info.col, info.sixelIndex, this.color);
        this.onUpdate();
        break;
      case 'erase':
        this.renderer.setSixel(info.row, info.col, info.sixelIndex, false, this.color);
        this.onUpdate();
        break;
      case 'fill':
        this._floodFill(info.row, info.col, info.sixelIndex);
        this.onUpdate();
        break;
      // line and rect wait for mouseup
    }
  }

  _onMouseMove(e) {
    if (!this.active) return;
    const coords = this._getCanvasCoords(e);

    if (this.tool === 'text' && this._draggingSelected && this.selectedItem) {
      var cell = this.renderer.getCellFromPixel(coords.x, coords.y);
      if (!cell) return;

      var newRow = cell.row - this._dragOffsetRow;
      var newCol = cell.col - this._dragOffsetCol;
      newRow = Math.max(1, Math.min(newRow, 24 - this.selectedItem.height));
      newCol = Math.max(0, Math.min(newCol, 40 - this.selectedItem.width));

      if (newRow !== this.selectedItem.row || newCol !== this.selectedItem.col) {
        this._eraseItem(this.selectedItem);
        this.selectedItem.row = newRow;
        this.selectedItem.col = newCol;
        this._writeItem(this.selectedItem);
        this.onUpdate();
        this._drawSelection();
      }
      return;
    }

    if (!this.drawing) return;
    const info = this.renderer.getSixelFromPixel(coords.x, coords.y);
    if (!info || info.row === 0 || info.row === 24) return;

    if (this.tool === 'draw') {
      this.renderer.setSixel(info.row, info.col, info.sixelIndex, true, this.color);
      this.onUpdate();
    } else if (this.tool === 'erase') {
      this.renderer.setSixel(info.row, info.col, info.sixelIndex, false, this.color);
      this.onUpdate();
    } else if ((this.tool === 'line' || this.tool === 'rect' || this.tool === 'text') && this.startCell) {
      this._drawShapePreview(this.startCell, info);
    }
  }

  _onMouseUp(e) {
    if (!this.active) return;

    if (this.tool === 'text' && this._draggingSelected) {
      this._draggingSelected = false;
      return;
    }

    if (!this.drawing) return;
    this.drawing = false;

    // Clear shape preview
    this._clearShapePreview();

    if (!this.startCell) return;
    const coords = this._getCanvasCoords(e);
    const endInfo = this.renderer.getSixelFromPixel(coords.x, coords.y);
    if (!endInfo) return;

    if (this.tool === 'line') {
      this._drawLine(this.startCell, endInfo);
      this.onUpdate();
    } else if (this.tool === 'rect') {
      this._drawRect(this.startCell, endInfo);
      this.onUpdate();
    } else if (this.tool === 'text') {
      var minRow = Math.max(1, Math.min(this.startCell.row, endInfo.row));
      var maxRow = Math.min(23, Math.max(this.startCell.row, endInfo.row));
      var minCol = Math.max(0, Math.min(this.startCell.col, endInfo.col));
      var maxCol = Math.min(39, Math.max(this.startCell.col, endInfo.col));
      if (maxRow >= minRow && maxCol >= minCol) {
        this._openTextBoxEditor(minRow, minCol, (maxCol - minCol + 1), (maxRow - minRow + 1));
      }
    }

    this.startCell = null;
  }

  _drawLine(from, to) {
    // Bresenham-like line between sixel positions
    const fromGx = from.col * 2 + (from.sixelIndex % 2);
    const fromGy = from.row * 3 + Math.floor(from.sixelIndex / 2);
    const toGx = to.col * 2 + (to.sixelIndex % 2);
    const toGy = to.row * 3 + Math.floor(to.sixelIndex / 2);

    const dx = Math.abs(toGx - fromGx);
    const dy = Math.abs(toGy - fromGy);
    const sx = fromGx < toGx ? 1 : -1;
    const sy = fromGy < toGy ? 1 : -1;
    let err = dx - dy;

    let cx = fromGx, cy = fromGy;
    while (true) {
      const col = Math.floor(cx / 2);
      const row = Math.floor(cy / 3);
      const si = (cy % 3) * 2 + (cx % 2);
      this.renderer.setSixel(row, col, si, true, this.color);

      if (cx === toGx && cy === toGy) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; cx += sx; }
      if (e2 < dx) { err += dx; cy += sy; }
    }
  }

  _drawRect(from, to) {
    const fromGx = from.col * 2 + (from.sixelIndex % 2);
    const fromGy = from.row * 3 + Math.floor(from.sixelIndex / 2);
    const toGx = to.col * 2 + (to.sixelIndex % 2);
    const toGy = to.row * 3 + Math.floor(to.sixelIndex / 2);

    const minX = Math.min(fromGx, toGx);
    const maxX = Math.max(fromGx, toGx);
    const minY = Math.min(fromGy, toGy);
    const maxY = Math.max(fromGy, toGy);

    for (let gx = minX; gx <= maxX; gx++) {
      for (let gy = minY; gy <= maxY; gy++) {
        if (gx === minX || gx === maxX || gy === minY || gy === maxY) {
          const col = Math.floor(gx / 2);
          const row = Math.floor(gy / 3);
          const si = (gy % 3) * 2 + (gx % 2);
          this.renderer.setSixel(row, col, si, true, this.color);
        }
      }
    }
  }

  // Draw a semi-transparent preview of the line or rect being dragged
  _drawShapePreview(from, to) {
    if (!this._drawPreviewCanvas) return;
    var ctx = this._drawPreviewCanvas.getContext('2d');
    ctx.clearRect(0, 0, this._drawPreviewCanvas.width, this._drawPreviewCanvas.height);

    var cellW = this.renderer.cellWidth;
    var cellH = this.renderer.cellHeight;
    var halfW = cellW / 2;
    var thirdH = cellH / 3;
    var color = TELETEXT_COLORS[this.color] || this.color || '#FFFFFF';
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;

    var fromGx = from.col * 2 + (from.sixelIndex % 2);
    var fromGy = from.row * 3 + Math.floor(from.sixelIndex / 2);
    var toGx = to.col * 2 + (to.sixelIndex % 2);
    var toGy = to.row * 3 + Math.floor(to.sixelIndex / 2);

    var self = this;
    function fillSixel(gx, gy) {
      var col = Math.floor(gx / 2);
      var row = Math.floor(gy / 3);
      var lx = gx % 2;
      var ly = gy % 3;
      ctx.fillRect(
        Math.floor(col * cellW + lx * halfW),
        Math.floor(row * cellH + ly * thirdH),
        Math.ceil(halfW),
        Math.ceil(thirdH)
      );
    }

    if (this.tool === 'line') {
      // Bresenham preview
      var dx = Math.abs(toGx - fromGx);
      var dy = Math.abs(toGy - fromGy);
      var sx = fromGx < toGx ? 1 : -1;
      var sy = fromGy < toGy ? 1 : -1;
      var err = dx - dy;
      var cx = fromGx, cy = fromGy;
      while (true) {
        fillSixel(cx, cy);
        if (cx === toGx && cy === toGy) break;
        var e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }
      }
    } else if (this.tool === 'rect') {
      var minX = Math.min(fromGx, toGx);
      var maxX = Math.max(fromGx, toGx);
      var minY = Math.min(fromGy, toGy);
      var maxY = Math.max(fromGy, toGy);
      for (var gx = minX; gx <= maxX; gx++) {
        for (var gy = minY; gy <= maxY; gy++) {
          if (gx === minX || gx === maxX || gy === minY || gy === maxY) {
            fillSixel(gx, gy);
          }
        }
      }
    } else if (this.tool === 'text') {
      var minCol = Math.min(from.col, to.col);
      var maxCol = Math.max(from.col, to.col);
      var minRow = Math.max(1, Math.min(from.row, to.row));
      var maxRow = Math.min(23, Math.max(from.row, to.row));
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#FFFFFF';
      ctx.strokeRect(
        Math.floor(minCol * cellW),
        Math.floor(minRow * cellH),
        Math.ceil((maxCol - minCol + 1) * cellW),
        Math.ceil((maxRow - minRow + 1) * cellH)
      );
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(
        Math.floor(minCol * cellW),
        Math.floor(minRow * cellH),
        Math.ceil((maxCol - minCol + 1) * cellW),
        Math.ceil((maxRow - minRow + 1) * cellH)
      );
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px sans-serif';
      ctx.fillText('Text box', Math.floor(minCol * cellW) + 6, Math.floor(minRow * cellH) + 14);
    }

    ctx.globalAlpha = 1.0;
  }

  _clearShapePreview() {
    if (!this._drawPreviewCanvas) return;
    var ctx = this._drawPreviewCanvas.getContext('2d');
    ctx.clearRect(0, 0, this._drawPreviewCanvas.width, this._drawPreviewCanvas.height);
  }

  _openTextBoxEditor(row, col, width, height) {
    this._closeTextBoxEditor();

    this._textBoxRow = row;
    this._textBoxCol = col;
    this._textBoxWidth = Math.max(1, width);
    this._textBoxHeight = Math.max(1, height);

    var container = this.canvas.parentElement;
    var editor = document.createElement('div');
    editor.style.cssText = [
      'position:absolute',
      'z-index:12',
      'left:' + (col * 100 / 40) + '%',
      'top:' + (row * 100 / 25) + '%',
      'width:' + (width * 100 / 40) + '%',
      'height:' + (height * 100 / 25) + '%',
      'min-width:120px',
      'min-height:70px',
      'background:rgba(0,0,0,0.9)',
      'border:1px dashed #ffffff',
      'padding:6px',
      'box-sizing:border-box',
      'display:flex',
      'flex-direction:column',
      'gap:6px'
    ].join(';');

    var ta = document.createElement('textarea');
    ta.placeholder = 'Type text...';
    ta.style.cssText = [
      'flex:1',
      'width:100%',
      'resize:none',
      'border:1px solid #555',
      'background:#111',
      'color:#fff',
      'font:12px monospace',
      'padding:6px',
      'outline:none',
      'box-sizing:border-box'
    ].join(';');

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'padding:4px 8px;border:1px solid #666;background:#222;color:#ddd;cursor:pointer;font:11px sans-serif;';

    var applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.textContent = 'Apply';
    applyBtn.style.cssText = 'padding:4px 8px;border:1px solid #9ad;background:#246;color:#fff;cursor:pointer;font:11px sans-serif;';

    var self = this;
    function applyText() {
      var text = ta.value || '';
      var boxW = self._textBoxWidth;
      var boxH = self._textBoxHeight;
      if (boxW === 1 && text.trim().length > 1) {
        var rawLines = String(text).replace(/\r/g, '').split('\n');
        var longest = 1;
        for (var li = 0; li < rawLines.length; li++) {
          if (rawLines[li].length > longest) longest = rawLines[li].length;
        }
        boxW = Math.max(1, Math.min(40 - self._textBoxCol, longest));
      }
      self._closeTextBoxEditor();
      if (text.trim()) {
        self.insertText(
          text,
          self._textBoxRow,
          self._textBoxCol,
          boxW,
          boxH,
          self.color
        );
      }
    }

    ta.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        applyText();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        self._closeTextBoxEditor();
      }
    });

    cancelBtn.addEventListener('click', function() {
      self._closeTextBoxEditor();
    });
    applyBtn.addEventListener('click', applyText);

    actions.appendChild(cancelBtn);
    actions.appendChild(applyBtn);
    editor.appendChild(ta);
    editor.appendChild(actions);
    container.appendChild(editor);

    this._textBoxEditor = editor;
    ta.focus();
  }

  _closeTextBoxEditor() {
    if (this._textBoxEditor && this._textBoxEditor.parentElement) {
      this._textBoxEditor.parentElement.removeChild(this._textBoxEditor);
    }
    this._textBoxEditor = null;
  }

  _textToArt(text, width, height, color) {
    if (!text || !text.trim()) return null;

    var lines = this._wrapText(text, width, height);
    if (!lines.length) return null;

    var cellW = this.renderer.cellWidth;
    var cellH = this.renderer.cellHeight;
    var canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * cellW);
    canvas.height = Math.ceil(height * cellH);

    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = cellH + 'px "Bedstead"';
    ctx.textBaseline = 'top';

    for (var i = 0; i < lines.length && i < height; i++) {
      ctx.fillText(lines[i], 0, i * cellH);
    }

    var img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    var art = [];
    var hasAny = false;

    for (var r = 0; r < height; r++) {
      var row = [];
      var y0 = r * canvas.height / height;
      var y1 = (r + 1) * canvas.height / height;
      for (var c = 0; c < width; c++) {
        var x0 = c * canvas.width / width;
        var x1 = (c + 1) * canvas.width / width;

        var sixels = [false, false, false, false, false, false];
        var regions = [
          [x0, x0 + (x1 - x0) / 2, y0, y0 + (y1 - y0) / 3],
          [x0 + (x1 - x0) / 2, x1, y0, y0 + (y1 - y0) / 3],
          [x0, x0 + (x1 - x0) / 2, y0 + (y1 - y0) / 3, y0 + 2 * (y1 - y0) / 3],
          [x0 + (x1 - x0) / 2, x1, y0 + (y1 - y0) / 3, y0 + 2 * (y1 - y0) / 3],
          [x0, x0 + (x1 - x0) / 2, y0 + 2 * (y1 - y0) / 3, y1],
          [x0 + (x1 - x0) / 2, x1, y0 + 2 * (y1 - y0) / 3, y1]
        ];

        for (var s = 0; s < 6; s++) {
          var rx0 = Math.floor(regions[s][0]);
          var rx1 = Math.max(rx0 + 1, Math.ceil(regions[s][1]));
          var ry0 = Math.floor(regions[s][2]);
          var ry1 = Math.max(ry0 + 1, Math.ceil(regions[s][3]));
          var on = 0;
          var total = 0;

          for (var py = ry0; py < ry1; py++) {
            for (var px = rx0; px < rx1; px++) {
              var idx = (py * canvas.width + px) * 4;
              if (img[idx + 3] > 30) on++;
              total++;
            }
          }

          sixels[s] = total > 0 && (on / total) > 0.15;
        }

        if (sixels.some(function(v) { return v; })) {
          row.push({ sixels: sixels, color: color });
          hasAny = true;
        } else {
          row.push(null);
        }
      }
      art.push(row);
    }

    return hasAny ? art : null;
  }

  _wrapText(text, width, maxLines) {
    var srcLines = String(text).replace(/\r/g, '').split('\n');
    var out = [];

    for (var i = 0; i < srcLines.length; i++) {
      if (out.length >= maxLines) break;
      var line = srcLines[i];
      if (!line) {
        out.push('');
        continue;
      }

      var remaining = line;
      while (remaining.length > width) {
        if (out.length >= maxLines) break;
        var cut = remaining.lastIndexOf(' ', width);
        if (cut <= 0) cut = width;
        out.push(remaining.slice(0, cut));
        remaining = remaining.slice(cut).replace(/^\s+/, '');
      }
      if (out.length < maxLines) {
        out.push(remaining.slice(0, width));
      }
    }

    return out;
  }
  _floodFill(row, col, sixelIndex) {
    const mosaic = this.renderer.mosaicOverlay[row][col];
    const targetOn = mosaic ? mosaic.sixels[sixelIndex] : false;
    const newOn = !targetOn;

    // BFS flood fill on the sixel grid
    const visited = new Set();
    const queue = [{ row, col, si: sixelIndex }];
    const key = (r, c, s) => `${r},${c},${s}`;

    while (queue.length > 0) {
      const { row: r, col: c, si } = queue.shift();
      const k = key(r, c, si);
      if (visited.has(k)) continue;
      visited.add(k);

      if (r < 1 || r > 23 || c < 0 || c >= 40) continue;

      const m = this.renderer.mosaicOverlay[r][c];
      const isOn = m ? m.sixels[si] : false;
      if (isOn !== targetOn) continue;

      this.renderer.setSixel(r, c, si, newOn, this.color);

      // Neighbors in sixel grid
      const gx = c * 2 + (si % 2);
      const gy = r * 3 + Math.floor(si / 2);

      const neighbors = [
        [gx - 1, gy], [gx + 1, gy],
        [gx, gy - 1], [gx, gy + 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= 80 || ny < 0 || ny >= 75) continue;
        const nc = Math.floor(nx / 2);
        const nr = Math.floor(ny / 3);
        const ns = (ny % 3) * 2 + (nx % 2);
        queue.push({ row: nr, col: nc, si: ns });
      }
    }
  }

  // Insert pre-built mosaic art at a position (immediate, no drag)
  insertArt(artData, startRow, startCol) {
    // Deep copy art data for tracking
    var artCopy = [];
    for (var r = 0; r < artData.length; r++) {
      var row = [];
      for (var c = 0; c < (artData[r] || []).length; c++) {
        var cell = artData[r][c];
        if (cell) {
          row.push({ sixels: cell.sixels.slice(), color: cell.color });
        } else {
          row.push(null);
        }
      }
      artCopy.push(row);
    }

    // Write to mosaic overlay
    for (var r = 0; r < artData.length; r++) {
      for (var c = 0; c < (artData[r] || []).length; c++) {
        var cell = artData[r][c];
        if (!cell) continue;
        var row = startRow + r;
        var col = startCol + c;
        if (row < 1 || row > 23 || col < 0 || col >= 40) continue;
        this.renderer.setMosaic(row, col, cell.sixels, cell.color || this.color);
      }
    }

    // Deep copy original for lossless re-scaling
    var origCopy = [];
    for (var r = 0; r < artData.length; r++) {
      var orow = [];
      for (var c = 0; c < (artData[r] || []).length; c++) {
        var ocell = artData[r][c];
        orow.push(ocell ? { sixels: ocell.sixels.slice(), color: ocell.color } : null);
      }
      origCopy.push(orow);
    }

    // Track as placed item
    var placedItem = {
      type: 'mosaic',
      data: artCopy,
      originalData: origCopy,
      row: startRow,
      col: startCol,
      width: (artData[0] || []).length,
      height: artData.length
    };
    this.placedItems.push(placedItem);

    // Make resizing discoverable: auto-select newly placed clipart
    // and switch to selection-friendly interaction immediately.
    this.tool = 'text';
    this._setSelectionInteractivity(true);
    this._selectItem(placedItem);

    this.onUpdate();
  }

  // Insert text using renderer's embedded teletext font path
  insertText(text, startRow, startCol, width, height, color) {
    var item = {
      type: 'text',
      text: text,
      color: color || this.color,
      row: startRow,
      col: startCol,
      width: Math.max(1, width),
      height: Math.max(1, height)
    };

    this._writeItem(item);
    this.placedItems.push(item);
    this._selectItem(item);
    this.onUpdate();
  }

  // Start placement mode: art follows cursor, click to place
  startPlacement(artData) {
    var self = this;
    this.placeArt = artData;
    this.placing = true;
    this.placeRow = Math.max(1, Math.floor((24 - artData.length) / 2));
    this.placeCol = Math.max(0, Math.floor((40 - (artData[0] || []).length) / 2));

    // Create a transparent overlay div with inline handlers
    var overlay = document.createElement('div');
    overlay.id = 'placementOverlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:20;cursor:crosshair;';

    // Hint bar at top
    var hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;top:4px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.75);color:#fff;font:11px sans-serif;padding:4px 10px;border-radius:4px;pointer-events:none;white-space:nowrap;z-index:21;';
    hint.textContent = 'Click to place \u2022 R rotate \u2022 H flip horiz \u2022 V flip vert \u2022 +/\u2013 resize \u2022 Esc cancel';
    overlay.appendChild(hint);

    // Inline handlers via properties (Safari-safe)
    overlay.onmousemove = function(e) {
      var canvasEl = self.renderer.canvas;
      var rect = canvasEl.getBoundingClientRect();
      var sx = self.renderer.baseWidth / rect.width;
      var sy = self.renderer.baseHeight / rect.height;
      var px = (e.clientX - rect.left) * sx;
      var py = (e.clientY - rect.top) * sy;
      var cell = self.renderer.getCellFromPixel(px, py);
      if (!cell) return;
      self.placeRow = Math.max(1, Math.min(cell.row, 24 - self.placeArt.length));
      self.placeCol = Math.max(0, Math.min(cell.col, 40 - (self.placeArt[0] || []).length));
      self._drawPlacePreview();
    };

    overlay.onclick = function(e) {
      e.preventDefault();
      self.insertArt(self.placeArt, self.placeRow, self.placeCol);
      self.cancelPlacement();
    };

    // Create preview canvas
    var pvCanvas = document.createElement('canvas');
    pvCanvas.id = 'placementPreview';
    pvCanvas.width = this.renderer.baseWidth;
    pvCanvas.height = this.renderer.baseHeight;
    pvCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:15;pointer-events:none;';

    var container = this.canvas.parentElement;
    container.appendChild(pvCanvas);
    container.appendChild(overlay);

    this._placeCanvas = pvCanvas;
    this._placeOverlay = overlay;

    // Keyboard shortcuts during placement (addEventListener so we don't overwrite global shortcuts)
    this._placeKeyHandler = function(e) {
      if (!self.placing) return;
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      var key = e.key.toLowerCase();
      if (e.key === 'Escape') {
        e.preventDefault();
        self.cancelPlacement();
      } else if (key === 'r') {
        e.preventDefault();
        self.placeArt = self._rotateArt(self.placeArt);
        self._drawPlacePreview();
      } else if (key === 'h') {
        e.preventDefault();
        self.placeArt = self._flipHorizontal(self.placeArt);
        self._drawPlacePreview();
      } else if (key === 'v') {
        e.preventDefault();
        self.placeArt = self._flipVertical(self.placeArt);
        self._drawPlacePreview();
      } else if (key === '=' || key === '+') {
        e.preventDefault();
        self.placeArt = self._scaleArt(self.placeArt, 2);
        self._drawPlacePreview();
      } else if (key === '-') {
        e.preventDefault();
        self.placeArt = self._scaleArt(self.placeArt, 0.5);
        self._drawPlacePreview();
      }
    };
    document.addEventListener('keydown', this._placeKeyHandler);

    this._drawPlacePreview();
  }

  cancelPlacement() {
    if (!this.placing) return;
    this.placing = false;
    this.placeArt = null;

    if (this._placeOverlay && this._placeOverlay.parentElement) {
      this._placeOverlay.parentElement.removeChild(this._placeOverlay);
    }
    if (this._placeCanvas && this._placeCanvas.parentElement) {
      this._placeCanvas.parentElement.removeChild(this._placeCanvas);
    }
    this._placeOverlay = null;
    this._placeCanvas = null;
    if (this._placeKeyHandler) {
      document.removeEventListener('keydown', this._placeKeyHandler);
      this._placeKeyHandler = null;
    }

    // Re-enable selection mode
    this._enableSelection();
    this.onUpdate();
  }

  // Enable click-to-select on placed items (always active when not placing/drawing)
  _enableSelection() {
    var self = this;
    if (this._selectOverlay) return; // already active

    var overlay = document.createElement('div');
    overlay.id = 'selectOverlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:10;cursor:default;';

    var selCanvas = document.createElement('canvas');
    selCanvas.id = 'selectCanvas';
    selCanvas.width = this.renderer.baseWidth;
    selCanvas.height = this.renderer.baseHeight;
    selCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:9;pointer-events:none;';

    overlay.onmousedown = function(e) {
      if (self.placing) return;
      var canvasEl = self.renderer.canvas;
      var rect = canvasEl.getBoundingClientRect();
      var sx = self.renderer.baseWidth / rect.width;
      var sy = self.renderer.baseHeight / rect.height;
      var px = (e.clientX - rect.left) * sx;
      var py = (e.clientY - rect.top) * sy;

      // Check resize handles first (if something is selected)
      if (self.selectedItem) {
        var handle = self._hitTestHandle(px, py);
        if (handle) {
          e.preventDefault();
          self._resizingHandle = handle;
          // Anchor is the opposite corner
          var item = self.selectedItem;
          if (handle === 'nw') { self._resizeAnchorRow = item.row + item.height; self._resizeAnchorCol = item.col + item.width; }
          else if (handle === 'ne') { self._resizeAnchorRow = item.row + item.height; self._resizeAnchorCol = item.col; }
          else if (handle === 'sw') { self._resizeAnchorRow = item.row; self._resizeAnchorCol = item.col + item.width; }
          else { self._resizeAnchorRow = item.row; self._resizeAnchorCol = item.col; }
          overlay.style.cursor = (handle === 'nw' || handle === 'se') ? 'nwse-resize' : 'nesw-resize';
          return;
        }
      }

      var cell = self.renderer.getCellFromPixel(px, py);
      if (!cell) { self._deselectItem(); return; }

      // Check if clicking on a placed item
      var item = self._findItemAt(cell.row, cell.col);
      if (item) {
        e.preventDefault();
        self._selectItem(item);
        self._draggingSelected = true;
        self._dragOffsetRow = cell.row - item.row;
        self._dragOffsetCol = cell.col - item.col;
        overlay.style.cursor = 'move';
      } else {
        self._deselectItem();
      }
    };

    overlay.onmousemove = function(e) {
      if (!self.selectedItem) return;
      var canvasEl = self.renderer.canvas;
      var rect = canvasEl.getBoundingClientRect();
      var sx = self.renderer.baseWidth / rect.width;
      var sy = self.renderer.baseHeight / rect.height;
      var px = (e.clientX - rect.left) * sx;
      var py = (e.clientY - rect.top) * sy;

      // Handle resize drag
      if (self._resizingHandle) {
        var cell = self.renderer.getCellFromPixel(px, py);
        if (!cell) return;
        var ar = self._resizeAnchorRow;
        var ac = self._resizeAnchorCol;
        var newRow = Math.min(cell.row, ar);
        var newCol = Math.min(cell.col, ac);
        var newEndRow = Math.max(cell.row, ar);
        var newEndCol = Math.max(cell.col, ac);
        var newW = Math.max(1, newEndCol - newCol);
        var newH = Math.max(1, newEndRow - newRow);
        // Clamp within teletext bounds
        newRow = Math.max(1, newRow);
        newCol = Math.max(0, newCol);
        if (newRow + newH > 24) newH = 24 - newRow;
        if (newCol + newW > 40) newW = 40 - newCol;
        // Update position and resize
        self._eraseItem(self.selectedItem);
        self.selectedItem.row = newRow;
        self.selectedItem.col = newCol;
        self._resizeItem(self.selectedItem, newW, newH);
        return;
      }

      // Handle move drag
      if (!self._draggingSelected) return;
      var cell = self.renderer.getCellFromPixel(px, py);
      if (!cell) return;

      var newRow = cell.row - self._dragOffsetRow;
      var newCol = cell.col - self._dragOffsetCol;
      newRow = Math.max(1, Math.min(newRow, 24 - self.selectedItem.height));
      newCol = Math.max(0, Math.min(newCol, 40 - self.selectedItem.width));

      if (newRow !== self.selectedItem.row || newCol !== self.selectedItem.col) {
        self._eraseItem(self.selectedItem);
        self.selectedItem.row = newRow;
        self.selectedItem.col = newCol;
        self._writeItem(self.selectedItem);
        self.onUpdate();
        self._drawSelection();
      }
    };

    overlay.onmouseup = function(e) {
      self._draggingSelected = false;
      self._resizingHandle = null;
      overlay.style.cursor = 'default';
    };

    overlay.onmouseleave = function(e) {
      self._draggingSelected = false;
      self._resizingHandle = null;
      overlay.style.cursor = 'default';
    };

    var container = this.canvas.parentElement;
    container.appendChild(selCanvas);
    container.appendChild(overlay);
    this._selectOverlay = overlay;
    this._selectCanvas = selCanvas;

    // Key handler for delete and deselect (addEventListener so we don't overwrite global shortcuts)
    this._selectKeyHandler = function(e) {
      if (!self.selectedItem) return;
      // Don't intercept when typing in form fields
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        self._deleteSelectedItem();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        self._deselectItem();
      }
    };
    document.addEventListener('keydown', this._selectKeyHandler);
  }

  _disableSelection() {
    if (this._selectOverlay && this._selectOverlay.parentElement) {
      this._selectOverlay.parentElement.removeChild(this._selectOverlay);
    }
    if (this._selectCanvas && this._selectCanvas.parentElement) {
      this._selectCanvas.parentElement.removeChild(this._selectCanvas);
    }
    this._selectOverlay = null;
    this._selectCanvas = null;
    this.selectedItem = null;
    this._draggingSelected = false;
    if (this._selectKeyHandler) {
      document.removeEventListener('keydown', this._selectKeyHandler);
      this._selectKeyHandler = null;
    }
  }

  _findItemAt(row, col) {
    // Search in reverse (most recently placed first)
    for (var i = this.placedItems.length - 1; i >= 0; i--) {
      var item = this.placedItems[i];
      if (row >= item.row && row < item.row + item.height &&
          col >= item.col && col < item.col + item.width) {
        if (item.type === 'text') {
          // Text items are selected by bounding box, even over blank cells.
          return item;
        } else {
          // For mosaics, allow selecting by bounding box so sparse imported art is still draggable/resizable.
          return item;
        }
      }
    }
    return null;
  }

  _selectItem(item) {
    this.selectedItem = item;
    if (this.active && this.tool === 'text') {
      this._setSelectionInteractivity(true);
    }
    this._drawSelection();
  }

  _deselectItem() {
    this.selectedItem = null;
    if (this.active && this.tool === 'text') {
      this._setSelectionInteractivity(false);
    }
    if (this._selectCanvas) {
      var ctx = this._selectCanvas.getContext('2d');
      ctx.clearRect(0, 0, this._selectCanvas.width, this._selectCanvas.height);
    }
  }

  _drawSelection() {
    if (!this.selectedItem || !this._selectCanvas) return;
    var ctx = this._selectCanvas.getContext('2d');
    ctx.clearRect(0, 0, this._selectCanvas.width, this._selectCanvas.height);

    var cellW = this.renderer.cellWidth;
    var cellH = this.renderer.cellHeight;
    var item = this.selectedItem;

    var x = Math.floor(item.col * cellW) - 1;
    var y = Math.floor(item.row * cellH) - 1;
    var w = Math.ceil(item.width * cellW) + 2;
    var h = Math.ceil(item.height * cellH) + 2;

    // Dashed border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Corner resize handles (8x8 squares)
    var hs = 8;
    var handles = this._getHandleRects(item);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    for (var i = 0; i < handles.length; i++) {
      var hr = handles[i];
      ctx.fillRect(hr.x, hr.y, hs, hs);
      ctx.strokeRect(hr.x, hr.y, hs, hs);
    }

    // Hint text
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = '10px sans-serif';
    var hintText = 'Drag to move \u2022 Corners to resize \u2022 Del remove \u2022 Esc deselect';
    var hintW = ctx.measureText(hintText).width + 12;
    var hintX = Math.floor(item.col * cellW);
    var hintY = Math.floor(item.row * cellH) - 16;
    if (hintY < 2) hintY = Math.floor((item.row + item.height) * cellH) + 4;
    ctx.fillRect(hintX, hintY, hintW, 14);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(hintText, hintX + 6, hintY + 10);
  }

  // Returns [{x,y,corner},...] for 4 corner handles of selected item
  _getHandleRects(item) {
    var cellW = this.renderer.cellWidth;
    var cellH = this.renderer.cellHeight;
    var hs = 8;
    var x = Math.floor(item.col * cellW) - 1;
    var y = Math.floor(item.row * cellH) - 1;
    var w = Math.ceil(item.width * cellW) + 2;
    var h = Math.ceil(item.height * cellH) + 2;
    return [
      { x: x - hs/2, y: y - hs/2, corner: 'nw' },
      { x: x + w - hs/2, y: y - hs/2, corner: 'ne' },
      { x: x - hs/2, y: y + h - hs/2, corner: 'sw' },
      { x: x + w - hs/2, y: y + h - hs/2, corner: 'se' }
    ];
  }

  // Check if canvas pixel coords hit a resize handle, returns corner string or null
  _hitTestHandle(px, py) {
    if (!this.selectedItem) return null;
    var handles = this._getHandleRects(this.selectedItem);
    var hs = 8;
    var tolerance = 4; // extra pixels for easier grabbing
    for (var i = 0; i < handles.length; i++) {
      var hr = handles[i];
      if (px >= hr.x - tolerance && px <= hr.x + hs + tolerance &&
          py >= hr.y - tolerance && py <= hr.y + hs + tolerance) {
        return hr.corner;
      }
    }
    return null;
  }

  // Resize item to new cell dimensions using originalData
  _resizeItem(item, newWidth, newHeight) {
    // Clamp
    newWidth = Math.max(1, Math.min(newWidth, 40));
    newHeight = Math.max(1, Math.min(newHeight, 23));
    if (newWidth === item.width && newHeight === item.height) return;

    if (item.type === 'text') {
      this._eraseItem(item);
      item.width = newWidth;
      item.height = newHeight;
      this._writeItem(item);
      this.onUpdate();
      this._drawSelection();
      return;
    }

    var orig = item.originalData;
    var origRows = orig.length;
    var origCols = (orig[0] || []).length;

    // Expand original to sixel grid
    var gw = origCols * 2;
    var gh = origRows * 3;
    var grid = [];
    for (var gy = 0; gy < gh; gy++) {
      grid[gy] = [];
      for (var gx = 0; gx < gw; gx++) {
        grid[gy][gx] = { on: false, color: 'white' };
      }
    }
    for (var r = 0; r < origRows; r++) {
      var row = orig[r];
      if (!row) continue;
      for (var c = 0; c < row.length; c++) {
        var cell = row[c];
        if (!cell) continue;
        var bx = c * 2, by = r * 3;
        if (cell.sixels[0]) { grid[by][bx].on = true; grid[by][bx].color = cell.color; }
        if (cell.sixels[1]) { grid[by][bx+1].on = true; grid[by][bx+1].color = cell.color; }
        if (cell.sixels[2]) { grid[by+1][bx].on = true; grid[by+1][bx].color = cell.color; }
        if (cell.sixels[3]) { grid[by+1][bx+1].on = true; grid[by+1][bx+1].color = cell.color; }
        if (cell.sixels[4]) { grid[by+2][bx].on = true; grid[by+2][bx].color = cell.color; }
        if (cell.sixels[5]) { grid[by+2][bx+1].on = true; grid[by+2][bx+1].color = cell.color; }
      }
    }

    // Scale sixel grid to new dimensions
    var newGw = newWidth * 2;
    var newGh = newHeight * 3;
    var scaled = [];
    for (var ny = 0; ny < newGh; ny++) {
      scaled[ny] = [];
      for (var nx = 0; nx < newGw; nx++) {
        var srcX = Math.min(Math.floor(nx * gw / newGw), gw - 1);
        var srcY = Math.min(Math.floor(ny * gh / newGh), gh - 1);
        scaled[ny][nx] = grid[srcY][srcX];
      }
    }

    // Re-pack into cells
    var result = [];
    for (var r = 0; r < newHeight; r++) {
      var newRow = [];
      for (var c = 0; c < newWidth; c++) {
        var bx = c * 2, by = r * 3;
        var sixels = [false, false, false, false, false, false];
        var cellColor = 'white';
        var hasAny = false;
        var positions = [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]];
        for (var s = 0; s < 6; s++) {
          var gx = bx + positions[s][0];
          var gy = by + positions[s][1];
          if (gy < newGh && gx < newGw && scaled[gy][gx].on) {
            sixels[s] = true;
            cellColor = scaled[gy][gx].color;
            hasAny = true;
          }
        }
        newRow.push(hasAny ? { sixels: sixels, color: cellColor } : null);
      }
      result.push(newRow);
    }

    this._eraseItem(item);
    item.data = result;
    item.width = newWidth;
    item.height = newHeight;
    this._writeItem(item);
    this.onUpdate();
    this._drawSelection();
  }

  _eraseItem(item) {
    if (item.type === 'text') {
      for (var tr = 0; tr < item.height; tr++) {
        for (var tc = 0; tc < item.width; tc++) {
          var rr = item.row + tr;
          var cc = item.col + tc;
          if (rr >= 0 && rr < this.renderer.rows && cc >= 0 && cc < this.renderer.cols) {
            this.renderer.importTextOverlay[rr][cc] = null;
          }
        }
      }
      return;
    }

    for (var r = 0; r < item.height; r++) {
      for (var c = 0; c < item.width; c++) {
        if (item.data[r] && item.data[r][c]) {
          this.renderer.clearMosaicCell(item.row + r, item.col + c);
        }
      }
    }
  }

  _writeItem(item) {
    if (item.type === 'text') {
      var lines = this._wrapText(item.text || '', item.width, item.height);
      item._lines = lines;
      for (var tr = 0; tr < item.height; tr++) {
        var line = lines[tr] || '';
        for (var tc = 0; tc < item.width; tc++) {
          var ch = tc < line.length ? line.charAt(tc) : ' ';
          var rr = item.row + tr;
          var cc = item.col + tc;
          if (rr < 1 || rr > 23 || cc < 0 || cc >= 40) continue;
          if (ch && ch !== ' ') {
            this.renderer.setImportText(rr, cc, ch, item.color || this.color, 'black');
          } else {
            this.renderer.importTextOverlay[rr][cc] = null;
          }
        }
      }
      return;
    }

    for (var r = 0; r < item.height; r++) {
      for (var c = 0; c < item.width; c++) {
        var cell = item.data[r] ? item.data[r][c] : null;
        if (!cell) continue;
        var row = item.row + r;
        var col = item.col + c;
        if (row < 1 || row > 23 || col < 0 || col >= 40) continue;
        this.renderer.setMosaic(row, col, cell.sixels, cell.color);
      }
    }
  }

  _deleteSelectedItem() {
    if (!this.selectedItem) return;
    this._eraseItem(this.selectedItem);
    var idx = this.placedItems.indexOf(this.selectedItem);
    if (idx >= 0) this.placedItems.splice(idx, 1);
    this._deselectItem();
    this.onUpdate();
  }

  _getTextCharAt(item, absRow, absCol) {
    var localRow = absRow - item.row;
    var localCol = absCol - item.col;
    if (localRow < 0 || localCol < 0 || localRow >= item.height || localCol >= item.width) return ' ';

    if (!item._lines || item._lines.length !== item.height) {
      item._lines = this._wrapText(item.text || '', item.width, item.height);
    }
    var line = item._lines[localRow] || '';
    if (localCol >= line.length) return ' ';
    return line.charAt(localCol);
  }

  // Flip art horizontally (mirror left-right)
  _flipHorizontal(artData) {
    var result = [];
    for (var r = 0; r < artData.length; r++) {
      var row = artData[r];
      if (!row) { result.push([]); continue; }
      var newRow = [];
      for (var c = row.length - 1; c >= 0; c--) {
        var cell = row[c];
        if (!cell) { newRow.push(null); continue; }
        // Swap left/right sixels: [TL,TR,ML,MR,BL,BR] -> [TR,TL,MR,ML,BR,BL]
        newRow.push({
          sixels: [cell.sixels[1], cell.sixels[0], cell.sixels[3], cell.sixels[2], cell.sixels[5], cell.sixels[4]],
          color: cell.color
        });
      }
      result.push(newRow);
    }
    return result;
  }

  // Flip art vertically (mirror top-bottom)
  _flipVertical(artData) {
    var result = [];
    for (var r = artData.length - 1; r >= 0; r--) {
      var row = artData[r];
      if (!row) { result.push([]); continue; }
      var newRow = [];
      for (var c = 0; c < row.length; c++) {
        var cell = row[c];
        if (!cell) { newRow.push(null); continue; }
        // Swap top/bottom sixels: [TL,TR,ML,MR,BL,BR] -> [BL,BR,ML,MR,TL,TR]
        newRow.push({
          sixels: [cell.sixels[4], cell.sixels[5], cell.sixels[2], cell.sixels[3], cell.sixels[0], cell.sixels[1]],
          color: cell.color
        });
      }
      result.push(newRow);
    }
    return result;
  }

  // Rotate art 90° clockwise
  // This operates on the sixel sub-grid (each cell is 2x3 sixels)
  _rotateArt(artData) {
    var rows = artData.length;
    var cols = (artData[0] || []).length;
    // Expand to sixel grid (2 cols x 3 rows per cell)
    var gw = cols * 2;
    var gh = rows * 3;
    var grid = [];
    for (var gy = 0; gy < gh; gy++) {
      grid[gy] = [];
      for (var gx = 0; gx < gw; gx++) {
        grid[gy][gx] = { on: false, color: 'white' };
      }
    }
    // Fill sixel grid from art data
    for (var r = 0; r < rows; r++) {
      var row = artData[r];
      if (!row) continue;
      for (var c = 0; c < row.length; c++) {
        var cell = row[c];
        if (!cell) continue;
        // sixels: [TL,TR,ML,MR,BL,BR] -> positions (gx,gy)
        var bx = c * 2;
        var by = r * 3;
        if (cell.sixels[0]) { grid[by][bx].on = true; grid[by][bx].color = cell.color; }
        if (cell.sixels[1]) { grid[by][bx+1].on = true; grid[by][bx+1].color = cell.color; }
        if (cell.sixels[2]) { grid[by+1][bx].on = true; grid[by+1][bx].color = cell.color; }
        if (cell.sixels[3]) { grid[by+1][bx+1].on = true; grid[by+1][bx+1].color = cell.color; }
        if (cell.sixels[4]) { grid[by+2][bx].on = true; grid[by+2][bx].color = cell.color; }
        if (cell.sixels[5]) { grid[by+2][bx+1].on = true; grid[by+2][bx+1].color = cell.color; }
      }
    }
    // Rotate 90° CW: new[x][gh-1-y] = old[y][x]
    var newGh = gw;
    var newGw = gh;
    var rotated = [];
    for (var ny = 0; ny < newGh; ny++) {
      rotated[ny] = [];
      for (var nx = 0; nx < newGw; nx++) {
        rotated[ny][nx] = grid[gh - 1 - nx][ny];
      }
    }
    // Re-pack into cell grid (2 cols x 3 rows per cell)
    var newCols = Math.ceil(newGw / 2);
    var newRows = Math.ceil(newGh / 3);
    var result = [];
    for (var r = 0; r < newRows; r++) {
      var newRow = [];
      for (var c = 0; c < newCols; c++) {
        var bx = c * 2;
        var by = r * 3;
        var sixels = [false, false, false, false, false, false];
        var cellColor = 'white';
        var hasAny = false;
        var positions = [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]]; // [dx,dy] for each sixel
        for (var s = 0; s < 6; s++) {
          var gx = bx + positions[s][0];
          var gy = by + positions[s][1];
          if (gy < newGh && gx < newGw && rotated[gy][gx].on) {
            sixels[s] = true;
            cellColor = rotated[gy][gx].color;
            hasAny = true;
          }
        }
        newRow.push(hasAny ? { sixels: sixels, color: cellColor } : null);
      }
      result.push(newRow);
    }
    return result;
  }

  // Scale art by factor (2 = double, 0.5 = halve)
  _scaleArt(artData, factor) {
    var rows = artData.length;
    var cols = (artData[0] || []).length;
    // Expand to sixel grid
    var gw = cols * 2;
    var gh = rows * 3;
    var grid = [];
    for (var gy = 0; gy < gh; gy++) {
      grid[gy] = [];
      for (var gx = 0; gx < gw; gx++) {
        grid[gy][gx] = { on: false, color: 'white' };
      }
    }
    for (var r = 0; r < rows; r++) {
      var row = artData[r];
      if (!row) continue;
      for (var c = 0; c < row.length; c++) {
        var cell = row[c];
        if (!cell) continue;
        var bx = c * 2;
        var by = r * 3;
        if (cell.sixels[0]) { grid[by][bx].on = true; grid[by][bx].color = cell.color; }
        if (cell.sixels[1]) { grid[by][bx+1].on = true; grid[by][bx+1].color = cell.color; }
        if (cell.sixels[2]) { grid[by+1][bx].on = true; grid[by+1][bx].color = cell.color; }
        if (cell.sixels[3]) { grid[by+1][bx+1].on = true; grid[by+1][bx+1].color = cell.color; }
        if (cell.sixels[4]) { grid[by+2][bx].on = true; grid[by+2][bx].color = cell.color; }
        if (cell.sixels[5]) { grid[by+2][bx+1].on = true; grid[by+2][bx+1].color = cell.color; }
      }
    }
    // Scale the sixel grid
    var newGw = Math.max(2, Math.round(gw * factor));
    var newGh = Math.max(3, Math.round(gh * factor));
    // Clamp to teletext grid limits
    if (newGw > 80) newGw = 80;
    if (newGh > 69) newGh = 69; // 23 rows * 3
    var scaled = [];
    for (var ny = 0; ny < newGh; ny++) {
      scaled[ny] = [];
      for (var nx = 0; nx < newGw; nx++) {
        var srcX = Math.min(Math.floor(nx / factor), gw - 1);
        var srcY = Math.min(Math.floor(ny / factor), gh - 1);
        scaled[ny][nx] = grid[srcY][srcX];
      }
    }
    // Re-pack into cells
    var newCols = Math.ceil(newGw / 2);
    var newRows = Math.ceil(newGh / 3);
    var result = [];
    for (var r = 0; r < newRows; r++) {
      var newRow = [];
      for (var c = 0; c < newCols; c++) {
        var bx = c * 2;
        var by = r * 3;
        var sixels = [false, false, false, false, false, false];
        var cellColor = 'white';
        var hasAny = false;
        var positions = [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]];
        for (var s = 0; s < 6; s++) {
          var gx = bx + positions[s][0];
          var gy = by + positions[s][1];
          if (gy < newGh && gx < newGw && scaled[gy][gx].on) {
            sixels[s] = true;
            cellColor = scaled[gy][gx].color;
            hasAny = true;
          }
        }
        newRow.push(hasAny ? { sixels: sixels, color: cellColor } : null);
      }
      result.push(newRow);
    }
    return result;
  }

  _drawPlacePreview() {
    if (!this.placing || !this.placeArt || !this._placeCanvas) return;

    var ctx = this._placeCanvas.getContext('2d');
    ctx.clearRect(0, 0, this._placeCanvas.width, this._placeCanvas.height);

    var cellW = this.renderer.cellWidth;
    var cellH = this.renderer.cellHeight;

    ctx.globalAlpha = 0.6;
    for (var r = 0; r < this.placeArt.length; r++) {
      var row = this.placeArt[r];
      if (!row) continue;
      for (var c = 0; c < row.length; c++) {
        var cell = row[c];
        if (!cell || !cell.sixels) continue;
        var x = (this.placeCol + c) * cellW;
        var y = (this.placeRow + r) * cellH;
        var color = TELETEXT_COLORS[cell.color] || cell.color || '#FFFFFF';
        ctx.fillStyle = color;

        var halfW = cellW / 2;
        var thirdH = cellH / 3;
        var positions = [
          [0, 0], [halfW, 0],
          [0, thirdH], [halfW, thirdH],
          [0, thirdH * 2], [halfW, thirdH * 2]
        ];
        for (var i = 0; i < 6; i++) {
          if (cell.sixels[i]) {
            ctx.fillRect(
              Math.floor(x + positions[i][0]),
              Math.floor(y + positions[i][1]),
              Math.ceil(halfW),
              Math.ceil(thirdH)
            );
          }
        }
      }
    }
    ctx.globalAlpha = 1.0;

    // Dashed border around placement area
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(
      Math.floor(this.placeCol * cellW),
      Math.floor(this.placeRow * cellH),
      Math.ceil((this.placeArt[0] || []).length * cellW),
      Math.ceil(this.placeArt.length * cellH)
    );
    ctx.setLineDash([]);
  }
}
