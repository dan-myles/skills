// node gmail_open_link.js <acct> "<gmail query>" "<link-text regex>"
// Opens the matching link from the newest result (login confirmations, magic links). Never prints the URL.
const { connect, die } = require('./_cdp');
(async () => {
  const [acct, q, re] = process.argv.slice(2);
  const { browser, ctx } = await connect();
  const page = await ctx.newPage();
  await page.goto(`https://mail.google.com/mail/u/${acct}/#search/${encodeURIComponent(q)}`); await page.waitForTimeout(4500);
  await page.locator('div[role=main] tr.zA').first().locator('.y6').click(); await page.waitForTimeout(3500);
  const links = await page.$$eval('div.a3s a', as => as.map(a => ({ t: a.innerText.trim(), h: a.href })));
  const l = links.filter(x => new RegExp(re, 'i').test(x.t)).pop();
  console.log('subject:', await page.locator('h2.hP').first().innerText(), '| link:', l ? l.t : 'NONE');
  if (l) { const p = await ctx.newPage(); await p.goto(l.h); await p.waitForTimeout(5000); console.log('->', (await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))).slice(0, 200)); await p.close(); }
  await page.close(); await browser.close().catch(() => {});
})().catch(die);
