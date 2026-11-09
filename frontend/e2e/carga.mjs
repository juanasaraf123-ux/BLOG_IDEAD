const [url, total = 300, conc = 10] = process.argv.slice(2);
let done = 0, errs = 0; const times = [];
async function worker() { while (done < total) { done++; const t = performance.now(); try { const r = await fetch(url); await r.arrayBuffer(); if (!r.ok) errs++; } catch { errs++; } times.push(performance.now() - t); } }
const t0 = performance.now();
await Promise.all(Array.from({ length: +conc }, worker));
times.sort((a, b) => a - b);
const p = (q) => times[Math.floor(q * (times.length - 1))].toFixed(0);
console.log(`${url.split('/v1/')[1]}: ${times.length} req, ${(times.length / ((performance.now() - t0) / 1000)).toFixed(0)} req/s, p50 ${p(0.5)} ms, p95 ${p(0.95)} ms, errores ${errs}`);
