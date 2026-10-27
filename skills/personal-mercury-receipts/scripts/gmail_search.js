// node gmail_search.js <acct-index> <queries.json {key: gmailQuery}> <out.json>
// Runs each Gmail search in a scratch tab of mail/u/<acct> and records {date, from, subject, snippet} per result row.
const fs = require('fs'); const { connect, die } = require('./_cdp');
(async () => {
  const [acct, qfile, out] = process.argv.slice(2);
  const qs = JSON.parse(fs.readFileSync(qfile));
  const { browser, ctx } = await connect();
  const page = await ctx.newPage(); const res = {};
  await page.goto(`https://mail.google.com/mail/u/${acct}/#inbox`); await page.waitForTimeout(5000);
  res._account = await page.evaluate(() => document.title);
  for (const [key, q] of Object.entries(qs)) {
    await page.evaluate(h => { location.hash = h; }, '#search/' + encodeURIComponent(q)); await page.waitForTimeout(3500);
    res[key] = await page.$$eval('div[role=main] tr.zA', els => els.map(e => {
      const d = e.querySelector('td.xW span[title]'); const s = e.querySelector('.yW span[email], .yW span[name]');
      return { date: d ? d.getAttribute('title') : '', from: s ? (s.getAttribute('email') || s.getAttribute('name')) : '',
        subject: (e.querySelector('.y6') || e).innerText.replace(/\s+/g, ' ').slice(0, 140), snippet: (e.querySelector('.y2') || { innerText: '' }).innerText.replace(/\s+/g, ' ').slice(0, 160) };
    }));
  }
  fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log(res._account, '->', out);
  await page.close(); await browser.close().catch(() => {});
})().catch(die);
