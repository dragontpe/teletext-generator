// TelePage - Template Definitions
// Each template defines the layout structure for a teletext page

const TELETEXT_COLORS = {
  black:   '#000000',
  red:     '#FF0000',
  green:   '#00FF00',
  yellow:  '#FFFF00',
  blue:    '#0000FF',
  magenta: '#FF00FF',
  cyan:    '#00FFFF',
  white:   '#FFFFFF'
};

const COLOR_NAMES = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

const templates = {
  news: {
    name: 'News',
    icon: '\u{1F4F0}',
    headerBg: 'cyan',
    headerText: 'white',
    titleColor: 'cyan',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '100',
    defaultTitle: 'HEADLINE TEXT HERE',
    defaultBody: 'The Government has today announced\nnew measures to tackle rising costs\nof living across the country.\n\nThe Prime Minister said the package\nwould help millions of families who\nare struggling with bills.\n\n"We understand the pressures people\nare facing," she told reporters at\na press conference in Downing St.',
    fastext: ['Headlines', 'Sport', 'Weather', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'cyan' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'subtitle' },
      { type: 'blank' },
      { type: 'body', rows: 17 },
      { type: 'fastext' }
    ]
  },

  weather: {
    name: 'Weather',
    icon: '\u{1F324}',
    headerBg: 'yellow',
    headerText: 'black',
    titleColor: 'yellow',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '401',
    defaultTitle: 'WEATHER FORECAST',
    defaultBody: 'OUTLOOK FOR TOMORROW\n\nSouth East   Cloudy        14C\nSouth West   Showers       13C\nMidlands     Bright spells 12C\nNorth West   Rain          10C\nNorth East   Overcast      11C\nScotland     Heavy rain     8C\nN Ireland    Showers        9C\nWales        Bright spells 12C',
    fastext: ['5 Day', 'Regional', 'Shipping', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'yellow' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'subtitle' },
      { type: 'blank' },
      { type: 'body', rows: 17 },
      { type: 'fastext' }
    ]
  },

  sports: {
    name: 'Sport',
    icon: '\u{26BD}',
    headerBg: 'green',
    headerText: 'white',
    titleColor: 'green',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '300',
    defaultTitle: 'FOOTBALL RESULTS',
    defaultBody: '',
    defaultSports: [
      { home: 'Arsenal', away: 'Liverpool', homeScore: '2', awayScore: '1' },
      { home: 'Man Utd', away: 'Tottenham', homeScore: '0', awayScore: '0' },
      { home: 'Chelsea', away: 'Everton', homeScore: '3', awayScore: '2' },
      { home: 'Aston Villa', away: 'West Ham', homeScore: '1', awayScore: '1' },
      { home: 'Nott\'m Forest', away: 'Norwich', homeScore: '2', awayScore: '0' },
      { home: 'Southampton', away: 'Watford', homeScore: '1', awayScore: '3' },
    ],
    fastext: ['Tables', 'Pools', 'Cricket', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'green' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'blank' },
      { type: 'sports-table', rows: 18 },
      { type: 'fastext' }
    ]
  },

  tvlistings: {
    name: 'TV Listings',
    icon: '\u{1F4FA}',
    headerBg: 'magenta',
    headerText: 'white',
    titleColor: 'magenta',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '600',
    defaultTitle: 'BBC1 THIS EVENING',
    defaultBody: '',
    defaultListings: [
      { time: '18.00', programme: 'Six O\'Clock News' },
      { time: '18.30', programme: 'Regional News' },
      { time: '19.00', programme: 'Wogan' },
      { time: '19.35', programme: 'Blankety Blank' },
      { time: '20.10', programme: 'EastEnders' },
      { time: '20.40', programme: 'Points of View' },
      { time: '21.00', programme: 'Nine O\'Clock News' },
      { time: '21.30', programme: 'Film: The Italian Job' },
      { time: '23.15', programme: 'Weather' },
      { time: '23.20', programme: 'Close' },
    ],
    fastext: ['BBC2', 'ITV', 'Ch4', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'magenta' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'blank' },
      { type: 'tv-table', rows: 18 },
      { type: 'fastext' }
    ]
  },

  index: {
    name: 'Index',
    icon: '\u{1F4CB}',
    headerBg: 'blue',
    headerText: 'white',
    titleColor: 'yellow',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '100',
    defaultTitle: 'CEEFAX INDEX',
    defaultBody: 'News/Flash ............... 101\nNewsreel ................. 102\nNews Index ............... 104\nWeather .................. 401\nTravel ................... 430\nFinance .................. 200\nSport .................... 300\nFootball ................. 302\nCricket .................. 340\nTV Listings .............. 600\nRadio .................... 640\nLetters .................. 150\nMusic .................... 500\nHolidays ................. 450',
    fastext: ['News', 'Sport', 'Weather', 'TV'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'yellow' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'subtitle' },
      { type: 'blank' },
      { type: 'body', rows: 17 },
      { type: 'fastext' }
    ]
  },

  custom: {
    name: 'Custom',
    icon: '\u{1F4AC}',
    headerBg: 'blue',
    headerText: 'white',
    titleColor: 'white',
    bodyColor: 'white',
    serviceName: 'TELETEXT',
    defaultPageNum: '100',
    defaultTitle: 'YOUR TITLE HERE',
    defaultBody: 'Type your content here.\nEach line can be up to 40 characters.\n\nUse the mosaic editor to draw\npixel art with block graphics.',
    fastext: ['Page 1', 'Page 2', 'Page 3', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'blank' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'subtitle' },
      { type: 'blank' },
      { type: 'body', rows: 17 },
      { type: 'fastext' }
    ]
  },

  newsflash: {
    name: 'News Flash',
    icon: '\u{26A0}',
    category: 'other',
    headerBg: 'red',
    headerText: 'white',
    titleColor: 'yellow',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '101',
    defaultTitle: 'NEWS FLASH',
    defaultBody: 'Reports are coming in of a major\nincident in central London.\n\nEmergency services are at the scene\nand roads in the area have been\nclosed to traffic.\n\nMore details as they become\navailable.\n\nSee News Index p104',
    fastext: ['News', 'Sport', 'Weather', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'red' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'subtitle' },
      { type: 'blank' },
      { type: 'body', rows: 17 },
      { type: 'fastext' }
    ]
  },

  newsreel: {
    name: 'Newsreel',
    icon: '\u{1F5DE}',
    category: 'other',
    headerBg: 'cyan',
    headerText: 'white',
    titleColor: 'yellow',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '102',
    defaultTitle: 'NEWSREEL',
    defaultBody: 'RAIL STRIKE TALKS CONTINUE   p105\nUnion leaders meet BR bosses today\n\nBUDGET REACTION              p106\nOpposition calls for rethink\n\nROYAL VISIT TO WALES         p107\nPrincess to open new hospital\n\nFLOODING IN EAST ANGLIA      p108\nHundreds evacuated overnight\n\nTEACHERS PAY DEAL AGREED     p109\n5% rise over two years',
    fastext: ['News', 'Sport', 'Weather', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'cyan' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'blank' },
      { type: 'body', rows: 18 },
      { type: 'fastext' }
    ]
  },

  travel: {
    name: 'Travel',
    icon: '\u{1F697}',
    category: 'other',
    headerBg: 'yellow',
    headerText: 'black',
    titleColor: 'yellow',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '430',
    defaultTitle: 'TRAVEL NEWS',
    defaultBody: 'MOTORWAYS\nM1 Northbound J6-J8 lane closed\ndue to roadworks. Delays 20 mins.\n\nM25 Clockwise J10-J12 slow moving\nafter earlier breakdown.\n\nM6 Southbound J15-J13 contraflow\nin operation until March.\n\nRAIL\nBR Southern Region: Delays on the\nBrighton line due to signal failure\nat East Croydon.\n\nBR Western Region: Normal service.',
    fastext: ['Roads', 'Rail', 'Air', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'yellow' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'subtitle' },
      { type: 'blank' },
      { type: 'body', rows: 17 },
      { type: 'fastext' }
    ]
  },

  finance: {
    name: 'Finance',
    icon: '\u{1F4B7}',
    category: 'other',
    headerBg: 'blue',
    headerText: 'white',
    titleColor: 'cyan',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '200',
    defaultTitle: 'CITY NEWS',
    defaultBody: 'FT-SE 100 ........... 2346.5 +18.3\nFT  30 .............. 1872.4 +12.1\n\nWall St closed overnight at\n2,694.72, down 8.36 points.\n\nSTERLING\nDollar ......... 1.6385  +0.0042\nDeutschmark .... 2.9475  -0.0130\nYen ............ 225.40  +0.85\nFranc .......... 9.8350  +0.0210\n\nGOLD  $412.50  +2.75\nOIL   $18.42/barrel',
    fastext: ['Shares', 'Forex', 'News', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'cyan' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'subtitle' },
      { type: 'blank' },
      { type: 'body', rows: 17 },
      { type: 'fastext' }
    ]
  },

  football: {
    name: 'Football',
    icon: '\u{26BD}',
    category: 'other',
    headerBg: 'green',
    headerText: 'white',
    titleColor: 'green',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '302',
    defaultTitle: 'FOOTBALL FOCUS',
    defaultBody: 'FIRST DIVISION TABLE\n\n                     P  W  D  L Pts\nLiverpool           22 16  4  2  52\nArsenal             22 14  5  3  47\nNott\'m Forest       22 13  6  3  45\nMan Utd             22 12  5  5  41\nEverton             22 11  6  5  39\nTottenham           22 10  7  5  37\nChelsea             22  9  6  7  33\nSheffield Wed       22  8  7  7  31\nAston Villa         22  8  6  8  30\nWest Ham            22  7  5 10  26',
    fastext: ['Results', 'Tables', 'Pools', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'green' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'blank' },
      { type: 'body', rows: 18 },
      { type: 'fastext' }
    ]
  },

  cricket: {
    name: 'Cricket',
    icon: '\u{1F3CF}',
    category: 'other',
    headerBg: 'green',
    headerText: 'white',
    titleColor: 'yellow',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '340',
    defaultTitle: 'CRICKET SCORECARD',
    defaultBody: 'ENGLAND v AUSTRALIA  3rd Test\nHeadingley, Leeds    Day 2\n\nAUSTRALIA  1st Innings     401-7 dec\n\nENGLAND  1st Innings\nGooch        c Marsh b Alderman   48\nBroad        lbw b Lawson         12\nGatting      c Border b Waugh     34\nLamb         not out              67\nBotham       c&b Alderman         22\nExtras       (b4 lb8 nb2)         14\n\nTotal        (5 wkts)            197\n\nOvers: 62   RR: 3.17',
    fastext: ['Scores', 'Tables', 'Football', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'green' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'blank' },
      { type: 'body', rows: 18 },
      { type: 'fastext' }
    ]
  },

  radio: {
    name: 'Radio',
    icon: '\u{1F4FB}',
    category: 'other',
    headerBg: 'magenta',
    headerText: 'white',
    titleColor: 'magenta',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '640',
    defaultTitle: 'RADIO 4 TODAY',
    defaultListings: [
      { time: '06.00', programme: 'Today' },
      { time: '09.00', programme: 'Desert Island Discs' },
      { time: '09.45', programme: 'Book of the Week' },
      { time: '10.00', programme: 'Woman\'s Hour' },
      { time: '11.00', programme: 'The World at One' },
      { time: '12.00', programme: 'You and Yours' },
      { time: '13.00', programme: 'The Archers' },
      { time: '14.00', programme: 'Afternoon Play' },
      { time: '15.00', programme: 'Gardeners\' Question Time' },
      { time: '17.00', programme: 'PM' },
      { time: '18.00', programme: 'Six O\'Clock News' },
      { time: '20.00', programme: 'File on 4' },
    ],
    fastext: ['Radio 1', 'Radio 2', 'Radio 3', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'magenta' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'blank' },
      { type: 'tv-table', rows: 18 },
      { type: 'fastext' }
    ]
  },

  letters: {
    name: 'Letters',
    icon: '\u{2709}',
    category: 'other',
    headerBg: 'cyan',
    headerText: 'white',
    titleColor: 'yellow',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '150',
    defaultTitle: 'LETTERS',
    defaultBody: 'Dear Ceefax,\n\nI would like to congratulate the\nBBC on the excellent coverage of\nthe recent cricket series. The\nteletext updates were invaluable\nwhen I couldn\'t watch on TV.\n\nKeep up the good work!\n\nJ. Smith, Basingstoke\n\nWrite to: Ceefax Letters\nBBC TV Centre, London W12 7RJ',
    fastext: ['News', 'Sport', 'Weather', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'cyan' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'subtitle' },
      { type: 'blank' },
      { type: 'body', rows: 17 },
      { type: 'fastext' }
    ]
  },

  music: {
    name: 'Music',
    icon: '\u{1F3B5}',
    category: 'other',
    headerBg: 'magenta',
    headerText: 'white',
    titleColor: 'green',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '500',
    defaultTitle: 'TOP TEN SINGLES',
    defaultBody: ' 1  1 Never Gonna Give You Up\n       Rick Astley\n 2  3 I Wanna Dance w/Somebody\n       Whitney Houston\n 3  2 It\'s a Sin\n       Pet Shop Boys\n 4  5 Alone\n       Heart\n 5  4 La Bamba\n       Los Lobos\n 6  7 Who\'s That Girl\n       Madonna\n 7  6 I Just Can\'t Stop Loving U\n       Michael Jackson',
    fastext: ['Albums', 'Gigs', 'Reviews', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'green' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'blank' },
      { type: 'body', rows: 18 },
      { type: 'fastext' }
    ]
  },

  holidays: {
    name: 'Holidays',
    icon: '\u{2708}',
    category: 'other',
    headerBg: 'yellow',
    headerText: 'black',
    titleColor: 'yellow',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '450',
    defaultTitle: 'HOLIDAY BARGAINS',
    defaultBody: 'LATE BOOKINGS  -  SUMMER 1987\n\nCosta del Sol  7nts  fr  99pp\nMajorca        7nts  fr 109pp\nCorfu         14nts  fr 179pp\nTenerife      14nts  fr 199pp\nAlgarve        7nts  fr 119pp\nTunisia       14nts  fr 149pp\nFlorida       14nts  fr 349pp\n\nPrices per person based on 2\nsharing. Flights from Gatwick.\n\nSee your local travel agent or\ncall Ceefax Holidays 01 930 4832',
    fastext: ['Flights', 'Hotels', 'Weather', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'yellow' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'subtitle' },
      { type: 'blank' },
      { type: 'body', rows: 17 },
      { type: 'fastext' }
    ]
  },

  review: {
    name: 'Review',
    icon: '\u{1F3AC}',
    category: 'other',
    headerBg: 'magenta',
    headerText: 'white',
    titleColor: 'cyan',
    bodyColor: 'white',
    serviceName: 'CEEFAX',
    defaultPageNum: '510',
    defaultTitle: 'FILM REVIEW',
    defaultBody: 'THE LIVING DAYLIGHTS  (PG)\n\nTimothy Dalton makes his debut as\nJames Bond in this action-packed\nthriller.\n\nThe new 007 is a more serious and\ngritty Bond, closer to Fleming\'s\noriginal creation.\n\nDalton brings real intensity to\nthe role. Highly recommended.\n\nOn general release from Friday.\n\nRating: ****',
    fastext: ['TV', 'Music', 'Books', 'Index'],
    layout: [
      { type: 'header' },
      { type: 'separator', color: 'cyan' },
      { type: 'title', doubleHeight: true },
      { type: 'title-bottom' },
      { type: 'subtitle' },
      { type: 'blank' },
      { type: 'body', rows: 17 },
      { type: 'fastext' }
    ]
  }
};
