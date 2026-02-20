// TelePage - Pre-built Mosaic Art Library
// Sixel layout per cell (2 wide x 3 tall):
//   [0] [1]    TL TR
//   [2] [3]    ML MR
//   [4] [5]    BL BR

function sixelsFromBits(bits) {
  return bits.split('').map(function(b) { return b === '1'; });
}

function mc(bits, color) {
  if (!bits || bits === '000000') return null;
  return { sixels: sixelsFromBits(bits), color: color || 'white' };
}

// Full solid cell shorthand
function mf(c) { return mc('111111', c); }

// Build a row of N solid cells
function solidRow(n, c) {
  var r = [];
  for (var i = 0; i < n; i++) r.push(mf(c));
  return r;
}

// Build art from pixel map (for simple shapes where cell alignment doesn't matter much)
function buildArt(pixelMap) {
  var colorMap = {
    '.': null, 'W': 'white', 'R': 'red', 'G': 'green',
    'Y': 'yellow', 'B': 'blue', 'M': 'magenta', 'C': 'cyan'
  };
  var maxLen = 0;
  for (var i = 0; i < pixelMap.length; i++) {
    if (pixelMap[i].length > maxLen) maxLen = pixelMap[i].length;
  }
  if (maxLen % 2 !== 0) maxLen++;
  var lines = [];
  for (var i = 0; i < pixelMap.length; i++) {
    var s = pixelMap[i];
    while (s.length < maxLen) s += '.';
    lines.push(s);
  }
  while (lines.length % 3 !== 0) lines.push(Array(maxLen + 1).join('.'));
  var rows = [];
  for (var i = 0; i < lines.length; i += 3) {
    var l0 = lines[i], l1 = lines[i + 1], l2 = lines[i + 2];
    var cells = [];
    for (var c = 0; c < maxLen; c += 2) {
      var s0 = colorMap[l0[c]] || null;
      var s1 = colorMap[l0[c + 1]] || null;
      var s2 = colorMap[l1[c]] || null;
      var s3 = colorMap[l1[c + 1]] || null;
      var s4 = colorMap[l2[c]] || null;
      var s5 = colorMap[l2[c + 1]] || null;
      var sixels = [!!s0, !!s1, !!s2, !!s3, !!s4, !!s5];
      if (!sixels.some(function(v) { return v; })) {
        cells.push(null);
      } else {
        cells.push({ sixels: sixels, color: s0 || s1 || s2 || s3 || s4 || s5 });
      }
    }
    rows.push(cells);
  }
  return rows;
}

// ============================================================
// Common sixel corner patterns for rounded shapes:
//   TL missing: 011111    TR missing: 101111
//   BL missing: 111101    BR missing: 111110
//   Top row off: 001111   Bot row off: 111100
//   Left col off: 010101  Right col off: 101010
//   Top-left quadrant: 000111 (bottom-right 2x2)
//   Top-right quadrant: 001011 (bottom-left 2x2)
//   Bot-left quadrant: 110100 (top-right 2x2... actually 110100)
//   Bot-right quadrant: 111000 (top-left 2x2)
// ============================================================

const MOSAIC_ART = {

  // ===== BORDERS & DIVIDERS =====

  'border-single': {
    name: 'Border frame (38x20)',
    category: 'Borders',
    data: (function() {
      var rows = [];
      var top = [mc('000011', 'cyan')];
      for (var i = 0; i < 36; i++) top.push(mc('000011', 'cyan'));
      top.push(mc('000011', 'cyan'));
      rows.push(top);
      for (var r = 0; r < 18; r++) {
        var row = [mc('010101', 'cyan')];
        for (var i = 0; i < 36; i++) row.push(null);
        row.push(mc('101010', 'cyan'));
        rows.push(row);
      }
      var bot = [mc('110000', 'cyan')];
      for (var i = 0; i < 36; i++) bot.push(mc('110000', 'cyan'));
      bot.push(mc('110000', 'cyan'));
      rows.push(bot);
      return rows;
    })()
  },

  'border-double': {
    name: 'Double border (38x20)',
    category: 'Borders',
    data: (function() {
      var rows = [];
      var top = [mc('010111', 'yellow')];
      for (var i = 0; i < 36; i++) top.push(mc('001111', 'yellow'));
      top.push(mc('101011', 'yellow'));
      rows.push(top);
      for (var r = 0; r < 18; r++) {
        var row = [mc('010101', 'yellow')];
        for (var i = 0; i < 36; i++) row.push(null);
        row.push(mc('101010', 'yellow'));
        rows.push(row);
      }
      var bot = [mc('110101', 'yellow')];
      for (var i = 0; i < 36; i++) bot.push(mc('111100', 'yellow'));
      bot.push(mc('111010', 'yellow'));
      rows.push(bot);
      return rows;
    })()
  },

  'divider-thin': {
    name: 'Thin divider line',
    category: 'Borders',
    data: [Array(38).fill(null).map(function() { return mc('001100', 'yellow'); })]
  },

  'divider-thick': {
    name: 'Thick divider',
    category: 'Borders',
    data: [Array(38).fill(null).map(function() { return mc('111111', 'yellow'); })]
  },

  'divider-dashed': {
    name: 'Dashed divider',
    category: 'Borders',
    data: [Array(38).fill(null).map(function(_, i) { return i % 2 === 0 ? mc('001100', 'cyan') : null; })]
  },

  // ===== WEATHER =====
  // Hand-crafted with proper sixel rounding

  'sun': {
    name: 'Sun',
    category: 'Weather',
    data: [
      // Row 0: rays and top cap
      [null,       mc('100000','yellow'), null,       mc('010000','yellow'), null,       mc('000100','yellow'), null,       mc('000010','yellow'), null],
      // Row 1: top of circle with rays
      [mc('000010','yellow'), null,       mc('011111','yellow'), mf('yellow'), mf('yellow'), mf('yellow'), mc('101111','yellow'), null,       mc('010000','yellow')],
      // Row 2: full width
      [null,       mc('011111','yellow'), mf('yellow'), mf('yellow'), mf('yellow'), mf('yellow'), mf('yellow'), mc('101111','yellow'), null],
      // Row 3: full width
      [null,       mc('111101','yellow'), mf('yellow'), mf('yellow'), mf('yellow'), mf('yellow'), mf('yellow'), mc('111110','yellow'), null],
      // Row 4: bottom of circle with rays
      [mc('010000','yellow'), null,       mc('111101','yellow'), mf('yellow'), mf('yellow'), mf('yellow'), mc('111110','yellow'), null,       mc('000010','yellow')],
      // Row 5: rays and bottom
      [null,       mc('000010','yellow'), null,       mc('000001','yellow'), null,       mc('100000','yellow'), null,       mc('010000','yellow'), null],
    ]
  },

  'sun-small': {
    name: 'Sun (small)',
    category: 'Weather',
    data: [
      [null,       mc('010000','yellow'), mc('000100','yellow'), null],
      [mc('011111','yellow'), mf('yellow'), mf('yellow'), mc('101111','yellow')],
      [mc('111101','yellow'), mf('yellow'), mf('yellow'), mc('111110','yellow')],
      [null,       mc('000001','yellow'), mc('100000','yellow'), null],
    ]
  },

  'cloud': {
    name: 'Cloud',
    category: 'Weather',
    data: [
      // Big puffy cloud - 8 cells wide, 3 rows tall
      [null,       null,       mc('011110','white'), mf('white'), mf('white'), mc('011110','white'), null,       null],
      [mc('011111','white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mc('101111','white')],
      [mc('111101','white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mc('111110','white')],
    ]
  },

  'rain': {
    name: 'Rain cloud',
    category: 'Weather',
    data: [
      [null,       null,       mc('011110','white'), mf('white'), mf('white'), mc('011110','white'), null,       null],
      [mc('011111','white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mc('101111','white')],
      [mc('111100','white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mc('111100','white')],
      [mc('010000','cyan'), null,       mc('010000','cyan'), null,       mc('010000','cyan'), null,       mc('010000','cyan'), null],
      [null,       mc('010000','cyan'), null,       mc('010000','cyan'), null,       mc('010000','cyan'), null,       null],
      [mc('010000','cyan'), null,       mc('010000','cyan'), null,       mc('010000','cyan'), null,       null,       null],
    ]
  },

  'snow': {
    name: 'Snow cloud',
    category: 'Weather',
    data: [
      [null,       null,       mc('011110','white'), mf('white'), mf('white'), mc('011110','white'), null,       null],
      [mc('011111','white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mc('101111','white')],
      [mc('111100','white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mc('111100','white')],
      [null,       mc('010001','white'), null,       mc('010001','white'), null,       mc('010001','white'), null,       null],
      [mc('010001','white'), null,       mc('010001','white'), null,       mc('010001','white'), null,       mc('010001','white'), null],
    ]
  },

  'sun-cloud': {
    name: 'Sun behind cloud',
    category: 'Weather',
    data: [
      // Sun peeking from behind cloud
      [null,       null,       null,       null,       null,       mc('011111','yellow'), mf('yellow'), mf('yellow'), mc('101111','yellow')],
      [null,       mc('011110','white'), mf('white'), mc('011110','white'), null,       mc('111101','yellow'), mf('yellow'), mf('yellow'), mc('111110','yellow')],
      [mc('011111','white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mc('101111','white'), null],
      [mc('111101','white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mf('white'), mc('111110','white'), null],
    ]
  },

  'lightning': {
    name: 'Lightning bolt',
    category: 'Weather',
    data: [
      [null,       mc('001100','yellow')],
      [null,       mc('111100','yellow')],
      [mc('001111','yellow'), mf('yellow')],
      [mf('yellow'), mc('110000','yellow')],
      [mc('001111','yellow'), null],
      [mc('110000','yellow'), null],
    ]
  },

  'thermometer': {
    name: 'Thermometer',
    category: 'Weather',
    data: [
      [mc('011110','white')],
      [mc('010101','red')],
      [mc('010101','red')],
      [mc('010101','red')],
      [mc('010101','white')],
      [mc('010101','white')],
      [mf('red')],
      [mc('111100','red')],
    ]
  },

  'umbrella': {
    name: 'Umbrella',
    category: 'Weather',
    data: [
      [null,       mc('011111','red'), mf('red'), mf('red'), mf('red'), mc('101111','red'), null],
      [mf('red'),  mf('red'),  mf('red'),  mf('red'),  mf('red'),  mf('red'),  mf('red')],
      [null,       null,       null,       mc('010101','yellow'), null,       null,       null],
      [null,       null,       null,       mc('010101','yellow'), null,       null,       null],
      [null,       null,       mc('111100','yellow'), mc('111110','yellow'), null,       null,       null],
    ]
  },

  // ===== TRANSPORT =====

  'car': {
    name: 'Car',
    category: 'Transport',
    data: buildArt([
      '....RRRRRR....',
      '..RRRRRRRRRR..',
      '.RRRWWWWWWRRR.',
      'RRRRRRRRRRRRRR',
      'RR..RR..RR..RR',
      '..WW....WW....',
    ])
  },

  'plane': {
    name: 'Aeroplane',
    category: 'Transport',
    data: buildArt([
      '.......W........',
      '....WWWWW.......',
      'WWWWWWWWWWWWWW..',
      '....WWWWW.......',
      '.......W........',
      '.....WW.WW......',
    ])
  },

  'train': {
    name: 'Train',
    category: 'Transport',
    data: buildArt([
      '..GGGGGGGGGG....',
      '.GGCCCCCCCCGG...',
      'GGGGGGGGGGGGGG..',
      'GGGGGGGGGGGGGG..',
      'GG..GG..GG..GG..',
      '..WW....WW......',
    ])
  },

  'ship': {
    name: 'Ship',
    category: 'Transport',
    data: buildArt([
      '.......W........',
      '......WWW.......',
      '..RRRRRRRRRR....',
      '.RRRRRRRRRRRR...',
      'BBBBBBBBBBBBBB..',
      '..BB..BB..BB....',
    ])
  },

  // ===== SPORTS =====

  'football': {
    name: 'Football',
    category: 'Sports',
    data: buildArt([
      '..WWWWWW..',
      '.WWCWWCWW.',
      '.WWWWWWWW.',
      '.WWCWWCWW.',
      '..WWWWWW..',
      '..........',
    ])
  },

  'trophy': {
    name: 'Trophy',
    category: 'Sports',
    data: buildArt([
      '..YYYYYY..',
      '.YYYYYYYY.',
      '..YYYYYY..',
      '...YYYY...',
      '...YYYY...',
      '..YYYYYY..',
    ])
  },

  // ===== ICONS =====

  'house': {
    name: 'House',
    category: 'Icons',
    data: buildArt([
      '...RRRR....',
      '..RRRRRR...',
      '.RRRRRRRR..',
      '.YYYYYYYY..',
      '.YYWWWWYY..',
      '.YYW..WYY..',
      '.YYYYYYYY..',
      '..........',
      '..........',
    ])
  },

  'telephone': {
    name: 'Telephone',
    category: 'Icons',
    data: buildArt([
      '.WW....WW.',
      'WWWWWWWWWW',
      'WWWWWWWWWW',
      '..WWWWWW..',
      '...WWWW...',
      '..........',
    ])
  },

  'tv-icon': {
    name: 'Television',
    category: 'Icons',
    data: buildArt([
      'CCCCCCCCCC',
      'CWWWWWWWWC',
      'CWCCCCCCWC',
      'CWWWWWWWWC',
      'CCCCCCCCCC',
      '...YY..YY.',
    ])
  },

  'envelope': {
    name: 'Envelope / Letter',
    category: 'Icons',
    data: buildArt([
      'WWWWWWWWWW',
      'W.WWWWWW.W',
      'WW.WWWW.WW',
      'WWW.WW.WWW',
      'WWWW..WWWW',
      '..........',
    ])
  },

  'camera': {
    name: 'Camera',
    category: 'Icons',
    data: buildArt([
      '..WWWWWW..',
      '.WWCCCCWW.',
      'WWCCCCCCWW',
      'WWCCWWCCWW',
      '.WWCCCCWW.',
      '..WWWWWW..',
    ])
  },

  'clock': {
    name: 'Clock',
    category: 'Icons',
    data: buildArt([
      '..WWWWWW..',
      '.WWWWWWWW.',
      'WWWWWWWWWW',
      'WWWW.WWWWW',
      'WWWWWWWWWW',
      '.WWWWWWWW.',
      '..WWWWWW..',
      '..........',
      '..........',
    ])
  },

  'music-note': {
    name: 'Music note',
    category: 'Icons',
    data: buildArt([
      '...MM.....',
      '...MM.....',
      '...MM.....',
      '...MMMM...',
      '..MM..MM..',
      '..MM..MM..',
    ])
  },

  'star': {
    name: 'Star',
    category: 'Icons',
    data: [
      [null,       null,       mc('010100','yellow'), null,       null],
      [null,       mc('010100','yellow'), mf('yellow'), mc('101000','yellow'), null],
      [mf('yellow'), mf('yellow'), mf('yellow'), mf('yellow'), mf('yellow')],
      [null,       mf('yellow'), mf('yellow'), mf('yellow'), null],
      [mc('010100','yellow'), mc('101000','yellow'), null,       mc('010100','yellow'), mc('101000','yellow')],
    ]
  },

  'heart': {
    name: 'Heart',
    category: 'Icons',
    data: [
      [mc('011110','red'), mf('red'),  null,       mf('red'),  mc('011110','red')],
      [mf('red'),  mf('red'),  mf('red'),  mf('red'),  mf('red')],
      [mc('111101','red'), mf('red'),  mf('red'),  mf('red'),  mc('111110','red')],
      [null,       mc('111101','red'), mf('red'),  mc('111110','red'), null],
      [null,       null,       mc('111100','red'), null,       null],
    ]
  },

  'pound-sign': {
    name: 'Pound sign',
    category: 'Icons',
    data: [
      [null,       mc('011111','green'), mf('green'), mc('110000','green')],
      [mc('010100','green'), mf('green'), null,       null],
      [mf('green'), mf('green'), mf('green'), null],
      [mc('010100','green'), mf('green'), null,       null],
      [mf('green'), mf('green'), mf('green'), mc('110000','green')],
    ]
  },

  'book': {
    name: 'Book',
    category: 'Icons',
    data: buildArt([
      'CCWWWWWWCC',
      'CWWWWWWWWC',
      'CWCCCCCCWC',
      'CWWWWWWWWC',
      'CCWWWWWWCC',
      '..........',
    ])
  },

  'person': {
    name: 'Person',
    category: 'Icons',
    data: buildArt([
      '...WW...',
      '..WWWW..',
      '...CC...',
      '..CCCC..',
      '..C..C..',
      '.BB..BB.',
    ])
  },

  // ===== ARROWS =====

  'arrow-right': {
    name: 'Arrow right',
    category: 'Arrows',
    data: [
      [null,       null,       mc('010100','white')],
      [mf('white'), mf('white'), mf('white')],
      [null,       null,       mc('100010','white')],
    ]
  },

  'arrow-left': {
    name: 'Arrow left',
    category: 'Arrows',
    data: [
      [mc('101000','white'), null,       null],
      [mf('white'), mf('white'), mf('white')],
      [mc('000010','white'), null,       null],
    ]
  },

  'arrow-up': {
    name: 'Arrow up',
    category: 'Arrows',
    data: [
      [null,       mc('010100','white'), null],
      [mc('010100','white'), mf('white'), mc('101000','white')],
      [null,       mc('010101','white'), null],
      [null,       mc('010101','white'), null],
    ]
  },

  'arrow-down': {
    name: 'Arrow down',
    category: 'Arrows',
    data: [
      [null,       mc('010101','white'), null],
      [null,       mc('010101','white'), null],
      [mc('000001','white'), mf('white'), mc('100010','white')],
      [null,       mc('100010','white'), null],
    ]
  },

  // ===== NATURE =====

  'tree': {
    name: 'Tree',
    category: 'Nature',
    data: buildArt([
      '....GG....',
      '...GGGG...',
      '..GGGGGG..',
      '.GGGGGGGG.',
      '..GGGGGG..',
      '...GGGG...',
      '....YY....',
      '....YY....',
      '..........',
    ])
  },

  'flower': {
    name: 'Flower',
    category: 'Nature',
    data: buildArt([
      '..RR..RR..',
      '.RRRYYRRR.',
      '..RRYYRR..',
      '...G..G...',
      '...GGGG...',
      '....GG....',
    ])
  },

  'mountains': {
    name: 'Mountains',
    category: 'Nature',
    data: buildArt([
      '......W........W......',
      '.....GGW......WGG.....',
      '....GGGGW....WGGGG....',
      '...GGGGGGW..WGGGGGG...',
      '..GGGGGGGGWWGGGGGGGG..',
      '.GGGGGGGGGGGGGGGGGGGG.',
      'GGGGGGGGGGGGGGGGGGGGGG',
      '......................',
      'BBBBBBBBBBBBBBBBBBBBBB',
    ])
  },

  'waves': {
    name: 'Waves',
    category: 'Nature',
    data: buildArt([
      '..CC..CC..CC..CC..CC..CC',
      'CCCCCCCCCCCCCCCCCCCCCCCC',
      'CC..CC..CC..CC..CC..CC..',
      '..BB..BB..BB..BB..BB..BB',
      'BBBBBBBBBBBBBBBBBBBBBBBB',
      'BB..BB..BB..BB..BB..BB..',
    ])
  },

  'bird': {
    name: 'Bird',
    category: 'Nature',
    data: buildArt([
      '....W.......W....',
      '..WWW.....WWW....',
      '.WWWWWW.WWWWWW...',
      '....WWWWWWW......',
      '.....WWWWW.......',
      '......WWW........',
    ])
  },

  'fish': {
    name: 'Fish',
    category: 'Nature',
    data: buildArt([
      '....CCCCC......',
      '..CCCCCCCCCC...',
      '.CCCCCCCCCCCC..',
      '..CCCCCCCCCC...',
      '....CCCCC......',
      '.....C..C......',
    ])
  },

  // ===== PATTERNS =====

  'pattern-checker': {
    name: 'Checkerboard (6x4)',
    category: 'Patterns',
    data: [
      [mc('100110','cyan'), mc('011001','cyan'), mc('100110','cyan'), mc('011001','cyan'), mc('100110','cyan'), mc('011001','cyan')],
      [mc('011001','cyan'), mc('100110','cyan'), mc('011001','cyan'), mc('100110','cyan'), mc('011001','cyan'), mc('100110','cyan')],
      [mc('100110','cyan'), mc('011001','cyan'), mc('100110','cyan'), mc('011001','cyan'), mc('100110','cyan'), mc('011001','cyan')],
      [mc('011001','cyan'), mc('100110','cyan'), mc('011001','cyan'), mc('100110','cyan'), mc('011001','cyan'), mc('100110','cyan')]
    ]
  },

  'pattern-stripes-h': {
    name: 'Horiz stripes (6x4)',
    category: 'Patterns',
    data: [
      [mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green')],
      [mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green')],
      [mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green')],
      [mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green'), mc('110011','green')]
    ]
  },

  'pattern-stripes-v': {
    name: 'Vert stripes (6x4)',
    category: 'Patterns',
    data: [
      [mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow')],
      [mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow')],
      [mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow')],
      [mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow'), mc('101010','yellow')]
    ]
  },

  'pattern-bricks': {
    name: 'Brick pattern (6x4)',
    category: 'Patterns',
    data: [
      [mc('111111','red'), mc('111111','red'), mc('110011','red'), mc('111111','red'), mc('111111','red'), mc('110011','red')],
      [mc('110011','red'), mc('111111','red'), mc('111111','red'), mc('110011','red'), mc('111111','red'), mc('111111','red')],
      [mc('111111','red'), mc('111111','red'), mc('110011','red'), mc('111111','red'), mc('111111','red'), mc('110011','red')],
      [mc('110011','red'), mc('111111','red'), mc('111111','red'), mc('110011','red'), mc('111111','red'), mc('111111','red')]
    ]
  },

  // ===== MAPS =====

  'uk-outline': {
    name: 'UK outline',
    category: 'Maps',
    data: buildArt([
      '.............GGGG...........',
      '...........GGGGGGGG.........',
      '..........GGGGGGGGGG........',
      '..........GGGGGGGGG.........',
      '..........GGGGGGGG..........',
      '...........GGGGGGGG.........',
      '.....GG...GGGGGGGG..........',
      '...........GGGGGGGG.........',
      '...........GGGGGGGG.........',
      '..........GGGGGGGG..........',
      '..........GGGGGGGGG.........',
      '.........GGGGGGGGGGG........',
      '.........GGGGGGGGGGG........',
      '..........GGGGGGGGGG........',
      '..........GGGGGGGG..........',
      '...........GGGGGG...........',
      '.........GGGGGG.............',
      '..........GGGG..............',
      '..........GGGG..............',
    ])
  },

  // ===== SEASONAL =====

  'christmas-tree': {
    name: 'Christmas tree',
    category: 'Seasonal',
    data: buildArt([
      '.....Y.....',
      '....GGG....',
      '...GGGGG...',
      '..GGYGGYG..',
      '.GGGGGGGGG.',
      '..GGGGGGG..',
      '.GGYGGGGYG.',
      'GGGGGGGGGGG',
      '....YY.....',
      '....YY.....',
    ])
  },

  'snowman': {
    name: 'Snowman',
    category: 'Seasonal',
    data: buildArt([
      '....WW....',
      '...WWWW...',
      '....WW....',
      '...WWWW...',
      '..WWWWWW..',
      '..WWWWWW..',
      '...WWWW...',
      '..WWWWWW..',
      '.WWWWWWWW.',
      '..WWWWWW..',
      '...BBBB...',
    ])
  },

  'pumpkin': {
    name: 'Pumpkin',
    category: 'Seasonal',
    data: buildArt([
      '...G......',
      '..YYYYYY..',
      '.YYYYYYYY.',
      'YYYYYYYYYY',
      'YY.YYY.YYY',
      'YYYYYYYYYY',
      '.YYYYYYYY.',
      '..YYYYYY..',
    ])
  }
};
