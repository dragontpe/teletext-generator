// TelePage - edit.tf URL Importer
// Decodes edit.tf hash URLs into teletext character grids,
// then extracts mosaic block art as sixel data

var EditTfImporter = {

  B64_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',

  // Teletext colour codes (index 0-7)
  COLORS: ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'],

  // Decode a base64 hashstring into a 25x40 grid of 7-bit character codes
  decodeHash: function(hashstring) {
    var grid = [];
    for (var r = 0; r < 25; r++) {
      grid[r] = [];
      for (var c = 0; c < 40; c++) {
        grid[r][c] = 0;
      }
    }

    var currentcode = 0;
    for (var p = 0; p < hashstring.length; p++) {
      var pc_dec = this.B64_CHARS.indexOf(hashstring.charAt(p));
      if (pc_dec < 0) pc_dec = 0;

      for (var b = 0; b < 6; b++) {
        var charbit = (6 * p + b) % 7;
        var b64bit = (pc_dec & (1 << (5 - b))) ? 1 : 0;
        currentcode |= b64bit << (6 - charbit);

        if (charbit === 6) {
          var charnum = ((6 * p + b) - charbit) / 7;
          var c = charnum % 40;
          var r = (charnum - c) / 40;
          if (r < 25 && c < 40) {
            grid[r][c] = currentcode;
          }
          currentcode = 0;
        }
      }
    }
    return grid;
  },

  // Parse an edit.tf URL and return a sanitized hash data string
  parseUrl: function(url) {
    if (!url) return null;

    var raw = String(url).trim();
    var hashIdx = raw.indexOf('#');
    if (hashIdx < 0) return null;

    var hash = raw.substring(hashIdx + 1);
    if (!hash) return null;

    // Decode percent-escaped hash payloads before sanitizing.
    try {
      hash = decodeURIComponent(hash);
    } catch (e) {
      // Ignore malformed escape sequences and continue with raw hash.
    }

    // Format: metadata:data[:key=value...]
    var parts = hash.split(':');
    var data = parts.length >= 2 ? parts[1] : parts[0];
    if (!data) return null;

    // Users often paste wrapped hashes with whitespace/newlines.
    data = data.replace(/\s+/g, '').replace(/[^A-Za-z0-9_-]/g, '');

    // Legacy format: just the data (no metadata nibble).
    if (parts.length >= 2 || data.length >= 1120) {
      return data;
    }
    return null;
  },
  // Convert character code to sixel booleans (for mosaic characters)
  charToSixels: function(cc) {
    var bits = cc - 32;
    return [
      !!(bits & 1),   // top-left
      !!(bits & 2),   // top-right
      !!(bits & 4),   // mid-left
      !!(bits & 8),   // mid-right
      !!(bits & 16),  // bot-left
      !!(bits & 64)   // bot-right (bit 6, NOT bit 5)
    ];
  },

  // Check if a character code is a mosaic character (when in graphics mode)
  isMosaicChar: function(cc) {
    return (cc >= 32 && cc < 64) || (cc >= 96 && cc < 128);
  },

  // Process a 25x40 character grid into mosaic overlay data
  // Returns { cells: 2D array of {sixels, color} or null, textGrid: for reference }
  extractMosaics: function(charGrid) {
    var result = [];
    for (var r = 0; r < 25; r++) {
      result[r] = [];
      var graphicsMode = false;
      var fgColor = 'white';

      for (var c = 0; c < 40; c++) {
        var cc = charGrid[r][c];

        // Control codes
        if (cc >= 0 && cc <= 7) {
          // Alpha colour - switches to text mode
          graphicsMode = false;
          fgColor = this.COLORS[cc & 7];
          result[r][c] = null;
        } else if (cc >= 16 && cc <= 23) {
          // Mosaic colour - switches to graphics mode
          graphicsMode = true;
          fgColor = this.COLORS[cc & 7];
          result[r][c] = null;
        } else if (cc < 32) {
          // Other control codes - render as space
          result[r][c] = null;
        } else if (graphicsMode && this.isMosaicChar(cc)) {
          // Mosaic character
          var sixels = this.charToSixels(cc);
          if (sixels.some(function(s) { return s; })) {
            result[r][c] = { sixels: sixels, color: fgColor };
          } else {
            result[r][c] = null;
          }
        } else {
          // Text character or space
          result[r][c] = null;
        }
      }
    }
    return result;
  },

  // Extract both text and mosaic data from a character grid
  // Returns { mosaics: 25x40 array, text: 25x40 array of {char, fg, bg} or null }
  extractAll: function(charGrid) {
    var mosaics = [];
    var text = [];
    for (var r = 0; r < 25; r++) {
      mosaics[r] = [];
      text[r] = [];
      var graphicsMode = false;
      var fgColor = 'white';
      var bgColor = 'black';

      for (var c = 0; c < 40; c++) {
        var cc = charGrid[r][c];

        // Control codes
        if (cc >= 0 && cc <= 7) {
          // Alpha colour - switches to text mode
          graphicsMode = false;
          fgColor = this.COLORS[cc & 7];
          mosaics[r][c] = null;
          text[r][c] = null;
        } else if (cc >= 16 && cc <= 23) {
          // Mosaic colour - switches to graphics mode
          graphicsMode = true;
          fgColor = this.COLORS[cc & 7];
          mosaics[r][c] = null;
          text[r][c] = null;
        } else if (cc === 28) {
          // Black background
          bgColor = 'black';
          mosaics[r][c] = null;
          text[r][c] = null;
        } else if (cc === 29) {
          // New background (set bg to current fg)
          bgColor = fgColor;
          mosaics[r][c] = null;
          text[r][c] = null;
        } else if (cc < 32) {
          // Other control codes - render as space
          mosaics[r][c] = null;
          text[r][c] = null;
        } else if (graphicsMode && this.isMosaicChar(cc)) {
          // Mosaic character
          var sixels = this.charToSixels(cc);
          if (sixels.some(function(s) { return s; })) {
            mosaics[r][c] = { sixels: sixels, color: fgColor };
          } else {
            mosaics[r][c] = null;
          }
          text[r][c] = null;
        } else if (cc >= 32) {
          // Text character (in alpha mode, or chars 64-95 in graphics mode)
          var ch = String.fromCharCode(cc);
          if (ch !== ' ') {
            text[r][c] = { char: ch, fg: fgColor, bg: bgColor };
          } else {
            text[r][c] = null;
          }
          mosaics[r][c] = null;
        } else {
          mosaics[r][c] = null;
          text[r][c] = null;
        }
      }
    }
    return { mosaics: mosaics, text: text };
  },

  // Import from an edit.tf URL, returns mosaic data (25x40 array)
  importFromUrl: function(url) {
    var hashData = this.parseUrl(url);
    if (!hashData) return null;
    var charGrid = this.decodeHash(hashData);
    return this.extractMosaics(charGrid);
  },

  // Full import: returns { mosaics, text } from an edit.tf URL
  importFullFromUrl: function(url) {
    var hashData = this.parseUrl(url);
    if (!hashData) return null;
    var charGrid = this.decodeHash(hashData);
    return this.extractAll(charGrid);
  },

  // Rasterize a text character to a 2x3 sixel array using a canvas
  // Uses a glyph cache to avoid repeated rendering
  _glyphCache: {},
  charToSixelsBitmap: function(ch, cellW, cellH) {
    var key = ch + '|' + cellW + '|' + cellH;
    if (this._glyphCache[key]) return this._glyphCache[key];

    // Render character on a tiny canvas
    var canvas = document.createElement('canvas');
    canvas.width = Math.ceil(cellW);
    canvas.height = Math.ceil(cellH);
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = cellH + 'px "Bedstead"';
    ctx.textBaseline = 'top';
    ctx.fillText(ch, 0, 0);

    // Sample 2x3 regions
    var halfW = Math.ceil(cellW / 2);
    var thirdH = Math.ceil(cellH / 3);
    var sixels = [false, false, false, false, false, false];
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imgData.data;

    for (var si = 0; si < 6; si++) {
      var sx = (si % 2) * halfW;
      var sy = Math.floor(si / 2) * thirdH;
      var ex = Math.min(sx + halfW, canvas.width);
      var ey = Math.min(sy + thirdH, canvas.height);
      var count = 0;
      var total = 0;
      for (var py = sy; py < ey; py++) {
        for (var px = sx; px < ex; px++) {
          var idx = (py * canvas.width + px) * 4;
          if (data[idx + 3] > 30) count++; // non-transparent pixel
          total++;
        }
      }
      // Sixel is "on" if >15% of pixels are filled
      sixels[si] = total > 0 && (count / total) > 0.15;
    }

    this._glyphCache[key] = sixels;
    return sixels;
  },

  // Full render import: converts entire edit.tf page to mosaic overlay data
  // Text characters are rasterized to sixels via bitmap sampling
  renderFullPage: function(url, cellW, cellH) {
    var hashData = this.parseUrl(url);
    if (!hashData) return null;
    var charGrid = this.decodeHash(hashData);

    var result = [];
    for (var r = 0; r < 25; r++) {
      result[r] = [];
      var graphicsMode = false;
      var fgColor = 'white';
      var bgColor = 'black';

      for (var c = 0; c < 40; c++) {
        var cc = charGrid[r][c];

        if (cc >= 0 && cc <= 7) {
          graphicsMode = false;
          fgColor = this.COLORS[cc & 7];
          result[r][c] = null;
        } else if (cc >= 16 && cc <= 23) {
          graphicsMode = true;
          fgColor = this.COLORS[cc & 7];
          result[r][c] = null;
        } else if (cc === 28) {
          bgColor = 'black';
          result[r][c] = null;
        } else if (cc === 29) {
          bgColor = fgColor;
          result[r][c] = null;
        } else if (cc < 32) {
          result[r][c] = null;
        } else if (graphicsMode && this.isMosaicChar(cc)) {
          // Mosaic character - use standard sixel decoding
          var sixels = this.charToSixels(cc);
          if (sixels.some(function(s) { return s; })) {
            result[r][c] = { sixels: sixels, color: fgColor };
          } else {
            result[r][c] = null;
          }
        } else if (cc >= 32) {
          // Text character - rasterize to sixels
          var ch = String.fromCharCode(cc);
          if (ch !== ' ') {
            var sixels = this.charToSixelsBitmap(ch, cellW, cellH);
            if (sixels.some(function(s) { return s; })) {
              result[r][c] = { sixels: sixels.slice(), color: fgColor };
            } else {
              result[r][c] = null;
            }
          } else {
            result[r][c] = null;
          }
        } else {
          result[r][c] = null;
        }
      }
    }
    return result;
  },

  // Crop a mosaic grid to the bounding box of non-null cells
  cropMosaics: function(mosaicGrid) {
    var minR = 25, maxR = 0, minC = 40, maxC = 0;
    for (var r = 0; r < 25; r++) {
      for (var c = 0; c < 40; c++) {
        if (mosaicGrid[r] && mosaicGrid[r][c]) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }
    if (minR > maxR) return null; // no mosaic data

    var cropped = [];
    for (var r = minR; r <= maxR; r++) {
      var row = [];
      for (var c = minC; c <= maxC; c++) {
        row.push(mosaicGrid[r] ? mosaicGrid[r][c] || null : null);
      }
      cropped.push(row);
    }
    return {
      data: cropped,
      startRow: minR,
      startCol: minC,
      width: maxC - minC + 1,
      height: maxR - minR + 1
    };
  }
};
