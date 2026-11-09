const { chromium } = require('playwright');
(async () => {
  const [,, email, pages, shotPrefix] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) errs.push(`${r.status()} ${r.url().replace('http://localhost:5173','')}`); });
  await p.goto((process.env.BASE_URL || 'http://localhost:5173') + '/admin/login');
  await p.fill('input[type=email]', email);
  await p.fill('input[type=password]', (process.env.DEMO_PASSWORD || 'Demo-IDEAD-2026!'));
  await p.click('button[type=submit]');
  await p.waitForSelector('text=Hola', { timeout: 15000 });
  let i = 0;
  for (const path of pages.split(',')) {
    await p.goto((process.env.BASE_URL || 'http://localhost:5173') + '/admin' + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    if (shotPrefix) await p.screenshot({ path: `${shotPrefix}${i++}.png` });
  }
  console.log(email, 'errors:', JSON.stringify(errs));
  await b.close();
})();
