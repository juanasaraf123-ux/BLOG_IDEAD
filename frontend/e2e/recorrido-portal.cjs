const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  p.on('pageerror', e => errs.push(`${p.url()} PAGEERROR ${e.message}`));
  p.on('console', m => m.type() === 'error' && errs.push(`${p.url()} CONSOLE ${m.text().slice(0,150)}`));
  p.on('response', r => { if (r.url().includes('/api/') && r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
  const mods = ['oferta-academica','estudiantes','permanencia','docentes','graduados','personal-administrativo','cat','bienestar','investigacion','extension','gestion-financiera','proyectos','calidad'];
  const paths = ['/', '/cat', '/cat/cat-ibague', '/programas', '/programas/administracion-financiera', '/noticias', '/noticias/ideAD-x', '/actividades', '/actividades/semana-del-idead', '/multimedia', '/proyectos', '/proyectos/dotacion-de-salas-de-computo', '/transparencia', '/sobre-idead', '/pagina/privacidad', '/buscar?q=cat', '/mapa-del-sitio', '/estadisticas', ...mods.map(m => '/estadisticas/' + m), '/estadisticas/estudiantes?cat=1&year=2025'];
  const empty = [];
  for (const path of paths) {
    await p.goto((process.env.BASE_URL || 'http://localhost:5173') + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    const txt = await p.locator('main').innerText();
    if (path.startsWith('/estadisticas/')) {
      const pend = (txt.match(/Información pendiente de actualización/g) || []).length;
      empty.push(`${path}: pendientes=${pend}`);
    }
  }
  console.log(errs.join('\n') || 'no errors');
  console.log(empty.join('\n'));
  await b.close();
})();
