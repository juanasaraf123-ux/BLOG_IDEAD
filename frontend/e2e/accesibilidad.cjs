const { chromium, devices } = require('playwright');
const axeSrc = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  for (const path of ['/', '/estadisticas/estudiantes', '/cat/cat-ibague', '/noticias', '/transparencia', '/admin/login']) {
    await p.goto((process.env.BASE_URL || 'http://localhost:5173') + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(800);
    await p.addScriptTag({ content: axeSrc });
    const r = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map(v => `${v.impact} ${v.id} (${v.nodes.length}): ${v.nodes.slice(0,2).map(n => n.target.join(' ')).join(' | ')}`));
    console.log(path, r.length ? '\n  ' + r.join('\n  ') : 'OK');
  }
  const m = await b.newPage({ ...devices['iPhone 13'] });
  await m.goto((process.env.BASE_URL || 'http://localhost:5173') + '/', { waitUntil: 'networkidle' }); await m.waitForTimeout(800);
  await m.screenshot({ path: 'mobile_home.png', fullPage: true });
  await m.goto((process.env.BASE_URL || 'http://localhost:5173') + '/estadisticas/docentes', { waitUntil: 'networkidle' }); await m.waitForTimeout(800);
  await m.screenshot({ path: 'mobile_mod.png' });
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log('mobile horizontal overflow:', overflow);
  await b.close();
})();
