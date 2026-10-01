// node gmail_download.js <jobs.json [{key, acct, q, alsoPrint?}]> <outdir>
// Opens the newest result for each query; saves its PDF attachments as <key>__<name>.pdf,
// or prints the message to <key>__email.pdf when there are none. Click the subject (.y6), never the row:
// rows with attachment chips open the attachment viewer instead.
const fs = require('fs'); const path = require('path'); const { connect, die } = require('./_cdp');
(async () => {
  const [jf, outdir] = process.argv.slice(2);
  const jobs = JSON.parse(fs.readFileSync(jf));
  const { browser, ctx } = await connect();
  const page = await ctx.newPage(); const results = [];
  for (const j of jobs) {
    const r = { key: j.key, files: [], note: '' };
    try {
      await page.goto(`https://mail.google.com/mail/u/${j.acct}/#search/${encodeURIComponent(j.q)}`); await page.waitForTimeout(4000);
      const rows = page.locator('div[role=main] tr.zA');
      if (!(await rows.count())) { r.note = 'no results'; results.push(r); console.log(JSON.stringify(r)); continue; }
      await rows.first().locator('.y6').first().click(); await page.waitForSelector('h2.hP', { timeout: 10000 }); await page.waitForTimeout(2500);
      r.subject = await page.locator('h2.hP').first().innerText().catch(() => '');
      const atts = [...new Set(await page.$$eval('span[download_url]', els => els.map(e => e.getAttribute('download_url'))))].filter(a => /^application\/pdf:|\.pdf:/i.test(a));
      for (const a of atts) {
        const m = a.match(/^[^:]+:(.+?):(https:.+)$/);
        const b64 = await page.evaluate(async u => { const b = new Uint8Array(await (await fetch(u, { credentials: 'include' })).arrayBuffer()); let s = ''; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }, m[2]);
        const buf = Buffer.from(b64, 'base64'); if (buf.slice(0, 4).toString() !== '%PDF') { r.note += ` ${m[1]} not pdf;`; continue; }
        const f = path.join(outdir, `${j.key}__${m[1].replace(/[^\w.\-]+/g, '_')}`); fs.writeFileSync(f, buf); r.files.push(f);
      }
      if (!r.files.length || j.alsoPrint) {
        const ik = await page.evaluate(() => (window.GLOBALS || [])[9] || '');
        const h = page.locator('h2.hP').first();
        const th = await h.getAttribute('data-thread-perm-id'); const legacy = await h.getAttribute('data-legacy-thread-id');
        const pp = await ctx.newPage();
        await pp.goto(`https://mail.google.com/mail/u/${j.acct}/?ik=${ik}&view=pt&search=all&permthid=${encodeURIComponent(th || '')}&th=${legacy || ''}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await pp.waitForTimeout(2500);
        const { data } = await (await ctx.newCDPSession(pp)).send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
        const f = path.join(outdir, `${j.key}__email.pdf`); fs.writeFileSync(f, Buffer.from(data, 'base64')); r.files.push(f); await pp.close();
      }
    } catch (e) { r.note += ' ERROR ' + e.message.split('\n')[0]; }
    results.push(r); console.log(JSON.stringify(r));
  }
  await page.close(); await browser.close().catch(() => {});
})().catch(die);
