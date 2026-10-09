import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 412, height: 915 },
  locale: 'cs-CZ',
});
const page = await context.newPage();
page.on('console', msg => console.log('[browser]', msg.type(), msg.text()));
page.on('pageerror', err => console.log('[pageerror]', err.message));

await page.goto('https://dartscore-pro.vercel.app/', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(2500);

console.log('URL', page.url());
console.log('TITLE', await page.title());
console.log('BODY_TEXT_START');
console.log((await page.locator('body').innerText()).slice(0, 12000));
console.log('BODY_TEXT_END');

const buttons = await page.locator('button').evaluateAll(els => els.map((e,i)=>({
  i,
  text:(e.innerText||'').trim(),
  disabled:e.disabled,
  aria:e.getAttribute('aria-label'),
  title:e.getAttribute('title'),
  className:e.className,
})));
console.log('BUTTONS', JSON.stringify(buttons, null, 2));

const selects = await page.locator('select').evaluateAll(els => els.map((e,i)=>({
  i,
  value:e.value,
  aria:e.getAttribute('aria-label'),
  name:e.getAttribute('name'),
  options:[...e.options].map(o=>({text:o.text,value:o.value,selected:o.selected})),
})));
console.log('SELECTS', JSON.stringify(selects, null, 2));

const inputs = await page.locator('input').evaluateAll(els => els.map((e,i)=>({
  i,
  type:e.type,
  value:e.value,
  placeholder:e.placeholder,
  aria:e.getAttribute('aria-label'),
  name:e.name,
  checked:e.checked,
})));
console.log('INPUTS', JSON.stringify(inputs, null, 2));

await page.screenshot({ path: 'qa-discovery.png', fullPage: true });
await browser.close();
