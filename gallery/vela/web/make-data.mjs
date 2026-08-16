// =============================================================================
// make-data.mjs — stand-in data sets, under the names the examples ask for.
// =============================================================================
//   node gallery/vela/web/make-data.mjs
//
// A Vega-Lite example copied from the Vega site says `"url": "data/cars.json"`,
// and means a file on someone else's server. The page can fetch it, and did,
// but then the page only works with a network, only works while that server
// answers, and quietly depends on a data set this repository has no copy of.
//
// So these are OURS: same file names, same column names, same shapes, entirely
// invented numbers. That is a deliberate trade and the page says so on every
// chart it draws from one — a plausible-looking chart of Seattle weather that
// is not Seattle's weather would be a worse outcome than no chart at all.
//
// Committed rather than generated at build time, so the page is one directory
// you can open. Regenerate with the command above; the numbers are the same
// every run.
// =============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'data');

// A small deterministic generator, so the committed files do not churn.
let seed = 0x2f6e2b1;
function rnd() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
const pick = (list) => list[Math.floor(rnd() * list.length)];
const between = (lo, hi) => lo + rnd() * (hi - lo);
const round = (v, p = 1) => Math.round(v * 10 ** p) / 10 ** p;

// --- seattle-weather.csv -----------------------------------------------------
// Four years of days, with a seasonal temperature curve and a wetter winter, so
// a chart of it looks like weather even though it is not.
function seattleWeather() {
  const rows = [];
  for (let year = 2012; year <= 2015; year++) {
    const days = (year % 4 === 0) ? 366 : 365;
    for (let d = 0; d < days; d++) {
      const date = new Date(Date.UTC(year, 0, 1 + d));
      const doy = d / days;
      // +1 on the first of January, -1 in early July, so the cold and the rain
      // land in the same months a northern reader expects them to.
      const season = Math.cos(doy * 2 * Math.PI);
      const high = round(15.5 - 8.5 * season + between(-3, 3));
      const low = round(high - between(3.5, 8.5));
      const wetness = 0.62 + 0.22 * season;                  // wettest in winter
      const wet = rnd() < wetness;
      const precipitation = wet ? round(between(0.1, 22), 1) : 0;
      let weather;
      if (!wet) weather = rnd() < 0.55 ? 'sun' : 'fog';
      else if (high < 5) weather = 'snow';
      else if (precipitation < 2.5) weather = 'drizzle';
      else weather = 'rain';
      rows.push({
        date: date.toISOString().slice(0, 10),
        precipitation,
        temp_max: high,
        temp_min: low,
        wind: round(between(0.5, 8.5)),
        weather
      });
    }
  }
  return rows;
}

// --- cars.json ---------------------------------------------------------------
function cars() {
  const origins = ['USA', 'Europe', 'Japan'];
  const names = ['saloon', 'coupe', 'estate', 'hatchback', 'roadster', 'pickup', 'van'];
  const rows = [];
  for (let i = 0; i < 240; i++) {
    const origin = pick(origins);
    const cylinders = origin === 'USA' ? pick([4, 6, 8, 8]) : pick([4, 4, 6]);
    const displacement = round(cylinders * between(28, 62), 0);
    const horsepower = Math.round(displacement * between(0.35, 0.75));
    const weight = Math.round(1600 + displacement * between(2.6, 5.2));
    // Heavier and thirstier go together, which is the whole point of the chart.
    const mpg = round(52 - weight / 90 - horsepower / 26 + between(-2.5, 2.5));
    rows.push({
      Name: `${origin.toLowerCase()} ${pick(names)} ${70 + (i % 13)}`,
      Miles_per_Gallon: mpg > 0 ? mpg : null,
      Cylinders: cylinders,
      Displacement: displacement,
      Horsepower: horsepower,
      Weight_in_lbs: weight,
      Acceleration: round(24 - horsepower / 18 + between(-1.5, 1.5)),
      Year: `19${70 + (i % 13)}-01-01`,
      Origin: origin
    });
  }
  return rows;
}

// --- movies.json -------------------------------------------------------------
// The two ratings agree loosely, which is what makes a scatter of them worth
// drawing at all.
function movies() {
  const rows = [];
  const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Thriller', 'Documentary'];
  for (let i = 0; i < 320; i++) {
    const quality = between(0, 1);
    const imdb = round(2.4 + quality * 6.4 + between(-0.8, 0.8), 1);
    const tomato = Math.round(Math.min(100, Math.max(0, quality * 100 + between(-22, 22))));
    const budget = Math.round(between(2, 180)) * 1e6;
    rows.push({
      Title: `Untitled ${i + 1}`,
      'IMDB Rating': imdb > 10 ? 10 : imdb,
      'Rotten Tomatoes Rating': tomato,
      'Major Genre': pick(genres),
      'Production Budget': budget,
      'Worldwide Gross': Math.round(budget * between(0.2, 4.5) * (0.5 + quality)),
      'Release Date': `${2000 + (i % 16)}-${String(1 + (i % 12)).padStart(2, '0')}-14`
    });
  }
  return rows;
}

// --- stocks.csv --------------------------------------------------------------
function stocks() {
  const rows = [];
  const start = { MSFT: 39, AAPL: 25, IBM: 100, GOOG: 100, AMZN: 65 };
  const drift = { MSFT: 0.002, AAPL: 0.022, IBM: 0.004, GOOG: 0.014, AMZN: 0.013 };
  for (const symbol of Object.keys(start)) {
    let price = start[symbol];
    for (let year = 2000; year <= 2009; year++) {
      for (let month = 0; month < 12; month++) {
        if (symbol === 'GOOG' && (year < 2004 || (year === 2004 && month < 8))) continue;
        price = Math.max(1, price * (1 + drift[symbol] + between(-0.09, 0.09)));
        rows.push({
          symbol,
          date: `${monthName(month)} 1 ${year}`,
          price: round(price, 2)
        });
      }
    }
  }
  return rows;
}

function monthName(m) {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m];
}

// --- barley.json -------------------------------------------------------------
function barley() {
  const sites = ['University Farm', 'Waseca', 'Morris', 'Crookston', 'Grand Rapids', 'Duluth'];
  const varieties = ['Manchuria', 'Glabron', 'Svansota', 'Velvet', 'Trebi', 'Peatland'];
  const rows = [];
  for (const site of sites) {
    for (const variety of varieties) {
      for (const year of [1931, 1932]) {
        rows.push({ yield: round(between(14, 62), 5), variety, year, site });
      }
    }
  }
  return rows;
}

// --- writing -----------------------------------------------------------------
function toCsv(rows) {
  const header = Object.keys(rows[0]);
  const cell = (v) => {
    if (v === null || v === undefined) return '';
    const text = String(v);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [header.join(','), ...rows.map(r => header.map(h => cell(r[h])).join(','))].join('\n') + '\n';
}

fs.mkdirSync(OUT, { recursive: true });

const files = {
  'seattle-weather.csv': toCsv(seattleWeather()),
  'stocks.csv': toCsv(stocks()),
  'cars.json': JSON.stringify(cars()) + '\n',
  'movies.json': JSON.stringify(movies()) + '\n',
  'barley.json': JSON.stringify(barley()) + '\n'
};

for (const [name, body] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), body);
  const rows = name.endsWith('.csv') ? body.trim().split('\n').length - 1 : JSON.parse(body).length;
  console.log(`  ${name.padEnd(24)} ${rows} rows, ${(body.length / 1024).toFixed(1)} kB`);
}
console.log('\nInvented, not observed. The page says so wherever it draws one.');
