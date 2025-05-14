// getPriceNew.js
// Import node-fetch version 2 (CommonJS compatible)
const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Fetches the current price for any Google Finance symbol
 * @param {string} symbol  e.g. 'AAPL', 'RGC', 'BTC-USD', etc.
 * @returns {Promise<number>}
 */
async function getCurrentPrice(symbol) {
  const url = `https://www.google.com/finance/quote/${symbol}`;
  const res = await fetch(url, {
    headers: {
      // mimic a real browser so Google returns the full page HTML
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  // 1) Try the main price element on a direct quote page
  const priceEl = $('div.YMlKec.fxKbKc').first();
  if (priceEl.length) {
    let raw = priceEl.text().trim();
    // strip non-digits, normalize commas → dots
    let clean = raw
      .replace(/\u202f/g, '')        // no-break spaces
      .replace(/\s/g, '')            // any remaining spaces
      .replace(/,/g, '.')            // comma → dot
      .replace(/[^0-9.]/g, '');      // drop currency symbols, etc.
    let num = parseFloat(clean);
    if (!isNaN(num)) return num;
    throw new Error(`Unrecognized price format: "${raw}"`);
  }

  // 2) Fallback: search-results page — grab the first currency match
  const m = /([\d\u202f.,]+)\s*[€$£¥]/.exec(html);
  if (m) {
    let clean = m[1].replace(/\u202f/g, '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
    let num = parseFloat(clean);
    if (!isNaN(num)) return num;
  }

  throw new Error(`Could not extract price for symbol "${symbol}"`);
}

module.exports = { getCurrentPrice };

// — Self-invoking example when run directly:
if (require.main === module) {
  (async () => {
    const sym = process.argv[2] || 'AAPL';
    try {
      const price = await getCurrentPrice(sym);
      console.log(`${sym} current price:`, price);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  })();
}
