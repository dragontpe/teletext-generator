// TelePage - Main Application Logic

// State
var currentTemplate = 'news';
var _importMode = false; // true when showing an edit.tf import (skip buildPage)
var state = {
  pageNumber: '100',
  serviceName: 'CEEFAX',
  dateTime: '',
  title: '',
  subtitle: '',
  body: '',
  headerBg: 'cyan',
  headerText: 'white',
  titleColor: 'cyan',
  bodyColor: 'white',
  fastext: ['Headlines', 'Sport', 'Weather', 'Index'],
  sports: [],
  listings: [],
  mosaicColor: 'white',
  fontHeader: 'bedstead',
  fontTitle: 'bedstead',
  fontBody: 'bedstead',
  fastextEnabled: true
};

// Core objects (initialized after DOM ready)
var _teletextCanvas, _effectsCanvas, _renderer, _crtEffects, _exporter, _mosaicEditor;

// ---- Initialization ----

function telepageInit() {
  _teletextCanvas = document.getElementById('teletextCanvas');
  _effectsCanvas = document.getElementById('effectsCanvas');
  _renderer = new TeletextRenderer(_teletextCanvas);
  _crtEffects = new CRTEffects(_teletextCanvas, _effectsCanvas);
  _exporter = new TelePageExporter(_renderer, _crtEffects);
  _mosaicEditor = new MosaicEditor(_renderer, _effectsCanvas, function() {
    telepageRenderAll();
  });

  telepageBuildTemplateGrid();
  telepageBuildColorPickers();
  telepagePopulateMosaicArtSelect();
  telepageLoadTemplate('news');
  telepageBindEvents();
  telepageRenderAll();
  telepageStartClock();
  // Enable selection mode for placed clipart items
  _mosaicEditor._enableSelection();
}

// ---- Export (global, called from onclick) ----

function telepageExport(mode) {
  try {
    var scale = 3;
    var src = document.getElementById('teletextCanvas');
    var w = src.width * scale;
    var h = src.height * scale;

    // Upscale the teletext canvas
    var outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    var outCtx = outCanvas.getContext('2d');
    outCtx.imageSmoothingEnabled = false;
    outCtx.drawImage(src, 0, 0, w, h);

    var dataUrl;
    if (mode === 'effects') {
      // Apply CRT effects onto a second canvas
      var fxCanvas = document.createElement('canvas');
      fxCanvas.width = w;
      fxCanvas.height = h;
      var fxCtx = fxCanvas.getContext('2d');
      fxCtx.drawImage(outCanvas, 0, 0);

      var fx = new CRTEffects(outCanvas, fxCanvas);
      fx.settings = JSON.parse(JSON.stringify(_crtEffects.settings));
      fx.apply();

      dataUrl = fxCanvas.toDataURL('image/png');
    } else {
      dataUrl = outCanvas.toDataURL('image/png');
    }

    // Open in new tab with save instructions
    var win = window.open();
    var filename = mode === 'effects' ? 'telepage-export.png' : 'telepage-clean.png';
    win.document.write(
      '<html><head><title>TelePage Export</title>' +
      '<style>body{margin:0;background:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;color:#aaa}img{max-width:95%;margin:20px}p{margin:10px}</style>' +
      '</head><body>' +
      '<p>Right-click the image and choose "Save Image As..." to download</p>' +
      '<img src="' + dataUrl + '">' +
      '</body></html>'
    );

  } catch(err) {
    alert('Export error: ' + err.message);
  }
}

function telepageAddSportsRow() {
  state.sports.push({ home: '', away: '', homeScore: '0', awayScore: '0' });
  telepageBuildSportsInputs();
  telepageRenderAll();
}

function telepageAddTvRow() {
  state.listings.push({ time: '', programme: '' });
  telepageBuildTvInputs();
  telepageRenderAll();
}

function telepageUpdateEffect(key, checked) {
  _crtEffects.settings[key] = checked;
  telepageRenderAll();
}

function telepageUpdateEffectIntensity(key, value) {
  _crtEffects.settings[key] = parseInt(value) / 100;
  telepageRenderAll();
}

function telepageClearMosaics() {
  _renderer.clearMosaicOverlay();
  telepageRenderAll();
}

function telepageInsertArt() {
  var artId = document.getElementById('mosaicArtSelect').value;
  if (!artId || !MOSAIC_ART[artId]) return;
  var art = MOSAIC_ART[artId];
  _mosaicEditor.startPlacement(art.data);
  document.getElementById('mosaicArtSelect').value = '';
}

function telepageToggleMosaic() {
  try {
    var btn = document.getElementById('btnMosaicToggle');
    var controls = document.getElementById('mosaicControls');
    if (_mosaicEditor.active) {
      _mosaicEditor.deactivate();
      btn.classList.remove('active');
      btn.textContent = 'Open Mosaic Editor';
      controls.classList.add('hidden');
    } else {
      _mosaicEditor.activate();
      btn.classList.add('active');
      btn.textContent = 'Close Mosaic Editor';
      controls.classList.remove('hidden');
    }
  } catch(e) {
    alert('Mosaic error: ' + e.message);
  }
}

function telepageCopyClipboard() {
  try {
    var scale = 3;
    var w = _renderer.baseWidth * scale;
    var h = _renderer.baseHeight * scale;

    var outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    var outCtx = outCanvas.getContext('2d');
    outCtx.imageSmoothingEnabled = false;
    outCtx.drawImage(_teletextCanvas, 0, 0, w, h);

    var fxCanvas = document.createElement('canvas');
    fxCanvas.width = w;
    fxCanvas.height = h;
    var fxCtx = fxCanvas.getContext('2d');
    fxCtx.drawImage(outCanvas, 0, 0);

    var fx = new CRTEffects(outCanvas, fxCanvas);
    fx.settings = JSON.parse(JSON.stringify(_crtEffects.settings));
    fx.apply();

    fxCanvas.toBlob(function(blob) {
      if (!blob) {
        alert('Could not create image blob');
        return;
      }
      navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]).then(function() {
        var btn = document.getElementById('btnCopyClipboard');
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy to Clipboard'; }, 1500);
      }).catch(function(err) {
        alert('Clipboard failed: ' + err.message + '. Downloading instead.');
        telepageExport('effects');
      });
    }, 'image/png');
  } catch(err) {
    alert('Copy error: ' + err.message);
  }
}

// ---- Template Grid ----

function telepageBuildTemplateGrid() {
  var grid = document.getElementById('templateGrid');
  grid.innerHTML = '';
  var entries = Object.entries(templates);
  for (var i = 0; i < entries.length; i++) {
    var id = entries[i][0];
    var tmpl = entries[i][1];
    var card = document.createElement('div');
    card.className = 'template-card' + (id === currentTemplate ? ' active' : '');
    card.dataset.template = id;
    card.innerHTML = '<span class="template-icon">' + tmpl.icon + '</span><span class="template-name">' + tmpl.name + '</span>';
    card.addEventListener('click', (function(templateId) {
      return function() {
        document.querySelectorAll('.template-card').forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
        telepageLoadTemplate(templateId);
      };
    })(id));
    grid.appendChild(card);
  }
}

function telepageLoadTemplate(id) {
  currentTemplate = id;
  _importMode = false; // Exit import mode when loading a template
  var tmpl = templates[id];

  // Clear import text overlay when switching templates
  if (_renderer) _renderer.clearImportOverlay();

  state.pageNumber = tmpl.defaultPageNum;
  state.serviceName = tmpl.serviceName;
  state.title = tmpl.defaultTitle;
  state.body = tmpl.defaultBody;
  state.headerBg = tmpl.headerBg;
  state.headerText = tmpl.headerText;
  state.titleColor = tmpl.titleColor;
  state.bodyColor = tmpl.bodyColor;
  state.fastext = tmpl.fastext.slice();
  state.sports = tmpl.defaultSports ? JSON.parse(JSON.stringify(tmpl.defaultSports)) : [];
  state.listings = tmpl.defaultListings ? JSON.parse(JSON.stringify(tmpl.defaultListings)) : [];

  document.getElementById('pageNumber').value = state.pageNumber;
  document.getElementById('serviceName').value = state.serviceName;
  document.getElementById('titleText').value = state.title;
  document.getElementById('bodyText').value = state.body;
  for (var i = 0; i < 4; i++) {
    document.getElementById('fastext' + i).value = state.fastext[i];
  }

  telepageUpdateColorPicker('colorHeaderBg', state.headerBg);
  telepageUpdateColorPicker('colorHeaderText', state.headerText);
  telepageUpdateColorPicker('colorTitle', state.titleColor);
  telepageUpdateColorPicker('colorBody', state.bodyColor);

  var hasSportsTable = tmpl.layout.some(function(item) { return item.type === 'sports-table'; });
  var hasTvTable = tmpl.layout.some(function(item) { return item.type === 'tv-table'; });
  document.getElementById('sportsInputs').classList.toggle('hidden', !hasSportsTable);
  document.getElementById('tvInputs').classList.toggle('hidden', !hasTvTable);
  document.getElementById('subtitleRow').classList.toggle('hidden', hasSportsTable || hasTvTable);

  if (hasSportsTable) telepageBuildSportsInputs();
  if (hasTvTable) telepageBuildTvInputs();

  telepageRenderAll();
}

// ---- Color Pickers ----

function telepageBuildColorPickers() {
  document.querySelectorAll('.color-picker').forEach(function(container) {
    container.innerHTML = '';
    var target = container.dataset.target;

    COLOR_NAMES.forEach(function(colorName) {
      var swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.background = TELETEXT_COLORS[colorName];
      swatch.dataset.color = colorName;
      swatch.title = colorName;
      if (state[target] === colorName) swatch.classList.add('active');

      swatch.addEventListener('click', function() {
        container.querySelectorAll('.color-swatch').forEach(function(s) { s.classList.remove('active'); });
        swatch.classList.add('active');
        state[target] = colorName;
        if (target === 'mosaicColor') {
          _mosaicEditor.setColor(colorName);
        }
        telepageRenderAll();
      });

      container.appendChild(swatch);
    });

    if (target === 'headerBg') {
      var swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.background = TELETEXT_COLORS.black;
      swatch.style.border = '2px solid #444';
      swatch.dataset.color = 'black';
      swatch.title = 'black';
      swatch.addEventListener('click', function() {
        container.querySelectorAll('.color-swatch').forEach(function(s) { s.classList.remove('active'); });
        swatch.classList.add('active');
        state.headerBg = 'black';
        telepageRenderAll();
      });
      container.appendChild(swatch);
    }
  });
}

function telepageUpdateColorPicker(containerId, colorName) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.color-swatch').forEach(function(s) {
    s.classList.toggle('active', s.dataset.color === colorName);
  });
}

// ---- Sports Inputs ----

function telepageBuildSportsInputs() {
  var container = document.getElementById('sportsRows');
  container.innerHTML = '';
  state.sports.forEach(function(match, i) {
    var row = document.createElement('div');
    row.className = 'sports-row';
    row.innerHTML =
      '<input type="text" class="team-input" value="' + match.home + '" data-idx="' + i + '" data-field="home" placeholder="Home">' +
      '<input type="text" class="score-input" value="' + match.homeScore + '" data-idx="' + i + '" data-field="homeScore" maxlength="2">' +
      '<span style="color:var(--text-muted)">-</span>' +
      '<input type="text" class="score-input" value="' + match.awayScore + '" data-idx="' + i + '" data-field="awayScore" maxlength="2">' +
      '<input type="text" class="team-input" value="' + match.away + '" data-idx="' + i + '" data-field="away" placeholder="Away">' +
      '<button class="btn-remove-row" data-idx="' + i + '">&times;</button>';
    container.appendChild(row);
  });

  container.querySelectorAll('input').forEach(function(input) {
    input.addEventListener('input', function() {
      var idx = parseInt(input.dataset.idx);
      state.sports[idx][input.dataset.field] = input.value;
      telepageRenderAll();
    });
  });

  container.querySelectorAll('.btn-remove-row').forEach(function(btn) {
    btn.addEventListener('click', function() {
      state.sports.splice(parseInt(btn.dataset.idx), 1);
      telepageBuildSportsInputs();
      telepageRenderAll();
    });
  });
}

// ---- TV Listings Inputs ----

function telepageBuildTvInputs() {
  var container = document.getElementById('tvRows');
  container.innerHTML = '';
  state.listings.forEach(function(item, i) {
    var row = document.createElement('div');
    row.className = 'tv-row';
    row.innerHTML =
      '<input type="text" class="time-input" value="' + item.time + '" data-idx="' + i + '" data-field="time" placeholder="00.00">' +
      '<input type="text" class="programme-input" value="' + item.programme + '" data-idx="' + i + '" data-field="programme" placeholder="Programme">' +
      '<button class="btn-remove-row" data-idx="' + i + '">&times;</button>';
    container.appendChild(row);
  });

  container.querySelectorAll('input').forEach(function(input) {
    input.addEventListener('input', function() {
      var idx = parseInt(input.dataset.idx);
      state.listings[idx][input.dataset.field] = input.value;
      telepageRenderAll();
    });
  });

  container.querySelectorAll('.btn-remove-row').forEach(function(btn) {
    btn.addEventListener('click', function() {
      state.listings.splice(parseInt(btn.dataset.idx), 1);
      telepageBuildTvInputs();
      telepageRenderAll();
    });
  });
}

// ---- Mosaic Art Select ----

function telepagePopulateMosaicArtSelect() {
  var select = document.getElementById('mosaicArtSelect');
  select.innerHTML = '<option value="">Insert clipart...</option>';

  // Group by category
  var categories = {};
  var entries = Object.entries(MOSAIC_ART);
  for (var i = 0; i < entries.length; i++) {
    var id = entries[i][0];
    var art = entries[i][1];
    var cat = art.category || 'Other';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push({ id: id, name: art.name });
  }

  var catNames = Object.keys(categories).sort();
  for (var c = 0; c < catNames.length; c++) {
    var group = document.createElement('optgroup');
    group.label = catNames[c];
    var items = categories[catNames[c]];
    for (var j = 0; j < items.length; j++) {
      var opt = document.createElement('option');
      opt.value = items[j].id;
      opt.textContent = items[j].name;
      group.appendChild(opt);
    }
    select.appendChild(group);
  }
}

function telepageImportEditTf() {
  var urlInput = document.getElementById('editTfUrl');
  var url = urlInput.value.trim();
  if (!url) {
    alert('Please paste an edit.tf URL');
    return;
  }

  try {
    // Parse and decode the URL
    var hashData = EditTfImporter.parseUrl(url);
    if (!hashData) {
      alert('Could not parse edit.tf URL. Make sure it contains a # hash with page data.');
      return;
    }

    var charGrid = EditTfImporter.decodeHash(hashData);

    // Enable import mode: skips buildPage entirely during render
    _importMode = true;

    // Clear overlays so mosaic editor doesn't show stale data
    _renderer.clearGrid();
    _renderer.clearMosaicOverlay();
    _renderer.clearImportOverlay();
    _mosaicEditor.placedItems = [];

    // Deselect template cards
    document.querySelectorAll('.template-card').forEach(function(c) { c.classList.remove('active'); });

    // Draw directly to the teletext canvas — same approach as the working test page
    var canvas = _renderer.canvas;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var cellW = _renderer.cellWidth;
    var cellH = _renderer.cellHeight;
    var halfW = cellW / 2;
    var thirdH = cellH / 3;
    var positions = [[0,0],[halfW,0],[0,thirdH],[halfW,thirdH],[0,thirdH*2],[halfW,thirdH*2]];
    for (var r = 0; r < 25; r++) {
      var graphicsMode = false;
      var fgColor = 'white';
      for (var c = 0; c < 40; c++) {
        var cc = charGrid[r][c];
        if (cc >= 0 && cc <= 7) {
          graphicsMode = false;
          fgColor = EditTfImporter.COLORS[cc & 7];
        } else if (cc >= 16 && cc <= 23) {
          graphicsMode = true;
          fgColor = EditTfImporter.COLORS[cc & 7];
        } else if (cc < 32) {
          // other control code — skip
        } else if (graphicsMode && EditTfImporter.isMosaicChar(cc)) {
          var sixels = EditTfImporter.charToSixels(cc);
          if (sixels.some(function(s) { return s; })) {
            var x = c * cellW;
            var y = r * cellH;
            ctx.fillStyle = TELETEXT_COLORS[fgColor] || '#FFFFFF';
            for (var i = 0; i < 6; i++) {
              if (sixels[i]) {
                ctx.fillRect(
                  Math.floor(x + positions[i][0]),
                  Math.floor(y + positions[i][1]),
                  Math.ceil(halfW),
                  Math.ceil(thirdH)
                );
              }
            }
            // Also store in overlay so mosaic editor can interact with it
            _renderer.setMosaic(r, c, sixels, fgColor);
          }
        }
      }
    }

    // Apply CRT effects on top of what we just drew
    _crtEffects.apply();

    urlInput.value = '';
  } catch(e) {
    alert('Import error: ' + e.message);
    console.error('[TelePage] Import error:', e);
  }
}

// ---- Event Binding ----

function telepageBindEvents() {
  // Text inputs
  var textInputs = ['pageNumber', 'serviceName', 'dateTime', 'titleText', 'subtitleText', 'bodyText'];
  textInputs.forEach(function(id) {
    document.getElementById(id).addEventListener('input', function() {
      telepageReadFormState();
      telepageRenderAll();
    });
  });

  for (var i = 0; i < 4; i++) {
    (function(idx) {
      document.getElementById('fastext' + idx).addEventListener('input', function() {
        telepageReadFormState();
        telepageRenderAll();
      });
    })(i);
  }

  // Fastext enabled checkbox
  document.getElementById('fastextEnabled').addEventListener('change', function() {
    state.fastextEnabled = this.checked;
    telepageRenderAll();
  });

  // Font selectors
  document.getElementById('fontHeader').addEventListener('change', function() {
    state.fontHeader = this.value;
    telepageRenderAll();
  });
  document.getElementById('fontTitle').addEventListener('change', function() {
    state.fontTitle = this.value;
    telepageRenderAll();
  });
  document.getElementById('fontBody').addEventListener('change', function() {
    state.fontBody = this.value;
    telepageRenderAll();
  });

  // CRT preset
  document.getElementById('crtPreset').addEventListener('change', function(e) {
    telepageApplyPreset(e.target.value);
    telepageRenderAll();
  });

  // CRT effect checkboxes and sliders
  var effectIds = ['Scanlines', 'Glow', 'Vignette', 'Barrel', 'Bleed', 'Noise'];
  effectIds.forEach(function(name) {
    var checkbox = document.getElementById('effect' + name);
    var slider = document.getElementById(name.toLowerCase() + 'Intensity');
    var key = name.toLowerCase();

    if (checkbox) {
      checkbox.addEventListener('change', function() {
        _crtEffects.settings[key] = checkbox.checked;
        telepageRenderAll();
      });
    }

    if (slider) {
      slider.addEventListener('input', function() {
        _crtEffects.settings[key + 'Intensity'] = parseInt(slider.value) / 100;
        telepageRenderAll();
      });
    }
  });

  // Mosaic editor toggle
  document.getElementById('btnMosaicToggle').addEventListener('click', function() {
    telepageToggleMosaic();
  });

  // Tool buttons
  document.querySelectorAll('.btn-tool').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.btn-tool').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      _mosaicEditor.setTool(btn.dataset.tool);
    });
  });

  // Clipart insert
  document.getElementById('btnInsertArt').addEventListener('click', function() {
    telepageInsertArt();
  });

  // edit.tf import
  document.getElementById('btnImportEditTf').addEventListener('click', function() {
    telepageImportEditTf();
  });

  // Clear mosaics
  document.getElementById('btnClearMosaic').addEventListener('click', function() {
    telepageClearMosaics();
  });

  // Sports/TV row add buttons
  document.getElementById('addSportsRow').addEventListener('click', function() {
    telepageAddSportsRow();
  });
  document.getElementById('addTvRow').addEventListener('click', function() {
    telepageAddTvRow();
  });

  // Export buttons
  document.getElementById('btnExport').addEventListener('click', function() {
    telepageExport('effects');
  });
  document.getElementById('btnExportClean').addEventListener('click', function() {
    telepageExport('clean');
  });
  document.getElementById('btnCopyClipboard').addEventListener('click', function() {
    telepageCopyClipboard();
  });

  // Help modal
  document.getElementById('btnHelp').addEventListener('click', function() {
    document.getElementById('helpModal').classList.remove('hidden');
  });
  document.getElementById('btnCloseHelp').addEventListener('click', function() {
    document.getElementById('helpModal').classList.add('hidden');
  });
  document.getElementById('helpModal').addEventListener('click', function(e) {
    if (e.target === document.getElementById('helpModal')) {
      document.getElementById('helpModal').classList.add('hidden');
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      telepageExport('clean');
    } else if (mod && e.key === 'e') {
      e.preventDefault();
      telepageExport('effects');
    } else if (mod && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      telepageCopyClipboard();
    }
  });
}

function telepageReadFormState() {
  state.pageNumber = document.getElementById('pageNumber').value;
  state.serviceName = document.getElementById('serviceName').value;
  state.dateTime = document.getElementById('dateTime').value;
  state.title = document.getElementById('titleText').value;
  state.subtitle = document.getElementById('subtitleText').value;
  state.body = document.getElementById('bodyText').value;
  for (var i = 0; i < 4; i++) {
    state.fastext[i] = document.getElementById('fastext' + i).value;
  }
}

function telepageApplyPreset(presetName) {
  var preset = CRT_PRESETS[presetName];
  if (!preset) return;
  Object.assign(_crtEffects.settings, preset);
  telepageSyncCRTControls();
}

function telepageSyncCRTControls() {
  var s = _crtEffects.settings;
  document.getElementById('effectScanlines').checked = s.scanlines;
  document.getElementById('scanlinesIntensity').value = Math.round(s.scanlineIntensity * 100);
  document.getElementById('effectGlow').checked = s.glow;
  document.getElementById('glowIntensity').value = Math.round(s.glowIntensity * 100);
  document.getElementById('effectVignette').checked = s.vignette;
  document.getElementById('vignetteIntensity').value = Math.round(s.vignetteIntensity * 100);
  document.getElementById('effectBarrel').checked = s.barrel;
  document.getElementById('barrelIntensity').value = Math.round(s.barrelIntensity * 100);
  document.getElementById('effectBleed').checked = s.bleed;
  document.getElementById('bleedIntensity').value = Math.round(s.bleedIntensity * 100);
  document.getElementById('effectNoise').checked = s.noise;
  document.getElementById('noiseIntensity').value = Math.round(s.noiseIntensity * 100);
}

// ---- Rendering ----

var _renderQueued = false;

function telepageRenderAll() {
  if (_renderQueued) return;
  _renderQueued = true;
  requestAnimationFrame(function() {
    _renderQueued = false;
    telepageDoRender();
  });
}

function telepageDoRender() {
  if (_importMode) {
    // In import mode, render mosaics directly from overlay (same as import draw)
    var canvas = _renderer.canvas;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var cellW = _renderer.cellWidth;
    var cellH = _renderer.cellHeight;
    var halfW = cellW / 2;
    var thirdH = cellH / 3;
    var positions = [[0,0],[halfW,0],[0,thirdH],[halfW,thirdH],[0,thirdH*2],[halfW,thirdH*2]];

    for (var r = 0; r < _renderer.rows; r++) {
      for (var c = 0; c < _renderer.cols; c++) {
        var mosaic = _renderer.mosaicOverlay[r][c];
        if (mosaic && mosaic.sixels.some(function(s) { return s; })) {
          var x = c * cellW;
          var y = r * cellH;
          ctx.fillStyle = TELETEXT_COLORS[mosaic.color] || '#FFFFFF';
          for (var i = 0; i < 6; i++) {
            if (mosaic.sixels[i]) {
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
    }

    _crtEffects.apply();
    return;
  }

  _renderer.buildPage(currentTemplate, {
    pageNumber: state.pageNumber,
    serviceName: state.serviceName,
    dateTime: state.dateTime || undefined,
    title: state.title,
    subtitle: state.subtitle,
    body: state.body,
    headerBg: state.headerBg,
    headerText: state.headerText,
    titleColor: state.titleColor,
    bodyColor: state.bodyColor,
    fastext: state.fastext,
    sports: state.sports,
    listings: state.listings,
    fontHeader: state.fontHeader,
    fontTitle: state.fontTitle,
    fontBody: state.fontBody,
    fastextEnabled: state.fastextEnabled
  });

  _renderer.render();
  _crtEffects.apply();
}

// ---- Clock ----

function telepageStartClock() {
  setInterval(function() {
    if (!document.getElementById('dateTime').value) {
      telepageRenderAll();
    }
  }, 1000);
}

// ---- Boot ----

function telepageLoadFonts(callback) {
  var fontsToLoad = [
    { family: 'Bedstead', url: 'fonts/bedstead.otf' },
    { family: 'Bedstead Extended', url: 'fonts/bedstead-extended.otf' },
    { family: 'Mode Seven', url: 'fonts/mode7gx3.ttf' }
  ];

  if (typeof FontFace !== 'undefined') {
    var loaded = 0;
    var total = fontsToLoad.length;

    function checkDone() {
      loaded++;
      if (loaded >= total) callback();
    }

    fontsToLoad.forEach(function(f) {
      fetch(f.url).then(function(resp) {
        if (!resp.ok) throw new Error('Fetch failed: ' + f.url);
        return resp.arrayBuffer();
      }).then(function(buffer) {
        var face = new FontFace(f.family, buffer);
        return face.load();
      }).then(function(loadedFace) {
        document.fonts.add(loadedFace);
        checkDone();
      }).catch(function(err) {
        // Fallback: try URL-based loading
        var face = new FontFace(f.family, 'url(' + f.url + ')');
        face.load().then(function(loadedFace) {
          document.fonts.add(loadedFace);
          checkDone();
        }).catch(function() {
          checkDone();
        });
      });
    });
  } else if (document.fonts) {
    document.fonts.ready.then(callback);
  } else {
    window.addEventListener('load', callback);
  }
}

telepageLoadFonts(telepageInit);
