/* Academy Plenger — papan harga live (Emas, BTC, USD/IDR)
   Dimuat hanya di situs live (GitHub Pages). Mengisi wadah #priceBoard
   di section Chart Live. Sumber publik tanpa kunci:
   BTC: Binance API • Emas: Gold-API (cadangan GoldPrice.org) • IDR: Open ExchangeRate API */
(function () {
  'use strict';

  var CSS = [
    '.pb-wrap{margin:0 auto 18px;max-width:100%}',
    '.pb-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}',
    '@media (max-width:720px){.pb-grid{grid-template-columns:1fr}}',
    '.pb-card{background:rgba(180,77,255,.07);border:1px solid rgba(180,77,255,.35);border-radius:16px;padding:16px 18px;color:#f3efff}',
    '.pb-name{font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin:0 0 6px}',
    '.pb-price{font-size:26px;font-weight:800;line-height:1.1;margin:0}',
    '.pb-sub{font-size:12.5px;margin:6px 0 0;opacity:.8}',
    '.pb-up{color:#34d399}.pb-down{color:#f87171}',
    '.pb-note{font-size:12px;opacity:.65;margin:10px 2px 0;text-align:center}'
  ].join('');

  function fmt(n, dec) {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: dec, maximumFractionDigits: dec
    }).format(n);
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildBoard() {
    var host = document.getElementById('priceBoard');
    if (!host) {
      var sec = document.getElementById('dojo');
      if (!sec) return null;
      host = el('div'); host.id = 'priceBoard';
      sec.insertBefore(host, sec.firstChild);
    }
    host.innerHTML = '';
    var style = el('style'); style.textContent = CSS; host.appendChild(style);
    var wrap = el('div', 'pb-wrap');
    var grid = el('div', 'pb-grid');
    var cards = {};
    [['gold', 'Emas — XAU/USD', 'per troy ounce • USD'],
     ['btc', 'BTC — Bitcoin/USDT', 'Binance • 24 jam'],
     ['idr', 'IDR — USD/IDR', '1 USD dalam Rupiah']
    ].forEach(function (it) {
      var card = el('div', 'pb-card');
      card.appendChild(el('p', 'pb-name', it[1]));
      var price = el('p', 'pb-price', 'Memuat…');
      var sub = el('p', 'pb-sub', it[2]);
      card.appendChild(price); card.appendChild(sub);
      grid.appendChild(card);
      cards[it[0]] = { price: price, sub: sub, baseSub: it[2] };
    });
    wrap.appendChild(grid);
    wrap.appendChild(el('p', 'pb-note',
      'Harga live — diperbarui otomatis tiap menit • Sumber: Binance, Gold-API, ExchangeRate • Bukan saran finansial, selalu DYOR'));
    host.appendChild(wrap);
    return cards;
  }

  function getJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function setChange(card, pct) {
    var up = pct >= 0;
    var span = el('span', up ? 'pb-up' : 'pb-down',
      (up ? '▲ ' : '▼ ') + fmt(Math.abs(pct), 2) + '% (24j)');
    card.sub.textContent = card.baseSub + ' • ';
    card.sub.appendChild(span);
  }

  function update(cards) {
    getJSON('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT')
      .then(function (d) {
        cards.btc.price.textContent = '$' + fmt(parseFloat(d.lastPrice), 2);
        setChange(cards.btc, parseFloat(d.priceChangePercent));
      })
      .catch(function () {
        return getJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true')
          .then(function (d) {
            cards.btc.price.textContent = '$' + fmt(parseFloat(d.bitcoin.usd), 2);
            setChange(cards.btc, parseFloat(d.bitcoin.usd_24h_change));
          })
          .catch(function () { cards.btc.price.textContent = '—'; });
      });

    getJSON('https://api.gold-api.com/price/XAU')
      .then(function (d) {
        if (!d || !d.price) throw new Error('no price');
        cards.gold.price.textContent = '$' + fmt(parseFloat(d.price), 2);
      })
      .catch(function () {
        return getJSON('https://data-asg.goldprice.org/dbXRates/USD')
          .then(function (d) {
            cards.gold.price.textContent = '$' + fmt(parseFloat(d.items[0].xauPrice), 2);
          })
          .catch(function () { cards.gold.price.textContent = '—'; });
      });

    getJSON('https://open.er-api.com/v6/latest/USD')
      .then(function (d) {
        if (!d || !d.rates || !d.rates.IDR) throw new Error('no rate');
        cards.idr.price.textContent = 'Rp' + fmt(parseFloat(d.rates.IDR), 0);
      })
      .catch(function () { cards.idr.price.textContent = '—'; });
  }

  function start() {
    var cards = buildBoard();
    if (!cards) return;
    update(cards);
    setInterval(function () { update(cards); }, 60000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
