/**
 * lib/math.js -- Vector math utilities for NexusVeritas
 * Exports: cos(a,b), euc(a,b), centroid(vecs), stats(vecs), p50nn(vecs, metric)
 */

function cos(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    d += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? d / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

function euc(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

function centroid(vecs) {
  const dim = vecs[0].length;
  const c = new Array(dim).fill(0);
  for (const v of vecs) for (let i = 0; i < dim; i++) c[i] += v[i];
  for (let i = 0; i < dim; i++) c[i] /= vecs.length;
  return c;
}

function stats(vecs) {
  const best = [];
  for (let i = 0; i < vecs.length; i++) {
    let m = -1;
    for (let j = 0; j < vecs.length; j++) {
      if (i !== j) {
        const s = cos(vecs[i], vecs[j]);
        if (s > m) m = s;
      }
    }
    best.push(m);
  }
  best.sort((a, b) => a - b);
  const p = p => best[Math.floor(p * (best.length - 1))];
  const dupes = best.filter(x => x >= 0.999).length;
  return { n: best.length, p25: p(0.25), p50: p(0.5), p95: p(0.95), min: best[0], dupes, pct: (100 * dupes / best.length).toFixed(1) };
}

function p50nn(vecs, metric = 'cos') {
  const best = [];
  for (let i = 0; i < vecs.length; i++) {
    let m = metric === 'cos' ? -1 : Infinity;
    for (let j = 0; j < vecs.length; j++) {
      if (i !== j) {
        const s = metric === 'cos' ? cos(vecs[i], vecs[j]) : euc(vecs[i], vecs[j]);
        if (metric === 'cos') { if (s > m) m = s; } else { if (s < m) m = s; }
      }
    }
    best.push(m);
  }
  best.sort((a, b) => a - b);
  const pct = p => best[Math.floor(p * (best.length - 1))];
  return { p25: pct(0.25), p50: pct(0.5), p75: pct(0.75), min: best[0], max: best[best.length - 1] };
}

module.exports = { cos, euc, centroid, stats, p50nn };
