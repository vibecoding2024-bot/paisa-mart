const { chromium } = require('C:/Users/Swetha Anusha/Pictures/CHAITANYA/paisa mart/paisa-mart/.dash/.preview/browser-tools/node_modules/playwright-core');
const base = 'http://127.0.0.1:3911', out = process.argv[2], PW = process.env.LOCAL_STAFF_PASSWORD; // same random staff password as the verification run
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  for (const [w, h, tag] of [[1440, 1000, 'desktop'], [390, 844, 'phone']]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    await context.route('**/*', r => r.request().url().startsWith(base) ? r.continue() : r.abort());
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    await page.goto(base + '/admin');
    await page.getByPlaceholder('admin@paisamart.com').fill('ops1@example.test');
    await page.getByPlaceholder('Enter password', { exact: true }).fill(PW);
    await page.getByText('Sign In', { exact: true }).last().click();
    await page.getByText('Refresh data', { exact: true }).first().waitFor();
    const leads = page.getByText('Leads', { exact: true }).first();
    await leads.evaluate(el => el.scrollIntoView({ inline: 'center' })); await leads.click();
    await page.getByText('Business D', { exact: true }).first().click();
    await page.getByText('Change Stage', { exact: true }).first().click();
    await page.getByText('Update Stage', { exact: true }).waitFor();
    await page.getByText('Payout', { exact: true }).last().scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: out + '/A-change-stage-modal-' + tag + '.png' });
    await context.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
