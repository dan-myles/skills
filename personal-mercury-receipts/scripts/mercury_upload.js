// node mercury_upload.js <jobs.json [{desc:"at Vendor for $12.34", date:"Mon D", file:"/abs/path.pdf"}]>
// For each job: open app.mercury.com/tasks, click the task row whose description contains desc and whose Received
// column equals date, set the file on the side panel's upload input, and wait for the filename to appear.
const fs = require('fs'); const { connect, findTab, die } = require('./_cdp');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(process.argv[2]));
  const { browser, ctx } = await connect();
  const page = findTab(ctx, 'app.mercury.com') || await ctx.newPage();
  await page.bringToFront();
  for (const j of jobs) {
    let status = '';
    try {
      await page.goto('https://app.mercury.com/tasks'); await page.waitForFunction(() => [...document.querySelectorAll('table tr')].some(tr => /Upload receipt/.test(tr.innerText)), null, { timeout: 30000 }); await page.waitForTimeout(1000);
      const idx = await page.$$eval('table tr', (trs, j) => trs.findIndex(tr => { const c = [...tr.children].map(x => x.innerText.trim()); return c[0] && c[0].includes(j.desc) && c[2] === j.date; }), j);
      if (idx < 0) throw new Error('TASK NOT FOUND');
      await page.locator('table tr').nth(idx).click(); await page.waitForTimeout(3500);
      const zone = page.getByText('Drag and drop here or click to upload').first(); await zone.waitFor({ timeout: 15000 });
      const inp = (await zone.evaluateHandle(el => { for (let n = el, i = 0; n && i < 8; n = n.parentElement, i++) { const f = n.querySelector && n.querySelector('input[type=file]'); if (f) return f; } return null; })).asElement();
      if (!inp) throw new Error('NO INPUT');
      await inp.setInputFiles(j.file);
      await page.getByText(j.file.split('/').pop()).first().waitFor({ timeout: 30000 }); await page.waitForTimeout(2500);
      status = (await page.evaluate(() => document.body.innerText)).includes('Receipt required') ? 'UPLOADED? (still "Receipt required")' : 'UPLOADED';
    } catch (e) { status = 'FAILED ' + e.message.split('\n')[0]; }
    console.log(`${status} | ${j.date} ${j.desc} | ${j.file.split('/').pop()}`);
  }
  await browser.close().catch(() => {});
})().catch(die);
