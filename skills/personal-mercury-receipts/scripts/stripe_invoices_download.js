// node stripe_invoices_download.js <tab-url-substr> <Vendor> <outdir> [dates.json]
// For a tab listing invoices that link to invoice.stripe.com (a Stripe billing portal such as pay.openai.com,
// or a vendor table such as Alpaca's), opens each hosted invoice and saves "Download invoice" + "Download receipt" PDFs
// as YYYY-MM-DD_<Vendor>_<amount>__{invoice,receipt}-<name>.pdf.
// dates.json (optional) maps the row's invoice date (YYYY-MM-DD) to the Mercury task date, and limits downloads to those rows:
// e.g. {"2026-06-30":"2026-07-02"} when a failed charge was retried later.
const fs = require('fs'); const path = require('path'); const { connect, findTab, die } = require('./_cdp');
const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
(async () => {
  const [match, vendor, outdir, df] = process.argv.slice(2);
  const want = df ? JSON.parse(fs.readFileSync(df)) : null;
  const { browser, ctx } = await connect();
  const src = findTab(ctx, match); if (!src) throw new Error('tab not found: ' + match);
  const rows = await src.$$eval('a[href*="invoice.stripe.com"]', as => as.map(a => { const tr = a.closest('tr') || a; return { href: a.href, text: tr.innerText.replace(/\s+/g, ' ') }; }));
  console.log('invoice links:', rows.length);
  for (const r of rows) {
    let d = null; let m;
    if ((m = r.text.match(/([A-Z][a-z]{2})[a-z]* (\d{1,2}), (\d{4})/))) d = iso(m[3], MON[m[1]], m[2]);
    else if ((m = r.text.match(/(\d{2})\/(\d{2})\/(\d{4})/))) d = iso(m[3], m[1], m[2]);
    const am = r.text.match(/\$([\d,]+(?:\.\d\d)?)/);
    if (!d || !am) { console.log('skip (unparsed):', r.text.slice(0, 80)); continue; }
    const task = want ? want[d] : d; if (!task) { console.log('skip', d); continue; }
    const amt = Number(am[1].replace(/,/g, '')).toFixed(2);
    const p = await ctx.newPage(); await p.goto(r.href); await p.waitForTimeout(4000);
    for (const kind of ['invoice', 'receipt']) {
      const re = new RegExp('Download ' + kind, 'i');
      const btn = p.getByRole('button', { name: re }).or(p.getByRole('link', { name: re }));
      if (!(await btn.count())) continue;
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), btn.first().click()]);
      const f = path.join(outdir, `${task}_${vendor}_${amt}__${kind}-${dl.suggestedFilename().replace(/[^\w.\-]+/g, '_')}`);
      await dl.saveAs(f); console.log('saved', f);
    }
    await p.close();
  }
  await browser.close().catch(() => {});
})().catch(die);
