// node mercury_tasks.js > tasks.json
// Reads the open "Upload receipt" tasks from app.mercury.com/tasks: [{vendor, amount, date:"Mon D", desc}]
const { connect, findTab, die } = require('./_cdp');
(async () => {
  const { browser, ctx } = await connect();
  const page = findTab(ctx, 'app.mercury.com') || await ctx.newPage();
  await page.goto('https://app.mercury.com/tasks'); await page.waitForFunction(() => [...document.querySelectorAll('table tr')].some(tr => /Upload receipt/.test(tr.innerText)) || /No pending tasks|no (incomplete )?tasks|all caught up/i.test(document.body.innerText), null, { timeout: 30000 }); await page.waitForTimeout(1000);
  const rows = await page.$$eval('table tr', trs => trs.slice(1).map(tr => {
    const c = [...tr.children].map(x => x.innerText.trim());
    const m = (c[0] || '').match(/at (.+) for \$([\d,.]+)/);
    return m ? { vendor: m[1], amount: m[2].replace(/,/g, ''), date: c[2], desc: c[0] } : null;
  }).filter(Boolean));
  process.stdout.write(JSON.stringify(rows, null, 1));
  await browser.close().catch(() => {});
})().catch(die);
