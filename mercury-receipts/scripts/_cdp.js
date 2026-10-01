// Shared helpers: connect to the logged-in agent Chrome over CDP and find tabs.
// Env: CDP_URL (default http://127.0.0.1:9333), PLAYWRIGHT_CORE (path to playwright-core).
const path = require('path');
function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_CORE, 'playwright-core', '/home/paperclip/.npm/_npx/51691537fc71f2b0/node_modules/playwright-core'].filter(Boolean);
  for (const t of tries) { try { return require(t); } catch (e) {} }
  throw new Error('playwright-core not found; set PLAYWRIGHT_CORE');
}
async function connect() {
  const { chromium } = loadPlaywright();
  const browser = await chromium.connectOverCDP(process.env.CDP_URL || 'http://127.0.0.1:9333');
  return { browser, ctx: browser.contexts()[0] };
}
const findTab = (ctx, match) => ctx.pages().filter(p => p.url().includes(match)).pop();
const die = e => { console.error('ERROR:', String(e && e.message || e).split('\n')[0]); process.exit(1); };
module.exports = { connect, findTab, die, path };
