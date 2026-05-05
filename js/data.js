/* ========================================================================
   Sound Bites — data module
   All static data: vocab, categories, banks, sound manifests.
   Attached to window.SB.data so other modules can read.
   ======================================================================== */
window.SB = window.SB || {};
SB.data = {};

// ===== Picture vocabulary (emoji + en + de) =====
SB.data.PIC_VOCAB = [
  { emoji: '🐶', en: 'dog',     de: 'Hund' },
  { emoji: '🐱', en: 'cat',     de: 'Katze' },
  { emoji: '🐟', en: 'fish',    de: 'Fisch' },
  { emoji: '🐦', en: 'bird',    de: 'Vogel' },
  { emoji: '🐴', en: 'horse',   de: 'Pferd' },
  { emoji: '🐮', en: 'cow',     de: 'Kuh' },
  { emoji: '🐷', en: 'pig',     de: 'Schwein' },
  { emoji: '🐝', en: 'bee',     de: 'Biene' },
  { emoji: '🍎', en: 'apple',   de: 'Apfel' },
  { emoji: '🍌', en: 'banana',  de: 'Banane' },
  { emoji: '🍞', en: 'bread',   de: 'Brot' },
  { emoji: '🧀', en: 'cheese',  de: 'Käse' },
  { emoji: '🥕', en: 'carrot',  de: 'Karotte' },
  { emoji: '🍇', en: 'grape',   de: 'Traube' },
  { emoji: '☀️', en: 'sun',     de: 'Sonne' },
  { emoji: '🌙', en: 'moon',    de: 'Mond' },
  { emoji: '⭐', en: 'star',    de: 'Stern' },
  { emoji: '🌳', en: 'tree',    de: 'Baum' },
  { emoji: '🌸', en: 'flower',  de: 'Blume' },
  { emoji: '☁️', en: 'cloud',   de: 'Wolke' },
  { emoji: '🚗', en: 'car',     de: 'Auto' },
  { emoji: '🚌', en: 'bus',     de: 'Bus' },
  { emoji: '🚲', en: 'bike',    de: 'Fahrrad' },
  { emoji: '✈️', en: 'plane',   de: 'Flugzeug' },
  { emoji: '🚢', en: 'ship',    de: 'Schiff' },
  { emoji: '🏠', en: 'house',   de: 'Haus' },
  { emoji: '⚽', en: 'ball',    de: 'Ball' },
  { emoji: '📚', en: 'book',    de: 'Buch' },
  { emoji: '🔑', en: 'key',     de: 'Schlüssel' },
  { emoji: '⏰', en: 'clock',   de: 'Uhr' },
  { emoji: '👟', en: 'shoe',    de: 'Schuh' },
  { emoji: '👒', en: 'hat',     de: 'Hut' },
];

// ===== Odd-one-out semantic categories =====
SB.data.ODD_CATEGORIES = {
  'en-US': [
    { group: ['dog','cat','horse','cow'], odd: 'apple' },
    { group: ['apple','banana','grape','carrot'], odd: 'shoe' },
    { group: ['car','bus','bike','plane'], odd: 'tree' },
    { group: ['sun','moon','star','cloud'], odd: 'book' },
    { group: ['shirt','pants','hat','shoe'], odd: 'fork' },
    { group: ['hammer','saw','drill','wrench'], odd: 'banana' },
    { group: ['red','blue','green','yellow'], odd: 'square' },
    { group: ['piano','guitar','drum','flute'], odd: 'chair' },
    { group: ['eye','ear','nose','mouth'], odd: 'pencil' },
    { group: ['rose','tulip','daisy','lily'], odd: 'whale' },
    { group: ['rain','snow','wind','hail'], odd: 'spoon' },
    { group: ['bread','rice','pasta','cheese'], odd: 'rocket' },
  ],
  'de-DE': [
    { group: ['Hund','Katze','Pferd','Kuh'], odd: 'Apfel' },
    { group: ['Apfel','Banane','Traube','Karotte'], odd: 'Schuh' },
    { group: ['Auto','Bus','Fahrrad','Flugzeug'], odd: 'Baum' },
    { group: ['Sonne','Mond','Stern','Wolke'], odd: 'Buch' },
    { group: ['Hemd','Hose','Hut','Schuh'], odd: 'Gabel' },
    { group: ['Hammer','Säge','Bohrer','Zange'], odd: 'Banane' },
    { group: ['rot','blau','grün','gelb'], odd: 'Quadrat' },
    { group: ['Klavier','Gitarre','Trommel','Flöte'], odd: 'Stuhl' },
    { group: ['Auge','Ohr','Nase','Mund'], odd: 'Bleistift' },
    { group: ['Rose','Tulpe','Lilie','Veilchen'], odd: 'Wal' },
    { group: ['Regen','Schnee','Wind','Hagel'], odd: 'Löffel' },
    { group: ['Brot','Reis','Nudeln','Käse'], odd: 'Rakete' },
  ],
};

// ===== Minimal-pair word banks =====
SB.data.MIN_PAIRS = {
  'en-US': {
    pb: [['pat','bat'],['pig','big'],['pen','Ben'],['pill','bill'],['pack','back'],['pear','bear'],['pin','bin'],['peach','beach'],['pad','bad'],['pull','bull'],['pole','bowl'],['path','bath']],
    kg: [['coat','goat'],['cap','gap'],['came','game'],['cold','gold'],['curl','girl'],['cane','gain'],['kale','gale'],['cot','got'],['could','good'],['class','glass']],
    td: [['tip','dip'],['ten','den'],['town','down'],['try','dry'],['tear','dear'],['toe','doe'],['tin','din'],['time','dime'],['tug','dug'],['tail','dale']],
    fv: [['fan','van'],['few','view'],['fast','vast'],['ferry','very'],['leaf','leave'],['safe','save'],['fault','vault'],['file','vile']],
    sz: [['sip','zip'],['sue','zoo'],['sing','zing'],['seal','zeal'],['sown','zone']],
  },
  'de-DE': {
    pb: [['Paar','Bar'],['Pier','Bier'],['Pein','Bein'],['Pass','Bass'],['packen','backen'],['Park','Bart']],
    kg: [['Kasse','Gasse'],['Karten','Garten'],['kalt','galt'],['Kunst','Gunst']],
    td: [['Tier','dir'],['Tanne','danne'],['Tante','Dante'],['Tag','Dach']],
    fv: [['fein','Wein'],['vier','wir']],
    sz: [['Saft','Zaft'],['so','Zoo']],
  },
};

SB.data.PAIR_LABELS = {
  pb: { left: 'P', right: 'B' },
  kg: { left: 'K', right: 'G' },
  td: { left: 'T', right: 'D' },
  fv: { left: 'F', right: 'V' },
  sz: { left: 'S', right: 'Z' },
};

// ===== Stress-marked words =====
SB.data.STRESS_WORDS = {
  'en-US': [
    { word: 'apple',    syllables: ['ap','ple'],          pattern: '10', emoji: '🍎' },
    { word: 'banana',   syllables: ['ba','na','na'],      pattern: '010', emoji: '🍌' },
    { word: 'elephant', syllables: ['el','e','phant'],    pattern: '100', emoji: '🐘' },
    { word: 'computer', syllables: ['com','pu','ter'],    pattern: '010', emoji: '💻' },
    { word: 'mountain', syllables: ['moun','tain'],       pattern: '10', emoji: '⛰️' },
    { word: 'guitar',   syllables: ['gui','tar'],         pattern: '01', emoji: '🎸' },
    { word: 'piano',    syllables: ['pi','a','no'],       pattern: '010', emoji: '🎹' },
    { word: 'doctor',   syllables: ['doc','tor'],         pattern: '10', emoji: '👨‍⚕️' },
    { word: 'umbrella', syllables: ['um','brel','la'],    pattern: '010', emoji: '☂️' },
    { word: 'window',   syllables: ['win','dow'],         pattern: '10', emoji: '🪟' },
    { word: 'balloon',  syllables: ['bal','loon'],        pattern: '01', emoji: '🎈' },
    { word: 'butterfly',syllables: ['but','ter','fly'],   pattern: '100', emoji: '🦋' },
    { word: 'tomato',   syllables: ['to','ma','to'],      pattern: '010', emoji: '🍅' },
    { word: 'rabbit',   syllables: ['rab','bit'],         pattern: '10', emoji: '🐰' },
  ],
  'de-DE': [
    { word: 'Apfel',     syllables: ['Ap','fel'],         pattern: '10', emoji: '🍎' },
    { word: 'Banane',    syllables: ['Ba','na','ne'],     pattern: '010', emoji: '🍌' },
    { word: 'Computer',  syllables: ['Com','pu','ter'],   pattern: '010', emoji: '💻' },
    { word: 'Tomate',    syllables: ['To','ma','te'],     pattern: '010', emoji: '🍅' },
    { word: 'Sonne',     syllables: ['Son','ne'],         pattern: '10', emoji: '☀️' },
    { word: 'Garten',    syllables: ['Gar','ten'],        pattern: '10', emoji: '🌳' },
    { word: 'Familie',   syllables: ['Fa','mi','lie'],    pattern: '010', emoji: '👨‍👩‍👧' },
    { word: 'Schmetterling', syllables: ['Schmet','ter','ling'], pattern: '100', emoji: '🦋' },
    { word: 'Telefon',   syllables: ['Te','le','fon'],    pattern: '001', emoji: '📞' },
    { word: 'Kaninchen', syllables: ['Ka','nin','chen'],  pattern: '010', emoji: '🐰' },
    { word: 'Schokolade',syllables: ['Scho','ko','la','de'], pattern: '0010', emoji: '🍫' },
    { word: 'Elefant',   syllables: ['E','le','fant'],    pattern: '001', emoji: '🐘' },
  ],
};

// ===== Environmental sound manifest =====
// Each entry: { id, emoji, label_en, label_de, file }
// Audio files should live at sounds/env/<file>. If missing, app falls back gracefully.
SB.data.ENV_SOUNDS = [
  { id: 'dog',       emoji: '🐶', en: 'dog barking',  de: 'Hund bellen',     file: 'dog.mp3' },
  { id: 'cat',       emoji: '🐱', en: 'cat meowing',  de: 'Katze miauen',    file: 'cat.mp3' },
  { id: 'phone',     emoji: '📞', en: 'phone ringing', de: 'Telefon klingelt', file: 'phone.mp3' },
  { id: 'doorbell',  emoji: '🔔', en: 'doorbell',     de: 'Türklingel',      file: 'doorbell.mp3' },
  { id: 'water',     emoji: '💧', en: 'running water', de: 'fließendes Wasser', file: 'water.mp3' },
  { id: 'thunder',   emoji: '⛈️', en: 'thunder',      de: 'Donner',           file: 'thunder.mp3' },
  { id: 'footsteps', emoji: '👣', en: 'footsteps',    de: 'Schritte',        file: 'footsteps.mp3' },
  { id: 'glass',     emoji: '🥂', en: 'glass clink',  de: 'Glas klirren',    file: 'glass.mp3' },
  { id: 'carhorn',   emoji: '🚗', en: 'car horn',     de: 'Autohupe',        file: 'carhorn.mp3' },
  { id: 'applause',  emoji: '👏', en: 'applause',     de: 'Applaus',         file: 'applause.mp3' },
  { id: 'baby',      emoji: '👶', en: 'baby crying',  de: 'Baby weinen',     file: 'baby.mp3' },
  { id: 'bell',      emoji: '🛎️', en: 'bell',         de: 'Glocke',          file: 'bell.mp3' },
  { id: 'whistle',   emoji: '🚂', en: 'train whistle', de: 'Pfeife',         file: 'whistle.mp3' },
  { id: 'sneeze',    emoji: '🤧', en: 'sneeze',       de: 'Niesen',          file: 'sneeze.mp3' },
  { id: 'cough',     emoji: '😷', en: 'cough',        de: 'Husten',          file: 'cough.mp3' },
  { id: 'rooster',   emoji: '🐓', en: 'rooster',      de: 'Hahn',            file: 'rooster.mp3' },
];

// ===== Ambient backgrounds =====
// Loop files at sounds/ambience/<file>. Falls back to procedural if absent.
SB.data.AMBIENT_FILES = {
  park:   'park.mp3',
  cafe:   'cafe.mp3',
  street: 'street.mp3',
};
