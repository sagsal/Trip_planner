// Phone screenshots of the public pages (iPhone-sized, 390 x 844). Prints layout warnings too.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const SITE = 'https://tripshare.org';

(async () => {
  fs.mkdirSync('out', { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  page.on('response', (r) => {
    const u = r.url();
    if (r.status() >= 400 || /\.css(\?|$)/.test(u)) console.log(`  ${r.status()} ${u.replace(SITE, '').slice(0, 120)}`);
  });
  page.on('requestfailed', (r) => console.log(`  FAILED ${r.url().replace(SITE, '').slice(0, 120)} ${r.failure()?.errorText || ''}`));

  // A public trip to look at: one single-city and one multi-city if there are any
  const list = await (await fetch(`${SITE}/api/trips?public=true&limit=24`)).json();
  const trips = list.trips || [];
  const multi = trips.find((t) => (t.cities_data || []).length > 1);
  const single = trips.find((t) => (t.cities_data || []).length === 1);
  const pages = [
    ['home', '/'],
    ['browse', '/trips'],
    ...(single ? [['trip-single', `/trips/${single.id}`]] : []),
    ...(multi ? [['trip-multi', `/trips/${multi.id}`]] : []),
    ['about', '/about'],
    ['how-to', '/how-to'],
    ['login', '/login'],
    ['register', '/register'],
  ];

  for (const [name, path] of pages) {
    await page.goto(SITE + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
    // Anything wider than the screen (causes sideways scrolling)?
    const wide = await page.evaluate(() => {
      const W = document.documentElement.clientWidth;
      const out = [];
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > W + 2 && getComputedStyle(el).position !== 'fixed') {
          out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className).split(' ').slice(0, 3).join('.')} right=${Math.round(r.right)}`);
        }
      });
      return { W, scrollW: document.documentElement.scrollWidth, items: out.slice(0, 8) };
    });
    console.log(`${name}: screen ${wide.W}px, page ${wide.scrollW}px${wide.items.length ? ' — too wide: ' + wide.items.join(' | ') : ''}`);
    await page.screenshot({ path: `out/${name}.jpg`, type: 'jpeg', quality: 60, fullPage: true });
    if (name === 'home') {
      await page.screenshot({ path: `out/${name}-top.jpg`, type: 'jpeg', quality: 70 });
      // Open the Menu
      const menu = page.locator('[data-tour="menu"]');
      if (await menu.count()) {
        await menu.first().click().catch(() => {});
        await page.waitForTimeout(600);
        await page.screenshot({ path: `out/menu-open.jpg`, type: 'jpeg', quality: 70 });
        await page.keyboard.press('Escape').catch(() => {});
      }
    }
  }
  // Signed-in pages, with a temporary account (removed by scripts/cleanup-test-users.js on the next deploy)
  try {
    const email = `screenshot-bot-${Date.now()}@example.invalid`;
    const reg = await (await fetch(`${SITE}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Screenshot Bot', email, password: 'Screens-' + Math.random().toString(36).slice(2) + '9!' }),
    })).json();
    const user = reg.user;
    if (!user?.id) throw new Error('could not make a test account');
    await fetch(`${SITE}/api/sandbox`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, title: 'Greece 2027', region: 'Europe' }) });
    await page.goto(SITE + '/', { waitUntil: 'domcontentloaded' });
    await page.evaluate((u) => localStorage.setItem('user', JSON.stringify(u)), user);
    for (const [name, path] of [['account', '/account'], ['new-trip', '/trips/new'], ['sandbox', '/sandbox'], ['import', '/trips/import']]) {
      await page.goto(SITE + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(2000);
      const W = await page.evaluate(() => [document.documentElement.clientWidth, document.documentElement.scrollWidth]);
      console.log(`${name}: screen ${W[0]}px, page ${W[1]}px`);
      await page.screenshot({ path: `out/${name}.jpg`, type: 'jpeg', quality: 60, fullPage: true });
    }
    // The add-trip form with a country and city filled in, if the controls are there
    await page.goto(SITE + '/trips/new', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const countrySel = page.locator('select').filter({ hasText: 'Select a country' }).first();
    if (await countrySel.count()) {
      await countrySel.selectOption({ label: 'Greece' }).catch(() => {});
      await page.waitForTimeout(800);
    }
    await page.selectOption('#trip-month', '03').catch(() => {});
    await page.selectOption('#trip-year', '2022').catch(() => {});
    await page.fill('#trip-days', '7').catch(() => {});
    await page.locator('#trip-days').scrollIntoViewIfNeeded().catch(() => {});
    await page.screenshot({ path: `out/new-trip-when.jpg`, type: 'jpeg', quality: 70 });
    const anyCountry = page.locator('select').filter({ hasText: 'Choose a country' }).first();
    if (await anyCountry.count()) {
      await anyCountry.selectOption({ label: 'Canada' }).catch(() => {});
      await page.waitForTimeout(800);
      await page.selectOption('#state-Canada', 'Newfoundland and Labrador').catch(() => {});
      await page.waitForTimeout(400);
      await page.locator('#state-Canada').scrollIntoViewIfNeeded().catch(() => {});
      await page.screenshot({ path: `out/new-trip-province.jpg`, type: 'jpeg', quality: 70 });
      const opts = await page.locator('#state-Canada').locator('xpath=ancestor::div[2]').locator('select').nth(1).locator('option').allTextContents().catch(() => []);
      console.log('city list for Newfoundland:', opts.slice(0, 8).join(' | '));
      await page.selectOption('#trip-area-Canada', 'Canadian Rockies').catch(() => {});
      await page.waitForTimeout(600);
      const opts2 = await page.locator('#state-Canada').locator('xpath=ancestor::div[2]').locator('select').nth(1).locator('option').allTextContents().catch(() => []);
      console.log('city list with Canadian Rockies chosen:', opts2.slice(0, 8).join(' | '));
      console.log('title hint:', (await page.locator('text=Your trip will be listed as').first().textContent().catch(() => '')) || '');
      await page.locator('[data-tour="trip-info"]').scrollIntoViewIfNeeded().catch(() => {});
      await page.screenshot({ path: `out/new-trip-info.jpg`, type: 'jpeg', quality: 70, fullPage: true });
      await page.screenshot({ path: `out/new-trip-area.jpg`, type: 'jpeg', quality: 70 });
    }
    await page.screenshot({ path: `out/new-trip-filled.jpg`, type: 'jpeg', quality: 60, fullPage: true });

    // Two stays in one city (rentals need no Google search)
    try {
      await page.goto(SITE + '/trips/new', { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1200);
      await page.locator('select').filter({ hasText: 'Choose a country' }).first().selectOption({ label: 'Canada' });
      await page.waitForTimeout(600);
      const row = page.locator('#state-Canada').locator('xpath=ancestor::div[2]');
      await row.locator('select').nth(1).selectOption({ label: 'Toronto' }).catch(async () => {
        await row.locator('select').nth(1).selectOption({ index: 2 });
      });
      await row.locator('select').nth(2).selectOption('2');
      console.log('step: city chosen =', await row.locator('select').nth(1).inputValue(), 'days =', await row.locator('select').nth(2).inputValue());
      await page.getByRole('button', { name: '+ Add city' }).click({ timeout: 8000 });
      console.log('step: city added');
      await page.waitForTimeout(800);
      for (const name of ['Test rental one', 'Test rental two']) {
        const add = page.getByRole('button', { name: /Add (another )?hotel or rental/ }).first();
        await add.click({ timeout: 8000 });
        console.log('step: add stay opened');
        await page.waitForTimeout(300);
        await page.getByRole('button', { name: /Rental \(Airbnb/ }).first().click({ timeout: 8000 });
        console.log('step: rental tab');
        const ph = await page.locator('input[placeholder]').evaluateAll((els) => els.map((e) => e.getAttribute('placeholder')).filter((x) => /rental|name|Airbnb/i.test(x || '')));
        console.log('step: placeholders', ph.slice(0, 4).join(' | '));
        await page.getByPlaceholder(/name/i).first().fill(name).catch(() => {});
        await page.getByRole('button', { name: 'Save', exact: true }).first().click({ timeout: 8000 });
        console.log('step: saved', name);
        await page.waitForTimeout(500);
      }
      const stays = await page.locator('text=/^Stay [0-9]$/').count();
      const names = await page.locator('input[value^="Test rental"]').count();
      console.log(`two stays test: ${stays} stay labels, ${names} stays with names`);
      await page.locator('text=Where we stayed').first().scrollIntoViewIfNeeded().catch(() => {});
      await page.screenshot({ path: `out/two-stays.jpg`, type: 'jpeg', quality: 70 });
    } catch (e) {
      console.log('two stays test failed:', e.message.split('\n')[0]);
      await page.screenshot({ path: `out/two-stays-failed.jpg`, type: 'jpeg', quality: 70 }).catch(() => {});
    }
  } catch (e) {
    console.log('signed-in screenshots skipped:', e.message);
  }

  await browser.close();
})();
