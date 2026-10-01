// node tab.js <tab-url-substr> '<async JS body using page, ctx, require>' [noshot]   (or @file.js for the body)
// Runs code against an existing tab (opens a blank one if none matches), prints the return value, URL, page text,
// and saves /tmp/tab.png unless "noshot". Write multi-line bodies to a file and pass @file to avoid shell quoting.
const fs = require('fs'); const { connect, findTab, die } = require('./_cdp');
(async () => {
  let [match, code, noshot] = process.argv.slice(2);
  if (code.startsWith('@')) code = fs.readFileSync(code.slice(1), 'utf8');
  const { browser, ctx } = await connect();
  const page = findTab(ctx, match) || await ctx.newPage();
  await page.bringToFront();
  const out = await new Function('page', 'ctx', 'require', 'return (async () => {' + code + '})()')(page, ctx, require);
  if (out !== undefined) console.log('RET:', typeof out === 'string' ? out : JSON.stringify(out));
  console.log('URL:', page.url().slice(0, 160));
  console.log((await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ')).catch(() => '')).slice(0, 700));
  if (!noshot) await page.screenshot({ path: '/tmp/tab.png' }).catch(() => {});
  await browser.close().catch(() => {});
})().catch(die);
